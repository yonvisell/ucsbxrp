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

try:  # Ensure finally stops motors on exit.
    state = robot.start(WORLD.initial_pose)  # Initialize estimated pose; reset measurements.
    publish_scene_config(WORLD)
    publish_game(game)
    # Choose the current food goal until a wall, obstacle, tail, or win ends play.
    while game.phase == "playing":
        goal = game.current_food()
        navigation.start((goal,))
        # Retarget only after this food is reached or a terminal condition occurs.
        while game.phase == "playing" and game.current_food() is goal:
            if SPEED_MM_S.value != last_speed_mm_s:
                # Rebuild the navigation limits only when the cruise slider changes.
                last_speed_mm_s = SPEED_MM_S.value
                navigation.set_config(navigation_config_for_speed(last_speed_mm_s))
            state = robot.step(navigation.update(state.pose), read_range=True)
            # Evaluate food, tail, and collision from estimated pose and measured range.
            if game.observe(state.pose, GROWTH_MM.value, state.measurements.range_mm):
                publish_game(game)
finally:
    robot.stop()

print("SnakeGame:", game.phase, "score", game.score, "of", len(game.food))
