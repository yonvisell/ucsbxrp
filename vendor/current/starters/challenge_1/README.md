# Challenge 1 starter: safe component check

This is the five-file project structure used for **Straight Run**. Its initial
`main.py` is deliberately a no-motion check: it reads two sensor samples,
passes them through the selected `SensorModel`, asks the supplied
`StraightLineController` for a planned command, and passes the corresponding
wheel-speed request through the selected `WheelSpeedController`.

`ROBOT_CONFIG` is motion-locked, so the computed and applied motor efforts are
zero. This checks imports, records, sensor conversion, component selection, and
zero-effort cleanup. It is **not** evidence that either motor moves, has the
correct sign, or stops under power.

Do not unlock motion by editing only `max_effort`. A motion-enabled project
requires the later raised-wheel acceptance procedure and measured calibration
values for the particular robot.

## Files

- `main.py` runs the current check or challenge.
- `robot_config.py` contains measurements and reusable controller settings.
- `student_components.py` contains the two Challenge 1 student components.
- `course_setup.py` selects supplied or student components explicitly.
- `challenge.py` contains values specific to Straight Run.

The supplied components are loaded from generated `.mpy` files. Those exact
files pass the same public behavior checks in browser MicroPython and on the
RP2350. Their retained source remains provisional course design, not a
definitive algorithm students are expected to reproduce internally.
