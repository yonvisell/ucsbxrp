# Complete the measured behavior and telemetry functions for Tutorial 4.

from ucsb_xrp import MotionCommand, RobotState, live


APPROACH = "approach"
TURN = "turn"
DONE = "done"

# Live controls are declared once. Read each current setting through .value.
FORWARD_SPEED = live.number(
    "tutorial_forward_speed_mm_s",
    110.0,
    minimum=60.0,
    maximum=180.0,
    step=10.0,
    unit="mm/s",
    label="Forward speed",
)
STOP_DISTANCE = live.number(
    "tutorial_stop_distance_mm",
    260.0,
    minimum=180.0,
    maximum=360.0,
    step=10.0,
    unit="mm",
    label="Stop distance",
)
TURN_RATE = live.number(
    "tutorial_turn_rate_rad_s",
    0.8,
    minimum=0.4,
    maximum=1.2,
    step=0.1,
    unit="rad/s",
    label="Turn rate",
)
TURN_DIRECTION = live.choice(
    "tutorial_turn_direction",
    "left",
    options=("left", "right"),
    label="Turn direction",
)
RUN_BEHAVIOR = live.toggle(
    "tutorial_run_behavior",
    True,
    label="Run behavior",
)


def next_phase(
    phase: str,
    range_mm: "float | None",
    stop_distance_mm: float,
    turn_complete: bool,
) -> str:
    # APPROACH uses range, TURN uses turn_complete, and DONE remains DONE.
    raise NotImplementedError("complete next_phase")


def command_for_phase(
    phase: str,
    forward_speed_mm_s: float,
    turn_rate_rad_s: float,
    turn_direction: str,
) -> MotionCommand:
    # Return forward, signed in-place turn, or zero motion for the phase.
    raise NotImplementedError("complete command_for_phase")


def publish_telemetry(state: RobotState, phase: str) -> None:
    # Watch phase and range. Plot mean wheel distance and odometry heading.
    raise NotImplementedError("complete publish_telemetry")
