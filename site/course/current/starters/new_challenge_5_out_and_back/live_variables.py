# Publish the current phase and result of one Out-and-Back run.

from ucsb_xrp import live


DEFAULT_CRUISE_SPEED_MM_S = 150.0
DEFAULT_TURN_RATE_RAD_S = 0.8
# Motion code reads the current .value when it applies these Monitor controls.
CRUISE_SPEED = live.number(
    "navigation_cruise_speed_mm_s", DEFAULT_CRUISE_SPEED_MM_S,
    minimum=80.0, maximum=220.0, step=10.0, unit="mm/s", label="Cruise speed",
)
TURN_RATE = live.number(
    "navigation_turn_rate_rad_s", DEFAULT_TURN_RATE_RAD_S,
    minimum=0.4, maximum=1.6, step=0.1, unit="rad/s", label="Turn rate",
)


# Publish observed values for inspection without changing the motion decision.
def publish_phase(phase):
    # Show the current mission phase label, such as outbound or return.
    live.watch("mission_phase", phase)


def publish_result(result):
    # Show the result label reported when the mission stops or finishes.
    live.watch("mission_result", result)


def publish_goals_reached(count):
    # Show how many ordered NavigationGoal targets were accepted.
    live.watch("goals_reached", count)


def publish_return_path_cells(count):
    # Show the number of GridCell entries in the planned return path.
    live.watch("return_path_cells", count)


# Input: mission result text; show it in live telemetry and Program output.
def report_result(result):
    publish_result(result)
    print("Out-and-Back: result=" + result)
