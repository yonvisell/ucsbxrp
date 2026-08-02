import json
import pathlib
import struct
import sys
import unittest


REPOSITORY_ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPOSITORY_ROOT / "vendor" / "current"))

from ucsb_xrp import live


class LiveRuntimeTests(unittest.TestCase):
    def setUp(self):
        live.clear()

    def snapshot(self):
        return json.loads(live.runtime_snapshot_json())

    def test_declares_all_compact_control_types(self):
        speed = live.number(
            "cruise_speed",
            150,
            minimum=50,
            maximum=250,
            step=5,
            unit="mm/s",
            label="Cruise speed",
        )
        enabled = live.toggle("avoid_obstacles", True)
        direction = live.choice(
            "turn_direction",
            "left",
            options=("left", "right"),
        )

        state = self.snapshot()
        self.assertEqual(speed.value, 150.0)
        self.assertIs(enabled.value, True)
        self.assertEqual(direction.value, "left")
        self.assertEqual(
            [parameter["kind"] for parameter in state["parameters"]],
            ["number", "toggle", "choice"],
        )
        self.assertEqual(state["parameters"][0]["unit"], "mm/s")
        self.assertEqual(state["parameters"][2]["options"], ["left", "right"])

    def test_queues_then_applies_parameter_updates_together(self):
        speed = live.number("speed", 100, 0, 200, 10, unit="mm/s")
        enabled = live.toggle("enabled", True)

        live.queue_update("speed", 170)
        live.queue_update("enabled", False)
        pending = self.snapshot()
        self.assertEqual(speed.value, 100.0)
        self.assertIs(enabled.value, True)
        self.assertEqual(pending["parameters"][0]["pendingValue"], 170.0)
        self.assertIs(pending["parameters"][1]["pendingValue"], False)

        self.assertTrue(live.apply_updates())
        self.assertEqual(speed.value, 170.0)
        self.assertIs(enabled.value, False)
        self.assertFalse(
            any("pendingValue" in item for item in self.snapshot()["parameters"])
        )
        self.assertFalse(live.apply_updates())

    def test_watch_updates_one_named_value_without_printing(self):
        revision_before = self.snapshot()["revision"]
        live.watch("distance_error", 42.5, unit="mm")
        live.watch("state", "turning")
        live.watch("distance_error", 18.0, unit="mm")

        self.assertEqual(self.snapshot()["watches"], [])
        self.assertFalse(live.apply_updates())
        state = self.snapshot()
        self.assertEqual(state["revision"], revision_before + 1)
        self.assertEqual(len(state["watches"]), 2)
        self.assertEqual(state["watches"][0]["value"], 18.0)
        self.assertEqual(state["watches"][0]["unit"], "mm")
        self.assertEqual(state["watches"][1]["value"], "turning")

    def test_rejects_ambiguous_or_unrenderable_parameters(self):
        with self.assertRaisesRegex(ValueError, "step"):
            live.number("speed", 101, 0, 200, 10)
        with self.assertRaisesRegex(ValueError, "letters, digits"):
            live.toggle("not valid", True)
        with self.assertRaisesRegex(ValueError, "2 to 6"):
            live.choice("mode", "only", ("only",))
        live.toggle("enabled", True)
        with self.assertRaisesRegex(ValueError, "already exists"):
            live.toggle("enabled", False)

    def test_allows_a_range_that_ends_between_slider_steps(self):
        gain = live.number("gain", 0.0, 0.0, 1.0, 0.3)

        live.queue_update("gain", 0.9)
        live.apply_updates()

        self.assertAlmostEqual(gain.value, 0.9)

    def test_accepts_decimal_steps_after_rp2350_float_rounding(self):
        def float32(value):
            return struct.unpack("f", struct.pack("f", value))[0]

        winding = live.number(
            "spiral_winding_turns_per_m",
            float32(1.2),
            minimum=float32(0.4),
            maximum=float32(2.0),
            step=float32(0.1),
        )

        self.assertAlmostEqual(winding.value, 1.2, places=6)


if __name__ == "__main__":
    unittest.main()
