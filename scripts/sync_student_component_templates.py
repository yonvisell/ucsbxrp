#!/usr/bin/env python3
"""Copy the documented student component templates into challenge starters."""

from pathlib import Path
import shutil


ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / "vendor/current/student_component_templates"
STARTERS = ROOT / "vendor/current/starters"
INTRODUCED_BY_CHALLENGE = {
    "sensor_model.py": 1,
    "wheel_speed_controller.py": 1,
    "differential_drive.py": 2,
    "odometry.py": 2,
    "navigation_controller.py": 3,
    "grid_planner.py": 4,
    "range_safety_controller.py": 6,
    "pose_corrector.py": 7,
    "visit_order_planner.py": 8,
}


def synchronize():
    """Replace every starter stub with its canonical documented template."""
    for filename, first_challenge in INTRODUCED_BY_CHALLENGE.items():
        source = TEMPLATES / filename
        for challenge_number in range(first_challenge, 9):
            destination = STARTERS / ("challenge_{}".format(challenge_number)) / filename
            shutil.copyfile(source, destination)


if __name__ == "__main__":
    synchronize()
