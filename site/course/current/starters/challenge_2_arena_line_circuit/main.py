# Follow the tape continuously and stop after the final waypoint crossing.
from challenge import INITIAL_POSE, MAXIMUM_LOST_LINE_S
from lap_progress import LineCircuit
from live_variables import publish_line_values
from robot_setup import (
    LINE_FOLLOWER_SETTINGS, ROBOT_CONFIG, STOP_ON_LINE_LOSS,
    apply_line_controls, make_line_follower, make_robot,
)
from supplied_settings import WAYPOINT_TARGET
from ucsb_xrp import elapsed_time_s


robot = make_robot(ROBOT_CONFIG)
follower = make_line_follower(LINE_FOLLOWER_SETTINGS)
circuit = LineCircuit(follower, STOP_ON_LINE_LOSS)
try:
    state = robot.start(INITIAL_POSE, read_reflectance=True)
    start_ms = state.measurements.time_ms
    while True:
        apply_line_controls(follower)
        readings = state.measurements.reflectance
        command = circuit.update(readings, state.measurements.dt_s)
        if circuit.should_publish:
            publish_line_values(readings, command, follower,
                                circuit.waypoints_reached, circuit.phase)
        if circuit.result is not None:
            break
        state = robot.step(command, read_reflectance=True)
    result = circuit.result
    if result == "complete":
        print("Finished: crossed all {} waypoints, including start and finish.".format(WAYPOINT_TARGET))
    elif result == "line_lost":
        print("Stopped: both IR reflectance sensors remained below their line thresholds for {} s. The motors stopped at the first such reading.".format(
            MAXIMUM_LOST_LINE_S))
    else:
        print("Stopped: floor-sensor readings are unavailable.")
    print("Line circuit: result={} waypoints={}/{} elapsed_s={}".format(
        result, circuit.waypoints_reached, WAYPOINT_TARGET,
        elapsed_time_s(state.measurements.time_ms, start_ms),
    ))
finally:
    robot.stop()
