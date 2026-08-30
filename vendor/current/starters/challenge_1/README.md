# Challenge 1: Straight Run

## The challenge

Drive from the start line to the finish marker and use measured wheel travel to
stop. First make the stopping distance repeatable. Then finish as close as
possible to the assigned target time without finishing early.

The task values have one source:

- [`world.json`](world.json) defines the initial pose and finish marker.
- [`challenge.py`](challenge.py) loads `INITIAL_POSE`, calculates
  `TRAVEL_DISTANCE_MM`, and defines `TARGET_TIME_S` and the visible
  `MAX_RUN_TIME_S` diagnostic limit.

Use these names in your program. Do not copy their current numerical values
into another file. Record robot-specific calibration in
[`robot_config.py`](robot_config.py).

## What you implement

Implement two classes:

- [`sensor_model.py`](sensor_model.py): `SensorModel.reset()` establishes the
  encoder and time origins. `SensorModel.update()` converts each later raw
  sample into wheel position, newest wheel travel, elapsed time, and wheel-speed
  estimates. Use the encoder signs, wheel geometry, and speed-estimator setting
  in `self.config`.
- [`wheel_speed_controller.py`](wheel_speed_controller.py):
  `WheelSpeedController.update()` compares requested and measured wheel speeds
  and returns a limited `DriveCommand`. A zero speed request must produce an
  exact zero command for that wheel. Use the calibration, feedback gain, and
  command limit in `self.config`.

Leave `SensorModel.estimate_range()` unfinished; Challenge 5 introduces it.

## Project modules

| File | Role |
| --- | --- |
| [`sensor_model.py`](sensor_model.py) | Defines `SensorModel`, which converts encoder counts and time to physical measurements. |
| [`wheel_speed_controller.py`](wheel_speed_controller.py) | Defines `WheelSpeedController`, which converts wheel-speed error to a `DriveCommand`. |
| [`robot_config.py`](robot_config.py) | Measured and tuned settings for your XRP. |
| [`course_setup.py`](course_setup.py) | Selects the supplied class or the class defined in each named component file. |
| [`main.py`](main.py) | Runs the straight-distance task and reports distance and elapsed time. |
| [`component_checks.py`](component_checks.py) | Calls the required `SensorModel` and `WheelSpeedController` methods without starting a robot. |

## Provided files and tools

- `StraightLineController` requests cruise speed, reduces speed near the
  finish, and stops at the assigned travel distance.
- The supplied `DifferentialDrive` and `Odometry` complete the robot loop until
  Challenge 2.
- `Robot` maintains the measured control cycle. `XRPBot` applies motor commands
  and reads the hardware or simulator.

## How the program runs

```text
finish distance + measured wheel travel
                 -> StraightLineController -> requested forward speed
                 -> DifferentialDrive       -> wheel-speed targets
encoder readings -> SensorModel             -> measured wheel speeds
targets + measured speeds
                 -> WheelSpeedController     -> motor commands
```

The loop ends when measured travel reaches `TRAVEL_DISTANCE_MM`. If a sensor or
controller mistake prevents progress for `MAX_RUN_TIME_S`, the program names
that failure and raises an error. The `finally` block in `main.py` stops both
motors on completion or error.

## Check each component

Select **Test components** in the IDE. The checks load `SensorModel` from
`sensor_model.py` and `WheelSpeedController` from
`wheel_speed_controller.py`; they do not move either robot. For each class,
read its `USE`,
`INPUT`, and `EXPECT` lines before the result:

- `PASS` means the implemented behavior matched the stated examples.
- `NOT IMPLEMENTED` means the named method still needs to be written.
- `FAIL` means the method ran, but its result did not meet the stated
  requirement.

Fix every `NOT IMPLEMENTED` and `FAIL`, then run **Test components** again. Set
the matching `USE_STUDENT_*` flag in `course_setup.py` to `True` only after that
class passes its checks.

## Complete the challenge

1. Run the supplied classes on the virtual XRP. Locate requested wheel
   speed, measured wheel speed, drive command, and wheel travel in Monitor.
2. Select the `SensorModel` defined in `sensor_model.py`. Verify that
   forward position increases, each
   increment contains only the newest wheel travel, and the speed estimate
   follows changes without reporting each encoder-count step as a speed spike.
3. Select the `WheelSpeedController` defined in
   `wheel_speed_controller.py`. Verify command limits and an exact zero command
   at the finish.
4. Compare repeated virtual runs using the reported distance, lateral,
   heading, and time errors. `timed_result` states explicitly whether a run
   finished early or satisfied the no-earlier-than-target rule.
5. For the physical XRP, first check wheel direction and Stop with the wheels
   clear. Then run the marked lane and record distance, elapsed time, requested
   and measured speed, and drive command.

After completing this challenge, select **Continue to Challenge 2 · Turn and
Return…**. The IDE creates a separate project and carries forward
`sensor_model.py`, `wheel_speed_controller.py`, and their component selections.
The Challenge 1 project remains unchanged.
