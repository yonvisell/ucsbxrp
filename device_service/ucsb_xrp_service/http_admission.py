"""Bounded course HTTP transport installed around the pinned Phew routes.

Phew remains the route/response registry. This module owns socket admission and
parsing limits without modifying the vendored library. All responses have an
explicit byte boundary; no file or generator endpoint is admitted.
"""

import json
try:
    from uasyncio import TimeoutError
except ImportError:
    from asyncio import TimeoutError

MAX_REQUEST_BODY_BYTES = 131072
MAX_CONNECTIONS = 8
MAX_BODY_READERS = 1
MAX_HEADER_BYTES = 4096
MAX_HEADERS = 24
MAX_LINE_BYTES = 1024
READ_TIMEOUT_MS = 1500
BODY_TIMEOUT_MS = 5000
WRITE_TIMEOUT_MS = 1500
IDLE_TIMEOUT_MS = 1000
MAX_REQUESTS_PER_CONNECTION = 200
MAX_JSON_DEPTH = 16
MAX_JSON_TOKENS = 1024


class HttpError(Exception):
    def __init__(self, status, code, detail):
        self.status = status
        self.code = code
        self.detail = detail


def check_json_shape(body):
    """Bound decoder nesting and project keys without materializing values.

    This is an admission scan, not a second JSON decoder. The standard decoder
    still checks syntax. Only bounded object keys are decoded here; Python
    source strings are skipped without copying or interpreting their content.
    """
    stack = []
    index = 0
    tokens = 0
    while index < len(body):
        byte = body[index]
        if byte == 34:  # string
            start = index
            index += 1
            while index < len(body):
                if body[index] == 92:
                    index += 2
                    continue
                if body[index] == 34:
                    break
                index += 1
            if index >= len(body):
                raise HttpError(400, "invalid_json", "A JSON string ended early")
            if stack and stack[-1][0] == 123 and stack[-1][2]:
                frame = stack[-1]
                frame[1] += 1
                if frame[4] == ("project", "files") and frame[1] > 48:
                    raise HttpError(413, "project_too_large", "The project contains more than 48 files")
                # Long keys cannot be project/files; avoid allocating them.
                frame[3] = json.loads(bytes(body[start:index + 1])) if index - start <= 64 else None
                frame[2] = False
            tokens += 1
        elif byte in (123, 91):  # object or array
            path = ()
            if stack:
                parent = stack[-1]
                path = parent[4] + (parent[3] if parent[0] == 123 else None,)
            stack.append([byte, 0, byte == 123, None, path])
            if len(stack) > MAX_JSON_DEPTH:
                raise HttpError(413, "request_too_complex", "JSON nesting exceeds the course limit")
            tokens += 1
        elif byte in (125, 93):
            if stack:
                stack.pop()
        elif byte == 44:
            if stack and stack[-1][0] == 123:
                stack[-1][2] = True
            tokens += 1
        if tokens > MAX_JSON_TOKENS:
            raise HttpError(413, "request_too_complex", "The request contains too many JSON fields")
        index += 1


class Admission:
    def __init__(self, server, wait_for=None):
        self.server = server
        self.connections = 0
        self.body_readers = 0
        if wait_for is None:
            import uasyncio
            wait_for = uasyncio.wait_for_ms
        self.wait_for = wait_for

    async def line(self, reader, limit=MAX_LINE_BYTES):
        value = bytearray()
        while len(value) <= limit:
            byte = await reader.read(1)
            if not byte:
                if not value:
                    return None
                raise HttpError(400, "incomplete_request", "The HTTP line ended early")
            value.extend(byte)
            if byte == b"\n":
                if not value.endswith(b"\r\n"):
                    raise HttpError(400, "invalid_request", "HTTP lines require CRLF")
                return bytes(value[:-2])
        raise HttpError(431, "headers_too_large", "The HTTP request line is too long")

    async def read_headers(self, reader):
        headers = {}
        total = 0
        for _ in range(MAX_HEADERS + 1):
            line = await self.line(reader)
            if line is None:
                raise HttpError(400, "incomplete_request", "HTTP headers ended early")
            total += len(line) + 2
            if total > MAX_HEADER_BYTES:
                raise HttpError(431, "headers_too_large", "HTTP headers exceed the course limit")
            if not line:
                return headers
            try:
                name, value = line.decode("ascii").split(":", 1)
            except (ValueError, UnicodeError):
                raise HttpError(400, "invalid_request", "An HTTP header is malformed")
            name = name.strip().lower()
            if not name or name in headers:
                raise HttpError(400, "invalid_request", "Duplicate or empty HTTP header")
            headers[name] = value.strip()
        raise HttpError(431, "headers_too_large", "Too many HTTP headers")

    async def read_body(self, reader, count):
        body = bytearray()
        while len(body) < count:
            chunk = await reader.read(min(1024, count - len(body)))
            if not chunk:
                raise HttpError(400, "incomplete_request", "The project transfer ended early")
            body.extend(chunk)
        check_json_shape(body)
        try:
            result = json.loads(body.decode("utf-8"))
        except (ValueError, UnicodeError):
            raise HttpError(400, "invalid_json", "The request is not valid JSON")
        if not isinstance(result, dict):
            raise HttpError(400, "invalid_json", "The request must be a JSON object")
        # Enforce envelope complexity before dispatch and secondary compilation
        # allocations. The transport byte cap bounds the initial decoder heap.
        project = result.get("project")
        if isinstance(project, dict):
            files = project.get("files")
            if isinstance(files, dict) and len(files) > 48:
                raise HttpError(413, "project_too_large", "The project contains more than 48 files")
        return result

    async def parse(self, reader, idle=False):
        line = await self.wait_for(self.line(reader), IDLE_TIMEOUT_MS if idle else READ_TIMEOUT_MS)
        if line is None:
            return None
        try:
            method, uri, protocol = line.decode("ascii").split()
        except (ValueError, UnicodeError):
            raise HttpError(400, "invalid_request", "The HTTP request line is malformed")
        if protocol not in ("HTTP/1.0", "HTTP/1.1") or method not in ("GET", "POST", "OPTIONS"):
            raise HttpError(405, "unsupported_request", "Use a supported course HTTP operation")
        headers = await self.wait_for(self.read_headers(reader), READ_TIMEOUT_MS)
        if "transfer-encoding" in headers:
            raise HttpError(400, "unsupported_encoding", "Chunked requests are not supported")
        raw_length = headers.get("content-length", "0")
        if not raw_length.isdigit() or len(raw_length) > 7:
            raise HttpError(400, "invalid_length", "Content-Length must be a bounded nonnegative integer")
        count = int(raw_length)
        if count > MAX_REQUEST_BODY_BYTES:
            raise HttpError(413, "project_too_large", "The encoded request exceeds 128 KiB; remove large project files")
        if count and (method != "POST" or headers.get("content-type", "").split(";", 1)[0].strip().lower() != "application/json"):
            raise HttpError(415, "unsupported_content", "Course requests use application/json")
        try:
            request = self.server.Request(method, uri, protocol)
        except (ValueError, UnicodeError):
            raise HttpError(400, "invalid_request", "The request address is malformed")
        request.headers = headers
        if count:
            transfer = count > 2048
            if transfer and self.body_readers >= MAX_BODY_READERS:
                raise HttpError(503, "transfer_busy", "Another project transfer is in progress; retry shortly")
            if transfer:
                self.body_readers += 1
            try:
                request.data = await self.wait_for(self.read_body(reader, count), BODY_TIMEOUT_MS if transfer else READ_TIMEOUT_MS)
            finally:
                if transfer:
                    self.body_readers -= 1
        return request

    async def send(self, writer, response, keep_alive=False):
        body = response.body
        if isinstance(body, str):
            body = body.encode("utf-8")
        if not isinstance(body, (bytes, bytearray)):
            raise HttpError(500, "unsupported_response", "The course service returned an invalid response")
        headers = {key: value for key, value in response.headers.items() if key.lower() not in ("content-length", "connection")}
        headers["Content-Length"] = len(body)
        headers["Connection"] = "keep-alive" if keep_alive else "close"
        status = response.status
        message = self.server.status_message_map.get(status, "Error")
        writer.write("HTTP/1.1 {} {}\r\n".format(status, message).encode("ascii"))
        for name, value in headers.items():
            writer.write("{}: {}\r\n".format(name, value).encode("ascii"))
        writer.write(b"\r\n")
        writer.write(body)
        await self.wait_for(writer.drain(), WRITE_TIMEOUT_MS)

    def error_response(self, error):
        body = json.dumps({"ok": False, "error": {"code": error.code, "detail": error.detail}}).encode()
        return self.server.Response(body, status=error.status, headers={
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Private-Network": "true",
        })

    async def handle(self, reader, writer):
        admitted = self.connections < MAX_CONNECTIONS
        if admitted:
            self.connections += 1
        try:
            if not admitted:
                raise HttpError(503, "service_busy", "The XRP has too many open connections; retry shortly")
            for index in range(MAX_REQUESTS_PER_CONNECTION):
                request = await self.parse(reader, idle=index > 0)
                if request is None:
                    return
                route = self.server._match_route(request)
                handler = route.call_handler if route else self.server.catchall_handler
                if handler is None:
                    raise HttpError(404, "not_found", "Unknown course endpoint")
                response = handler(request)
                keep_alive = request.protocol == "HTTP/1.1" and request.headers.get("connection", "").lower() != "close" and index + 1 < MAX_REQUESTS_PER_CONNECTION
                await self.send(writer, response, keep_alive)
                if not keep_alive:
                    return
        except (OSError, EOFError):
            pass
        except Exception as error:
            if not isinstance(error, HttpError):
                if isinstance(error, MemoryError):
                    import gc
                    gc.collect()
                    error = HttpError(503, "memory_busy", "The XRP has insufficient memory for this request")
                elif isinstance(error, (TimeoutError,)):
                    error = HttpError(408, "request_timeout", "The request or response did not complete in time")
                else:
                    error = HttpError(400, "invalid_request", "The request could not be completed")
            try:
                await self.send(writer, self.error_response(error))
            except Exception:
                pass
        finally:
            if admitted:
                self.connections -= 1
            writer.close()
            try:
                await self.wait_for(writer.wait_closed(), WRITE_TIMEOUT_MS)
            except Exception:
                pass


def install(server):
    """Use bounded I/O with the unchanged pinned Phew route registry."""
    if not hasattr(server, "_handle_request"):
        return None  # Protocol-only test doubles have no socket transport.
    admission = Admission(server)
    server._handle_request = admission.handle
    return admission
