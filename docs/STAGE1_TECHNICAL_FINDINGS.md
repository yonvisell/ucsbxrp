# Stage 1 technical findings

Last checked: 2026-07-31

## Development environment

- macOS 26.3.1 on Apple silicon
- Google Chrome 150.0.7871.187
- repository runtime pinned to Node.js 24.17.0 in `.nvmrc`
- exact npm dependency graph in `package-lock.json`

The browser end-to-end suite uses installed stable Chrome. Shells that do not
automatically select `.nvmrc` may begin on another Node version and must run
`nvm use` before repository checks.

## Attached controller baseline

The attached board is the current, non-beta SparkFun XRP Controller with an
RP2350. macOS observed:

- manufacturer/product: SparkFun / XRP Controller;
- USB VID/PID: `0x1B4F` / `0x0046`;
- CDC serial endpoint: `/dev/cu.usbmodem2101` at this observation;
- normal mounted volume: `/Volumes/PICODISK`;
- status file: `XRP-Status.txt`.

The status file reports firmware version 2.1.0, access-point mode, and local
address `192.168.42.1`. Its unique SSID and default password are intentionally
not reproduced here.

This was XRP-WPILib firmware 2.1.0. Its status volume and serial interface were
not treated as a MicroPython filesystem or REPL. The user reported that the
robot was assembled and safe, USB connected, and the battery-pack motor supply
disconnected.

The append-only evidence is in
`docs/hardware/2026-07-31-rp2350-usb-baseline.json`.

## Accepted MicroPython/XRPLib stack

The active course documents do not specify XRPLib 2.0.1. Earlier project text
claiming that pin was incorrect.

At official Open-STEM XRP firmware manifest commit
`1914fd636d1d06425cdbec88ae4b998844d1501a`, the current non-beta RP2350
MicroPython project selects:

- MicroPython 1.28.0;
- `SPARKFUN_XRP_CONTROLLER-20260406-v1.28.0.uf2`;
- XRPLib 2026.07.1, release tag `V2026.07.1`, source commit
  `55abed4e219e061d32dd190199bc42d9a1b45366`.

The UF2 was downloaded to a temporary host file and verified before any device
operation:

- byte size: 1,725,952;
- upstream Git blob: `92bbd9d4b0817fe9775056e9425afe2c0a9cb626`;
- SHA-256:
  `0a36d7e2bc20dfcde2dd1af9a673fd0a63248820a360723c3967751106610ed0`.

The exact WPILib platform manifest declares a 1200-baud touch reset for this
board. That verified method exposed a temporary `RP2350` UF2 bootloader volume;
its `INFO_UF2.TXT` identified an RP2350 bootloader and board. The verified UF2
was copied only to that volume. The normal `PICODISK` status volume was not used
as a flashing target.

After flashing, the controller re-enumerated as `MicroPython / Board in FS
mode`. Pinned `mpremote` then observed:

- MicroPython 1.28.0, build dated 2026-04-06;
- machine `SparkFun XRP Controller with RP2350`;
- `_mpy = 7942`;
- 8,638,464 free heap bytes after the recorded runtime probe;
- `/lib/XRPLib`, `/lib/ble`, `/lib/phew`, and `/XRPExamples`;
- representative installed XRPLib file hashes matching the pinned source;
- successful runtime recovery and probe after a soft reset.

The accepted stack is frozen by immutable identifiers in
`vendor/current/release.json`; a classroom release must not depend on a moving
`latest` URL.

## H1 non-motion result and power-rail correction

The H1 script imported XRPLib, read both encoders, IMU, rangefinder, USER button
input, and VIN, commanded the status LED on/off, and commanded motor effort
`0.0` before and after the checks with `finally` cleanup. It issued no nonzero
effort. The final recorded range was 26.890034 cm; sensor values are point
observations rather than calibration evidence. A physical USER-button
transition and manual encoder rotation remain untested.

The battery pack was disconnected, but XRPLib reported
`are_motors_powered() == True` and 5.40509 V. This is not a false electrical
alarm. The SparkFun schematic shows:

`USB-C VBUS -> F2 -> VUSB -> Q4 ideal diode -> VRAW -> Q9/SW1 -> VIN`

`VIN` directly supplies both DRV8411A motor drivers. USB therefore can energize
the motor rail when the board power switch is on. XRPLib's method merely tests
whether its VIN-derived voltage exceeds 4.272 V; it cannot distinguish USB
from battery power. Battery absence must never be used as the H2 gate. The
nominal 100 kOhm/33 kOhm divider has a 13.3 V full scale, while XRPLib uses a
legacy 14 V conversion; the corrected observation is approximately 5.135 V,
consistent with USB. The physical MOT LED is the board-level supply indicator,
while the correct H1 state is board switch off, MOT LED off, and near-zero VIN.
The RP2350 remains USB-powered through its independent system rail. Any
disagreement fails closed. The correct software policy remains explicit zero
effort until a human-confirmed, raised-wheel, bounded motion test.

The upstream installation-verification example is unsuitable for an automatic
H1 pass because it progresses into servo and drivetrain motion. The course
harness must use separate, independently rerunnable no-motion checks.

The complete append-only post-flash evidence is in
`docs/hardware/2026-07-31-rp2350-micropython-h1.json`.

## Browser runtime baseline

The virtual target uses the official
`@micropython/micropython-webassembly-pyscript` package, pinned to 1.28.0-6. A
dedicated worker loads MicroPython 1.28.0, creates a virtual filesystem,
compiles project code, and runs the entrypoint.

The browser bundle now imports every `.py` file directly from the canonical
`vendor/current/ucsb_xrp` source tree. The worker writes those exact sources to
its virtual filesystem and injects only the small simulated XRPLib hardware
surface used by `XRPBot`. A separate Node-driven MicroPython parity check also
loads the exact source tree and exercises motion locking, effort clamping and
sign conversion, range conversion, and the measured single-precision angle
boundary.

Validation now rejects an absent or non-Python entry point and compiles only
`.py` files; Markdown, JSON, and other saved project files are transferred but
not miscompiled as Python. It remains compile-only. Import resolution without
executing motion-capable project top-level code and structured
file/line/column diagnostics linked to Monaco remain required.

## Browser worker boundary

Launching the MicroPython dedicated worker from the shared target worker did
not emit its first ready/error message in stable Chrome. The proven boundary is:

1. one shared worker owns simulation, telemetry, logs, run state, and connected
   application ports;
2. the IDE page owns the disposable dedicated MicroPython worker;
3. runtime messages are forwarded to the shared worker;
4. Stop or Reset from either page tells the IDE to terminate the runtime worker
   and sets commanded effort to zero in the simulator.

This retains process isolation from unresponsive student code. The IDE-owned
runtime now renews a 1.6-second run-owner lease in the shared worker. If the IDE
page disappears or stops renewing the lease, the shared worker invalidates the
run, sets both commanded efforts to zero, terminates the runtime, and reports
the reason to remaining Monitor clients. The physical service still requires
an independent watchdog; browser cooperation cannot be its only stop
mechanism.

An in-app-browser pass found that normal completion previously stopped the
shared worker's physics clock immediately after setting effort to zero. The
Monitor therefore froze the last nonzero wheel-speed values indefinitely. The
worker now continues fixed-step coast-down integration outside the running
state until both speeds reach a small deterministic snap-to-zero threshold.
Unit and browser tests require a finite zero-speed state after normal
completion while preserving the additional coasting displacement.

## Local-network and offline constraint

Chrome Local Network Access applies to a public HTTPS application connecting to
a local device and requires an explicit user action and permission flow. That
test must use a deployment or deployment-equivalent secure origin while the Mac
is on the XRP network.

The Mac currently remains on development Wi-Fi. This does not block library,
USB, simulator, or application work. Before switching networks, cache and test
the IDE, XRP Monitor, guide, workers, WebAssembly runtime, and current course
release offline. Then conduct one bounded XRP-network session for permission,
transport, reconnect, transfer, run/stop/reset, and telemetry acceptance.

## Physical target contract finding

The current `PhysicalTargetClient` is a placeholder and must remain hidden. It:

- reports `check()` success without receiving a reply;
- sends only entrypoint text rather than a complete project;
- lacks request IDs, timeouts, capability/version discovery, atomic transfer,
  structured errors, telemetry decoding, reconnect, and tests.

The replacement protocol separates local validation, project staging and
commit, start, idempotent stop, controller reset, version/capability discovery,
and telemetry. A transmitted command is never recorded as successful until its
correlated reply arrives.

## Virtual path demonstrated

The current stable-Chrome production tests demonstrate:

- two tabs connected to one shared virtual target;
- actual MicroPython 1.28.0 compilation and execution;
- simulated XRPLib plus exact canonical `ucsb_xrp` imports;
- visible deterministic translation, wheel speed, encoder, pose, and output;
- zero commanded effort after normal completion;
- Monitor-initiated Stop and Reset observed by the IDE;
- multi-file tabs, folder save/open, settings, and guide loading;
- non-Python project files excluded from Python compilation;
- zero effort followed by finite deterministic coast-down to zero wheel speed;
- run-owner disappearance terminating an infinite student loop and converging
  commanded effort to zero while a Monitor remains connected;
- no observed page or browser-console errors in those workflows.

These establish the current virtual plumbing and canonical-source parity. They
do not yet establish import-aware diagnostics, physical command semantics,
dynamic telemetry, durable project storage, offline operation, or a
course-complete Monitor.
