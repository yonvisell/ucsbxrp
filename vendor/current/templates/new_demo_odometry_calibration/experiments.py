"""Change one experiment at a time; commands use mm/s and rad/s."""
from math import pi
from ucsb_xrp import MotionCommand

EXPERIMENT = "square"
EXPERIMENTS = {
    "straight": ((MotionCommand(100.0, 0.0), 2.0),),
    "arc": ((MotionCommand(100.0, 0.5), 3.0),),
    "turn_left": ((MotionCommand(0.0, 0.5), pi),),
    "turn_right": ((MotionCommand(0.0, -0.5), pi),),
    "square": ((MotionCommand(100.0, 0.0), 2.0), (MotionCommand(0.0, 0.5), pi)) * 4,
}
