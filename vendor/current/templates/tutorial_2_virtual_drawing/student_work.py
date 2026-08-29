# Runnable segment classes for the Tutorial 2 Virtual XRP drawing.

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
        if not name:
            raise ValueError("name must not be empty")
        if not isinstance(steps, int) or steps <= 0:
            raise ValueError("steps must be a positive integer")
        if forward_speed_mm_s == 0.0 and turn_rate_rad_s == 0.0:
            raise ValueError("segment command must not be stationary")
        self.name = name
        self.forward_speed_mm_s = forward_speed_mm_s
        self.turn_rate_rad_s = turn_rate_rad_s
        self.steps = steps

    def command(self) -> MotionCommand:
        return MotionCommand(self.forward_speed_mm_s, self.turn_rate_rad_s)


# A turn is a DrawingSegment with zero forward speed and positive yaw rate.
class TurnSegment(DrawingSegment):

    def __init__(self, name: str, turn_rate_rad_s: float, steps: int) -> None:
        if turn_rate_rad_s <= 0.0:
            raise ValueError("turn rate must be positive")
        super().__init__(name, 0.0, turn_rate_rad_s, steps)


# Return four straight sides alternating with four left turns.
def build_drawing(
    side_speed_mm_s: float,
    side_steps: int,
    turn_rate_rad_s: float,
    turn_steps: int,
) -> list:
    segments = []
    for index in range(4):
        segments.append(
            DrawingSegment(
                "side {}".format(index + 1),
                side_speed_mm_s,
                0.0,
                side_steps,
            )
        )
        segments.append(
            TurnSegment(
                "corner {}".format(index + 1),
                turn_rate_rad_s,
                turn_steps,
            )
        )
    return segments
