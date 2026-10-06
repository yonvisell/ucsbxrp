# Read the SnakeGame settings used by Python and the arena view.

import json
import sys


# Numeric settings in snake_config.json use these meanings:
# food: per_square_meter is pellet density; maximum caps the count; edge_margin_mm
# keeps generated centers inside the boundary. jitter_x/y_fraction set the maximum
# displacement as a fraction of grid-cell width/height. Seeds repeat each arena's layout.
# body: head/tail_diameter_mm define pickup and collision radii; initial_tail_mm
# sets starting length. sample_spacing_mm and maximum_tail_points bound stored paths.
# neck_clearance_mm excludes the newest tail from collision checks; wall_margin_mm
# and obstacle_stop_mm end play near a boundary or ultrasound echo. pellet_radius_mm
# sets the displayed pellet radius; pickup uses the head radius instead.
# controls: each entry gives default, minimum, maximum, and step for the speed
# (mm/s) or tail-growth (mm per pickup) slider.
# navigation: approach_fraction multiplies cruise speed within slowdown_distance_mm.
# turn_rate_rad_s limits rotation; position_tolerance_mm and heading_tolerance_rad
# qualify a goal. realign_heading_rad triggers turning in place before proceeding.
# robot: starting commands and max_drive_command are dimensionless motor efforts;
# speed_command_gain and wheel_speed_kp convert mm/s to effort (s/mm).

# Use the current project first, then the MicroPython search path, so the
# same JSON settings drive the game and arena view.
for root in (".",) + tuple(sys.path):
    try:
        with open(root.rstrip("/") + "/snake_config.json", "r") as source:
            CONFIG = json.load(source)
        break
    except OSError:
        continue
else:
    raise OSError("snake_config.json was not found in this project")
