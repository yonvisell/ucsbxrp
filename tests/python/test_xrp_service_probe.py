import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "xrp_service_probe", ROOT / "scripts/xrp_service_probe.py"
)
SERVICE_PROBE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SERVICE_PROBE)


class XrpServiceProbeTest(unittest.TestCase):
    def test_wait_for_program_drains_ordered_terminal_telemetry_pages(self):
        replies = [
            {
                "state": "ready",
                "logs": [{"seq": 3, "stream": "system", "line": "running"}],
                "samples": [{"seq": 1}],
                "sample": {"seq": 1},
                "moreLogs": True,
                "moreSamples": True,
            },
            {
                "state": "ready",
                "logs": [{"seq": 4, "stream": "stdout", "line": "complete"}],
                "samples": [{"seq": 2}],
                "sample": {"seq": 2},
                "moreLogs": False,
                "moreSamples": False,
            },
        ]
        paths = []

        def request_json(_base_url, path, **_options):
            paths.append(path)
            return replies.pop(0), {}

        cursor = {"logSeq": 2}
        with patch.object(SERVICE_PROBE, "request_json", side_effect=request_json):
            result = SERVICE_PROBE.wait_for_program(
                "http://xrp", 7, cursor=cursor
            )

        self.assertEqual(
            paths,
            [
                "/api/v1/telemetry?afterLogSeq=2&afterSampleSeq=0&runId=7",
                "/api/v1/telemetry?afterLogSeq=3&afterSampleSeq=1&runId=7",
            ],
        )
        self.assertEqual([entry["seq"] for entry in result["logs"]], [3, 4])
        self.assertEqual(result["sample"]["seq"], 2)
        self.assertEqual(cursor, {"logSeq": 4, "sampleSeq": 2, "runId": 7})

    def test_probe_projects_compile_and_keep_zero_output_explicit(self):
        projects = [
            SERVICE_PROBE.zero_output_project(),
            SERVICE_PROBE.zero_output_project(wait_forever=True),
            SERVICE_PROBE.pose_telemetry_project(),
        ]
        for project in projects:
            with self.subTest(project=project["name"]):
                compile(project["files"]["main.py"], "main.py", "exec")
        pose_source = projects[-1]["files"]["main.py"]
        long_source = projects[1]["files"]["main.py"]
        self.assertIn("bot.read()", long_source)
        self.assertIn("bot.stop()", long_source)
        self.assertIn("robot.step(STOP_COMMAND)", pose_source)
        self.assertIn("finally:\n    robot.stop()", pose_source)
        self.assertNotIn("self._bot.reset_encoders()", pose_source)

    def test_project_revision_matches_the_browser_and_device_protocol(self):
        project = {
            "name": "Display name is excluded",
            "entrypoint": "main.py",
            "files": {
                "main.py": "print('ok')\n",
                "lib/a.py": "VALUE = 1\n",
            },
        }
        self.assertEqual(
            SERVICE_PROBE.project_revision(project),
            "94c8db611816a391e40858466e242721dc446e44bf0b02688f5a63056c5d73e3",
        )


if __name__ == "__main__":
    unittest.main()
