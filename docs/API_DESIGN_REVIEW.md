# `ucsb_xrp` API design review

The canonical package is `vendor/current/ucsb_xrp`. The retained reference
source is one revisable implementation of the required public behavior; it is
not the specification.

## Retained decisions

- Course units are millimeters, millimeters per second, seconds for computed
  intervals, integer milliseconds for device time, radians, and a normalized
  drive command.
- Positive wheel speed means forward; positive heading and turn rate are
  counterclockwise. Per-robot motor and encoder signs isolate wiring.
- Public records are compact immutable value objects with construction-time
  validation, useful equality, and representations that work in CPython and
  MicroPython without `dataclasses` or runtime typing machinery.
- `DriveCommand(left, right)` makes the wheel controller's two normalized
  outputs explicit and testable without implying physical force or torque.
- `XRPBot` is the only course class that imports XRPLib. It rechecks values,
  applies the configured command bound and signs at the hardware boundary, and
  makes a best effort to stop both motors after invalid or failed output.
- `Robot` owns the recurring measured loop, wrap-safe absolute deadlines,
  timing/overrun observation, component composition, and telemetry publication.
  Algorithms remain in the six replaceable components.
- Student base classes state only required methods. Reference algorithms are
  not inherited, copied into templates, or treated as normative.

## Coordinated improvements completed

- `RobotConfig` is usable by default and has an ordinary configurable
  `max_drive_command` in `[0, 1]`; there is no second authorization state.
  Individual starters choose explicit values appropriate to the task.
- `DifferentialDrive`, exact-arc `Odometry`, `NavigationController`, and
  `GridPlanner` now have public bases, reference implementations, starters,
  bytecode, CPython interface tests, and browser MicroPython parity tests.
- `ArenaMap`, `OccupancyGrid`, `GridCell`, `GridPath`, `DeliveryTask`,
  `DeliveryMission`, and the measured `Robot` loop complete the five-challenge
  course path.
- Course telemetry remains a small private channel rather than a new
  student-facing logging framework. It lets the physical service display the
  estimated pose and latest applied drive command when a project uses `Robot`.
- `MotorEfforts`, `XRPBot.set_efforts()`, and the prior RobotConfig effort
  names remain aliases, so saved projects continue to run while current course
  surfaces use one clearer vocabulary.
- Student work is separated into one literally named file per component rather
  than accumulating six unrelated classes in `student_components.py`.

## Deliberately adaptable details

- Calibration fields remain flat in `RobotConfig` because they are easy to
  inspect in a short undergraduate project. Split calibration records would be
  justified only by actual classroom confusion or reuse.
- Reference control gains and navigation thresholds are examples. Physical
  floor calibration should revise `robot_config.py`, not hard-code one robot's
  measurements into the package API.
- Planning requires a shortest valid four-neighbor route but does not prescribe
  one frontier implementation or tie break.
- Drive-command terminology is the preferred course surface. The older effort
  names are compatibility-only and should not be introduced in new examples.
- Persistent/replay telemetry and more simulator environments should remain
  application capabilities unless a course learning objective requires a new
  Python API.
