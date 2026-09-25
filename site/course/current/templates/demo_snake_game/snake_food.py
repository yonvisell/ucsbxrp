# Repeatable food positions for both SnakeGame arenas.

from math import floor, sqrt
from snake_config import CONFIG


FOOD = CONFIG["food"]
MAX_FOOD = FOOD["maximum"]


def food_count(bounds, density):
    # Bounds are millimeters; convert square millimeters to square meters.
    width = bounds[2] - bounds[0]
    height = bounds[3] - bounds[1]
    return min(MAX_FOOD, max(1, int(width * height * density / 1000000.0 + 0.5)))


def food_positions(world, count):
    # Visit a jittered grid in serpentine order to keep routes navigable.
    bounds = world.bounds_mm
    width = bounds[2] - bounds[0]
    height = bounds[3] - bounds[1]
    columns = max(1, int(sqrt(count * width / height) + 0.5))
    rows = (count + columns - 1) // columns
    margin = FOOD["edge_margin_mm"]
    cell_width = (width - 2 * margin) / columns
    cell_height = (height - 2 * margin) / rows
    jitter_x = int(cell_width * FOOD["jitter_x_fraction"])
    jitter_y = int(cell_height * FOOD["jitter_y_fraction"])
    seed = FOOD["physical_seed"] if world.id == "snake-physical" else FOOD["virtual_seed"]
    result = []
    for row in range(rows):
        for offset in range(columns):
            if len(result) == count:
                return tuple(result)
            column = offset if row % 2 == 0 else columns - 1 - offset
            # Fixed integer recurrence keeps placements repeatable per world.
            seed = (1664525 * seed + 1013904223) % 4294967296
            dx = seed % (2 * jitter_x + 1) - jitter_x
            seed = (1664525 * seed + 1013904223) % 4294967296
            dy = seed % (2 * jitter_y + 1) - jitter_y
            x = bounds[0] + margin + (column + 0.5) * cell_width + dx
            y = bounds[1] + margin + (row + 0.5) * cell_height + dy
            result.append((floor(x + 0.5), floor(y + 0.5)))
    return tuple(result)
