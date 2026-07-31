# Hardware evidence

Hardware observations are stored as machine-readable, append-only records. The
first record captures the attached current SparkFun RP2350 XRP before this
project changed its firmware. The second records the verified MicroPython and
XRPLib installation and the partial non-motion H1 checks. The third records a
subsequent run of the exact student-facing, motion-locked sensor example. The
software checks passed, but the required switch-off, MOT-LED-off, near-zero-VIN
isolation gate was not confirmed during those runs.

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
