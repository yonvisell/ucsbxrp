# System design

## 1. Scope and governing boundary

The system coordinates four products: the `ucsb_xrp` MicroPython package and
reference modules, browser IDE, XRP Monitor, and virtual XRP. A small private
service makes the physical RP2350 XRP implement the same browser target
contract.

Course behavior remains in Python:

```text
physical: student project -> ucsb_xrp -> XRPBot -> XRPLib -> XRP
virtual:  student project -> ucsb_xrp -> XRPBot -> simulated XRPLib -> plant
```

The simulator supplies device observations and planar physics. It does not
estimate pose, navigate, plan, or execute a mission. Three.js renders the
authoritative planar state and never owns dynamics.

The active `v2_` documents define the learning sequence and component
ownership. Implementations and exact APIs can improve when the coordinated
change makes student reasoning or instructor operation clearer.

## 2. Browser applications

One Vite production build contains three entry points and shared packages.

### IDE

The IDE is the programming surface. It provides:

- local-folder open and save with browser recovery;
- multi-file creation, rename, duplicate, delete, tabs, and startup-file
  metadata;
- a selectable five-challenge starter catalog;
- local Monaco workers and MicroPython syntax validation;
- explicit validate, synchronize, run, stop, and reset operations;
- virtual/physical target selection and a physical address setting;
- compact collapsible project, settings, and output panels; and
- separate concise Status and verbose Details output.

Project state is represented as `{entrypoint, files}` at every execution
boundary. Paths are normalized and Python sources are compiled before a run.
Folder access remains explicit because browser file-system permissions do not
survive every browser restart; recovered text does.

### XRP Monitor

The Monitor is the observation surface. It subscribes to the same target as the
IDE and presents only available data. It contains:

- target and run state;
- a dimensioned top-down world view with bounded 100 mm grid lines, labeled
  500 mm x/y values, robot pose, heading, trail, range ray, obstacle, contact
  state, and arena/XRP zoom views;
- a compact collapsible sidebar with selectable 2–30 second histories of wheel
  speed, dimensionless drive command, forward range, acceleration, and yaw
  rate;
- live pose, efforts, encoders, range, button, IMU, temperature, and battery
  values;
- program and service output; and
- bounded telemetry recording and deterministic CSV export. Display and export
  convert hardware-native acceleration and angular-rate values to m/s² and
  rad/s; course geometry remains in millimeters.

The world/values, plots/output, and upper/lower allocations have independent
pointer- and keyboard-operable separators whose positions persist locally.
The virtual scene control sits in the world itself; target selection and the
physical endpoint remain shared IDE settings rather than duplicated Monitor
controls. Environment selection resets virtual state and is disabled while a
project is running. A physical target shows a world pose only when the course
`Robot` loop publishes an estimate; stationary device sensors remain visible
without a pose.

### Guide and visual system

The guide covers the first virtual run, projects and starters, physical setup,
normal operation, data, shortcuts, and recovery. It is opened in a new tab.
All applications use the same high-contrast theme, compact controls, visible
focus, semantic labels, and responsive layout. Control labels describe the
operation rather than relying on ambiguous verbs.

## 3. Shared target contract

`TargetClient` exposes `connect`, `disconnect`, `check`, `synchronize`, `run`,
`stop`, `reset`, and event subscription. The virtual target additionally
accepts a named simulation scenario. Events are typed as status, console, or
telemetry; samples carry source, sequence/time, pose availability, motion,
encoders, collision, range, button, IMU, temperature, battery, and sensor-error
fields.

The UI depends only on this contract. Target-specific details—workers for the
virtual XRP and a single shared HTTP poller for the physical XRP—stay inside
their clients. A physical-target `SharedWorker` serializes the device
connection and broadcasts status, telemetry, and output to IDE and Monitor;
tests and browsers without `SharedWorker` use the same direct client as a
fallback. Only failure to construct the browser worker selects that fallback;
a robot discovery error is returned without opening a duplicate connection.
Selected target and endpoint are shared between applications through a small,
versioned browser-storage record.

## 4. Virtual XRP

A `SharedWorker` owns the target state shared by IDE and Monitor tabs:

- simulation scenario and latest plant state;
- target status, console history, and telemetry fan-out;
- active run identity and owner lease; and
- cross-tab stop/reset and runtime termination.

The IDE creates a disposable dedicated worker for each MicroPython run. That
worker loads official MicroPython 1.28 WebAssembly, the canonical `ucsb_xrp`
source, exact reference `.mpy` files, the project, and a simulated XRPLib. It
compiles every project file, runs the selected entrypoint, and forwards output
and authoritative simulator state. Terminating the worker stops non-yielding
student code without freezing either application.

The deterministic plant uses fixed 20 ms integration, differential-drive
kinematics, effort deadbands, asymmetric response, first-order acceleration and
deceleration, encoder quantization, robot footprint, world bounds, rectangular
obstacles, collision prevention, geometric forward range, planar IMU values,
temperature, battery, and button state. MicroPython `sleep_ms` advances the
same plant, so open-loop student programs and sensor-driven programs observe one
clock and one physical state.

## 5. Physical XRP service

The RP2350 joins the ordinary course LAN and runs a private MicroPython HTTP
service at boot. The current development unit is `ucsb-xrp` at
`192.168.7.30`. USB is retained for initial configuration, deterministic file
installation, and recovery.

The versioned JSON API provides:

- identity, release, and capabilities;
- MicroPython compilation;
- atomic whole-project synchronization using alternating slots and an active
  pointer;
- run, stop, lease renewal, and reset;
- captured stdout/stderr and service events; and
- polled hardware telemetry.

Commands carry bounded request IDs and return correlated, cached replies so a
retry does not repeat a state-changing operation. Inputs have explicit file,
path, and byte limits. Browser CORS and Private Network Access preflights are
answered by the device. Each boot has an identifier, so clients reset log
cursors when sequence numbers restart. The client uses request deadlines,
bounded polling, one shared connection, and short repeated discovery probes
after an intentional reboot; an in-flight telemetry timeout cannot replace the
reconnecting status.

Student code runs on the second RP2350 core. The service resolves course
packages and XRPLib singletons before starting that thread, identifies the
entrypoint's project imports, and pauses HTTP work while the student core loads
that project graph. The active project manifest is retained in RAM, and prior
project modules are evicted before a new run. This avoids concurrent flash
reads and network allocation during startup without constraining ordinary
student imports. A renewable run lease is owned outside the student program;
expiration resets the target. Normal completion and exceptions stop on the
program core, while stop, reset, and lease loss use the controller reset path.
All converge to zero motor output. Program output is line-buffered into the
same bounded log stream used by the applications.

XRPLib peripheral drivers are not accessed simultaneously from both RP2350
cores. Before and after a run, the service reads hardware directly. During a
run, it uses the course `Robot` channel for pose, wheel speed, effort, range,
and button state, and retains the latest stationary IMU, battery, and encoder
sample. Garbage collection runs on the service core before launch; motor stop
and file cleanup finish on the program core before it releases hardware
ownership. Direct reads resume only afterward. This keeps HTTP allocation,
polling, and asynchronous stop paths from contending with student code on the
board's memory manager, I2C, encoder, and motor drivers.

Provisioning reads the selected Wi-Fi password only on the instructor Mac,
writes the device configuration over USB, and never prints or commits the
secret. Every installed course/service/reference file is read back byte for
byte before reset, then the tool waits for the LAN discovery reply.

## 6. Course library and release

The public package uses small immutable value records compatible with CPython
and MicroPython. Distances and positions are millimeters; speeds are
millimeters per second; computed time is seconds; hardware timestamps are
integer milliseconds; angles are radians; motor effort is normalized.
World `+x` is forward, `+y` is left, and positive heading is counterclockwise.

Students implement six independently selectable components:
`SensorModel`, `WheelSpeedController`, `DifferentialDrive`, `Odometry`,
`NavigationController`, and `GridPlanner`. Supplied services keep hardware,
control-loop, mapping, and mission boilerplate out of student code. `XRPBot`
is the sole direct XRPLib adapter; `Robot` owns the measured sample/control
loop and publishes pose/effort state for physical telemetry.

Retained reference source is a revisable implementation, not the API's
definition. Reproducible MicroPython 1.28 cross-compilation produces ordinary
portable `.mpy` artifacts. Release metadata records source identity, compiler
identity, artifact hashes, firmware, and XRPLib revision. Tests exercise source
and exact bytecode against the same public contracts.

Five cumulative starters separate:

- `main.py`: the readable task entrypoint;
- `challenge.py`: task/environment values;
- `robot_config.py`: measured robot and controller values;
- `student_components.py`: student work; and
- `course_setup.py`: explicit component selection and assembly.

## 7. Offline release and data

The production service worker caches the complete public release—application
shells, workers, MicroPython WebAssembly, course source, starters, and reference
bytecode—and exposes a visible readiness state. When a newer complete shell
activates, a long-open tab reloads once for that build so an older interface
does not remain in memory. Development disables caching to prevent stale
bundles from masking changes. Private reference source and instructor
credentials are not web assets.

Telemetry recording stores at most 30,000 copied samples and reports dropped
older samples. CSV export is explicit and self-describing; it preserves blanks
for unavailable physical values rather than inventing zero. Current recordings
are intentionally session-local. Persistent replay should be added only when a
course activity requires it and after realistic storage-size testing.

## 8. Failure and maintenance model

Ordinary failures remain visible and recoverable: no robot, wrong address,
local-network denial, incompatible protocol, syntax/runtime errors, interrupted
transfer, expired run owner, browser refresh, and unavailable sensors. No UI
state is reported as successful until a target reply or event establishes it.

The dependency set is deliberately small and pinned. Tests cover public Python
contracts, deterministic physics, protocol validation, bytecode parity,
project/storage helpers, recording, stable-Chrome workflows, offline execution,
and live device behavior. Physical captures document measured facts but do not
become universal algorithm tolerances.

Floor-dependent calibration—wheel response, effective geometry, stopping
distance, motion-induced sensors, and full arena runs—remains the only separate
hardware slice. It refines configuration and model envelopes without changing
the target protocol or student workflow.
