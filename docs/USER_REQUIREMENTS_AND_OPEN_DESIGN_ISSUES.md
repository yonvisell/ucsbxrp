# User requirements and open design issues

## Purpose and interpretation

This is a compact design input distilled from the development history and the
current repository. It is not an acceptance contract. It records the outcomes
that matter, the failures that should remain in regression coverage, and the
questions that still require design judgment.

The user's comments have four different roles:

- **Required outcome** — behavior the course product must provide.
- **Observed failure** — a real user observation that requires explanation and
  regression coverage, but does not establish its own root cause.
- **Representative preference** — a concrete label, spacing, or interaction
  example pointing to a broader usability issue; it is not necessarily the only
  correct implementation.
- **Proposed mechanism** — an idea to evaluate, not an architecture decision.

Status terms below mean:

- **Implemented** — present in the integrated source and supported by focused or
  retained evidence.
- **Partially addressed** — substantial behavior exists, but an important design,
  usability, or integration issue remains.
- **Unverified** — an implementation exists, but the exact current workflow lacks
  adequate end-to-end evidence.
- **Open** — no adequate current solution, or a known design defect remains.

Repository reading cut: 2026-08-26, after commit `e591b94`, with the
latest-project-on-Run provider still an uncommitted work in progress. This review
used source, `STATUS.md`, the retained dev.28 physical record, and focused design
documents; it did not rerun the test suite.

## Governing intent

UCSBXRP is one course product comprising the MicroPython API and robot service,
IDE, Monitor, virtual XRP, setup/repair workflow, project templates, and
documentation. Its primary measure is whether undergraduate mechanical-
engineering students can understand and use it, and whether instructors can run
and revise the course without the original developer intervening.

The durable priorities are:

1. Real robot and virtual-robot workflows must work repeatedly, not only compile
   or pass isolated tests.
2. The ordinary path must be low-friction, compact, and explicit about the next
   action. Internal complexity should not become student ceremony.
3. Student code and documentation must be literal, technically precise, and
   readable by a capable undergraduate with limited Python experience.
4. IDE, Monitor, commissioning, project storage, and robot service must share a
   coherent understanding of the active project, robot, release, connection,
   and run state.
5. The reference library is revisable. Coordinated improvements are preferred
   when they simplify student work or clarify component responsibility.
6. Evidence must distinguish simulation, mocked-browser, native-browser, and
   physical-robot results. One successful run is not repeatability evidence.
7. The supervised, raised-wheel XRP does not warrant safety tiers, motor locks,
   repeated confirmations, or instructor handovers. Ordinary stopped-state
   engineering care is sufficient.

USB-C and Wi-Fi have different student-visible roles. USB-C commissions or
repairs the controller and its course runtime. Once commissioned, project Flash,
Run, Stop, and telemetry use the selected Wi-Fi route. An IDE-managed Run is the
start action and must not add a second USER-button confirmation. A full reset
may require the radio to reassociate (about eight seconds was measured on
`Pink`); ordinary commands should not contain comparable guessed waits.

## Highest-priority functional workflows

| Area | Required outcome and history | Current reading | What remains |
| --- | --- | --- | --- |
| Physical station-mode operation | **Required:** validate, flash, run, stop, rerun, motor actuation, encoders, telemetry, output, and shared IDE/Monitor state on the RP2350. | **Implemented on one XRP.** Dev.28 passed the attached-hardware Stable Chrome workflow on `Pink`, including motion, encoder change, telemetry, immediate Stop, rerun, and restoration of Expanding Spiral. | Repeat after any service/target refactor; floor motion and motion-induced sensor changes remain separate empirical work. |
| USB setup and repair | **Required:** a student can commission a new XRP or idempotently repair/update one through Web Serial, with controller/runtime/file verification and a clear handoff to physical mode. **Observed:** stalled verification, stale module checks, misleading “No XRP selected,” unclear waits, and difficult exit/back behavior occurred in prior releases. | **Partially addressed.** The wizard, changed-only verified install, A/B runtime activation, retained setup log, Back/exit states, and older native-browser evidence exist. Dev.28 was installed and verified by the command-line installer. | Complete and repeat the exact dev.28 native folder/Web-Serial wizard path, including same-release repair, restart, Wi-Fi verification, and IDE handoff. A browser device picker remains an unavoidable user permission boundary and must be conspicuous. |
| Robot hotspot operation | **Required:** normal runtime must work either on a shared local network or the XRP's own broadcast hotspot; the wizard must explicitly tell the user when to change computer Wi-Fi and confirm reachability afterward. | **Unverified for the current release.** Earlier releases proved hotspot association and physical execution; current dev.28 evidence is station-only. Optional `UCSB-XRP-<NAME>` naming is implemented. | Repeat commissioning, computer handoff, Flash/Run/Stop/telemetry, reconnect, and return-to-internet behavior on dev.28. Test a room-relevant unique identity rather than trusting only `192.168.4.1`. |
| Connection and release authority | **Required:** one commissioned robot identity, current reachable route, installed runtime, flashed-project state, and run state must be shown consistently in every app. **Observed:** station setup handed the IDE a stale hotspot address; cycling modes sometimes repaired it; IDE and Monitor disagreed about readiness. | **Partially addressed.** `RobotProfile` now separates station and hotspot routes, binds them to robot identity, refreshes verified DHCP observations, and rejects the wrong robot. Runtime installation is transactional. | Repeatedly stress station/hotspot cycles, reset, stale tabs, and repaired robots. Decouple web-app build identity from robot-runtime compatibility so documentation/UI releases do not force fleet repair. |
| Exact project run across apps | **Required:** Monitor Run must execute the exact IDE draft visible at the instant of Run, automatically validating and flashing when needed. **Observed:** Monitor was disabled or ran stale/default code; a 160 ms edit-publication boundary was identified. | **Partially addressed; active work.** IDE/Monitor share target state and an on-demand project-provider change is present in the working tree. | Finish and qualify the provider design for immediate edits, file operations, multiple IDE tabs, disappearing providers, physical flash, and virtual run. Correctness must not depend on a timer or per-keystroke transfer. |
| Project-directory boundary | **Required:** a course/working folder contains separate project folders; opening one project must never flatten a parent folder, expose the UCSBXRP repository, or mix sibling projects. **Observed:** source-repository files and every file in a parent folder appeared in Project files. | **Implemented as a technical boundary.** Open Project now requires valid root `.ucsb-xrp-project.json`, its main file, and no nested project metadata; invalid choices preserve the active project. | Preserve this regression boundary, but do not treat it as resolution of the human project model below. |
| Human project model | **Required:** creating, naming, copying, opening, importing, autosaving, progressing between challenges, and locating projects should match a simple student mental model. **Observed:** Working/Course/Local/Project folder terminology, “recovery copy,” template creation, Open Project, Copy, Save, Main, and status presentation were confusing. | **Partially addressed.** Named child folders, autosave/conflict handling, file import, README preview, project metadata, and carried-forward challenge modules exist. | Conduct a design/usability audit of the whole workflow. Compare modern lightweight project/file-management patterns; do not reduce this to stricter validators or more labels. Decide the roles of Working folder, Project folder, temporary browser copy, autosave, project duplication, and challenge progression as one model. |
| Program output and diagnostics | **Required:** retain ordinary program output and enough target/service events to diagnose Validate, Flash, Run, Stop, reset, exceptions, and network handoff. Output must not silently clear at completion. **Observed:** empty System logs, duplicate/incomplete IDE/Monitor logs, vanished output, and clicks with no response. | **Partially addressed.** The IDE separates retained Program output and a timestamped System log; the target coordinator retains and deduplicates bounded history; Monitor no longer duplicates partial terminal panels. | Exercise real failures and repeated runs in the current UI and confirm all consequential actions produce ordered, comprehensible evidence without redundant messages. Device output remains bounded for RP2350 memory and should still feel like the full useful terminal. |
| Stale app/tab isolation | **Required:** students must not unknowingly use mismatched old UI, worker, release, or PWA state. **Observed:** obsolete controls, a blank `/monitor/`, multiple hidden clients, and an old commissioning bundle appeared while current source worked in a fresh context. | **Partially addressed.** Development removes old workers/caches, the physical worker name advances with the release, update reload waits for safe saves, and `/monitor/` is canonical. | Stress old/new tabs, installed PWA windows, several Chrome profiles, service-worker activation, and shared-worker replacement. Provide one clear update/reload path rather than layered recovery flags. |

## Student application and course content

| Area | Intended result | Current reading | Open substance |
| --- | --- | --- | --- |
| IDE editing | Compact Monaco editor with tabs, adjustable code font (minimum 8 px), project files, create/import/rename/delete/main-file actions, autosave, Validate, Run/Stop, Reset, settings, shortcuts, tooltips, README preview, and contextual API help. | **Implemented**, with focused browser coverage. | **Partially addressed as UX:** reassess the file rail, status area, command palette, save semantics, and first-use guidance together with the project model. Consider completion/context help only if it stays lightweight and course-aware. |
| Default and demonstration projects | A first visit opens a short, readable Expanding Spiral project with live winding-rate and speed controls and range-based stop; the obstacle-turn demo provides a second sensor-driven physical/virtual example. Run validates automatically when required. | **Implemented** in the project catalog and focused virtual/physical evidence. | Keep both examples simple and rerun them through native setup, project-copy, station, and hotspot workflows after state or runtime changes. |
| Monitor | Run/Stop/reset from Monitor, shared state with IDE, world view, compact controls, live telemetry, adjustable regions, fixed-height labeled strip plots, clear history, recording, and useful units. | **Implemented**, including synchronized run state, splitters, telemetry, plots, live controls, and world view. | **Partially addressed as UX:** repeat visual inspection on the actual current build and simplify residual redundant frames, labels, and states. Plot/telemetry semantics must remain understandable, not merely compact. |
| Virtual XRP | Run actual project MicroPython against deterministic simulated hardware; expose plausible drivetrain, encoders, range, IMU, button, collisions, and project world while keeping ground truth distinct from student odometry. | **Implemented** with browser and MicroPython evidence. Wheel-speed estimation was regularized rather than derived as a jagged one-tick derivative. | Recheck physical plausibility and signal semantics after refactoring. Avoid labeling odometry error as an observable physical signal without a stated ground-truth comparison. |
| Project world | `world.json` is the project-owned source for bounds, initial pose, walls/blocks, features, start markers, and waypoints used by Python, simulation, and Monitor. | **Implemented.** | A human world editor is **open**. The authoring tool still exposes raw JSON; a compact canvas-based editor for walls, obstacles, markers, gates, boxes, and properties is desired after core workflows remain stable. |
| Live controls and student diagnostics | Student code can declare compact numeric, Boolean, and choice controls plus watch values and optional plot signals; updates apply at sample boundaries without print-loop logging. | **Implemented** in `ucsb_xrp.live`, Monitor controls, telemetry, and API documentation. Numeric slider ranges no longer require an exact whole number of steps. | Qualify physical updates after future runtime changes and keep limits practical rather than rigid. Ensure names, units, and run ownership remain clear. |
| Data capture and export | Save telemetry and program output with the project, rotate a small number of autosaves, export CSV and plots, export a portable world replay, and support compact time annotations. | **Implemented** for CSV, SVG, PNG, WebM replay, annotations, automatic run archives, and bounded recording. | **Partially addressed:** verify destination prompts, failed export recovery, long recordings, and student comprehension. Mobile Safari/Chrome export is not required; unsupported platforms should fail clearly. |
| Five challenges | Each challenge states the robot task, new student work, reused student modules, supplied code, program flow, units, concrete component checks, and evidence to collect without duplicating adjustable values from code. Progression should preserve earlier student implementations without manual copy/paste. | **Partially addressed.** Five runnable starters, separate project progression, carried files/selections, rendered READMEs, and hardware-free checks exist; Challenge 4 now accepts any valid connected free-cell route. | Perform an instructor and first-time-student content review. The current READMEs are substantially clearer but still risk overexplaining mechanics while underexplaining the assignment. Verify every stated program flow and example against execution. Consider simulator-generated task thumbnails later. |
| Python/MicroPython tutorial | A clear sequence for students new to Python, using the virtual XRP where that makes concepts concrete. | **Implemented in source** as seven lessons plus README, and exercised by browser tests. | **Partially addressed pedagogically:** expand and review it as a coherent tutorial rather than a catalog of syntax; confirm every lesson's instructions and result in the visible IDE/Monitor. |
| Component checks | Show concrete inputs, expected results, and PASS / NOT IMPLEMENTED / FAIL without requiring either robot. | **Implemented**, with shared examples selected by each project's small `component_checks.py`. | Review wording and example quality with novice students. “Pending” must not conceal Not Implemented or Failed behavior. |
| UCSB XRP API | Stable, low-friction records and services; six independently selectable student components with explicit responsibilities, state, arguments, returns, units, exceptions, and supplied/reference behavior. Sample timing belongs to `Robot.step()`, not student `sleep_ms()` loops. | **Implemented in package and detailed reference.** DriveCommand replaces ambiguous MotorEfforts while retaining compatibility; public source and bytecode references are present. | **Partially addressed in exposition:** the reference is structurally complete, but the Guide/API still need a novice-legibility review of purpose, call context, terminology, and examples. Public changes must update templates, reference implementations, tests, and active course documents together. |
| Guide and diagrams | Student-facing setup, project, controls, PWA, troubleshooting, challenge, API, and system-overview material, with objective prose and diagrams that show real feedback and branching. | **Partially addressed.** Guide, technical appendix, API page, contextual links, smaller type, and explicit flow diagrams exist. | Replace remaining hand-laid box/arrow or preformatted diagrams with a maintainable diagram-as-code renderer when it materially improves layout (Mermaid or Graphviz/WASM are proposals, not mandates). Continue removing developer-facing, marketing, colloquial, or compressed language. Validate links and comprehension, not only rendering. |
| Visual system and navigation | Compact, high-contrast, modern, consistent UI; color reserved for state/signal identity; one clear Home/IDE/Monitor/Guide/Set up or Repair/API navigation; responsive without hidden horizontal controls. | **Largely implemented.** Shared navigation, compact headers/icons, high-contrast palette, responsive wrapping, and many cited density fixes are present. | **Partially addressed:** conduct a holistic visual/usability pass on one fresh build. DemoActuator was a representative density/sidebar reference, not a style to copy literally. Exact one- or two-pixel requests, individual labels, and cited font sizes are examples of consistency problems rather than immutable design tokens. |
| Local-first/PWA behavior | After one complete online load, apps, simulator, course release, and documentation operate without internet while the laptop joins an XRP hotspot. Project files remain ordinary files in the chosen local folder; students need no Node server. | **Implemented** by the verified offline bundle/service worker and File System Access storage. | **Partially addressed:** explain plainly that browser cache/PWA installation is separate from the selected folder, what survives offline, and what clearing site data removes. Chrome app installation requires browser participation and cannot be silently placed in the project folder. Keep update checks safe for unsaved work and stale course versions. |
| Platform support | Current desktop Chrome/Edge should explain required Web Serial, folder, and local-network capabilities; recent macOS and Windows students should have a workable path. | **Partially addressed** by capability checks and permission guidance. | Current-release Windows/Edge, Chromebook, enterprise-policy, and permission-denial recovery are **unverified**. Full mobile hardware support is explicitly not required. |
| Team version control | Each team should maintain a comprehensible version history without exposing credentials or making Git installation the hidden prerequisite for robot use. | **Partially addressed.** Guide/README recommend one GitHub repository and GitHub Desktop using the same ordinary project folder. | Decide and validate the classroom workflow, pair ownership, pull/conflict recovery, and challenge updates. In-browser credential storage or Git implementation was a hypothesis, not a requirement, and should not be added without a strong simplicity/security case. |

## Instructor and course-maintenance requirements

| Area | Intended result | Current reading | Open substance |
| --- | --- | --- | --- |
| Challenge creation | An instructor can define a new curriculum-appropriate task, student component boundary, supplied files, evidence, and world; generate an unpublished working project; validate it functionally; and publish deliberately. | **Partially addressed.** A browser specification wizard, repository CLI, validation, publication boundary, detailed guide, and complete Waypoint Slalom example exist and have focused tests. | The UI remains split between form fields, raw world/file JSON, and command-line generation. Audit its usability and generality with a genuinely new task. Add visual world editing before calling this a low-friction instructor tool. Structural checks cannot establish pedagogical quality or physical feasibility. |
| Fleet/course updates | Web, robot runtime, challenges, and reference code can be updated during the course without overwriting student work or leaving teams on incompatible releases. | **Partially addressed.** Atomic offline app caching, safe reload gates, transactional A/B robot runtime, project metadata/digests, and explicit challenge publication are implemented. | Separate app-build and robot-runtime compatibility versions; define challenge update/migration behavior for already-created projects; retain rollback and classroom recovery. Forcing use of the live site is acceptable only if student folders are never replaced silently. |
| Multi-robot classroom | Nearby robots are distinguishable and commands cannot target another team's XRP. | **Partially addressed.** Robot IDs are verified and optional team-last-name hotspot SSIDs are implemented. | Test discovery and naming with several XRPs and evaluate a device-specific station hostname. A generic `ucsb-xrp.local` can be ambiguous in one room. |
| Course evidence | Course staff can distinguish student-code, calibration, hardware, network, and service failures quickly during class. | **Partially addressed** through component checks, logs, telemetry, setup logs, and retained hardware records. | Conduct adversarial classroom scenarios: wrong browser profile, denied permission, low motor power, external file edits, two laptops, stale PWA, failed station Wi-Fi, interrupted repair, and bad challenge publication. Recovery must be usable, not merely detectable. |

## Regression history that must not be forgotten

These observations are representative failure classes; several individual root
causes have been fixed, but their workflows should remain in stress coverage:

- Setup reported success while Wi-Fi reachability, robot identity, installed
  module version, or IDE handoff was stale.
- An old service worker or shared worker paired a new page with old assets or
  state; several open clients produced contradictory UI or a blank Monitor.
- Flash, Run, Stop, and telemetry interfered through one small HTTP service;
  lost replies caused repeated or ambiguous operations.
- Writing flash while the program interpreter remained active rebooted the
  controller; a long-lived request log consumed internal flash; an import cache
  made correct installed files look obsolete.
- Monitor Run either had no project, used the prior project, or raced a recent
  IDE edit.
- Selecting a parent folder or recovering a remembered folder exposed unrelated
  repository or sibling-project files and risked writing them back.
- Program output and System log were cleared, duplicated, empty, or disagreed
  between apps after significant actions.
- Slider validation rejected valid floating-point ranges only on MicroPython.
- Raw encoder quantization appeared as jagged wheel-speed plots until a
  regularized estimate was introduced.
- Network and browser permission failures were presented as dead robot, flash,
  or firmware failures.

## Sequencing constraints

1. Finish and retain evidence for current-release native USB repair plus
   station and hotspot browser workflows.
2. Finish latest-project Run coherence and stress the complete project lifecycle
   with default, copied, imported, tutorial, and second challenge projects.
3. Repeat fresh and stale-client visual/browser testing on the single local
   server, then qualify the deployed Pages artifact separately.
4. Freeze that working state with a local commit before broad structural work.
5. Conduct two design audits: the student project/file mental model, and the
   instructor challenge/world-authoring model. These audits should compare
   modern lightweight approaches and observed human behavior, not add more
   validation terminology.
6. Refactor browser and MicroPython code holistically but conservatively:
   centralize state and persistence, remove layered recovery and obsolete
   compatibility only when their support boundary is understood, and preserve
   transactional install, request idempotency, command serialization, run
   leases, and safe update behavior.
7. Measure before optimizing. Pursue low-risk material gains in UI/robot
   responsiveness, memory, Web Serial transfer, folder I/O, telemetry replay,
   and bundle work; do not change appearance or behavior for insignificant
   static-size savings.
8. Re-run full software, native-browser, physical station/hotspot, and visual
   evidence after refactoring. Deploy only the qualified artifact, then test the
   live URL as a separate runtime.

## Explicitly deferred or uncertain directions

- Floor calibration, complete physical execution of all five challenges, and
  motion-induced IMU/range behavior require the final course surface and arena.
- A graphical world editor is desired, but follows stable project/runtime
  behavior.
- Richer code completion, a different embedded editor, or an integrated Git
  client should be adopted only if they materially reduce student friction
  without a large dependency or security burden. Monaco itself is not a known
  defect.
- Mobile export/hardware support is not a release requirement; clear capability
  failure is.
- UF2 firmware-volume repair should be tested on a genuinely incompatible
  controller rather than forcing a destructive artificial case on a correct
  board.
- Exact UI labels and pixel values remain subject to coherent visual design;
  the durable requirement is compactness, clarity, contrast, and consistency.

## Immediate open design questions

1. What single student-visible model best explains the Working folder, named
   project folders, built-in templates, temporary browser copy, autosave, and
   challenge progression?
2. What is the smallest authoritative browser state for current project and
   robot connection, and which recovery records can be deleted after a stable
   baseline?
3. How should app-build, robot-runtime, course-API, and challenge-content
   versions evolve independently while retaining explicit compatibility and
   rollback?
4. How can an instructor create and inspect a complete task world and project
   without authoring raw JSON or concealing important source files?
5. Which documentation structure and diagram renderer best communicate the
   sampled feedback loop, student/supplied boundaries, and challenge progression
   to a novice without turning the Guide into framework documentation?
