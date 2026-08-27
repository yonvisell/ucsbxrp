import importlib.util
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "device_service_protocol",
    ROOT / "device_service/ucsb_xrp_service/protocol.py",
)
PROTOCOL = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PROTOCOL)


class DeviceServiceProtocolTest(unittest.TestCase):
    def test_line_log_writer_handles_fragmented_print_calls(self):
        events = []
        writer = PROTOCOL.LineLogWriter(
            "stdout", lambda stream, line: events.append((stream, line))
        )
        self.assertEqual(writer.write("result"), 6)
        writer.write(": 1\nnext")
        writer.flush()
        writer.print("value", 2, sep="=", end="!\n")
        self.assertEqual(
            events,
            [
                ("stdout", "result: 1"),
                ("stdout", "next"),
                ("stdout", "value=2!"),
            ],
        )

    def test_line_log_writer_bounds_partial_and_complete_lines(self):
        events = []
        writer = PROTOCOL.LineLogWriter(
            "stdout", lambda stream, line: events.append((stream, line))
        )
        text = "x" * (PROTOCOL.MAX_LOG_LINE_CHARS * 2 + 7)

        self.assertEqual(writer.write(text), len(text))
        self.assertLess(len(writer._buffer), PROTOCOL.MAX_LOG_LINE_CHARS)
        writer.write("\n")

        self.assertEqual([len(line) for _, line in events], [512, 512, 7])

    def test_normalizes_complete_text_project(self):
        project = PROTOCOL.validate_project(
            {
                "name": "  Week 1  ",
                "entrypoint": "/main.py",
                "files": {"main.py": "print('ready')\n", "notes.md": "Notes\n"},
            }
        )
        self.assertEqual(project["name"], "Week 1")
        self.assertEqual(project["entrypoint"], "main.py")
        self.assertEqual(project["bytes"], 21)

    def test_rejects_traversal_and_missing_entrypoint(self):
        for path in ("../main.py", "a/../../main.py", "a//main.py"):
            with self.subTest(path=path):
                with self.assertRaises(PROTOCOL.ProtocolError):
                    PROTOCOL.validate_project(
                        {"entrypoint": path, "files": {path: "pass\n"}}
                    )
        with self.assertRaises(PROTOCOL.ProtocolError):
            PROTOCOL.validate_project(
                {"entrypoint": "main.py", "files": {"other.py": "pass\n"}}
            )

    def test_project_revision_matches_the_browser_protocol(self):
        project = PROTOCOL.validate_project(
            {
                "name": "Display name is excluded",
                "entrypoint": "main.py",
                "files": {
                    "main.py": "print('ok')\n",
                    "lib/a.py": "VALUE = 1\n",
                },
            }
        )
        self.assertEqual(
            PROTOCOL.project_revision(project),
            "94c8db611816a391e40858466e242721dc446e44bf0b02688f5a63056c5d73e3",
        )

    def test_rejects_unsupported_request_id(self):
        self.assertEqual(PROTOCOL.validate_request_id("ide-42.1"), "ide-42.1")
        for value in (None, "", "spaces are not allowed", "x" * 81):
            with self.subTest(value=value):
                with self.assertRaises(PROTOCOL.ProtocolError):
                    PROTOCOL.validate_request_id(value)

    def test_correlated_reply_shape(self):
        self.assertEqual(
            PROTOCOL.reply("req-1", result={"state": "ready"}),
            {
                "protocol": 1,
                "requestId": "req-1",
                "ok": True,
                "result": {"state": "ready"},
            },
        )
        failure = PROTOCOL.reply(
            "req-2",
            ok=False,
            error={"code": "bad", "detail": "Invalid"},
        )
        self.assertFalse(failure["ok"])
        self.assertEqual(failure["error"]["code"], "bad")


if __name__ == "__main__":
    unittest.main()
