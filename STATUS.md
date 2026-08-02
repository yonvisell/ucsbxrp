# Project status

Last updated: 2026-08-01

## Current result

The seven delivery slices in `IMPLEMENTATION_PLAN.md` form one usable course
development release: five cumulative starters, a canonical MicroPython
library, revisable supplied implementations, a deterministic virtual XRP, a
browser IDE, an XRP Monitor, complete offline web tools, and a private RP2350
LAN service. The same project files and target commands cross the browser,
simulator, and physical-controller boundaries.

Refinement slices 1–6 are complete in software. The Monitor now uses flat,
independently resizable regions; a bounded arena grid with labeled millimeter
coordinates; compact signal and recording controls; precise drive-command and
yaw-rate labels; a closer dimensioned XRP view; and a narrow top-sheet control
layout. Production tabs explicitly check for a newer complete offline shell
and reload once when it activates, preventing a long-open page from silently
displaying the previous build.

The IDE now applies the same flat, high-contrast visual system: a white 188 px
file rail, thin separators, compact 10 px controls, 9 px default code, no
redundant file-type badges, literal startup-file state, and unclipped toolbar
and folder controls. One grouped template menu loads all five challenges, a
range-triggered obstacle/left-turn/obstacle demo, or seven staged MicroPython
lessons as an ordinary editable project.

Folder work is now low-friction and recoverable. Save now selects a normal
project folder once; subsequent edits are serialized and written automatically
after a short pause. Chrome retains the native handle where permitted and
otherwise exposes one Reconnect action. Four complete pre-overwrite project
states rotate in `UCSB_XRP_Autosaves`. The Monitor independently stores four
aligned generations of output text, run metadata, and unit-labeled telemetry
for every observed run; manual CSV exports remain explicit and unrotated.

The IDE and Monitor now share one named runnable project revision and one
stateful Run/Stop control. The target publishes a source-free revision
descriptor; IDE edits mark it changed, disable Monitor Run, and become current
again only through an IDE run or synchronization. The browser, CPython probe,
and RP2350 service compute the same project identity. The physical service
discovers the retained project after boot and preserves it through stop/reset.

The public course runtime is now `ucsb_xrp` 0.4.0-dev. New projects use the
literal `DriveCommand` and `XRPBot.set_drive()` vocabulary; earlier
`MotorEfforts`, `set_efforts()`, and configuration names remain compatibility
aliases. Each student component has its own plainly named module. `Robot` owns
wrap-safe absolute sample deadlines, records overruns, and skips missed periods
without timing drift or catch-up bursts. Programs can additionally declare up
to 16 bounded numeric, Boolean, or choice parameters and 16 named watch values
through `ucsb_xrp.live`. The Monitor renders compact controls, and `Robot`
applies queued values and publishes staged watches once per measured boundary.

The attached RP2350 was previously provisioned on `Pink`; its latest DHCP
address was `192.168.7.32`. Stationary sensors, project transfer, compilation,
execution, logs, course pose telemetry, stop/reset/reconnect, simultaneous
IDE/Monitor use, recording, and raised-wheel motor response were exercised on
the preceding release. The user observed the left, right, and paired wheel
motion expected by the encoder evidence.

The 0.3 package and service passed the strict
compile/sync/run/telemetry/stop/reset probe. The following two-app Stable Chrome
repetition passed its first run, stop/reboot, edit, and resynchronization, then
found a controller-level hang at the second `/run`. The corrected service now
returns its run reply before core-1 launch, the physical client leaves a 500 ms
startup polling interval, and a 7 s hardware watchdog makes any future VM
deadlock self-recovering. Release `2026.08-dev.3` adds the completed live
program protocol and passes the complete software suite. In the latest probe
the controller enumerated on neither USB nor its last LAN address, so this
release could not yet be installed or repeated.

## Delivered course release

- `ucsb_xrp` 0.4.0-dev provides explicit value records, robot configuration,
  `XRPBot`, the measured `Robot` loop, straight-line control, arena/grid
  utilities, and delivery-mission orchestration.
- Students implement six focused components: `SensorModel`,
  `WheelSpeedController`, `DifferentialDrive`, `Odometry`,
  `NavigationController`, and `GridPlanner`.
- Supplied source for Challenges 1–4 is retained as revisable build input, not
  treated as definitive. Reproducibly generated ordinary `.mpy` artifacts run
  in both browser and RP2350 MicroPython.
- Five complete starters keep the task entrypoint, challenge values, robot
  configuration, component selection, and each student component in a plainly
  named file. Normal starters publish structured telemetry through `Robot`;
  they do not print periodic sample counters.
- Challenge 5 exercises both an open route and a newly blocked delivery gate,
  including range observation, replanning, navigation, and explicit outcomes.

## Delivered applications

### IDE

- Local project-folder open, Save now, debounced automatic writes, persisted
  handle recovery, concise permission reconnect, four prior project states,
  and continuously recovered browser state.
- Create, rename, copy, delete, and tab among project files; select the startup
  file and load any challenge, robot demo, or tutorial template.
- Explicit **Validate code** and **Sync project** operations, one stateful
  **Run/Stop** control, and **Reset** for virtual or physical targets.
- A compact project rail, collapsible project/settings/output panels, 9 px
  default editor and output type, an 8 px selectable minimum, optional code
  overview, clear labels, and documented shortcuts.
- A sensor-feedback obstacle-turn demo and a seven-lesson MicroPython project;
  both are editable, folder-saveable, MicroPython-validated, and runnable in
  the virtual target.
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
- An expandable Live program region renders declared numeric parameters as
  thin sliders, Booleans as checkboxes, short choices as radio controls, and
  named watch values as a compact table. Pending and applied values are shared
  across tabs and controls disable when the program is not running.
- Independently selectable wheel-speed, drive-command, forward-range,
  acceleration, and yaw-rate strips with labels and units inside each plot.
- Persistent pointer- and keyboard-adjustable separators independently size
  world/values, plots/output, and upper/lower regions.
- Bounded 30,000-sample recording, dropped-sample reporting, and deterministic
  25-column CSV export with explicit seconds, m/s², rad/s, millimeters, and
  blank unavailable values.
- Automatic per-run output, metadata, and telemetry archives in the connected
  folder, with four aligned generations and cross-tab de-duplication.

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
  terminates non-yielding code and converges the drive command to zero.
- The shared target retains the exact current project and publishes its name,
  startup file, revision, and changed/current state. Either app can start that
  revision; the Monitor cannot start code made stale by IDE edits.
- A separate shared worker gives all open web-app tabs one physical polling
  connection and broadcasts the same state, telemetry, runtime controls, and
  output.
- The physical service supports discovery, capabilities, compilation,
  correlated/idempotent commands, transactional project transfer, execution,
  logs, telemetry, live parameter updates, stop/reset/reconnect, bounded input,
  browser preflight, and a run lease.
- The service prepares the entrypoint on core 0, replies in `loading` state,
  then starts core 1 after the response. Browser polling remains quiet during
  that startup, and a service-fed hardware watchdog automatically recovers a
  future VM deadlock. Device boot identifiers make log-sequence resets
  explicit; short reconnect probes avoid false errors during intentional
  reboots.
- The one-command USB provisioner reads the `Pink` credential without printing
  it, installs and verifies every course/reference/service file, obtains the
  actual post-reset DHCP address over USB, restarts the controller, and waits
  for LAN discovery.

### Offline and guidance

- The production service worker verifies all 117 public payload files,
  including the applications, workers, MicroPython WebAssembly, course source,
  starters, demo/tutorial templates, and supplied bytecode. The interface says
  **Saved for offline use**; robot connectivity remains a separate status.
- The guide and repository README cover the virtual workflow, project files,
  physical setup, target operations, Monitor signals, shortcuts, recovery, and
  later physical calibration.
- `docs/RED_TEAM_REVIEW.md` records the integrated failure-mode review,
  implemented mitigations, evidence, and remaining empirical boundaries.

## Validation performed

The latest complete software pass includes:

- Prettier, TypeScript, and repository whitespace checks;
- 98 CPython contract and harness tests;
- MicroPython 1.28 WebAssembly behavior parity for the canonical package and
  exact supplied bytecode;
- 103 Vitest tests for project identity and handling, folder rotation, target
  clients and lifecycle, simulator, telemetry, offline state, plot data, and
  measured contrast;
- a production build and verification of the exact 117-file offline manifest;
  and
- 17 Stable Chrome software workflows covering all starters, both new project
  templates, flat IDE geometry, four-generation source autosave, per-run
  telemetry/output autosave, blocked-gate replanning, two-app target sharing,
  run-owner loss, narrow layouts, selectable/collapsed Monitor controls,
  typed live parameter updates and named watches, recording/CSV export, and a
  network-blocked offline reload;
  plus one opt-in Stable Chrome hardware repetition. Its first complete
  lifecycle passed; the second launch exposed the RP2350 hang described above.
  The resulting watchdog/deferred-launch correction is software-validated but
  not yet installed on the currently frozen controller.

The current Monitor pass includes the original-size 1,440 × 900 Stable Chrome
capture plus a direct 1,382 × 752 Chrome inspection of the complete production
bundle. It covered the bounded labeled grid, XRP zoom, expanded/collapsed
controls, 212 px live-values region, thin sliders, watch values, plots, output,
and responsive top sheet. Forward speed was changed from 120 to 180 mm/s in
the real Monitor, applied at a program boundary, and the demo completed with
zero drive command. Wide and narrow interaction tests exercised the splitters
and controls. Ordinary text is tested at 4.5:1 or better; control boundaries
and focus indicators are tested at 3:1 or better. The IDE and guide were also
visually inspected at 1,382 × 752; the IDE header, toolbar, project rail,
folder controls, tabs, editor, and output had no clipping. The responsive
Stable Chrome workflow separately exercised the 375 px layout.

## Physical evidence

`docs/hardware/2026-08-01-final-app-and-rp2350-validation.json` records the
earlier complete app/robot pass:

- the exact installed service and harness hashes;
- strict LAN discovery, browser preflight, compile, atomic sync, zero-effort
  execution, stdout, stationary/pose telemetry, stop/restart, and reset;
- full then-current five-file physical IDE/Monitor startup and reboot-aware
  output;
- approximately 6.54–6.59 V motor supply and live range, button, IMU, and
  encoder readings; and
- 0.22-effort raised-wheel pulses with left `+303`, right `+291`, and paired
  encoder deltas `+399 / +351`, ending at zero commanded effort.

Earlier investigations remain under `docs/hardware/` as provenance, including
the superseded timeout that prompted the final client lifecycle correction.
`docs/hardware/2026-08-01-shared-project-lifecycle-validation.json` records the
subsequent retained-revision, post-reset DHCP discovery, and two-app physical
Run/Stop refinement proof.

`docs/hardware/2026-08-01-course-runtime-api-validation.json` records the 0.3
package/reference install and passing strict physical service probe.
`docs/hardware/2026-08-01-runtime-launch-regression.json` separately records
the immediately following second-launch hang, trace, evidence-bounded
diagnosis, corrected source identities, automatic-recovery design, complete
software validation, and pending reset/install/repetition. The passing probe is
not erased, and the failed repetition is not reported as passing.

## Remaining work

1. Restore normal USB enumeration with one complete controller power cycle,
   run `scripts/provision_xrp.py` to install `2026.08-dev.3`, and repeat the
   strict physical probe, live-parameter demo, and two-run Chrome lifecycle.
   If normal reconnection still produces no serial port, reflash the current
   RP2350 MicroPython UF2 first. GPIO15 is not a hardware-reset substitute.
2. On the final course surface, measure wheel-speed response, effective wheel
   diameter and track width, stopping distance, and motion-induced IMU/range
   behavior; update `robot_config.py` and simulator comparison envelopes.
3. Run each complete challenge on the floor after calibration. These empirical
   results should refine configuration, not create another student workflow or
   target protocol.

The production preview remains available at `http://127.0.0.1:4174/`.
