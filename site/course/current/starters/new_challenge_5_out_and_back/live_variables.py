# Publish the current phase and result of one Out-and-Back run.

from ucsb_xrp import live


DEFAULT_CRUISE_SPEED_MM_S = 150.0
DEFAULT_TURN_RATE_RAD_S = 0.8
# Create sliders in Monitor; .value reads each slider setting.
CRUISE_SPEED = live.number(
    "navigation_cruise_speed_mm_s", DEFAULT_CRUISE_SPEED_MM_S,
    minimum=80.0, maximum=220.0, step=10.0, unit="mm/s", label="Cruise speed",
)
TURN_RATE = live.number(
    "navigation_turn_rate_rad_s", DEFAULT_TURN_RATE_RAD_S,
    minimum=0.4, maximum=1.6, step=0.1, unit="rad/s", label="Turn rate",
)


def publish_phase(phase):
    live.watch("mission_phase", phase)


def publish_result(result):
    live.watch("mission_result", result)


def publish_goals_reached(count):
    live.watch("goals_reached", count)


def publish_return_path_cells(count):
    live.watch("return_path_cells", count)


# Write the result to both Monitor and Program output.
def report_result(result):
    publish_result(result)
    print("Out-and-Back: result=" + result)
