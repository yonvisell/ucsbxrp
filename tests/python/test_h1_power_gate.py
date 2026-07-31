import importlib.util
from contextlib import redirect_stderr
from io import StringIO
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "h1_power_gate", ROOT / "scripts/h1_power_gate.py"
)
POWER_GATE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(POWER_GATE)


def probe(vin=0.05, detected=False, board_state="pass"):
    return {
        "board": {
            "state": board_state,
            "value": {
                "vin_nominal_corrected_v": vin,
                "motor_supply_detected": detected,
            },
        },
        "encoders_and_zero_effort": {"state": "pass"},
        "final_zero_effort": {"state": "pass"},
    }


class H1PowerGateTest(unittest.TestCase):
    def test_pass_requires_near_zero_vin_supply_absent_and_zero_cleanup(self):
        state, _ = POWER_GATE.classify_gate(probe(), maximum_vin_v=0.25)
        self.assertEqual(state, "pass")

        state, _ = POWER_GATE.classify_gate(
            probe(vin=0.6), maximum_vin_v=0.25
        )
        self.assertEqual(state, "fail")
        state, _ = POWER_GATE.classify_gate(
            probe(detected=True), maximum_vin_v=0.25
        )
        self.assertEqual(state, "fail")

        missing_zero = probe()
        missing_zero["final_zero_effort"] = {"state": "fail"}
        state, _ = POWER_GATE.classify_gate(
            missing_zero, maximum_vin_v=0.25
        )
        self.assertEqual(state, "fail")

    def test_limit_parser_rejects_a_threshold_that_is_not_near_zero(self):
        self.assertEqual(POWER_GATE.validate_limit("0.25"), 0.25)
        with self.assertRaises(Exception):
            POWER_GATE.validate_limit("0")
        with self.assertRaises(Exception):
            POWER_GATE.validate_limit("1.1")

    def test_parser_requires_every_fresh_physical_confirmation(self):
        parser = POWER_GATE.make_parser()
        with redirect_stderr(StringIO()):
            with self.assertRaises(SystemExit):
                parser.parse_args(
                    [
                        "--port",
                        "/dev/cu.test",
                        "--maximum-vin-v",
                        "0.25",
                        "--output",
                        "new-record.json",
                    ]
                )


if __name__ == "__main__":
    unittest.main()
