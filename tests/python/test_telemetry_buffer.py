import pathlib
import sys
import unittest


REPOSITORY_ROOT = pathlib.Path(__file__).resolve().parents[2]
VENDOR_ROOT = REPOSITORY_ROOT / "vendor" / "current"
sys.path.insert(0, str(VENDOR_ROOT))

from ucsb_xrp import (  # noqa: E402
    DriveCommand,
    Measurements,
    Pose,
    RawSensors,
    RobotState,
)
from ucsb_xrp import _telemetry  # noqa: E402


def robot_state(value):
    return RobotState(
        Measurements(
            value * 20,
            0.02,
            value,
            value + 0.5,
            1.0,
            1.0,
            value * 2.0,
            value * 2.0 + 1.0,
            None,
            False,
        ),
        Pose(value, -value, 0.01 * value),
    )


class TelemetryBufferTest(unittest.TestCase):
    def setUp(self):
        self.original_ticks_ms = _telemetry._ticks_ms
        _telemetry.clear_state()

    def tearDown(self):
        _telemetry._ticks_ms = self.original_ticks_ms
        _telemetry.clear_state()

    def test_retains_only_thirty_two_ordered_immutable_step_snapshots(self):
        ticks = iter(range(1_000, 1_800, 20))
        _telemetry._ticks_ms = lambda: next(ticks)

        for value in range(1, 40):
            _telemetry.publish_state(robot_state(value))

        retained = _telemetry.buffered_state_snapshots()
        self.assertEqual(len(retained), 32)
        self.assertEqual([item["sampleSeq"] for item in retained], list(range(8, 40)))
        self.assertEqual(
            [item["sampleTimeMs"] for item in retained],
            list(range(140, 780, 20)),
        )
        self.assertEqual(
            [item["sampleSeq"] for item in _telemetry.buffered_state_snapshots(36)],
            [37, 38, 39],
        )

        public_copy = _telemetry.state_snapshot()
        public_copy["xMm"] = 999
        self.assertEqual(_telemetry.state_snapshot()["xMm"], 39)
        self.assertEqual(retained[-1]["xMm"], 39)

    def test_mirrors_raw_hardware_and_drive_without_mutating_public_copy(self):
        raw = RawSensors(120, 14, -11, 340.0, True)
        _telemetry.publish_raw_sensors(
            raw,
            range_sampled=True,
            diagnostics={"batteryV": 6.1, "temperatureC": 24.5},
        )
        _telemetry.publish_drive_command(DriveCommand(0.2, -0.3))

        snapshot = _telemetry.hardware_snapshot()
        self.assertEqual(snapshot["leftEncoderCount"], 14)
        self.assertEqual(snapshot["rightEncoderCount"], -11)
        self.assertEqual(snapshot["rangeMm"], 340.0)
        self.assertEqual(snapshot["batteryV"], 6.1)
        self.assertEqual(snapshot["leftEffort"], 0.2)
        snapshot["leftEncoderCount"] = 999
        self.assertEqual(_telemetry.hardware_snapshot()["leftEncoderCount"], 14)

    def test_state_snapshot_carries_the_corresponding_raw_encoder_counts(self):
        _telemetry.publish_state(
            robot_state(1),
            raw_sensors=RawSensors(20, 12, -9, None, False),
        )
        snapshot = _telemetry.state_snapshot()
        self.assertEqual(snapshot["leftEncoderCount"], 12)
        self.assertEqual(snapshot["rightEncoderCount"], -9)

    def test_clear_starts_a_new_monotonic_sample_epoch(self):
        ticks = iter((5_000, 5_020, 8_000, 8_040))
        _telemetry._ticks_ms = lambda: next(ticks)
        _telemetry.publish_state(robot_state(1))
        _telemetry.publish_state(robot_state(2))

        self.assertEqual(
            [
                (item["sampleSeq"], item["sampleTimeMs"])
                for item in _telemetry.buffered_state_snapshots()
            ],
            [(1, 0), (2, 20)],
        )

        _telemetry.clear_state()
        _telemetry.publish_state(robot_state(3))
        _telemetry.publish_state(robot_state(4))

        self.assertEqual(
            [
                (item["sampleSeq"], item["sampleTimeMs"])
                for item in _telemetry.buffered_state_snapshots()
            ],
            [(1, 0), (2, 40)],
        )


if __name__ == "__main__":
    unittest.main()
