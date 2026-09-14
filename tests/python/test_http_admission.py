import asyncio
import importlib.util
import json
from pathlib import Path
import sys
import time
import types
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("http_admission", ROOT / "device_service/ucsb_xrp_service/http_admission.py")
transport = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(transport)


def pinned_server():
    fake_asyncio = types.ModuleType("uasyncio")
    fake_asyncio.get_event_loop = lambda: None
    fake_logging = types.ModuleType("phew.logging")
    fake_logging.error = lambda *_: None
    package = types.ModuleType("phew")
    package.__path__ = []
    package.logging = fake_logging
    spec = importlib.util.spec_from_file_location("phew.server", ROOT / "vendor/current/xrplib/phew/server.py")
    server = importlib.util.module_from_spec(spec)
    with patch.dict(sys.modules, {"uasyncio": fake_asyncio, "phew": package, "phew.logging": fake_logging}):
        spec.loader.exec_module(server)
    return server


class HttpAdmissionTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.registry = pinned_server()
        self.dispatched = []

        def status(request):
            self.dispatched.append((request.path, request.data))
            return self.registry.Response(b'{"ok":true}', headers={"Content-Type": "application/json"})

        self.registry.add_route("/api/v1/info", status)
        self.registry.add_route("/api/v1/stop", status, ["POST"])
        self.registry.add_route("/api/v1/run", status, ["POST"])
        self.registry.set_callback(status)
        # Scaled deadlines keep faults deterministic and quick; production
        # deadline values are verified independently below.
        self.admission = transport.Admission(self.registry, lambda awaitable, ms: asyncio.wait_for(awaitable, min(ms / 1000, .12)))
        self.listener = await asyncio.start_server(self.admission.handle, "127.0.0.1", 0)
        self.port = self.listener.sockets[0].getsockname()[1]
        self.clients = []

    async def asyncTearDown(self):
        for writer in self.clients:
            writer.close()
            await writer.wait_closed()
        await asyncio.sleep(.15)
        self.listener.close()
        await self.listener.wait_closed()
        self.assertEqual(self.admission.connections, 0)
        self.assertEqual(self.admission.body_readers, 0)

    async def exchange(self, data, eof=False):
        reader, writer = await asyncio.open_connection("127.0.0.1", self.port)
        self.clients.append(writer)
        writer.write(data)
        await writer.drain()
        if eof:
            writer.write_eof()
        return await asyncio.wait_for(reader.read(), 1)

    async def test_fragmented_json_and_keep_alive_use_real_route_registry(self):
        reader, writer = await asyncio.open_connection("127.0.0.1", self.port)
        self.clients.append(writer)
        first = b'POST /api/v1/stop HTTP/1.1\r\nContent-Type: application/json\r\nContent-Length: 2\r\n\r\n{}'
        second = b'GET /api/v1/info HTTP/1.1\r\nConnection: close\r\n\r\n'
        for offset in range(0, len(first + second), 7):
            writer.write((first + second)[offset:offset + 7])
            await writer.drain()
        response = await asyncio.wait_for(reader.read(), 1)
        self.assertEqual(response.count(b'HTTP/1.1 200'), 2)
        self.assertEqual([row[0] for row in self.dispatched], ['/api/v1/stop', '/api/v1/info'])

    async def test_oversize_rejected_without_reading_body_or_dispatch(self):
        response = await self.exchange(b'POST /api/v1/run HTTP/1.1\r\nContent-Type: application/json\r\nContent-Length: 1048576\r\n\r\n')
        self.assertIn(b' 413 ', response)
        self.assertEqual(self.dispatched, [])

    async def test_truncated_malformed_and_slow_requests_release_connections(self):
        for request in (
            b'GET /api/v1/info HTTP/1.1\r\nX',
            b'POST /api/v1/run HTTP/1.1\r\nContent-Length: 20\r\nContent-Type: application/json\r\n\r\n{}',
            b'POST /api/v1/run HTTP/1.1\r\nContent-Length: -1\r\n\r\n',
            b'POST /api/v1/run HTTP/1.1\r\nContent-Length: 2\r\nContent-Type: application/json\r\n\r\n{x',
        ):
            response = await self.exchange(request, eof=True)
            self.assertIn(b' 400 ', response)
        response = await self.exchange(b'GET /api/v1/info HTTP/1.1\r\nX-Partial:')
        self.assertIn(b' 408 ', response)
        self.assertEqual(self.dispatched, [])

    async def test_pending_project_body_does_not_reserve_stop_or_health(self):
        _reader, writer = await asyncio.open_connection("127.0.0.1", self.port)
        self.clients.append(writer)
        writer.write(b'POST /api/v1/run HTTP/1.1\r\nContent-Length: 3000\r\nContent-Type: application/json\r\n\r\n{')
        await writer.drain()
        await asyncio.sleep(.01)
        self.assertEqual(self.admission.body_readers, 1)
        for value in (
            b'GET /api/v1/info HTTP/1.1\r\nConnection: close\r\n\r\n',
            b'POST /api/v1/stop HTTP/1.1\r\nContent-Length: 2\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n{}',
        ):
            self.assertIn(b' 200 ', await self.exchange(value))

    async def test_header_and_file_count_limits(self):
        response = await self.exchange(b'GET /api/v1/info HTTP/1.1\r\nX: ' + b'x' * 1100 + b'\r\n\r\n')
        self.assertIn(b' 431 ', response)
        body = json.dumps({'project': {'files': {str(i): '' for i in range(49)}}}).encode()
        response = await self.exchange(b'POST /api/v1/run HTTP/1.1\r\nContent-Type: application/json\r\nContent-Length: ' + str(len(body)).encode() + b'\r\n\r\n' + body)
        self.assertIn(b' 413 ', response)
        self.assertEqual(self.dispatched, [])

    async def test_predecode_shape_limits_preserve_code_strings(self):
        for body in (
            b'{"project":{"files":{' + b','.join((b'"' + str(i).encode() + b'":""') for i in range(49)) + b'}}}',
            b'{"project":{"files":{"main.py":' + b'[' * 20 + b'0' + b']' * 20 + b'}}}',
        ):
            with patch.object(transport.json, "loads", wraps=json.loads) as decoder:
                response = await self.exchange(b'POST /api/v1/run HTTP/1.1\r\nContent-Type: application/json\r\nContent-Length: ' + str(len(body)).encode() + b'\r\n\r\n' + body)
                self.assertIn(b' 413 ', response)
                self.assertFalse(any(call.args[0] == body.decode() for call in decoder.call_args_list))
        body = json.dumps({"project": {"files": {"main.py": 'text = "[{},]"\n# brackets are source text'}}}).encode()
        response = await self.exchange(b'POST /api/v1/run HTTP/1.1\r\nConnection: close\r\nContent-Type: application/json\r\nContent-Length: ' + str(len(body)).encode() + b'\r\n\r\n' + body)
        self.assertIn(b' 200 ', response)

    async def test_connection_count_is_bounded_and_abandoned_clients_expire(self):
        for _ in range(transport.MAX_CONNECTIONS):
            _reader, writer = await asyncio.open_connection("127.0.0.1", self.port)
            self.clients.append(writer)
        response = await self.exchange(b'GET /api/v1/info HTTP/1.1\r\nConnection: close\r\n\r\n')
        self.assertIn(b' 503 ', response)
        await asyncio.sleep(.2)
        self.assertIn(b' 200 ', await self.exchange(b'GET /api/v1/info HTTP/1.1\r\nConnection: close\r\n\r\n'))

    async def test_stalled_response_writer_has_a_deadline(self):
        class Writer:
            closed = False
            def write(self, _value): pass
            async def drain(self): await asyncio.sleep(10)
            def close(self): self.closed = True
            async def wait_closed(self): pass
        writer = Writer()
        reader = asyncio.StreamReader()
        reader.feed_data(b'GET /api/v1/info HTTP/1.1\r\nConnection: close\r\n\r\n')
        start = time.monotonic()
        await asyncio.wait_for(self.admission.handle(reader, writer), .5)
        self.assertTrue(writer.closed)
        self.assertLess(time.monotonic() - start, .5)

    async def test_production_header_timeout_keeps_health_responsive(self):
        admission = transport.Admission(self.registry, lambda awaitable, ms: asyncio.wait_for(awaitable, ms / 1000))
        listener = await asyncio.start_server(admission.handle, "127.0.0.1", 0)
        port = listener.sockets[0].getsockname()[1]
        reader, writer = await asyncio.open_connection("127.0.0.1", port)
        started = time.monotonic()
        writer.write(b'GET /api/v1/info HTTP/1.1\r\nIncomplete:')
        await writer.drain()
        health, health_writer = await asyncio.open_connection("127.0.0.1", port)
        health_writer.write(b'GET /api/v1/info HTTP/1.1\r\nConnection: close\r\n\r\n')
        await health_writer.drain()
        self.assertIn(b' 200 ', await asyncio.wait_for(health.read(), .5))
        self.assertIn(b' 408 ', await asyncio.wait_for(reader.read(), 2))
        elapsed = time.monotonic() - started
        self.assertGreaterEqual(elapsed, 1.4)
        self.assertLess(elapsed, 2.2)
        writer.close()
        health_writer.close()
        await writer.wait_closed()
        await health_writer.wait_closed()
        listener.close()
        await listener.wait_closed()


if __name__ == '__main__':
    unittest.main()
