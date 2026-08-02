# Project status

Last updated: 2026-08-01

## Current result

The seven delivery slices in `IMPLEMENTATION_PLAN.md` form one usable course
development release: five cumulative starters, a canonical MicroPython
library, revisable supplied implementations, a deterministic virtual XRP, a
browser IDE, an XRP Monitor, complete offline web tools, and a private RP2350
LAN service. The same project files and target commands cross the browser,
simulator, and physical-controller boundaries.

Refinement slices 1 and 2 are complete. The Monitor now uses flat, independently
resizable regions; a bounded arena grid with labeled millimeter coordinates;
compact signal and recording controls; precise drive-command and yaw-rate
labels; a closer dimensioned XRP view; and a narrow top-sheet control layout.
Production tabs also reload once when a newer complete offline shell activates,
preventing a long-open page from silently displaying the previous build.

The IDE and Monitor now share one named runnable project revision and one
stateful Run/Stop control. The target publishes a source-free revision
descriptor; IDE edits mark it changed, disable Monitor Run, and become current
again only through an IDE run or synchronization. The browser, CPython probe,
and RP2350 service compute the same project identity. The physical service
discovers the retained project after boot and preserves it through stop/reset.

The attached RP2350 was provisioned on `Pink`; its current DHCP address is
`192.168.7.32`. Stationary
sensors, project transfer, compilation, execution, logs, course pose telemetry,
stop/reset/reconnect, simultaneous IDE/Monitor use, recording, and raised-wheel
motor response were exercised. The user observed the left, right, and paired
wheel motion expected by the encoder evidence.

The requested final hardware repetition is complete. The current service
passed the strict compile/sync/run/telemetry/stop/reset lifecycle after a manual
reset, and Stable Chrome exercised the complete five-file Challenge 1 path
through the same service. The physical client now distinguishes device boots,
restarts its log cursor after a reboot, and keeps intentional stop/reset cycles
in a reconnecting state instead of exposing a transient timeout. A repeated
raised-wheel check verified both motors, both encoders, and paired response.

## Delivered course release

- `ucsb_xrp` 0.2.0-dev provides explicit value records, robot configuration,
  `XRPBot`, the measured `Robot` loop, straight-line control, arena/grid
  utilities, and delivery-mission orchestration.
- Students implement six focused components: `SensorModel`,
  `WheelSpeedController`, `DifferentialDrive`, `Odometry`,
  `NavigationController`, and `GridPlanner`.
- Supplied source for Challenges 1–4 is retained as revisable build input, not
  treated as definitive. Reproducibly generated ordinary `.mpy` artifacts run
  in both browser and RP2350 MicroPython.
- Five complete starters keep the task entrypoint, challenge values, robot
  configuration, component selection, and student work in five plainly named
  files. Normal starters publish structured telemetry through `Robot`; they do
  not print periodic sample counters.
- Challenge 5 exercises both an open route and a newly blocked delivery gate,
  including range observation, replanning, navigation, and explicit outcomes.

## Delivered applications

### IDE

- Local working-folder open/save plus continuously recovered browser state.
- Create, rename, duplicate, delete, and tab among project files; select the
  startup file and load any course starter.
- Explicit **Validate code** and **Sync project** operations, one stateful
  **Run/Stop** control, and **Reset** for virtual or physical targets.
- A compact project rail, collapsible project/settings/output panels, 9 px
  default editor and output type, an 8 px selectable minimum, optional code
  overview, clear labels, and documented shortcuts.
- Separate Status and Details views, physical-address editing, local Monaco
  workers, and MicroPython compilation.

### XRP Monitor

- Shared virtual/physical target, dimensioned top-down XRP and trail, bounded
  2,400 × 1,800 mm grid with labeled x/y values, arena/XRP zoom views, obstacle
  and range ray, contact state, pose, encoders, drive command, range, button,
  IMU, temperature, battery, and program output.
- A 176 px collapsible sidebar for signal selection and recording; the virtual
  scene is selected directly in the world, while target settings remain shared
  from the IDE.
- Independently selectable wheel-speed, drive-command, forward-range,
  acceleration, and yaw-rate strips with labels and units inside each plot.
- Persistent pointer- and keyboard-adjustable separators independently size
  world/values, plots/output, and upper/lower regions.
- Bounded 30,000-sample recording, dropped-sample reporting, and deterministic
  25-column CSV export with explicit seconds, m/s², rad/s, millimeters, and
  blank unavailable values.

### Visual system

- One system-sans interface; monospace is reserved for code and program output.
- White work surfaces, neutral separators and controls, UCSB navy branding,
  high-contrast text, compact square controls, and color reserved for state or
  signal identity.
- The wide Monitor keeps controls in a side rail and fits the world, values,
  output, and plots in one viewport. Narrow layouts use a compact top sheet and
  a vertically scrolling content order.
- Status text is no longer styled like a button. Offline readiness is labeled
  **Saved for offline use** and explicitly distinguishes the web copy from the
  robot connection.

### Virtual and physical targets

- Fixed-step deterministic drivetrain, encoder quantization, robot footprint,
  arena bounds, collision, rectangular obstacles, geometric range, IMU,
  temperature, battery, and button behavior.
- A shared worker owns the virtual target across IDE and Monitor tabs; each run
  uses a disposable MicroPython worker and an owner lease so browser loss also
  terminates non-yielding code and converges effort to zero.
- The shared target retains the exact current project and publishes its name,
  startup file, revision, and changed/current state. Either app can start that
  revision; the Monitor cannot start code made stale by IDE edits.
- A separate shared worker gives all open web-app tabs one physical polling
  connection and broadcasts the same state, telemetry, and output.
- The physical service supports discovery, capabilities, compilation,
  correlated/idempotent commands, transactional project transfer, execution,
  logs, telemetry, stop/reset/reconnect, bounded input, browser preflight, and
  a run lease.
- The service isolates student-core startup imports from service-core HTTP
  allocation. Device boot identifiers make log sequence resets explicit, and
  short reconnect probes avoid false errors during intentional reboots.
- The one-command USB provisioner reads the `Pink` credential without printing
  it, installs and verifies every course/reference/service file, obtains the
  actual post-reset DHCP address over USB, restarts the controller, and waits
  for LAN discovery.

### Offline and guidance

- The production service worker verifies all 84 public payload files,
  including the applications, workers, MicroPython WebAssembly, course source,
  starters, and supplied bytecode. The interface says **Saved for offline
  use**; robot connectivity remains a separate status.
- The guide and repository README cover the virtual workflow, project files,
  physical setup, target operations, Monitor signals, shortcuts, recovery, and
  later physical calibration.

## Validation performed

The latest complete software pass includes:

- Prettier, TypeScript, and repository whitespace checks;
- 86 CPython contract and harness tests;
- MicroPython 1.28 WebAssembly behavior parity for the canonical package and
  exact supplied bytecode;
- 92 Vitest tests for project identity and handling, target clients and lifecycle,
  simulator, telemetry, offline state, plot data, and measured contrast;
- a production build and verification of the exact 84-file offline manifest;
  and
- 12 stable-Chrome software workflows covering all starters, blocked-gate replanning,
  two-app target sharing, run-owner loss, narrow layout, selectable/collapsed
  Monitor controls, recording/CSV export, and a network-blocked offline reload;
  plus one opt-in Stable Chrome hardware workflow covering the shared physical
  project lifecycle, which passed against the attached XRP.

The current Monitor pass includes a direct narrow Chrome inspection and an
original-size 1,440 × 900 Stable Chrome capture. It covered the bounded labeled
grid, XRP zoom, expanded/collapsed controls, thin slider, live values, plots,
output, and responsive top sheet. Wide and narrow interaction tests exercised
the splitters and controls. Browser consoles were empty. Ordinary text is
tested at 4.5:1 or better; control boundaries and focus indicators are tested
at 3:1 or better. Earlier claims of comprehensive IDE visual inspection do not
apply to the pending IDE refinement slice.

## Physical evidence

`docs/hardware/2026-08-01-final-app-and-rp2350-validation.json` records the
current final pass:

- the exact installed service and harness hashes;
- strict LAN discovery, browser preflight, compile, atomic sync, zero-effort
  execution, stdout, stationary/pose telemetry, stop/restart, and reset;
- full five-file physical IDE/Monitor startup and reboot-aware output;
- approximately 6.54–6.59 V motor supply and live range, button, IMU, and
  encoder readings; and
- 0.22-effort raised-wheel pulses with left `+303`, right `+291`, and paired
  encoder deltas `+399 / +351`, ending at zero commanded effort.

Earlier investigations remain under `docs/hardware/` as provenance, including
the superseded timeout that prompted the final client lifecycle correction.
`docs/hardware/2026-08-01-shared-project-lifecycle-validation.json` records the
subsequent retained-revision, post-reset DHCP discovery, and two-app physical
Run/Stop refinement proof.

## Remaining work

1. Complete the IDE workspace/template redesign, folder autosave and recovery,
   coordinated course-runtime/API clarification, and structured watches/live
   parameters in the active refinement plan.
2. Red-team and repeat integrated virtual, Chrome, offline-update, persistence,
   and physical-target validation after those slices.
3. On the final course surface, measure wheel-speed response, effective wheel
   diameter and track width, stopping distance, and motion-induced IMU/range
   behavior; update `robot_config.py` and simulator comparison envelopes.
4. Run each complete challenge on the floor after calibration. These empirical
   results should refine configuration, not create another student workflow or
   target protocol.

The production preview remains available at `http://127.0.0.1:4174/`.
