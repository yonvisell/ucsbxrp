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
- USB is the setup, network-mode change, and repair path. Normal project work
  and telemetry use either the XRP's own hotspot or an existing local network.
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

Usable result: the IDE and Monitor can use the physical XRP at its reported
station address or fixed hotspot address, or the virtual XRP with the same
project.

## Slice 2 — Straight Run

Status: implemented; virtual workflow and physical software path exercised.

- Implement sensor conversion, wheel-speed feedback, the straight-line task,
  the `XRPBot` boundary, and the reusable `Robot` sample loop.
- Supply the compact starter with literally named component files,
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

Status: implemented and fully validated in software and on the attached XRP.
The deferred-launch, quiet-window, and hardware-watchdog corrections pass the
strict repeated-launch and two-app physical lifecycle.

- Keep the IDE compact and high contrast; retain folders, multi-file projects,
  tabs, recovery storage, main-file selection, clear commands, adjustable
  8 px-and-up code/output type, optional code overview, shortcuts, starter
  selection, physical endpoint, and help in a new tab. Use one restrained
  visual language and reserve monospace for code and logs.
- Keep the Monitor focused on target state, a dimensioned world/ruler, live
  sensor values, selectable scrolling signal plots, program output, bounded
  recordings, and unit-explicit CSV export. Group those controls in a compact
  collapsible sidebar and add controls only when they support a course task.
- Run Python API behavior tests, reference-artifact verification, browser MicroPython
  parity, TypeScript/unit checks, production/offline builds, stable-Chrome
  workflows, visual inspection, LAN service checks, and the raised-wheel motor
  check.
- Leave a concise student guide, one-action browser commissioning with optional
  instructor automation, truthful status, local Git commit/archive, and
  production preview.

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

Status: implemented and validated in Stable Chrome and direct Chrome.

- Apply the flat visual system to the IDE; compact the tree, tabs, toolbar,
  settings, and output while retaining the adjustable 8 px minimum editor type.
- Treat challenges, robot demos, and a staged MicroPython tutorial as project
  templates that become ordinary editable folders after loading.
- Add the range-triggered forward/left-turn demo, an expanding-spiral demo with
  two live parameters and forward-obstacle stopping, and clear hover/focus
  help.

Usable result: the IDE is a compact flat workspace with unclipped 10 px
controls, 9 px default code, an 8 px minimum, literal file labels, and one
grouped template menu. The obstacle-turn demo, expanding-spiral demo, and
seven-lesson tutorial compile and run on the virtual XRP; every loaded template
remains an ordinary project.

### Refinement 4 — Folder persistence and automatic recovery

Status: implemented and validated in Stable Chrome.

- Persist and recover the selected folder permission where the browser permits.
- Autosave source and per-run telemetry/output with four rotating automatic
  versions without rotating explicit user exports.

Usable result: selecting a folder once enables serialized, debounced source
saves and four recoverable pre-overwrite project states. The Monitor writes an
aligned output log, metadata record, and unit-labeled telemetry CSV for every
run. Native handles persist in IndexedDB when Chrome permits; a concise
Reconnect action restores permission without weakening browser recovery.

### Refinement 5 — Course runtime and public vocabulary

Status: implemented and validated in software and on the attached RP2350.

- Replace ambiguous motor-effort terminology with drive-command terminology
  through one coordinated compatibility-preserving change.
- Move sample scheduling out of student starter code, use absolute wrap-safe
  deadlines, and organize student code by literal course component.
- Update source, reference bytecode, examples, starters, tests, and all active
  course documents together.
- Return a physical run reply before core-1 startup, pause browser telemetry
  during that boundary, and add automatic hardware-watchdog recovery.

### Refinement 6 — Structured watches and live parameters

Status: implemented and validated in software and on the attached RP2350.

- Add structured watched values and typed numeric, Boolean, and enumerated live
  parameters; apply validated updates atomically at sample boundaries.
- Prove virtual-runtime message delivery before exposing these controls, then
  exercise the same behavior on the attached XRP.

Usable result: a student program declares compact bounded controls and named
intermediate values in ordinary Python. The same Monitor UI validates and
applies values at a measured boundary on virtual and physical targets without
periodic print logging or target-specific program code.

### Refinement 7 — Integrated red-team validation

Status: complete in software, Chrome, and the attached-RP2350 repetition.

- Exercise service-worker upgrades, multi-tab ownership, stale projects,
  invalid live values, interrupted writes, permission loss, telemetry load,
  every virtual project, and the available physical target operations.
- Finish with truthful status, a clean commit/archive, and the production
  applications running on port 4174.

### Refinement 8 — Watchdog-safe boot and USB repair

Status: implemented and validated on the attached RP2350.

Direct USB maintenance after refinement 7 showed that the service watchdog can
remain active after the HTTP loop is interrupted and reset the controller
during a long read-verified installation. This changed the final dependency
order: repair robustness had to precede the final physical archive.

- Feed the RP2350 watchdog before the service import, during device-driver
  initialization, and throughout Wi-Fi association.
- Feed it before and after each USB write and readback operation, and while the
  provisioner discovers the post-reset network address.
- Repeat the complete install, strict physical lifecycle, two-app Chrome run,
  live parameter update, and retained student-project restoration.

Usable result: the ordinary one-command provision/repair path completes even
when the previous course service had already enabled the hardware watchdog.

### Refinement 9 — Compact application navigation and Monitor hierarchy

Status: implemented and validated in Stable Chrome and direct production
Chrome.

- Use one compact `UCSBXRP` wordmark treatment in both applications, with
  contiguous matching type, UCSB blue, and a restrained grey-red product name.
- Reduce both headers to 27 px, align the IDE target selector with 19 px command
  buttons, remove the redundant retained-project label, and make both cross-app
  links explicit new-tab actions.
- Put signal selection and the time window before Live controls; place program
  watches below Live telemetry in the right panel; keep Guide and offline readiness
  together in a sidebar-only footer.
- Assert the exact hierarchy, geometry, typography, collapsed visibility, and
  asynchronous live-control acknowledgements in the Chrome harness.

Usable result: the IDE and Monitor retain all project and target behavior while
using less header space, clearer navigation, and a more coherent separation of
commands, sensor values, and student-declared watches.

### Refinement 10 — Entrypoint language and final control density

Status: implemented and validated in Stable Chrome and direct production
Chrome.

- Call the Python entrypoint **Main file** throughout the student interface,
  help, and errors; make its role explicit as the file Run executes first.
- Consolidate IDE Status into distinct target, code-check, robot-file, and
  project-file questions instead of overlapping validation and file-operation
  summaries.
- Keep Settings at the far-right end of the IDE header and offline readiness at
  the lower-left edge of the open file rail. Preserve one-line commands in a
  horizontally scrollable middle region at constrained widths.
- Use the same darker `#00588a` blue for the UCSB mark and enabled Run control,
  and remove approximately 2 px from header, button, selector, panel-bar, and
  representative Monitor-control heights.
- Assert the final hierarchy, 27/19 px header geometry, lower-left placement,
  compact controls, settled enabled state, and narrow no-clipping behavior in
  the Chrome harness.

Usable result: students see one literal project-entrypoint concept, four
non-overlapping run-status questions, and a denser interface whose fixed header
ends remain legible at both wide and constrained laptop widths.

### Refinement 11 — Stable signal geometry and persistent world context

Status: implemented and validated in Stable Chrome and direct production
Chrome.

- Give every selected signal a fixed 180 px plot row and scroll the stack when
  it exceeds the available region, so adding or removing signals never changes
  another plot's y-axis height.
- Add exactly one unlabeled minor x-grid line between adjacent labeled time
  lines.
- Keep the world view mounted before pose publication or while a physical XRP
  is unreachable, using an explicitly labeled XRP preview centered at the
  origin rather than implying measured pose.
- Render the chassis rails and crossmembers in one dark gray and terminate the
  Monitor's `IDE ↗` title-bar link with a visible separator.
- Exercise plot add/remove geometry, the no-pose physical state, header
  semantics, wide and narrow layouts, and the full course workflow suite.

Usable result: signal comparisons retain a stable visual scale and the spatial
features remain discoverable without presenting a preview pose as telemetry.

### Refinement 12 — Conservative efficiency and static distribution

Status: implemented and validated in unit, production-build, deployment-path,
offline, and Stable Chrome checks.

- Keep Live controls permanently open in its existing Monitor position; remove
  the disclosure state without changing the controls or their lifecycle.
- Replace the complete ECharts import with only the line-chart, grid, title,
  legend, tooltip, and canvas modules used by the Monitor. Preserve every chart
  option and verify the resulting bundle reduction before retaining it.
- Package every installed production dependency's license and notice files,
  while continuing to exclude private reference source and machine-local
  configuration.
- Add one GitHub Pages artifact workflow whose base path comes from Pages, so
  the identical build works at the account root or a repository subpath.
- Prime Chrome's local-network permission from the HTTPS document before its
  physical-target SharedWorker connects, then annotate HTTP device requests as
  local-network traffic.
- Audit unused and historical resources without moving them merely for
  tidiness; retain hardware evidence and rollback archives, and defer legacy
  OSC/design-document archival because it has no shipped-runtime benefit.

Usable result: the Monitor downloads substantially less JavaScript, the static
release is license-complete and deployable through GitHub Pages, the HTTPS
physical-target path follows the current browser permission model, and no
course workflow or rendered application feature changes.

### Refinement 13 — Local-first release and dual robot networking

Status: implemented and validated in software and on the attached RP2350.

- Define local-first precisely: one complete online delivery followed by local
  application execution without further exchange with the web host.
- Make a uniquely named XRP access point with fixed address the default student
  network, while retaining an existing-Wi-Fi profile for private course routers
  and instructor fleet work.
- Keep one device service and browser target interface; store both endpoint
  choices and switch profiles without parallel application builds.
- Migrate station-only device and browser settings, fall back from an
  unavailable station to the recoverable hotspot, and expose only
  credential-free network status.
- Exercise AP activation/address/channel, station association, profile changes,
  fallback, USB repair, HTTP lifecycle, offline build, and the compact IDE
  selector.

Usable result: a student can save the applications locally, provision one XRP,
join its printed hotspot, and use the complete IDE/Monitor without campus
network access. An instructor can instead place the same robot and apps on an
isolated or ordinary local network.

### Refinement 14 — Student self-commissioning and repair

Status: software-complete; the physical changed-file/no-change repair boundary
passes on the attached XRP. The public-origin native permission handoff remains.

The command-line-only dependency made every new robot an instructor task. This
slice moves the existing deterministic USB installation boundary into the
public local-first application without changing the Wi-Fi runtime or course
API.

- Add a landing-page and IDE-Settings commissioning entrypoint with an optional
  workspace choice, and wait for the complete offline release. Folder
  selection must not block robot repair or conflate project storage with the
  browser's offline application cache.
- Use a user-selected Web Serial XRP connection to enter MicroPython raw REPL,
  inspect the exact RP2350 controller/runtime, and keep an existing hardware
  watchdog alive throughout repair.
- Generate a public commissioning manifest from the command-line provisioner's
  exact release file map. Compare remote SHA-256 values, transfer only
  changed files through temporary names, re-hash all destinations, and import
  the installed course, service, reference, and XRPLib components.
- Bundle and integrity-check the pinned official UF2. If controller inspection
  fails, enter bootloader mode, write the selected temporary RP2350 volume, and
  inspect the re-enumerated serial device before proceeding.
- Default a new XRP to its unique hotspot, preserve an existing robot's profile
  during repair, and retain explicit hotspot or existing-Wi-Fi selection. Never
  persist or echo a station password in the browser.
- Activate the profile, reset, probe for the exact release/service reply, store
  the physical target and endpoint, hand a selected workspace to the IDE, and
  open the IDE automatically without importing workspace contents as a project.
  The operating-system Wi-Fi selection remains the one
  manual hotspot handoff browsers cannot perform.
- Exercise the raw-paste protocol, standard raw fallback, controller rejection,
  firmware integrity, changed-only and repeated installs, readback failure,
  network selection, reset, service verification, folder/target handoff, and
  the complete real-payload wizard in automated Chrome.

Usable result: a student can commission, update, or repair the RP2350 XRP from
the public web release with the same safe-to-repeat action and exact files used
by instructor automation. An attached dev.7 XRP passes changed-only repair,
deliberate single-file repair, no-change repetition, runtime imports, and
reset. The remaining public claim is bounded to the native folder chooser,
Web Serial permission, and hotspot local-network handoff. Bootloader-volume
recovery remains for a robot that actually has incompatible firmware.

### Refinement 15 — Compact command surfaces and entry page

Status: implemented and validated in Stable Chrome and direct production
Chrome.

- Reduce header-control typography and spacing without changing command or
  target behavior.
- Replace the IDE and Monitor Run and Reset text controls with semantically
  labeled icons; switch the play icon to stop while a project is active.
- Shorten **Validate code** to **Validate** and reduce the width of the
  virtual/physical target selector.
- Tighten and rewrite the landing page around four literal entry actions: IDE,
  XRP setup/repair, Monitor, and getting started.
- Recheck wide and constrained layouts, keyboard-accessible names, stateful
  run/stop behavior, and horizontal overflow in Stable Chrome.

Usable result: the persistent application commands consume fewer horizontal
pixels while remaining unambiguous to assistive technology and first-time
students; the landing page states what to do without duplicating the guide.

### Refinement 16 — Student project workflow and physical repair closure

Status: implemented and validated in software, Chrome, and the attached XRP;
public-origin permission handoff remains.

- Separate initial setup/repair from the landing page's ordinary course-app
  actions, using one literal student-facing link.
- Make the IDE file list primary: remove redundant project/main-file prose,
  place Rename, Duplicate, Main, Delete, folder, Save, and new-template controls
  below it, and keep offline status at the lower-left edge.
- Clarify Windows/macOS support and use GitHub Desktop with the same local
  folder as the zero-credential course version-control workflow.
- Reframe the Guide around `main.py` as mission control, define Validate,
  Flash project, Run, Stop, and Reset separately, expose the Guide from the
  Monitor, and explain local-first update behavior.
- Preserve the 30,000-sample rolling recorder while showing observed rate and
  the corresponding time capacity.
- Make browser and command-line robot repair compare first, verify each changed
  temporary payload, and activate it with one destination-replacing rename.
  Exercise first update, no-change repeat, controlled one-file repair, runtime
  imports, and reset on the attached RP2350.

Usable result: project creation, editing, persistence, version control, robot
repair, and data retention have one concise student-facing path. The remaining
physical work is the actual public-site permission handoff and floor-dependent
calibration, not another software or instructor setup workflow.

### Refinement 17 — Student API reference

Status: standalone review draft complete and checked against the current
package; Guide integration awaits instructor review.

- Document the ordinary `main.py` loop, project-file responsibilities, units,
  signs, return values, and call order before listing individual classes.
- Separate the six interfaces students implement from the larger set of
  supplied values, helpers, robot, mapping, planning, mission, and live-control
  services they may call.
- State required behavior without prescribing the retained reference
  algorithms, planning data structure, or navigation implementation.
- Distinguish Python functions from IDE and Monitor actions, and direct
  students toward watch values and telemetry instead of per-sample printing.
- Verify that all 34 exported public package names and their current signatures
  appear in the standalone `USER_REFERENCE.md` draft.

Usable result: an undergraduate can determine what belongs in each project
file, what each student method receives and returns, and which supplied
functions are available without reading package internals or treating the
reference source as definitive.

### Refinement 18 — Fresh-session recovery and truthful execution state

Status: implemented and validated in unit, production/offline, Stable Chrome,
direct Chrome, and attached-controller checks.

- Keep USB as the complete commissioning, repair, and network-configuration
  transport. Explain that physical Run, Monitor, and telemetry use the robot's
  selected local Wi-Fi after setup; USB may remain attached but is not a second
  runtime transport.
- Make the setup workspace optional and never replace the default project with
  unrelated source files merely because a prior directory permission exists.
- Let a fresh virtual Monitor prepare and run the shared Expanding spiral
  default without requiring the IDE to run first. Continue requiring an
  explicit physical flash when no verified project exists on the robot.
- Make Run validate the current project automatically and stop with the
  compiler error in Details when validation fails. Preserve prior validation,
  output, completion, and exception messages across subsequent runs and reset.
- Present one literal project identity first in IDE Status, followed by Target,
  Validation, and Robot project. Keep browser recovery distinct from native
  project storage and the verified cached application.

Usable result: a fresh browser session starts with one predictable project,
either app can start the virtual default, Run and Details agree about what
happened, and setup does not silently import an unrelated repository.

### Refinement 19 — Workspace, project folders, and output clarity

Status: implemented and validated in unit, offline, Stable Chrome, and direct
Chrome passes.

- Treat the onboarding selection as a workspace containing named project
  folders. Remember workspace and active-project handles independently, with a
  metadata-based migration for earlier single-folder state.
- When a workspace is active, ask for a project-folder name before creating a
  template, write the project immediately, and route source copies, run output,
  and telemetry into that project folder.
- Show `./<project-folder>` above the file list; use literal file-action and
  project-action labels; remove repeated automatic-save wording.
- Separate Program output from validation and service Details. Remove the
  redundant Monitor Guide/footer row and the redundant recording-ready label.
- Replace ambiguous offline wording with app-specific readiness and explain
  that Chrome owns the offline application copy separately from folders and
  without a Node server.

Usable result: students choose one workspace, create clearly named projects,
and find source, automatic copies, output, and telemetry together without
confusing that disk hierarchy with the browser's offline application cache.

### Refinement 20 — Figure, replay, and annotation export

Status: implemented and validated in unit, production/offline, Stable Chrome,
and direct Chrome passes.

- Add one compact note entry to Monitor Recording. Attach each note to the
  current telemetry time and published pose; show or hide all world and strip
  plot notes with one stateful control.
- Generate one self-contained SVG containing every selected signal plot and
  the current time window. Rasterize that same figure at 2× resolution for PNG
  so the two exports cannot drift.
- Replay a stopped telemetry recording in an isolated 960×720 world canvas and
  encode it as WebM with browser-native APIs. Preserve real time for short
  recordings and bound longer exports to 20 seconds with a visible speed label.
- Retain at most 24 notes, include them in monitored-run metadata, and use the
  latest monotonic pose segment after a reset. Keep export local and add no
  dependency or server path.
- Exercise SVG content, PNG bytes, actual Stable Chrome WebM encoding,
  recorder-start ordering, annotation visibility, replay bounds, responsive
  controls, and offline build inclusion.

Usable result: students can produce publication-ready plot figures, a portable
world replay, and compact synchronized observations directly from the Monitor
without screen recording or manual plot reconstruction.

### Refinement 21 — Literal export, storage, and responsive application state

Status: implemented and validated in focused unit, production, offline, Stable
Chrome, and direct-Chrome visual passes.

- Separate Recording from Export, use one Start/Stop recording command, name
  every export action, and show why WebM export is unavailable.
- Retain explicit replay export and add an optional replay-after-Stop control.
  Save exports under the active project or ask for a destination.
- Replace global note entry with a time-anchored plot editor and keyboard path.
- Separate Program output from System log in both apps. Preserve prior output.
- Replace hidden narrow-header scrolling with visible responsive wrapping and
  strengthen only the principal panel dividers.
- Add a manifest/install path while describing browser-owned offline storage,
  workspace files, clearing, and updates literally.
- Reduce the Guide to student tasks, course data flow, and recovery.

Usable result: controls remain discoverable at every supported desktop width,
students know what is recording, exporting, stored, or disconnected, and the
offline release needs neither Node nor a second installation workflow.

### Refinement 22 — Component evidence and telemetry provenance

Status: implemented in software and validated with Python, MicroPython,
TypeScript, production build, and focused Stable Chrome tests. Physical values
remain optional for compatibility with an older commissioned service.

- Ship a concise README and deterministic `component_checks.py` with every
  challenge; run checks in hardware-free MicroPython with PASS/PENDING/FAIL.
- Keep Validate as compilation rather than silently redefining it as testing.
- Propagate requested body motion, target wheel speeds, measured wheel speeds,
  student odometry, and virtual ground truth as distinct telemetry evidence.
- Append explicit fields to CSV without moving or deleting existing columns.
- Show target-versus-measured wheel speed and virtual odometry position error.

Usable result: course instructions to test a module have a concrete tool, and
the virtual Monitor no longer lets simulator truth conceal an incorrect student
controller or odometry implementation.
