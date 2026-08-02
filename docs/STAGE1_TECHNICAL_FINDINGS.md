# RP2350 and browser technical findings

Last updated: 2026-08-01

## Controller and runtime

The attached board is the current SparkFun XRP Controller with RP2350,
USB VID/PID `0x1B4F:0x0046`. Its original XRP-WPILib 2.1.0 identity was
preserved before installing the official Open-STEM stack pinned in
`vendor/current/release.json`:

- MicroPython 1.28.0 for `SPARKFUN_XRP_CONTROLLER`;
- `SPARKFUN_XRP_CONTROLLER-20260406-v1.28.0.uf2`;
- XRPLib 2026.07.1 at the recorded source commit.

The firmware bytes, board identity, USB REPL, filesystem, reset recovery,
XRPLib dependencies, and representative installed hashes were verified. The
normal `PICODISK` status volume is not a firmware target; the verified UF2 was
copied only after the controller entered its RP2350 bootloader.

The RP2350 board can power the motor-driver rail from USB when its board switch
is on. This explains earlier voltage observations and means battery presence is
not a reliable proxy for the driver supply. Current tests simply command zero
before and after each run; the raised-wheel motor harness additionally bounds
effort and duration in its program and `finally` cleanup.

## Browser MicroPython boundary

The virtual target uses the official pinned MicroPython 1.28 WebAssembly
runtime. It receives the exact canonical `ucsb_xrp` source, portable reference
`.mpy` artifacts, student project, and a small simulated XRPLib.

Stable Chrome did not reliably start a dedicated MicroPython worker from
inside a shared worker. The proven structure is:

1. a shared worker owns virtual target state, simulation, logs, telemetry, and
   connected IDE/Monitor ports;
2. the IDE page owns the disposable MicroPython worker;
3. runtime and simulator messages are forwarded to the shared worker; and
4. stop, reset, owner loss, completion, or exception terminates the runtime and
   sets motor effort to zero.

MicroPython `sleep_ms` must advance the authoritative simulator. Without that
bridge, open-loop programs sleep in real time while the plant remains frozen;
the full Challenge starter tests exposed and corrected that mismatch.

## LAN target

The Mac and XRP use the ordinary `Pink` network. USB provisioning stores the
credential directly on the device without logging it, installs and reads back
the course/service files, resets the XRP, and waits for the service discovery
reply. The current XRP is `ucsb-xrp` at `192.168.7.30`.

The target service uses a small HTTP/JSON API because it is dependable on stock
MicroPython and directly supports browser Private Network Access preflight.
Transactional dual project slots prevent an interrupted upload from replacing
the prior runnable project. Correlated/idempotent commands, explicit timeouts,
an independently renewed run lease, bounded logs, and reset/reconnect behavior
cover ordinary laboratory failures.

The IDE and Monitor do not poll this small service independently. A browser
`SharedWorker` owns one physical client per endpoint and broadcasts its status,
telemetry, and output to every open app tab. Disconnect invalidates unfinished
discovery before it can start a late poller, and the page delivers its
disconnect message before closing the shared-worker port. Failed discovery is
disposed in the worker and is not retried through a second direct connection.
A direct client remains only as a test and compatibility fallback when the
browser cannot construct a shared worker.

Filesystem imports from the RP2350 second core were unreliable when first
resolved there. The service therefore imports course/reference packages and
constructs XRPLib singletons on its main core before student execution. Program
stdout and stderr are line-buffered into the service log so the IDE and Monitor
show the same output as the virtual target.

The expanded pose-telemetry probe exposed a hardware concurrency constraint:
polling XRPLib sensors from the service core while the course `Robot` loop used
XRPLib on the program core could stall the controller. The corrected service
never reads XRPLib from its core during a program. It uses the state published
by `Robot` and the most recent stationary peripheral sample. Global garbage
collection runs on the service core before launch. The program core finishes
motor stop and file cleanup before releasing hardware ownership; stop, reset,
and lease-expiry paths reset the controller without cross-core XRPLib calls.
Direct reads resume only after the program thread completes. Project manifests
are retained in RAM and project imports are evicted before each run, avoiding
flash reads from the program core while the HTTP core is active.

With those corrections installed, two strict boot-aware probes passed the
complete lifecycle and course pose telemetry. Stable Chrome then validated a
full five-file Challenge 1 run while IDE and Monitor simultaneously displayed
the same physical state; stop from Monitor reset the controller and returned
both applications to ready. A final probe repetition later found the board
unresponsive after rapid browser target remounts. This motivated the client
teardown correction above. Its software regression tests pass, but the board
requires a manual reset before that last hardware repetition can be made; the
failure is not recast as a pass.

## Simulator and Monitor

The deterministic fixed-step plant owns differential-drive pose, effort
response, wheel speed, encoder quantization, collision, forward range, IMU,
temperature, battery, and button state. Course algorithms remain in Python.
The Monitor renders this state, records a bounded copy, and exports a typed CSV.
The open and blocked-gate scenes exercise both branches of Delivery Mission;
the blocked scene has been run across simultaneous IDE and Monitor tabs.

## Remaining empirical work

Only floor-dependent behavior remains: wheel-speed curves, effective wheel
diameter and track width, stopping distance, motion-induced sensor comparisons,
and complete challenge runs in the final course arenas. Those measurements
refine robot configuration and simulator envelopes; they do not change the
student workflow or target protocol.
