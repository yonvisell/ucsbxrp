# Project status

Last updated: 2026-07-31

## Current slice

Slices 0R, 1A, and 1B are complete. The repository has a reviewed plan and
hardware harness, a known RP2350 MicroPython/XRPLib runtime, one authentic
Challenge 1 package and five-file starter, and reproducible supplied-component
bytecode proven in browser MicroPython and on the physical controller.

The production portion of Slice 1D is also complete: the IDE, XRP Monitor,
guide, workers, WebAssembly runtime, and student course release form one
deterministic offline shell with visible readiness. Small complete vertical
slices also added practical IDE project operations and bounded Monitor CSV
recording. Slice 1C, the supervised physical-target service and protocol, is
the next implementation dependency.

The physical H1 record remains intentionally partial. All attempted
non-motion software checks passed, including the exact Challenge 1 starter,
but the required same-session SW1-off, MOT-LED-off, indicator-circuit-intact,
reviewed-near-zero-VIN gate has not been confirmed. No nonzero motor effort
was issued.

## Completed

- Created `docs/COURSE_AND_LIBRARY_SUMMARY.md`, reviewed the three active `v2_`
  documents together, and reworked `IMPLEMENTATION_PLAN.md` into
  evidence-gated vertical slices. The course documents and first reference
  implementation are design inputs rather than immutable contracts.
- Added `docs/API_DESIGN_REVIEW.md` and `docs/VALIDATION_PLAN.md`, including
  public-contract tests, correlated target outcomes, atomic project transfer,
  independent run supervision, and H0-H3 hardware safety tiers.
- Preserved an H0 record of the controller's original XRP-WPILib 2.1.0 state,
  then verified and intentionally installed the official board-specific
  `SPARKFUN_XRP_CONTROLLER-20260406-v1.28.0.uf2` image, XRPLib 2026.07.1, its
  dependencies, and examples.
- Built the canonical `ucsb_xrp` development package around validated records,
  a motion-locked `RobotConfig` default, utilities, narrow student interfaces,
  a defensive XRPLib `XRPBot` boundary, and `StraightLineController`.
- Added a separate provisional `ucsb_xrp_reference` source tree for
  `SensorModel` and `WheelSpeedController`; it is retained build input, not a
  declaration that its first algorithms are definitive.
- Added the exact five-file Challenge 1 project: `main.py`, `robot_config.py`,
  `student_components.py`, `course_setup.py`, and `challenge.py`. Two explicit
  Boolean choices select supplied or student components without magic module
  names. The initial program is motion-locked and always stops in `finally`.
- Generated two deterministic `.mpy` artifacts with official MicroPython
  1.28.0 `mpy-cross` at the recorded commit. Release metadata records source
  and artifact hashes, sizes, compiler identity, and ABI evidence. Verification
  rejects missing, modified, symlinked, or unexpected generated files.
- Removed the browser-only `ucsb_xrp` stub. Browser MicroPython loads the exact
  canonical sources and exact supplied `.mpy` artifacts; only XRPLib is
  replaced by a simulated hardware adapter.
- Added a virtual run-owner lease. Owner loss or disconnect terminates the
  disposable MicroPython runtime, invalidates the run, and converges commanded
  effort to zero while the Monitor remains connected.
- Made validation type-aware at the project boundary: only Python files are
  compiled, while documentation and configuration remain part of the project
  and transfer set.
- Completed IDE rename, duplicate, confirmation-based delete, and startup-file
  selection. Startup metadata persists in `.ucsb-xrp-project.json`; browser
  recovery remains continuous. The project drawer, settings, tabs, Status and
  Details output, and commands remain usable on a narrow screen.
- Added keyboard-contained dialogs, safe destructive-action focus, live status
  semantics, invalid-input semantics, reduced-motion and forced-color support,
  underlined inline links, and non-color plot-trace differentiation.
- Enforced tested color thresholds of at least 4.5:1 for ordinary text and
  3:1 for control boundaries and focus indicators. Button and console sizing
  remain compact and the commands use explicit functional labels.
- Added a bounded 30,000-sample telemetry ring buffer with start, stop, clear,
  drop count, immutable snapshots, and CSV export using stable explicit Stage 1
  columns.
- Fixed the Three.js canvas intrinsic-size feedback defect that could expand
  the Monitor world view far beyond its layout bounds.
- Added a deterministic production service worker and manifest. The current
  shell contains 52 payload files (7.12 MiB), including local Monaco 0.56,
  both workers, MicroPython WebAssembly, the public course release, starter,
  examples, and supplied bytecode; retained reference source is excluded.
- Added a visible course-release/offline-readiness indicator to the IDE and
  Monitor. `offline ready` is reported only after every manifest URL exists in
  Cache Storage; development explicitly reports `cache disabled`.
- Added root- and subpath-safe deployment through `COURSE_BASE_PATH`, precise
  route fallbacks, atomic cache activation, and retention of one preceding
  shell for tabs opened before an update.
- Added a fail-closed H1 power-gate wrapper. It requires an exact port, a fresh
  set of four physical confirmations, a reviewed threshold no greater than the
  tool's 1.0 V hard ceiling, append-only output, and two zero-effort cleanup
  results. It contains no nonzero-effort capability.
- Added detailed setup and remaining-work instructions in
  `docs/REMAINING_HARDWARE_AND_NETWORK_SETUP.md`.

## Demonstrated

- The physical controller re-enumerated after the verified flash as a SparkFun
  XRP Controller with RP2350 running MicroPython 1.28.0 with `_mpy == 7942`.
- USB probes verified the filesystem, XRPLib import, soft-reset recovery,
  status LED command, released USER-button input, IMU, rangefinder, readable
  encoders, and zero-effort cleanup. A physical button transition and manual
  encoder movement were not exercised.
- All eight installed canonical `ucsb_xrp` source hashes match release
  `2026.07-dev.2` on the controller. The aggregate source identity is
  `78637b538e41b1d7ed90f6511cba9376dcedbe5edc480048bcb97492336a1b0f`.
- The exact two supplied `.mpy` artifacts have matching host/device hashes.
  The browser runtime reports `_mpy == 774`; the physical runtime reports
  `_mpy == 7942`; their portable ABI bits agree. The same ordinary non-native
  bytecode passed the public SensorModel/WheelSpeedController vector on both.
- The exact five-file Challenge 1 starter ran over USB from a temporary mount
  against physical XRPLib and the installed bytecode. It retained
  `max_effort == 0`, applied only `0.0 / 0.0`, and completed final cleanup.
- The production browser workflow exercises the default five-file project,
  MicroPython validation and execution, shared Monitor state, bounded
  recording/CSV export, Stop, Reset, and owner-loss fail-to-zero behavior.
- Production offline reload and virtual execution pass with all external
  requests blocked at both `/` and `/course-tools/` deployment paths.
- Visual browser inspection verified the compact responsive IDE, modal and
  project operations, Monitor controls, bounded world-view canvas, high-
  contrast states, and the updated getting-started guide.

## Automated checks

At this checkpoint, every constituent check passes:

- Prettier formatting and repository whitespace checks;
- 52 Python tests covering package contracts, Challenge 1 algorithms and
  starter, examples, release hashing, exact bytecode artifacts, and zero-only
  hardware harnesses;
- an exact-source MicroPython 1.28 parity run covering package import,
  motion-lock behavior, hardware-boundary clamping and signs, angle behavior,
  and the supplied `.mpy` public contract vector;
- 64 Vitest tests covering project files and recovery, offline state and
  manifests, theme contrast, OSC, deterministic simulation, recording,
  validation, and the run-owner lease;
- TypeScript checking, production build, and deterministic offline-manifest
  verification;
- five stable-Chrome production workflows covering the complete virtual path,
  owner-loss fail-to-zero, narrow-screen behavior, recording/CSV export, and
  fully offline execution; and
- a separate stable-Chrome offline workflow for `/course-tools/` deployment.

The build retains non-failing size warnings for the approximately 1.65 MiB
Monitor entry, 0.79 MiB IDE entry, and 2.66 MiB Monaco API chunk. The complete
offline payload is bounded and verified, but code splitting remains release
hardening work.

## Physical XRP checks

- **H0 passed:** USB identity, original firmware classification, immutable
  candidate-firmware identity, and baseline preservation are recorded.
- **H1 partial:** the intended MicroPython/XRPLib/course stack, exact source and
  bytecode artifacts, and every attempted no-motion software check passed.
- USB-C was observed supplying motor-driver VIN with the board switch on;
  XRPLib reported approximately 5.4 V. A disconnected battery therefore does
  not establish an unpowered motor rail, and `are_motors_powered()` is a VIN
  diagnostic rather than motion authorization.
- H1 is not complete until one fresh session records SW1 off, MOT LED off,
  indicator circuitry intact, and corrected VIN below a reviewed near-zero
  limit. Any disagreement fails closed.
- XRPLib's upstream installation-check program must not be run automatically
  because it progresses to motor motion.
- No nonzero effort was issued. Motor identity/sign, encoder sign under drive,
  physical stopping, calibration, and floor behavior remain deferred to
  separately authorized H2/H3 sessions.
- RM2 behavior and the Wi-Fi/browser physical path remain deferred while
  development continues over USB and ordinary Wi-Fi.

## Review findings incorporated

- `MotorEfforts` remains provisional because it usefully exposes the validated
  two-wheel controller output before the hardware write. Its name and nearby
  API remain open to course and student evidence.
- `RobotConfig()` is motion-locked by default. Publishing physical calibration
  values waits for H2/H3 evidence rather than promoting nominal dimensions or
  effort limits to verified constants.
- `XRPBot` remains the sole course-package boundary to XRPLib. The physical
  connection and supervisory service are private infrastructure, not student
  APIs.
- Physical controls remain absent because capability discovery, correlated
  command replies, atomic whole-project synchronization, independent
  supervision, and Wi-Fi/Local Network Access acceptance are not implemented.
- Local production offline readiness is implemented and tested. A deployed
  HTTPS origin, same-profile warm-cache acceptance, and RM2 network acceptance
  are still required before physical browser control.
- Validation is compile-only. Import resolution and Monaco-linked structured
  diagnostics remain required.

## Known limitations

- Slice 1C's physical device service and atomic, correlated protocol do not
  exist; `PhysicalTargetClient` remains provisional and inaccessible in the
  UI.
- Challenge 1 still needs the supplied, testable timed `Robot` loop, overrun
  behavior, motion-enabled per-robot configuration, H2/H3 measurements, and
  physical/virtual response comparison.
- Browser recovery uses capacity-limited `localStorage`; IndexedDB project
  versions, Save As, ZIP import/export, and external-file conflict handling
  remain pending.
- Validation does not yet resolve imports against the selected release or link
  structured diagnostics to source locations.
- The Monitor recorder has fixed Stage 1 columns. Dynamic channel discovery,
  truthful stale/paused states, replay, log/event recording, plot export, and
  configurable rates remain pending.
- The simulator remains a narrow motor/encoder proof without the complete
  range, IMU, geometry, collision, environment, and course-task model.
- Browser storage can be evicted, and downloadable offline recovery remains
  pending even though the deterministic production shell is complete.
- Deployed-HTTPS acceptance, RM2 behavior, Local Network Access, the final H1
  isolation record, and all H2/H3 motion evidence remain unverified.

## Next slice

1. Close H1 only after the user provides the fresh physical confirmations and
   a reviewed near-zero VIN criterion; continue to prohibit nonzero effort.
2. Implement Slice 1C's private supervisory service and one versioned target
   protocol with capability discovery, correlated outcomes, atomic project
   synchronization, independent watchdog behavior, and recovery tests. Install
   and exercise it over USB before requesting an RM2 network switch.
3. Add the Challenge 1 timed `Robot` loop with injected/testable timing,
   overrun reporting, explicit stop behavior, and virtual acceptance while
   retaining the motion lock.
4. Add import-aware diagnostics and durable versioned project storage before
   broadening physical IDE controls.
5. Extend the Monitor from the fixed recorder to dynamic typed channels,
   stale-state handling, log/events, and replay.
6. Deploy the exact production release to HTTPS, repeat the offline-readiness
   gate in the intended Chrome profile, then conduct bounded RM2/Local Network
   Access acceptance. Reserve all motor motion for a separately reviewed and
   authorized raised-wheel H2 harness.
