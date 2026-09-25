# Read the SnakeGame settings used by Python and the arena view.

import json
import sys


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
