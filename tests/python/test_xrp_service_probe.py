import importlib.util
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "xrp_service_probe", ROOT / "scripts/xrp_service_probe.py"
)
SERVICE_PROBE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SERVICE_PROBE)


class XrpServiceProbeTest(unittest.TestCase):
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
