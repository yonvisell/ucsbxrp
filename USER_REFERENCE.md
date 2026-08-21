# UCSBXRP User Reference

This is the student-facing reference for UCSB XRP API revision `0.4-draft`
(`ucsb_xrp` `0.4.0-dev`). It describes the public behavior that student code
may rely on. The supplied reference components are examples, not prescribed
algorithms.

## Start here

A course project normally uses the supplied `Robot` service through the
factory in `course_setup.py`. `Robot` owns sensor sampling, the fixed-rate loop,
motor output, odometry updates, telemetry, and live-parameter updates.

```python
from challenge import INITIAL_POSE, TRAVEL_DISTANCE_MM
from course_setup import make_robot
from robot_config import ROBOT_CONFIG, STRAIGHT_CONFIG
from ucsb_xrp import StraightLineController


robot = make_robot(ROBOT_CONFIG)
straight = StraightLineController(STRAIGHT_CONFIG)

try:
    state = robot.start(INITIAL_POSE)
    straight.start(state.measurements, TRAVEL_DISTANCE_MM)

    while not straight.is_complete():
        command = straight.update(state.measurements)
        state = robot.step(command)
finally:
    robot.stop()
```

In an IDE-managed run, `robot.start()` begins immediately. A program launched
directly on the XRP waits for the USER button before beginning. Do not add
`sleep_ms()` to the loop: `Robot.step()` maintains the configured sample
period. Always put `robot.stop()` in `finally`.

## Project files

| File | Purpose |
| --- | --- |
| `main.py` | Mission control: construct services, start the robot, sequence the task, and stop cleanly. |
| `challenge.py` | Task-specific poses, routes, maps, distances, and thresholds. |
| `robot_config.py` | Measured robot geometry, signs, calibration, controller gains, and reusable navigation settings. |
| `course_setup.py` | Assemble the robot and select each supplied or student component with a `USE_STUDENT_*` flag. |
| `sensor_model.py` | Student `SensorModel` implementation. |
| `wheel_speed_controller.py` | Student `WheelSpeedController` implementation. |
| `differential_drive.py` | Student `DifferentialDrive` implementation. |
| `odometry.py` | Student `Odometry` implementation. |
| `navigation_controller.py` | Student `NavigationController` implementation. |
| `grid_planner.py` | Student `GridPlanner` implementation. |

Use public names from `ucsb_xrp` in `main.py`, `challenge.py`, and
`robot_config.py`. Student component classes inherit their named base from
`ucsb_xrp.student_api`.

`course_setup.py` supplies the project-level factories used by the challenges:

- `make_robot(config)` -> assembled `Robot`
- `make_navigation_controller(config)` -> selected navigation controller,
  beginning in Challenge 3
- `make_grid_planner()` -> selected grid planner, beginning in Challenge 4

## Units and signs

| Quantity | Unit or convention |
| --- | --- |
| Distance, position, wheel travel, range | millimetres (`mm`) |
| Linear and wheel speed | millimetres per second (`mm/s`) |
| Device time | integer milliseconds (`ms`) |
| Calculated elapsed time | seconds (`s`) |
| Heading | radians (`rad`) |
| Turn rate | radians per second (`rad/s`) |
| Drive command | normalized, dimensionless, `-1.0` to `1.0` |

World `+x` is the reference forward direction and world `+y` points left.
Heading zero points along `+x`; positive heading and turn rate are
counterclockwise. Positive left or right wheel speed means forward wheel
motion. `RobotConfig` motor and encoder signs adapt these conventions to the
physical robot. `Pose` wraps heading into `[-pi, pi)`.

## The measured robot loop

### `Robot`

Projects normally obtain a `Robot` with `make_robot(ROBOT_CONFIG)` rather than
constructing it directly.

- `robot.start(initial_pose)` -> `RobotState`
  Resets encoders and student components, establishes the initial pose, and
  publishes the first state.
- `robot.step(command, read_range=False)` -> `RobotState`
  Runs one complete command, measurement, control, odometry, telemetry, and
  timing cycle. `command` must be a `MotionCommand`. Set `read_range=True` only
  on samples that need the ultrasonic sensor.
- `robot.estimate_range(samples, minimum_usable)` -> number or `None`
  Uses the selected `SensorModel` to combine repeated range readings.
- `robot.stop()` -> `None`
  Stops both motors and publishes a zero drive command.
- `robot.state` -> latest `RobotState`
  Available after `start()`.
- `robot.config` -> `RobotConfig`
- `robot.last_overrun_ms` -> integer or number
  Amount by which the latest loop calculation exceeded its sample deadline.

Every `step()` returns:

```text
RobotState
├── measurements : Measurements
└── pose         : Pose
```

The usual pattern is to replace `state` with each returned state. If any
component raises an exception during `step()`, `Robot` attempts to stop the
motors before re-raising it.

### `StraightLineController`

`StraightLineController(config)` is a supplied Challenge 1 service.

- `start(measurements, distance_mm)` starts a nonnegative forward move from the
  current mean wheel position.
- `update(measurements)` returns the next `MotionCommand`.
- `is_complete()` returns `True` once the requested distance is reached.

It uses the cruise speed, approach speed, slowdown distance, and position
tolerance in a `NavigationConfig`.

## Values passed between components

These records validate their inputs when constructed and expose read-only
properties.

| Value | Constructor and readable fields |
| --- | --- |
| Raw sensor sample | `RawSensors(time_ms, left_encoder_count, right_encoder_count, range_mm, button_pressed)` |
| Wheel speeds | `WheelSpeeds(left_mm_s, right_mm_s)` |
| Body-motion request | `MotionCommand(forward_speed_mm_s, turn_rate_rad_s)` |
| Motor command | `DriveCommand(left, right)` |
| Pose | `Pose(x_mm, y_mm, heading_rad)` |
| Navigation goal | `NavigationGoal(x_mm, y_mm, heading_rad=None)` |
| Robot state | `RobotState(measurements, pose)` |
| Grid coordinate | `GridCell(column, row)` |
| Grid route | `GridPath(cells)`; `.cells` is a tuple of adjacent `GridCell` values |

`STOP_COMMAND` is the shared `MotionCommand(0.0, 0.0)`. Use it when the robot
must remain stationary while taking a sample.

### `Measurements`

`Measurements` is normally produced by `SensorModel`, not constructed in
`main.py`.

```python
Measurements(
    time_ms,
    dt_s,
    left_position_mm,
    right_position_mm,
    left_increment_mm,
    right_increment_mm,
    left_speed_mm_s,
    right_speed_mm_s,
    range_mm,
    button_pressed,
)
```

It also provides `.wheel_speeds`, equivalent to
`WheelSpeeds(left_speed_mm_s, right_speed_mm_s)`. `range_mm` is `None` when no
usable range was requested or returned.

## Components students implement

Each challenge project initially selects the supplied component. After a student
implementation passes its software tests, change only its corresponding
`USE_STUDENT_*` flag in `course_setup.py`.

### Responsibility and data flow

| Component | Owns | Receives | State it maintains | Output and users |
| --- | --- | --- | --- | --- |
| `SensorModel` | Encoder-to-distance conversion, regularized wheel-speed estimation, and robust range estimation | `RawSensors`; robot geometry, encoder signs, and speed-filter setting from `RobotConfig` | Encoder/time origins, previous counts and time, current wheel-speed estimates | `Measurements`; wheel speeds go to `WheelSpeedController`, increments go to `Odometry`, and range/travel/button values go to mission code |
| `WheelSpeedController` | Wheel-speed feedback and bounded motor command | Target `WheelSpeeds` from `DifferentialDrive`; measured `WheelSpeeds` from `SensorModel`; calibration and gains | Any controller memory selected by the implementation; the supplied proportional example has no error history | `DriveCommand`, passed by `Robot` to `XRPBot` |
| `DifferentialDrive` | Body-to-wheel inverse kinematics | `MotionCommand` and track width | No time history is required | Target `WheelSpeeds` for `WheelSpeedController` |
| `Odometry` | Integration of measured wheel-distance increments into pose | Initial `Pose`, left/right increments from `SensorModel`, and track width | Latest estimated `Pose` | `Pose` for navigation, mission code, `RobotState`, and telemetry; simulator truth is not an input |
| `NavigationController` | Progress through ordered position and optional-heading goals | Goals, latest odometry `Pose`, navigation speeds and tolerances | Goal list, active goal, and any turn/drive/alignment mode | `MotionCommand` for the next `Robot.step()` |
| `GridPlanner` | Shortest-path search through free occupancy-grid cells | Grid, start cell, and goal cell | Search-local frontier, visited, and predecessor data; no persistent state is required | `GridPath`, converted to goals before navigation |

### `SensorModel(SensorModelBase)`

- `reset(raw)` -> `Measurements`
  Accepts a `RawSensors` value, establishes the encoder and time origins, and
  returns a zero-travel measurement that preserves the current timestamp,
  range, and USER-button state.
- `update(raw)` -> `Measurements`
  Converts signed encoder-count changes and elapsed device time into total
  wheel positions, latest increments, and regularized wheel-speed estimates.
  Exact distance increments remain unfiltered. It must be called after
  `reset()`.
- `estimate_range(samples, minimum_usable)` -> number or `None`
  Rejects missing, nonfinite, and nonpositive readings. It returns the median
  of the usable ranges when at least `minimum_usable` remain; otherwise it
  returns `None`.

The inherited `.config` is the project `RobotConfig`.

### `WheelSpeedController(WheelSpeedControllerBase)`

- `reset()` -> `None` prepares any controller state for a new run.
- `update(target, measured)` -> `DriveCommand` accepts two `WheelSpeeds`
  values: the requested and measured speeds.

The output is bounded by `config.max_drive_command`. A zero target for either
wheel produces an exact zero command for that wheel. Calibration and feedback
may be implemented clearly without copying the supplied algorithm.

### `DifferentialDrive(DifferentialDriveBase)`

- `wheel_speeds(command)` -> `WheelSpeeds` converts a `MotionCommand` for the
  robot body into requested left and right wheel speeds using
  `config.track_width_mm` and the course sign convention.

### `Odometry(OdometryBase)`

- `reset(initial_pose)` -> `Pose` establishes the pose for a new run.
- `update(left_increment_mm, right_increment_mm)` -> `Pose` integrates one
  differential-drive motion increment, including curved motion.
- `.pose` -> latest `Pose`; it is available after `reset()`.

### `NavigationController(NavigationControllerBase)`

- `start(goals)` -> `None` accepts an ordered tuple or list of
  `NavigationGoal` values.
- `update(pose)` -> `MotionCommand` returns the next body-motion request.
- `current_goal()` -> `NavigationGoal` or `None`.
- `is_complete()` -> Boolean.

The controller visits goals in order. A goal with `heading_rad=None` requires
position only; a numerical final heading must also be reached. Once complete,
`update()` returns `STOP_COMMAND`. The inherited `.config` is the project
`NavigationConfig`.

### `GridPlanner(GridPlannerBase)`

- `plan(grid, start, goal)` -> `GridPath` or `None`.

`grid` is an `OccupancyGrid`; `start` and `goal` are `GridCell` values or
`None`. Return a shortest valid four-neighbor path including both endpoints.
Return `None` if either endpoint is unavailable or blocked, or if no path
exists. The required behavior does not prescribe a frontier data structure or
a tie-breaking rule.

## Adjustable parameters and watch values

`ucsb_xrp.live` exposes compact controls in the Monitor. Declare parameters
once, usually near the top of `main.py`, and read their `.value` properties in
the loop.

```python
from ucsb_xrp import live


SPEED = live.number(
    "forward_speed_mm_s",
    100.0,
    minimum=50.0,
    maximum=200.0,
    step=10.0,
    unit="mm/s",
    label="Forward speed",
)
ENABLED = live.toggle("enabled", True, label="Controller enabled")
MODE = live.choice(
    "mode",
    "normal",
    options=("normal", "careful"),
    label="Drive mode",
)

live.watch("speed_error", 12.5, unit="mm/s", label="Speed error")
```

- `live.number(name, default, minimum, maximum, step, unit="", label=None)` ->
  numeric live parameter. The Monitor renders a bounded slider.
- `live.toggle(name, default, label=None)` -> Boolean live parameter.
- `live.choice(name, default, options, label=None)` -> string live parameter
  with two to six choices.
- `live.watch(name, value, unit="", label=None)` -> `None`; publishes the
  latest number, Boolean, or short string under that name.
- `live.apply_updates()` -> Boolean; applies pending parameter values and
  reports whether one changed.

`Robot.step()` calls `live.apply_updates()` automatically at a sample
boundary. Call it explicitly only in a program that does not use `Robot`.
Parameter names are Python-style identifiers and must be unique. A project may
declare up to 16 parameters and 16 watch values.

Use watch values for current modes, errors, and intermediate estimates. Use
Monitor telemetry and CSV recording for time histories. Reserve `print()` for
occasional milestones or messages that belong in program output; do not print
every sample merely to build a measurement log.

## Maps, grids, paths, and missions

### Geometry and occupancy

- `Rectangle(minimum_x_mm, minimum_y_mm, maximum_x_mm, maximum_y_mm)`
  Properties: `.bounds_mm`; method: `contains(x_mm, y_mm, margin_mm=0.0)`.
- `ArenaMap(bounds_mm, obstacles=(), features=None, blocked_features=())`
  `bounds_mm` and each obstacle/feature may be a `Rectangle` or four-number
  bounds. Properties: `.bounds_mm`, `.obstacles`, `.feature_names`, and
  `.blocked_features`. Methods:
  - `feature_bounds(name)` -> four-number bounds
  - `contains(x_mm, y_mm)` -> Boolean
  - `is_free(x_mm, y_mm, clearance_mm=0.0)` -> Boolean
  - `with_feature_blocked(name, blocked)` -> new `ArenaMap`
- `OccupancyGrid.from_arena(arena, resolution_mm, clearance_mm=0.0)` ->
  `OccupancyGrid`.

For direct software tests, the full constructor is
`OccupancyGrid(resolution_mm, origin_x_mm, origin_y_mm, column_count,
row_count, blocked)`. `blocked` is a row-major sequence with one Boolean-like
value per cell.

An `OccupancyGrid` provides:

- `.resolution_mm`, `.origin_x_mm`, `.origin_y_mm`, `.column_count`, and
  `.row_count`
- `world_to_cell(x_mm, y_mm)` -> `GridCell` or `None`
- `cell_center(cell)` -> `(x_mm, y_mm)`
- `contains(cell)` -> Boolean
- `is_blocked(cell)` -> Boolean; outside cells are blocked
- `neighbors(cell)` -> tuple of free four-neighbor cells

`GridCell.column` increases with world `x`; `GridCell.row` increases with
world `y`. `GridPath.to_goals(grid, final_heading_rad=None)` converts a cell
path into a compact tuple of `NavigationGoal` values at turns and at the final
cell.

### `DeliveryTask` and `DeliveryMission`

Challenge 5 describes one mission with:

```python
DeliveryTask(
    initial_pose,
    arena,
    grid_resolution_mm,
    clearance_mm,
    destination,
    observed_feature_name,
    range_sample_count,
    minimum_usable_range_count,
    blocked_range_threshold_mm,
    assume_blocked_without_range,
)
```

All constructor arguments are available as read-only properties.

`DeliveryMission(task, navigation, planner)` supplies the observation,
map-update, planning, and navigation sequence:

- `run(robot)` -> final `RobotState`; it always calls `robot.stop()`.
- `.result` -> `"delivered"`, `"no_path"`, or `None` before completion.
- `.task` -> the `DeliveryTask`.

## Configuration records

### `RobotConfig`

The constructor accepts the following keyword fields. This example writes the
effective defaults explicitly:

```python
RobotConfig(
    sample_period_ms=20,
    wheel_diameter_mm=60.0,
    encoder_counts_per_revolution=585.0,
    track_width_mm=155.0,
    left_motor_sign=1,
    right_motor_sign=1,
    left_encoder_sign=1,
    right_encoder_sign=1,
    left_start_command=0.0,
    right_start_command=0.0,
    left_speed_command_gain=0.0,
    right_speed_command_gain=0.0,
    wheel_speed_filter_time_constant_ms=80.0,
    wheel_speed_kp=0.0,
    max_drive_command=1.0,
)
```

Internally, the five command-related arguments use `None` when omitted so that
older field names can still be recognized; the resulting effective defaults
are the numerical values shown above. The record is immutable. Construct a new
one in `robot_config.py` when values change. Signs must be `-1` or `1`;
`max_drive_command` must be in `[0.0, 1.0]`. The left/right start commands and
speed-command gains provide separately measured feedforward calibration;
`wheel_speed_filter_time_constant_ms` sets the response time of the
encoder-derived speed estimate (`0.0` disables regularization), and
`wheel_speed_kp` is the proportional feedback gain.

### `NavigationConfig`

```python
NavigationConfig(
    cruise_speed_mm_s,
    approach_speed_mm_s,
    slowdown_distance_mm,
    turn_rate_rad_s,
    position_tolerance_mm,
    heading_tolerance_rad,
    realign_heading_rad,
)
```

`approach_speed_mm_s` cannot exceed `cruise_speed_mm_s`.
`realign_heading_rad` cannot be smaller than `heading_tolerance_rad`. All
arguments are available as same-named read-only properties.

## Low-level XRP access

Most projects should use `Robot`. `XRPBot(config)` is the lower-level boundary
for a deliberate hardware experiment or diagnostic:

- `read(include_range=False)` -> `RawSensors`
- `reset_encoders()` -> `None`
- `wait_for_button()` -> `None`
- `set_drive(command)` -> `None`; accepts a `DriveCommand`
- `stop()` -> `None`
- `.config` -> `RobotConfig`

`XRPBot` alone imports XRPLib, converts valid rangefinder readings from
centimetres to millimetres, applies configured motor signs and the final drive
bound, and attempts to stop both motors after a failed write.

## Numerical helpers

- `clamp(value, lower, upper)` -> value limited to the inclusive interval.
- `elapsed_time_s(later_ms, earlier_ms)` -> wrap-safe device-time difference
  in seconds.
- `wrap_angle_rad(angle_rad)` -> equivalent angle in `[-pi, pi)`.
- `distance_to_goal(pose, goal)` -> planar distance in millimetres.
- `bearing_to_goal(pose, goal)` -> wrapped world-frame bearing in radians.

## IDE and Monitor services

These are application actions, not Python functions:

- **Validate** compiles every project Python file with MicroPython without
  running it.
- **Flash project** writes the current complete project to a physical XRP.
- **Run** starts the selected main file on the virtual or physical XRP and
  becomes **Stop** while it is active.
- **Monitor** receives program output, live values, telemetry, world pose, and
  recordings from the selected target.
- **Set up or repair XRP** installs or repairs the firmware, course library,
  reference bytecode, robot service, and Wi-Fi profile over USB-C.

The web application automatically publishes telemetry from programs that use
`Robot`. Student code does not call the private telemetry channel.

## Compatibility and errors

- `MotorEfforts` is an old name for exactly the same value type as
  `DriveCommand`; use `DriveCommand` in new code.
- `XRPBot.set_efforts()` and the old `RobotConfig` field names ending in
  `_effort` remain only so projects created before API 0.3 still run.
- Names beginning with `_` and runtime transport functions not listed here are
  implementation details, not student API.
- Public values reject wrong types, nonfinite numerical values, invalid ranges,
  and inconsistent configuration when constructed. Keep values in their
  documented units rather than compensating after an exception.
- A missing ultrasonic reading is `None`; it is not zero range and should not
  be treated as an obstacle measurement.
