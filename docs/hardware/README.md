# Hardware evidence

Hardware observations are stored as machine-readable, append-only records. The
first record captures the attached current SparkFun RP2350 XRP before this
project changed its firmware. The second records the verified MicroPython and
XRPLib installation and the partial non-motion H1 checks. The third records a
subsequent run of the exact student-facing, motion-locked sensor example. The
fourth records development release `2026.07-dev.2`, its Challenge 1 reference
bytecode, and the exact five-file starter on the RP2350. The software checks
passed, but the required switch-off, MOT-LED-off, near-zero-VIN isolation gate
was not confirmed during those runs.

The fourth record is
[`2026-07-31-rp2350-challenge-one-h1.json`](2026-07-31-rp2350-challenge-one-h1.json).
It establishes that:

- all eight canonical `ucsb_xrp` source-file hashes installed under
  `/lib/ucsb_xrp` matched the host release; the aggregate source SHA-256 is
  `78637b538e41b1d7ed90f6511cba9376dcedbe5edc480048bcb97492336a1b0f`;
- `/lib/ucsb_xrp_reference/__init__.mpy` was 166 bytes with SHA-256
  `f889f432acdacc96a7d0bb0ddcea220fd4d2415a24f5cb4c07c5faad31978696`;
- `/lib/ucsb_xrp_reference/challenge_1.mpy` was 2,308 bytes with SHA-256
  `6dfceb6b927d3155fc0d290bda80687da7600b18cb3f22394514fc99ec331ca3`;
- those exact ordinary-bytecode artifacts imported on both browser MicroPython
  and the physical RP2350, and the public contract vector passed on the RP2350;
  and
- the exact five-file Challenge 1 starter ran from a temporary host mount
  against physical XRPLib and the installed bytecode while
  `RobotConfig.max_effort` remained zero. Both calculated efforts were zero,
  and `finally` cleanup completed.

The reference contract probe did not access physical hardware or issue a motor
effort. The starter and package probes issued zero effort only. This evidence
does not close the motor-rail isolation gate or establish physical stopping.

The recorded normal volume is `PICODISK`, containing `XRP-Status.txt`. That file
identifies XRP-WPILib 2.1.0. It is a status volume, not the RP2350 UF2 bootloader
volume and not evidence of a MicroPython REPL.

The selected candidate course stack comes from the official Open-STEM firmware
manifest at the immutable commit recorded in the JSON evidence:

- MicroPython 1.28.0 for `SPARKFUN_XRP_CONTROLLER`;
- firmware asset `SPARKFUN_XRP_CONTROLLER-20260406-v1.28.0.uf2`;
- XRPLib 2026.07.1.

The downloaded firmware bytes were verified against the upstream Git blob and
with SHA-256, copied only to the RP2350 bootloader volume, and accepted after
the controller re-enumerated as MicroPython. XRPLib, its dependencies, and the
upstream examples were installed with pinned `mpremote`; representative remote
file hashes match the pinned upstream source. Firmware must not be copied to
the normal `PICODISK` volume.

Records omit the unredacted USB serial, unique Wi-Fi name, and password.

The current RP2350 controller's power schematic matters for safety: VUSB is
ideal-diode ORed into VRAW and, with the board switch on, VRAW feeds VIN and the
DRV8411A motor-driver supplies. XRPLib's `are_motors_powered()` returns true
when its VIN-derived voltage exceeds 4.272 V; it does not distinguish USB from
battery power. The observed value was approximately 5.4 V with the battery
pack disconnected. Battery absence therefore cannot authorize a motor test,
and a software zero-effort command is not evidence that a moving robot stops
physically.

The preferred H1 state is board switch off plus human confirmation that the
MOT LED is off and reported VIN is near zero. USB still powers the RP2350
system rail in that state. A disagreement fails closed. The PWR MOT jumper only
disables the indicator LED and is not a motor disconnect.

Production offline loading is implemented and verified locally for both the
root base path `/` and the deployment-style `/course-tools/` path, including the
applications, workers, WebAssembly runtime, and current course release. The
actual deployed HTTPS origin, RM2 path, browser Local Network Access, and
robot-side supervisory service remain pending and are not hardware acceptance
evidence.
