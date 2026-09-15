"""Source timestamps survive publication delays and bounded replay without hardware."""
import pathlib
import sys
import types
import unittest
from unittest.mock import patch

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "vendor/current"))
from ucsb_xrp import _telemetry, Measurements, Pose, RawSensors, Robot, RobotState


class TelemetryTimingTests(unittest.TestCase):
    def setUp(self):
        _telemetry.clear_state()
        self.now = 100
        self.clock = patch.object(_telemetry, "_ticks_ms", lambda: self.now)
        self.clock.start()

    def tearDown(self):
        self.clock.stop()
        _telemetry.clear_state()

    def raw(self, tick, count=1, distance=None):
        return RawSensors(tick, count, -count, distance, False)

    def publish(self, raw, dt_s=0.02):
        state = RobotState(Measurements(raw.time_ms, dt_s, 0, 0, 0, 0, 0, 0, raw.range_mm, False), Pose(0, 0, 0))
        _telemetry.publish_state(state, raw_sensors=raw, sample_period_ms=20, overrun_ms=3)
        return state

    def test_acquisition_and_measured_dt_do_not_follow_publication_delay(self):
        _telemetry.begin_course_samples()
        self.publish(self.raw(100), 0)
        self.now = 143
        self.publish(self.raw(120, 2))
        first, second = _telemetry.buffered_state_snapshots()
        self.assertEqual(second["timing"][0:3], (120, 20, 2))
        self.assertEqual(second["timing"][10:15], (43, 20, 20, 3, "course"))
        self.assertEqual(first["timing"][1], 0)
        self.assertEqual(second["sampleTimeMs"], 43)  # legacy publication time remains compatible

    def test_acquisition_clock_unwraps_ticks(self):
        with patch.object(_telemetry, "_ticks_diff", lambda a, b: (a - b + 16) % 32 - 16):
            _telemetry.begin_course_samples()
            self.now = 29
            self.publish(self.raw(28), 0)
            self.now = 6
            self.publish(self.raw(4), 0.008)
            value = _telemetry.state_snapshot()["timing"]
            self.assertEqual(value[0:3], (4, 8, 2))
            self.assertEqual(value[10], 10)

    def test_raw_reads_are_recorded_and_robot_does_not_double_publish(self):
        for index in range(3):
            self.now = 100 + 20 * index
            _telemetry.publish_raw_sensors(self.raw(self.now, index))
        rows = _telemetry.buffered_state_snapshots()
        self.assertEqual([row["sampleSeq"] for row in rows], [1, 2, 3])
        self.assertTrue(all(row["timing"][14] == "raw" for row in rows))
        self.assertTrue(all(not row["poseAvailable"] for row in rows))
        _telemetry.begin_course_samples()
        self.now = 160
        raw = self.raw(160, 4)
        _telemetry.publish_raw_sensors(raw)
        self.publish(raw)
        rows = _telemetry.buffered_state_snapshots()
        self.assertEqual(len(rows), 4)
        self.assertEqual(rows[-1]["timing"][2], 4)

    def test_raw_bridge_failure_does_not_interrupt_acquisition(self):
        def broken_bridge(_value):
            raise RuntimeError("observer is gone")
        with patch.object(_telemetry, "_publish_browser_raw", broken_bridge):
            _telemetry.publish_raw_sensors(self.raw(100))
        self.assertEqual(_telemetry.state_snapshot()["timing"][2], 1)

    def test_robot_sensor_read_suppression_ends_on_success_and_failure(self):
        def read(include_range=False):
            raw = self.raw(self.now)
            _telemetry.publish_raw_sensors(raw)
            return raw
        fake_robot = types.SimpleNamespace(_bot=types.SimpleNamespace(read=read))
        raw = Robot._read_sensors(fake_robot, False, False)
        self.assertEqual(_telemetry.buffered_state_snapshots(), ())
        self.publish(raw)
        self.now = 120
        _telemetry.publish_raw_sensors(self.raw(120, 2))
        self.assertEqual([row["timing"][14] for row in _telemetry.buffered_state_snapshots()], ["course", "raw"])
        def failure(include_range=False):
            raise OSError("read failed")
        fake_robot._bot.read = failure
        with self.assertRaises(OSError):
            Robot._read_sensors(fake_robot, False, False)
        self.assertFalse(_telemetry._course_samples)

    def test_range_and_diagnostics_have_immutable_separate_identity(self):
        _telemetry.begin_course_samples()
        raw = self.raw(100, distance=120)
        _telemetry.publish_raw_sensors(raw, range_sampled=True, diagnostics={"batteryV": 5.8, "accelerationMg": [1, 2, 3]})
        self.publish(raw)
        self.now = 120
        raw = self.raw(120, 2)
        _telemetry.publish_raw_sensors(raw)
        self.publish(raw)
        self.now = 160
        raw = self.raw(160, 3)
        _telemetry.publish_raw_sensors(raw, diagnostics={"sensorError": "IMU: OSError", "batteryV": 5.7})
        self.publish(raw)
        first, second, third = _telemetry.buffered_state_snapshots()
        self.assertEqual(first["diagnostics"][0], (1, 2, 3))
        self.assertEqual(second["diagnostics"], first["diagnostics"])
        self.assertIsNone(third["diagnostics"][0])
        self.assertEqual(first["diagnostics"][3], 5.8)
        self.assertEqual(third["diagnostics"][3], 5.7)
        self.assertEqual(second["timing"][3:7], (0, 1, 0, 1))
        self.assertEqual(third["timing"][5:7], (60, 2))
        self.assertTrue(first["timing"][15])
        self.assertFalse(second["timing"][15])
        self.assertIsNone(second["rangeMm"])

    def test_stop_reuses_acquisition_and_reset_starts_a_new_clock(self):
        _telemetry.begin_course_samples()
        state = self.publish(self.raw(100))
        self.now = 140
        _telemetry.publish_state(state, kind="stop")
        before, stopped = _telemetry.buffered_state_snapshots()
        self.assertEqual(stopped["timing"][0:3], before["timing"][0:3])
        self.assertEqual(stopped["timing"][10], 40)
        self.assertEqual(stopped["timing"][14], "stop")
        _telemetry.clear_state()
        self.now = 1000
        _telemetry.begin_course_samples()
        self.publish(self.raw(1000))
        self.assertEqual(_telemetry.state_snapshot()["timing"][0:3], (1000, 0, 1))


if __name__ == "__main__":
    unittest.main()
