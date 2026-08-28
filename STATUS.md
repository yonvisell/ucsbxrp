# Project status

Last updated: 2026-08-28

## Current result

Refinement 70 removes another set of competing browser authorities. The
Working-folder manifest and its active Project folder now determine startup,
Monitor Run, and changes of Working folder. Monitor can compile and run that
saved project without an IDE tab, while an open IDE may still publish a newer
saved revision. A run retains its start-time project and Project-folder handle,
so edits cannot end its telemetry or redirect its run archive. Reset retains
the completed run for inspection and the next Run starts a new trail without a
connector. Physical connection errors now describe the selected network and
Reconnect action instead of referring to a removed hotspot setting.

The editor now gives each project file a distinct Monaco model identity. A
Chrome journey exposed that a bare `main.py` model could receive the README of
a newly created tutorial even though the folder copy was correct; this
cross-project overwrite is fixed. Five revised tutorials now compile in one
browser session and keep instructions beside only `student_work.py`. Tutorial
checks give concrete input, observed result, expected result, and a direct next
step. Challenge briefs and checks and the student API reference were revised in
separate committed slices.

Validation for this boundary includes 56 focused TypeScript tests, 39 focused
Python starter/tutorial/API tests, a production/offline build, four first-use
and tutorial Chrome journeys, and nine Monitor recording/export/responsive
journeys. One telemetry-path assertion was corrected to account for repeated
state publications at one simulator sequence number; the geometry unit test
continues to verify that resets and target changes never create a path
connector. The next slice is the complete browser workspace/commissioning
journey followed by the attached physical XRP path, then the bounded
refactor/pruning and documentation integration.

Refinement 69 integrates the student-workflow, documentation, authoring, and
browser-performance work on the dev.40 physical baseline. The IDE now has one
literal folder model: a Working folder contains named Project folders;
**Open project…**, **New from template…**, and **Save to folder…** are grouped
with the current folder state. Cancelled or denied pickers and invalid
repository roots preserve the current project, and repository files cannot be
mistaken for project files.

The live production IDE uses one viewport-sized grid from the page through the
workspace, editor stack, editor frame, and Monaco canvas. The same loaded page
was resized through 760×620, 980×760, 1100×700, and 1450×900; every layer
matched the viewport in both directions with zero document overflow, while the
collapsed output drawer remained 27 pixels high. Only the immutable build at
port 4174 was running during that measurement.

The Guide lists all five tutorials and explains the installed web application,
browser draft, Working folder, and Project folders separately. API constructors
now document parameters and exceptions, project README files use literal
student-facing language, and the instructor author can start from a genuinely
blank Challenge 1 specification rather than inheriting hidden example data.
Student templates use ordinary `#` comments rather than triple-quoted
commentary.

Target workers now identify IDE and Monitor ports. Monitor receives live and
retained telemetry in ordered batches of at most 128 samples; IDE receives no
unused high-rate stream. A 10,000-sample reconstruction uses 79 worker messages
instead of 10,000, a 99.21% reduction, while retaining exact order and one copy
of every sample.

The integrated software result passes formatting, the production and 268-file
offline builds, 379 TypeScript tests, 29 focused Python starter/tutorial tests,
and 58 selected production-Chrome workflows. Those workflows cover project
creation/open/save/autosave and repository rejection; Monitor recording,
annotations, plots, and export; instructor world/challenge authoring and a
generated stopping-response run; all five tutorials; all challenges and demos;
Monitor-first Run; and the complete virtual multi-file path. Three obsolete
wording expectations were corrected and rerun; no product defect was hidden by
those changes.

The first GitHub deployment run then exercised 109 browser workflows and found
one additional product defect: a late Monitor received all retained telemetry
but its World view kept only the final path point because React delivered the
latest sample before the retained-history frame. World view now reconstructs
the missing trail from that ordered history. The same run exposed obsolete
status wording in two tests and seven offline tests that still treated the
intentionally cache-free localhost preview as a deployed origin. Automated
production previews now exercise the deployed service-worker path while an
ordinary local preview remains cache-free. Focused reruns of all eleven failed
cases pass before the deployment is retried.

Refinement 68 qualifies dev.40 on the attached RP2350 XRP in native Chrome.
The USB wizard retained the Pink station profile, installed the changed runtime,
verified robot identity at `192.168.7.25`, and completed a second repair with
zero changed and 28 unchanged files. The IDE handoff, Monitor-initiated Run,
two different projects, atomic edited-project Run, cooperative Stop, course
Reset without reboot, rerun, live parameters, plot values, motors, encoders,
ordered logs, and final zero drive all passed.

Physical execution exposed two telemetry-tail defects that ordinary software
tests had not modeled: a run could finish while a response was being assembled,
and a command pause could outlast the retained 50 Hz window. The service now
forces a final drain before adding its stationary sample, and the bounded ring
retains 96 course-loop samples. The final complete Run, Stop, Reset, rerun, and
second Stop produced no telemetry-gap event; the measured active source rate
was 50.0 Hz. Evidence is retained in
`docs/hardware/2026-08-27-dev40-station-repeatability.json`.

The same stage adds the measured source rate to Live telemetry, retains 1,800
plot samples, keeps and exports notes, and uses one shared 15-degree HC-SR04
sensor geometry in the simulator and World view. The integrated fast boundary
passes 237 Python tests, MicroPython source/bytecode/service proof, 377
TypeScript tests, production build, and offline verification. Eleven focused
Stable Chrome workflows cover Monitor recording/export and live IDE/workspace
resizing. Local preview service workers are removed on localhost, and the
browser-test viewport override is always reset after responsive checks.

Refinement 67 qualifies the current dev.37 station workflow on the attached
RP2350 XRP. Native Chrome Web Serial completed an idempotent repair with zero
changed and 28 unchanged files, restarted the controller, paused for the
explicit Pink network check, verified robot identity at `192.168.7.25`, and
handed the verified endpoint to the IDE. The complete physical browser workflow
then passed in 33.0 seconds: two-window project ownership, exact-project Run,
file-edit invalidation, Validate/Prepare, Run/Stop/Reset/rerun, retained output
and logs, raised-wheel motor effort, both encoders and wheel distances, range,
motor supply, IMU temperature, estimated pose, plots, and final zero drive.

That run exposed and closed one shared-state defect. A changed IDE project had
reused the robot's old content digest, so the next telemetry poll could make
Monitor appear ready for obsolete code. Pending IDE revisions now have a
distinct identity until Prepare replaces it with the verified robot digest.
The focused target/coordinator suite passes 64 tests, and the same edit →
Monitor Run → Stop sequence passes on the physical XRP. Evidence is retained in
`docs/hardware/2026-08-27-dev37-station-browser-validation.json`.

Refinement 66 consolidates prior audits and current user observations into
`docs/CURRENT_PRODUCT_OUTCOMES.md`, the only live product backlog. Historical
requirements, red-team, architecture, and package-size documents remain as
evidence rather than parallel plans. The implementation plan and system design
now use one literal folder model: a Working folder contains named Project
folders; a browser draft remains available when folder access is unavailable.

Open Project now reconnects the remembered Working folder, lists only valid
direct-child UCSBXRP projects, and opens the selected child without another
system picker. New Project, next-challenge creation, denied permission,
cancellation, autosave, and deferred application updates retain the same
authority. Common headers, titles, and public terminology are aligned across
the landing page, IDE, Monitor, Guide, API, commissioning, instructor author,
and overview pages.

Local development now uses the cache-free Vite server on fixed port 4174.
Production preview serves one immutable build snapshot; application startup
detects a mixed asset generation before continuing. Robot release identity is
no longer an automatic repair requirement: course bundle dev.37 accepts the
physically qualified compatible dev.36 runtime, while setup/repair may still
update it deliberately.

The first complete browser boundary run passed 103 workflows and exposed three
regressions. Two ownership tests still modeled the obsolete direct
Project-folder picker; they now exercise the Working-folder list and explicit
child selection. The apparent Monaco mismatch was a one-animation-frame
measurement race during rapid shrink/grow; the browser test now waits for
Monaco's container observer instead of sampling the transition. The five
affected multi-IDE and live-layout workflows pass together. The fast
boundary check also passes: 227 Python tests, MicroPython source/bytecode and
service proof, 359 TypeScript tests, production build, and the 253-file offline
shell.

Refinement 65 removes remaining implementation-facing language from common
student surfaces. IDE Status now shows the next project and target, validation
result, and physical-project readiness without tab ownership, revision, or
built-in-provider diagnostics. Those details remain available where they are
actionable: the Project panel, tooltips, and System log. Context help for
`challenge.py` now opens the project-structure Guide section; component and
configuration files retain direct API links.

The Guide now lists the four active tutorial projects and explains every
standard project-file role, including README, student modules, and supplied
exercise or component checks. API component sections state purpose before
class metadata and use the literal heading **Information retained between
calls**. Offline status links to the relevant Guide section, and landing,
Monitor, and IDE settings text distinguishes browser capability, offline app
availability, and the robot hotspot without using the ambiguous phrase
“cached app.” A few duplicated comments in starter files were removed while
the wheel-speed guidance was made explicit.

The integrated production/offline build and formatting pass. Thirty-one
focused Stable Chrome workflows cover the world editor, complete virtual path,
project ownership, navigation and API content, offline reload, narrow and live
resize layouts, and physical-network recovery. All pass after updating three
obsolete test expectations or narrow-drawer steps to match the intentional UI.

Refinement 64 adds a direct-manipulation world editor to the instructor
challenge-creation page. Instructors can add, select, move, and resize arena
walls, blocks, start and finish lines or areas, waypoints, and visual markers;
they can also set arena bounds, initial XRP position and heading, route order,
grid snap, named worlds, and the default world. The editor changes the same
`world.json` source used by project Python, the simulator, the Monitor, and
exports. The exact JSON remains available in a collapsed advanced section.

Graphic edits retain unknown extension fields and untouched array order.
Invalid JSON remains unchanged until corrected, out-of-bounds geometry is
reported instead of cropped, and an initial robot-obstacle overlap is a
warning. The implementation is split between source/world orchestration, SVG
geometry and pointer interaction, object/property inspection, and JSON-
preserving model operations. It adds no graphics dependency.

Validation includes 225 Python tests, 358 TypeScript tests, MicroPython proof,
the production and 252-file offline builds, 17 focused model/specification
tests after the component split, all seven instructor-authoring browser
workflows, narrow 375-pixel layout, offline update/reload, and a generated
Waypoint Slalom virtual run and export. The broad Stable Chrome run passed 99
workflows and skipped the opt-in hardware test; its two failures were obsolete
narrow-layout test steps that tried to use the automatically collapsed Project
rail without first opening it. Those test steps are corrected in the following
integration slice.

Refinement 63 replaces the passive seven-file Python example set with four
ordered, active tutorial projects: Python essentials, drawing with the Virtual
XRP, sampled UCSBXRP robot programs, and behavior with telemetry. Each project
has one stable `main.py`, a rendered README, a short `student_work.py`, and one
`exercise_checks.py`. Unfinished functions remain valid Python through explicit
`NotImplementedError` placeholders; no completed student solution is shipped.
The checks report **PASS**, **NOT COMPLETED**, or **INCORRECT** without starting
either robot. Tutorial projects open their README first while Run continues to
use `main.py`, and the Project panel exposes the literal **Check exercises**
action rather than a duplicate component-check proxy.

The motion tutorials use the normal `Robot.start()`, `Robot.step()`, and
`Robot.stop()` structure and do not add another delay to the sampled loop. They
connect Python classes, modules, exceptions, bounded loops, finite-state
behavior, live numbers/choice/toggle, watch values, and student plot signals to
visible Virtual-XRP behavior. The drawing path remains the measured robot path;
it is not replaced by a separate decorative pen state.

The tutorial slice passes 19 focused Python tests, eight target/catalog tests,
the MicroPython proof, the production/offline build, and representative
completed implementations for every checker. Its full pre-integration
course-starter suite passed 17 browser workflows. The final IDE integration
passes a Stable Chrome workflow against the current source that opens,
validates, and checks all four tutorials in sequence, verifies their rendered
instructions and unfinished outcomes, and confirms no virtual motor effort or
pose change.

The project-world schema also now accepts display-only finish lines, finish
areas, and general markers while preserving legacy files, unknown extension
fields, obstacle physics, and ordered Python waypoints. Monitor and WebM export
share the same marker and label semantics. A shared all-geometry fixture is
validated in TypeScript and Python; the focused stage passed 46 Python tests,
26 TypeScript tests, MicroPython parity, type checking, the production build,
and the offline shell. The interactive SVG authoring surface is the next world
stage.

Refinement 62 closes two first-use workspace defects. When a Projects folder is
remembered, **Open project** now presents its valid direct-child UCSBXRP
projects inside the IDE instead of immediately reopening a system folder
picker. The student can still choose **Open project folder elsewhere…** when
the desired project is outside that parent. Open, New, Save as project, and
Reconnect are grouped as project actions; New file and Add files remain file
actions. The dialog states that the selected folder has read-write access and
that edits save automatically. Existing project boundaries, browser-draft
recovery, active-project ownership, and autosave behavior are unchanged.

The responsive Project rail now handles both directions of a live resize. It
closes when an already-open IDE becomes narrow and returns when that same
window becomes wide again. The regression exercises 1180 to 850 to 1320 pixels
without reloading, verifies exact viewport bounds at every size, and verifies
the Monaco editor itself expands in width and height. This corrects the state
transition that a static wide or narrow screenshot could not expose.

The project workflow passes 59 focused unit tests, 15 focused Stable Chrome
workflows, the complete virtual multi-file workflow, type checking, formatting,
and a production build. The added same-page resize regression passes against
the current source application. `docs/CURRENT_PRODUCT_OUTCOMES.md` is now the
concise live record of implemented evidence and material remaining work;
detailed history remains in the existing requirement and evidence documents.

Refinement 61 makes IDE and Monitor geometry adaptive in both directions and
adds a permission-free combined workspace at `/workspace/`. The standalone apps
now explicitly fill the browser viewport, the compact header wraps before its
status can clip commands, and the Project rail becomes a temporary overlay at
900 pixels so narrowing the window returns its width to the editor. The target
selector retains enough native-select width to show `Physical XRP` in full.
The contextual `Components API` text was removed from `course_setup.py`; direct
class reference links remain available in a neutral style where they identify
a specific API entry.

IDE and Monitor can now run in two same-origin panes in one tab, with a
keyboard- and pointer-adjustable divider, full-pane IDE and Monitor modes, and
automatic vertical stacking below 901 pixels. The embedded applications retain
the existing shared target and project authority, omit duplicated navigation,
and preserve folder access and cross-origin isolation. The split range keeps
both panes at least 320 pixels wide at the minimum side-by-side width. The new
route is part of the offline navigation shell.

Focused Stable Chrome validation passes 12 responsive, navigation, API, and
cross-pane workflows, including live 1180-to-850 expansion/contraction,
901-pixel separator extremes, Monitor-initiated Run and Stop, and narrow
stacking. Nine additional Monitor recording/export and complete offline-shell
workflows pass. No robot runtime or project file semantics changed in this
slice.

Refinement 60 simplifies the student project workflow without changing the
runtime or the physical XRP. The Project rail now separates project actions,
file actions, component checks, and challenge progression; reconnecting a
remembered Project folder is distinct from saving a browser draft. New projects
use one explicit template-and-folder dialog, and challenge progression carries
forward only the student modules declared by the course catalog. Status now
identifies the exact project that the next Run will use, including whether this
IDE or another IDE owns Run. Challenge projects open their rendered README
first, and all five challenge READMEs state the task, student work, supplied
files, program sequence, component checks, and available evidence directly.

The complete fast gate passes 224 Python tests, the MicroPython source, service,
and MPY proofs, 345 TypeScript tests, formatting, type checking, the production
build, and the 231-file offline-shell verification. The complete production
Stable Chrome suite passes 95 workflows on `127.0.0.1:4174`; the deliberately
opt-in physical case is the only skipped case. This stage therefore closes on a
known-good browser baseline before the next adaptive-layout change.

Refinement 59 makes both application shells follow the browser viewport rather
than their content. The IDE Project rail now scrolls as one body, the editor and
output tracks can shrink without clipping, and the compact two-row header starts
before the physical-error controls collide. The Monitor world view absorbs
unused height on tall narrow windows while each strip plot retains its fixed
height; an open Controls drawer closes when a wide window becomes narrow.

The production build passes 26 focused Stable Chrome workflows on the fixed
`127.0.0.1:4174` origin. They include `820×400`, `1440×350`, wide-to-narrow,
`700×1200`, phone-width, physical-error, navigation, recording, export, and
physical reconnect/Stop/Reset states. No project, robot-runtime, or telemetry
semantics changed in this slice.

Refinement 58 closes the fixed-origin production and attached-hardware
regression. The complete Stable Chrome suite passes 92 workflows on
`127.0.0.1:4174`; only the deliberately opt-in motor-hardware case is skipped
in that general run. It covers commissioning branches, project creation and
recovery, autosave and rotating copies, safe course updates, every challenge,
every tutorial lesson, both demos, instructor challenge generation, IDE and
Monitor ownership, recording and all export formats, offline reload, network
recovery, documentation links, and wide, narrow, and phone layouts.

The same physical case passes separately in 30.1 seconds against the attached
dev.36 XRP on Pink. It requires both encoder counts and both derived wheel
distances to change from within-run baselines, populated ultrasound,
motor-supply, and IMU-temperature telemetry, a published world pose and path,
more than five retained plot samples, cross-window Run and Stop, course Reset
without a controller reboot, post-Reset execution, final zero drive, ordered
exception-free logs, and asserted restoration of the Expanding spiral project.
Retained active-burst telemetry has a 20 ms median interval and a 40 ms maximum
interval, with encoder deltas `3168 / 2854` and wheel-distance deltas
`200.740 / 185.596 mm`. The structured record is
`docs/hardware/2026-08-27-dev36-final-physical-browser-validation.json`.

The production preview remains the only UCSBXRP server and is available at
`http://127.0.0.1:4174/`. Hotspot repetition and floor-motion calibration remain
separate empirical tasks; neither limits station-mode development on Pink or
the validated raised-wheel course workflow.

Refinement 57 makes the IDE's project model explicit without adding another
persistence layer. The Project panel now presents one current-project block:
project name, `./folder` or `Browser draft`, and its automatic-save state. The
separate Projects folder is identified only as the default parent for new
projects. **Open project**, **Save as project**, file actions, template creation,
and challenge progression are distinct operations. Continuing to the next
challenge resumes after the student chooses a Projects folder or saves the
current browser draft; a browser without folder access can continue between
browser drafts. Saving the current project no longer creates an identical
fallback draft that can detach the folder just created.

The Monitor now retains the newest 1,200 plot samples in a fixed ring and
publishes one ordered React snapshot per display frame. A physical telemetry
page can therefore contribute all of its samples without eight successive
array copies and renders. SVG, PNG, and WebM encoder code loads only when an
export is requested. Plot order, epoch changes, duplicate suppression, clearing,
late-Monitor history, recording, and all export formats retain their previous
behavior.

The complete fast gate passes 224 Python tests, the MicroPython source, service,
and MPY proofs, 345 TypeScript tests, formatting, type checking, the production
build, and the 231-file offline-shell verification. On the fixed
`127.0.0.1:4174` production origin, 24 combined project, autosave, offline,
recording, export, and late-history workflows passed. An adversarial review
then exposed and closed three untested project-dialog cases; 13 project workflow
cases and the complete multi-file workflow pass after correction. Direct
Chrome inspection at 1,440 and 820 pixels confirms zero page or header overflow,
an unclipped template selector, and no redundant untouched-project status row.

Release `2026.08-dev.36` is installed as runtime generation 17 on the attached
RP2350 at `192.168.7.25` on Pink. The strict service probe passed browser
preflight, compile, exact RAM-project preparation, stdout, pose telemetry,
cooperative Stop, three immediate prepare/run cycles on one boot, course Reset,
retained RAM project, and a post-Reset Run. The full physical browser and
raised-wheel motion regression follows this committed stage.

Refinement 56 removes dormant state and persistence layers without changing the
student workflow. The unused commissioning-era default-project writer, three
deprecated folder wrappers, an unconsumed workspace-change notification, an
unobservable same-document bootstrap event, the transitional
`TargetPreference` type name, and an unused single-endpoint helper are gone.
The active cross-tab bootstrap gate, legacy folder-handle migration reads,
RobotProfile v1 migration, verified station/hotspot routes, project conflict
detection, and SharedWorker ownership remain. The architecture audit now
describes the bounded verified commissioning handoff and the single canonical
project-folder writer rather than obsolete implementation paths.

The unchanged functional gate passes 224 Python tests, the MicroPython source,
service, and MPY proofs, 341 TypeScript tests, formatting, type checking, the
production build, and the 225-file offline-shell check. Four focused state and
target test files pass 80 cases. The removal reduces the affected code by 140
net lines and slightly reduces the shared folder and target-preference chunks;
no broad controller or event-hub refactor was attempted.

Refinement 55 replaces prose-shaped challenge metadata with explicit catalog
and specification data. The instructor authoring tool now carries each student
component's file, class, selection flag, and carry-forward status into generated
projects, and repository validation checks those declarations against the
Python source and `course_setup.py` rather than parsing README tables. The
working Waypoint Slalom specification exercises that path through generation,
virtual execution, telemetry, and export. Program flow is presented as an
ordered sequence instead of ASCII arrows.

All five challenge READMEs and the MicroPython tutorial now state the task,
student work, supplied code, program sequence, component checks, and measured
evidence in rendered student-facing Markdown. Component checks cover timestamp
use, encoder direction, regularized wheel speed, feedback response, curved
odometry, signed turns, angle wrapping, and realignment; every passing result
prints its numerical input, expected observation, and measured result. The
Projects-folder language is consistent across the IDE, Guide, README, and
system design. A project held only in browser storage is described directly as
not saved to a folder. Saving an unclassified project can no longer be
misidentified as progression to the next challenge.

Release `2026.08-dev.36` has a new deterministic course-library
identity (`1c49ee2614d9d90f0a7a5866f3eb7af394b0a10bc62736b5f05c8b3ccf2db925`)
rather than changing robot files under the dev.35 identity. Its installation
and strict service probe are recorded in Refinement 57 above.

The complete local gate passes 224 Python tests, the MicroPython 1.28 source,
service, and MPY proofs, 341 TypeScript tests, formatting, type checking, the
production build, and the 225-file offline-shell verification. A production
Stable Chrome run on the fixed `127.0.0.1:4174` origin passed 88 workflows and
skipped the opt-in physical test. Its sole failure was an obsolete project-
dialog/Guide locator; after updating the test and correcting the dialog edge
condition, the complete multi-file workflow passed in 5.3 seconds. Visual
inspection at normal and laptop-narrow widths covered the landing page, IDE,
rendered challenge README, Monitor, Guide, API reference, and instructor
authoring tool; one missing inline space in the Guide was corrected.

Refinement 54 removes two physical cross-application failures exposed by a
fresh raised-wheel stress run. The physical coordinator is now the sole
authority for which attached IDE supplies a project: the shared HTTP backend
can no longer overwrite that browser-local ownership state during connection.
The XRP also returns retained logs and 50 Hz course samples in bounded,
cursor-ordered telemetry pages. IDE or Monitor immediately drains another page
when one remains, while Run, Stop, Reset, and parameter commands wait behind at
most one bounded response rather than an entire retained backlog. Available
records remain ordered and terminal ready/error state is published only after
the final page; the uncapped `/api/v1/state` diagnostic response is unchanged.

Release `2026.08-dev.35` is installed as runtime generation 16 on the attached
RP2350 at `192.168.7.25` on Pink. Before the correction, retained telemetry took
up to about three seconds and a physical Stop arrived after the four-second test
program had already completed. With bounded pages, observed idle replies were
0.25–0.46 seconds. The complete Stable Chrome physical IDE/Monitor workflow
then passed twice consecutively (23.4 s and 24.9 s), including Monitor- and
IDE-initiated Run, cross-window Stop, edit transfer, fast course Reset without a
controller reboot, post-Reset Run, nonzero motor effort, encoder/wheel-distance
change, final zero effort, complete output ordering, and restoration of the
Expanding spiral project. Evidence is recorded in
`docs/hardware/2026-08-27-dev35-bounded-telemetry-physical-workflow.json`.

The hardware evidence changed the next dependency: commissioning and network
recovery stress now follows this transport correction. Holistic refactoring
and measured performance work remain after the full browser/robot suite is
stable; telemetry optimization will preserve its role as observation rather
than move control into the browser.

A second USB installation of the identical dev.35 release was also idempotent:
zero runtime files changed, generation 16 and the verified slot remained
active, the XRP restarted on Pink, and no student project survived that true
boot. The zero-output service probe initially revealed that its own harness
mistook the first bounded terminal telemetry page for the complete result. The
probe now carries log/sample cursors across runs and drains every terminal page.
It then passed preflight, exact RAM preparation, stdout, pose telemetry,
cooperative Stop, three immediate Prepare/Run cycles, course Reset, and
post-Reset Run on one boot. Evidence is recorded in
`docs/hardware/2026-08-27-dev35-idempotent-repair-and-probe.json`.

Refinement 53 gives Run one explicit project owner across IDE tabs. The first
connected IDE remains active; another IDE can edit and save independently but
cannot change the project used by IDE or Monitor Run until the student chooses
**Use this project**. Closing the owner leaves no implicit successor. Physical
Monitor Run then waits for an IDE project, while a Monitor-only virtual session
continues to run the immutable Expanding spiral default. No owner ID, project
copy, heartbeat, or lease is persisted.

The project-provider broker, physical coordinator, and virtual shared-session
tests pass 69 focused cases. A Stable Chrome three-window workflow passed
first-owner selection, ignored standby edits, immediate current-source Run,
explicit takeover, owner-tab closure, the Monitor-only virtual fallback, and
explicit reclaim by the remaining IDE. The production build and 223-file
offline shell also pass. Both target clients now release their SharedWorker
port on normal page exit; an unresponsive provider is discarded after its
bounded snapshot request rather than remaining a false authority.

Refinement 52 removes the obsolete flash-project fallback. Release
`2026.08-dev.34` starts every true controller boot with no runnable student
project; Run must validate and prepare the exact current browser project in
RAM. An older `/course_projects` copy can therefore neither appear as the
current project nor run after commissioning, repair, watchdog recovery, or a
power cycle. Course Reset remains the fast dev.33 operation: it retains the
current RAM project without rebooting.

The attached XRP runs dev.34 as runtime generation 15 at `192.168.7.25` on
Pink. USB installation changed only the service, runtime manifest, and
activation record, then verified `project: null` after the real restart. The
direct service probe passed exact preparation, stdout, pose telemetry,
cooperative Stop, three immediate Prepare/Run cycles, soft Reset, and
post-Reset Run on one boot. The complete raised-wheel Stable Chrome
IDE/Monitor workflow then passed twice consecutively, including cross-window
Run/Stop, exact edit transfer, encoder and wheel-distance changes, motor
effort, final zero effort, retained logs, and default-spiral cleanup. Evidence
is recorded in `docs/hardware/2026-08-27-dev34-boot-project-lifecycle.json`.

Refinement 51 separates course Reset from controller restart. Release
`2026.08-dev.33` cooperatively stops an active student program, clears its
telemetry and live-control state, retains the exact RAM project, and keeps the
RP2350 service and Wi-Fi association running. A controller restart is now only
the fallback for code that cannot stop cooperatively, or an explicit part of
USB setup/repair. The browser accepts both outcomes: the normal path waits for
the ready state without reconnecting, while the exceptional path has a measured
18-second identity-checked recovery window rather than an ordinary command
delay.

The attached XRP runs dev.33 as runtime generation 14 at `192.168.7.25` on
Pink. Stable Chrome completed the IDE/Monitor physical workflow with raised-
wheel motion, encoder and telemetry evidence, cross-window Run/Stop, Reset, and
immediate reuse of the same edited RAM project. Reset finished within the
three-second test bound, preserved both boot ID and project revision, and the
next Run started normally. The direct service probe independently passed
preflight, exact RAM preparation, stdout, pose telemetry, cooperative Stop,
three immediate Prepare/Run cycles, active-program Reset, and post-Reset Run on
one unchanged boot. Cleanup restored the Expanding spiral project in RAM.

Refinement 50 removes internal-flash writes from the normal physical edit-run
loop. Release `2026.08-dev.32` prepares the exact current project in one of two
alternating RAM-backed FAT volumes, activates it only after validation,
compilation, and complete file transfer, and reports the browser's content
revision with a boot-lifetime descriptor. Run prepares changed files
automatically. Reset clears the RAM copy, so the next Run loads the current
browser project again. Persistent course-runtime installation remains an
explicit USB setup/repair operation; the legacy HTTP sync endpoint rejects a
persistent write instead of risking RP2350 flash/core contention.

The attached XRP now runs dev.32 as runtime generation 13 at `192.168.7.25` on
Pink. On one dev.31 boot, 100 project preparations containing nested modules,
data, and `world.json` retained exact revisions without reboot, followed by 100
Prepare/Run/telemetry/Stop cycles on that same boot. A subsequent physical
browser test found that XRPLib's string-assembled PIO encoder reset could reach
MicroPython's recursion limit after an extended session. `XRPBot` now records a
wrap-safe software encoder zero instead of reprogramming active PIO state
machines. On dev.32, the raised-wheel motor check actuated both motors, observed
the expected encoder signs, and ended at zero drive. The complete Stable Chrome
IDE/Monitor physical workflow then passed twice consecutively, including
Monitor- and IDE-initiated Run, immediate project edits, retained output,
cross-tab Stop, motor effort, wheel distance, encoder telemetry, and zero final
drive. Multiline exceptions are now retained as complete bounded terminal
lines rather than truncating the traceback at 512 characters.

The local gate passes 212 Python tests, the MicroPython 1.28 source/service and
MPY proofs, 295 TypeScript tests, formatting, type checking, the production
build, and the 223-file offline verification. Sixteen focused Stable Chrome
commissioning, project, network-recovery, and repeated-workflow tests pass in
addition to the two attached-hardware passes. A full controller Reset was
observed to rejoin Pink just beyond the old eight-second harness deadline; its
browser recovery path and fresh post-reset project preparation remain in the
next commissioning/recovery slice rather than being counted as qualified here.

Refinement 49 closes the physical Flash-to-Run and project-folder failures
found by repeated use, and qualifies release `2026.08-dev.28` on the attached
RP2350. Flash, Run, and Stop now retry an interrupted HTTP reply with the same
request ID, which the XRP resolves from its retained reply cache without
repeating the operation. If both Flash replies are lost, the browser reads the
retained project manifest and continues only when its revision exactly matches
the requested project. Automatic Flash-and-Run holds telemetry polling across
both requests, and a matching manifest clears a stale browser state after an
interrupted reply. Active telemetry now renews the run lease in the same
request rather than opening a second HTTP exchange.

Opening a project now requires one valid root `.ucsb-xrp-project.json` and its
declared main file. Selecting the Working folder, a repository root, a malformed
project, or a directory containing nested project metadata is rejected before
traversal or autosave state changes, so sibling projects cannot be flattened
into one file list. Portable project limits are shared by Validate, Virtual
Run, and Physical Flash. External folder edits pause autosave and require an
explicit choice between the folder and the open IDE draft. The Guide and all
five challenge READMEs now describe challenge progression as creating a
separate next project rather than "starting" a challenge. This strict folder
boundary prevents data mixing; the broader human project/workspace model and
its controls remain scheduled for a design-and-usability audit rather than
being treated as settled by validation.

Release dev.28 is installed as runtime generation 9 on the XRP at
`192.168.7.25` on Pink. The attached-hardware Stable Chrome workflow passed
edit, Validate, Flash, automatic Flash-and-Run, immediate Stop, repeated Run,
shared IDE/Monitor state, motor actuation, encoder change, telemetry, and
restoration of the default Spiral project. The complete local gate passes 203
Python tests, MicroPython 1.28 source/service and MPY proofs, 290 TypeScript
tests, the production and 223-file offline builds, and 72 non-hardware Stable
Chrome workflows in 4.8 minutes. Those browser workflows include the five
challenges, all tutorial lessons, an instructor-generated Waypoint Slalom,
offline reload, recording/export, project-folder rejection, recovery, narrow
layouts, and network-mode cycles. `/monitor/` is the canonical Monitor route;
the former `/dashboard/` remains only as a compatibility redirect. The
physical SharedWorker name advanced with the release so a fresh app cannot
reuse the prior worker implementation.

Refinement 48 resolves the browser state-authority failures found by repeated
first-use, cross-tab, and update testing. A versioned RobotProfile now retains
one commissioned robot identity, separate station and hotspot routes, and the
last verified network observation. A verified station connection refreshes a
stale DHCP route; a hotspot fallback cannot overwrite it. Both direct and
SharedWorker paths reject a different or identity-less XRP before publishing a
ready state. The redundant SharedWorker command deadlines have been removed,
so the direct target's bounded request and reset-recovery transitions are the
only clocks around a physical operation.

ProjectSession now gives each project a stable identity plus monotonic revision
and saved-revision metadata. IDE startup resolves the remembered folder before
displaying or staging a project, and an explicit cross-tab bootstrap signal
keeps Monitor Run disabled until that reconciled revision reaches the shared
target. Edits, file operations, project creation, manual save, autosave, folder
switches, and a pending PWA update all use the same revision identity. An
update waits for active target operations and an exact folder save rather than
reloading through student work. The attached robot has not yet been changed;
it remains on the physically qualified dev.25 runtime while the coherent source
and commissioning bundle are now `2026.08-dev.26`.

The adversarial setup pass also prevents invalid station credentials from
entering installation, stops probing after identity/version rejection, and
stores no RobotProfile until USB and Wi-Fi identify the same controller. Active
course and API documents now match the public package, Challenge 4 accepts any
valid connected free-cell route, and device stdout is bounded to 512-character
records so a missing newline cannot consume RP2350 memory. Under Node 24, 200
Python tests, the MicroPython 1.28 source/service and MPY checks, 272 TypeScript
tests, the production/offline build, and all 70 non-hardware Stable Chrome
workflows pass. The browser gate includes repeated Run/Stop and reload, delayed
folder restoration, wrong-robot rejection, network cycles, commissioning
repair/retry, offline reopen, all challenges/tutorials, recording/export, and
narrow layouts. The next stage is the dev.26 USB install and repeated physical
station-mode qualification.

Refinement 47 makes installation atomic at the course-release boundary and
removes the RP2350 flash/run conflict found by repeated physical use. Release
`2026.08-dev.25` installs the complete course runtime into alternating `a` and
`b` slots, verifies every staged file and the release manifest, and changes a
small redundant activation record only after verification. Boot confirms a
new slot only after successful import and retains the previous confirmed slot
for automatic rollback. Browser and command-line installers now use the same
compatibility fields, release sequence, file map, and manifest digest.

Repeated project transfer exposed a separate RP2350 constraint: writing
internal flash while a second-core MicroPython interpreter remained alive
could reboot the controller. Flash now requests and observes program-worker
retirement before writing. The worker is started only after the subsequent Run
reply has left the HTTP service, and it clears its own lifecycle flag on every
exit. This replaces guessed pauses with explicit state transitions and keeps
ordinary Flash, Run, Stop, and telemetry on one boot.

On the attached RP2350 at `192.168.7.25`, one unchanged dev.25 boot passed the
service probe with three immediate flash/run cycles, stdout, pose telemetry,
and cooperative Stop; the raised-wheel motor check independently actuated each
wheel and both together, observed encoder changes, and ended at zero effort;
and the Stable Chrome physical workflow passed shared IDE/Monitor flash,
automatic validate/flash/run, cross-window Run/Stop, motion telemetry, and
ordered logs. A full controller Reset still takes approximately eight seconds
or slightly longer to reassociate with Pink. That latency remains a measured
reset-path limitation, not an ordinary project-command delay. Evidence is in
`docs/hardware/2026-08-26-dev25-transaction-and-runtime.json`.

Refinement 46 restores one coherent release and closes two failures found only
by repeating the full attached-robot workflow. A production service worker had
served a dev.16 commissioning manifest to a dev.22 page; the wizard then
correctly installed the internally consistent but obsolete dev.16 bundle. The
development server now generates and serves the current commissioning bundle,
development startup removes old course workers and caches, release metadata is
network-first, the page and manifest must match before USB writes, and every
changed asset is fetched and hash-verified before mutation. The page, manifest,
and XRP now all report `2026.08-dev.22`.

Repeated USB setup exposed a second non-timing abstraction error. A burst of
interrupts could land in an XRPLib IMU callback instead of stopping `main.py`;
the wizard then waited through two ten-second command deadlines and incorrectly
claimed that firmware was missing. USB entry now sends one interrupt at a time
and waits for MicroPython's friendly prompt before entering raw REPL. From a
fully running course service, controller, firmware, and network verification
completed in 713 ms. A failed entry closes immediately and offers a retry
without diagnosing firmware that was never inspected.

The browser and XRP also used different filename ordering for project hashes:
`localeCompare` could order `README.md` differently from MicroPython. The
shared revision now uses explicit code-point ordering. After the correction,
the IDE retained **flashed** state across reload and repeated commissioning.
The attached XRP ran the Spiral project, changed to the Obstacle-turn demo,
automatically validated/flashed/ran it, and ran the retained demo again after
same-release repair. The final run changed encoder counts on both wheels,
reached heading `1.798 rad`, and ended with zero effort and zero wheel speed.
The complete 214 TypeScript and 181 Python tests, MicroPython proof,
production/offline build, TypeScript typecheck, and all 66 non-hardware Stable
Chrome workflows pass.
Structured evidence is in
`docs/hardware/2026-08-26-dev22-release-and-repeatability.json`.

Refinement 45 makes the visible IDE project the project that Monitor actually
runs. Opening, creating, or editing a project now stages its complete snapshot
in the shared target without treating it as validated or flashed. Monitor Run
validates that staged snapshot and, for a physical XRP, flashes it if required.
A reproduced Spiral-to-tutorial race now starts **MicroPython foundations** and
never the earlier Spiral. Project changes also add named separators to retained
Program output and the System log so earlier messages remain useful without
appearing to belong to the newly opened project.

Challenge progression is now explicit and lossless. Each challenge records its
predecessor and reusable student modules. **Start next challenge** first
requires the current challenge to have its own project folder, shows the new
folder and carried files, creates a separate self-contained project, preserves
the earlier folder, and copies only the declared reusable modules. A component
is selected in the next challenge only when it was already selected in the
preceding project; unfinished work remains present but continues to use the
supplied implementation. The project rail adds non-overwriting text-file
import, a compact active-file menu, clearer temporary-copy/storage language,
and visible operation feedback. Eighty-nine focused target/IDE tests, the
production/offline build, and four Stable Chrome project-workflow tests pass.

Refinement 44 closes the physical command-path regression with observable
hardware evidence. Release `2026.08-dev.22` keeps project execution on the
RP2350's second core, mirrors encoder and motor state into the service
telemetry stream, retains a bounded sample history, and avoids simultaneous
XRPLib hardware reads from the service and student program. Physical endpoint
discovery now tries the retained address, `ucsb-xrp.local`, and the hotspot
address; the address reported by the XRP becomes authoritative for both IDE and
Monitor. Discovery uses its own short timeout, while Flash, Run, and Stop retain
an ordinary command timeout.

The remaining intermittent Stop failure came from aborting an in-flight
telemetry response immediately before opening the command request. The client
now lets that response finish and only aborts it after a bounded fallback
interval, so the single-connection MicroPython service is not left writing to a
closed socket. On the attached XRP at `192.168.7.25`, the Stable Chrome hardware
workflow flashed the default project, started it from both IDE and Monitor,
observed motor motion, encoder-distance change, and live telemetry, stopped it
from both applications, confirmed zero final motor effort, and repeated the run
without a controller restart. The focused 41-test target suite and the complete
22.2-second attached-hardware browser workflow pass. The robot remains on Pink
with the default Expanding Spiral project restored.

Refinement 43 removes the remaining intermittent physical-run failure rather
than treating one successful run as sufficient evidence. The RP2350 HTTP
library had appended every telemetry request to flash; the installed log had
already reached 11,216 bytes. Release `2026.08-dev.20` disables that request
log, feeds the hardware watchdog during project writes, returns a correlated
Stop reply before requesting cooperative program termination, and keeps command
polling and run leases serialized. After USB installation and exact file
readback, one unchanged boot completed 200 telemetry requests, ten transactional
project flashes, ten no-motion Run/Stop cycles, and two bounded motor runs. Both
motor runs ended at zero command; measured wheel distance and encoder changes
confirmed physical motion, and the request-log file did not grow by one byte.

The browser suite now rejects stale project folders retained under a different
course folder, reports failed Stop and Reset operations in the System log, and
releases failed Web Serial sessions promptly. Narrow landing, setup, IDE,
Monitor, world, signal-plot, and API layouts were inspected and corrected. The
physical browser harness is now opt-in, uses a test-owned zero-output project,
requires a separate raised-wheel motion gate, limits its motion program to four
seconds, verifies shared IDE/Monitor state and ordered logs, and restores the
default spiral in an unconditional cleanup. The non-hardware gate currently
passes 162 Python tests, 188 TypeScript tests, MicroPython 1.28 source/service
checks, the 214-file offline build, and 24 focused Stable Chrome workflows. The
last browser-to-robot proof awaits one manual macOS Wi-Fi selection because the
operating system rejects command-line switching to the saved XRP hotspot.

Refinement 42 repairs the complete first-use and repeated-run workflow exposed
by the campus hotspot trial. The setup wizard now distinguishes the course
folder from a project folder, detaches stale project handles when the course
folder changes, recognizes a previously authorized RP2350 for explicit
confirmation, removes duplicate hotspot choices, exposes installation stages,
and presents the computer Wi-Fi handoff before probing the robot. A normal
`./Expanding-Spiral` project is created in the selected course folder. All
student applications now share one compact Home/IDE/Monitor/Guide/Set up or
Repair/API navigation bar; narrow layouts wrap instead of clipping. Installing
the PWA is explicitly optional and separate from storing project files.

IDE and Monitor now use one serialized physical-target coordinator and one
virtual-target session. Run state, project identity, world, telemetry, live
controls, and a timestamped 2,000-event target history are shared across tabs.
The complete terminal remains in the IDE; Monitor no longer duplicates partial
logs. Device-side stream capture includes output from imported project modules.
Run can be repeated after completion or an exception, command/poll races are
removed, and one tab can restore both applications after a network handoff.

The first attached-RP2350 pass installed and read-verified release dev.16, then
proved initial shared IDE/Monitor Run and Stop. A second Run reproduced a real
timing defect: the former 2.6-second run lease could expire before the first
telemetry exchange completed. Release `2026.08-dev.17` gives startup a
10-second initial lease, uses a 6-second steady lease, never shortens the
startup grace on an early renewal, and treats one missed poll as a recoverable
interruption. All 152 Python tests, 174 TypeScript tests, MicroPython 1.28
source/service checks, type checking, and formatting pass. Dev.17 still needs
one USB wizard update and the repeated hotspot Run/Stop path before deployment.

Refinement 41 removes a misleading physical-target state exposed during a
campus hotspot trial. The saved USB setup log proves that release dev.15 was
verified, the XRP restarted as `UCSB-XRP-9EDE` at `192.168.4.1`, and Chrome
reached it. A fresh radio scan found that hotspot, and a bounded direct probe
joined it, received `192.168.4.16`, and successfully started the installed
project; the target reported `running` with physical telemetry. The robot is
therefore commissioned correctly and its Run service works.

The IDE and Monitor had nevertheless left physical commands enabled after a
connection error and could retain a visually stale **flashed** label. Physical
Validate, Flash, Run, and Reset now remain disabled until the Wi-Fi service is
actually reachable, the project state reads **connection required**, and an
explicit Retry action reconnects without reloading either app. The error text
states that Run and telemetry use Wi-Fi rather than USB and that the cached app
does not require internet on the robot hotspot. The new-project selector now
starts at **Choose template…** with Create disabled, so its former default
**Expanding spiral** value cannot be mistaken for the open project. The focused
physical-target test, all 157 TypeScript tests, type checking, formatting,
production and offline builds, and a Stable Chrome disconnect/retry workflow
pass. One direct diagnostic Stop request did not return before its eight-second
client timeout after a large telemetry response; the seven-second run watchdog
still stops and resets the robot, but hotspot Stop should be repeated through
the browser before classifying that observation as a service defect.

Refinement 40 closes a first-visit production race found by the independent
post-deployment Chrome probe. GitHub Pages cannot attach the isolation headers
needed by shared live-control memory until the generated service worker has
installed and performed its single automatic refresh. IDE and Monitor now hold
Virtual Run during that brief preparation and state exactly why; Physical Run
is unaffected. If isolation is unexpectedly absent inside a virtual worker,
declared live parameters retain their defaults instead of terminating the
program, and Stop remains available. Cross-tab live adjustments still travel
through the shared worker to the client that owns the run buffer. Two new
Stable Chrome workflows exercise the preparation gate and the safe-default
fallback. The preparation test uses separate IDE and Monitor tabs so the
browser's intentional refresh is part of the test rather than a race with a
second navigation; it passed 10 consecutive CI-mode repetitions. All 151
Python and 156 TypeScript tests pass; the 44 unaffected
non-hardware Chrome workflows passed in the complete run, and the corrected
live-control path plus both new isolation workflows passed together afterward.
The obstacle-demo harness now verifies its false-to-true toggle before that
value can select the mission branch; the complete mission then passed five
consecutive CI-mode repetitions. The production build and 212-file offline
shell pass. The attached XRP release remains `2026.08-dev.15` because no robot
file changed.

Refinement 39 closes the final deployment-gate failures without weakening the
functional checks. Plot notes now attach their time and pose to the same nearest
retained telemetry sample, so a note placed early in a run remains present in
SVG, PNG, and replay exports even when a slower browser advances the visible
time window before export. The world-selector alignment check now allows a
four-pixel font-metric variation after GitHub's Linux Chrome reported a harmless
3.5-pixel offset. The two affected workflows passed 10 consecutive CI-mode
repetitions and then passed again inside the complete gate. All 151 Python
tests, 155 TypeScript tests, 43 non-hardware Chrome tests, MicroPython parsing,
the production bundle, and the 212-file offline shell pass. The attached XRP
release remains `2026.08-dev.15`; this browser-only correction does not change
the installed robot files.

Refinement 38 closes the complete local and attached-RP2350 validation pass for
release `2026.08-dev.15`. A real reset exposed one service expression accepted
by CPython but rejected by MicroPython 1.28.0. The expression now uses ordinary
list append, and the required MicroPython gate parses the installed service as
well as the course library. After repair, the Mac joined the robot hotspot,
received `192.168.4.16`, and reached the version-matched service at
`192.168.4.1`. The robot then returned to Pink at `192.168.7.42`; a fresh reset
returned the station service in 17 seconds. The client now retains a 30-second
automatic reconnect window for ordinary DHCP variation.

The physical expanding spiral completed with one stable boot ID, ordered
telemetry batches through sequence 91, ultrasound stopping, retained program
output, and zero final drive commands and wheel speeds. The attached-hardware
Chrome path passed Flash, Monitor Run, Stop/reconnect, stale-project detection,
re-Flash, IDE Run, a second Stop/reconnect, and cross-tab zero-output
confirmation. This path also exposed a redundant second validation after a
successful physical Flash; Flash now marks the exact revision validated before
Run. All 151 Python tests, 154 TypeScript tests, 43 non-hardware Chrome tests,
the attached-hardware Chrome test, MicroPython source/service parsing, the
production bundle, and the 212-file offline shell pass. The robot is back on
Pink with the default **Expanding spiral** project and zero motor output.

Refinement 37 corrects the physical hotspot subnet. Releases through dev.11
configured the robot at `192.168.42.1`, but the RP2350 CYW43 firmware continued
to lease client addresses on `192.168.4.x`; a laptop could therefore join the
XRP hotspot without being able to route to the robot. Dev.12 uses the native
`192.168.4.1` service address and transparently migrates the known old profile
during repair. On the attached RP2350, macOS joined `UCSB-XRP-9EDE`, received
`192.168.4.16`, reached the version-matched HTTP service, and polled physical
telemetry before returning to Pink. The browser commissioning and complete
physical project lifecycle remain the next validation in this slice.

Refinement 35 closes two integration gaps exposed by the complete browser
suite. The expanding-spiral project now includes its own **Obstacle ahead**
world, so its ultrasound-stop behavior no longer depends on a world belonging
to another challenge. A virtual Run preserves the selected world while the
project's `world.json` is unchanged and selects the declared default only when
that world file changes. Changing worlds no longer clears retained System-log
history. The corresponding harness now selects **World configuration** and
checks the current API structure rather than requiring removed UI labels or the
rejected `Maintains / Used by` headings. All 51 target-package tests and the
focused spiral, Challenge 5, multi-file, and offline Chrome workflows pass.

Refinement 34 completes the active-document terminology pass. The course
context and instructor/student summary now use **Wheeled Robotics**, **course
folder**, **challenge project**, concrete component responsibilities, and
plain descriptions of repeatable simulator inputs. Challenge READMEs replace
`owns` and `inverse kinematics` shorthand with the specific work performed by
each supplied or student class. The remaining-hardware note now distinguishes
the dev.7 release last installed on the physical XRP from the current dev.11
bundle that still requires one wizard update and physical repetition.

Refinement 33 corrects the newly visible encoder-quantization ripple at its
source. The Monitor had begun plotting the course `SensorModel` estimate used
by the wheel controller rather than a simulator-only smooth value, which made
the integer-count derivative visible. The supplied implementation now estimates
speed from a short trailing fit of cumulative wheel position versus time and
then applies the configured time-based response filter. Exact signed wheel
increments remain unchanged for odometry. A quantized 90 mm/s regression test
requires the settled estimate to retain its mean while reducing peak-to-peak
ripple below 4 mm/s; direct Chrome simulation shows the measured traces tracking
the targets without the former jagged steps.

The same slice makes the Monitor's telemetry column fit without horizontal
clipping, renders plot legends at the display pixel ratio with a consistent UI
font, and replaces the final setup-wizard uses of **workspace** with **course
folder**. The coordinated course and service release is `2026.08-dev.15`.
All 135 Python tests, 140 TypeScript tests, MicroPython source/bytecode parity,
the production build, commissioning bundle, and 208-file offline shell pass.

Refinement 32 replaces the provisional API matrix with conventional
student-facing reference documentation. Each student component now has a
literal purpose, source file and base class, state retained between calls,
constructor, properties, and method entries with parameters, types, units,
return values, exceptions, and required behavior. Data records, Robot, live
controls and student-defined plots, project worlds, maps, configuration,
supplied mission services, XRPBot, and numerical functions are documented in
the same page. IDE context links now open the applicable entry for main.py,
student modules, configuration, challenge services, and world.json. The source
base-class descriptions and standalone USER_REFERENCE.md use the same plain
language.

The Guide now distinguishes challenge.py task conditions from project-owned
world.json geometry, and its offline section states the complete PWA boundary:
one complete online load, same Chrome profile, no Node server, optional launcher,
browser-storage clearing or eviction, project-folder independence, and the
network still required to reach a physical XRP. The API and Guide code type is
smaller than body text. TypeScript, Python compilation, release identity,
production build, commissioning bundle, and 208-file offline shell all pass.

Refinement 31 adds a bounded instructor challenge-authoring path. The IDE
catalog now reads one data file instead of hard-coded TypeScript metadata.
`scripts/challenge_authoring.py` creates a new challenge from the closest
working project as an unpublished draft, marks mission/world/documentation
decisions that require instructor judgment, validates the complete Python,
world, and README structure, and publishes the entry only after those tasks are
resolved. Drafts cannot appear in the student IDE. The concise instructor guide
defines the authoring order and required virtual/component evidence. Three
authoring tests include a temporary draft and prove that an unresolved draft
cannot be published; all 134 Python tests, 140 TypeScript tests, and the full
production/offline build pass.

Refinement 30 makes the world part of each project. Every challenge, demo, and
tutorial contains a readable `world.json` with millimeter bounds, initial pose,
obstacles, and visual markers. The same validated file now configures the
virtual plant, the Monitor grid, and WebM replay; changing its named world in
the Monitor resets the virtual XRP to that world's initial pose. Challenge 4
loads its arena, start pose, and destination from `world.json`; Challenge 5
loads the same arena and named destination while retaining its observed gate as
a map feature. The physical service stores the world definition with the
flashed-project manifest, so a newly opened Monitor can recover it without the
IDE tab. A new `ProjectWorld`/`load_world()` API provides the MicroPython side
without executable drawing code. Chrome ran the default spiral through the new
project-directory runtime path, and the coordinated course/service release is
`2026.08-dev.10`. The complete Python, MicroPython, TypeScript, unit-build, and
commissioning/offline build checks pass.

Refinement 29 adds analysis signals without introducing print-based logging.
`SensorModel` now publishes signed left/right wheel distance alongside its
regularized wheel speed. Students may publish up to 16 finite numerical values
with `live.plot(name, value, unit, label)`; each appears as an unchecked green
signal choice, follows the normal telemetry stream on virtual and physical
targets, and is included in plot export and recorded CSV. The default spiral
publishes travel and yaw rate as working examples. Numeric live controls now
snap ordinary in-range values to their declared slider step instead of rejecting
floating-point representations or ranges whose endpoint is between steps.
Challenge 5 has a separate ultrasound-estimation check, and every challenge
wrapper now names the exact IDE action, output location, and an example result.
That slice introduced coordinated release `2026.08-dev.9`.

Refinement 28 removes two sources of course-document drift. Challenge READMEs
describe each task through the named values in `challenge.py` instead of copying
their current numerical values into prose. Each visible `component_checks.py`
is now a 24–33-line selector with instructions, one concrete use example, and
the meanings of PASS, PENDING, and FAIL. The detailed fixtures and assertions
live once in the supplied `ucsb_xrp.component_checks` module. Its wheel-control
check verifies returned type, direction, command bound, and exact zero for a
zero target without requiring the supplied controller formula. All five
student wrappers execute with the expected cumulative PENDING count; 26 focused
Python tests, three catalog tests, release verification, commissioning-bundle
verification, and MicroPython 1.28 source/bytecode parity pass. The dev.8 course
source manifest now contains 14 canonical files.

Refinement 27 gives storage and navigation terms one student-visible meaning.
The parent directory is always the **course folder**; each runnable body of work
is a named **project folder**; and an unsaved project has a **recovery copy in
Chrome**. The IDE, setup wizard, offline status, Guide, tooltips, and browser
tests use those terms consistently. Guide section names are now literal topics
rather than conversational instructions, and the Guide lists the five
challenges, two demos, and tutorial explicitly. Its inline code is smaller than
the surrounding prose rather than visually dominating it. Direct Chrome checks
found no remaining visible `workspace`, `browser only`, `starter`, or
`deterministic` wording and no horizontal overflow at 864 × 996.

Refinement 26 makes every challenge folder self-explanatory. Each README now
states the challenge objective, enumerates the student-owned classes and their
responsibilities, distinguishes supplied files and services, shows the closed
command/measurement flow, and gives the sequence for isolated component checks,
virtual execution, and physical execution. A source-level regression test
requires this structure and the correct cumulative set of student files for all
five challenges.

Refinement 25 adds a complete student-facing documentation path. The Guide now
names every challenge, demo, and tutorial; defines the course-folder/project
relationship; distinguishes Validate from Test components; gives the physical
USB/Wi-Fi sequence; explains Monitor evidence and exports; and states exactly
what the Chrome-saved PWA can and cannot do without internet. Its project
diagram shows a closed command/measurement loop rather than an unrelated row of
boxes. A separately navigable, offline `UCSB XRP API` page documents each
student component's ownership, inputs, maintained state, output, consumers, and
methods, then covers records, Robot, live values, maps, configuration, low-level
XRP access, and utilities. IDE tabs link directly to the relevant entry. Stable
Chrome inspections at 864 × 996 covered the landing page, Guide flow/offline
sections, API summary, and detailed SensorModel entry without horizontal
overflow; the six focused offline/commissioning Chrome workflows pass,
including offline API navigation and the 375 px landing layout.

Refinement 24 moves encoder quantization handling into the measurement
component that owns it. The supplied `SensorModel` keeps exact wheel position
and distance increments while maintaining a time-aware, constant-memory
wheel-speed estimate. The wheel controller, live telemetry, plot, and CSV now
receive that same estimate; the Monitor no longer applies a second
presentation-only mean. `RobotConfig.wheel_speed_filter_time_constant_ms`
defaults to 80 ms and may be set to zero for an unregularized diagnostic.
Component checks require attenuation and response without prescribing the
exact internal filtering formula. The canonical source, deterministic
MicroPython bytecode, service, commissioning manifest, and development release
have advanced together to `2026.08-dev.8`.

Refinement 23 makes the Monitor's evidence and layout literal. Validation,
project preparation, program startup, runtime readiness, completion, reset,
stop, and physical reconnect actions now populate the persistent System log.
The wheel-speed plot compares requested values with the wheel-speed estimate
published by `SensorModel`. The simulator-only odometry comparison is named as a
virtual check, explains that ground truth is unavailable to robot code, and is
off by default. **Clear plots** discards visible history without stopping new
samples.

Live controls now occupy the top of the Live telemetry column instead of the
display/recording sidebar. World, scene, and zoom share a compact toolbar above
the grid. Main regions use one visible single-pixel divider without inset
outlines; selection controls and Run use neutral black rather than decorative
blue. The product wordmarks read `UCSBXRP | IDE` and `UCSBXRP | Monitor`.
`/monitor/` is now the canonical address; `/dashboard/` remains a compatibility
redirect.

Refinement 22 corrects the student-facing evidence and storage model. Challenge
projects now include their README plus one hardware-free
`component_checks.py`; **Test components** runs it in isolated MicroPython and
reports PASS, PENDING, or FAIL without changing the selected target. It is an
advisory debugging tool, not a prerequisite or gate. Virtual telemetry keeps
simulator ground truth separate from student odometry, carries requested body
motion and target wheel speeds through the same course loop, and plots target
versus measured wheel speed plus odometry position error. Physical telemetry
labels its published pose as the student odometry estimate and does not invent
ground truth. Existing flat pose fields and CSV columns remain compatible; the
explicit evidence fields are appended.

Refinement 21 replaces the Monitor's ambiguous export cluster with one
stateful Start/Stop recording control and a literal **Export** section. CSV,
SVG, PNG, and WebM actions name their result; a disabled replay explains what
is missing. A replay is rendered from retained telemetry rather than
transcoded or resimulated. Students may export explicitly after recording or
select **Export world replay after Stop**. Exports write to `exports/` inside
the connected project folder, use a browser Save As dialog when no folder is
connected, and fall back to the ordinary download facility only where that
dialog is unavailable. Plot notes are placed at a chosen time by right-click,
with plot focus plus N as the keyboard path.

The IDE and Monitor now separate **Program output** from a persistent **System
log**. Principal editor/world/telemetry/plot/output boundaries use a dedicated
dark one-pixel hierarchy; internal rows retain light one-pixel rules. At
phone width, headers wrap into two visible rows rather than hiding commands in
an unmarked horizontal scroller. The Monitor's narrow control sheet groups
Signals in one column and Recording/Export in the other; Live controls remain
with telemetry.
IDE storage is presented as one state—browser only, reconnect needed, or saved
automatically in `./<project>`—instead of repeated workspace/project/browser
headings.

The course release is also installable as a small PWA. After one complete
online load, the app shells, virtual XRP, Guide, and course release can reopen
from Chrome storage without Node or internet; project files remain in the
workspace or browser recovery. The optional install action adds a launcher and
standalone window but uses the same browser-owned storage. Clearing or evicting
site data removes the saved app, not native project folders. The visible state
now says, for example, **IDE saved in Chrome**. The Guide is task-first and
contains the literal course assembly, actuation, sensing, and navigation data
flow instead of framework and deployment internals.

Refinement 19 makes local storage correspond to the student mental model. A
**workspace** is the chosen parent folder; every project has one named child
folder shown as `./<name>` above the file list. With a workspace connected,
creating a template asks for that child-folder name, writes it immediately, and
activates automatic source, program-output, and telemetry saving there. The
workspace and active project handles are remembered independently and legacy
single-folder handles migrate according to UCSBXRP project metadata. File
actions now say Rename file, Duplicate file, Make main, and Delete file; the
project action says Open project.

After first-time commissioning, the untouched default starter is created as
`./Expanding-Spiral` inside the selected workspace and opened automatically.
Existing UCSBXRP project folders are reopened; unrelated folders are never
overwritten. The Monitor labels its right panel **Live telemetry**, keeps the
world selector beside the World heading, identifies the green path and ochre
ultrasound ray with a compact legend, and groups USER button, motor supply, IMU
temperature, and encoder counts after the primary motion telemetry.

The Monitor also exports every selected strip plot as one editable SVG or
high-resolution PNG. A stopped telemetry recording can be replayed into a
960×720 WebM world animation without disturbing the live target. Compact notes
mark one telemetry time and pose across the world and all plots, can be hidden
globally, and are included in monitored-run metadata. Plot and media generation
remain browser-local and introduce no new runtime dependency. Frame generation
waits for the browser encoder's start event; five repeated real WebM downloads
close the start-up race found under a loaded Stable Chrome run.

The IDE bottom panel now separates **Program output** from validation and
target-service **System log**, while retaining concise Status. The Monitor removes
its duplicate Guide/footer row and redundant Recorder-ready heading; the IDE
also removes its dedicated footer row. Readiness now says **IDE saved in
Chrome**, **Monitor saved in Chrome**, or **Setup saved in Chrome**, with a
precise explanation that Chrome stores the complete web release in browser
storage, separately from project folders and without a Node server.

Commissioning remains USB-first. USB inspects, repairs, installs, and selects
the robot network; normal physical Run, Monitor, and telemetry use that local
Wi-Fi service afterward. A workspace is optional during the wizard. The
handoff remembers it without importing its contents, preventing unrelated
Python files from replacing the current project. GitHub Desktop remains the
recommended credential-free version-control path using the active project
folder; the static site does not request or store GitHub credentials.

The seven delivery slices in `IMPLEMENTATION_PLAN.md` form one usable course
development release: five cumulative starters, a canonical MicroPython
library, revisable supplied implementations, a deterministic virtual XRP, a
browser IDE, an XRP Monitor, complete offline web tools, and an on-robot RP2350
LAN service. The same project files and target commands cross the browser,
simulator, and physical-controller boundaries.

Refinement 14 removes instructor commissioning from the normal student path.
The landing page and IDE Settings now open one browser wizard for a new,
outdated, or damaged XRP. It connects a project folder, waits for the verified
offline release, selects the exact RP2350 XRP over Web Serial, enters raw REPL,
checks controller/runtime versions, updates only content-changed files, hashes
all installed destinations, import-checks the runtime, prepares hotspot or
existing-Wi-Fi operation, resets the controller, and opens the IDE in physical
mode after an exact service reply. A repair keeps the working network by
default; a new robot defaults to its unique `UCSB-XRP-…` hotspot.

The same build carries the hash-pinned official MicroPython 1.28.0 RP2350 UF2.
An incompatible runtime branches to a guided bootloader-volume write and then
returns to the same inspection. The commissioning manifest is generated from
the command-line provisioner's exact 23-file map, so browser and instructor
automation cannot silently drift. The project folder and offline application
cache remain correctly separate browser facilities. Only browser-enforced
folder/device/volume/local-network permissions and the computer's hotspot
selection remain explicit.

Refinement 15 completes the first physical dev.7 repair slice and simplifies
the student-facing project workflow. The landing page separates initial
setup/repair from the ordinary IDE, Monitor, and Guide actions. The IDE file
rail now begins directly with **Project**, keeps the file list primary,
places Rename/Duplicate/Main/Delete and folder controls below it, and creates a
new project from one compact template control. **Save** is explicit while the
connected-folder status explains subsequent autosave. The Guide separately
defines Validate, Flash project, Run, Stop, and Reset; treats `main.py` as
mission control; documents platform support and a GitHub Desktop workflow that
never gives the static site repository credentials; and explains online update
checks and atomic complete-cache activation. The Monitor reports measured
recording rate and time capacity for its 30,000-sample rolling buffer.

Refinement 16 makes the USB-to-Wi-Fi handoff observable and recoverable. The
wizard now proves that the selected workspace can be written and read,
then maintains a collapsed, password-free setup log both on screen and at
`UCSB_XRP_Autosaves/xrp-setup-latest.txt`. Robot-service checks report attempt
count and the last timeout, browser/network error, HTTP response, or release
mismatch instead of failing silently. Compact help explains the Chrome and
macOS local-network permissions, makes clear that RESET and BOOT are not used
after USB installation, and provides a direct return to USB repair.

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

Both application headers are now 27 px high and use a contiguous `UCSBXRP`
wordmark: UCSB blue and a restrained grey-red product name share the same type,
size, and weight. The UCSB mark uses `#00588a`; Run is a neutral black control.
Header selectors and buttons are 19 px high; Run/Stop and Reset
use compact labeled icons. The IDE command region remains one line at ordinary
widths and wraps into a visible second row at phone width, while target state
and Settings stay fixed at the far right. IDE and Monitor links carry a
visible diagonal arrow and open a separate tab in both directions. In the
Monitor, Live controls precede Live telemetry in the right panel, named watches
follow the telemetry values, and the single Guide link
remains in the header. Offline readiness sits with recording/storage
information rather than consuming a footer row. In the IDE it sits with
workspace and project-folder information rather than consuming a footer row.

The web release is now explicitly local-first: after one verified online load,
all application and course assets execute from browser-local storage without
further exchange with the web host. Physical traffic uses either a default
device-specific XRP hotspot at `192.168.42.1` or an optional existing Wi-Fi
network. IDE Settings groups project flashing, controls, telemetry, and address
under **XRP Wi-Fi** while identifying USB as the firmware, setup, and repair
path. Station-only preferences migrate without losing their saved endpoint.

Folder work is now low-friction and recoverable. A workspace contains one named
folder per project; new templates write their folder immediately and subsequent
edits are serialized automatically after a short pause. Chrome retains the
workspace and active-project handles where permitted and otherwise exposes one
Reconnect action. Four complete pre-overwrite project states rotate in the
project's `UCSB_XRP_Autosaves`. The Monitor independently stores four
aligned generations of output text, run metadata, and unit-labeled telemetry
for every observed run; manual CSV exports remain explicit and unrotated.

The IDE and Monitor now share one named runnable project revision and one
stateful Run/Stop control. The target publishes a source-free revision
descriptor; IDE edits mark it changed, disable Monitor Run, and become current
again only through an IDE run or **Flash project**. The browser, CPython probe,
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

The standalone `USER_REFERENCE.md` review draft now identifies every exported
student-facing name, the six required component interfaces, exact call
signatures and return values, units, file ownership, live controls and watch
values, mapping and mission services, and the distinction between Python calls
and application actions. It is intentionally not yet inserted into the Guide,
so instructor review can refine its presentation before it becomes part of the
student UI.

The development RP2350 was previously provisioned on `Pink` at
`192.168.7.34` with release `2026.08-dev.5`. Its device-specific
`UCSB-XRP-9EDE` hotspot,
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

Dev.5 introduced acceptance of ordinary floating-point representation error
across runtimes. Dev.6 removes the
unnecessary requirement that an entire numeric range contain an exact integer
number of steps. Its spiral demo defaults to 1.2 turns/m over an expanded
0.4–2.0 turns/m range, and a fresh IDE opens that demo without replacing
recovered student work. Browser-managed virtual and physical launches bypass
the USER wait; directly executed standalone programs retain it. Active
physical telemetry polls at 60 ms, while idle polling remains 250 ms. The IDE
calls persistent transfer **Flash project** and distinguishes connected,
flashed, and flash-needed states.

The attached XRP now runs dev.7 in hotspot mode at `192.168.42.1`. The first
content comparison updated four stale files and retained 19; repetition
updated zero and retained all 23. Two deliberate comment-only changes to
`/lib/ucsb_xrp/utils.py` were each restored as the only changed file. The board
also proved that a verified temporary file can replace an existing destination
with one `os.rename`, so browser and command-line repair no longer delete the
working file before activation. The final repeat retained all 23 files, runtime
imports reported MicroPython 1.28.0, `ucsb_xrp` 0.4.0-dev, service dev.7, and
XRPLib Board, and the controller was reset into normal service boot. No motion
command was issued.

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

- Local project-folder open, Save, debounced automatic writes, persisted
  handle recovery, concise permission reconnect, four prior project states,
  and continuously recovered browser state.
- Create, rename, duplicate, delete, and tab among project files; select the
  main file and create any challenge, robot demo, or tutorial from a template.
- Explicit **Validate** and **Flash project** operations, one stateful
  **Run/Stop** control, and **Reset** for virtual or physical targets.
- A compact project rail, collapsible project/settings/output panels, 9 px
  default editor and output type, an 8 px selectable minimum, optional code
  overview, clear labels, and documented shortcuts.
- Sensor-feedback obstacle-turn and expanding-spiral demos plus a seven-lesson
  MicroPython project; all are editable, folder-saveable,
  MicroPython-validated, and runnable in the virtual target.
- Separate Status, Program output, and System log views; grouped
  XRP-hotspot/existing-Wi-Fi selection and station-address editing; local
  Monaco workers; and MicroPython compilation.
- A concise **Set up or repair XRP** entry in Settings, available for both
  virtual and physical target state, with the selected project folder and
  physical endpoint handed back automatically after setup.

### XRP commissioning

- Current desktop Chrome/Edge wizard reachable from the public landing page,
  guide, and IDE Settings; no instructor account or local command line is
  required for the student path.
- Exact VID/PID serial selection; MicroPython raw-paste transfer with standard
  raw fallback; controller, version, XRPLib, course-library, service, and file
  integrity checks; watchdog-safe operations; and post-reset service proof.
- Safe-to-repeat content comparison and staged file replacement activated by a
  single rename. All 23 release payload files are fetched and browser-hashed
  before transfer, then every destination is hashed on-device before reset.
- Pinned, offline UF2 recovery with byte-count and SHA-256 verification, plus
  automatic serial re-enumeration when the browser retains device permission.
- New-robot hotspot default, keep-current repair default, optional station
  credentials held only in component state until USB transfer, and automatic
  physical-target/folder handoff to the IDE.
- Actual folder write/read verification plus a compact password-free setup log;
  bounded network-probe diagnostics distinguish no reply, browser/network
  failure, HTTP failure, and release mismatch.

### XRP Monitor

- Shared virtual/physical target, dimensioned top-down XRP and trail, bounded
  2,400 × 1,800 mm grid with labeled x/y values, arena/XRP zoom views, obstacle
  and range ray, contact state, pose, encoders, drive command, range, button,
  IMU, temperature, battery, and program output. Without a published pose, the
  map remains present with a labeled XRP preview centered at the origin.
- A 176 px collapsible sidebar for signal selection and recording; the virtual
  scene and zoom are selected in the compact World toolbar, while target
  settings remain shared from the IDE.
- A permanently open Live controls region above Live telemetry renders declared
  numeric parameters as thin sliders, Booleans as checkboxes, and short choices
  as radio controls. Named watch values form a compact table below Live telemetry
  in the right panel. Pending and applied values are shared across tabs and
  controls disable when the program is not running.
- Independently selectable wheel-speed, drive-command, virtual odometry-check,
  forward-range, acceleration, and yaw-rate strips with labels and units inside
  each plot. Wheel speed uses a labeled short display mean while recording raw
  samples; students can explicitly clear the visible history.
  Every plot retains a 180 px row as signals are added or removed; the stack
  scrolls, and one unlabeled minor time line divides each pair of labeled lines.
- Persistent pointer- and keyboard-adjustable separators independently size
  world/values, plots/output, and upper/lower regions.
- A rolling 30,000-sample recording window, observed-rate/time-capacity and
  dropped-sample reporting, and deterministic 37-column CSV export with
  explicit seconds, m/s², rad/s, millimeters, and blank unavailable values.
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
- Status text is no longer styled like a button. Offline readiness names the
  current application, such as **IDE saved in Chrome**, and explicitly
  distinguishes the browser copy from robot connectivity and project folders.

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
- The browser wizard and optional command-line provisioner share one canonical
  installation map. Both default a new robot to a uniquely named XRP hotspot,
  install and verify every course/reference/service file, and support station
  mode without exposing its credential. A failed station association starts
  the recoverable hotspot.

### Offline and guidance

- The production service worker verifies all 192 public payload files,
  including the applications, workers, MicroPython WebAssembly, course source,
  starters, demo/tutorial templates, supplied bytecode, commissioning payload,
  exact RP2350 UF2, and dependency license notices. Each application reports a
  literal **saved in Chrome** state; robot connectivity remains separate.
- The guide and repository README cover the virtual workflow, project files,
  physical setup, target operations, Monitor signals, shortcuts, recovery, and
  later physical calibration.
- `docs/RED_TEAM_REVIEW.md` records the integrated failure-mode review,
  implemented mitigations, evidence, and remaining empirical boundaries.

## Validation performed

The latest complete software pass includes:

- Prettier, TypeScript, repository whitespace, and zero-advisory npm audit
  checks;
- 126 CPython API and harness tests;
- MicroPython 1.28 WebAssembly behavior parity for the canonical package and
  exact supplied bytecode;
- 135 Vitest tests for project identity and handling, folder rotation, target
  clients and lifecycle, simulator, telemetry, offline state, commissioning,
  raw REPL transport, plot data, and measured contrast;
- a production build and verification of the exact 191-file offline manifest,
  including the 1,725,952-byte firmware against its pinned SHA-256 digest; and
- 33 passing Stable Chrome software workflows covering all starters, the two
  robot demos and tutorial project, flat IDE geometry, four-generation source
  autosave, per-run telemetry/output autosave, blocked-gate replanning,
  two-app target sharing,
  run-owner loss, narrow layouts, selectable/collapsed Monitor controls,
  typed live parameter updates and named watches, recording/CSV/SVG/PNG/WebM
  export, synchronized annotations, named workspace-child creation, and a
  network-blocked offline reload, XRP-hotspot/existing-Wi-Fi selection, and the
  fresh-browser spiral default, fresh-Monitor direct Run, automatic validation
  failure reporting, folder write failure, explicit serial-picker cancellation,
  visible connection diagnostics, and a complete browser commissioning session
  against a raw-REPL RP2350 state machine using all 23 real payload files;
  one opt-in physical-hardware workflow skipped because the ordinary software
  suite does not mutate an attached robot;
  plus direct Chrome and harness repetitions on the previously attached RP2350. The
  previously failing second launch, physical live-parameter update,
  stop/reconnect, read-verified USB repair, and strict post-reset lifecycle now
  pass on release `2026.08-dev.4`.

The subsequent dev.5 physical regression directly exercises the decimal range
that failed only in the physical runtime. Both spiral controls were published
by the running device service before any motor command.

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
inspection. Measurements confirmed 27 px headers; 19 px header controls; 22 px
project controls; a 6 px right inset for Settings; exact matching
`rgb(0, 88, 138)` UCSB-mark and enabled-Run colors; a lower-left offline status
whose bottom edge matches the open file rail; and no offline status in either
header. The IDE calls the selected entrypoint **Main file** and its Status view
now separates Project, Target, Validation, and Robot project. The
constrained pass originally led to a horizontally scrollable command region.
Refinement 21 replaced that hidden narrow-width behavior with visible wrapping.
Direct Chrome reported no console warnings or errors.

The subsequent command-density pass retained the 27 px headers while reducing
header text to 9 px, command/select heights to 19 px, and a compact unclipped
execution-target selector. Run and Reset are accessible icon controls, with play
changing to stop during execution; **Validate** replaces the longer label.
Direct Chrome inspections at 691 px and 344 px confirmed the rewritten landing
page and both application headers remain legible without horizontal overflow.

The fixed-plot/world-preview refinement was then inspected directly in
1,382 × 797 production Chrome. Four enabled plots each remained exactly 180 px
inside a 287 px viewport, producing a 720 px scrollable stack; one unlabeled
x-grid line appeared between adjacent labeled values. XRP zoom confirmed one
dark gray chassis shade, and the Monitor header displayed `IDE ↗ |`. A separate
Stable Chrome path used an unreachable physical endpoint and verified that the
full-size map and centered, explicitly non-pose XRP preview remained visible.
All 29 current software Chrome workflows pass and the physical opt-in workflow
is intentionally skipped.

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
check because permission is scoped to the deployed origin. The current local
production build includes 192 verified payload files.

The commissioning workflow additionally passes focused controller/version
rejection, raw-paste flow control and standard-raw fallback, changed-only
installation, complete remote readback, repeat repair, firmware integrity/write,
network configuration, reset, target preference, and automatic IDE handoff
tests. Its Stable Chrome workflow traverses the actual production manifest and
payload bytes. The attached dev.7 XRP now closes the physical file-comparison,
single-file repair, destination activation, complete readback, import, and
reset boundaries. A public Chrome run completed the native folder and Web
Serial stages through robot reset and reached the Wi-Fi handoff; that run
exposed the formerly silent service-probe failure. The revised wizard was
visually inspected in direct production Chrome at 691 × 752 with its setup log
collapsed and expanded. The remaining live browser evidence is a repeat from
the revised Pages origin through local-network permission and automatic IDE
handoff. Firmware-volume repair was not forced on a controller that already had
the exact pinned runtime.

On 2026-08-20 the reattached RP2350 was detected at the expected SparkFun
VID/PID and passed another complete changed-file comparison, readback, reset,
and re-enumeration: all 23 release files were unchanged and no payload was
rewritten. It retained hotspot mode at `192.168.42.1`. A station-mode repetition
was not started because the formerly referenced local `Details.md` credential
file was no longer present; the robot and computer network settings were left
unchanged.

Refinement 36 completed the student-facing documentation, evidence, and visual
pass. The UCSB XRP API now documents each student base class with its purpose,
state, constructor, properties, parameters, return values, exceptions, and
required behavior. Each challenge now includes an objective, student and
supplied components, program flow, work sequence, and isolated MicroPython
component checks. The simulator and CSV distinguish simulator ground truth from
student odometry, expose requested and target motion, and retain project-owned
world selection across unchanged runs. Encoder-derived wheel speed is now a
regularized estimate from cumulative wheel travel rather than a one-sample tick
difference; exact increments remain unchanged for odometry.

The complete local check passed with 135 Python tests, MicroPython 1.28
source/bytecode parity, 140 Vitest tests, production and commissioning builds,
the 208-file offline shell, and all 34 non-hardware Stable Chrome workflows.
The opt-in physical workflow was skipped. Direct production-Chrome inspection
then covered the landing page, commissioning wizard, IDE, Monitor, Guide, and
API reference. A fresh Monitor Run automatically validated and started the
spiral, retained the System log, showed student plots and wheel distance,
tracked target wheel speed with a smooth measured estimate, and stopped with a
zero drive command. The final documentation-only grid correction passed a new
production build and offline-shell verification. There was no page-level
horizontal overflow in the inspected layouts.

The first public dev.11 repair then exposed one commissioning defect after all
25 installed file hashes matched: runtime verification imported the pre-repair
`ucsb_xrp_service` module still retained by the active MicroPython session and
compared its stale version constant. Commit `13d1754` clears only the three
course-package namespaces before importing the installed files and reports
actual and expected versions on any future mismatch. Seven focused
commissioner tests, two setup-log tests, the production/offline build, and five
commissioning Chrome workflows pass. GitHub Pages run `32543192621` succeeded.
The corrected public Chrome wizard then verified 0 changed and 25 unchanged
files, loaded release `2026.08-dev.11`, retained Pink at `192.168.7.37`, reset
the XRP, discovered service/protocol versions `2026.08-dev.11`/1 on attempt 5,
selected the physical IDE automatically, and flashed the four-file Expanding
spiral project. Stationary telemetry returned live range, IMU, temperature,
encoder, and zero-effort values. No motor command was issued for this repair.

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

`docs/hardware/2026-08-07-dev7-commissioning-repair-validation.json` records
the attached dev.7 changed-only comparison, two controlled one-file repairs,
direct-rename activation, final 23-file no-change repeat, runtime imports, and
normal-service reset. It separately identifies the uncompleted native macOS
folder-picker-to-Web-Serial handoff.

`docs/hardware/2026-08-21-dev11-browser-commissioning-validation.json` closes
that handoff and records the dev.11 verifier correction, successful public
deployment, complete physical wizard path, station-mode service discovery,
project transfer, and stationary telemetry.

## Remaining work

1. Exercise the UF2 branch later on a controller whose MicroPython firmware is
   genuinely incompatible; the attached controller already has the pinned
   firmware, so forcing that branch would not validate a realistic repair.
2. On the final course surface, measure wheel-speed response, effective wheel
   diameter and track width, stopping distance, and motion-induced IMU/range
   behavior; update `robot_config.py` and simulator comparison envelopes.
3. Run each complete challenge on the floor after calibration. These empirical
   results should refine configuration, not create another student workflow or
   target protocol.

On 2026-08-26 the student-documentation slice replaced the Guide's improvised
box diagrams with semantic HTML/CSS data-flow diagrams, removed redundant headings
and control grids, clarified browser/USB/Wi-Fi roles, and explained why
`Robot.step()` must own sampled-loop timing. Guide reading text is now 14 px
(approximately 10.5 pt), with proportionally smaller secondary text. Challenge
READMEs now open as sanitized rendered Markdown in the IDE by default and retain
a compact Preview/Edit switch. The five challenge READMEs foreground the work
introduced in each challenge, describe carried-forward files in plain language,
and no longer prescribe a shortest-path algorithm for Challenge 4. The landing
and offline text now distinguish cached course apps, ordinary project files,
and temporary browser copies. Monitor Controls labels selectable data as Plot
signals and uses the compact control text scale.

The production build, 14 focused course-starter tests, offline reload, Markdown
Preview/Edit, fresh default-project, link/fragment, commissioning, and narrow
Guide workflows pass in Stable Chrome. The broader browser run completed 32 of
38 workflows before six documentation/test expectation failures; five were
corrected and rerun directly. The remaining tutorial-suite timeout is being
treated as a performance/repetition investigation rather than accepted as a
pass. Physical commissioning and repeated project execution are the next stage.

The production preview remains available at `http://127.0.0.1:4174/`.

On 2026-08-27, the commissioned connection record was simplified so the
network actually verified by the wizard is authoritative. If a requested
station join falls back to the XRP hotspot, the next IDE now selects the
hotspot and retains the previous station address only as an inactive route.
The wizard also no longer creates a permanent folder-handoff marker before
network verification: a robot-specific handoff is created only after service,
release, and robot identity agree, expires after two minutes, and is consumed
by the IDE. Focused target, commissioning, and handoff tests pass. Physical
station operation remains verified on Pink; a deliberate failed-station
fallback will be repeated during the later hotspot stress pass.

The next documentation and starter stage reconciled the student-facing
terminology around one **Working folder** containing named **Project folders**,
made USB-installed course software distinct from the temporary project prepared
by Run, and aligned the Guide, API, user reference, active course documents, and
challenge READMEs. Challenge 2 now explicitly performs and documents four
phases—outward travel, return turn, return travel, and recovery of the initial
heading. Its end-to-end Stable Chrome test checks the reported final heading,
so the final turn cannot disappear while the completion text still passes.
Challenge 1 now states its actual time objective: a valid run must not finish
before the target time and should minimize positive lateness.

Validation for this stage includes 213 Python tests, MicroPython 1.28 source and
reference-bytecode parity, a complete production/offline build, 22 focused
commissioning/navigation/offline/project workflows, all 17 virtual
course-starter/tutorial/demo workflows after correcting one obsolete log-text
expectation, and direct Chrome visual inspection of the revised setup and Guide
surfaces. No physical motion was needed for this documentation and virtual-task
stage. A separate project-ownership audit identified the next material design
task: the Run owner, reload recovery, remembered project handle, and Monitor run
archive destination must be made one coherent active-project authority before
another physical stress pass.

That active-project redesign is now complete. The active IDE is the sole writer
of the global browser recovery copy and remembered Project-folder handle. A
standby IDE can edit and autosave its own Project folder but cannot replace the
project used by Run or reopened later without an explicit **Use this project**
action. Monitor reads the active folder for run archives and may request access
to it, but can no longer select or remember a different project. The Working
folder is independently remembered as the parent for new projects; changing it
does not detach, move, create, or replace the current project, and commissioning
does not create an `Expanding-Spiral` folder as a side effect.

The previous browser recovery and project-handle keys migrate once to the new
authoritative keys. Later writes from an older cached tab cannot overwrite the
new state. **Open project** now rejects a Working folder even when stale root
metadata is present and its child projects are legacy folders without metadata.
The browser-filesystem scan first completes parent enumeration before examining
children, avoiding a Chrome iterator behavior that intermittently skipped a
sibling during the regression test.

Validation includes a clean production/offline build, all 309 Vitest tests, and
20 Stable Chrome commissioning, storage-migration, multi-IDE, project-boundary,
autosave, and Monitor-run workflows. The stale-parent boundary passed four
consecutive repetitions after the iterator correction. The full unit run also
removed an accidental Node 22 dependency from the Web Serial test harness, so it
passes under the installed Node 20 runtime. The next slice is update-safe PWA
lifecycle behavior, followed by the full virtual and physical stress pass before
structural refactoring and measured optimization.

The update-safe PWA lifecycle slice is complete. A newly cached course release
now waits at an application-specific safe boundary: IDE protects source edits,
folder operations, target commands, and settings drafts; Monitor protects target
commands, recording, notes, exports, and folder writes; commissioning protects
USB selection, installation, setup-log writes, and Wi-Fi handoff; and the
challenge author protects both valid and temporarily invalid specification text.
A cancelled browser reload remains pending and is retried by the next safe
operation. Static read-only pages opt into immediate adoption explicitly rather
than relying on a permissive default.

Commissioning artifacts are now release scoped. The manifest lives below the
release sequence, and the pinned RP2350 UF2 has a full SHA-256-addressed URL. The
offline package contains one firmware copy rather than mutable and versioned
duplicates, while its service worker retains the current and immediately
preceding course caches so an open tab can finish saving before it reloads.

Validation for this slice includes 215 Python tests, MicroPython 1.28 source and
reference-bytecode parity, 333 Vitest tests, the production build, and verification
of all 223 offline payload files. Stable Chrome exercised first-session A-to-B
updates, cancelled navigation, IDE Open/Create Project, commissioning folder and
serial pickers, retained Monitor recording and notes, invalid challenge JSON,
offline reload, project autosaves, rotating copies, and Monitor run archives. The
broad browser run passed 84 workflows and skipped only the opt-in attached-hardware
proof; its one obsolete **Clear recording** label expectation was updated to the
intentional **Clear recording and notes** wording and passed on its focused rerun.
The next slice is reset/repair commissioning followed by repeated virtual and
physical project execution and IDE/Monitor synchronization on the attached XRP.

The instructor authoring page now builds a complete unpublished project in the
browser and opens it directly in the IDE. The one-time handoff includes the
copied starting project, generated student README, edited world, and complete
file overrides without changing the catalog or replacing an existing
folder-backed project. The instructor can validate and run the draft before
saving it to a new Project folder or using the repository publication script.

Focused validation created a new **Stopping Response** challenge through the
form, opened its generated README as rendered Markdown, compiled and ran the
project on the virtual XRP to the finish marker, and exported its recorded
telemetry as CSV. The authoring model and handoff tests pass (20 Vitest tests),
the repository generator tests pass (15 Python tests), and the production build
passes. This slice does not publish the draft or change the physical XRP.

The IDE project/files novice-flow pass now explains the folder model before
Chrome opens a directory picker. **Open project** first states that the Working
folder is the parent of the named Project folders and that the current project
will remain open; remembered access is reconnected only after the student asks,
and cancellation or denial remains in the dialog with an actionable message.
The project rail no longer repeats the same unsaved status, and **Save project**
now sits with **Open project** and **New project** while file creation/import and
automatic folder saving retain their existing behavior. Direct-child project
listing, repository/parent rejection, multi-IDE authority, and project autosaves
are unchanged.

Validation includes a clean TypeScript/production build and 39 Stable Chrome
project, storage-recovery, autosave, multi-IDE, deferred-update, complete virtual
workflow, and responsive-rail tests. A background browser visual pass confirmed
the explanatory Open dialog, the nonduplicated storage state, and accessible
project controls in both wide and narrow layouts.

The integrated browser release at commit `750ce2a` is live on GitHub Pages.
Pages workflow 24 passed the complete browser gate, built the static artifact,
and deployed it. The public manifest reports version
`b5300e2afd46f162b694`; all nine application routes return their current hashed
assets, and native Chrome confirms that the deployed IDE and Monitor fill the
viewport. A direct two-tab Virtual XRP check ran and stopped Expanding spiral
from Monitor while IDE reflected the same run state.

The next tutorial refinement closes the remaining direct Python-content gap.
Tutorial 1 now asks students to handle only the expected `TypeError` and
`ValueError` from converting a saved stop distance, use an explicit fallback,
and leave unexpected errors visible. Its checker distinguishes incomplete,
incorrect, and overbroad exception handling. The IDE now links
`student_work.py` to tutorial-specific Guide or API material rather than one
generic destination. Focused Python checks, a root production/offline build,
and the five-tutorial Chrome compile/check/help workflow pass without motion.

The Monitor annotation and stopped-run presentation defect is corrected.
ECharts now includes its annotation-line component, notes bind when the student
right-clicks to the exact retained telemetry source and sequence, and labels at
the plot boundary remain inside the grid. Physical idle telemetry continues to
update Live telemetry and its measured source rate, but no longer pushes a
completed run or its notes out of the strip-chart window. Starting a manual
recording while stopped intentionally follows and records those samples.

Focused unit and Stable Chrome export/annotation workflows pass. A direct
physical-XRP browser check on dev.40 confirmed Run/Stop, a fixed four-sample
completed-run plot while fresh 2 Hz stationary telemetry continued, and a
visible note line and label on both selected plots. The local integrated preview
was replaced in place and remains at `http://127.0.0.1:4174/`.

The first Pages run for this slice exposed one missed interaction: a Monitor
opened after a completed virtual run received retained telemetry while ready,
and the stopped-plot rule initially discarded that history. Retained batches
now carry an explicit replay marker, so a late Monitor reconstructs the path and
strip charts while new physical idle samples remain live-values-only. The exact
late-Monitor workflow and the annotation/export workflows pass together.

Pages publication no longer waits behind the approximately ten-minute full
browser suite. Fast source, MicroPython, unit, production-build, and offline
artifact checks remain a deployment prerequisite; the complete Stable Chrome
suite runs in parallel on the same commit. A newer push cancels an obsolete
in-progress release instead of queuing behind it.

## Refinement 71: one workspace authority and explicit run ownership

The browser now retains only the opaque Working-folder capability. The active
Project, selected target, robot identity, and known network route remain in the
Working folder's `.ucsbxrp.json`; obsolete independent workspace and Project
handles are deleted rather than imported. A missing configuration may be
created, but an invalid or unreadable configuration is never replaced with an
empty one. Switching or creating a Project first completes any pending Project
write, and the switch is accepted only after the active Project name is written
to the same configuration file.

USB setup records the robot network reported after installation before the
student changes the computer's Wi-Fi or leaves the wizard. Selecting the robot
hotspot retains the last verified router address, so changing network modes no
longer discards a known Pink route. IDE and Monitor wait for the saved target
preference before connecting rather than briefly starting the Virtual XRP.

Monitor datasets now begin only from an explicit Run request, not from a generic
target `loading` state. Reset therefore cannot create an empty second run. Each
completed run retains its Project, destination folder, and world definition;
CSV, plot, and WebM exports continue to use that completed run even after a
different Project or world is selected. Project changes clear obsolete live
controls and program-published plot choices.

Focused evidence includes 27 persistence/target/run unit tests; three current
commissioning and network-mode browser journeys; seven IDE, tutorial, compile,
component-check, Monitor-first, and spiral journeys; three repeated virtual and
physical-profile stress journeys; and four Monitor record/export/reset/narrow-
layout journeys. All pass in production Chrome. The sole development server
remains the cache-free Vite instance at `http://127.0.0.1:4174/`. The next gate
is the current-source physical browser journey on Pink, followed by a concise
first-use visual pass and public Pages deployment.

## Refinement 72: physical repeatability and shared Run records

The current setup flow has been exercised again from a newly selected Working
folder with the attached RP2350 XRP on Pink. Same-release repair retained the
station profile, restarted the XRP, verified `192.168.7.25`, and handed the
saved robot and active Project to both IDE and Monitor through the one
`.ucsbxrp.json` file. Reopening setup retained the Working folder and reopening
the IDE restored `1 · Straight Run` rather than an unrelated browser Project.

The physical XRP completed Expanding spiral, repeated straight-line Projects,
Reset followed by Run, and a bounded left/right/paired motor and encoder check.
The browser observed about 45 Hz telemetry while the Project ran and about
2.4 Hz idle telemetry. Completed runs produced rotating program-output and
telemetry files in the active Project folder. One initial straight-line attempt
caused the device watchdog to restart; the same unmodified 20 ms Project then
completed repeatedly after service recovery, so no timing parameter was changed
without reproducible evidence.

A real two-tab run exposed one remaining ownership defect: when Run was pressed
in IDE, Monitor received the new Project and telemetry but retained the previous
Project's completed dataset. Monitor now begins a dataset from the target's
structured Run request, with the target's `running` transition as the attach-
after-request boundary. Reset and connection transitions cannot create a run.
The focused production-browser regression passed, and a subsequent physical
IDE-started run was stored and labeled as `1 · Straight Run`; Reset created no
empty run, and a Monitor-started repeat produced 112 samples and saved them to
the correct Project folder.

## Refinement 73: direct setup entry and literal component language

Setup now proceeds directly to the USB step when Chrome already has read-write
access to the saved Working folder. Selecting a new folder already advanced to
USB; reopening setup no longer adds a second **Use folder** action. The folder
remains visible in the setup progress panel, and **Back** still permits a
deliberate folder change. Normal Chrome confirmed that `new_xrp` opens directly
at **Connect the XRP by USB-C** with the previously approved RP2350 identified.

The IDE's target description now reads, for example, **Program completed.
Project ready.** rather than repeating “Project.” Guide and API copy names the
component file, required method, or selected implementation directly instead
of using ambiguous phrases such as “student method.” The API metadata label is
now **Project file**. The production build, the current public-wizard handoff
test, and the folder-picker/update boundary test pass.

The publication gate also passes: formatting, 247 Python tests, MicroPython
1.28 source/reference-bytecode parity, 382 browser-library unit tests, the
production build, and all 267 offline payload files.

## Refinement 74: one owner for first Project creation

The first native test of the published IDE found an action-ownership defect:
**New project** selected an empty Working folder, the generic folder connector
created Expanding spiral immediately, and the still-open dialog then reported
that its own requested folder already existed. Connecting a Working folder can
now be done without selecting or creating a Project when **New project**,
**Save project**, challenge progression, or the Project chooser already owns
the next action. The ordinary IDE entry path still creates Expanding spiral in
an empty folder when no more specific Project action is underway.

A Stable Chrome regression now begins without a Working folder, selects
Expanding spiral in **New project**, chooses an empty Working folder, and
confirms that the requested Project is created once, opened, and recorded as
the active Project in `.ucsbxrp.json`. Type checking, the production build, and
that exact browser workflow pass.
