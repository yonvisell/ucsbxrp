# Project status

Last updated: 2026-08-01

## Current result

The seven delivery slices in `IMPLEMENTATION_PLAN.md` form one usable course
development release: five cumulative starters, a canonical MicroPython
library, revisable supplied implementations, a deterministic virtual XRP, a
browser IDE, an XRP Monitor, complete offline web tools, and a private RP2350
LAN service. The same project files and target commands cross the browser,
simulator, and physical-controller boundaries.

The attached RP2350 was provisioned on `Pink` at `192.168.7.30`. Stationary
sensors, project transfer, compilation, execution, logs, course pose telemetry,
stop/reset/reconnect, simultaneous IDE/Monitor use, recording, and raised-wheel
motor response were exercised. The user observed the left, right, and paired
wheel motion expected by the encoder evidence.

One final hardware repetition is pending. Two strict service lifecycle probes
and the complete two-app browser workflow passed after the RP2350 concurrency
corrections. A later repetition, added only to retain one more intermediate
boot identifier, timed out after rapid browser target remounts had occurred;
the board remained USB-enumerated but neither HTTP nor the USB REPL responded.
That symptom is consistent with an orphaned browser polling connection, but
does not prove that diagnosis. The browser client now invalidates unfinished
connects, shares one physical connection across tabs, and delivers disconnect
before closing its shared-worker port. Unit regressions pass. The board has not
been reset since this final client change, so the corresponding device repeat
is intentionally reported as pending rather than inferred.

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
- Explicit **Validate code**, **Sync project**, **Run**, **Stop program**, and
  **Reset** operations for virtual or physical targets.
- A compact project rail, collapsible project/settings/output panels, 11 px
  default editor and output type, clear labels, and documented shortcuts.
- Separate Status and Details views, physical-address editing, local Monaco
  workers, and MicroPython compilation.

### XRP Monitor

- Shared virtual/physical target, top-down world and trail, obstacle and range
  ray, collision state, pose, encoders, efforts, range, button, IMU,
  temperature, battery, and program output.
- A compact collapsible left sidebar for target/environment selection,
  2–30 second scrolling plots, and recording controls.
- Independently selectable wheel-speed, motor-effort, forward-range,
  acceleration, and angular-rate strips with consistent line/color encoding.
- Bounded 30,000-sample recording, dropped-sample reporting, and deterministic
  25-column CSV export with units and blank unavailable values.

### Visual system

- One restrained system-sans interface; monospace is reserved for code and
  verbose program output.
- Light neutral surfaces, dark high-contrast text, compact square controls,
  sentence-case labels, and semantic teal, gold, red, and blue.
- The wide Monitor keeps controls in a side rail and fits the world, values,
  output, and scrolling plots in one viewport. Narrow layouts use the same
  collapsible rail as an overlay.
- The guide and landing page use the same compact visual language. Further
  aesthetic tuning can follow instructor review without changing behavior or
  application structure.

### Virtual and physical targets

- Fixed-step deterministic drivetrain, encoder quantization, robot footprint,
  arena bounds, collision, rectangular obstacles, geometric range, IMU,
  temperature, battery, and button behavior.
- A shared worker owns the virtual target across IDE and Monitor tabs; each run
  uses a disposable MicroPython worker and an owner lease so browser loss also
  terminates non-yielding code and converges effort to zero.
- A separate shared worker gives all open web-app tabs one physical polling
  connection and broadcasts the same state, telemetry, and output.
- The physical service supports discovery, capabilities, compilation,
  correlated/idempotent commands, transactional project transfer, execution,
  logs, telemetry, stop/reset/reconnect, bounded input, browser preflight, and
  a run lease.
- The one-command USB provisioner reads the `Pink` credential without printing
  it, installs and verifies every course/reference/service file, resets the
  controller, and waits for LAN discovery.

### Offline and guidance

- The production service worker verifies all 84 public payload files,
  including the applications, workers, MicroPython WebAssembly, course source,
  starters, and supplied bytecode. The interface says **Web tools work
  offline**; robot connectivity remains a separate status.
- The guide and repository README cover the virtual workflow, project files,
  physical setup, target operations, Monitor signals, shortcuts, recovery, and
  later physical calibration.

## Validation performed

The latest complete software pass includes:

- Prettier, TypeScript, and repository whitespace checks;
- 82 CPython contract and harness tests;
- MicroPython 1.28 WebAssembly behavior parity for the canonical package and
  exact supplied bytecode;
- 82 Vitest tests for project handling, target clients and lifecycle,
  simulator, telemetry, offline state, plot data, and measured contrast;
- a production build and verification of the exact 84-file offline manifest;
  and
- 11 stable-Chrome workflows covering all starters, blocked-gate replanning,
  two-app target sharing, run-owner loss, narrow layout, selectable/collapsed
  Monitor controls, recording/CSV export, and a network-blocked offline reload.

Direct Chrome inspection covered the wide IDE, Monitor, and guide after the
current visual rebuild. The world, values, signals, and output fit together;
the browser consoles were empty. Ordinary text is tested at 4.5:1 or better;
control boundaries and focus indicators are tested at 3:1 or better.

## Physical evidence

`docs/hardware/2026-08-01-rp2350-lan-and-raised-wheel.json` records:

- SparkFun XRP Controller with RP2350, board-specific MicroPython 1.28.0, and
  XRPLib 2026.07.1;
- USB installation and byte-for-byte verification of 21 files;
- LAN discovery, browser preflight, compilation, atomic sync, zero-output
  execution, stdout, stationary telemetry, stop/restart, reset, and reconnect;
- approximately 6.58 V motor supply and live range, button, IMU, and encoder
  readings;
- 0.22-effort raised-wheel pulses: left encoder `+197`, right encoder `+152`,
  and paired encoder deltas `+208 / +189`; and
- zero effort and unchanged encoder counts after the check, plus the user's
  direct confirmation that the wheels moved as expected.

`docs/hardware/2026-08-01-rp2350-concurrency-follow-up.json` records the two
later strict passes, simultaneous physical IDE/Monitor workflow, current source
identities, last timeout, evidence-bounded diagnosis, and exact pending repeat.

## Remaining work

1. Tap the attached XRP's **RESET** button once or briefly reconnect USB power.
   Then rerun the no-motion service probe and the physical IDE/Monitor workflow.
   The current service is already installed; reprovision only if it does not
   return. No firmware, Wi-Fi, router, or application change is expected.
2. On the final course surface, measure wheel-speed response, effective wheel
   diameter and track width, stopping distance, and motion-induced IMU/range
   behavior; update `robot_config.py` and simulator comparison envelopes.
3. Run each complete challenge on the floor after calibration. These empirical
   results should refine configuration, not create another student workflow or
   target protocol.

The production preview remains available at `http://127.0.0.1:4174/`.
