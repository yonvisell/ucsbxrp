# Lesson 5: import reusable code from another project file.

from tutorial_helpers import clamp, millimeters_to_meters


raw_command = 1.35
bounded_command = clamp(raw_command, -1.0, 1.0)
print("bounded command:", bounded_command)
print("distance:", millimeters_to_meters(750.0), "m")
