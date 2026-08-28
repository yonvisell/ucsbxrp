# Validation strategy

Validation establishes student-visible behavior at the smallest useful layer,
then repeats the affected workflow in production Chrome and, when relevant, on
the RP2350 XRP. Simulator, mocked browser, native browser, deployed-origin, and
physical-robot results are distinct evidence.

## Current evidence baseline

The physical baseline is robot runtime release `2026.08-dev.40`, generation 23,
whose retained record names source commit `0b301cd`. Application, course-content,
and robot-runtime identities remain separate because a browser-only revision
does not by itself require reinstalling a compatible robot runtime.

Together, those retained baselines provide the following evidence:

| Boundary | Current evidence |
| --- | --- |
| Python and MicroPython | 237 Python tests plus source, service, and exact `.mpy` import/behavior proofs at the dev.40 physical stage; the current course-content revision adds 29 focused starter/tutorial passes |
| Browser packages | 379 TypeScript tests, formatting, production build, and verification of the 268-file offline shell |
| Production Chrome | 58 selected end-to-end workflows cover project storage, Monitor recording/export, instructor authoring, all course projects, and the complete virtual path |
| Responsive applications | The same loaded IDE was measured at 760×620, 980×760, 1100×700, and 1450×900; the application, workspace, editor, and Monaco canvas filled the viewport with no document overflow in either resize direction |
| Physical station workflow | Dev.40 completed USB repair, two projects, Run/Stop from IDE and Monitor, course Reset and rerun, edited-project Run, motor effort, encoders, wheel distance, sensors, ordered logs, 50 Hz telemetry without retained-sample gaps, and final zero drive |
| USB installation and service | Dev.40 installed as runtime generation 23; a second repair changed zero files and preserved the verified `Pink` station profile and robot identity |

The physical record is
`docs/hardware/2026-08-27-dev40-station-repeatability.json`. It does not prove a
factory-state first-use installation, the current hotspot/offline-return path,
floor motion, every physical challenge, multiple nearby robots, or Windows/Edge
and Chromebook behavior.

Any change after this baseline receives focused checks immediately. The full
gate is rerun at the next committed stage boundary; an uncommitted focused pass
does not replace the retained baseline above.

## Repository commands

The complete non-hardware gate is:

```sh
npm run check
```

`npm run check:fast` runs formatting, Python, MicroPython, TypeScript, type,
production-build, and offline-package checks. `npm run test:browser` runs the
Stable Chrome workflows. During development, focused test files or test names
should run against the fixed local production origin before the complete gate.

Physical tests remain explicit because CI has no robot. Their command, release,
network route, robot identity, runtime generation, firmware, duration, and
observations are retained in one JSON record under `docs/hardware/`.

GitHub publication and live-site inspection use the Chrome profile signed in as
`yonvisell@gmail.com`. Other Chrome profiles or windows may not share that
authenticated GitHub session; no credential is stored in this repository.

## Course and numerical behavior

- Test the public interface and physical meaning: units, signs, bounds,
  geometry, state progression, termination, and errors.
- Reuse input/output examples across supplied Python, reference bytecode,
  browser MicroPython, and RP2350 MicroPython.
- Inject clocks and cover timestamp wrap, nonpositive elapsed time, and sample
  overruns. Student challenge loops use the supplied scheduler rather than
  adding an independent sleep.
- Derive tolerances from encoder quantization, simulation integration, and
  sensor resolution instead of one unexplained global epsilon.
- Cover straight, curved, and in-place motion; wheel and encoder sign
  conventions; wheel-speed estimation from recent timed samples; odometry;
  navigation state changes; valid connected routes; blocked routes; and mission
  outcomes.
- Test challenge requirements without prescribing the retained reference
  implementation, a particular route-search data structure, or one tie break.
- Treat captured physical data as one robot observation, not universal ground
  truth.

## Target and runtime behavior

Virtual and physical targets share behavioral cases for:

- identity, version, capabilities, endpoint, project, and current state;
- exact project validation and revision preparation before Run;
- correlated commands, bounded timeouts, idempotent retries, and structured
  errors;
- Run, cooperative Stop, course Reset, exceptional controller restart, and
  owner loss;
- ordered logs and telemetry with explicit gaps, boot changes, cursor paging,
  and bounded retention;
- malformed, duplicate, incompatible, and oversized requests; and
- recovery from connection loss without presenting an unverified endpoint or
  project as ready.

The physical service additionally proves that project preparation is complete
or leaves the preceding RAM project intact, commands are serialized, and normal
project work does not write the controller's internal flash. The USB setup and
runtime installer separately prove that activation uses only a fully verified
runtime slot.

Fault injection should target the transport, project transaction, runtime
activation, and browser ownership boundaries. Tests should not depend on
private function shape.

## Browser workflows

Browser cases remain independent enough that one modal failure does not hide a
different project, target, or Monitor failure. The production suite covers:

- first load, offline reload, update adoption at a safe boundary, root and
  repository-subpath deployment, and browser capability messages;
- default project, Open project, Save to folder, template creation, file
  operations, main-file selection, automatic save, rotating copies, conflict
  recovery, and external folder changes;
- multiple IDE tabs, explicit project ownership, Monitor-only virtual Run,
  edited-project Run, completion, exception, Stop, Reset, and owner loss;
- all challenges, tutorials, and demos in browser MicroPython;
- world configuration, pose and path, dimensions, range, collisions, live
  telemetry, watches, live controls, published plot variables, fixed-height
  plots, annotations, recording, CSV/SVG/PNG/WebM export, and late Monitor
  history;
- native setup states through mocked Web Serial and HTTP boundaries, including
  cancellation, denied permissions, incompatible controller, changed-only and
  no-change repair, interrupted installation, network selection, handoff, and
  stale endpoint; and
- wide, short, narrow, and tall layouts; dialogs; keyboard operation; visible
  focus; semantic names; reduced motion; forced colors; and measured contrast.

Mocked setup cases establish browser state and protocol behavior. They do not
substitute for the native device chooser, Web Serial stream, macOS/Windows
permissions, computer Wi-Fi handoff, or physical service.

## Visual and usability validation

Use a production build in Chrome, not only component snapshots. Inspect each
principal page at representative wide, laptop, short-height, and narrow sizes.
Resize an already-open application across breakpoints so persistent drawers,
splitters, and editor dimensions are exercised rather than recreated from a
fresh mount.

Visual review asks whether a first-time student can identify:

- the current project and its native folder state;
- the selected target and whether that robot was verified;
- the next available Run, Stop, Reset, connection, project, or file action;
- the distinction between program output, system diagnostics, telemetry,
  recording, and exports; and
- the location of challenge instructions and exact API documentation.

Assertions should prefer roles, labels, bounds, and behavior. Screenshots are
useful for stable layout relationships, but dynamic editor canvases and plots
should not be accepted solely through pixel snapshots. A short observed
first-time-student trial is more informative than additional prose-presence
tests once the functional workflow passes.

## Current-release physical sequence

The next hardware pass records the exact application commit or build digest and
robot-runtime identity, then performs these complete sequences:

1. Native Chrome setup/repair over USB: device selection, identity, file
   comparison, changed-only or no-change install, read verification, activation,
   restart, service proof, and IDE handoff.
2. Station mode: default Run, Stop, Reset, rerun, a second project, shared
   IDE/Monitor output and telemetry, and recovery after an unavailable retained
   address.
3. Hotspot mode: robot profile change, visible SSID, explicit computer Wi-Fi
   handoff, identity-checked connection, the same two-project lifecycle, and
   return to the internet network.
4. Repetition: repair the already-correct robot, cancel and retry selection,
   preserve student files, reopen the applications, and repeat Run without
   clearing browser storage.

Raised-wheel motion uses a short bounded program, begins and ends at zero drive,
and checks both encoders from within-run baselines. Floor trajectory claims wait
for the final course surface.

## Updates and compatibility

Each retained release record should distinguish:

- web application build;
- course content and template revision;
- public API revision;
- robot runtime release and active generation;
- project revision and template lineage; and
- supported compatibility between them.

An update test uses two actual production builds. It keeps a native student
project and active recording intact, retains the previous complete application
cache until the new one is ready, adopts the new build only at a reproducible
boundary, and verifies rollback/offline loading. A robot-runtime update is
required only when its compatibility identity changes.

## Evidence at a stage boundary

A stage closes when its focused checks and representative complete workflow
pass. Record:

- the exact source/release identity;
- which software, production-browser, deployed-origin, and physical workflows
  actually ran;
- the observed result or retained artifact; and
- remaining empirical work stated as untested, not translated into a pass.

Do not add a global coverage target or broad timeout to make the result look
complete. A repeated failure becomes a design or implementation problem to
remove, not another recovery layer to document.

## Deferred empirical work

- UF2 recovery on a genuinely incompatible controller.
- Wheel, track, stopping, range, and IMU calibration on the course surface.
- Complete physical execution of all five challenges after calibration.
- Current Windows/Edge, Chromebook, enterprise-policy, multi-XRP, and two-laptop
  classroom trials.
- Mobile hardware control and mobile WebM export, which are not release
  requirements.
