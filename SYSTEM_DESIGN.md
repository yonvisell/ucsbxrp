# System design

## 1. Scope and governing boundary

The system coordinates four products: the `ucsb_xrp` MicroPython package and
reference modules, browser IDE, XRP Monitor, and virtual XRP. A small on-robot
service makes the physical RP2350 XRP implement the same browser target
interface.

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

One Vite production build contains the IDE, Monitor, commissioning wizard,
guide, landing page, and shared packages.

### IDE

The IDE is the programming surface. It provides:

- local-folder open and save with browser recovery;
- multi-file creation, rename, duplicate, delete, tabs, and main-file
  metadata;
- one grouped project catalog containing the five cumulative challenges,
  sensor-driven obstacle-turn and expanding-spiral demos, and a staged
  MicroPython tutorial; a fresh browser opens the spiral demo while recovered
  student work remains authoritative;
- local Monaco workers and MicroPython syntax validation;
- explicit **Validate** and **Flash project** operations plus one stateful
  Run/Stop control and Reset;
- virtual/physical target selection, robot-hotspot/existing-Wi-Fi selection,
  and an existing-Wi-Fi address setting;
- a flat white workspace with compact collapsible project, settings, and
  output regions, literal file names, and concise hover/focus help; and
- separate concise Status and verbose Details output.

Project state is represented as `{name, entrypoint, files}` at every execution
boundary. The entrypoint, file paths, and file contents produce one SHA-256
revision identifier; the display name does not affect whether the robot has the
current code. Length-prefixing makes that calculation unambiguous. The shared
target publishes only `{name, entrypoint, revision, stale}` to the UI; source
remains inside the target boundary. Paths are normalized and Python sources are
compiled before synchronization or execution.
Catalog entries are complete `CourseProject` values, not a persistent special
mode. Loading one creates the same editable browser project used by a local
folder, and any Python file can be selected as its main file (entrypoint).
The selected native folder handle is retained in IndexedDB when the browser
permits structured handle storage. If read/write permission survives, the IDE
reattaches it; otherwise one explicit Reconnect gesture restores access.
Browser recovery remains independent. Folder writes are debounced, serialized,
and revision/epoch checked so an older queued snapshot cannot overwrite a newer
edit or explicit save. Before overwriting source, the previous complete project
is rotated through four JSON generations in `UCSB_XRP_Autosaves`.

### Commissioning and repair

The commissioning wizard is the ordinary student entrypoint for a new,
outdated, or damaged XRP. It first obtains a project-folder handle and confirms
that the complete production shell is available offline. The folder stores
projects and rotated data copies; the application cache remains browser-owned.
That distinction is explicit because a web application cannot choose its own
disk cache location.

One user-selected Web Serial connection enters the MicroPython raw REPL. The
wizard then performs a credential-free controller inspection, maintains any
already-active hardware watchdog, and checks the exact RP2350 board and
MicroPython version. An incompatible or absent runtime branches to the pinned
official UF2 image: the controller enters its bootloader, the user selects the
temporary firmware volume, the browser writes the hash-verified image, and the
wizard inspects the re-enumerated controller again.

The production build generates one commissioning manifest from the exact file
map used by `scripts/provision_xrp.py`. Each destination has a byte count and
SHA-256 digest. The browser hashes existing files, fetches and independently
hashes only changed payloads, writes through a temporary name, re-hashes every
destination, and import-checks `ucsb_xrp`, the on-robot service, and required
XRPLib modules. Repeating the operation therefore repairs drift without
rewriting matching files. New robots default to their device-specific hotspot;
repairs retain a valid existing profile unless the user chooses hotspot or
station mode. Station credentials move directly from the page to the XRP over
USB and are neither persisted nor returned to the page.

After network activation, reset, and an exact service/release reply, the wizard
stores the physical endpoint, hands the selected folder to the IDE, and opens
the IDE in physical mode. It cannot silently choose an operating-system Wi-Fi
network or bypass browser folder, serial-device, firmware-volume, and
local-network permissions; these are the only intentional user-mediated
boundaries.

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
- live pose, drive commands, encoders, range, button, IMU, temperature, and battery
  values;
- a permanently open Live controls region below the history window for bounded
  numeric, Boolean, and choice parameters;
- named program watch values below the sensor values in the right panel;
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

The guide covers the first virtual run, projects and templates, physical setup,
normal operation, data, shortcuts, and recovery. It is opened in a new tab.
All applications use the same high-contrast theme, compact controls, visible
focus, semantic labels, and responsive layout. The IDE and Monitor use
accessible play/stop and reset icon buttons in their 27 px headers, a compact
target selector, and explicit names for less familiar commands such as
**Validate** and **Flash project**. Icon controls retain semantic names and
hover/focus help. The landing page presents IDE, Monitor, and Guide together,
then gives initial setup/repair its own clearly separated action.

Current desktop Chrome and Edge on Windows and macOS are the supported student
browsers because they provide the required Web Serial and local-folder APIs.
The application checks those capabilities before use. A local project folder
can also be a Git working tree; students clone, review, commit, and push with
GitHub Desktop, while the IDE edits and autosaves the same files. The static
site never requests or stores GitHub credentials. Browser-only upload remains
a checkpoint fallback rather than a second synchronization system.

## 3. Shared target interface

`TargetClient` exposes `connect`, `disconnect`, `check`, `synchronize`, `run`,
`runCurrent`, `markProjectStale`, `stop`, `reset`, `setRuntimeParameter`, and
event subscription. The
virtual target additionally accepts a named simulation scenario. Events are
typed as status, synchronized-project state, runtime state, console, or
telemetry; samples
carry source, sequence/time, pose availability, motion,
encoders, collision, range, button, IMU, temperature, battery, and sensor-error
fields.
`synchronize` is the internal transactional transfer operation; the interface
calls it **Flash project** because it writes the complete project to persistent
XRP storage. Connection state and current/stale project identity are shown
separately, so a connected robot cannot be mistaken for a flashed one.

Runtime state is a bounded immutable snapshot: at most 16 validated parameter
descriptors and 16 watch values. For the virtual target, each parameter has one
fixed shared-memory slot; numbers are encoded as integers so a browser update
cannot be read halfway through. The physical service queues
the validated value behind the `ucsb_xrp.live` lock. In both targets,
`Robot.start()` and `Robot.step()` apply the latest queued values together at a
measured sample boundary. Programs that do not use `Robot` may expose their own
explicit boundary with `live.apply_updates()`. The Monitor shows pending state
until the program publishes the applied snapshot.

The UI depends only on this interface. Target-specific details—workers for the
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
- the current complete project and its public revision descriptor;
- active run identity and owner lease; and
- cross-tab stop/reset and runtime termination.

The tab that starts a virtual run creates one short-lived worker for that run. The
shared target returns the exact retained project to that owner, so the Monitor
can start code prepared by the IDE without duplicating editor state. The worker
loads official MicroPython 1.28 WebAssembly, the exact release `ucsb_xrp` source,
exact reference `.mpy` files, the project, and a simulated XRPLib. It
compiles every project file, runs the selected entrypoint, and forwards output
and authoritative simulator state. Terminating the worker stops non-yielding
student code without freezing either application.

The deterministic plant uses fixed 20 ms integration, differential-drive
kinematics, drive-command deadbands, asymmetric response, first-order acceleration and
deceleration, encoder quantization, robot footprint, world bounds, rectangular
obstacles, collision prevention, geometric forward range, planar IMU values,
temperature, battery, and button state. MicroPython `sleep_ms` advances the
same plant, so open-loop student programs and sensor-driven programs observe one
clock and one physical state.

## 5. Physical XRP service

The RP2350 runs one on-robot MicroPython HTTP service over either of two network
profiles. **Robot hotspot** is the default student profile: each XRP derives a
distinct `UCSB-XRP-xxxx` SSID from its radio identity, uses the fixed course
password and `192.168.42.1` service address, and selects channel 1, 6, or 11
from the same identity. **Existing Wi-Fi** joins a private course router or an
ordinary local network by DHCP or optional static configuration. A failed
station association starts the recoverable robot hotspot until reset. These
are alternative transports for the same service and target interface; the
system does not depend on simultaneous AP and station operation. USB is
retained for initial configuration, deterministic file installation, mode
changes, and recovery.

The versioned JSON API provides:

- identity, release, capabilities, and the retained project descriptor;
- MicroPython compilation;
- atomic whole-project synchronization using alternating slots and an active
  pointer;
- run, stop, lease renewal, and reset;
- captured stdout/stderr and service events; and
- polled hardware telemetry and live-program state/parameter updates.

Commands carry bounded request IDs and return correlated, cached replies so a
retry does not repeat a state-changing operation. Inputs have explicit file,
path, and byte limits. Browser CORS and Private Network Access preflights are
answered by the device. Each boot has an identifier, so clients reset log
cursors when sequence numbers restart. The client uses request deadlines,
bounded polling, one shared connection, and short repeated discovery probes
after an intentional reboot; an in-flight telemetry timeout cannot replace the
reconnecting status.
The shared client polls active-run telemetry every 60 ms and returns to 250 ms
when idle. This improves live plots without multiplying idle sensor-bus reads.

The project transfer manifest includes the same content revision calculated by
the browser. A transfer becomes active only after all files are present;
discovery and telemetry repeat that descriptor after every
boot, allowing either application to run the retained revision and allowing an
IDE edit to mark it stale locally without changing the device until the next
explicit run or synchronization.

Student code runs on the second RP2350 core. The service resolves course
packages and XRPLib singletons, compiles the entrypoint, evicts prior project
modules, and collects garbage on the service core before launch. The run reply
then reports `loading`; core 1 starts only after that reply has left, while the
browser finishes any in-flight telemetry request and holds polling for 500 ms.
This keeps HTTP response allocation out of the project-import boundary without
constraining ordinary student imports. The active project manifest remains in
RAM. A browser Run marks the launch as managed, so `Robot.start()` begins
immediately; a directly executed standalone program retains the explicit USER
button wait. A 7 s hardware watchdog is fed by the service event loop, so a future
shared-VM deadlock reboots the controller instead of requiring a physical
reset. A renewable run lease is owned outside the student program; expiration
also resets the target. Normal completion and exceptions stop on the program
core, while stop, reset, and lease loss use the controller reset path. All
converge to zero drive command. Program output is line-buffered into the same
bounded log stream used by the applications.

XRPLib peripheral drivers are not accessed simultaneously from both RP2350
cores. Before and after a run, the service reads hardware directly. During a
run, it uses the course `Robot` channel for pose, wheel speed, drive command, range,
and button state, and retains the latest stationary IMU, battery, and encoder
sample. Garbage collection runs on the service core before launch; motor stop
and file cleanup finish on the program core before it releases hardware
ownership. Direct reads resume only afterward. This keeps HTTP allocation,
polling, and asynchronous stop paths from contending with student code on the
board's memory manager, I2C, encoder, and motor drivers.

Browser commissioning defaults to the robot hotspot and needs no private
network credential. Existing-Wi-Fi setup accepts a password only for the
duration of the USB write and never includes it in a status reply or browser
store. Every installed course/service/reference file is content-hashed before
and after replacement. The browser and command-line provisioner consume one
exact release file map; the latter remains useful for instructor fleet
automation and optional static station addressing, but is not a student
prerequisite.

## 6. Course library and release

The public package uses small immutable value records compatible with CPython
and MicroPython. Distances and positions are millimeters; speeds are
millimeters per second; computed time is seconds; hardware timestamps are
integer milliseconds; angles are radians; each left/right drive command is
normalized.
World `+x` is forward, `+y` is left, and positive heading is counterclockwise.

Students implement six independently selectable components:
`SensorModel`, `WheelSpeedController`, `DifferentialDrive`, `Odometry`,
`NavigationController`, and `GridPlanner`. Supplied services keep hardware,
control-loop, mapping, and mission boilerplate out of student code. `XRPBot`
is the sole direct XRPLib adapter; `Robot` owns the measured sample/control
loop and publishes pose/drive-command state for physical telemetry. Its sample
clock advances absolute wrap-safe deadlines and skips missed periods, so timing
does not drift with student computation or produce catch-up bursts.

Retained reference source is a revisable implementation, not the API's
definition. Reproducible MicroPython 1.28 cross-compilation produces ordinary
portable `.mpy` artifacts. Release metadata records source identity, compiler
identity, artifact hashes, firmware, and XRPLib revision. Tests exercise source
and exact bytecode against the same required public behavior.

Five cumulative starters separate:

- `main.py`: the readable task entrypoint;
- `challenge.py`: task/environment values;
- `robot_config.py`: measured robot and controller values;
- one literally named file per student component;
- `course_setup.py`: explicit component selection and assembly.

## 7. Offline release and data

The production service worker makes the web tools local-first in the standard
sense: after one complete online load, application code and course assets run
from browser-local storage without another exchange with the web host. On each
online start it checks for an updated service worker without accepting a stale
cached response. It activates a new cache only after every required asset is
present and retains the preceding complete release during an interrupted
update. It caches the complete public release—application
shells, workers, MicroPython WebAssembly, course source, starters, templates,
reference bytecode, the pinned RP2350 UF2 and commissioning manifest, and
third-party notices—and exposes a visible readiness state. One GitHub Pages
artifact workflow obtains either the root or project
base path from Pages and publishes the same static release. When a newer
complete shell activates, a long-open tab reloads once for that build so an
older interface does not remain in memory. Development disables caching to
prevent stale bundles from masking changes. Private reference source and
instructor credentials are not web assets.

Robot commands and telemetry still cross the selected local robot network.
When an HTTPS Pages origin (the site address and protocol that own the browser
permissions) connects to the XRP's HTTP service, the document
first triggers Chrome's local-network permission before handing polling to the
shared worker. Requests identify the target address space as local. This keeps
one physical poller across tabs while satisfying the browser's worker
permission boundary.

Telemetry recording stores the newest 30,000 copied samples and reports dropped
older samples. This retains 10 minutes at the 50 Hz virtual rate and about
30 minutes at the normal 16–17 Hz physical rate; the Monitor reports its
measured rate and corresponding capacity. CSV export is explicit and
self-describing; it preserves blanks
for unavailable physical values rather than inventing zero. Manual recordings
remain session-local until exported. Independently, the Monitor captures every
run and rotates four aligned output-text, metadata-JSON, and telemetry-CSV
generations into the selected course folder. A Web Lock plus a compact run
fingerprint prevents duplicate archives when multiple Monitor tabs observe the
same run. Explicit exports are never included in rotation.

## 8. Failure and maintenance model

Ordinary failures remain visible and recoverable: no robot, wrong address,
local-network denial, incompatible protocol, syntax/runtime errors, interrupted
transfer, expired run owner, browser refresh, and unavailable sensors. No UI
state is reported as successful until a target reply or event establishes it.

Commissioning adds explicit recovery for the wrong controller/runtime, partial
file installation, an existing service watchdog, unavailable station Wi-Fi,
and reset/re-enumeration. File replacement is safe to repeat and individually
atomic: matching files are skipped, while each changed file is verified under
a temporary name before it replaces the old copy. A reset occurs only after
complete readback and import verification.
The wizard treats an unreachable post-reset Wi-Fi service as incomplete and
keeps probing without erasing the USB-verified result. A user can reconnect by
USB and run the same operation again after power loss or browser closure.

The dependency set is deliberately small and pinned. Tests cover public Python
required interfaces, deterministic physics, protocol validation, bytecode parity,
project/storage helpers, recording, stable-Chrome workflows, offline execution,
and live device behavior. Physical captures document measured facts but do not
become universal algorithm tolerances.

Floor-dependent calibration—wheel response, effective geometry, stopping
distance, motion-induced sensors, and full arena runs—remains the only separate
hardware slice. It refines configuration and model envelopes without changing
the target protocol or student workflow.
