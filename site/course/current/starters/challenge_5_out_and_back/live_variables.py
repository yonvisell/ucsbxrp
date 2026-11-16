# Publish the current phase and result of one Out-and-Back run.

from ucsb_xrp import live
from settings import CRUISE_SPEED_MM_S, STEERING_RATE_RAD_S


DEFAULT_CRUISE_SPEED_MM_S = CRUISE_SPEED_MM_S  # Initial forward-speed control value, mm/s.
DEFAULT_STEERING_RATE_RAD_S = STEERING_RATE_RAD_S  # Initial magnitude limit for turning, rad/s.
# Create numeric controls in Monitor; .value reads each applied setting.
# Navigation uses positive values; maximum=None removes the preset upper limit.
CRUISE_SPEED = live.number(
    "navigation_cruise_speed_mm_s", DEFAULT_CRUISE_SPEED_MM_S,
    minimum=0.0, maximum=None, step=10.0, unit="mm/s", label="Cruise speed",
)
STEERING_RATE = live.number(
    "navigation_steering_rate_rad_s", DEFAULT_STEERING_RATE_RAD_S,
    minimum=0.0, maximum=None, step=0.1, unit="rad/s", label="Steering rate",
)


# Register signal names and units once; the loop writes only each value.
_WATCH_MISSION_PHASE = live.register_watch('mission_phase')
_WATCH_MISSION_RESULT = live.register_watch('mission_result')
_WATCH_GOALS_REACHED = live.register_watch('goals_reached')
_WATCH_RETURN_PATH_CELLS = live.register_watch('return_path_cells')


def publish_phase(phase):
    _WATCH_MISSION_PHASE.value = phase


def publish_result(result):
    _WATCH_MISSION_RESULT.value = result


def publish_goals_reached(count):
    _WATCH_GOALS_REACHED.value = count


def publish_return_path_cells(count):
    _WATCH_RETURN_PATH_CELLS.value = count


# Write the result to both Monitor and Program output.
def report_result(result):
    publish_result(result)
    print("Out-and-Back: result=" + result)
