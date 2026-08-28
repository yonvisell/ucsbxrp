# Run all Tutorial 1 checks without importing or starting a robot.

from exercise_checks import run_exercise_checks


if run_exercise_checks():
    print("Tutorial 1 complete")
else:
    print("Complete the remaining functions in student_work.py")
