# Run the Tutorial 1 checks, then print examples from the completed functions.

from exercise_checks import run_exercise_checks
from student_work import (
    average_speed_mm_s,
    range_state,
    route_distance_mm,
    wheel_speed_summary,
)


if run_exercise_checks():
    print("\nCompleted-function examples")
    print("average speed:", average_speed_mm_s(300.0, 2.0), "mm/s")
    print("range decision:", range_state(220.0, 250.0))
    print("route distance:", route_distance_mm([100.0, 150.0]), "mm")
    print(
        "wheel-speed summary:",
        wheel_speed_summary([80.0, 100.0], [75.0, 95.0]),
    )
    print("Tutorial 1 complete")
else:
    print("Complete the remaining functions in student_work.py")
