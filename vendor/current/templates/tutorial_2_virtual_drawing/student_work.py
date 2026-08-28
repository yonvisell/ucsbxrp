# Describe a drawing for the Tutorial 2 Virtual XRP runner.

from ucsb_xrp import MotionCommand


# Store one constant motion command and the number of samples that use it.
class DrawingSegment:

    def __init__(
        self,
        name: str,
        forward_speed_mm_s: float,
        turn_rate_rad_s: float,
        steps: int,
    ) -> None:
        # Example: DrawingSegment("side 1", 100.0, 0.0, 35).
        # Validate the four inputs, then store them with the same field names.
        raise NotImplementedError("complete DrawingSegment.__init__")

    def command(self) -> MotionCommand:
        # Return MotionCommand(self.forward_speed_mm_s, self.turn_rate_rad_s).
        raise NotImplementedError("complete DrawingSegment.command")


# A turn is a DrawingSegment with zero forward speed and positive yaw rate.
class TurnSegment(DrawingSegment):

    def __init__(self, name: str, turn_rate_rad_s: float, steps: int) -> None:
        # Reject a nonpositive turn rate, then call super().__init__(...).
        raise NotImplementedError("complete TurnSegment.__init__")


# Return four straight sides alternating with four left turns.
def build_drawing(
    side_speed_mm_s: float,
    side_steps: int,
    turn_rate_rad_s: float,
    turn_steps: int,
) -> "list | tuple":
    # Use a four-iteration loop. Reject a drawing longer than 500 samples.
    raise NotImplementedError("complete build_drawing")
