# Integrated system design

## 1. Product shape

The project will produce two student-facing browser applications and two execution targets.

| Part | Purpose |
| --- | --- |
| IDE | Create, edit, check, save, transfer, run, stop, and reset MicroPython projects |
| XRP Monitor | Inspect live signals, plots, logs, recordings, and robot/world state |
| Physical target | Current SparkFun XRP running MicroPython, XRPLib, `ucsb_xrp`, and the course connection service |
| Virtual target | Actual student MicroPython and `ucsb_xrp` running against a deterministic virtual XRP |

The IDE and XRP Monitor use the same target interface. Switching between the physical and virtual XRP should not change student code, telemetry routes, course environments, or monitor layouts.

The repository should keep the two web applications distinct while sharing the small amount of code needed for target connections, OSC messages, recordings, and course release information. The `ucsb_xrp` Python package is not part of this browser library.

The three active `v2_` documents are the current course-design baseline, not an
immutable software API. The five-challenge learning progression, physical
conventions, and student/reference ownership are authoritative intentions. A
public name or signature can change when a coordinated change makes the course
clearer, safer, or materially easier to use.

## 2. Course release

The repository's `vendor/current` folder holds the files the IDE needs:

- the `ucsb_xrp` package;
- the supplied reference modules in their distributable form;
- student project templates and examples;
- selected XRPLib and course documentation;
- supported firmware or setup files;
- a short release file containing the course release identifier and compatible application and firmware versions.

The applications and course files are published together. The IDE shows a clear update action when a robot has an older course release. A complete course bundle can also be downloaded for backup or manual recovery.

The production build now emits a deterministic manifest and versioned service
worker that cache the complete application shell, workers, WebAssembly runtime,
local guide/API material, and public course bundle. The applications report
**offline ready** only after every manifest entry is present in browser storage;
development builds report that the cache is disabled. A warm production build
has been exercised offline at both the site root and a repository subpath. This
is a warm-cache capability: the first load still requires the deployed site,
and browser storage can be evicted.

Students can open and save an ordinary local project folder. Browser recovery
currently uses `localStorage`. A capacity-appropriate IndexedDB version store,
downloadable recovery ZIP, and ZIP import/export remain planned and must report
storage or recovery failures truthfully.

## 3. Browser IDE

The IDE uses an Arduino-like arrangement without copying its limitations:

- a compact top toolbar with target selection and explicit commands such as **Validate code**, **Transfer to XRP**, **Run virtual XRP** or **Run physical XRP**, **Stop program**, and **Reset target**;
- a project tree at left;
- a modern Python editor in the center;
- separate compact Status and Details output tabs below;
- a collapsible settings panel;
- a small connection and course-version indicator.

Both applications share a target-session model. Target identity, connection
state, course/firmware compatibility, program state, and last reply are distinct
values. Physical connection is always initiated by an explicit user action.
Low-level endpoint or port fields belong under diagnostics; normal selection is
by `Virtual XRP` or a discovered, human-readable robot identity.

The implemented editor uses Monaco 0.56 with pinned local assets and local
editor workers, so editing has no CDN dependency and participates in the
offline shell. It supplies syntax highlighting, search and replace, adjustable
font size, keyboard commands, multiple open files, and source navigation. The
application adds:

- autosave and crash recovery;
- explicit folder open and save; a separate Save As workflow remains planned;
- files, subfolders, and tabs, including rename, duplicate, and confirmed delete;
- persisted startup-file selection and starter projects; recent projects remain planned;
- Python formatting when it is dependable for MicroPython;
- a Check action that catches syntax and import problems without driving the robot;
- error messages that open the relevant source line;
- straightforward transfer of the complete project;
- console output and visible run state;
- course API documentation and examples close at hand.

Validation is local and motion-free. It compiles only Python files, parses other
supported configuration formats separately, resolves imports against the exact
selected course release without executing project top-level code, and produces
structured file/line/column diagnostics linked to Monaco. Transfer and target
execution are separate operations.

The robot changes to a newly transferred project only after all of its files have arrived successfully. If transfer is interrupted, the previous runnable project remains intact and the IDE explains how to retry.

**Prepare or Repair Robot** is a guided USB workflow for initial setup or
recovery. Its independently rerunnable steps preserve diagnostic information,
classify the runtime, verify the controller-specific firmware manifest and
hash, install the course release, run non-motion checks, and install or verify
the supervisory service. Motor acceptance is a separate explicit step: it
remains locked until raised-wheel safety and the electrically available motor
rail are explicitly confirmed and does not block no-motion USB development.
Battery absence is not sufficient: the RP2350 controller can feed motor-driver
VIN from USB-C. Routine student editing, transfer, and execution use Wi-Fi
after its acceptance gate passes.

The virtual target appears in the same target selector. Running it starts the browser simulator; its visual and quantitative output is shown in the XRP Monitor rather than adding plotting panels to the IDE.

## 4. XRP Monitor

The XRP Monitor opens independently from the IDE and can connect to either target. Its header contains target selection and connection state. The current virtual-target slice also provides explicit start, stop, and clear controls for a bounded in-memory telemetry recording, with a drop count and deliberate CSV export. Replay and persisted recordings remain planned. A collapsible sidebar selects the panels currently shown.

Before receiving a first valid sample, the Monitor shows no data rather than a
synthetic zero and preserves a valid zero as data. Explicit stale, paused,
replay, and disconnected states, a dynamically discovered channel catalog, and
general acquisition independent of mounted panels remain to be implemented.
All acquisition and recording buffers must remain bounded and expose relevant
drop or throttle metrics.

The core panels are:

### Time series

One or more selected channels on a scrolling time axis, with trace visibility, sensible automatic scales, optional fixed limits, adjustable time window, follow or pause, zoom and pan, cursor readout, event markers, and linked time ranges across plots. Each plot can be exported as a PNG.

### X-Y plot

Any numerical channel against another, including estimated planar trajectories. It supports equal-axis scaling, zoom, pan, cursor readout, and PNG export.

### World view

A Three.js view shown when spatial information is available. It displays the course arena, obstacles and regions, robot pose and heading, route or waypoints, range rays, and payload state. With the virtual target it can show ground truth and the pose estimated by `ucsb_xrp` together. The default view is top-down, with optional oblique and follow views. Controls include pause, reset, simulation speed, single step, fit to arena, zoom, pan, and follow robot.

### Live values

A compact list of selected channel names and their latest values. It is useful for values that do not need a plot, such as current goal, controller mode, range, motor effort, or completion state.

### Logs and errors

Program output, exceptions, course events, and enabled debug channels, with simple filtering and source locations when available.

The layout is responsive by default. Panel reordering and resizing may be included through a dependable layout library if they remain simple to use. Layouts can be saved and reopened.

The first recorder preserves a bounded sequence of numerical telemetry samples
and exports it explicitly as CSV. The mature recording model must additionally
preserve events and logs for replay, export logs and events as text or CSV, and
export individual plots as PNG. Its persistent browser storage mechanism should
sit behind a small interface and be selected after testing realistic recording
sizes.

## 5. Telemetry, debugging, and target control

Live communication uses OSC 1.0 messages carried in binary WebSocket frames. Use a small, documented set of OSC argument types that is reliable in MicroPython. A maintained compatible implementation is preferable; otherwise implement only the required subset and test it against an independent OSC codec.

Standard address families are:

```text
/telemetry/...
/debug/...
/event/...
/log/...
/system/...
```

Samples include `t_ms`, the elapsed program time in milliseconds, and `seq`, an
increasing sample number. The current virtual slice uses a fixed telemetry
sample shape. The intended protocol lets `ucsb_xrp` and projects register
channels through one small API, and lets a target announce available channel
names and basic value types when it connects. The XRP Monitor can then enable
debug channels and select practical update rates. Disabled debug channels
should avoid unnecessary formatting and transmission work.

Commands, replies, console output, and telemetry share the target connection
where practical. Each command has a request ID, correlated reply, timeout, and
explicit outcome. Project listing and project transfer may use ordinary web
requests if that produces a simpler, more recoverable device service. The
public target interface, rather than the transport details, is shared by the
physical and virtual implementations.

Project synchronization uses staging plus commit, dual slots, or an equivalent
transaction: incomplete bytes never replace the last runnable project. Local
validation, project synchronization, program start, idempotent stop, and
controller reset are separate protocol operations.

The GitHub Pages application must request local-network access in response to an explicit Connect action. The first implementation stage verifies direct communication from the deployed HTTPS page to the XRP access point in the supported Chromium browser. If current browser rules prevent the WebSocket path, retain OSC framing but use a persistent browser request for incoming data and small requests for commands; implement one working transport, not two permanent alternatives.

## 6. `ucsb_xrp` and the physical target

`ucsb_xrp` contains:

- the reviewed public records and services derived from the course design;
- the six selectable student/reference components;
- the course factories and configuration support;
- telemetry and debug calls used by supplied and student code;
- narrowly scoped compatibility code needed by current XRPLib and MicroPython.

The physical target connection and supervisory service is a private sibling
package. It may use `ucsb_xrp` internally, but networking, transfer, watchdog,
and project slots are not student-facing course APIs.

`XRPBot` remains the sole direct boundary to XRPLib. `Robot` owns the repeated measure-control-update cycle. Position estimation, navigation, map sampling, grid planning, and mission behavior remain in Python above this boundary.

The connection service starts and stops projects, reports exceptions, transfers
project files, exposes console output, and carries OSC traffic. It must recover
cleanly from browser reconnects, soft resets, interrupted transfers, and student
exceptions. An independent lease/watchdog mechanism—not merely code sharing the
student interpreter—must make an expired owner, stopped, failed, disconnected,
or reset run converge to zero commanded effort.

The course hardware is the current SparkFun XRP Controller with RP2350 and RM2.
The preserved original baseline ran XRP-WPILib 2.1.0. The controller now runs
the official Open-STEM MicroPython 1.28.0 image for
`SPARKFUN_XRP_CONTROLLER` with XRPLib 2026.07.1. H1 USB evidence records the
observed machine identity, `_mpy` value, filesystem, representative XRPLib
hashes, reset recovery, sensors, LED, button input, encoders, and explicit zero
effort. RM2 behavior remains to be measured. Course firmware should expose a
stable human-readable robot identifier without requiring students to edit raw
addresses.

## 7. Virtual XRP: Proposal 3B

The virtual target runs the same student project and `ucsb_xrp` package in the official MicroPython WebAssembly runtime. A simulated XRPLib presents the hardware calls expected by `XRPBot`.

The simulator uses a fixed-step planar differential-drive model. Its state includes robot pose, left and right wheel motion, motor state, encoder counts, planar IMU readings, range sensor state, user button, servo or payload state, and collision state. Use the published XRP values of 60 mm wheel diameter, 155 mm track width, approximately 90 RPM no-load wheel speed, and 585 encoder counts per wheel revolution as initial defaults. Check them against the current course robot and keep the effective values in configuration rather than hidden constants.

The initial motor model should be simple but more useful than ideal kinematics:

- effort saturation and direction;
- separate left and right response;
- configurable effort needed to start moving;
- maximum wheel speed;
- first-order acceleration and deceleration;
- encoder quantization;
- yaw rate and planar acceleration derived from the simulated motion.

Noise and parameter mismatch are optional environment settings and are off for deterministic tests. The rangefinder uses geometric ray intersection with walls and obstacles. Collision handling prevents the robot footprint from passing through solid geometry and reports a collision event. Three.js renders the robot, arena, wheels, sensor ray, obstacles, regions, and payload, but the planar state remains authoritative.

The simulator runs in a shared browser worker so the IDE and XRP Monitor can share one virtual target without a third application. The monitor renders its Three.js state. The browser target supports real time, faster-than-real-time operation, pause, single step, reset, and selectable course environments.

Stage 1 browser evidence refined the worker boundary. The shared worker owns
simulation, telemetry, logs, run state, and connected application ports. The
IDE page owns the disposable dedicated worker that runs MicroPython; runtime
messages are forwarded to the shared worker. Stop and reset commands from any
connected application are broadcast back to the IDE so it can terminate the
MicroPython worker immediately. This avoids relying on nested worker creation
inside a shared worker and keeps unresponsive student code isolated from the
simulator and monitor.

The IDE-owned runtime also holds a renewable run-owner lease. If that lease
expires because the page crashes, closes, or stops responding, the shared
worker independently sets commanded effort to zero and ends the run even when a
Monitor tab remains connected.

Environment files describe only the physical world and task setup: arena size, starting pose, obstacles, landmarks, regions, goals, and optional model variations. The same environment information should be usable by the supplied `ArenaMap`; the simulator does not plan paths, estimate pose, build a map, navigate, or execute missions.

One exact portable, non-native `.mpy` artifact set has passed the same public
behavior vector in browser MicroPython and on the RP2350. Reference bytecode
continues to be generated from the shared source and checked against the same
public contracts on both targets. Introduce target-specific artifacts only if
future evidence shows that one portable set cannot serve both runtimes.

## 8. Implementation baseline

The browser stack is TypeScript, React, Vite, locally pinned Monaco, Apache
ECharts, and Three.js. Use a workspace layout with shared packages for the
target interface, OSC codec, course release support, recording format, and
deterministic simulation core. Keep shared packages few and purposeful.

Use public-contract tests for Python components, artifact parity tests for
reference source and `.mpy`, unit tests for target messages, OSC encoding,
recording, storage, and deterministic simulation, and focused browser tests for
the principal IDE and XRP Monitor workflows. Hardware tests use explicit H0-H3
safety tiers; ordinary checks can never issue nonzero motor effort. The full
matrix and evidence schema are in `docs/VALIDATION_PLAN.md`.

The completed system should make ordinary failures legible and recoverable:

- robot unavailable or wrong network;
- local-network permission denied;
- course or firmware version mismatch;
- interrupted project transfer;
- syntax, import, and runtime errors;
- an unresponsive student program;
- dropped and resumed telemetry;
- XRP Monitor overload from an excessive update rate;
- browser refresh during unsaved work or recording.
