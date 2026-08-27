# Challenge 1: Straight Run

## The challenge

Drive from the start line to the finish marker and stop using measured wheel
travel. First make the stopping distance repeatable. Then adjust the run so the
robot finishes as close as possible to the assigned target time without
finishing early.

The current task is defined by `challenge.py` and `world.json`:

- `world.json` defines the initial pose and finish marker used by the program,
  virtual XRP, and Monitor.
- `challenge.py` loads those positions, calculates `TRAVEL_DISTANCE_MM`, and
  defines `TARGET_TIME_S`.

Use these named values in the program. Do not copy their current numerical
values into another file.

## What you implement

Implement these two classes:

- `SensorModel` in `sensor_model.py` converts encoder counts and device time
  into wheel positions, wheel travel during the latest sample, and wheel-speed
  estimates based on recent encoder samples. It retains the count and time
  origin, the preceding sample, and the limited history needed by the speed
  estimate.
- `WheelSpeedController` in `wheel_speed_controller.py` compares requested and
  measured wheel speeds and returns a bounded `DriveCommand` for each motor. A
  zero wheel-speed request must produce an exact zero command for that wheel.

For this challenge, implement `SensorModel.reset()` and `SensorModel.update()`.
Leave `estimate_range()` unchanged; Challenge 5 introduces that method.

These two component files are the student-owned implementation files for
Challenge 1.

`SensorModel.reset(raw)` establishes the origin for one run. Its result has
zero wheel position, increment, speed, and elapsed time while retaining the
sample's range and USER-button values. `SensorModel.update(raw)` calculates
position and timing from successive samples. Use the encoder signs, wheel
diameter, counts per revolution, and speed-filter response time in
`self.config`; do not substitute the nominal sample period for measured elapsed
time.

`WheelSpeedController.update(target, measured)` uses the starting commands,
speed-to-command gains, feedback gain, and command limit in `self.config`.
These values describe the current robot and may change after measurement; they
are not constants of the controller class.

Your pair also maintains the measured and tuned values in `robot_config.py`.

## Provided files and tools

- `main.py` runs the measured straight-line task and stops the motors in a
  `finally` block. At completion it reports mean measured wheel travel and
  wrap-safe elapsed time so they can be compared with the assigned targets.
- `StraightLineController` reduces the requested speed near the finish and
  stops at the assigned travel distance.
- `challenge.py` and `world.json` define the task.
- `course_setup.py` selects the supplied or student version of each component.
  Change only the named `USE_STUDENT_*` flags as components pass their checks.
- `component_checks.py` runs labeled software examples without starting the
  virtual or physical robot.
- Supplied `DifferentialDrive` and `Odometry` complete the robot loop until
  Challenge 2.

## How the program runs

Each control sample follows this sequence:

1. `StraightLineController` uses measured travel to request straight motion.
2. `DifferentialDrive` converts that request to left and right wheel-speed
   targets.
3. `WheelSpeedController` converts the targets and measured speeds to motor
   commands.
4. `XRPBot` applies the commands and reads the encoders.
5. `SensorModel` converts the readings to the next `Measurements` value.
6. The loop ends when measured travel reaches `TRAVEL_DISTANCE_MM`.

## Check each component

Select **Test components** in the IDE. The checks use the classes in your
component files; they do not move either robot.

- `PASS` means the result matched the stated example.
- `NOT IMPLEMENTED` identifies a method that still raises
  `NotImplementedError`.
- `FAIL` shows the expected and observed results that differ.

Read the labeled input and expected result above every outcome. Fix every
`NOT IMPLEMENTED` and `FAIL`, run **Test components** again, and only then set
the matching `USE_STUDENT_*` flag in `course_setup.py` to `True`.

## Complete the challenge

1. With the supplied components, run the virtual XRP and locate requested wheel
   speed, measured wheel speed, drive command, and wheel distance in Monitor.
2. Select your `SensorModel`. Confirm that forward wheel position increases,
   each increment describes only the newest sample, and the speed estimate is
   stable without hiding changes in motion.
3. Select your `WheelSpeedController`. Confirm that commands remain within the
   configured limit and return to zero at the finish.
4. Record repeated virtual runs. In Program output, compare
   `mean_wheel_travel_mm` and `measured_elapsed_time_s` with
   `TRAVEL_DISTANCE_MM` and `TARGET_TIME_S`.
5. On the physical XRP, first verify wheel direction and Stop with the wheels
   clear. On the marked lane, record final wheel travel, elapsed time, requested
   and measured speed, and drive command.

## IDE project actions

Use **Open project…** to reopen an existing project folder. Use **New project…**
to create a separate project from a course template. The default parent folder
for new projects is configured under project storage in IDE **Settings**.

After completing this challenge, select **Continue to Challenge 2 · Turn and
Return…**. The IDE creates a separate project and carries forward
`sensor_model.py`, `wheel_speed_controller.py`, and their component selections.
The Challenge 1 project remains unchanged.
