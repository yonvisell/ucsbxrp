# Current UCSBXRP product outcomes

This is the single live product backlog. It merges current user observations,
prior audits, direct browser and robot evidence, and unresolved design work.
The `USER_REQUIREMENTS_*` files and `open-user-issues-now.md` remain source
history; they are not parallel plans. Detailed validation belongs in
`STATUS.md`, and retained physical evidence belongs in `docs/hardware/`.

## Current baseline

- Browser source: current repository `HEAD` plus the active integrated stage.
- Attached XRP: physically qualified on `2026.08-dev.36`, generation 17, from
  source commit `5d217ed`.
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
- Expanding Spiral and the physical command path have raised-wheel evidence for
  Run, Stop, Reset, rerun, motor effort, encoders, wheel distance, sensor data,
  pose, plots, logs, and final zero drive on dev.36.
- The four active tutorial projects cover Python fundamentals, Virtual XRP
  drawing, the sampled robot program, and behavior with telemetry. Each has
  student tasks and immediate checks rather than a shipped solution.
- Five cumulative challenge projects carry prior student modules forward.
  Their README files identify the task, supplied code, student work, and
  measurable behavior; mutable task values remain in code rather than prose.
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
actual resizing, not only overflow tests. Add the application asset generation
and course release to System/setup logs so a stale installed app or old server
is immediately distinguishable without another visible status badge.

### 2. Current-release setup, repair, and robot operation

Qualify the native Web Serial wizard on the current bundle: same-release repair
with zero changed files, interrupted/cancelled retry, station setup on Pink,
atomic IDE handoff, default Run/Stop/Reset/rerun, a second nontrivial project,
shared IDE/Monitor state, telemetry, and complete logs. Then repeat one hotspot
cycle with a custom SSID, explicit computer-Wi-Fi instruction, and return to an
internet network. Earlier hotspot evidence is regression history, not proof of
the current release.

Station discovery also needs a robot-specific hostname or equivalent candidate
derived from stable robot identity; a classroom full of `ucsb-xrp.local`
responders is ambiguous even though identity checks prevent commands to the
wrong robot.

### 3. Course-project clarity and consistency

Generate repeated student component stubs from canonical documented templates
so a student starting directly at a later challenge receives the same guidance
as a student progressing sequentially. Remove module-global robot/state objects
from student-visible examples; pass state explicitly and return the updated
state. Review README repetition through a short novice observation rather than
another wholesale prose rewrite.

The existing visual world editor satisfies instructor world authoring. Reuse it
inside the IDE for `world.json` only if students are expected to modify a world;
retain readable JSON as the advanced representation.

### 4. Instructor challenge creation

Exercise the authoring tool with one new curriculum-appropriate challenge. The
browser must produce an immediately usable unpublished project—preferably an
Open draft in IDE action or a downloadable project archive—without requiring a
repository checkout or Python CLI. Publication and catalog integration remain
deliberate maintainer operations after virtual execution, telemetry review,
and instructional review.

### 5. Update behavior and release identity

The offline manifest already provides content-derived application identity;
do not add another build-ID mechanism. Treat `release_sequence` as robot runtime
identity and raise `minimum_robot_release_sequence` only for an incompatible
service, protocol, API, or installed-library change. Verify update adoption from
an old installed PWA while a project picker, edit, and run are active. Explain
the available/current release in student language without exposing cache
machinery.

Future challenge-template corrections need template revision and base-content
identity so the IDE can offer a correction without replacing student work.

### 6. Focused refactor and measured performance

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
