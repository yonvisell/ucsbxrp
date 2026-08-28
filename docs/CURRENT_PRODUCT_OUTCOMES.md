# Current UCSBXRP product outcomes

This is the single live product backlog. It merges current user observations,
prior audits, direct browser and robot evidence, and unresolved design work.
The `USER_REQUIREMENTS_*` files and `open-user-issues-now.md` remain source
history; they are not parallel plans. Detailed validation belongs in
`STATUS.md`, and retained physical evidence belongs in `docs/hardware/`.

## Current baseline

- Browser source: current repository `HEAD` plus the active integrated stage.
- Attached XRP: physically qualified on `2026.08-dev.40`, generation 23, from
  source commit `0b301cd`.
- Current course bundle: `2026.08-dev.40`. It requires robot runtime dev.39 or
  later for the atomic edited-project Run transaction; dev.40 also retains and
  drains physical telemetry in larger bounded batches.
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
- Straight Run, Expanding Spiral, and the physical command path have current-release,
  raised-wheel evidence for Run, Stop, Reset, rerun, project edits, motor
  effort, encoders, wheel distance, sensor data, pose, plots, logs, and final
  zero drive on dev.40.
- The five active tutorial projects progress from Python fundamentals through
  Virtual XRP drawing, the sampled robot program, telemetry, and a physical-XRP
  preflight. Each has student tasks and immediate checks rather than a shipped
  solution.
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

### Monitor telemetry presentation

Live telemetry now reports its measured source rate from sample sequence and
timestamps without adding robot traffic. Plot history covers at least 30
seconds at the 50 Hz course-loop rate, the time window precedes signal choices,
notes persist across runs and export with their time and pose, and visible notes
remain in plot exports. The simulator and World view share a 15-degree HC-SR04
fan with a 70 mm sensor origin. Monitor receives ordered retained telemetry in
batches of at most 128 samples, while IDE receives no unused telemetry stream.
A 10,000-sample reconstruction now requires 79 worker messages rather than
10,000; all samples remain in order and appear exactly once.

### 1. Ordinary student project and run workflow

The integrated native-Chrome workflow creates a named project, edits and
autosaves it, reopens and switches projects, and uses
Compile/Run/Stop/Reset/rerun with persistent Program output and System log.
Cancellation, denied folder permission, and an invalid repository root leave
the current project unchanged and explain what happened. Repository files are
not exposed and the IDE does not recurse through a Working folder.

The current production build fills both restored and expanded windows. On one
loaded page, the application, workspace, Monaco editor, and canvas match four
different viewport sizes in both directions with no document overflow. The
output area remains a compact drawer. System and setup logs identify the
application build and course release without another visible status badge.

### 2. Current-release setup, repair, and robot operation

Current dev.40 native Web Serial setup and idempotent repair pass on Pink,
including zero changed files, explicit network verification, robot-identity
verification, atomic IDE handoff, two projects, Run/Stop/Reset/rerun, shared
IDE/Monitor state, 50 Hz course telemetry without retained-sample gaps, and
complete logs. Repeat one current-release
hotspot cycle with a custom SSID, explicit computer-Wi-Fi instruction, offline
reopening, and return to an internet network. Earlier hotspot evidence is
regression history, not proof of the current release. Retain cancellation and
retry coverage in the simulated commissioning suite.

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

The project command model is now one workflow: **Open project…** selects a valid
Project folder, **New from template…** creates a named child project, **Save to
folder…** gives an intentional browser draft a native folder, and autosave owns
ordinary persistence after that. The student command is **Compile** because it
compiles every Python source file without running the robot; the UI and Guide
use that term consistently.

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

Do not begin a broad app split solely for performance. The largest bundles are
the intentionally embedded Monaco and plotting libraries, while the robot has
ample measured heap and holds its 50 Hz loop. Extract project-persistence code
from `IdeApp` only when that area next changes and the extraction removes real
duplication.

The first measured improvement is complete: role-aware target workers and
batched history reconstruction cut 10,000-sample replay dispatches by 99.21%.
The Web Serial byte queue remains a contained later candidate if large replies
are observed. Preserve command serialization, idempotent replies, transactional
runtime slots, leases, watchdogs, and robot-identity checks.

Before several robots share one classroom LAN, add a per-robot pairing token
created during USB setup and required for state-changing service requests. The
current robot identity check prevents the UCSBXRP app from selecting the wrong
robot, but it does not prevent another page on the same LAN from sending an
unauthenticated command.

### Later usability refinements

- Repair plot-note placement so **Add note** produces a visible vertical marker
  and label at the selected retained sample. Decide explicitly whether plots
  stop advancing when a program becomes idle. If continuous idle telemetry has
  a demonstrated use, expose it as one compact opt-in control. Prefer one
  telemetry export that includes notes over a separate notes-only CSV unless an
  instructor workflow requires both.
- Replace **Run uses another IDE tab** with a literal explanation of which open
  project supplies the next IDE or Monitor run and how to switch it.
- Expand troubleshooting for first XRP setup, Working-folder selection,
  permission loss, project reopening, and network selection.
- Separate **Implement components** from **Test components** in the Guide.
  Explain that Test components runs supplied input/output cases without moving
  a robot and reports which student methods are incomplete or incorrect.
- State desktop Chrome as the primary student browser on both Windows and
  macOS; describe Edge as a supported Chromium alternative, not the Windows
  default recommendation.
- Protect supplied challenge-definition and world files from accidental edits.
  An intentional unlock or copy-to-independent-project action may expose them
  when modification is appropriate.
- Collapse the Project-folder storage explanation after a native Project folder
  is connected. Reassess the complete action group together—**Open project…**,
  **New project from template…**, and **Save project…**—so the distinctions are
  visible from the labels and dialog text.
- Treat a difference between port 4174 and the public Pages application as an
  incomplete deployment, not as browser state. Verify the published asset
  identity and default project after every release.

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
