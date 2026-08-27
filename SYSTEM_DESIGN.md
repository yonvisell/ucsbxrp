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
authoritative planar state; it does not calculate robot motion.

The active `v2_` documents define the learning sequence and component
responsibilities. Implementations and exact APIs can improve when the coordinated
change makes student reasoning or instructor operation clearer.

## 2. Browser applications

One Vite production build contains the IDE, Monitor, commissioning wizard,
guide, landing page, and shared packages.

### IDE

The IDE is the programming surface. It provides:

- an optional Working folder containing named Project folders, automatic project
  writes, and an independent browser recovery copy;
- multi-file creation, rename, duplicate, delete, tabs, and main-file
  metadata;
- one grouped project catalog containing the five cumulative challenges,
  sensor-driven obstacle-turn and expanding-spiral demos, and a staged
  MicroPython tutorial; a fresh browser opens the spiral demo while recovered
  student work remains authoritative;
- local Monaco workers and MicroPython syntax validation;
- explicit **Validate**, one stateful Run/Stop control, and Reset; physical Run
  loads the exact current project into controller RAM before starting it;
- virtual/physical target selection, robot-hotspot/existing-Wi-Fi selection,
  and an existing-Wi-Fi address setting;
- a flat white layout with compact collapsible project, settings, and
  output regions, literal file names, and concise hover/focus help; and
- separate concise Status, Program output, and validation/service System log.

Project state is represented as `{name, entrypoint, files}` at every execution
boundary. The entrypoint, file paths, and file contents produce one SHA-256
revision identifier; the display name does not affect whether the robot has the
current code. Length-prefixing makes that calculation unambiguous. The shared
target publishes only `{name, entrypoint, revision, stale}` to the UI; source
remains inside the target boundary. Paths are normalized and Python sources are
compiled before synchronization or execution.
Each runnable project may contain `world.json`. It is a bounded declarative
catalog of named worlds: millimeter bounds, initial pose, rectangular blocks or
walls, start lines or boxes, and waypoints. Validation parses this file before a
run. The selected definition configures the simulator, Monitor, and replay
export; `ucsb_xrp.load_world()` exposes the same geometry to project Python.
This keeps the simulated environment, visible course figure, and challenge map
from drifting into separate copies. The prepared-project manifest retains the
world text for the current controller boot so Monitor can recover it from a
physical XRP after a page reload.
A virtual Run retains the selected world when `world.json` is unchanged;
replacing that file selects its declared default world.
Catalog entries are complete `CourseProject` values, not a persistent special
mode. A Working folder is a parent directory; each project is one named child
directory containing source, metadata, rotated copies, run output, and
telemetry. **Open project** accepts only a directory with a valid root
`.ucsb-xrp-project.json` and the declared main file. It rejects a Working-folder
parent, nested project metadata, and malformed metadata before reading child
trees or changing the active autosave connection. Legacy root metadata without
session or digest fields remains importable. When a Working folder is active,
loading a template first asks for the child-directory name and writes the
complete project immediately. Without a Working folder, it remains in browser
recovery until the student creates a Project folder. Any Python file can be
selected as its entrypoint. Working-folder and active-project handles are
retained separately in IndexedDB when structured handle storage is available.
Changing the Working folder does not move, close, or replace the current
project. If project read/write permission does not survive, one explicit
Reconnect gesture restores it.
Folder writes are debounced, serialized, and revision/epoch checked so an older
queued snapshot cannot overwrite a newer edit or explicit save. Before
overwriting source, the previous complete project is rotated through four JSON
generations in the project's `UCSB_XRP_Autosaves`.
Each project also has a stable project ID, monotonic content revision, saved
revision, and update time in `.ucsb-xrp-project.json`. IDE startup resolves the
remembered Project folder and browser recovery copy before publishing one
project to the shared target. The active IDE alone updates the global recovery
copy and remembered active-project handle. A standby IDE may edit and autosave
its own Project folder, but cannot replace the project used by Run or reopened
on the next launch; the student must explicitly choose **Use this project**.
Monitor reads that same active-project handle for run archives and can only
request permission to reconnect it—it never selects a different project. While
startup resolution is active, a short explicit cross-tab bootstrap record
disables Monitor Run; it is cleared when the resolved project reaches the
target. It is not a normal delay or another project copy.

The project catalog is declarative. The instructor authoring command copies the
closest working challenge into a draft, registers it with `published: false`,
and marks only the mission, world, and documentation decisions that cannot be
inferred safely. Its validator checks Python syntax, required project files,
README sections, and world geometry. Publishing repeats those checks before
the catalog entry becomes visible to students; it does not synthesize or bless
a robot behavior that has not been run by the instructor.

### Commissioning and repair

The commissioning wizard is the ordinary student entrypoint for a new,
outdated, or damaged XRP. A Working folder is useful but not a commissioning
prerequisite: students may select one for Project folders and setup logs, or
defer it until the IDE. Selecting or changing it never creates, opens, moves, or
replaces a project. The application cache remains browser-owned; a page cannot
place that cache inside a user-selected folder. When a Working folder is
selected, the wizard writes and reads back a small setup log before continuing.
Meaningful controller, installation, reset, and network-probe events append to
the same password-free log; without a Working folder the visible log remains copyable.
Raw serial traffic is not retained.

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
an optional team last name produces `UCSB-XRP-NAME`. Repairs retain a valid
existing profile unless the user chooses hotspot or station mode. Station
credentials move directly from the page to the XRP over USB and are neither
persisted nor returned to the page.

The XRP remains connected by USB throughout inspection and installation. USB
is the firmware, repair, and network-configuration path; the installed HTTP
service uses either the XRP hotspot or existing Wi-Fi for physical Run,
Monitor, and telemetry. After network activation and reset, the wizard reports
every service-probe attempt and distinguishes an unreachable network from an
incompatible service. An exact service/release and robot-identity reply stores
the network mode and endpoint that were actually verified. Thus, a failed
station join that fell back to a robot hotspot cannot hand the IDE the
unreachable station route. Only after this check does the wizard create a
short-lived Working-folder handoff and open the IDE in physical mode;
interrupted setup leaves no permanent pending state. The IDE retains an existing
active project. In a fresh browser it opens the spiral example in browser
recovery; it does not silently create `./Expanding-Spiral` or write project files
as a side effect of commissioning. The Working folder itself is not imported as
a project; an existing project is loaded only through **Open project**. It cannot silently choose
an operating-system Wi-Fi network or bypass browser folder, serial-device,
firmware-volume, and local-network permissions; these are the only intentional
user-mediated boundaries.

### XRP Monitor

The Monitor is the observation surface. It subscribes to the same target as the
IDE and presents only available data. It contains:

- target and run state;
- a project-defined, dimensioned top-down world view with bounded 100 mm grid
  lines, labeled 500 mm x/y values, start and waypoint markers, blocks or walls,
  robot pose, heading, trail, range ray, contact state, and arena/XRP zoom views;
- a compact collapsible sidebar with selectable 2–30 second histories of wheel
  speed, dimensionless drive command, simulation-only odometry comparison,
  forward range, acceleration, and yaw rate;
- a permanently open Live controls region above the telemetry values for
  bounded numeric, Boolean, and choice parameters;
- live pose, drive commands, ultrasound distance, acceleration, and yaw rate,
  followed by a separated device-state group for the USER button, motor supply,
  IMU temperature, and encoder counts;
- named program watch values below the sensor values in the right panel;
- one shared target-event and program-output history, presented as Program
  output and System log tabs in the IDE;
- bounded telemetry recording and deterministic CSV export;
- timestamped notes shared by the world, strip plots, plot exports, and run
  metadata; and
- combined SVG/PNG plot export plus a browser-native WebM world replay from a
  stopped recording. Display and export
  convert hardware-native acceleration and angular-rate values to m/s² and
  rad/s; course geometry remains in millimeters.

The world/values and upper/lower allocations have independent
pointer- and keyboard-operable separators whose positions persist locally.
The virtual scene and zoom controls share a compact toolbar above the world;
target selection and the
physical endpoint remain shared IDE settings rather than duplicated Monitor
controls. Environment selection resets virtual state and is disabled while a
project is running. A physical target shows a world pose only when the course
`Robot` loop publishes an estimate; stationary device sensors remain visible
without a pose.

Plot export is generated on demand from the retained samples rather than from
a screenshot, producing stable axes and one figure containing every selected
signal. World export replays the latest monotonic pose segment into an isolated
canvas; it does not mutate the live Three.js world or the running target. The
output is real time for recordings up to 20 seconds and bounded to 20 seconds
for longer data by an explicit playback-rate label. No telemetry or media is
sent off-device.

### Guide and visual system

The Guide covers the first virtual run, course and project folders, component
tests, physical setup, Monitor evidence and exports, project flow, offline use,
GitHub, shortcuts, and troubleshooting. The separate UCSB XRP API page is the
detailed Python reference. It documents each student base class through its
purpose, retained state, constructor, properties, method parameters and units,
return values, exceptions, and required behavior; it also covers every public
record, service, world/map type, configuration value, low-level XRP method, and
numerical function. IDE tabs link directly to the applicable API entry,
including the project-owned world.json definition. Both pages open in a new
tab and are part of the offline release.

The offline shell belongs to the site and Chrome profile, not to a selected
course folder. After one complete online load, the applications, virtual XRP,
Guide, API reference, and course release may reopen without internet or a local
server. Installation adds a launcher but does not change that storage model.
Clearing or evicting site data removes the shell and browser recovery data but
does not remove native project folders. Physical operation still requires a
local network path to the XRP, and GitHub operations and first-load/update
checks still require internet.

All applications use the same high-contrast theme, compact controls, visible
focus, semantic labels, and responsive layout. The IDE and Monitor use
accessible play/stop and reset icon buttons in their 27 px headers, a compact
target selector, and an explicit name for **Validate**. Icon controls retain
semantic names and hover/focus help. The landing page presents IDE, Monitor, and Guide together,
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
virtual target additionally accepts a world ID from the active project's world
catalog. Events are typed as status, synchronized-project state, project world,
runtime state, console, or telemetry; samples
carry source, sequence/time, pose availability, motion,
encoders, collision, range, button, IMU, temperature, battery, and sensor-error
fields.
`synchronize` is retained as the target-interface transfer operation. On the
physical target it transactionally prepares a boot-lifetime RAM project; it
does not write internal flash. Connection state and current/stale project
identity are shown separately, so a connected robot cannot be mistaken for a
robot that has the current project ready. A true controller boot has no
current student project until a browser prepares one; an obsolete flash copy
is never an implicit execution source.

One IDE tab is the active source for Run. The first connected IDE owns that
role until it closes or a student explicitly selects **Use this project** in
another IDE. Standby IDEs remain fully editable and continue saving their own
files, but their edits do not mark, prepare, or run a shared target project.
Every IDE- or Monitor-initiated Run requests the active IDE's current in-memory
snapshot at that moment; a retained target descriptor is never substituted for
a missing editor. Ownership is not stored on disk or in browser storage, and a
closed or nonresponding owner is not silently replaced by another tab.

Runtime state is a bounded immutable snapshot: at most 16 validated parameter
descriptors, 16 watch values, and 16 numerical plot values. For the virtual
target, each parameter has one fixed shared-memory slot; numbers are encoded as
integers so a browser update cannot be read halfway through. The physical service queues
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
Selected target and endpoint are shared between applications through one
versioned browser RobotProfile. It stores the commissioned `robotId`, the
explicitly selected network, separate station and hotspot routes, and the last
verified network observation. A verified station connection may refresh its
DHCP route. A hotspot or station-fallback observation never replaces that
route, and neither application accepts a reachable service whose identity does
not match the selected robot. RobotProfile is browser/device configuration; it
does not belong in a student project folder or Git repository.

## 4. Virtual XRP

A `SharedWorker` maintains the target state shared by IDE and Monitor tabs:

- project world catalog, selected world, and latest plant state;
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

Run in the IDE validates changed or previously unchecked files before launch.
When an IDE is active, Monitor Run obtains that IDE's exact current snapshot,
including an edit made immediately before Run. With no active IDE, the virtual
Monitor has one intentional fallback: it validates and starts the immutable
default Expanding spiral project. The physical Monitor instead asks the user to
open or select an IDE project. Bounded console history is retained across runs
and cleared only by an explicit UI action or target replacement.

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
password and `192.168.4.1` service address, and selects channel 1, 6, or 11
from the same identity. The wizard may instead store a validated
`UCSB-XRP-NAME` SSID based on one team member's last name. **Existing Wi-Fi**
joins a private course router or an ordinary local network by DHCP or optional
static configuration. A failed station association starts the recoverable
robot hotspot until reset. These are alternative transports for the same
service and target interface; the system does not depend on simultaneous AP
and station operation. USB is retained for initial configuration,
deterministic file installation, mode changes, and recovery.

The versioned JSON API provides:

- identity, release, capabilities, and the retained project descriptor;
- MicroPython compilation;
- transactional whole-project preparation in alternating RAM volumes;
- run, stop, lease renewal, and reset;
- captured stdout/stderr and service events; and
- polled hardware telemetry and live-program state/parameter updates.

Commands carry bounded request IDs and return correlated, cached replies so a
retry does not repeat a state-changing operation. Prepare, Run, and Stop repeat
an interrupted request once with that same ID. If both Prepare replies are
lost, the browser treats the operation as complete only when the XRP's active
boot-lifetime manifest reports the exact requested revision. Inputs have explicit file, path,
and byte limits. Browser CORS and Private Network Access preflights are answered
by the device. Each boot has an identifier, so clients reset log cursors when
sequence numbers restart. The client uses request deadlines, bounded polling,
one shared connection, and short repeated discovery probes after an intentional
reboot; an in-flight telemetry timeout cannot replace the reconnecting status.
The shared client requests active-run telemetry every 125 ms and returns to
250 ms when idle. The XRP still buffers the 50 Hz course samples, so this
reduces HTTP and MicroPython interpreter contention without reducing the
recorded sample rate or changing the on-robot control loop.

The project transfer manifest includes the same content revision calculated by
the browser. A transfer builds an inactive RAM-backed FAT volume and becomes
active only after validation, compilation, and every file write succeed.
Discovery and telemetry expose that descriptor for the current boot, allowing
either application to run the prepared revision and allowing an IDE edit to
mark it stale until the next Run. Ordinary Reset stops the student program,
clears course telemetry and live-control state, and retains that prepared
revision. The next Run therefore starts immediately unless the browser project
has changed.

Student code runs on the second RP2350 core. Once started, one project worker
remains alive for the service lifetime and blocks on a lock between runs. Run
queues one job and wakes that worker only after the `loading` reply has left the
HTTP service. Normal project preparation writes only the RAM-backed project
volume, so edit-run cycles never coordinate internal-flash changes with the
second core. Persistent course-runtime installation remains a USB
setup/repair operation performed while student code is not running. The
service resolves course packages and XRPLib singletons, compiles the
entrypoint, evicts prior project modules, and collects garbage before launch.
The active project manifest remains in RAM. A browser Run marks the launch as
managed, so `Robot.start()` begins immediately; a directly executed standalone
program retains the explicit USER button wait. A 7 s hardware watchdog is fed
by the service event loop, so a future shared-VM deadlock reboots the controller
instead of requiring a physical reset. A renewable run lease is owned outside
the student program; expiration restarts the target if browser ownership is
lost. Normal completion, exceptions, Stop, and Reset converge on a cooperative
program-core exit and zero drive command. Only a non-cooperative program,
watchdog event, lease loss, or setup/repair uses the controller-restart path.
Program output is line-buffered into the same bounded log stream used by the
applications.

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
and after replacement. The browser and command-line provisioner use one
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
is the sole direct XRPLib adapter; `Robot` runs the measured sample/control
loop and publishes pose/drive-command state for physical telemetry. Its sample
clock advances absolute wrap-safe deadlines and skips missed periods, so timing
does not drift with student computation or produce catch-up bursts.

Retained reference source is a revisable implementation, not the API's
definition. Reproducible MicroPython 1.28 cross-compilation produces ordinary
portable `.mpy` artifacts. Release metadata records source identity, compiler
identity, artifact hashes, firmware, and XRPLib revision. Tests exercise source
and exact bytecode against the same required public behavior.

Five cumulative challenge projects separate:

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
shells, workers, MicroPython WebAssembly, course source, challenges, templates,
reference bytecode, the pinned RP2350 UF2 and commissioning manifest, and
third-party notices—and exposes a visible readiness state. One GitHub Pages
artifact workflow obtains either the root or project
base path from Pages and publishes the same static release. When a newer
complete shell activates, each open page adopts it only at a state-safe
boundary. Read-only pages may reload immediately. The IDE first preserves the
exact active project revision and folder handle; the Monitor waits for commands,
recordings, notes, exports, and automatic run archives; setup waits for folder,
serial, installation, and network operations; the challenge editor waits until
its current specification is reproducible. A cancelled browser reload remains
pending and can be retried. Commissioning payloads use release-scoped paths and
the firmware URL includes its complete SHA-256 digest, so a newly active worker
cannot mix new setup files with an older page. The current and immediately
preceding complete caches are retained through the handoff.

Development disables caching to prevent stale bundles from masking changes.
Private reference source and instructor credentials are not web assets. This
application cache is owned by the HTTPS origin and is not copied into the
selected course folder. It needs no Node process after caching; a `file://` copy
is not substituted because the module, worker, WebAssembly, and service-worker
boundaries require an HTTP(S) origin. Clearing site data removes the cached
release but not project folders.

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
generations into the active project folder. A Web Lock plus a compact run
fingerprint prevents duplicate archives when multiple Monitor tabs observe the
same run. Explicit exports are never included in rotation.

## 8. Failure and maintenance model

Ordinary failures remain visible and recoverable: no robot, wrong address,
local-network denial, incompatible protocol, syntax/runtime errors, interrupted
transfer, expired run owner, browser refresh, and unavailable sensors. No UI
state is reported as successful until a target reply or event establishes it.

Commissioning adds explicit recovery for the wrong controller/runtime, partial
file installation, an existing service watchdog, unavailable station Wi-Fi,
and reset/re-enumeration. The course runtime is installed into alternating
release slots. Every staged file and the runtime manifest are read-verified
before a redundant activation record selects that slot; boot confirms it only
after successful import and can fall back to the previous confirmed slot.
Matching files are copied from the inactive release when possible, so a
same-release repair remains small. The two bootstrap files are separately
verified and replaced atomically. A reset occurs only after complete readback
and activation verification.
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

## 9. Student checks and explicit telemetry evidence

IDE **Validate** compiles every Python file; it does not claim algorithmic
correctness. Challenge projects separately include `component_checks.py` and a
**Test components** action. These small repeatable checks execute in an
isolated MicroPython worker without commanding either target. PASS, NOT
IMPLEMENTED, and FAIL remain visible in Program output, and NOT IMPLEMENTED is
not a gate: students can implement and select one component at a time. The project file only imports
the classes introduced by that challenge and calls the supplied check runner;
fixtures and assertions live once in `ucsb_xrp.component_checks`. This keeps the
student-visible use case short and prevents five challenge copies of test logic
from drifting. Checks state externally visible behavior and avoid requiring the
supplied internal algorithm.

Telemetry names its evidence source. A physical pose is the course Odometry
estimate. A virtual sample carries both that estimate and simulator ground
truth. The same sample may carry requested body motion, target wheel speeds,
measured wheel speeds, and final normalized drive commands. Compatibility
pose fields remain, but new analysis uses explicit fields. The Monitor exposes
target-versus-measured wheel speed and virtual odometry position error so an
incorrect student estimator or controller cannot look correct merely because
the simulator knows the true state. Integer encoder counts are the authoritative
measurement on both targets. `SensorModel` converts those sensor readings into
two distinct results: exact signed wheel increments for odometry and a
time-aware regularized wheel-speed estimate for feedback control. The supplied
speed estimator fits cumulative wheel position over a short trailing time
window and applies the response time selected by
`wheel_speed_filter_time_constant_ms`. Its history is bounded by that configured
window and the course sample period. The same regularized value feeds the wheel
controller, telemetry, plots, and CSV; the browser does not substitute or
smooth a different display-only value. Cumulative left/right wheel distance is
likewise carried from `Measurements` rather than reconstructed in the browser.
Student checks require sensible attenuation and response without requiring the
supplied internal formula.

Programs may add up to 16 numerical analysis signals with `live.plot`. A signal
has a stable identifier, student-facing label, unit, and current finite value.
It travels with the bounded runtime snapshot and is copied into each recorded
telemetry sample; the Monitor never executes student expressions. New signals
are listed but not plotted until the user selects them, which avoids changing a
student's display merely because a program publishes diagnostics.

## 10. Install and export boundaries

The Web App Manifest provides an optional standalone installation and launcher;
the service worker remains the offline authority. Installation does not copy a
runnable site into the course folder and does not make browser storage permanent.

Manual Monitor exports use `exports/` inside the active project when available.
Without a project folder, the browser chooses a destination before expensive
rendering begins. World replay deterministically renders recorded telemetry to
a private canvas and records WebM; it neither screen-records nor reruns the
simulation. Recording and robot execution remain independent states.

## 11. Student documentation and responsibility boundaries

The Guide is task-oriented: it names the available challenges, demos, and
tutorial, then presents virtual execution, working-folder storage, component
tests, physical setup, Monitor evidence, code roles, offline use, GitHub, and
troubleshooting in that order. It avoids internal deployment vocabulary and
defines each student-visible storage or target term where it first appears.

The separately built `UCSB XRP API` page is the detailed code reference. Every
student component entry states its purpose, source and base class, state between
calls, constructor, properties, method parameters and types, return values,
exceptions, units, and required behavior. The IDE maps known
component/configuration filenames to the corresponding reference anchor, while
the Guide retains the high-level closed command/measurement loop. Each challenge
README repeats only the challenge-specific objective, student and supplied responsibilities,
flow, and work sequence needed to understand that project without leaving its
folder. The Guide and API pages are part of the verified offline shell.
