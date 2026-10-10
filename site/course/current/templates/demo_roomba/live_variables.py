# Publish the latest range, phase, and avoidance count.

from ucsb_xrp import live


# Each number lists initial value, minimum, maximum, and slider step in the stated unit.
# Sensor range at or below the obstacle distance starts reversal; reverse speed is negative.
# Turn rate limits the magnitude of either left or right avoidance rotation.
# A 2 mm step preserves the exact 264 mm initial threshold in the live control.
OBSTACLE_DISTANCE_MM = live.number("obstacle_distance_mm", 264.0, 150.0, 700.0, 2.0, unit="mm", label="Obstacle distance")
FORWARD_SPEED_MM_S = live.number("roomba_forward_speed_mm_s", 150.0, 60.0, 180.0, 10.0, unit="mm/s", label="Forward speed")
REVERSE_SPEED_MM_S = live.number("roomba_reverse_speed_mm_s", -120.0, -180.0, -60.0, 10.0, unit="mm/s", label="Reverse speed")
TURN_RATE_RAD_S = live.number("roomba_turn_rate_rad_s", 1.4, 0.5, 1.8, 0.1, unit="rad/s", label="Turn rate")


# Register signal names and units once; the loop writes only each value.
_WATCH_RANGE_MM = live.register_watch('range_mm', unit="mm")
_WATCH_PHASE = live.register_watch('phase')
_WATCH_AVOIDANCES = live.register_watch('avoidances')


def publish_range(range_mm):
    _WATCH_RANGE_MM.value = range_mm if range_mm is not None else "No echo"


def publish_phase(phase):
    _WATCH_PHASE.value = phase


def publish_avoidance_count(count):
    _WATCH_AVOIDANCES.value = count
