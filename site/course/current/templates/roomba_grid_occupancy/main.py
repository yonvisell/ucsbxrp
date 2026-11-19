# Map fresh ultrasound returns and guard the robot's next maneuver.

from avoidance import Avoidance
from map_example import show_cell_example
from measured_map import MeasuredMap
from occupancy_display import publish_grid
from robot_setup import make_robot
from settings import RUN_LIMIT_S
from ucsb_xrp import STOP_COMMAND, elapsed_time_s, load_world


show_cell_example()
world = load_world()
grid = MeasuredMap.for_world(world)
robot = make_robot()
elapsed_ms = 0
try:
    start_ms = robot.start(world.initial_pose).measurements.time_ms
    publish_grid(grid, 0)
    state = robot.step(STOP_COMMAND, read_range=True)
    avoidance = Avoidance(state)
    while True:
        elapsed_ms = round(1000 * elapsed_time_s(state.measurements.time_ms, start_ms))
        if grid.observe(robot.range_sample_seq, state):
            publish_grid(grid, elapsed_ms)
        if elapsed_ms >= RUN_LIMIT_S * 1000:
            print("Mapping run complete at {:g} s.".format(RUN_LIMIT_S))
            break
        command = avoidance.command(state, grid)
        if avoidance.phase == "blocked":
            print("Mapping stopped. No clear turn within the allowed retreat.")
            break
        state = robot.step(command, read_range=True)
finally:
    robot.stop()
    publish_grid(grid, elapsed_ms)
