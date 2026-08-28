# Current UCSBXRP product outcomes

This is the single live product backlog. It merges current user observations,
prior audits, direct browser and robot evidence, and unresolved design work.
The `USER_REQUIREMENTS_*` files and `open-user-issues-now.md` remain source
history; they are not parallel plans. Detailed validation belongs in
`STATUS.md`, and retained physical evidence belongs in `docs/hardware/`.

## Current baseline

- Browser source: current repository `HEAD` plus the active integrated stage.
- Attached XRP: physically qualified on `2026.08-dev.37`, generation 18, from
  source commit `073d888`.
- Current course bundle: `2026.08-dev.37`; it accepts compatible robot runtimes
  from generation 36 onward, so application and course-material revisions do
  not force an unnecessary robot repair.
- Development origin: the only supported local development instance is the
  cache-free Vite server at `http://127.0.0.1:4174/`.
- The public GitHub Pages release remains unchanged during the local revision
  sequence.

## Strongest current outcomes

- One Working folder may contain several named Project folders. The IDE opens
  only valid direct-child UCSBXRP projects, saves folder-backed projects
  automatically, and preserves a browser draft when no folder is available.
- The IDE and Monitor share the exact current project, run state, program
  output, telemetry history, runtime controls, and robot identity. A fresh
  Monitor can run the default virtual project.
- Expanding Spiral and the physical command path have current-release,
  raised-wheel evidence for Run, Stop, Reset, rerun, project edits, motor
  effort, encoders, wheel distance, sensor data, pose, plots, logs, and final
  zero drive on dev.37.
- The four active tutorial projects cover Python fundamentals, Virtual XRP
  drawing, the sampled robot program, and behavior with telemetry. Each has
  student tasks and immediate checks rather than a shipped solution.
- Five cumulative challenge projects carry prior student modules forward.
  Their README files identify the task, supplied code, student work, and
  measurable behavior; mutable task values remain in code rather than prose.
  Every starter now copies its component stubs from one documented template
  source, so direct entry at a later challenge does not lose the guidance given
  in the earlier starter.
- The Guide and API reference describe the current project, setup, execution,
  timing, component, and telemetry models. Graphviz generates the nontrivial
  diagrams, and the IDE links relevant project files to reference sections.
- The challenge author includes a visual world editor for bounds, initial pose,
  walls, blocks, start/finish regions, waypoints, and display markers.
- The production package is static and local-first: browser assets are cached
  by the browser; student source, logs, recordings, and exports remain ordinary
  files in the selected Project folder.

## Active outcomes, in priority order

### 1. Ordinary student project and run workflow

Complete one native-Chrome walkthrough from a fresh browser state: understand
the Working-folder prompt, create a named project, edit and autosave, reopen it,
switch projects twice, use Validate/Run/Stop/Reset/rerun, and inspect persistent
Program output and System log. Cancellation or denied folder permission must
leave the current project unchanged and explain the next action. The interface
must not expose repository files, recurse through the Working folder, or ask
where a site may save without first explaining the Working-folder choice.

The current real-window Chrome build fills both restored and expanded windows.
Keep the output area as a compact drawer and continue to judge proportions and
actual resizing, not only overflow tests. System and setup logs identify the
application build and course release without another visible status badge.

### 2. Current-release setup, repair, and robot operation

Current dev.37 native Web Serial setup and idempotent repair pass on Pink,
including zero changed files, explicit network verification, robot-identity
verification, atomic IDE handoff, two projects, Run/Stop/Reset/rerun, shared
IDE/Monitor state, telemetry, and complete logs. Repeat one current-release
hotspot cycle with a custom SSID, explicit computer-Wi-Fi instruction, offline
reopening, and return to an internet network. Earlier hotspot evidence is
regression history, not proof of the current release. Retain cancellation and
retry coverage in the simulated commissioning suite.

Station discovery also needs a robot-specific hostname or equivalent candidate
derived from stable robot identity; a classroom full of `ucsb-xrp.local`
responders is ambiguous even though identity checks prevent commands to the
wrong robot.

Before release, restore the attached XRP to its SparkFun factory state and run
the complete first-use path: USB selection, installation, station setup on
Pink, IDE handoff, project load, motor command, encoder/telemetry observation,
stop, reset, and recommissioning. This is the primary commissioning acceptance
case; simulated browser tests remain supporting evidence.

### 3. Course-project clarity and consistency

Student-visible challenge, demo, tutorial, and API examples now construct the
robot inside a short run function; helper functions receive and return the
current `RobotState` explicitly. Repeated component stubs come from one
documented template source and are checked for exact parity across starters.
Review the remaining README wording through a short novice observation rather
than another wholesale prose rewrite.

The existing visual world editor satisfies instructor world authoring. Reuse it
inside the IDE for `world.json` only if students are expected to modify a world;
retain readable JSON as the advanced representation.

Expand the tutorial sequence without turning it into a general Python course.
Begin with syntax, values, functions, decisions, loops, and collections; then
introduce records, classes, inheritance, error handling, sampled robot programs,
telemetry, and physical deployment. Use the Virtual XRP as soon as the required
Python concepts permit it, keep exercises relevant to later course work, and do
not reveal challenge solutions. Add concise comments at the decisions students
must understand; prefer ordinary `#` comments over triple-quoted commentary.

Use the 10 ft by 4 ft arena (3048 mm by 1219.2 mm), centered at `(0, 0)`, as
the default world for demos and challenges. Tutorials that do not use a physical
XRP may use a purpose-specific world. Increase the challenge author's world
canvas enough for practical editing at ordinary laptop sizes.

Review the project command model as one workflow: Open Project selects a valid
project inside the Working folder; New Project creates a named child folder;
autosave owns ordinary persistence. Resolve the remaining redundant or unclear
controls together rather than renaming them independently. Determine from the
actual check path whether the student command should be called **Compile**;
if so, change the UI, logs, Guide, and API consistently.

### 4. Update behavior and release identity

The offline manifest already provides content-derived application identity;
do not add another build-ID mechanism. Treat `release_sequence` as robot runtime
identity and raise `minimum_robot_release_sequence` only for an incompatible
service, protocol, API, or installed-library change. Verify update adoption from
an old installed PWA while a project picker, edit, and run are active. Explain
the available/current release in student language without exposing cache
machinery.

Future challenge-template corrections need template revision and base-content
identity so the IDE can offer a correction without replacing student work.

### 5. Focused refactor and measured performance

After the browser and robot journeys pass on one committed baseline, extract a
single project-persistence controller from `IdeApp`. It should own the active
Project-folder session, serialized write queue, autosave, deletions, external
edit conflicts, and update-safe flush. Rename inverted internal folder terms to
literal `workingFolder` and `projectFolder`, then remove only helpers proven
unused.

Measure before changing behavior. The first low-risk candidate is the Web
Serial byte queue, which currently shifts individual bytes. Profile full-folder
saves, target-worker replay, cache verification, browser startup, bundle size,
and RP2350 heap/loop timing before optimizing them. Preserve command
serialization, idempotent replies, transactional runtime slots, leases,
watchdogs, and robot-identity checks.

## Deferred empirical work

- Wheel/track calibration, stopping distance, moving IMU/range comparison, and
  all five physical challenges on the final course surface.
- Windows/Edge, Chromebook-class Chromium, several nearby XRPs, and two laptops
  addressing one robot.
- Mobile hardware control and mobile WebM export; clear unsupported-capability
  messages are sufficient.
- Embedded browser Git or credential storage. Ordinary project folders plus
  GitHub Desktop remain the lower-friction current approach.

## Future external positioning seam

Arena positioning will be an optional, provenance-bearing telemetry observation,
not another odometry pose. Reserve independent fields for robot/tag identity,
coordinate-frame identity, source timestamp, receive timestamp, `x_mm`, `y_mm`,
optional heading, validity, and quality. It must remain distinct from estimated
pose and simulator ground truth and must not affect control implicitly. When
implemented, carry it through robot/service JSON, browser copying, archives, and
a versioned recording/CSV schema.
