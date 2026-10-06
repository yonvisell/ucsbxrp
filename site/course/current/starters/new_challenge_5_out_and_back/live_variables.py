# Publish the current phase and result of one Out-and-Back run.

from ucsb_xrp import live


DEFAULT_CRUISE_SPEED_MM_S = 150.0  # Initial forward-speed slider value, mm/s.
DEFAULT_TURN_RATE_RAD_S = 0.8  # Initial magnitude limit for turning, rad/s.
# Create sliders in Monitor; .value reads each applied setting.
# Each declaration lists the initial value, lower/upper bounds, and adjustment step.
CRUISE_SPEED = live.number(
    "navigation_cruise_speed_mm_s", DEFAULT_CRUISE_SPEED_MM_S,
    minimum=80.0, maximum=220.0, step=10.0, unit="mm/s", label="Cruise speed",
)
TURN_RATE = live.number(
    "navigation_turn_rate_rad_s", DEFAULT_TURN_RATE_RAD_S,
    minimum=0.4, maximum=1.6, step=0.1, unit="rad/s", label="Turn rate",
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
