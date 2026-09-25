# Monitor sliders and game readings.

from ucsb_xrp import live
from snake_config import CONFIG


growth = CONFIG["controls"]["growth_mm"]
speed = CONFIG["controls"]["speed_mm_s"]
# Motion code reads the current .value when it applies these Monitor controls.
GROWTH_MM = live.number("snake_growth_mm", growth["default"], growth["minimum"], growth["maximum"], growth["step"], unit="mm", label="Tail growth per food")
SPEED_MM_S = live.number("snake_speed_mm_s", speed["default"], speed["minimum"], speed["maximum"], speed["step"], unit="mm/s", label="Cruise speed")


# Publish observed values for inspection without changing the motion decision.
def publish_game(game):
    # Send the current score, food state, tail length, and stopping reason to Monitor.
    live.watch("snake_score", game.score, label="Score")
    live.watch("snake_food_count", len(game.food), label="Food in arena")
    live.watch("snake_tail_mm", game.tail_mm, unit="mm", label="Tail length")
    live.watch("snake_phase", game.phase, label="Game")


def publish_scene_config(world):
    # Mirror editable project settings in Monitor without a second config file.
    food = CONFIG["food"]
    body = CONFIG["body"]
    seed = food["physical_seed"] if world.id == "snake-physical" else food["virtual_seed"]
    live.watch("snake_scene_seed", seed)
    live.watch("snake_scene_max_food", food["maximum"])
    live.watch("snake_scene_margin", food["edge_margin_mm"])
    live.watch("snake_scene_jitter_x", food["jitter_x_fraction"])
    live.watch("snake_scene_jitter_y", food["jitter_y_fraction"])
    live.watch("snake_scene_head_mm", body["head_diameter_mm"])
    live.watch("snake_scene_tail_mm", body["tail_diameter_mm"])
    live.watch("snake_scene_pellet_mm", body["pellet_radius_mm"])
    live.watch("snake_scene_sample_mm", body["sample_spacing_mm"])
    live.watch("snake_scene_initial_mm", body["initial_tail_mm"])
    live.watch("snake_scene_points", body["maximum_tail_points"])
