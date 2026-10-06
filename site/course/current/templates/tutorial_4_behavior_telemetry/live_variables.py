# Monitor controls for the approach, turn, and stopped phases.
# The behavior reads .value after each robot sample.

from ucsb_xrp import live


# Each number sets an initial value, lower/upper bounds, and step in the stated unit.
# Forward speed applies during approach. A sensor range at or below stop distance
# starts the turn; turn rate sets that rotation's magnitude.
FORWARD_SPEED = live.number(
    "tutorial_forward_speed_mm_s",
    110.0,
    minimum=60.0,
    maximum=130.0,
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
RUN_BEHAVIOR = live.toggle("tutorial_run_behavior", True, label="Run behavior")
