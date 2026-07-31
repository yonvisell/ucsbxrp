# Project status

Last updated: 2026-07-31

## Current slice

Slices 0R and the software portion of 1A have produced a reviewed plan, a
repeatable USB harness, and a known RP2350 MicroPython runtime. Slice 1B is in
progress: one minimal canonical `ucsb_xrp` package now executes on CPython,
browser MicroPython, and the physical XRP, and its first two safe examples are
tested. The Challenge 1 components, five-file starter, and reference bytecode
are not complete.

The physical H1 record is intentionally classified as partial. All attempted
non-motion software checks passed, but the required board-switch-off,
MOT-LED-off, near-zero-VIN motor-rail isolation gate was not confirmed. No
nonzero motor effort was issued.

## Completed

- Created `docs/COURSE_AND_LIBRARY_SUMMARY.md` and reworked
  `IMPLEMENTATION_PLAN.md` into evidence-gated vertical slices. The three
  active `v2_` documents and the initial library reference are design inputs,
  not immutable contracts.
- Added `docs/API_DESIGN_REVIEW.md` and `docs/VALIDATION_PLAN.md`, including
  public-contract testing, correlated target outcomes, atomic project transfer,
  run-owner supervision, and H0-H3 hardware safety tiers.
- Preserved a machine-readable H0 record of the controller's original
  XRP-WPILib 2.1.0 state without committing its serial number or network
  credentials.
- Verified and intentionally flashed the official board-specific
  `SPARKFUN_XRP_CONTROLLER-20260406-v1.28.0.uf2` image. The recorded image is
  1,725,952 bytes with SHA-256
  `0a36d7e2bc20dfcde2dd1af9a673fd0a63248820a360723c3967751106610ed0`.
- Installed MicroPython 1.28.0, XRPLib 2026.07.1, its dependencies and examples,
  and the canonical development `ucsb_xrp` package with pinned `mpremote`
  1.28.0. Representative XRPLib hashes and all seven course-package source
  hashes match their recorded host sources.
- Added the non-motion USB harness, runtime/H1/course-package probes, structured
  hardware evidence, and deterministic course-release hashing and verification.
- Created a minimal canonical `vendor/current/ucsb_xrp` package containing
  validated records, a motion-locked `RobotConfig` default, utilities, narrow
  student interfaces, and a defensive XRPLib `XRPBot` boundary. This package is
  an executable design checkpoint, not the final course library.
- Removed the browser-only `ucsb_xrp` stub. Browser MicroPython now loads the
  exact canonical package files and replaces only XRPLib with a simulated
  hardware adapter.
- Made project validation type-aware at the file boundary: it requires a safe
  Python entrypoint and compiles only `.py` files. Other project files remain in
  the project and transfer set rather than being miscompiled as Python.
- Added a virtual run-owner lease. Owner loss or disconnect terminates the
  disposable MicroPython runtime, invalidates the run, and converges commanded
  effort to zero even while a Monitor tab remains connected.
- Added strict recovery migration for the two exact generated prototype
  starters that predated required `RobotConfig`; arbitrary student source is
  preserved byte-for-byte.
- Made the project drawer usable as a narrow-screen overlay, made Status/Details
  output collapsible with command-triggered reopening, and clarified Help and
  physical-target guidance. The Monitor now distinguishes no first sample from
  a valid zero sample.
- Added a hardware-free records/units example and a motion-locked physical
  sensor example. Both compile under the ordinary Python harness; the latter's
  tests prove that normal and exceptional paths write zero only.
- Corrected virtual stop semantics so zero effort continues deterministic
  coast-down physics to an exact finite rest instead of freezing nonzero wheel
  speeds after a program exits.

## Demonstrated

- The physical controller re-enumerated after the verified flash as a SparkFun
  XRP Controller with RP2350 running MicroPython 1.28.0 with `_mpy == 7942`.
- USB probes verified the filesystem, XRPLib import, soft-reset recovery, status
  LED command, released USER-button input, IMU, rangefinder, readable encoders,
  and zero-effort cleanup. A physical button transition and manual encoder
  movement were not exercised.
- The canonical `ucsb_xrp` package imported on the RP2350, retained its
  `max_effort == 0` motion lock, read hardware through `XRPBot`, and completed
  zero-effort cleanup. A measured float32 boundary discrepancy at `+pi` was
  corrected and rerun on both CPython and the device.
- The virtual IDE runs the same package under MicroPython 1.28.0, shares
  deterministic target state with the XRP Monitor, and supports normal
  completion, Stop, Reset, and owner-loss fail-to-zero behavior.
- The production browser workflow has exercised multi-file validation, virtual
  execution, shared Monitor state, and closing the run-owning IDE while the
  Monitor remains open.
- The exact student-facing no-motion sensor example ran successfully over USB
  against the installed package and XRPLib. It read the encoders, rangefinder,
  and button, remained motion-locked, wrote zero only, and completed its
  `finally` stop; this does not close the physical motor-rail isolation gate.
- An independent pass in the 319-pixel-wide in-app browser verified migration
  of the generated obsolete starter, the responsive project drawer, output
  collapse/reopen, MicroPython validation, virtual execution, and zero effort
  on normal completion. That pass exposed and led to correction of the frozen
  residual-speed defect.

## Automated checks

At this checkpoint, every constituent check passes:

- Prettier formatting;
- 31 Python tests covering course-package contracts, examples, release hashing,
  and the no-motion hardware harness;
- an exact-source MicroPython 1.28 parity run covering package import,
  motion-lock behavior, hardware-boundary clamping/signs, range conversion, and
  the single-precision angle boundary;
- 36 Vitest tests across project recovery/files, OSC, simulation, project
  validation, and run-owner lease behavior;
- TypeScript type checking and the Vite production build;
- three stable-Chrome production workflows covering the complete virtual path,
  owner-loss fail-to-zero, and narrow-screen drawer/output behavior.

The build retains one non-failing warning for the approximately 1.65 MB
uncompressed Monitor entry chunk; code splitting remains a release-hardening
task.

## Physical XRP checks

- **H0 passed:** USB identity, original firmware classification, immutable
  candidate-firmware identity, and baseline preservation are recorded.
- **H1 partial:** the intended MicroPython/XRPLib/course stack is installed and
  every attempted no-motion software check passed.
- USB-C was observed supplying motor-driver VIN with the board switch on;
  XRPLib reported approximately 5.4 V. A disconnected battery therefore does
  not establish an unpowered motor rail, and `are_motors_powered()` is a VIN
  diagnostic rather than a battery-source or motion-authorization test.
- H1 is not complete until the board switch is off, a person confirms the MOT
  LED is off, and reported VIN is near zero. Any disagreement fails closed.
- XRPLib's upstream installation-check program must not be run automatically
  because its procedure progresses to motor motion.
- No nonzero effort was issued. Motor motion, motor/encoder signs under drive,
  physical stopping, calibration, and floor behavior remain deferred to
  explicit H2/H3 sessions.
- RM2 behavior and the Wi-Fi/browser path remain deferred while development
  continues over USB and the ordinary Wi-Fi connection.

## Review findings incorporated

- `MotorEfforts` is retained provisionally because it exposes the two-wheel
  controller output as a validated value before the hardware write. Its name
  and surrounding API remain open to evidence from course implementation and
  student use.
- `RobotConfig()` is deliberately motion-locked by default. Publishing physical
  calibration values waits for H2/H3 evidence rather than promoting nominal
  dimensions or effort limits to verified constants.
- `XRPBot` remains the sole course-package boundary to XRPLib. The physical
  connection/supervisory service is separate infrastructure, not part of the
  student API.
- Physical controls remain absent from the IDE because capability discovery,
  correlated command replies, atomic whole-project synchronization,
  independent supervision, and Wi-Fi/Local Network Access acceptance are not
  implemented. USB bring-up and exact package installation are already
  recorded and are not the reason those controls are hidden.
- Validation now compiles only Python files, but it remains compile-only: import
  resolution and Monaco-linked structured diagnostics are still required.
- Browser recovery remains based on capacity-limited `localStorage`; it is not
  yet a complete durable multi-project workflow.

## Known limitations

- Every repository file remains untracked; there is no reviewed Git baseline
  commit.
- The canonical library currently covers only records, configuration,
  utilities, first student interfaces, and the hardware boundary. Control-loop
  scheduling, Challenge 1 algorithms/orchestration, and all later-challenge
  components remain to be implemented and reviewed.
- The five-file course starter, retained reference source tree, reproducible
  `.mpy` artifacts, and source/bytecode parity tests do not yet exist. The two
  current examples cover only records/units and safe sensor reading.
- The physical device service and its atomic, correlated protocol do not yet
  exist; `PhysicalTargetClient` remains provisional and inaccessible in the UI.
- The IDE still lacks import-aware validation, source-linked diagnostics,
  durable project/version storage, Save As, rename/delete, entrypoint selection,
  ZIP fallback, and physical target selection.
- The XRP Monitor remains a fixed Stage 1 view without a dynamic channel
  catalog, explicit no-data/stale states, bounded recording, replay/export,
  rate control, or target selection.
- Offline application caching is not implemented.
- The simulator remains a narrow motor/encoder proof; the full sensor, geometry,
  collision, and course-environment model is pending.
- H1 motor-rail isolation, all H2/H3 motion evidence, RM2 behavior, and the
  deployed HTTPS Local Network Access workflow remain unverified.

## Next slice

1. Complete the H1 record during a safe USB session with the board switch off,
   MOT LED visually confirmed off, and near-zero VIN; continue to prohibit
   nonzero effort.
2. Complete Slice 1B's Challenge 1 library path, five-file starter, examples,
   reference source/artifacts, and source/bytecode contract parity without
   treating the first reference implementation as normative.
3. Implement the device supervisory service and one versioned target protocol
   with capabilities, correlated outcomes, atomic project synchronization,
   independent watchdog behavior, and recovery tests against both targets.
4. Replace browser `localStorage` recovery with a durable storage adapter and
   complete import-aware, source-linked diagnostics and project operations.
5. Replace the fixed Monitor sample with a typed dynamic channel catalog,
   truthful no-data/stale states, bounded storage, and the first useful
   recording/export slice.
6. Implement and verify offline caching before a bounded RM2 Wi-Fi and browser
   Local Network Access acceptance session. Reserve all motor motion for the
   separately authorized, raised-wheel H2 gate.
