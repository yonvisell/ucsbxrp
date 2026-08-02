# Project status

Last updated: 2026-08-02

## Current result

The seven delivery slices in `IMPLEMENTATION_PLAN.md` form one usable course
development release: five cumulative starters, a canonical MicroPython
library, revisable supplied implementations, a deterministic virtual XRP, a
browser IDE, an XRP Monitor, complete offline web tools, and a private RP2350
LAN service. The same project files and target commands cross the browser,
simulator, and physical-controller boundaries.

Refinement slices 1–13 are complete in software. The Monitor now uses flat,
independently resizable regions; a bounded arena grid with labeled millimeter
coordinates; compact signal and recording controls; precise drive-command and
yaw-rate labels; a closer dimensioned XRP view; and a narrow top-sheet control
layout. Production tabs explicitly check for a newer complete offline shell
and reload once when it activates, preventing a long-open page from silently
displaying the previous build.

The IDE now applies the same flat, high-contrast visual system: a white 188 px
file rail, thin separators, compact 10 px controls, 9 px default code, no
redundant file-type badges, literal main-file state, and unclipped toolbar
and folder controls. One grouped template menu loads all five challenges, two
sensor-driven robot demos, or seven staged MicroPython lessons as an ordinary
editable project. The new expanding-spiral demo exposes only forward speed and
spiral winding rate, checks forward range on every sample, stops within 260 mm,
and retains a bounded-travel fallback plus unconditional final zero drive. A
Monitor opened after the IDE starts a virtual run now attaches to that active
run without treating its unchanged scene preference as a forbidden change.

Both application headers are now 29 px high and use a contiguous `UCSBXRP`
wordmark: UCSB blue and a restrained grey-red product name share the same type,
size, and weight. The UCSB mark and enabled Run control use the same darker
`#00588a` blue. Header selectors and buttons are 21 px high; the IDE command
region remains one line and scrolls horizontally when necessary, while target
state and Settings stay fixed at the far right. IDE and Monitor links carry a
visible diagonal arrow and open a separate tab in both directions. In the
Monitor, Signals and Time window precede permanently open Live controls, named
watches appear below Live values in the right panel, and
`Guide | • Saved for offline use` occupies the bottom of the controls sidebar
only while that sidebar is open.
In the IDE, offline readiness occupies the lower-left edge of the file rail
only while the rail is open.

The web release is now explicitly local-first: after one verified online load,
all application and course assets execute from browser-local storage without
further exchange with the web host. Physical traffic uses either a default
device-specific XRP hotspot at `192.168.42.1` or an optional existing Wi-Fi
network. IDE Settings groups project sync, controls, telemetry, and address
under **XRP Wi-Fi** while identifying USB as the firmware, setup, and repair
path. Station-only preferences migrate without losing their saved endpoint.

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

The attached RP2350 is provisioned on `Pink` at `192.168.7.34`. Release
`2026.08-dev.4` is installed. Its device-specific `UCSB-XRP-9EDE` hotspot,
fixed `192.168.42.1` address, Pink station association, and failed-station
hotspot fallback all pass on the physical radio. Its strict browser-preflight,
compile, atomic sync, zero-output run, stdout, stationary and course-pose
telemetry, stop/restart, and reset/reconnect probe passes on repetition. Final
readings include zero drive command, zero wheel speed, approximately 6.4 V
motor supply, live range/button/IMU data, and retained project identity.

The two-app Chrome repetition now passes the previously failing second launch.
The IDE validated three Python files and synchronized the four-file obstacle
demo; the Monitor received the same physical project and live telemetry,
changed Run to Stop and back, and accepted a live Forward speed update from
120 to 150 mm/s while the program waited for USER. No motion command was issued
in this repetition, and the final physical readings remained 0.00 / 0.00.

USB maintenance exposed a separate recovery weakness: an already-active RP2350
watchdog could reset the controller during a long read-verified installation.
The dev.4 boot path now starts and feeds the watchdog before importing the
service and throughout Wi-Fi association; the installer feeds it before and
after every transfer/readback operation. A complete 22-file USB install,
service restart, DHCP discovery, strict physical probe, and retained-project
restore pass with this correction.

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
- Create, rename, copy, delete, and tab among project files; select the main
  file and load any challenge, robot demo, or tutorial template.
- Explicit **Validate code** and **Sync project** operations, one stateful
  **Run/Stop** control, and **Reset** for virtual or physical targets.
- A compact project rail, collapsible project/settings/output panels, 9 px
  default editor and output type, an 8 px selectable minimum, optional code
  overview, clear labels, and documented shortcuts.
- Sensor-feedback obstacle-turn and expanding-spiral demos plus a seven-lesson
  MicroPython project; all are editable, folder-saveable,
  MicroPython-validated, and runnable in the virtual target.
- Separate Status and Details views, grouped XRP-hotspot/existing-Wi-Fi
  selection and station-address editing, local Monaco workers, and MicroPython
  compilation.

### XRP Monitor

- Shared virtual/physical target, dimensioned top-down XRP and trail, bounded
  2,400 × 1,800 mm grid with labeled x/y values, arena/XRP zoom views, obstacle
  and range ray, contact state, pose, encoders, drive command, range, button,
  IMU, temperature, battery, and program output. Without a published pose, the
  map remains present with a labeled XRP preview centered at the origin.
- A 176 px collapsible sidebar for signal selection and recording; the virtual
  scene is selected directly in the world, while target settings remain shared
  from the IDE.
- A permanently open Live controls region below Time window renders declared
  numeric parameters as thin sliders, Booleans as checkboxes, and short choices
  as radio controls. Named watch values form a compact table below Live values in
  the right panel. Pending and applied values are shared across tabs and
  controls disable when the program is not running.
- Independently selectable wheel-speed, drive-command, forward-range,
  acceleration, and yaw-rate strips with labels and units inside each plot.
  Every plot retains a 180 px row as signals are added or removed; the stack
  scrolls, and one unlabeled minor time line divides each pair of labeled lines.
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
  main file, revision, and changed/current state. Either app can start that
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
- The one-command USB provisioner defaults to a uniquely named XRP hotspot,
  installs and verifies every course/reference/service file, and reports its
  fixed address. Optional station mode reads the selected local credential
  without printing it, obtains the actual DHCP address over USB, restarts the
  controller, and waits for LAN discovery. A failed station association starts
  the recoverable hotspot.

### Offline and guidance

- The production service worker verifies all 154 public payload files,
  including the applications, workers, MicroPython WebAssembly, course source,
  starters, demo/tutorial templates, supplied bytecode, and dependency license
  notices. The interface says
  **Saved for offline use**; robot connectivity remains a separate status.
- The guide and repository README cover the virtual workflow, project files,
  physical setup, target operations, Monitor signals, shortcuts, recovery, and
  later physical calibration.
- `docs/RED_TEAM_REVIEW.md` records the integrated failure-mode review,
  implemented mitigations, evidence, and remaining empirical boundaries.

## Validation performed

The latest complete software pass includes:

- Prettier, TypeScript, and repository whitespace checks;
- 116 CPython contract and harness tests;
- MicroPython 1.28 WebAssembly behavior parity for the canonical package and
  exact supplied bytecode;
- 109 Vitest tests for project identity and handling, folder rotation, target
  clients and lifecycle, simulator, telemetry, offline state, plot data, and
  measured contrast;
- a production build and verification of the exact 154-file offline manifest;
  and
- 20 passing Stable Chrome software workflows covering all starters, the two
  robot demos and tutorial project, flat IDE geometry, four-generation source
  autosave, per-run telemetry/output autosave, blocked-gate replanning,
  two-app target sharing,
  run-owner loss, narrow layouts, selectable/collapsed Monitor controls,
  typed live parameter updates and named watches, recording/CSV export, and a
  network-blocked offline reload, and XRP-hotspot/existing-Wi-Fi selection;
  plus direct Chrome and harness repetitions on the attached RP2350. The
  previously failing second launch, physical live-parameter update,
  stop/reconnect, read-verified USB repair, and strict post-reset lifecycle now
  pass on release `2026.08-dev.4`.

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

The final header/status refinement was inspected again at 1,382 × 752 and
1,152 × 720 in direct production Chrome, with a separate 691 px constrained
inspection. Measurements confirmed 29 px headers; 21 px header controls; 22 px
project controls; a 6 px right inset for Settings; exact matching
`rgb(0, 88, 138)` UCSB-mark and enabled-Run colors; a lower-left offline status
whose bottom edge matches the open file rail; and no offline status in either
header. The IDE calls the selected entrypoint **Main file** and its Status view
now separates only Target, Code check, Robot files, and Project files. The
constrained pass found and corrected multiline toolbar clipping by making the
middle command region single-line and horizontally scrollable. Direct Chrome
reported no console warnings or errors.

The fixed-plot/world-preview refinement was then inspected directly in
1,382 × 797 production Chrome. Four enabled plots each remained exactly 180 px
inside a 287 px viewport, producing a 720 px scrollable stack; one unlabeled
x-grid line appeared between adjacent labeled values. XRP zoom confirmed one
dark gray chassis shade, and the Monitor header displayed `IDE ↗ |`. A separate
Stable Chrome path used an unreachable physical endpoint and verified that the
full-size map and centered, explicitly non-pose XRP preview remained visible.
All 20 software Chrome workflows pass and the physical opt-in workflow is
intentionally skipped.

The conservative efficiency/distribution refinement then removed the unused
ECharts modules from the Monitor bundle while retaining the same chart options.
Minified Monitor JavaScript decreased from 1,687,014 to 1,081,536 bytes; gzip
size decreased from 511,939 to approximately 318 kB in the current build. The
complete static payload is 7,181,907 bytes including third-party license and
notice files.
The expanding-spiral slice was also inspected directly in production Chrome.
The IDE showed its four plainly named files and simple main program; the
Monitor showed the outward-curving trail, exactly two enabled live sliders,
range and drive telemetry, and clean program output. Stop returned the virtual
target to ready with zero drive, and neither application reported a console
warning or error. The focused regression opens the Monitor only after the IDE
starts the run, then verifies the running state, both live parameters, range
stopping, and final zero drive.

The GitHub Pages workflow uses the deployment base path reported by Pages and
publishes the verified `dist` artifact. An HTTPS physical connection now primes
Chrome's local-network permission in the document before starting the shared
worker and marks device fetches as local traffic. Root and `/ucsb-xrp/` builds,
the exact offline manifest, a network-blocked subpath reload, and the focused
Monitor/course workflow pass. Direct Chrome then reached the attached XRP from
both IDE and Monitor on Pink with live telemetry and no console warnings or
errors. Final origin-specific Pages-to-device permission remains a deployment
check because permission is scoped to the deployed origin. The final local
production build is `f185e26054e220e6096f` with 154 verified payload files.

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

`docs/hardware/2026-08-02-dev4-physical-browser-validation.json` closes that
regression with the installed dev.4 identities, strict physical lifecycle,
two-app Chrome evidence, live parameter update, final zero-command telemetry,
and the watchdog-safe USB maintenance correction.

`docs/hardware/2026-08-02-dual-network-validation.json` records the physical
hotspot, Pink station mode, failed-station fallback, repeated zero-output
service lifecycle, and final direct-Chrome IDE/Monitor connection.

## Remaining work

1. Publish the final Pages origin, grant Chrome Local Network Access once, and
   repeat connect/sync/run/stop/telemetry against an XRP from that origin. Also
   join the physical XRP hotspot once from a browser client; its radio,
   endpoint, fallback, and browser selector have already been validated
   independently.
2. On the final course surface, measure wheel-speed response, effective wheel
   diameter and track width, stopping distance, and motion-induced IMU/range
   behavior; update `robot_config.py` and simulator comparison envelopes.
3. Run each complete challenge on the floor after calibration. These empirical
   results should refine configuration, not create another student workflow or
   target protocol.

The production preview remains available at `http://127.0.0.1:4174/`.
