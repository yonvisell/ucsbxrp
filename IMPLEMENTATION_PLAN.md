# Staged implementation and validation plan

The work proceeds in vertical slices. Each slice must leave a runnable result,
exercise the same contract across the library, target, simulator, IDE, and XRP
Monitor where those parts are relevant, and end with recorded evidence in
`STATUS.md`.

The three active `v2_` documents define the current course concept and are
design inputs, not immutable software contracts. Preserve the five-challenge
learning progression, physical conventions, and separation between supplied
and student work. Change a name, signature, ownership boundary, or workflow
when the change measurably reduces student friction or makes behavior safer or
clearer; update the course documents, implementation, examples, and tests as
one coordinated change.

## Governing principles

- Keep one canonical `ucsb_xrp` source tree. Run those exact files on physical
  MicroPython and browser MicroPython; replace only XRPLib with a virtual
  hardware adapter.
- `XRPBot` is the sole course-library boundary to XRPLib. The device-side
  supervisory service is infrastructure, not part of the student API.
- Make Validate, Synchronize project, Run, Stop, and Reset distinct operations.
  A sent command is not success; success requires a correlated target reply.
- The deterministic simulator owns physics and sensor truth. It must not
  implement student odometry, control, mapping, navigation, or planning.
- All physical tests declare a safety tier. The default hardware suite cannot
  issue nonzero motor effort.
- Wi-Fi and browser Local Network Access are a deferred physical-browser gate,
  not a blocker for USB, library, simulator, or application work.
- Prefer capability discovery over student-facing port and protocol settings.
  Expose low-level settings only in a diagnostic disclosure.
- Add a UI control only with its working behavior, failure state, and test.

The active dependency order is deliberately asymmetric. Software work may
continue over USB and the virtual XRP while the user-dependent H1 isolation
observation is pending. The physical browser session waits for both the
supervisory service and a deployed offline-ready HTTPS build. H2 motor motion
is a separate authorization gate and is not a prerequisite for implementing or
testing the service, simulator, IDE, or Monitor at zero effort.

## Slice 0R — Rebaseline and review

1. Record the attached controller, USB identity, mounted firmware evidence,
   motor-power state, and limits of what has actually been verified.
2. Remove the unsupported claim that the course documents pin XRPLib 2.0.1.
   Establish a machine-readable compatibility manifest from current official
   firmware sources and observed device data.
3. Audit the draft public API against the course learning outcomes. Resolve at
   least:
   - whether `MotorEfforts` should be retained, renamed, or removed;
   - how configuration defaults and per-robot calibration avoid a long,
     error-prone constructor;
   - whether waiting for the USER button is separate from resetting a run;
   - how the real-time sample cadence, overruns, and stop behavior are defined;
   - how reference and student implementations are selected without magic
     strings or hidden imports;
   - which records are immutable and which validation occurs at construction.
4. Replace product claims with an acceptance matrix for the library, device
   service, IDE, XRP Monitor, virtual target, USB hardware, powered motors, and
   Wi-Fi/browser path.
5. Establish a recoverable source-control baseline before overlapping
   implementation branches or destructive repository operations.

**Result:** accurate governing documents and explicit acceptance boundaries.

## Slice 1A — USB baseline and non-motion acceptance

The battery pack is disconnected, but the RP2350 controller can feed its motor
rail from USB-C when the board power switch is on. The current safe boundary is
therefore behavioral: no nonzero effort commands, explicit zero-before/after
cleanup, and no claim that absence of the battery makes the motors unpowered.
For subsequent H1 runs, switch the board off and confirm the MOT LED is off;
USB continues to power the RP2350 through its independent system rail.

1. Provide a small host harness with explicit operations:
   `probe`, `backup`, `install`, `run`, `collect`, and `recover`. Discovery is
   read-only. Installation and recovery require a verified board-specific
   manifest. No command in the default path can produce nonzero motor effort.
2. Preserve non-secret device evidence and query, when the runtime permits:
   `sys.implementation`, `os.uname()`, filesystem inventory, XRPLib import and
   version evidence, board power state, RM2-visible information, and reset
   recovery.
3. Classify the observed runtime before using its serial port. The attached
   baseline is XRP-WPILib 2.1.0, not a MicroPython REPL.
4. Verify the official RP2350 MicroPython image by immutable upstream identity,
   byte size, and SHA-256 before flashing. Enter the RP2350 UF2 bootloader only
   through a documented method; never copy firmware to the normal `PICODISK`
   status volume.
5. Install the compatible XRPLib bundle, then verify the REPL, imports,
   filesystem, soft-reset recovery, LED, USER button, IMU, range sensor, and
   encoder changes from safe manual wheel motion where practical.
6. Exercise only zero-effort and no-motion failure cleanup. Treat XRPLib's
   `are_motors_powered()` result as a VIN diagnostic, not a battery detector or
   authorization gate. Record motor motion, motor signs, and physical stopping
   as untested until the explicit H2 gate.

**Result:** repeatable USB development and non-motion hardware evidence without
changing the Mac's Wi-Fi network.

## Slice 1B — Authentic course package and reference artifacts

1. Create the real `ucsb_xrp` package, five-file student project template,
   examples, test fixtures, and `vendor/current/release.json` compatibility
   manifest.
2. Implement the smallest reviewed API needed for the first experiments:
   validated records and configuration, time/angle utilities, `XRPBot`, sensor
   conversion, wheel-speed control, and the supplied straight-distance
   controller needed by Challenge 1. Do not replicate the draft blindly.
   Differential-drive conversion and odometry first become necessary in
   Challenge 2 and should not be published early as placeholders.
3. Load the same package sources into CPython tests, WebAssembly MicroPython,
   and the physical RP2350. Simulated XRPLib implements the upstream calls used
   by `XRPBot`; no browser-only `ucsb_xrp` stub remains.
4. Build reference `.mpy` modules from one reference source tree using the
   MicroPython-compatible `mpy-cross`. Run the same public-behavior contracts
   against reference source, student exemplars, and the distributable bytecode.
   Ordinary non-native bytecode may use one artifact only after that exact file
   imports and passes the contracts on both measured runtimes. Produce
   target-specific artifacts only if native code or measured ABI evidence
   requires them.
5. Keep source, generated artifacts, license metadata, and compatibility
   identifiers traceable. Never hand-edit generated bytecode.

**Result:** physical and virtual runtimes execute one authentic course package.

## Slice 1C — Trustworthy target protocol and supervision

1. Replace the provisional physical interface with versioned capability and
   release discovery; separate connection state from program state.
2. Define correlated request/reply messages with request IDs, timeouts,
   structured errors, idempotent stop, and explicit outcomes for validation,
   staging, commit, start, stop, reset, and file inventory.
3. Make whole-project transfer atomic through staging plus commit or equivalent
   dual slots. An interrupted transfer must leave the previous runnable project
   intact.
4. Replace the fixed telemetry object with a versioned channel catalog,
   timestamped typed samples, logs, and events. Retain conventional channel
   names for wheel, pose, range, and virtual ground truth.
5. Prove recovery from a Python exception, malformed project, partial transfer,
   reconnect, soft reset, hard reset, and a non-yielding program. Select a
   measured supervision mechanism; do not assume code in the same interpreter
   can stop a tight infinite loop.
6. Run one protocol-conformance suite against both virtual and physical
   adapters.

**Result:** physical and virtual controls have truthful, testable semantics.

## Slice 1D — Offline application shell and deferred network gate

1. Cache the production application shell, workers, WebAssembly runtime, and
   current course bundle for offline use. Show the cache/course release state.
2. Test cold and warm production loads, deployment base paths, and a warm-cache
   load after network access is disabled.
3. Provide a downloadable recovery bundle for manual use; the precached public
   course tree is not by itself a student-facing download workflow.
4. In a later bounded Wi-Fi session, join the XRP access point and validate the
   deployment HTTPS origin, explicit Local Network Access permission,
   transport round trip, reconnect, transfer, run, stop, reset, and telemetry.
5. Retain the USB harness for setup and recovery. Do not maintain a second
   ordinary student transport unless measured classroom benefit justifies it.

**Result:** network switching no longer blocks development or ordinary offline
use, while Wi-Fi remains a required release gate.

## Slice 2 — Course foundation and Challenge 1: straight motion

### Library and hardware

- Finalize the reviewed records, configuration, hardware boundary, robot loop,
  sensor conversion, wheel-speed controller, and supplied straight-distance
  controller.
- Make sample timing explicit, monotonic across timestamp wrap, observable on
  overrun, and deterministic under an injected test clock.
- Supply compact no-motion diagnostics and the actual course starter.
- With motion testing still disabled, validate imports, peripheral reads, reset,
  encoder conversion from manual wheel motion, and cleanup paths.
- In the later powered gate: wheels raised, bound duration and effort, verify
  signs and stop, then estimate start effort and speed/effort response; only
  after that run floor tests.

### Virtual XRP

- Run the real Challenge 1 project and package.
- Model effort saturation, start threshold, left/right response, acceleration,
  deceleration, encoder quantization, button state, and deterministic timing.
- Compare virtual and later physical traces by justified qualitative behavior
  and envelopes, not a fit to one robot.

### IDE

- Add explicit Virtual XRP and Physical XRP target selection.
- Keep Validate local and motion-free; add separate project synchronization and
  target run actions.
- Validate only Python as Python, parse supported data formats separately,
  resolve imports without running student top-level code, and return structured
  file/line/column diagnostics linked to Monaco markers.
- Add starter selection, Save As, rename/delete/duplicate, entrypoint selection,
  dirty-project replacement protection, and ZIP fallback.

### XRP Monitor

- Consume the dynamic channel catalog.
- Provide Challenge 1 live values, selectable wheel traces, Status/Details,
  minimal recording/replay, and CSV/log export.
- Label target identity, connection, program state, recording state, and stale
  data unambiguously.

**Result:** Challenge 1 is complete virtually and is accepted on hardware to
the maximum safe tier available.

## Slice 3 — Challenge 2: differential drive and odometry

- Implement and contract-test differential-drive kinematics and odometry with
  analytic straight, arc, and in-place-turn cases.
- Add footprint, arena bounds, collision events, and IMU truth to the simulator.
- Show ground-truth and estimated pose, heading, and paths in the monitor.
- Add Challenge 2 starter, examples, source diagnostics, and a curated monitor
  layout.
- Later verify turn signs, effective track width, heading wrapping, and stop
  behavior on powered hardware.

**Result:** students can implement pose estimation while comparing estimates
with virtual truth and inspecting the same channels on the robot.

## Slice 4 — Challenge 3: waypoint navigation

- Implement and contract-test navigation state transitions, position arrival,
  optional final heading, realignment, multi-goal progression, and completion.
- Add configurable model mismatch, waypoints, active goal, X-Y plotting, and
  linked time selection.
- Test exceptions, reconnect, reset, stale telemetry, and an unresponsive
  program as user-visible recoverable states.

**Result:** waypoint navigation runs through the same project on both targets.

## Slice 5 — Challenge 4: mapped routes

- Implement dimensioned arena geometry, occupancy-grid sampling, clearance,
  coordinate conversion, and shortest valid grid planning.
- Test path validity and minimal length without overconstraining tie-dependent
  route choice.
- Add simulator obstacles, geometric range truth, route display, and the
  Challenge 4 starter and reference artifact.

**Result:** planning remains student/course Python while the simulator supplies
only world geometry and sensors.

## Slice 6 — Challenge 5: delivery mission

- Implement robust range estimation, conditional feature state, planning,
  navigation, payload/servo state, and explicit mission outcomes.
- Test missing/outlier range data, no path, interrupted navigation, and
  successful delivery.
- Add range rays, task regions, payload events, starter, examples, and curated
  monitor layout.

**Result:** the five-challenge course is complete end to end.

## Slice 7 — Course release and reliability

- Finish IDE recent projects, external-file conflict handling, course release
  management, repair workflow, accessibility, and responsive laptop layouts.
- Finish monitor plot interaction, saved layouts, recording/replay, CSV/text/PNG
  export, rate control, and representative-duration soak tests.
- Complete powered-motor and Wi-Fi/browser physical acceptance.
- Exercise denied permission, wrong network, absent robot, version mismatch,
  interrupted transfer, refresh recovery, syntax/import/runtime errors, runaway
  output, lost telemetry, reset during a run, and high-rate channels.
- Publish concise student setup/workflow, instructor release, recovery, and
  hardware acceptance instructions.

**Result:** a course release that does not require developer supervision for
ordinary use.

## Validation architecture

Use the narrowest layer that can prove the behavior:

1. **Pure Python contracts:** records, validation, utilities, components, maps,
   and planners using public inputs and outputs.
2. **Artifact parity:** the same contracts against reference source and exact
   `.mpy` distributions in compatible MicroPython runtimes.
3. **Simulation tests:** deterministic clocks, analytic kinematics, geometry,
   sensors, collision, and seed-controlled optional variation.
4. **Target conformance:** the same request/reply, state, transfer, stop/reset,
   telemetry, and failure scenarios for virtual and physical adapters.
5. **Browser tests:** focused component tests plus a small number of production
   end-to-end workflows, accessibility checks, and deployment/offline tests.
6. **USB hardware tiers:**
   - H0 discovery and firmware classification, read-only;
   - H1 non-motion: install, imports, peripherals, manual encoders,
     reset/recovery, and zero-command paths; USB-fed motor VIN may be present;
   - H2 motors powered with wheels raised: bounded signs, motion, and stop;
   - H3 floor operation: calibration and challenge behavior.
7. **Wi-Fi/browser gate:** offline cache first, then explicit network switch,
   Local Network Access, transport, and full physical target workflow.

Hardware runs produce machine-readable evidence containing timestamp, harness
revision, board identity hash, exact firmware/library/course versions, safety
tier, configuration, outcomes, and limitations. Credentials and unique network
names are not committed.

Avoid brittle tests: assert invariants, bounds, transitions, tolerances, and
validity rather than private variables, incidental log wording, exact pixels,
or one tie-dependent path. Mocks belong only at genuine external boundaries.

At every slice boundary update `STATUS.md` under:

```text
Completed
Demonstrated
Automated checks
Physical XRP checks
Known limitations
Next slice
```

If work pauses, leave the repository runnable and record the exact next safe
operation, including whether physical intervention is required.
