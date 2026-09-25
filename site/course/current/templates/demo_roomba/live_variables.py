# Publish the latest range, phase, and avoidance count.

from ucsb_xrp import live


# Motion code reads the current .value when it applies these Monitor controls.
OBSTACLE_DISTANCE_MM = live.number("obstacle_distance_mm", 240.0, 150.0, 700.0, 10.0, unit="mm", label="Obstacle distance")
FORWARD_SPEED_MM_S = live.number("roomba_forward_speed_mm_s", 150.0, 60.0, 180.0, 10.0, unit="mm/s", label="Forward speed")
REVERSE_SPEED_MM_S = live.number("roomba_reverse_speed_mm_s", -120.0, -180.0, -60.0, 10.0, unit="mm/s", label="Reverse speed")
TURN_RATE_RAD_S = live.number("roomba_turn_rate_rad_s", 1.4, 0.5, 1.8, 0.1, unit="rad/s", label="Turn rate")


# Publish observed values for inspection without changing the motion decision.
def publish_range(range_mm):
    live.watch("range_mm", range_mm if range_mm is not None else "No echo", unit="mm")


def publish_phase(phase):
    live.watch("phase", phase)


def publish_avoidance_count(count):
    live.watch("avoidances", count)
