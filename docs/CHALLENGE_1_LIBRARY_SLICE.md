# Challenge 1 library slice

## Usable result

The canonical package now supplies `StraightLineController`. A separate,
provisional reference-source package implements the public behavior of
`SensorModel` and `WheelSpeedController`. The five-file starter selects the
supplied components by default and performs a motion-locked data-flow check
through real or simulated XRPLib.

The starter establishes these stable student-facing ideas:

- encoder counts become wheel position, increment, and speed in millimeters;
- elapsed calculation time is in seconds;
- requested and measured `WheelSpeeds` produce one bounded `MotorEfforts`
  value;
- exactly zero requested speed produces exactly zero effort for that wheel;
- `StraightLineController` uses mean measured wheel travel, slows near the
  requested distance, and stops within the configured position tolerance; and
- `course_setup.py` uses two explicit Boolean selections rather than magic
  string names or hidden dynamic imports.

The configuration and record names remain provisional. They should change
only with coordinated course, starter, reference, and test updates when
student-facing evidence shows a clearer alternative.

## Safety boundary

The initial starter uses `RobotConfig()` and therefore has
`max_effort == 0.0`. It calculates a planned forward command to exercise the
software path, but the selected wheel controller returns zero efforts and
`XRPBot` independently enforces the zero limit. A `finally` clause stops both
motors.

This is a software, import, sensor, and zero-command check. It does not validate
motor power, direction, movement threshold, speed calibration, closed-loop
response, or stopping under power. Those claims require the explicit H2
raised-wheel gate.

## Reference-source status

`vendor/current/reference_source/ucsb_xrp_reference` is retained build input,
not a declaration that the first algorithm is definitive. The official
MicroPython `v1.28.0` cross-compiler at commit
`e0e9fbb17ed6fd06bb76e266ae554784c9c80804` emits the checked-in ordinary
bytecode under `vendor/current/reference_mpy`. The build tool compiles each
module twice with repository-relative source names and rejects differing
bytes. Release metadata records source hashes, artifact hashes, sizes, compiler
identity, and the portable ABI bits.

The browser runtime reports `_mpy == 774`; the RP2350 reports `_mpy == 7942`.
Their lower format/feature bits are both 774. Because these modules contain
ordinary bytecode rather than native machine code, one artifact set is used.
The exact same bytes imported and passed the public Challenge 1 vector on both
targets. `scripts/reference_bytecode.py verify` rechecks retained source,
artifacts, and `release.json`; `npm run test:micropython` exercises the browser
artifact.

To reproduce the artifacts from an official `v1.28.0` checkout:

```sh
make -C <micropython-v1.28.0-checkout>/mpy-cross
.venv/bin/python scripts/reference_bytecode.py build \
  --mpy-cross <micropython-v1.28.0-checkout>/mpy-cross/build/mpy-cross
.venv/bin/python scripts/reference_bytecode.py verify
npm run test:micropython
```

The build command refuses a compiler that does not report MicroPython 1.28.0
and `.mpy` format 6.3. It also refuses unexpected stale artifacts.

## Deferred Challenge 1 work

- a complete supplied `Robot` sample loop with injected/testable timing,
  overrun reporting, and independently supervised stop behavior;
- a motion-enabled main program after per-robot H2 calibration;
- physical sign, starting-effort, speed/effort, and floor-run evidence; and
- comparison of physical and virtual response envelopes.

No partial `Robot`, differential-drive, or odometry implementation is included
in this slice. Publishing placeholder semantics for those later abstractions
would be more confusing than retaining the explicit Challenge 1 data flow.
