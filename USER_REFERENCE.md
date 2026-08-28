# UCSB XRP API reference

API version: `0.4.0-dev`. This file is generated from `course_content/api-reference.json`; edit the catalog rather than this file.

This reference describes the Python classes, values, and functions that a course project may use. The supplied reference components are working examples; students may use a different algorithm when it satisfies the stated behavior.

## Units and coordinate conventions

- Distances, positions, wheel travel, and range use millimeters (mm).
- Linear and wheel speeds use millimeters per second (mm/s). Device timestamps use integer milliseconds; calculated elapsed time uses seconds.
- Angles use radians and turn rates use radians per second. Positive heading and turn rate are counterclockwise.
- A DriveCommand is dimensionless and each wheel command is within -1.0 to 1.0.
- World +x is the reference forward direction and world +y points left. Positive wheel speed means forward wheel motion.

## Components you implement

Each student component inherits the corresponding base class from ucsb_xrp.student_api. The base constructor checks the configuration and stores the same object as the read-only self.config property. Robot or supplied mission code calls the methods below; the project class supplies their calculations.

### `SensorModel`

Convert direct XRP sensor readings into measured wheel motion, wheel-speed estimates, range, and USER-button state.

- **Kind:** student component
- **Project file:** `sensor_model.py`
- **Base class:** `SensorModelBase`

```python
class SensorModel(SensorModelBase)
```

The base class defines the public methods below. Its constructor stores the supplied `RobotConfig` as the read-only `self.config` property. The project class implements those methods.

**Information retained between calls:**

After reset(), retain the encoder and time origins, the preceding sample, elapsed-time information, and the recent samples or equivalent state used to estimate wheel speed. Total wheel positions are calculated relative to the reset origins; they do not need separate accumulated position state.

**Configuration used:** `sample_period_ms`, `wheel_diameter_mm`, `encoder_counts_per_revolution`, `left_encoder_sign`, `right_encoder_sign`, `wheel_speed_filter_time_constant_ms`.

#### `reset()`

```python
reset(raw: RawSensors) -> Measurements
```

Establish the encoder and time origins for a new run.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `raw` | `RawSensors` | — | — | First hardware sample after Robot resets the encoders. |

**Returns:** `Measurements` — A measurement at raw.time_ms with zero positions, increments, speeds, and dt_s, while preserving raw.range_mm and raw.button_pressed.

**Required behavior**

- Prepare update() to process the next chronological sample.
- Reset all wheel-speed estimator history so the first reported speeds are zero.

**Exceptions**

- TypeError if raw is not a RawSensors value.

#### `update()`

```python
update(raw: RawSensors) -> Measurements
```

Convert the next hardware sample into physical measurements.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `raw` | `RawSensors` | — | — | Next encoder, device-time, range, and USER-button sample. |

**Returns:** `Measurements` — Cumulative wheel positions from the reset origins, the latest unsmoothed wheel increments, regularized wheel-speed estimates, elapsed time, range, and button state.

**Required behavior**

- Apply the configured encoder signs, wheel diameter, and encoder counts per revolution.
- Calculate dt_s from consecutive device timestamps with elapsed_time_s().
- Do not smooth left_increment_mm or right_increment_mm; odometry uses the measured increments.
- Estimate wheel speed from recent samples or an equivalent regularized estimator whose response is set by wheel_speed_filter_time_constant_ms. The exact estimator algorithm is not prescribed.
- If no positive time has elapsed, report dt_s as zero without dividing by zero; positions and increments still follow the new encoder counts.
- Preserve raw.range_mm and raw.button_pressed in the returned Measurements.

**Exceptions**

- RuntimeError if reset() has not been called.
- TypeError if raw is not a RawSensors value.

#### `estimate_range()`

```python
estimate_range(samples, minimum_usable: int) -> float | None
```

Combine repeated ultrasonic readings while rejecting unusable values.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `samples` | `sequence[float | None]` | — | mm | Range readings to combine. |
| `minimum_usable` | `int` | — | — | Minimum number of usable readings required; must be at least 1. |

**Returns:** `float | None` — Median of the finite, positive, non-Boolean readings, or None when too few usable readings remain.

**Exceptions**

- TypeError if minimum_usable is not an integer or samples cannot be iterated.
- ValueError if minimum_usable is less than 1.

**Measure one encoder update**

```python
from robot_config import ROBOT_CONFIG
from sensor_model import SensorModel
from ucsb_xrp import RawSensors

model = SensorModel(ROBOT_CONFIG)
model.reset(RawSensors(0, 0, 0, None, False))
measurement = model.update(RawSensors(20, 4, 5, None, False))
print(measurement.left_increment_mm)
print(measurement.left_speed_mm_s)
```

### `WheelSpeedController`

Calculate bounded left and right motor commands from requested wheel speeds and measured wheel-speed estimates.

- **Kind:** student component
- **Project file:** `wheel_speed_controller.py`
- **Base class:** `WheelSpeedControllerBase`

```python
class WheelSpeedController(WheelSpeedControllerBase)
```

The base class defines the public methods below. Its constructor stores the supplied `RobotConfig` as the read-only `self.config` property. The project class implements those methods.

**Information retained between calls:**

An implementation may retain controller state between samples. reset() must return that state to its initial condition before each run.

**Configuration used:** `left_start_command`, `right_start_command`, `left_speed_command_gain`, `right_speed_command_gain`, `wheel_speed_kp`, `max_drive_command`.

#### `reset()`

```python
reset() -> None
```

Prepare controller state for a new run.

**Returns:** `None` — No value.

#### `update()`

```python
update(target: WheelSpeeds, measured: WheelSpeeds) -> DriveCommand
```

Calculate the next motor command for both wheels.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `target` | `WheelSpeeds` | — | mm/s | Requested left and right wheel speeds from DifferentialDrive. |
| `measured` | `WheelSpeeds` | — | mm/s | Latest regularized wheel-speed estimates from SensorModel. |

**Returns:** `DriveCommand` — Normalized left and right motor commands bounded by config.max_drive_command.

**Required behavior**

- Return an exact zero command for a wheel whose requested speed is zero.
- Keep each command within plus or minus config.max_drive_command.
- For a nonzero requested speed, a larger speed error in the requested direction must produce a stronger command than a smaller error under the same conditions.

**Exceptions**

- TypeError if target or measured is not a WheelSpeeds value.

### `DifferentialDrive`

Convert requested robot forward speed and turn rate into target left and right wheel speeds.

- **Kind:** student component
- **Project file:** `differential_drive.py`
- **Base class:** `DifferentialDriveBase`

```python
class DifferentialDrive(DifferentialDriveBase)
```

The base class defines the public methods below. Its constructor stores the supplied `RobotConfig` as the read-only `self.config` property. The project class implements those methods.

**Information retained between calls:**

Each calculation is independent; the component does not need to retain state between calls.

**Configuration used:** `track_width_mm`.

#### `wheel_speeds()`

```python
wheel_speeds(command: MotionCommand) -> WheelSpeeds
```

Calculate target wheel speeds for one body-motion request.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `command` | `MotionCommand` | — | — | Requested forward speed and counterclockwise turn rate. |

**Returns:** `WheelSpeeds` — Target left and right wheel speeds in mm/s.

**Required behavior**

- For track width b, forward speed v, and turn rate omega, return left speed v - omega*b/2 and right speed v + omega*b/2.
- Positive turn rate therefore requests a faster right wheel than left wheel.

**Exceptions**

- TypeError if command is not a MotionCommand value.

### `Odometry`

Update the estimated world position and heading from measured left and right wheel travel.

- **Kind:** student component
- **Project file:** `odometry.py`
- **Base class:** `OdometryBase`

```python
class Odometry(OdometryBase)
```

The base class defines the public methods below. Its constructor stores the supplied `RobotConfig` as the read-only `self.config` property. The project class implements those methods.

**Information retained between calls:**

After reset(), retain the latest Pose. Simulator ground-truth position is not an input.

**Configuration used:** `track_width_mm`.

**Readable fields**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `pose` | `Pose` | — | — | Latest estimated pose; available after reset(). |

#### `reset()`

```python
reset(initial_pose: Pose) -> Pose
```

Set the pose for a new run.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `initial_pose` | `Pose` | — | — | Known starting position and heading. |

**Returns:** `Pose` — The established initial pose.

**Exceptions**

- TypeError if initial_pose is not a Pose value.

#### `update()`

```python
update(left_increment_mm: float, right_increment_mm: float) -> Pose
```

Integrate one differential-drive wheel-travel increment.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `left_increment_mm` | `float` | — | mm | Signed left-wheel travel since the preceding sample. |
| `right_increment_mm` | `float` | — | mm | Signed right-wheel travel since the preceding sample. |

**Returns:** `Pose` — Updated pose with heading wrapped to [-pi, pi).

**Required behavior**

- Use d=(left_increment_mm+right_increment_mm)/2 and dtheta=(right_increment_mm-left_increment_mm)/track_width_mm.
- For dtheta equal to zero, translate by d at the current heading.
- For nonzero dtheta, integrate the exact constant-curvature arc: radius=d/dtheta, dx=radius*(sin(theta+dtheta)-sin(theta)), and dy=-radius*(cos(theta+dtheta)-cos(theta)).
- Retain and return the new pose.

**Exceptions**

- RuntimeError if reset() has not been called.
- TypeError for Boolean or nonnumeric increments.

### `NavigationController`

Generate motion commands that visit an ordered sequence of world-coordinate goals.

- **Kind:** student component
- **Project file:** `navigation_controller.py`
- **Base class:** `NavigationControllerBase`

```python
class NavigationController(NavigationControllerBase)
```

The base class defines the public methods below. Its constructor stores the supplied `NavigationConfig` as the read-only `self.config` property. The project class implements those methods.

**Information retained between calls:**

Retain the ordered goals, the active goal, completion state, and any turn/drive/realignment phase used by the implementation.

#### `start()`

```python
start(goals: sequence[NavigationGoal]) -> None
```

Store an ordered goal sequence and begin navigation.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `goals` | `sequence[NavigationGoal]` | — | — | Tuple or list of navigation goals in visit order; it may be empty. |

**Returns:** `None` — No value.

**Required behavior**

- An empty goal sequence is immediately complete; current_goal() returns None and update() returns STOP_COMMAND.

#### `update()`

```python
update(pose: Pose) -> MotionCommand
```

Calculate the next motion request from the latest odometry pose.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `pose` | `Pose` | — | — | Current odometry estimate. |

**Returns:** `MotionCommand` — Forward-speed and turn-rate request for the next Robot step.

**Required behavior**

- Use wrap-safe heading errors.
- Turn toward a goal before driving forward when the heading error is large.
- Use approach speed within config.slowdown_distance_mm of the goal and realign if the heading error grows beyond config.realign_heading_rad.
- Visit goals in their supplied order. A goal with heading_rad=None requires position only; a numerical final heading must also be reached.
- After all goals are complete, return STOP_COMMAND.

#### `current_goal()`

```python
current_goal() -> NavigationGoal | None
```

Return the active goal, or None after completion.

**Returns:** `NavigationGoal | None` — Current goal or None.

#### `is_complete()`

```python
is_complete() -> bool
```

Report whether every required position and heading is complete.

**Returns:** `bool` — True only after the complete goal sequence has been reached.

### `GridPlanner`

Find a connected route through free cells in an occupancy grid.

- **Kind:** student component
- **Project file:** `grid_planner.py`
- **Base class:** `GridPlannerBase`

```python
class GridPlanner(GridPlannerBase)
```

The base class defines the public methods below. It requires no configuration constructor. The project class implements those methods.

**Information retained between calls:**

Search state may remain local to each plan() call.

#### `plan()`

```python
plan(grid: OccupancyGrid, start: GridCell | None, goal: GridCell | None) -> GridPath | None
```

Find a valid connected route from the start cell to the goal cell.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `grid` | `OccupancyGrid` | — | — | Map of free and blocked cells. |
| `start` | `GridCell | None` | — | — | Starting cell, or None when the position lies outside the grid. |
| `goal` | `GridCell | None` | — | — | Destination cell, or None when the position lies outside the grid. |

**Returns:** `GridPath | None` — A route including both endpoints, or None when an endpoint is unavailable or blocked or no route exists.

**Required behavior**

- Use only free cells and move between cells that share a horizontal or vertical edge.
- Any route that connects the endpoints through free edge-adjacent cells is accepted.

## Robot services

Use Robot for ordinary course programs. It assembles the selected components into the timed robot control cycle.

### `Robot`

Run the timed measurement, motor-control, odometry, telemetry, and live-parameter cycle.

- **Kind:** supplied class
- **Import:** `from ucsb_xrp import Robot`

```python
Robot(config, bot, sensor_model, wheel_controller, differential_drive, odometry)
```

**Information retained between calls:**

Retains the selected components, latest RobotState, next absolute sample deadline, and latest timing overrun. Projects normally obtain a configured instance with make_robot(ROBOT_CONFIG).

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `config` | `RobotConfig` | — | — | Timing, geometry, calibration, gains, and limits. |
| `bot` | `XRPBot` | — | — | Physical or simulated hardware boundary. |
| `sensor_model` | `SensorModel` | — | — | Selected sensor interpretation component. |
| `wheel_controller` | `WheelSpeedController` | — | — | Selected wheel-speed controller. |
| `differential_drive` | `DifferentialDrive` | — | — | Selected body-to-wheel conversion component. |
| `odometry` | `Odometry` | — | — | Selected pose-estimation component. |

**Readable fields**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `config` | `RobotConfig` | — | — | Robot configuration supplied at construction. |
| `state` | `RobotState` | — | — | Latest state; raises RuntimeError before start(). |
| `last_overrun_ms` | `int` | — | ms | Amount by which the latest calculation exceeded its sample deadline, or zero. |

#### `start()`

```python
start(initial_pose: Pose) -> RobotState
```

Reset encoders and components and begin a run.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `initial_pose` | `Pose` | — | — | Known starting pose. |

**Returns:** `RobotState` — Initial zero-travel measurement and pose.

**Required behavior**

- An IDE-managed Run begins immediately. A project launched directly on the XRP waits for the USER button.

#### `step()`

```python
step(command: MotionCommand, read_range: bool = False) -> RobotState
```

Execute one complete robot control cycle.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `command` | `MotionCommand` | — | — | Requested body motion. |
| `read_range` | `bool` | False | — | Request an ultrasonic reading for this sample. |

**Returns:** `RobotState` — New measurements and odometry pose.

**Required behavior**

- Stops the motors before re-raising an exception from the cycle.
- Maintains the configured absolute sample schedule; do not add sleep_ms() inside the control loop.

#### `estimate_range()`

```python
estimate_range(samples, minimum_usable: int) -> float | None
```

Use the selected SensorModel to combine range readings.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `samples` | `sequence[float | None]` | — | mm | Range readings to combine. |
| `minimum_usable` | `int` | — | — | Minimum number of usable readings required. |

**Returns:** `float | None` — Range estimate in mm, or None.

#### `stop()`

```python
stop() -> None
```

Stop both motors and publish a zero drive command.

**Returns:** `None` — No value.

### `StraightLineController`

Request cruise, approach, or zero forward speed from measured mean wheel travel.

- **Kind:** supplied class
- **Import:** `from ucsb_xrp import StraightLineController`

```python
StraightLineController(config: NavigationConfig)
```

**Information retained between calls:**

Retains the starting mean wheel position, requested distance, and completion state.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `config` | `NavigationConfig` | — | — | Cruise and approach speeds, slowdown distance, and position tolerance. |

#### `start()`

```python
start(measurements: Measurements, distance_mm: float) -> None
```

Begin a nonnegative forward move from the current mean wheel position.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `measurements` | `Measurements` | — | — | Measurements at the beginning of the move. |
| `distance_mm` | `float` | — | mm | Requested nonnegative forward travel. |

**Returns:** `None` — No value.

#### `update()`

```python
update(measurements: Measurements) -> MotionCommand
```

Return cruise, approach, or stop command from remaining distance.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `measurements` | `Measurements` | — | — | Latest measured wheel positions. |

**Returns:** `MotionCommand` — Next straight-line motion request.

#### `is_complete()`

```python
is_complete() -> bool
```

Report whether the distance is within the position tolerance.

**Returns:** `bool` — Completion state.

## Data types

These validated values carry information between components. Their public fields are read-only.

### `RawSensors`

Store one direct hardware sample.

- **Kind:** value record

```python
RawSensors(time_ms, left_encoder_count, right_encoder_count, range_mm, button_pressed)
```

**Readable fields**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `time_ms` | `int` | — | ms | Device timestamp. |
| `left_encoder_count` | `int` | — | count | Left encoder count relative to the latest reset. |
| `right_encoder_count` | `int` | — | count | Right encoder count relative to the latest reset. |
| `range_mm` | `float | None` | — | mm | Ultrasonic range, or None when unavailable or not requested. |
| `button_pressed` | `bool` | — | — | Current USER-button state. |

### `Measurements`

Store sensor-derived motion and range values for one sample.

- **Kind:** value record

```python
Measurements(time_ms, dt_s, left_position_mm, right_position_mm, left_increment_mm, right_increment_mm, left_speed_mm_s, right_speed_mm_s, range_mm, button_pressed)
```

**Readable fields**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `time_ms` | `int` | — | ms | Device timestamp. |
| `dt_s` | `float` | — | s | Elapsed time from the preceding sample. |
| `left_position_mm` | `float` | — | mm | Cumulative left-wheel travel since reset. |
| `right_position_mm` | `float` | — | mm | Cumulative right-wheel travel since reset. |
| `left_increment_mm` | `float` | — | mm | Unsmoothed left-wheel travel since the preceding sample. |
| `right_increment_mm` | `float` | — | mm | Unsmoothed right-wheel travel since the preceding sample. |
| `left_speed_mm_s` | `float` | — | mm/s | Regularized left-wheel speed estimate. |
| `right_speed_mm_s` | `float` | — | mm/s | Regularized right-wheel speed estimate. |
| `range_mm` | `float | None` | — | mm | Range reading or None. |
| `button_pressed` | `bool` | — | — | USER-button state. |
| `wheel_speeds` | `WheelSpeeds` | — | — | Left and right speed estimates as one value. |

### `WheelSpeeds`

Store left and right wheel speeds.

- **Kind:** value record

```python
WheelSpeeds(left_mm_s, right_mm_s)
```

**Readable fields**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `left_mm_s` | `float` | — | mm/s | Left-wheel speed. |
| `right_mm_s` | `float` | — | mm/s | Right-wheel speed. |

### `MotionCommand`

Store requested robot-body motion.

- **Kind:** value record

```python
MotionCommand(forward_speed_mm_s, turn_rate_rad_s)
```

**Readable fields**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `forward_speed_mm_s` | `float` | — | mm/s | Requested forward speed. |
| `turn_rate_rad_s` | `float` | — | rad/s | Requested counterclockwise turn rate. |

### `DriveCommand`

Store normalized left and right motor commands before hardware sign conversion.

- **Kind:** value record

```python
DriveCommand(left, right)
```

**Readable fields**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `left` | `float` | — | — | Left command in [-1.0, 1.0]. |
| `right` | `float` | — | — | Right command in [-1.0, 1.0]. |

**Notes**

- MotorEfforts is a compatibility name for the same type. Use DriveCommand in new code.

### `Pose`

Store estimated position and heading in world coordinates.

- **Kind:** value record

```python
Pose(x_mm, y_mm, heading_rad)
```

**Readable fields**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `x_mm` | `float` | — | mm | World x position. |
| `y_mm` | `float` | — | mm | World y position. |
| `heading_rad` | `float` | — | rad | Heading wrapped to [-pi, pi). |

### `RobotState`

Pair the measurements and odometry pose returned by one robot sample.

- **Kind:** value record

```python
RobotState(measurements: Measurements, pose: Pose)
```

**Readable fields**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `measurements` | `Measurements` | — | — | Sensor-derived values. |
| `pose` | `Pose` | — | — | Odometry estimate. |

### `NavigationGoal`

Store a destination position and optional required heading.

- **Kind:** value record

```python
NavigationGoal(x_mm, y_mm, heading_rad=None)
```

**Readable fields**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `x_mm` | `float` | — | mm | Destination x position. |
| `y_mm` | `float` | — | mm | Destination y position. |
| `heading_rad` | `float | None` | — | rad | Required final heading, or None for position only. |

### `GridCell`

Store one integer occupancy-grid coordinate.

- **Kind:** value record

```python
GridCell(column, row)
```

**Readable fields**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `column` | `int` | — | — | Column increasing with world x. |
| `row` | `int` | — | — | Row increasing with world y. |

### `GridPath`

Store an ordered route of edge-adjacent grid cells.

- **Kind:** value record

```python
GridPath(cells)
```

**Readable fields**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `cells` | `tuple[GridCell, ...]` | — | — | Nonempty route of horizontally or vertically adjacent cells. |

#### `to_goals()`

```python
to_goals(grid: OccupancyGrid, final_heading_rad: float | None = None) -> tuple[NavigationGoal, ...]
```

Convert the route to compact goals at turns and the final cell.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `grid` | `OccupancyGrid` | — | — | Grid used to convert cell centers to world coordinates. |
| `final_heading_rad` | `float | None` | None | rad | Optional heading required at the final goal. |

**Returns:** `tuple[NavigationGoal, ...]` — World-coordinate navigation goals.

### `STOP_COMMAND`

Shared zero-motion request.

- **Kind:** constant

```python
STOP_COMMAND = MotionCommand(0.0, 0.0)
```

## Configuration

Configuration records validate their values at construction and then expose read-only fields. Construct a new record in robot_config.py when a setting changes.

### `RobotConfig`

Store robot timing, geometry, signs, motor calibration, wheel-speed estimator response, feedback gain, and command limit.

- **Kind:** configuration record

```python
RobotConfig(sample_period_ms=20, wheel_diameter_mm=60.0, encoder_counts_per_revolution=585.0, track_width_mm=155.0, left_motor_sign=1, right_motor_sign=1, left_encoder_sign=1, right_encoder_sign=1, left_start_command=0.0, right_start_command=0.0, left_speed_command_gain=0.0, right_speed_command_gain=0.0, wheel_speed_filter_time_constant_ms=80.0, wheel_speed_kp=0.0, max_drive_command=1.0)
```

**Readable fields**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `sample_period_ms` | `int` | 20 | ms | Robot sample period; at least 1. |
| `wheel_diameter_mm` | `float` | 60.0 | mm | Measured wheel diameter; positive. |
| `encoder_counts_per_revolution` | `float` | 585.0 | count/rev | Encoder counts for one wheel revolution; positive. |
| `track_width_mm` | `float` | 155.0 | mm | Effective separation between wheel paths used by drive and odometry calculations; positive. |
| `left_motor_sign` | `int` | 1 | — | +1 or -1 so positive logical command drives the left wheel forward. |
| `right_motor_sign` | `int` | 1 | — | +1 or -1 so positive logical command drives the right wheel forward. |
| `left_encoder_sign` | `int` | 1 | — | +1 or -1 so forward left-wheel travel is positive. |
| `right_encoder_sign` | `int` | 1 | — | +1 or -1 so forward right-wheel travel is positive. |
| `left_start_command` | `float` | 0.0 | — | Nonnegative left command used to overcome motor deadband. |
| `right_start_command` | `float` | 0.0 | — | Nonnegative right command used to overcome motor deadband. |
| `left_speed_command_gain` | `float` | 0.0 | s/mm | Left feedforward command per requested wheel speed. |
| `right_speed_command_gain` | `float` | 0.0 | s/mm | Right feedforward command per requested wheel speed. |
| `wheel_speed_filter_time_constant_ms` | `float` | 80.0 | ms | Response time of the encoder-derived wheel-speed estimate; zero disables regularization. |
| `wheel_speed_kp` | `float` | 0.0 | s/mm | Proportional motor-command correction per wheel-speed error. |
| `max_drive_command` | `float` | 1.0 | — | Final absolute command limit in [0.0, 1.0]. |

**Notes**

- For compatibility with projects created before API 0.3, the implementation also accepts the older argument names ending in _effort. New projects should use the names above.

### `NavigationConfig`

Store speeds, distances, angular rates, and tolerances used by supplied straight-line and student navigation controllers.

- **Kind:** configuration record

```python
NavigationConfig(cruise_speed_mm_s, approach_speed_mm_s, slowdown_distance_mm, turn_rate_rad_s, position_tolerance_mm, heading_tolerance_rad, realign_heading_rad)
```

**Readable fields**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `cruise_speed_mm_s` | `float` | — | mm/s | Normal forward speed; positive. |
| `approach_speed_mm_s` | `float` | — | mm/s | Reduced speed near a goal; positive and no greater than cruise speed. |
| `slowdown_distance_mm` | `float` | — | mm | Distance at which approach speed begins; positive. |
| `turn_rate_rad_s` | `float` | — | rad/s | Magnitude of turning command; positive. |
| `position_tolerance_mm` | `float` | — | mm | Nonnegative accepted position error. |
| `heading_tolerance_rad` | `float` | — | rad | Nonnegative accepted heading error. |
| `realign_heading_rad` | `float` | — | rad | Heading-error magnitude that triggers realignment; no smaller than heading tolerance. |

## Live controls and telemetry values

Import ucsb_xrp.live to create compact controls and publish selected program values to the Monitor. Declare controls once, then read each LiveParameter.value during the robot loop. Robot applies pending changes at sample boundaries.

### `ucsb_xrp.live`

Create Monitor controls and publish selected program values.

- **Kind:** module

### `LiveParameter`

Represent one Monitor control and the value currently applied to the program.

- **Kind:** value object

**Readable fields**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `value` | `float | bool | str` | — | — | Value currently applied to the program; read it but do not assign to it. |
| `name` | `str` | — | — | Python-style identifier. |
| `label` | `str` | — | — | Short Monitor label. |
| `kind` | `str` | — | — | number, toggle, or choice. |
| `unit` | `str` | — | — | Displayed unit or empty string. |
| `minimum` | `float | None` | — | — | Numeric slider lower bound. |
| `maximum` | `float | None` | — | — | Numeric slider upper bound. |
| `step` | `float | None` | — | — | Numeric slider increment. |
| `options` | `tuple[str, ...]` | — | — | Choice values, or an empty tuple. |

### `live.number`

Declare a bounded numeric slider.

- **Kind:** function

```python
live.number(name, default, minimum, maximum, step, unit='', label=None) -> LiveParameter
```

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `name` | `str` | — | — | Unique Python-style identifier, at most 32 characters. |
| `default` | `float` | — | — | Initial applied value. |
| `minimum` | `float` | — | — | Inclusive lower bound. |
| `maximum` | `float` | — | — | Inclusive upper bound. |
| `step` | `float` | — | — | Positive slider increment. |
| `unit` | `str` | '' | — | Short displayed unit. |
| `label` | `str | None` | None | — | Displayed label; derived from name when omitted. |

**Returns:** `LiveParameter` — Numeric control.

**Required behavior**

- maximum must exceed minimum; step must be positive and no larger than the range; default must lie inside the inclusive bounds.
- The range does not need to contain an exact whole number of steps. The applied value is the nearest available step within the bounds.

### `live.toggle`

Declare an on/off control.

- **Kind:** function

```python
live.toggle(name, default, label=None) -> LiveParameter
```

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `name` | `str` | — | — | Unique Python-style identifier. |
| `default` | `bool` | — | — | Initial applied state. |
| `label` | `str | None` | None | — | Displayed label; derived from name when omitted. |

**Returns:** `LiveParameter` — Boolean control.

### `live.choice`

Declare a control with two to six string choices.

- **Kind:** function

```python
live.choice(name, default, options, label=None) -> LiveParameter
```

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `name` | `str` | — | — | Unique Python-style identifier. |
| `default` | `str` | — | — | Initial applied choice; it must appear in options. |
| `options` | `sequence[str]` | — | — | Two to six unique choices. |
| `label` | `str | None` | None | — | Displayed label; derived from name when omitted. |

**Returns:** `LiveParameter` — Choice control.

### `live.watch`

Publish the latest number, Boolean, or short string as a named live value.

- **Kind:** function

```python
live.watch(name, value, unit='', label=None) -> None
```

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `name` | `str` | — | — | Unique Python-style identifier. |
| `value` | `float | bool | str` | — | — | Finite number, Boolean, or string of at most 64 characters. |
| `unit` | `str` | '' | — | Short displayed unit. |
| `label` | `str | None` | None | — | Displayed label; derived from name when omitted. |

**Returns:** `None` — No value.

### `live.plot`

Publish a finite numeric value as an optional Monitor strip-plot signal.

- **Kind:** function

```python
live.plot(name, value, unit='', label=None) -> None
```

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `name` | `str` | — | — | Unique Python-style identifier. |
| `value` | `float` | — | — | Finite numeric value for the current sample. |
| `unit` | `str` | '' | — | Short displayed unit. |
| `label` | `str | None` | None | — | Displayed label; derived from name when omitted. |

**Returns:** `None` — No value.

### `live.apply_updates`

Apply the latest Monitor control values at one program boundary.

- **Kind:** function

```python
live.apply_updates() -> bool
```

**Returns:** `bool` — True if at least one applied value changed.

**Notes**

- Robot.start() and Robot.step() call this automatically. Call it directly only in a program that does not use Robot.

## Worlds, maps, routes, and missions

### `ProjectWorld`

Provide one validated world from the project's world.json file.

- **Kind:** supplied class

**Readable fields**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `id` | `str` | — | — | World identifier. |
| `label` | `str` | — | — | Display name. |
| `bounds_mm` | `tuple[float, float, float, float]` | — | mm | World bounds. |
| `initial_pose` | `Pose` | — | — | Configured start pose. |
| `feature_names` | `tuple[str, ...]` | — | — | Named changeable obstacle features. |

#### `arena_map()`

```python
arena_map(blocked_features=()) -> ArenaMap
```

Build an arena map with selected features blocked.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `blocked_features` | `sequence[str]` | () | — | Feature names that should act as obstacles. |

**Returns:** `ArenaMap` — Validated map.

#### `waypoint()`

```python
waypoint(name: str) -> NavigationGoal
```

Return one named waypoint.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `name` | `str` | — | — | Waypoint name from world.json. |

**Returns:** `NavigationGoal` — Waypoint goal.

#### `waypoints()`

```python
waypoints() -> tuple[NavigationGoal, ...]
```

Return all waypoints in file order.

**Returns:** `tuple[NavigationGoal, ...]` — Waypoint sequence.

### `load_world`

Load the default or named world from a project JSON file.

- **Kind:** function

```python
load_world(path='world.json', world_id=None) -> ProjectWorld
```

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `path` | `str` | 'world.json' | — | Project world file. |
| `world_id` | `str | None` | None | — | World identifier; None selects default_world. |

**Returns:** `ProjectWorld` — Selected validated world.

### `Rectangle`

Represent a closed axis-aligned rectangle in world millimeters.

- **Kind:** value record

```python
Rectangle(minimum_x_mm, minimum_y_mm, maximum_x_mm, maximum_y_mm)
```

**Readable fields**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `minimum_x_mm` | `float` | — | mm | Minimum x boundary. |
| `minimum_y_mm` | `float` | — | mm | Minimum y boundary. |
| `maximum_x_mm` | `float` | — | mm | Maximum x boundary; greater than minimum_x_mm. |
| `maximum_y_mm` | `float` | — | mm | Maximum y boundary; greater than minimum_y_mm. |
| `bounds_mm` | `tuple[float, float, float, float]` | — | mm | Minimum and maximum x and y bounds. |

#### `contains()`

```python
contains(x_mm, y_mm, margin_mm=0.0) -> bool
```

Test whether a point lies inside bounds expanded by margin_mm.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `x_mm` | `float` | — | mm | Point x coordinate. |
| `y_mm` | `float` | — | mm | Point y coordinate. |
| `margin_mm` | `float` | 0.0 | mm | Nonnegative outward expansion. |

**Returns:** `bool` — Containment result.

### `ArenaMap`

Represent rectangular arena bounds, fixed obstacles, and named changeable obstacle features.

- **Kind:** supplied class

```python
ArenaMap(bounds_mm, obstacles=(), features=None, blocked_features=())
```

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `bounds_mm` | `Rectangle | sequence[float]` | — | mm | Arena bounds as a Rectangle or four-number bounds. |
| `obstacles` | `sequence[Rectangle]` | () | — | Fixed obstacles. |
| `features` | `dict[str, Rectangle] | None` | None | — | Named changeable rectangles. |
| `blocked_features` | `sequence[str]` | () | — | Feature names initially treated as obstacles. |

**Readable fields**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `bounds_mm` | `tuple[float, float, float, float]` | — | mm | Arena bounds. |
| `obstacles` | `tuple[Rectangle, ...]` | — | — | Fixed obstacles. |
| `feature_names` | `tuple[str, ...]` | — | — | Named features. |
| `blocked_features` | `tuple[str, ...]` | — | — | Features currently treated as obstacles. |

#### `feature_bounds()`

```python
feature_bounds(name: str) -> tuple[float, float, float, float]
```

Return one feature's bounds.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `name` | `str` | — | — | Known feature name. |

**Returns:** `tuple[float, float, float, float]` — Feature bounds in millimeters.

#### `contains()`

```python
contains(x_mm, y_mm) -> bool
```

Test whether a point lies inside the arena.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `x_mm` | `float` | — | mm | Point x coordinate. |
| `y_mm` | `float` | — | mm | Point y coordinate. |

**Returns:** `bool` — True inside or on the arena boundary.

#### `is_free()`

```python
is_free(x_mm, y_mm, clearance_mm=0.0) -> bool
```

Test arena and obstacle clearance.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `x_mm` | `float` | — | mm | Point x coordinate. |
| `y_mm` | `float` | — | mm | Point y coordinate. |
| `clearance_mm` | `float` | 0.0 | mm | Required nonnegative distance from walls and obstacles. |

**Returns:** `bool` — True when the point satisfies the requested clearance.

#### `with_feature_blocked()`

```python
with_feature_blocked(name: str, blocked: bool) -> ArenaMap
```

Return a new map with one feature's blocked state changed.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `name` | `str` | — | — | Known feature name. |
| `blocked` | `bool` | — | — | Whether the feature should act as an obstacle. |

**Returns:** `ArenaMap` — New immutable map.

### `OccupancyGrid`

Sample an ArenaMap into uniform free and blocked cells.

- **Kind:** supplied class

```python
OccupancyGrid.from_arena(arena: ArenaMap, resolution_mm: float, clearance_mm: float = 0.0) -> OccupancyGrid
```

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `arena` | `ArenaMap` | — | — | Arena geometry to sample. |
| `resolution_mm` | `float` | — | mm | Positive square-cell size. |
| `clearance_mm` | `float` | 0.0 | mm | Nonnegative obstacle and wall clearance. |

**Readable fields**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `resolution_mm` | `float` | — | mm | Cell size. |
| `origin_x_mm` | `float` | — | mm | Grid minimum x. |
| `origin_y_mm` | `float` | — | mm | Grid minimum y. |
| `column_count` | `int` | — | — | Number of columns. |
| `row_count` | `int` | — | — | Number of rows. |

#### `world_to_cell()`

```python
world_to_cell(x_mm, y_mm) -> GridCell | None
```

Convert a world point to a cell or None outside the grid.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `x_mm` | `float` | — | mm | World x coordinate. |
| `y_mm` | `float` | — | mm | World y coordinate. |

**Returns:** `GridCell | None` — Containing cell, or None outside the grid.

#### `cell_center()`

```python
cell_center(cell: GridCell) -> tuple[float, float]
```

Return a cell center in world millimeters.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `cell` | `GridCell` | — | — | Cell inside the grid. |

**Returns:** `tuple[float, float]` — World x and y coordinates in millimeters.

#### `contains()`

```python
contains(cell: GridCell) -> bool
```

Test whether a cell is inside the grid.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `cell` | `GridCell` | — | — | Cell to test. |

**Returns:** `bool` — True when row and column are in bounds.

#### `is_blocked()`

```python
is_blocked(cell: GridCell) -> bool
```

Report blocked state; cells outside the grid are blocked.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `cell` | `GridCell` | — | — | Cell to test. |

**Returns:** `bool` — Blocked state.

#### `neighbors()`

```python
neighbors(cell: GridCell) -> tuple[GridCell, ...]
```

Return free cells sharing a horizontal or vertical edge.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `cell` | `GridCell` | — | — | Reference cell. |

**Returns:** `tuple[GridCell, ...]` — Free edge-adjacent cells in deterministic order.

**Notes**

- For direct software tests, the full constructor accepts resolution_mm, origin_x_mm, origin_y_mm, column_count, row_count, and row-major blocked values. Course projects normally use from_arena().

### `DeliveryTask`

Store the fixed values needed for one supplied delivery mission.

- **Kind:** value record

```python
DeliveryTask(initial_pose, arena, grid_resolution_mm, clearance_mm, destination, observed_feature_name, range_sample_count, minimum_usable_range_count, blocked_range_threshold_mm, assume_blocked_without_range)
```

**Readable fields**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `initial_pose` | `Pose` | — | — | Robot pose at mission start. |
| `arena` | `ArenaMap` | — | — | Arena before the observed feature is classified. |
| `grid_resolution_mm` | `float` | — | mm | Positive occupancy-grid cell size. |
| `clearance_mm` | `float` | — | mm | Nonnegative planning clearance. |
| `destination` | `NavigationGoal` | — | — | Delivery destination and optional final heading. |
| `observed_feature_name` | `str` | — | — | Arena feature classified by the range observation. |
| `range_sample_count` | `int` | — | — | Positive number of range samples to collect. |
| `minimum_usable_range_count` | `int` | — | — | Positive minimum usable readings, no greater than range_sample_count. |
| `blocked_range_threshold_mm` | `float` | — | mm | Positive range at or below which the observed feature is treated as blocked. |
| `assume_blocked_without_range` | `bool` | — | — | Blocked state used when no range estimate is available. |

### `DeliveryMission`

Perform range observation, map update, route planning, and navigation for a DeliveryTask.

- **Kind:** supplied class

```python
DeliveryMission(task: DeliveryTask, navigation: NavigationController, planner: GridPlanner)
```

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `task` | `DeliveryTask` | — | — | Mission settings. |
| `navigation` | `NavigationController` | — | — | Selected navigation component. |
| `planner` | `GridPlanner` | — | — | Selected grid-planning component. |

**Readable fields**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `task` | `DeliveryTask` | — | — | Mission definition. |
| `result` | `str | None` | — | — | delivered, no_path, or None before completion. |

#### `run()`

```python
run(robot: Robot) -> RobotState
```

Run the supplied delivery sequence and always attempt robot.stop().

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `robot` | `Robot` | — | — | Assembled robot service. |

**Returns:** `RobotState` — Last robot state.

## Low-level XRP access and numerical functions

### `XRPBot`

Read XRPLib devices and apply bounded, signed drive commands. Ordinary projects should use Robot instead.

- **Kind:** supplied class

```python
XRPBot(config: RobotConfig)
```

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `config` | `RobotConfig` | — | — | Motor signs, encoder signs, and final command limit. |

**Readable fields**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `config` | `RobotConfig` | — | — | Hardware configuration. |

#### `read()`

```python
read(include_range: bool = False) -> RawSensors
```

Read encoders, time, button state, and optionally range.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `include_range` | `bool` | False | — | Read the ultrasonic sensor on this sample. |

**Returns:** `RawSensors` — Direct hardware sample.

#### `reset_encoders()`

```python
reset_encoders() -> None
```

Use current hardware counts as the session zero.

**Returns:** `None` — No value.

#### `wait_for_button()`

```python
wait_for_button() -> None
```

Wait for the XRP USER button.

**Returns:** `None` — No value.

#### `set_drive()`

```python
set_drive(command: DriveCommand) -> None
```

Apply one normalized motor command after configured signs and limits.

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `command` | `DriveCommand` | — | — | Logical left and right motor commands. |

**Returns:** `None` — No value.

#### `stop()`

```python
stop() -> None
```

Attempt to stop both motors.

**Returns:** `None` — No value.

**Notes**

- set_efforts() is a compatibility alias for set_drive().

### `clamp`

Limit a numeric value to an inclusive interval.

- **Kind:** function

```python
clamp(value, lower, upper) -> float
```

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `value` | `float` | — | — | Value to limit. |
| `lower` | `float` | — | — | Inclusive lower bound. |
| `upper` | `float` | — | — | Inclusive upper bound; not less than lower. |

**Returns:** `float` — value limited to [lower, upper].

### `elapsed_time_s`

Calculate a MicroPython-tick-safe elapsed interval in seconds.

- **Kind:** function

```python
elapsed_time_s(later_ms: int, earlier_ms: int) -> float
```

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `later_ms` | `int` | — | ms | Later device timestamp. |
| `earlier_ms` | `int` | — | ms | Earlier device timestamp. |

**Returns:** `float` — Wrap-safe elapsed time in seconds.

### `wrap_angle_rad`

Return the equivalent angle in [-pi, pi).

- **Kind:** function

```python
wrap_angle_rad(angle_rad: float) -> float
```

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `angle_rad` | `float` | — | rad | Angle to wrap. |

**Returns:** `float` — Equivalent angle in [-pi, pi).

### `distance_to_goal`

Calculate planar distance from a pose to a navigation goal in millimeters.

- **Kind:** function

```python
distance_to_goal(pose: Pose, goal: NavigationGoal) -> float
```

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `pose` | `Pose` | — | — | Current world pose. |
| `goal` | `NavigationGoal` | — | — | Destination position. |

**Returns:** `float` — Euclidean position error in millimeters.

### `bearing_to_goal`

Calculate wrapped world-frame bearing from a pose to a navigation goal.

- **Kind:** function

```python
bearing_to_goal(pose: Pose, goal: NavigationGoal) -> float
```

**Parameters**

| Name | Type | Default | Unit | Description |
| --- | --- | --- | --- | --- |
| `pose` | `Pose` | — | — | Current world pose. |
| `goal` | `NavigationGoal` | — | — | Destination position. |

**Returns:** `float` — World-frame bearing in [-pi, pi) radians.
