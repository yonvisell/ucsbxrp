# Implementation plan

Development proceeds in complete course slices. Each slice joins the public
Python API, supplied bytecode, student starter, simulator, IDE, Monitor, and
physical target where the available setup can exercise the behavior. The three
active `v2_` documents define the learning progression, not an immutable first
implementation.

## Design rules

- Student projects contain ordinary, short MicroPython files and select a
  virtual or physical XRP without target-specific code.
- `ucsb_xrp` owns course abstractions and algorithms. The simulator supplies
  hardware and world behavior only; Three.js is a view of that state.
- One canonical course package and one set of ordinary `.mpy` reference
  artifacts run in browser and RP2350 MicroPython.
- USB is the instructor setup and repair path. Normal project work and
  telemetry use the LAN already shared by the computer and XRP.
- Tests constrain public results, units, geometry, termination, and recovery,
  while allowing different sound student algorithms and internal structures.
- The normal workflow has no staged acceptance process. A short setup command,
  visible target state, and actionable failures are sufficient.

## Slice 1 — One working target path

Status: implemented and repeatedly exercised on the attached XRP, including
the final post-reset regression.

- Detect the RP2350 over USB; configure `Pink` without exposing its password;
  install the current package, bytecode, and boot service; report its LAN
  address.
- Discover target identity and capabilities; validate and atomically
  synchronize a multi-file project; run, stop, reset, reconnect, collect output,
  and poll telemetry.
- Give virtual and physical clients the same target operations, correlated
  replies, timeouts, structured errors, and run ownership. Share one physical
  poller across open IDE and Monitor tabs so the small HTTP service is not
  loaded by competing browser loops.

Usable result: the IDE and Monitor can use the physical XRP at
`http://192.168.7.30` or the virtual XRP with the same project.

## Slice 2 — Straight Run

Status: implemented; virtual workflow and physical software path exercised.

- Implement sensor conversion, wheel-speed feedback, the straight-line task,
  the `XRPBot` boundary, and the reusable `Robot` sample loop.
- Supply the five-file starter, selectable student/reference components,
  deterministic tests, browser MicroPython execution, telemetry, recording,
  and CSV export.
- Measure the attached robot's stationary sensors and use a short raised-wheel
  motor/encoder check before floor calibration.

Usable result: students can develop Challenge 1 virtually, then run the same
project on a configured XRP.

## Slice 3 — Turn and Return

Status: implemented and exercised in browser MicroPython.

- Implement and test `DifferentialDrive` and exact-arc `Odometry` for straight,
  curved, and in-place motion.
- Model drivetrain response, encoder quantization, arena bounds, collision,
  range, IMU, temperature, and battery state.
- Show ground-truth or estimated pose, heading, trail, efforts, wheel speeds,
  encoders, and sensors in the Monitor.

Usable result: Challenge 2 runs end to end on the virtual XRP and uses the same
imports and lifecycle on the physical target.

## Slice 4 — Waypoint Courier

Status: implemented and exercised in browser MicroPython.

- Implement ordered-goal progression, turn/drive/realign behavior, final
  heading, termination, and invalid-input handling.
- Supply the accumulated starter and run it through the IDE, shared target,
  simulator, and Monitor.

Usable result: Challenge 3 completes without target-specific student code.

## Slice 5 — Mapped Route

Status: implemented and exercised in browser MicroPython.

- Implement dimensioned arena maps, occupancy-grid conversion, clearance,
  coordinate conversion, free-cell neighbors, and shortest four-neighbor path
  planning.
- Supply a focused starter and validate endpoint, adjacency, collision, and
  minimum-length properties without fixing one arbitrary tie break.

Usable result: Challenge 4 plans and executes a mapped route.

## Slice 6 — Delivery Mission

Status: implemented and exercised with both open and blocked virtual scenes.

- Implement robust range estimation, conditional named features, replanning,
  navigation, and explicit `delivered`/`no_path` outcomes.
- Let the Monitor select a course environment and render its obstacle, range
  ray, collision state, and robot path while the IDE runs the mission.
- Exercise the blocked-gate workflow across two browser applications sharing
  one virtual target.

Usable result: all five challenges have runnable starters and supplied
reference components, including a delivery that observes and routes around a
new obstruction.

## Slice 7 — Course release and validation

Status: implemented and fully software-validated. The corrected service,
reboot-aware client, two-app physical workflow, and post-reset hardware
repetition passed.

- Keep the IDE compact and high contrast; retain folders, multi-file projects,
  tabs, recovery storage, startup-file selection, clear commands, adjustable
  8 px-and-up code/output type, optional code overview, shortcuts, starter
  selection, physical endpoint, and help in a new tab. Use one restrained
  visual language and reserve monospace for code and logs.
- Keep the Monitor focused on target state, a dimensioned world/ruler, live
  sensor values, selectable scrolling signal plots, program output, bounded
  recordings, and unit-explicit CSV export. Group those controls in a compact
  collapsible sidebar and add controls only when they support a course task.
- Run Python contracts, reference-artifact verification, browser MicroPython
  parity, TypeScript/unit checks, production/offline builds, stable-Chrome
  workflows, visual inspection, LAN service checks, and the raised-wheel motor
  check.
- Leave a concise student guide, one-command instructor setup, truthful status,
  local Git commit/archive, and production preview.

Usable result: a coherent development release that an instructor can open and
operate without reconstructing the implementation history.

## Later physical calibration slice

Floor trials remain intentionally separate because they require the actual
course surface and arena. Measure wheel-speed response, effective wheel
diameter, track width, stopping distance, motion-induced IMU/range behavior,
and each complete physical challenge. Feed those measurements into
`robot_config.py`, simulator comparison envelopes, and instructor examples;
the student workflow and network architecture should not change.

## Active refinement slices — 2026-08-01

Instructor review of the complete release identified visual inconsistencies,
missing cross-application lifecycle behavior, weak project persistence, and
opportunities to reduce student-facing boilerplate. The following slices refine
the release without weakening the physical/virtual target boundary.

### Refinement 1 — Monitor structure and visual system

Status: implemented and validated.

- Replace nested cards with flat regions and persistent, accessible splitters.
- Bound and label the arena grid directly in world coordinates; remove the
  detached ruler and improve the dimensioned XRP representation.
- Compact live values, plots, output, controls, header, typography, and status
  presentation; use precise signal names and SI units where appropriate.
- Detect a newly activated offline build and reload a long-open tab once so UI
  validation cannot silently exercise an older bundle.

Usable result: the Monitor is dense, high-contrast, responsive, and directly
adjustable at wide and narrow laptop sizes.

### Refinement 2 — Shared Run/Stop lifecycle

Status: implemented and validated in virtual and physical Stable Chrome.

- Retain the synchronized project name, content identity, and revision in the
  shared target boundary.
- Let the IDE or Monitor start that current project and present one reliable
  Run/Stop state control, including completion, exception, tab-loss, and reset
  recovery.
- Mark the retained revision stale as soon as IDE files change, so the Monitor
  cannot silently start older code. A new IDE run or synchronization atomically
  makes the edited revision current again.
- Discover the retained physical project after boot and preserve it through
  stop/reset cycles. Derive the same SHA-256 revision in the browser, CPython
  harness, and RP2350 MicroPython service.

Usable result: both applications show the same named project state and can run
or stop the same verified revision without duplicated controls or hidden
transfers.

### Refinement 3 — IDE workspace and project catalog

Status: next.

- Apply the flat visual system to the IDE; compact the tree, tabs, toolbar,
  settings, and output while retaining the adjustable 8 px minimum editor type.
- Treat challenges, robot demos, and a staged MicroPython tutorial as project
  templates that become ordinary editable folders after loading.
- Add the range-triggered forward/left-turn demo and clear hover/focus help.

### Refinement 4 — Folder persistence and automatic recovery

Status: planned.

- Persist and recover the selected folder permission where the browser permits.
- Autosave source and per-run telemetry/output with four rotating automatic
  versions without rotating explicit user exports.

### Refinement 5 — Course runtime and public vocabulary

Status: planned.

- Replace ambiguous motor-effort terminology with drive-command terminology
  through one coordinated compatibility-preserving change.
- Move sample scheduling out of student starter code, use absolute wrap-safe
  deadlines, and organize student code by literal course component.
- Update source, reference bytecode, examples, starters, tests, and all active
  course documents together.

### Refinement 6 — Structured watches and live parameters

Status: planned.

- Add structured watched values and typed numeric, Boolean, and enumerated live
  parameters; apply validated updates atomically at sample boundaries.
- Prove virtual-runtime message delivery before exposing these controls, then
  exercise the same behavior on the attached XRP.

### Refinement 7 — Integrated red-team validation

Status: planned.

- Exercise service-worker upgrades, multi-tab ownership, stale projects,
  invalid live values, interrupted writes, permission loss, telemetry load,
  every virtual project, and the available physical target operations.
- Finish with truthful status, a clean commit/archive, and the production
  applications running on port 4174.
