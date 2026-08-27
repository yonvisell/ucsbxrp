# Challenge 1: Straight Run

## Objective

Drive from the start line to the finish marker and stop from measured wheel
travel. A valid run must not finish before `TARGET_TIME_S`; after the distance
result is repeatable, reduce the remaining positive time difference.

The start pose and finish marker live in `world.json`. `challenge.py` loads
them as `INITIAL_POSE` and `TRAVEL_DISTANCE_MM`, so the program, virtual field,
and Monitor use one geometry. Do not copy marker coordinates or the travel
distance into another file.

## What you implement

Your work is `SensorModel` in `sensor_model.py` and `WheelSpeedController` in
`wheel_speed_controller.py`. `course_setup.py` selects each student class
independently after it passes **Test components**.

| Class | Responsibility, state, and use |
| --- | --- |
| `SensorModel` | Converts `RawSensors` encoder counts and device time into `Measurements`. It retains the count/time origin, the preceding sample, and only the history needed for a stable wheel-speed estimate. Wheel control uses its speeds; later challenges use its wheel increments for odometry. |
| `WheelSpeedController` | Converts target and measured `WheelSpeeds` into a bounded `DriveCommand`. It treats the wheels independently and returns exact zero for a zero target. `Robot` sends its result to `XRPBot`. |

`SensorModel.reset(raw)` establishes one run's origin and returns zero position,
increment, and speed while preserving range and USER-button values.
`update(raw)` returns cumulative position, travel since the preceding sample,
elapsed seconds, and regularized speed. Encoder direction and distance per count
come from `left_encoder_sign`, `right_encoder_sign`, `wheel_diameter_mm`, and
`encoder_counts_per_revolution`. Calculate each elapsed interval from successive
`RawSensors.time_ms` values, not from the nominal sample period.
`sample_period_ms` defines the intended robot-loop schedule, while
`wheel_speed_filter_time_constant_ms` sets how strongly the speed estimate is
regularized.

`WheelSpeedController.update(target, measured)` must preserve requested wheel
direction, respond to measured speed error, and keep each command within
`max_drive_command`. Use `left_start_command`, `right_start_command`,
`left_speed_command_gain`, `right_speed_command_gain`, and `wheel_speed_kp`
from `self.config`. The current values in `robot_config.py` describe this robot;
they are not constants of the class. `estimate_range()` is completed in
Challenge 5.

## Provided files and tools

| File or service | Role |
| --- | --- |
| `world.json` | Start, finish, and arena shown by the virtual XRP and Monitor. |
| `challenge.py` | Loads `INITIAL_POSE` and `TRAVEL_DISTANCE_MM`; defines `TARGET_TIME_S`. |
| `robot_config.py` | Robot dimensions, signs, calibration, sample settings, speed settings, and stopping tolerance. |
| `main.py` | Runs the measured straight-line task and stops the motors in `finally`. |
| `course_setup.py` | Selects the supplied or student version of each component. |
| `component_checks.py` | Names each input, expected observation, and observed result without starting either robot. |
| `StraightLineController` | Requests cruise, approach, or zero speed from measured mean wheel travel. |
| Supplied `DifferentialDrive` and `Odometry` | Complete the robot loop until Challenge 2. |

## How the program runs

`StraightLineController` requests forward motion from measured travel.
`DifferentialDrive` turns that request into wheel targets. Your
`WheelSpeedController` produces motor commands; `XRPBot` applies them and reads
the encoders. Your `SensorModel` turns those readings into the measurements used
by the next update. The feedback loop ends when measured travel reaches the
distance loaded from `world.json`.

## Complete the challenge

1. Run the supplied components on the virtual XRP. Identify target speed,
   measured speed, drive command, and wheel position in Monitor.
2. Implement and check `SensorModel`; then select it in `course_setup.py` and
   repeat the virtual run.
3. Implement and check `WheelSpeedController`; then run both student classes.
4. Confirm that wheel position increases forward, increments describe only the
   newest sample, drive commands stay bounded, and the robot slows and stops at
   `TRAVEL_DISTANCE_MM`.
5. Record repeated virtual runs. Retain the distance result while reducing the
   amount by which elapsed time exceeds `TARGET_TIME_S`.
6. For the physical XRP, first run with its wheels clear and verify forward
   direction and Stop. Then use the marked clear lane and record final wheel
   travel, elapsed time, target and measured speed, and drive command.

After both components work, select **Create Challenge 2 · Turn and Return
project**. The separate project carries forward `sensor_model.py`,
`wheel_speed_controller.py`, and their selections. The Challenge 1 folder
remains unchanged.
