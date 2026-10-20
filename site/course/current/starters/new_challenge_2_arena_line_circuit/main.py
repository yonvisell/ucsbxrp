# Follow the tape continuously; stop on crossing 6: start, four bars, finish.
from challenge import INITIAL_POSE, MAXIMUM_LOST_LINE_S
from lap_progress import LapProgress
from live_variables import publish_line_values
from robot_setup import (
    LINE_FOLLOWER_SETTINGS, ROBOT_CONFIG,
    apply_line_controls, make_line_follower, make_robot,
)
from supplied_settings import (
    LINE_VISIBLE_THRESHOLD, WAYPOINT_DARK_THRESHOLD, WAYPOINT_CLEAR_THRESHOLD,
    WAYPOINT_CONFIRM_TIME_S, WAYPOINT_TARGET, calibrated_reflectance,
)
from ucsb_xrp import STOP_COMMAND, elapsed_time_s


robot = make_robot(ROBOT_CONFIG)
follower = make_line_follower(LINE_FOLLOWER_SETTINGS)
lap = LapProgress(WAYPOINT_DARK_THRESHOLD, WAYPOINT_CLEAR_THRESHOLD, WAYPOINT_CONFIRM_TIME_S)
try:
    state = robot.start(INITIAL_POSE, read_reflectance=True)
    start_ms = state.measurements.time_ms
    while True:
        apply_line_controls(follower)
        readings = state.measurements.reflectance
        if readings is None:
            result = "reflectance_unavailable"
            break
        count = lap.update(readings, state.measurements.dt_s)
        if count >= WAYPOINT_TARGET:
            publish_line_values(readings, STOP_COMMAND, follower, count, "complete")
            result = "complete"
            break
        calibrated = calibrated_reflectance(readings)
        if lap.observe_line(calibrated, state.measurements.dt_s, LINE_VISIBLE_THRESHOLD):
            command = follower.update(calibrated, state.measurements.dt_s)
        else:
            command = STOP_COMMAND
            if lap.lost_line_s >= MAXIMUM_LOST_LINE_S:
                result = "line_lost"
                break
        publish_line_values(readings, command, follower, count,
                            "line_lost_stopping" if lap.lost_line_s else "following")
        state = robot.step(command, read_reflectance=True)
    if result == "complete":
        print("Finished: crossed the start, four intermediate bars, and finish.")
    elif result == "line_lost":
        print("Stopped: both corrected floor readings stayed below {} for {} s. Motion was paused at the first missing-line sample.".format(
            LINE_VISIBLE_THRESHOLD, MAXIMUM_LOST_LINE_S))
    else:
        print("Stopped: floor-sensor readings are unavailable.")
    print("Line circuit: result={} waypoints={}/{} elapsed_s={}".format(
        result, lap.waypoints_reached, WAYPOINT_TARGET,
        elapsed_time_s(state.measurements.time_ms, start_ms),
    ))
finally:
    robot.stop()
