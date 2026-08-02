# `ucsb_xrp` API design review

The canonical package is `vendor/current/ucsb_xrp`. The retained reference
source is one revisable implementation of the public contracts; it is not the
specification.

## Retained decisions

- Course units are millimeters, millimeters per second, seconds for computed
  intervals, integer milliseconds for device time, radians, and normalized
  motor effort.
- Positive wheel speed means forward; positive heading and turn rate are
  counterclockwise. Per-robot motor and encoder signs isolate wiring.
- Public records are compact immutable value objects with construction-time
  validation, useful equality, and representations that work in CPython and
  MicroPython without `dataclasses` or runtime typing machinery.
- `MotorEfforts(left, right)` makes the wheel controller's two physical outputs
  explicit and testable. It is a course value, not another hardware subsystem.
- `XRPBot` is the only course class that imports XRPLib. It rechecks values,
  applies the configured effort bound and signs at the hardware boundary, and
  makes a best effort to stop both motors after invalid or failed output.
- `Robot` owns the recurring measured loop, timing/overrun observation,
  component composition, and telemetry publication. Algorithms remain in the
  six replaceable components.
- Student base classes state only required methods. Reference algorithms are
  not inherited, copied into templates, or treated as normative.

## Coordinated improvements completed

- `RobotConfig` is usable by default and has an ordinary configurable
  `max_effort` in `[0, 1]`; there is no second authorization state. Individual
  starters choose explicit values appropriate to the task.
- `DifferentialDrive`, exact-arc `Odometry`, `NavigationController`, and
  `GridPlanner` now have public bases, reference implementations, starters,
  bytecode, CPython contracts, and browser MicroPython parity tests.
- `ArenaMap`, `OccupancyGrid`, `GridCell`, `GridPath`, `DeliveryTask`,
  `DeliveryMission`, and the measured `Robot` loop complete the five-challenge
  course path.
- Course telemetry remains a small private channel rather than a new
  student-facing logging framework. It lets the physical service display the
  estimated pose and latest applied effort when a project uses `Robot`.

## Deliberately adaptable details

- Calibration fields remain flat in `RobotConfig` because they are easy to
  inspect in a short undergraduate project. Split calibration records would be
  justified only by actual classroom confusion or reuse.
- Reference control gains and navigation thresholds are examples. Physical
  floor calibration should revise `robot_config.py`, not hard-code one robot's
  measurements into the package API.
- Planning requires a shortest valid four-neighbor route but does not prescribe
  one frontier implementation or tie break.
- `MotorEfforts` can be renamed only if student use demonstrates a clearer
  term; any rename must update course documents, starters, source, bytecode,
  examples, and tests together.
- Persistent/replay telemetry and more simulator environments should remain
  application capabilities unless a course learning objective requires a new
  Python API.
