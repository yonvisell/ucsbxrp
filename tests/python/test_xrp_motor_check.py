import importlib.util
from pathlib import Path
import sys
import unittest


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
SPEC = importlib.util.spec_from_file_location(
    "xrp_motor_check", ROOT / "scripts/xrp_motor_check.py"
)
MOTOR_CHECK = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MOTOR_CHECK)


class XrpMotorCheckTest(unittest.TestCase):
    def test_device_program_is_short_bounded_and_always_stops(self):
        source = MOTOR_CHECK.motor_project()["files"]["main.py"]
        compile(source, "main.py", "exec")
        self.assertIn('"effort": 0.22', source)
        self.assertIn("finally:\n    zero()", source)
        self.assertNotIn("while True", source)

    def test_encoder_differences_preserve_wheel_order(self):
        self.assertEqual(MOTOR_CHECK.differences([12, -4], [2, -7]), [10, 3])


if __name__ == "__main__":
    unittest.main()
