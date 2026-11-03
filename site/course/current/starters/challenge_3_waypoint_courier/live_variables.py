# Publish waypoint progress, route time and the pose errors used for steering.

from ucsb_xrp import live, distance_to_goal, bearing_to_goal, wrap_angle_rad
from settings import CRUISE_SPEED_MM_S, TURN_RATE_RAD_S


DEFAULT_CRUISE_SPEED_MM_S = CRUISE_SPEED_MM_S  # Initial forward-speed slider value, mm/s.
DEFAULT_TURN_RATE_RAD_S = TURN_RATE_RAD_S  # Initial magnitude limit for turning, rad/s.
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
_PLOT_WAYPOINTS_REACHED = live.register_plot("waypoints_reached", label="Waypoints")
_PLOT_ROUTE_TIME = live.register_plot("route_time_s", initial=0.0, unit="s", label="Route time")
_WATCH_ACTIVE_GOAL = live.register_watch("active_goal", label="Active goal (0 = done)")
_PLOT_GOAL_DISTANCE = live.register_plot("goal_distance_mm", unit="mm", label="Command goal distance")
_PLOT_GOAL_HEADING = live.register_plot("goal_heading_error_rad", unit="rad", label="Command heading error")
_PLOT_HEADING_RAD = live.register_plot('heading_rad', unit="rad", label="Estimated heading")


def publish_goal_count(reached_count):
    _PLOT_WAYPOINTS_REACHED.value = reached_count


def publish_route_time(elapsed_s):
    _PLOT_ROUTE_TIME.value = elapsed_s


def publish_heading(pose):
    _PLOT_HEADING_RAD.value = pose.heading_rad


def publish_navigation(pose, goal, goal_number, config):
    # These errors use the pose that produced the upcoming motion command.
    # Robot.step records them with that command and the next acquired sample.
    _WATCH_ACTIVE_GOAL.value = goal_number if goal is not None else 0
    if goal is None:
        _PLOT_GOAL_DISTANCE.value = 0.0
        _PLOT_GOAL_HEADING.value = 0.0
        return
    distance = distance_to_goal(pose, goal)
    # At an accepted position, steering corrects any required final heading.
    # Otherwise it corrects the direction toward the goal position.
    if distance <= config.position_tolerance_mm:
        heading_error = (0.0 if goal.heading_rad is None else
                         wrap_angle_rad(goal.heading_rad - pose.heading_rad))
    else:
        heading_error = wrap_angle_rad(bearing_to_goal(pose, goal) - pose.heading_rad)
    _PLOT_GOAL_DISTANCE.value = distance
    _PLOT_GOAL_HEADING.value = heading_error
