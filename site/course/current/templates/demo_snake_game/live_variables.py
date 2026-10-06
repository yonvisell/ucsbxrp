# Monitor sliders and game readings.

from ucsb_xrp import live
from snake_config import CONFIG


growth = CONFIG["controls"]["growth_mm"]
speed = CONFIG["controls"]["speed_mm_s"]
GROWTH_MM = live.number("snake_growth_mm", growth["default"], growth["minimum"], growth["maximum"], growth["step"], unit="mm", label="Tail growth per food")
SPEED_MM_S = live.number("snake_speed_mm_s", speed["default"], speed["minimum"], speed["maximum"], speed["step"], unit="mm/s", label="Cruise speed")


# Register signal names and units once; the loop writes only each value.
_WATCH_SNAKE_SCORE = live.register_watch('snake_score', label="Score")
_WATCH_SNAKE_FOOD_COUNT = live.register_watch('snake_food_count', label="Food in arena")
_WATCH_SNAKE_TAIL_MM = live.register_watch('snake_tail_mm', unit="mm", label="Tail length")
_WATCH_SNAKE_PHASE = live.register_watch('snake_phase', label="Game")
_WATCH_SNAKE_SCENE_SEED = live.register_watch('snake_scene_seed')
_WATCH_SNAKE_SCENE_MAX_FOOD = live.register_watch('snake_scene_max_food')
_WATCH_SNAKE_SCENE_MARGIN = live.register_watch('snake_scene_margin')
_WATCH_SNAKE_SCENE_JITTER_X = live.register_watch('snake_scene_jitter_x')
_WATCH_SNAKE_SCENE_JITTER_Y = live.register_watch('snake_scene_jitter_y')
_WATCH_SNAKE_SCENE_HEAD_MM = live.register_watch('snake_scene_head_mm')
_WATCH_SNAKE_SCENE_TAIL_MM = live.register_watch('snake_scene_tail_mm')
_WATCH_SNAKE_SCENE_PELLET_MM = live.register_watch('snake_scene_pellet_mm')
_WATCH_SNAKE_SCENE_SAMPLE_MM = live.register_watch('snake_scene_sample_mm')
_WATCH_SNAKE_SCENE_INITIAL_MM = live.register_watch('snake_scene_initial_mm')
_WATCH_SNAKE_SCENE_POINTS = live.register_watch('snake_scene_points')


def publish_game(game):
    # Send the current score, food state, tail length, and stopping reason to Monitor.
    _WATCH_SNAKE_SCORE.value = game.score
    _WATCH_SNAKE_FOOD_COUNT.value = len(game.food)
    _WATCH_SNAKE_TAIL_MM.value = game.tail_mm
    _WATCH_SNAKE_PHASE.value = game.phase


def publish_scene_config(world):
    # Mirror editable project settings in Monitor without a second config file.
    food = CONFIG["food"]
    body = CONFIG["body"]
    seed = food["physical_seed"] if world.id == "snake-physical" else food["virtual_seed"]
    _WATCH_SNAKE_SCENE_SEED.value = seed
    _WATCH_SNAKE_SCENE_MAX_FOOD.value = food["maximum"]
    _WATCH_SNAKE_SCENE_MARGIN.value = food["edge_margin_mm"]
    _WATCH_SNAKE_SCENE_JITTER_X.value = food["jitter_x_fraction"]
    _WATCH_SNAKE_SCENE_JITTER_Y.value = food["jitter_y_fraction"]
    _WATCH_SNAKE_SCENE_HEAD_MM.value = body["head_diameter_mm"]
    _WATCH_SNAKE_SCENE_TAIL_MM.value = body["tail_diameter_mm"]
    _WATCH_SNAKE_SCENE_PELLET_MM.value = body["pellet_radius_mm"]
    _WATCH_SNAKE_SCENE_SAMPLE_MM.value = body["sample_spacing_mm"]
    _WATCH_SNAKE_SCENE_INITIAL_MM.value = body["initial_tail_mm"]
    _WATCH_SNAKE_SCENE_POINTS.value = body["maximum_tail_points"]
