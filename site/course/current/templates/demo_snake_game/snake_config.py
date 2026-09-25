# Read the SnakeGame settings used by Python and the arena view.

import json
import sys


for root in (".",) + tuple(sys.path):
    try:
        with open(root.rstrip("/") + "/snake_config.json", "r") as source:
            CONFIG = json.load(source)
        break
    except OSError:
        continue
else:
    raise OSError("snake_config.json was not found in this project")
