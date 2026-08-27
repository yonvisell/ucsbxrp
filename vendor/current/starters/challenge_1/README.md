# Challenge 1: Straight Run

## Objective

Make the XRP travel from the start line to the finish and stop using measured
wheel motion. The robot must not stop because a timer expired: encoder counts
must be converted to wheel travel, and the measured wheel speeds must be used
to regulate the motors.

`challenge.py` provides `INITIAL_POSE`, `TRAVEL_DISTANCE_MM`, and
`TARGET_TIME_S`. The distance is derived from the finish marker in `world.json`.
The target time is a value for comparing runs, not the stopping condition.
`robot_config.py` contains the dimensions and calibration used in the
calculations:

- `wheel_diameter_mm` gives wheel diameter in millimeters, and
  `encoder_counts_per_revolution` gives the count change for one wheel
  revolution;
- `left_encoder_sign` and `right_encoder_sign` make forward wheel travel
  positive;
- `left_start_command` and `right_start_command` give the minimum normalized
  motor command used for nonzero motion;
- `left_speed_command_gain` and `right_speed_command_gain` convert requested
  wheel speed in mm/s to additional normalized motor command;
- `sample_period_ms` and `wheel_speed_filter_time_constant_ms` set the sampling
  and response times in milliseconds; and
- `wheel_speed_kp` converts wheel-speed error in mm/s to feedback correction,
  while `max_drive_command` limits the normalized command magnitude.

Do not copy the current numerical settings into your class. Read them through
`self.config` so the same code works after the robot is calibrated.

## Student implementations

| File | Class | Responsibility |
| --- | --- | --- |
| `sensor_model.py` | `SensorModel` | Convert encoder counts and device time into wheel position, wheel increment, and wheel-speed measurements. |
| `wheel_speed_controller.py` | `WheelSpeedController` | Convert requested and measured wheel speeds into safe left and right motor commands. |

### Implement `SensorModel`

`reset(raw)` receives the first `RawSensors` sample of a run. Store its encoder
counts and time as the reference, clear the wheel-speed calculation, and return
a `Measurements` value with zero wheel position, increment, and speed. Preserve
`range_mm` and `button_pressed`.

`update(raw)` receives the next sample:

1. Calculate millimeters per encoder count from wheel circumference and
   `encoder_counts_per_revolution`.
2. Calculate each total wheel position from the reset count and each wheel
   increment from the preceding count. Apply the corresponding encoder sign.
3. Calculate `dt_s` from the two device times. Device time is in milliseconds;
   `dt_s` is in seconds.
4. Estimate each wheel speed in mm/s from recent position and time samples.
   Use `wheel_speed_filter_time_constant_ms` so a single encoder-count change
   does not appear as an instantaneous speed jump. Do not smooth the wheel
   increments: odometry needs the measured travel in the latest sample.
5. Return all fields in a new `Measurements` value and preserve the current
   range and USER-button readings.

`estimate_range()` is completed in Challenge 5 and may remain unimplemented
here.

### Implement `WheelSpeedController`

`reset()` clears any values your controller retains between samples. It may do
nothing if `update()` uses no history.

`update(target, measured)` receives two `WheelSpeeds` values in mm/s and returns
one `DriveCommand`:

1. Treat the left and right wheels independently.
2. If a requested wheel speed is exactly zero, return exactly zero for that
   wheel.
3. Otherwise combine the direction-dependent start command, the requested
   speed multiplied by its speed-command gain, and
   `wheel_speed_kp * (target_speed - measured_speed)`.
4. Limit each result to `±max_drive_command`.

Use the left configuration fields for the left wheel and the right fields for
the right wheel. The API page gives the required types, return values, and
exceptions for both classes.

## Supplied project files and services

| File or service | Use in this challenge |
| --- | --- |
| `main.py` | Starts the measured run, repeatedly requests the next straight-line command, and always stops the motors. |
| `challenge.py` | Reads the initial pose and finish point from `world.json` and provides the named task values. |
| `robot_config.py` | Holds robot dimensions, encoder signs, motor calibration, speed-estimation settings, and straight-run speed and tolerance fields. |
| `course_setup.py` | Chooses the supplied or student version of each class. A `USE_STUDENT_*` flag of `False` uses the working supplied class. |
| `component_checks.py` | Runs software examples of the student classes in MicroPython without starting either robot. |
| `StraightLineController` | Uses measured mean wheel travel to request cruise speed, approach speed, or stop. |
| Supplied `DifferentialDrive` and `Odometry` | Complete the measured robot loop until students implement these classes in Challenge 2. |

`world.json` also defines the arena shown by the virtual XRP and Monitor.

## Program flow

```text
finish distance
      |
      v
StraightLineController ---- requested forward speed
                                      |
                                      v
supplied DifferentialDrive ---- requested wheel speeds
                                      |
                                      v
WheelSpeedController* --------- left/right motor commands
       ^                              |
       | measured wheel speeds        v
       +---------------- SensorModel* <- encoder counts and time

* student implementation
```

## Work sequence

1. Run the unchanged project with both `USE_STUDENT_*` flags set to `False`.
   In the Monitor, identify requested wheel speed, measured wheel speed, motor
   command, and wheel position.
2. Implement `SensorModel`. Select **Test components** and resolve every
   reported SensorModel error.
3. Set only `USE_STUDENT_SENSOR_MODEL = True`. Run the virtual XRP and confirm
   that forward wheel positions increase, increments remain measured travel,
   and speed estimates respond smoothly.
4. Implement and check `WheelSpeedController`.
5. Set `USE_STUDENT_WHEEL_SPEED_CONTROLLER = True`. Run both student classes
   together on the virtual XRP. Confirm that the robot slows near the finish
   and stops.
6. Record a virtual run and compare final mean wheel travel with
   `TRAVEL_DISTANCE_MM`; compare elapsed time with `TARGET_TIME_S`.
7. Raise and secure the physical XRP for the first bounded motor check. After
   signs and zero commands are correct, place it in a clear lane, run the same
   project, and record distance, time, requested speed, measured speed, and
   motor command.

The `finally` block in `main.py` commands zero drive after completion or an
exception. Do not remove it.
