# Mobile Robotics with the XRP: Course and Library Summary

This ten-week laboratory course introduces mobile robotics through five
progressive challenges completed in pairs on the XRP robot. Students begin with
motor and encoder measurements, then add feedback control, differential-drive
kinematics, odometry, waypoint navigation, range sensing, occupancy grids, and
grid-based path planning. The same compact MicroPython project grows across the
course; each challenge retains the components developed in earlier challenges.

## Challenge progression

1. **Straight Run** — Drive an open straight course and stop at a specified
   distance. After obtaining repeatable motion, complete a timed run as close as
   possible to target time \(T\) without finishing early. Students implement the
   wheel-measurement portion of `SensorModel` and the
   `WheelSpeedController`. The supplied `StraightLineController` handles
   slowing near the destination and stopping at the requested travel distance.
2. **Turn and Return** — Drive to a turnaround point, turn through 180 degrees,
   return to the marked start region, and recover the original heading.
   Students implement `DifferentialDrive`, which converts robot motion requests
   into wheel-speed requests, and `Odometry`, which updates planar pose from
   measured wheel travel.
3. **Waypoint Courier** — Visit an ordered sequence of world-coordinate
   destinations and finish with a specified heading. Students implement
   `NavigationController`, including progress through the route and the
   transitions among turning toward a destination, driving toward it, and
   final-heading alignment.
4. **Mapped Route** — Reach a destination while avoiding known obstacles in a
   supplied dimensioned `ArenaMap`. Students implement `GridPlanner` to return
   a valid shortest four-neighbor route through free cells of an
   `OccupancyGrid`, or report that no route exists. The grid path is converted
   to world-coordinate goals and followed with the existing navigation
   component.
5. **Delivery Mission** — At a known observation pose, collect repeated forward
   range readings, determine whether one named map feature is blocked, plan in
   the corresponding occupancy grid, and complete the delivery. Students add
   `SensorModel.estimate_range()` and integrate their sensing, planning, and
   navigation work. The mission sequence itself is supplied as
   `DeliveryMission`.

The physical work uses three continuing environments: an open lane for
Straight Run, one marked open floor area for Turn and Return and Waypoint
Courier, and one shared mapped arena for Mapped Route and Delivery Mission.

## What students implement

Six components have interchangeable reference and student implementations:

- `SensorModel`
- `WheelSpeedController`
- `DifferentialDrive`
- `Odometry`
- `NavigationController`
- `GridPlanner`

Each student component has the same public methods and return types as its
reference counterpart. Student templates inherit the corresponding base class
from `ucsb_xrp.student_api`. In `course_setup.py`, one named
`USE_STUDENT_*` Boolean independently selects each component. A flag starts as
`False` for the supplied implementation and changes to `True` only after that
student component passes its software tests. Early starters include only the
flags for components introduced so far.

Each student component has a literal file: `sensor_model.py`,
`wheel_speed_controller.py`, `differential_drive.py`, `odometry.py`,
`navigation_controller.py`, or `grid_planner.py`. A starter includes only the
components introduced so far. Robot-specific measurements and reusable
controller settings belong in `robot_config.py`; challenge values belong in
`challenge.py`; `main.py` constructs the selected objects and runs the task.
Algorithms and task-specific numerical values are not duplicated in `main.py`.

## Supplied library services

`XRPBot`, `Robot`, `StraightLineController`, `ArenaMap`, `OccupancyGrid`, and
`DeliveryMission` are supplied.

`XRPBot` is the only UCSB-XRP class that accesses XRPLib directly. It reads raw
sensors, resets encoders, supports a direct-launch USER-button wait, applies
normalized drive commands, and stops the motors. IDE-managed runs begin
immediately. `Robot` assembles the selected lower-level
components and performs the recurring sample cycle. Programs obtain assembled
objects from:

```python
make_robot(config)
make_navigation_controller(config)
make_grid_planner()
```

A normal run calls `Robot.start(initial_pose)`, repeatedly calls
`Robot.step(command, read_range=False)`, and places `Robot.stop()` in a
`finally` clause. Each step returns a `RobotState` containing the newest
`Measurements` and `Pose`. `Robot` owns absolute, wrap-safe sample deadlines;
student control loops do not call `sleep_ms`.

For experiments and debugging, `ucsb_xrp.live` supplies bounded numeric,
Boolean, and enumerated parameters plus named watch values. The Monitor renders
the declared controls and current values; `Robot` applies queued parameter
changes together at a sample boundary. Saved task and robot settings remain in
`challenge.py` and `robot_config.py`, while complete histories remain
telemetry rather than printed counters.

The principal run-time paths are:

```text
MotionCommand
  -> DifferentialDrive
  -> WheelSpeeds
  -> WheelSpeedController
  -> DriveCommand
  -> XRPBot

XRPBot
  -> RawSensors
  -> SensorModel
  -> Measurements
  -> Odometry
  -> Pose

NavigationGoal sequence + Pose
  -> NavigationController
  -> MotionCommand

ArenaMap
  -> OccupancyGrid
  -> GridPlanner
  -> GridPath
  -> NavigationGoal sequence
```

The supplied `DeliveryMission` adds stationary range observation and selection
of one named map feature before planning and navigation. It reports
`"delivered"` or `"no_path"`.

## Public records and conventions

The public records imported from `ucsb_xrp` are `RobotConfig`,
`NavigationConfig`, `DeliveryTask`, `RawSensors`, `Measurements`, `Pose`,
`RobotState`, `MotionCommand`, `WheelSpeeds`, `DriveCommand`,
`NavigationGoal`, `GridCell`, and `GridPath`. `STOP_COMMAND` is the shared
zero-motion command.

Distances, positions, wheel travel, map coordinates, clearances, and grid
resolution use millimeters. Linear and wheel speeds use millimeters per second.
Hardware timestamps use integer milliseconds; calculated elapsed time uses
seconds. Heading and heading change use radians, and turn rate uses radians per
second. Each left/right drive command is normalized and dimensionless.

World \(+x\) is the reference forward direction, world \(+y\) points left,
heading zero points along \(+x\), and positive heading and turn rate are
counterclockwise. Positive speed on either wheel means forward wheel motion.
Motor and encoder signs in `RobotConfig` isolate these course conventions from
physical wiring. A `Pose` heading is wrapped to \([-\pi,\pi)\).

`GridCell.column` increases with world \(x\), and `GridCell.row` increases with
world \(y\). `OccupancyGrid.world_to_cell()` maps a world position to its
containing cell, `cell_center()` performs the corresponding cell-to-world
lookup, and `neighbors()` returns free four-neighbor cells.

## Component interfaces

- `SensorModel.reset(raw)` and `update(raw)` produce `Measurements`;
  `estimate_range(samples, minimum_usable)` returns a median range estimate or
  `None` after rejecting unusable readings.
- `WheelSpeedController.update(target, measured)` returns bounded
  `DriveCommand`; a zero target for a wheel produces a zero command for that
  wheel.
- `DifferentialDrive.wheel_speeds(command)` converts a `MotionCommand` to
  `WheelSpeeds`.
- `Odometry.reset(initial_pose)` initializes pose, and
  `update(left_increment_mm, right_increment_mm)` returns the updated `Pose`.
- `NavigationController.start(goals)`, `update(pose)`, `current_goal()`, and
  `is_complete()` manage an ordered route and return motion commands.
- `GridPlanner.plan(grid, start, goal)` returns a `GridPath` or `None`.

These interfaces let each component be tested with deterministic records before
it is selected for a physical robot run.

## Browser tools and execution targets

The browser IDE is the focused programming surface: students edit a small
MicroPython project, check it, transfer it, run or stop it, and follow
source-linked console errors. The separate XRP Monitor is the observation
surface for live values, time-series and X-Y plots, recordings, logs, and the
robot/world view.

Both applications use one target interface. A physical target runs the student
project through `ucsb_xrp`, `XRPBot`, XRPLib, and the XRP hardware. A virtual
target runs the same student MicroPython and `ucsb_xrp` against a simulated
XRPLib and deterministic planar XRP model. The simulator supplies hardware and
world effects—motor response, encoders, range, button and payload state,
collisions, and ground-truth pose—but does not perform course sensing,
odometry, mapping, planning, navigation, or mission logic.

The production web release is delivered once and then runs locally from the
browser. Physical traffic uses the same target service in either the default
device-specific XRP hotspot mode or an optional existing local Wi-Fi mode; no
student project changes with the network choice.

The public commissioning wizard is the normal physical-robot entrypoint.
Students may choose a workspace for named project folders immediately or later, connect an RP2350
XRP by USB-C, and use one safe-to-repeat setup/repair action. The browser checks firmware and required
runtime versions, installs and read-verifies only changed course files, prepares
the selected Wi-Fi profile, verifies the local robot service, then opens the IDE
on the verified physical target. USB handles installation and repair; the
existing physical Run, Monitor, and telemetry service uses the selected local
Wi-Fi network.
New robots default to their unique hotspot; an existing robot keeps its working
network unless the student changes it. Instructor command-line provisioning is
an optional fleet interface to the same exact release file set.

## Current implementation note

No contradiction was found among the three active `v2_` documents. The current
RP2350, firmware, portable reference bytecode, virtual-target path, and
browser-to-robot LAN transport have been exercised in earlier releases. The
dev.7 changed-only comparison, controlled one-file repair, full readback,
runtime import, and reset path now pass on the attached RP2350. The remaining
wizard observation is the public-origin native folder-picker, Web Serial, and
local-network permission handoff. Reference algorithms
remain revisable; course outcomes, units, component ownership, and the concise
student workflow are the compatibility target. Physical floor calibration is
kept in per-robot configuration rather than promoted into the public API.
`MotorEfforts`, `XRPBot.set_efforts()`, and the earlier RobotConfig effort
field names remain compatibility aliases for saved pre-0.3 projects; current
course material uses the drive-command vocabulary.
