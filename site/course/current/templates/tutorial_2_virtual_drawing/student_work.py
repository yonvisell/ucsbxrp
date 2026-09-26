# Measured straight and turning segments for a Virtual XRP drawing.

from ucsb_xrp import MotionCommand, RobotState, wrap_angle_rad

# DrawingSegment — request straight motion until measured wheel travel reaches a distance.
# Called by: Tutorial 2 main.py for each side of the drawing.
# Methods: command(), is_complete(start_state, current_state).
# Inputs: forward speed (mm/s), target distance (mm), and RobotState samples.
# State: name, speed, and target distance; no accumulated timer.
# Returns: MotionCommand and a completion Boolean from measured wheel positions.

class DrawingSegment:
    def __init__(self, name: str, forward_speed_mm_s: float, distance_mm: float) -> None:
        if not name or forward_speed_mm_s <= 0.0 or distance_mm <= 0.0:
            raise ValueError("straight segment needs a name, speed, and distance")
        self.name = name
        self.forward_speed_mm_s = forward_speed_mm_s
        self.distance_mm = distance_mm

    def command(self) -> MotionCommand:
        return MotionCommand(self.forward_speed_mm_s, 0.0)

    def is_complete(self, start_state: RobotState, current_state: RobotState) -> bool:
        start = start_state.measurements
        current = current_state.measurements
        # Subtract segment origins; the wheel positions themselves span the whole run.
        left_mm = current.left_position_mm - start.left_position_mm
        right_mm = current.right_position_mm - start.right_position_mm
        return (left_mm + right_mm) / 2.0 >= self.distance_mm


# TurnSegment — request an in-place left turn until estimated heading changes.
# Called by: Tutorial 2 main.py between straight sides.
# Methods: command(), is_complete(start_state, current_state).
# Inputs: turn rate (rad/s), target angle (rad), and RobotState samples.
# State: name, rate, and target angle; no accumulated timer.
# Returns: MotionCommand and a completion Boolean from estimated heading.

class TurnSegment:
    def __init__(self, name: str, turn_rate_rad_s: float, angle_rad: float) -> None:
        if not name or turn_rate_rad_s <= 0.0 or angle_rad <= 0.0:
            raise ValueError("turn segment needs a name, rate, and angle")
        self.name = name
        self.turn_rate_rad_s = turn_rate_rad_s
        self.angle_rad = angle_rad

    def command(self) -> MotionCommand:
        return MotionCommand(0.0, self.turn_rate_rad_s)

    def is_complete(self, start_state: RobotState, current_state: RobotState) -> bool:
        # A wrapped difference measures the commanded left turn across ±pi.
        heading_change_rad = wrap_angle_rad(
            current_state.pose.heading_rad - start_state.pose.heading_rad
        )
        return heading_change_rad >= self.angle_rad


def build_drawing(
    side_speed_mm_s: float,
    side_distance_mm: float,
    turn_rate_rad_s: float,
    turn_angle_rad: float,
) -> list:
    # Alternate four measured sides with four measured left turns.
    segments = []
    for index in range(4):
        segments.append(DrawingSegment("side {}".format(index + 1), side_speed_mm_s, side_distance_mm))
        segments.append(TurnSegment("corner {}".format(index + 1), turn_rate_rad_s, turn_angle_rad))
    return segments
