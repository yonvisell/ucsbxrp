# Drive between Cartesian food waypoints; stop on a wall or the finite tail.

from challenge import WORLD
from course_setup import make_navigation_controller, make_robot
from live_variables import GROWTH_MM, SPEED_MM_S, publish_game, publish_scene_config
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG, navigation_config_for_speed
from snake_game import SnakeGame


robot = make_robot(ROBOT_CONFIG)
navigation = make_navigation_controller(NAVIGATION_CONFIG)
game = SnakeGame(WORLD)
last_speed_mm_s = NAVIGATION_CONFIG.cruise_speed_mm_s

try:
    state = robot.start(WORLD.initial_pose)
    publish_scene_config(WORLD)
    publish_game(game)
    while game.phase == "playing":
        goal = game.current_food()
        navigation.start((goal,))
        while game.phase == "playing" and game.current_food() is goal:
            if SPEED_MM_S.value != last_speed_mm_s:
                last_speed_mm_s = SPEED_MM_S.value
                navigation.set_config(navigation_config_for_speed(last_speed_mm_s))
            state = robot.step(navigation.update(state.pose), read_range=True)
            if game.observe(state.pose, GROWTH_MM.value, state.measurements.range_mm):
                publish_game(game)
finally:
    robot.stop()

print("SnakeGame:", game.phase, "score", game.score, "of", len(game.food))
