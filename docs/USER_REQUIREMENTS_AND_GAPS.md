# UCSBXRP requirements and usability audit

## Purpose and evidence boundary

This audit compares the integrated repository with
`docs/USER_REQUIREMENTS_AND_INTENT.md` and the course authorities named in
`PROJECT_CONTEXT.md`. It emphasizes the workflows a student or instructor must
actually complete. It is not an acceptance checklist and does not assume that a
user-suggested mechanism is correct merely because it was proposed.

The audit cut is the current `ab01636` working tree, whose source release is
`2026.08-dev.28`. That tree contains integrated but uncommitted project-folder,
portable-project, documentation, commissioning, target-client, and service
changes. The last recorded complete non-hardware gate in `STATUS.md` is the
dev.26 source. The newest immutable physical evidence is the nominal dev.25
station-mode run in
`docs/hardware/2026-08-26-dev25-transaction-and-runtime.json`. Dev.27 physical
qualification was still in progress when this audit was written. A test that
passed on dev.25, or a focused test for an uncommitted dev.27 change, is not
reported here as full dev.27 qualification.

Evidence terms are literal:

- **Physical evidence** means a retained observation from the attached RP2350
  XRP.
- **Browser evidence** means a complete workflow exercised in Chrome. Most
  commissioning browser tests mock Web Serial and the XRP HTTP service; they do
  not replace a native-device run.
- **Unit or source evidence** establishes a local rule or state transition, not
  the usability of the complete workflow.
- **Unresolved** means either a demonstrated defect or an important required
  branch without adequate evidence. It does not imply that every untested branch
  is broken.

## Overall assessment

The product now has substantive end-to-end behavior: the virtual XRP executes
the project MicroPython, IDE and Monitor share target and project state, the
physical service supports project transfer and telemetry, setup installs a
verified slotted runtime, project files can autosave to ordinary folders, and
the course includes runnable demos, challenges, tutorials, documentation, and
an instructor authoring path. These are no longer placeholder implementations.

The most important newly confirmed defect is the project-directory boundary.
**Open project can accept a parent course folder and recursively combine files
from several child projects into one apparent project.** This can expose the
wrong files and can cause later metadata or autosave writes at the wrong folder
level. It is a root model error, not a label problem. It should be corrected
before further project-panel polishing or broad refactoring.

The other central uncertainty is release qualification. The physical dev.25
station workflow is strong evidence for Flash, Run, Stop, motor, encoder,
telemetry, and IDE/Monitor coordination. It does not establish that the current
dev.27 setup bundle, first-use Web Serial path, repair path, reset recovery,
hotspot handoff, installed PWA, and deployed GitHub Pages build all work together
repeatedly.

## Behavior presently supported

### Setup and repair

The setup application now has a coherent student-facing sequence: select or
confirm a course folder, select or confirm an XRP over USB, inspect the
controller and runtime, install or repair the course runtime, choose the robot
network, follow an explicit computer-Wi-Fi handoff, verify the Wi-Fi service,
and open the IDE with the physical target selected. A previously authorized XRP
can be shown as **Use this XRP**; the browser's mandatory chooser remains for a
first-use device. Existing hotspot configuration is not repeated as a second
equivalent hotspot choice. Progress, setup log, Back, exit, permission help,
and identity matching are present.

Evidence:

- `apps/commission/src/CommissionApp.tsx`
- `apps/commission/src/commissioner.ts`
- `apps/commission/src/web-serial.ts`
- `apps/commission/src/commissioner.test.ts`
- `tests/e2e/commissioning.spec.ts`

The installer downloads and hashes all required assets before device mutation,
installs the managed course runtime into an inactive A/B slot, verifies the slot
and release manifest, and publishes activation state only after verification.
The bootstrap can retain the last confirmed slot. This is the appropriate
boundary for repair and course updates; it should not be replaced by live
file-by-file module replacement or cache-clearing workarounds.

Evidence:

- `device_service/course_boot.py`
- `device_service/main.py`
- `vendor/current/release.json`
- `tests/python/test_course_boot.py`
- `tests/python/test_build_commissioning_bundle.py`
- `tests/python/test_install_xrp_service.py`

### Project identity, autosave, and recovery

`ProjectSession` gives a project a stable identity, monotonic content revision,
saved revision, and base digest. IDE startup restores an authorized project
folder before it displays or stages a project, while a short cross-tab bootstrap
record prevents Monitor from running an older project during that restoration.
Changing a project marks the shared target stale; Monitor Run then validates and
stages the current IDE project rather than silently running the preceding one.

The current dev.27 folder work calculates a canonical SHA-256 digest over the
project name, main file, template, paths, and contents. The root metadata is
written after file writes and deletions as a commit marker. If a Git operation
or external editor changes the folder after the IDE's saved base, autosave
pauses and offers one explicit choice: use the folder files or keep the IDE
files. Both versions are retained. A digest mismatch also detects a visibly
mixed or interrupted multi-file write on the next read.

Evidence:

- `apps/ide/src/project-session.ts`
- `apps/ide/src/project-session.test.ts`
- `apps/ide/src/project-files.ts`
- `apps/ide/src/project-files.test.ts`
- `apps/ide/src/IdeApp.tsx`
- `tests/e2e/workflow-stress.spec.ts`
- `tests/e2e/project-workflow.spec.ts`

The conflict algorithm has focused unit coverage. Its two-choice interaction
has not yet been exercised against native Chrome File System Access handles
while a real external editor modifies the same folder. That browser workflow
remains required after the project-directory boundary is corrected.

The browser and RP2350 now share one portable-project boundary: at most 48
files, 256 KiB total, 96 KiB per file, and 160 ASCII-safe path characters.
Incompatible projects can still be opened and repaired in the IDE, but virtual
and physical validation/run reject them before compilation or an XRP request.

Evidence:

- `packages/target/src/project-validation.ts`
- `packages/target/src/project-validation.test.ts`
- `packages/target/src/portable-project-targets.test.ts`
- `tests/e2e/ide-editing.spec.ts`
- `device_service/ucsb_xrp_service/protocol.py`

### IDE, Monitor, output, and telemetry

IDE and Monitor use shared virtual and physical workers. A fresh Monitor can run
the default virtual project without an earlier IDE Run. An IDE edit propagates
the exact project revision, and one Monitor Run performs required validation and
physical transfer. Run and Stop state is shared in both directions. A Monitor
opened after a virtual run receives retained path and strip-plot history.

Program output and the diagnostic event log have one visible home in the IDE.
The Monitor retains output internally only to save the run archive with
telemetry; it does not display a contradictory second terminal. Physical
console events have request, result, error, boot, run, and sequence identities;
missing device log or telemetry sequences produce an explicit gap event. The
device splits or bounds long output records, the shared workers retain 2,000
console events, and the IDE retains 5,000 entries. This is bounded full session
output, not an unlimited terminal history.

Evidence:

- `packages/target/src/physical-target-coordinator.ts`
- `packages/target/src/virtual-target-event-hub.ts`
- `packages/target/src/physical-target.ts`
- `device_service/ucsb_xrp_service/protocol.py`
- `device_service/ucsb_xrp_service/service.py`
- `apps/ide/src/IdeApp.tsx`
- `tests/e2e/project-workflow.spec.ts`
- `tests/e2e/late-monitor-history.spec.ts`
- `tests/e2e/physical-hardware.spec.ts`

Monitor implements the requested world view, dimensioned XRP, project-owned
world selection, live telemetry, live controls, watches, student-published plot
variables, equal-height strip plots, labeled axes and minor grid lines, clear
plots, recording, annotations, CSV export, plot SVG/PNG export, and WebM world
replay. The 30,000-sample recorder reports the observed rate, capacity, and
dropped older samples. A completed monitored run writes rotated output,
telemetry, and metadata to the remembered active project folder when permission
is available.

Evidence:

- `apps/dashboard/src/DashboardApp.tsx`
- `apps/dashboard/src/SignalPlot.tsx`
- `apps/dashboard/src/WorldView.tsx`
- `apps/dashboard/src/monitor-export.ts`
- `packages/target/src/telemetry-recording.ts`
- `tests/e2e/monitor-recording.spec.ts`
- `tests/e2e/autosave.spec.ts`

The latest immutable physical record confirms one dev.25 station-mode service
probe, repeated Flash/Run/Stop, a raised-wheel motor and encoder probe ending at
zero motor effort, and an IDE/Monitor physical browser workflow. See
`docs/hardware/2026-08-26-dev25-transaction-and-runtime.json`. This evidence
does not transfer automatically to the dev.27 changes.

### Demos, tutorials, and challenges

The expanding spiral is the default project. The obstacle-turn demo, all five
challenges, and all seven MicroPython tutorial lessons have virtual execution
coverage. The tutorial progresses from values and functions through modules,
virtual sensing, and a finite-state program. Its README distinguishes the timed
introductory examples from the regular `Robot.step()` schedule used in challenge
control loops.

Challenge projects identify new student work, work carried from the previous
challenge, supplied files and services, program flow, component-check results,
and a concrete sequence of virtual and physical work. **Start next challenge**
creates a separate project and copies only declared reusable student modules.
`component_checks.py` is a short selector; the supplied library prints each
example and reports PASS, NOT IMPLEMENTED, or FAIL without starting a robot.
Challenge 4 accepts a valid connected free-cell route and no longer mandates a
shortest route or a particular frontier data structure.

Evidence:

- `vendor/current/templates/micropython_tutorial/`
- `vendor/current/starters/challenge_1/` through `challenge_5/`
- `vendor/current/ucsb_xrp/component_checks.py`
- `tests/e2e/course-starters.spec.ts`
- `tests/e2e/project-workflow.spec.ts`
- `tests/python/test_course_starters.py`

These tests establish that the projects execute and that the expected text and
structure exist. They do not establish that first-time mechanical-engineering
students can understand every README or component check without instructor
interpretation. A short observed student trial remains more informative than
adding further prose assertions or selector-based text tests.

### Local-first application, navigation, Guide, and API

The production worker precaches the application shells, simulator, vendored
MicroPython, course package, templates, Guide, API reference, setup application,
and instructor pages. The offline browser workflow reloads the production shell
with network access blocked and runs the virtual path. The course folder is
ordinary user storage and is independent of the browser-managed PWA cache. The
site cannot silently install a PWA or place its executable shell in the selected
folder; the current conditional browser install prompt is the correct platform
boundary.

All principal pages use the shared Home, IDE, Monitor, Guide, Set up or Repair,
and API navigation. The student route is `/monitor/`; `/dashboard/` is retained
only as a compatibility redirect. Responsive navigation and direct Guide/API
fragments have browser coverage.

The Guide now explains first virtual use, course and project folders, project
structure, component checks, physical setup, telemetry/export, offline behavior,
GitHub Desktop, troubleshooting, and system structure. The API reference gives
public purposes, signatures, arguments, units, defaults, return values,
exceptions, retained state, and examples. The Guide diagrams are semantic React
and CSS structures rather than hand-positioned SVG. Both documents use compact
body and code typography.

Evidence:

- `scripts/offline-build.mjs`
- `scripts/verify-offline-build.mjs`
- `apps/shared/offline-shell.ts`
- `apps/shared/AppNavigation.tsx`
- `apps/guide/src/GuideApp.tsx`
- `apps/guide/src/CourseFlows.tsx`
- `apps/reference/src/ReferenceApp.tsx`
- `tests/e2e/offline.spec.ts`
- `tests/e2e/navigation-links.spec.ts`

### Instructor challenge creation

The browser authoring page edits and validates a versioned challenge
specification. The repository CLI creates an unpublished project, checks it, and
publishes it only after an explicit command. The included Waypoint Slalom
example is generated, run on the virtual XRP, and exported in browser testing.
Instructor documentation describes the boundary between teaching design,
executable project, and publication and includes the complete specification and
source example.

Evidence:

- `apps/author/src/AuthorApp.tsx`
- `apps/author/src/challenge-spec.ts`
- `scripts/challenge_authoring.py`
- `docs/INSTRUCTOR_CHALLENGE_AUTHORING.md`
- `docs/examples/waypoint_slalom.challenge.json`
- `tests/e2e/instructor-authoring.spec.ts`
- `tests/python/test_challenge_authoring.py`

This is a usable repository-side workflow for an instructor comfortable with a
local checkout and Python command. It is not yet the low-friction browser-only
challenge creation experience originally requested.

## Highest-priority unresolved work

### 1. Enforce one conventional project-directory boundary

**Observed and source-confirmed defect.** `openWorkingFolder()` in
`apps/ide/src/IdeApp.tsx` passes the selected directory directly to
`readProjectFolder()`. That reader recursively visits every non-hidden,
nonignored child directory and does not require
`.ucsb-xrp-project.json` at the selected root. The course-repository heuristic
rejects one known repository file pattern, but an ordinary parent folder that
contains several student projects is accepted. When no remembered course folder
is available to constrain the picker, selecting that parent yields paths such
as `ProjectA/main.py` and `ProjectB/main.py` in one IDE project. Later saves can
write `.ucsb-xrp-project.json` and `UCSB_XRP_Autosaves` at the parent level.

This contradicts the Guide's model and the claim in `docs/RED_TEAM_REVIEW.md`
that a project directory is loaded only with UCSBXRP metadata. The existing
nested-file test in `apps/ide/src/project-files.test.ts` proves legitimate
subdirectories *inside one project* but does not distinguish them from sibling
projects under a course folder. The new portable-project limit may prevent a
large combined folder from running, but it does not prevent wrong files from
being displayed or edited.

**Required design correction:**

1. Use `courseFolder` only for the parent directory and `projectFolder` only for
   the active project root. Remove the internal and visible “working folder”
   synonym.
2. Make **Open project** accept a directory only when its root has a valid
   `.ucsb-xrp-project.json`. Continue to allow nested source paths below that
   root.
3. Provide a separate, explicit **Import existing folder** migration for a
   legacy project without metadata. It should inspect one selected root, show
   the files to be adopted, create metadata only after confirmation, and reject
   a folder that contains child project manifests.
4. Make **New project** one conventional operation: choose a template, request
   the project name, create `courseFolder/projectName`, populate it, attach it,
   and autosave. If no course folder is available, choose the course folder as
   part of that operation on supported desktop browsers. A temporary browser
   project remains a deliberate fallback, not an intermediate state students
   must understand to save ordinary work.
5. Make Monitor archives follow the shared active `projectFolder`; do not let a
   second unconstrained folder picker create a divergent run-output location.
6. Display the full relative project path. `.project-root` currently truncates
   with CSS ellipsis and has no `title`, so the user cannot inspect a long path.
   Use a compact path with an accessible full value and a clear overflow
   affordance.

Regression evidence should include: rejecting the course parent; leaving two
sibling projects byte-for-byte unchanged; opening a valid root with nested
files; explicit legacy import; selecting a new course folder; creating a new
project; external/Git edit conflict; interrupted write; Monitor archive to the
same active project; reload; and a second project switch.

### 2. Qualify the exact dev.27 release as one product

The current source changes commissioning, release metadata, service lifecycle,
portable project validation, project persistence, and physical-target Stop
behavior. Dev.25 physical evidence is not enough to publish dev.27 as physically
qualified.

The next physical sequence should be scenario-driven rather than a collection
of isolated probes:

1. From a normal supported Chrome profile, reset or recommission the attached
   XRP over native Web Serial and install dev.27.
2. Verify the selected station profile and exact USB/Wi-Fi robot identity, then
   open the IDE through the wizard handoff.
3. Create or open one valid local project directory, Flash, Run, observe output,
   motor command, encoder change, telemetry, and Stop, then rerun it.
4. Change to a second nontrivial project and repeat from Monitor as well as IDE.
5. Reopen both apps, run the retained project, repair the same release, and
   repeat without stale endpoint, wrong folder, duplicate log, or disabled Run.
6. Exercise one interrupted inactive-slot installation and one invalid candidate
   so the confirmed runtime rollback is observed, not only unit-tested.

Hotspot and deployed-PWA repetitions remain required before classroom release,
but the station path should be made repeatable first. Evidence should record the
exact release, robot ID, runtime generation/digest, network, project revision,
commands, final motor command, and any user-visible recovery.

### 3. Reset still knows addresses, not how to rediscover the selected robot

Initial connection tries the configured station address and
`ucsb-xrp.local`, and every accepted response is checked against `robotId`.
However, `DirectPhysicalTargetClient.reconnectAfterReset()` polls only its
currently bound endpoint. If DHCP changes the address during reset, the selected
robot cannot be found even though wrong-robot rejection is implemented. The
shared station hostname is also `ucsb-xrp.local` for every robot, so it is not a
complete multi-robot discovery method.

**Correction:** make reset recovery coordinator-owned and identity-based. Probe
known addresses and a robot-unique station name, accept only the commissioned
`robotId`, atomically update the verified station endpoint, and show one
recovery state. Derive the hostname from the stable robot identity or another
commissioned unique value. Test two physical robots or an equivalent network
fixture. This is not solved by a longer fixed delay.

Evidence:

- `packages/target/src/physical-target.ts`
- `packages/target/src/target-preference.ts`
- `device_service/ucsb_xrp_service/networking.py`
- `tests/e2e/workflow-stress.spec.ts`

### 4. Lost replies are still ambiguous for most physical commands

The service caches the last 20 correlated replies by request ID. Dev.27 uses the
same request ID for one retry of Stop and has explicit interrupted-Stop recovery.
Validate, Flash, Run, reset, live-parameter updates, and leases still normally
send once. A transport timeout can therefore report failure after the XRP has
already completed the operation. This matches the class of user reports in
which a button appeared inert or a retry later found changed robot state.

**Correction:** use the existing request/reply cache rather than adding a new
operation subsystem. Retry safe interrupted commands once with the identical
request ID, then reconcile actual project/run state. Reset requires identity-
aware rediscovery rather than a blind POST retry. Retain short reachability
timeouts and measure operation-specific ceilings; do not add routine multi-
second sleeps.

Evidence:

- `packages/target/src/physical-target.ts`
- `device_service/ucsb_xrp_service/service.py`
- `packages/target/src/physical-target.test.ts`

### 5. The PWA protects active work but still references mutable release paths

The offline shell is content-hashed and retains the preceding cache while an
update activates. IDE/Monitor can defer reload while a project is unsaved or a
run is active, and setup refuses a page/commissioning-manifest release mismatch.
However, an active shell still treats
`course/commissioning/manifest.json` and `course/current/release.json` as
network-first mutable URLs. A deployment can therefore present an old page and
new `current` resource during update or rollback; the mismatch guard prevents an
incorrect USB write but does not make the active application internally
immutable.

**Correction:** build each app shell against immutable release URLs. A small
`latest` record may announce an update, but the active shell and commissioning
page should consume only the release ID embedded at build time. Activate the new
shell, course assets, and worker together. Then test the deployed Pages URL, an
installed app window, offline reopen, update while an edited project is open,
site-data clearing, and hotspot operation without internet.

Evidence:

- `scripts/offline-build.mjs`
- `apps/shared/offline-shell.ts`
- `apps/shared/offline-release-coordinator.ts`
- `tests/e2e/offline.spec.ts`

### 6. Browser challenge authoring remains split and exposes raw internals

The current browser wizard downloads a JSON specification and explicitly makes
no project files. The instructor must move the file into a repository, run the
Python CLI, inspect the generated project, run checks, and publish. World and
file overrides are raw JSON/source text. This is a sound version-controlled
publication boundary but not yet a self-contained, low-friction creation tool.

The world contract is also narrower and less consistent than the requested
course authoring model. TypeScript validates `start_line`, `start_box`, and
`waypoint`; Python retains marker dictionaries and validates waypoints only when
accessed. Stop lines, timing gates, stop boxes, and general visual markers are
absent. The instructor example still stores `program_flow` as hand-spaced ASCII
text, although the student Guide uses responsive semantic diagrams.

**Correction order:**

1. Define one versioned world schema with shared fixtures and equivalent
   TypeScript/MicroPython validation.
2. Add the semantic markers the course actually needs.
3. Let the browser produce and preview a complete project archive, run virtual
   and component checks, and display the resulting world and program flow.
4. Add a compact world editor using the same schema and Monitor geometry.
5. Keep catalog publication as an explicit repository operation.

Evidence:

- `apps/author/src/AuthorApp.tsx`
- `apps/author/src/challenge-spec.ts`
- `packages/simulator/src/world.ts`
- `vendor/current/ucsb_xrp/world.py`
- `docs/INSTRUCTOR_CHALLENGE_AUTHORING.md`
- `docs/examples/waypoint_slalom.challenge.json`

### 7. Platform, accessibility, and long-run evidence remain incomplete

The landing page checks secure context, service worker/cache, SharedWorker,
WebAssembly, folder picker, and Web Serial. Runtime code separately checks
cross-origin isolation and WebM support. The landing status can nevertheless
say physical XRP is ready before local-network permission and the deployed
HTTPS-to-HTTP path have been exercised on that platform. Current browser tests
are primarily Chromium on macOS with mocked device interfaces. Representative
Windows Chrome/Edge, installed-PWA permissions, a Chromebook if the course uses
one, and native File System Access conflict behavior remain unqualified.

Theme contrast, focus styles, reduced motion, forced colors, responsive layout,
and keyboard-capable separators have coverage. A complete keyboard focus-order
pass, modal escape/focus return, 200% zoom, screen-reader inspection, and a
numerical alternative to canvas history have not been established.

Monitor retains bounded overlapping histories: 1,200 render samples, a
30,000-sample recorder, and shared telemetry/event history. Completed runs are
archived after they end, so a tab or browser failure during a long run can lose
the current archive. Profile memory and delivery cost before changing this
behavior. If long experiments require it, journal telemetry in chunks to the
active project folder and render a decimated view from one shared history.

## Focused usability recommendations

### Keep Monaco and add course-aware help there

Replacing Monaco would add download size and another editor integration without
addressing the current problem. The bundle already includes Python syntax,
suggest, and hover contributions in
`apps/ide/src/monaco-editor-features.ts`. Current contextual help is only a
filename-based API link in `IdeApp.tsx`.

A small UCSBXRP symbol index should drive both completion and hover help for the
course API: imports, class and function names, signatures, units, a one-sentence
purpose, and the matching API anchor. Register it with Monaco's existing
completion and hover providers. Keep it deliberately narrower than a desktop
Python language server, and add parity tests so the symbol index and API
reference cannot drift. Compile and runtime errors remain authoritative.

### Keep required browser boundaries explicit

Several earlier requested mechanisms are not implementable or not desirable as
silent automation:

- A website cannot silently select a first-use serial device; the system picker
  is a browser security boundary.
- A website cannot silently install itself as a PWA. It can cache its release
  automatically and expose the install prompt when the browser provides one.
- The PWA cache is browser-managed and cannot be copied into the selected course
  folder as a self-running application without introducing a separate installed
  runtime or server.
- Folder handles must remain browser-managed because the site needs permission
  before it can write an ordinary disk file. A single universal configuration
  file cannot replace all browser state before a folder exists.

The correct simplification is domain-specific authority: one `RobotProfile` for
the commissioned target, one project metadata file inside one project root, one
browser handle to the course root and active project, and bounded browser state
only for temporary recovery and cross-tab coordination. The implementation
should delete legacy aliases and migration paths after their supported lifetime
rather than add new recovery tiers.

### Validate comprehension with people, not more text assertions

The Guide, API, challenge READMEs, and tutorial are now substantially expanded
and their structures are test-covered. Remaining prose quality should be
assessed with a short first-use observation: ask a student to create a project,
identify what to implement, run component checks, locate API help, run virtually,
and explain the resulting plots without coaching. Ask another instructor to
create the Waypoint Slalom draft and state what still requires repository work.
Record the points where they hesitate. This will expose terminology and
information-order failures more reliably than tests that assert a heading or
sentence is present.

## Recommended implementation order

1. Commit the current coherent baseline after the root physical run reports its
   exact result; do not merge an unqualified dev.27 claim into the dev.25
   evidence.
2. Correct the course-folder/project-folder boundary and add native Chrome
   conflict/import/sibling-project regression coverage.
3. Repeat the dev.27 station-mode setup, two-project physical lifecycle, repair,
   reload, and IDE/Monitor workflow against that corrected project model.
4. Add identity-based reset rediscovery and general same-request-ID reply
   recovery, then repeat the physical sequence.
5. Make app release references immutable and validate the deployed and installed
   local-first application, including hotspot mode.
6. Reconcile the world schema, then improve browser challenge/world authoring.
7. Run representative Windows and accessibility checks and measure long-run
   telemetry/memory behavior.
8. Only after this baseline is stable, perform the planned conservative
   refactor: remove obsolete migrations and duplicated state, keep student code
   literal, rerun the complete browser/physical workflows, and profile before
   optimizing.

This order addresses wrong-project and wrong-robot behavior before presentation
or performance work, while preserving the working simulator, course API, and
physical service boundaries.
