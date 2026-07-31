# Provisional `ucsb_xrp` API design review

The first canonical package source is `vendor/current/ucsb_xrp`. These are the
files that will be loaded unchanged into physical MicroPython and browser
MicroPython. The current implementation deliberately covers only the public
records, configuration, utilities, student interfaces, and hardware boundary
needed to establish the Challenge 1 contract. It is an executable design
checkpoint, not a declaration that the earlier reference design is final.

## Decisions retained

- Course code uses millimeters, seconds for computed intervals, integer
  millisecond hardware timestamps, radians, and normalized motor effort.
- Physical conventions remain positive-forward wheel motion and positive
  counterclockwise heading and turn rate. Per-robot signs isolate wiring.
- `MotorEfforts` remains an explicit two-wheel value. It makes the output of a
  wheel-speed controller observable and testable before any hardware write;
  it is not an XRPLib concept.
- `XRPBot` is the only course-package module that imports XRPLib. Imports are
  lazy so records, algorithms, and tests work without physical hardware.
- Waiting for the USER button and resetting encoders are separate operations.
  A later `Robot` service may compose them, but the hardware boundary does not
  hide either state change.

## Decisions revised

- Public records are small read-only value objects with construction-time
  validation and useful equality and representation. They use no `dataclasses`
  or `typing` dependency and avoid allocation-heavy machinery.
- `Pose` and `NavigationGoal` normalize headings on construction, establishing
  the documented half-open interval rather than relying on every caller. A
  one-microradian boundary collapse makes exact `+pi` consistent across
  CPython double precision and RP2350 MicroPython single precision.
- `RobotConfig()` provides nominal XRP geometry but is explicitly
  **uncalibrated and motion-locked**: `max_effort == 0.0`, and all effort-model
  terms are zero. Physical motion requires an intentional calibrated config.
- A `MotorEfforts` value must be finite and normalized to `[-1, 1]`.
  `XRPBot` independently rechecks finiteness and clamps each finite request to
  `RobotConfig.max_effort` immediately before applying motor signs. Invalid or
  partially failed writes make a best effort to set both motors to zero.
- XRPLib's `are_motors_powered()` is not used as a motion-safety gate. The
  observed RP2350 board reports USB-derived voltage as powered even when the
  external motor supply is intentionally disconnected.
- The Challenge 1 student base classes contain only method contracts. No
  reference algorithm is embedded in them or made normative by inheritance.

## Deliberately unresolved

- Validate the nominal wheel diameter, encoder scale, track width, motor signs,
  and useful effort limits in H2/H3 tests before publishing a calibrated
  physical default.
- Decide after student-facing trials whether the flat `RobotConfig` fields are
  clearer than separate left/right calibration records. Avoid changing this
  only for implementation elegance.
- Specify control-loop scheduling, overrun reporting, stopping semantics
  (coast versus brake), and supervisory watchdog ownership before implementing
  `Robot`.
- Select the source/reference implementation mechanism without magic strings,
  then generate `.mpy` artifacts from one retained reference source tree and
  run the same contracts against source and bytecode.
- Complete the later-challenge records, component interfaces, factories,
  mapping, navigation, mission, and telemetry APIs only in the vertical slice
  that exercises them on both physical and virtual targets.
- Reconsider the name `MotorEfforts` only if classroom use shows that
  `WheelEfforts` or `DriveEfforts` materially reduces confusion; the paired
  boundary itself should remain explicit.
