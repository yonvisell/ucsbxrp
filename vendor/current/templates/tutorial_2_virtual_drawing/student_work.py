# Describe a drawing for the Tutorial 2 virtual-robot runner.

from ucsb_xrp import MotionCommand


# Data object for one constant robot command held for several samples.
class DrawingSegment:

    def __init__(self, name, forward_speed_mm_s, turn_rate_rad_s, steps):
        # Validate and store the name, command values, and number of samples.
        raise NotImplementedError("complete DrawingSegment.__init__")

    def command(self):
        # Return this segment's command values in a UCSBXRP record.
        raise NotImplementedError("complete DrawingSegment.command")


# DrawingSegment specialization for a positive in-place left turn.
class TurnSegment(DrawingSegment):

    def __init__(self, name, turn_rate_rad_s, steps):
        # Initialize a left turn with zero forward speed.
        raise NotImplementedError("complete TurnSegment.__init__")


# Return four straight sides alternating with four left turns.
def build_drawing(
    side_speed_mm_s,
    side_steps,
    turn_rate_rad_s,
    turn_steps,
):
    raise NotImplementedError("complete build_drawing")
