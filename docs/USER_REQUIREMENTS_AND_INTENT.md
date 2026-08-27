# UCSBXRP user requirements and intent

## Purpose and interpretation

This document records the substantive requirements, observations, preferences,
constraints, and future ideas expressed during development of UCSBXRP. It is a
design input, not a claim that any item is implemented and not a binary
acceptance checklist.

The source conversation often used a concrete UI detail to point to a broader
problem. Those details are retained, but they should not be treated as the full
scope of review. The recurring request is to examine the surrounding workflow,
language, behavior, and failure modes and make the whole system coherent.

The entries below distinguish:

- **Required outcome:** a result the system is expected to provide.
- **Observed problem:** behavior seen by the user and requiring investigation;
  the observation does not by itself establish the root cause.
- **Design preference:** a strong direction for selecting among valid designs.
- **Proposed mechanism:** a user suggestion to evaluate critically, not an
  architecture decision merely because it was suggested.
- **Environmental fact:** hardware, network, browser, or classroom context that
  affects the design.
- **Deferred idea:** valuable scope that the user explicitly placed after more
  urgent work or described as uncertain.

Where requests evolved, the later intent is presented as the current direction
and the earlier request is noted when it explains a remaining design question.

## Governing intent

### Required outcomes

- UCSBXRP should let undergraduate mechanical-engineering students commission
  an XRP, create or open a project, program it, simulate it, run it on a physical
  robot, inspect telemetry, and understand failures with low friction.
- Instructors should be able to manage the course and create or revise
  challenges efficiently. The system must not require the original developer
  to commission each new robot.
- The IDE, Monitor, simulator, MicroPython package, robot service, course
  projects, documentation, and onboarding are one product. A feature is not
  complete merely because one layer or one happy-path test works.
- Real functionality and comprehensibility take priority over formal process,
  elaborate acceptance machinery, or tests that certify only implementation
  details.
- The implementation should be elegant, modular where useful, technically
  complete, robust to ordinary student mistakes, and simple at the point of
  use. Complexity should be kept inside supplied code when it reduces student
  burden.
- Public interfaces should be stable enough that application updates do not
  routinely break student projects. The current library and its reference
  implementations are first attempts, not immutable authorities; coordinated
  improvements are welcome.
- Visual design should be compact, modern, high-contrast, consistent, and
  information-dense without becoming cryptic. Functionality and usability are
  paramount.
- Documentation and source comments should be objective, technically precise,
  and legible to students with limited programming experience. They should not
  sound like internal developer notes, marketing copy, or abbreviated
  “computer-speak.”
- Validation should be empirical and iterative: design, implement, exercise the
  actual workflow, inspect the result, revise, and exercise it again.

### Design preferences

- Proceed in coherent vertical slices and make a local Git commit at meaningful
  stage boundaries.
- Plan and reconsider the plan when evidence changes the logical dependency
  order. Do not let the plan become an overconstraining harness or a source of
  context bloat.
- Refactor when it materially improves clarity, reliability, or maintainability,
  especially after a known-working baseline is recorded. Code read by students
  should favor straightforward names and control flow over clever abstraction.
- After core behavior is stable, assess performance and memory use cautiously,
  preserving behavior and appearance unless a deliberate product change is
  warranted.
- Treat the user’s examples as indicative. Review analogous elements and nearby
  behavior rather than making only the literal pixel or label change named.

### Process and motion context

- The user considers the small battery-powered XRP intrinsically innocuous in
  the supervised setup and explicitly rejects motor locks, safety tiers,
  thresholds, handovers, repeated confirmations, and other formalities that
  obstruct development or classroom use.
- During development the robot is elevated with its wheels clear, observed by
  an experienced user, and motor power may be enabled. Motor, encoder, and
  telemetry tests are expected, with ordinary bounded engineering care.
- Tests should end in a sensible stopped state, but product workflow should not
  impose ceremonial safety barriers on students or instructors.

## Working priority and dependencies

### Immediate functional priority

1. Make commissioning and recommissioning repeatable on a new or already-used
   RP2350 XRP.
2. Establish a single, comprehensible connection state shared by onboarding,
   IDE, Monitor, and robot service; eliminate stale station/hotspot addresses and
   contradictory readiness states.
3. Exercise full physical workflows repeatedly: commission, open the default
   project, validate, flash, run, stop or complete, rerun, load another project,
   flash, run, and inspect motors, encoders, telemetry, logs, and cross-app state.
4. Exercise the corresponding virtual workflows and verify that simulation,
   plots, world view, run state, and output remain coherent.
5. Repair project/folder persistence so an unrelated repository or a previous
   course folder can never silently appear as the active student project.

### Next integrated priority

- Remove navigation, state, terminology, and logging friction across all apps.
- Make challenge projects, component checks, tutorials, Guide, API reference,
  and instructor challenge creation genuinely usable by their intended readers.
- Complete project-owned world configuration and the course/library features
  already exposed in the product.
- Validate the packaged local-first application and live GitHub Pages version,
  including behavior after leaving the internet-connected network.

### Later work after a stable baseline

- Perform a comprehensive but conservative web and MicroPython refactor,
  pruning layered recovery code and unused resources where evidence supports it.
- Profile or assess browser execution, memory, telemetry, and robot-service
  performance without changing appearance or functionality accidentally.
- Develop richer world editing and visual challenge aids.

## Hardware, computer, network, and browser context

### Environmental facts

- The physical robot is the current SparkFun XRP using the RP2350. It was new,
  assembled, flashed with the appropriate base firmware, and observed to
  dismount and remount normally.
- The robot connects to the Mac by USB-C. macOS permissions have been granted
  for both the firmware-volume mode and normal device mode.
- A reset header has been connected to GPIO15 as a possible software-reset path.
  The user has also pressed RESET and BOOT when troubleshooting. Software reset
  should be used only if it is actually effective for the relevant failure.
- Motors have worked in prior tests, including the expanding-spiral project.
  Motor batteries were later replaced with fresh cells. Intermittent subsequent
  failures therefore require software, connection, state, and power diagnosis
  rather than assuming low-level motor support never worked.
- The robot is elevated during motor tests, so encoder and wheel motion can be
  observed but physical pose and obstacle-distance changes caused by travel
  cannot be inferred from those tests.
- The principal development computer is a 2023 M2 Pro Mac laptop running macOS
  Tahoe 26.3.1(a). The user also expects recent Windows laptops in the class and
  wants ordinary version differences handled where practical.
- The user observed Node.js 20.0.2 in their shell. Student use of the published
  browser application should not depend on a local Node server or Node
  installation.
- Chrome is the primary browser for Web Serial, folder access, and visual QA.
  Chrome local-network access may require both browser-site permission and
  macOS Privacy & Security permission. Several local ports have existed; the
  development workflow should keep a stable port to avoid repeated permissions.
- Safari and Chrome on iOS failed for some export and hardware flows. Full mobile
  support is not required, but unsupported behavior should fail clearly rather
  than appearing to work. Chromebook behavior may matter later.
- At home, both Mac and XRP can use the 2.4-GHz-compatible network `Pink`. At
  UCSB, the computer uses `UCSB Secure`; the XRP hotspot provides no internet to
  the computer. Credentials were supplied separately for testing and should not
  be committed to the repository.
- The robot hotspot uses an address in the `192.168.4.x` network; station mode
  on `Pink` has used `192.168.7.x`. Those addresses are contextual observations,
  not permanent identifiers.

### Required outcomes

- Support two physical runtime topologies:
  - XRP and laptop on the same ordinary Wi-Fi network; and
  - the laptop joined directly to an XRP access-point hotspot.
- USB-C is the commissioning and repair path and may be used for initial
  software installation. Normal project flashing and runtime telemetry may use
  the robot’s Wi-Fi service once it is configured.
- The system must make the required network transition explicit, preserve
  progress while the internet is unavailable, and confirm when the robot is
  reachable. It must not strand a developer or student on a network without a
  clear return path.
- Hotspot SSIDs must be broadcast and distinguishable when many robots are in
  one room.

## State, settings, and persistence architecture

### Required outcomes

- There should be one authoritative, intelligible representation of current
  workspace/project state and one authoritative representation of current
  physical connection state. Commissioning, IDE, Monitor, and landing page must
  not reconstruct incompatible interpretations from layered browser caches,
  recovery records, defaults, and stale tabs.
- The active robot connection should include the current mode, reachable
  endpoint, network identity where relevant, installed course release, and
  flashed-project readiness. Connected, course-software-ready, project-flashed,
  and program-running are different states and should be represented clearly.
- In settings, describe the runtime link literally (for example, `Telemetry
  Wi-Fi to XRP`) and group the physical XRP address with that link. A generic
  `Robot connection` label can incorrectly imply that USB project transfer and
  Wi-Fi telemetry are the same operation.
- The active course folder, active project subfolder, project identity, file
  list, and autosave destination should be unambiguous and shared by the
  features that use them.
- A fresh page must never expose files from the UCSBXRP source repository or a
  previously selected unrelated directory as the student project.
- A newly selected course folder must supersede an old folder everywhere. The
  browser should not unexpectedly request access to the previous folder when a
  built-in project or tutorial is opened.
- Recovery behavior should be small, explicit, and subordinate to ordinary
  project state. It should not create several competing notions of the current
  project.

### Proposed mechanism requiring evaluation

- The user proposed storing settings such as folder names and physical endpoint
  in one common file on disk, with simple write/read behavior, rather than
  layering fixes on browser-state problems.
- The desired outcome is a simple source of truth. The implementation must still
  account for browser permission boundaries, loss of file handles, use without a
  selected folder, and the fact that a browser cannot silently write arbitrary
  local files. A small project/course metadata file plus a minimal browser
  bootstrap record may be appropriate, but the mechanism must be evaluated
  rather than adopted dogmatically.

### Audit request

- Examine the entire codebase for layered “recovery” mechanisms, duplicated
  persistence, state races, stale-address fallbacks, and one-off patches that
  conceal a design problem.
- Prefer deletion and simplification after recording a working baseline. Do not
  add another handoff flag or cache tier merely to make one observed transition
  pass.

## XRP setup, commissioning, repair, and network configuration

### Required workflow

- Setup/repair is accessible from the landing page and from IDE settings.
- The same workflow commissions a new robot and idempotently verifies, repairs,
  or updates an existing one.
- It should:
  1. explain the browser and USB requirements in student language;
  2. prompt the user to attach the XRP by USB-C;
  3. use Web Serial to identify the XRP and enter its MicroPython REPL;
  4. efficiently verify the RP2350 controller, MicroPython runtime, installed
     course files, and release versions;
  5. install, update, or repair only what is needed;
  6. configure the selected network mode;
  7. reset the XRP and verify the installed runtime;
  8. verify the Wi-Fi telemetry/service path when possible;
  9. transfer the verified connection state to the IDE and select the physical
     XRP target automatically.
- If the browser already has permission for exactly one recognizable XRP, show
  that device by name and ask the user to confirm it. “Choose another XRP” may
  open the browser picker. Do not announce “No XRP was selected” before the user
  has been asked to select one.
- Keep the diagnostic log collapsed by default but available during connection,
  installation, restart, and network verification. The visible progress text
  should tell the user what is happening and what action, if any, comes next.
- Verify that the chosen folder is writable when a folder is needed, create a
  small setup log there, and expose useful diagnostics and relevant operating-
  system permission guidance.
- Users must be able to move backward, exit repair, and reopen the IDE without
  becoming trapped in an incomplete wizard state.
- Delays caused by restart or network association should be as short as the
  platform permits, event-driven where possible, and explained while occurring.
  Eight- to twenty-second unconditional waits are not acceptable as routine UX.

### Network choices

- Present choices in terms of the result the student understands:
  - keep the currently installed Wi-Fi configuration when it is valid;
  - put the XRP on a specified local Wi-Fi network; or
  - use the XRP’s own hotspot.
- Do not show “existing network” and “hotspot” as redundant choices when the
  existing configuration already is that hotspot. Preserve an existing profile
  only when the user has chosen to keep it; commissioning should not
  accidentally carry forward an unwanted stale configuration.
- In station mode, select or enter the network and verify the address actually
  reported by the robot. In access-point mode, instruct the user explicitly when
  to join the XRP network and wait for a positive reachability result before
  presenting the robot as ready.
- The wizard should offer this compact optional field:
  “Provide a team member’s last name as a unique name for robot WiFi hotspot
  (optional),” rendered as `UCSB-XRP-<NAME>`. Validate and normalize the suffix
  predictably without adding a complicated naming workflow.

### Observed problems requiring regression coverage

- A wizard run successfully verified the robot on `Pink` at a station address,
  then the IDE immediately reverted to the stale hotspot address
  `192.168.4.1`. The user considers this a longstanding design defect rather
  than merely a timing race.
- Toggling between router and access-point modes has sometimes corrected an IDE
  that retained the wrong address. This is evidence of conflicting connection
  state, not a recommended recovery procedure.
- Setup has stopped at “Verifying installed files” with an installed-runtime
  mismatch, including repeated same-release repair failures.
- After restart, network verification has produced many three-second retries and
  long unexplained pauses before eventually succeeding.
- Hotspot commissioning has sometimes left the SSID absent, the Mac on the wrong
  network, or the IDE unable to run a project even though installation appeared
  successful.
- The automatic return to the internet-providing network has not been reliable.
- Setup/repair opened from IDE has sometimes skipped the course-folder stage or
  made the exit path unclear.
- A long delay after clicking IDE from the wizard looked like a broken link.
- The initial-flash path has failed and then succeeded on retry without a useful
  explanation.
- Installation logs have repeated identical connection, validation, flash, and
  service messages. Preserve useful low-level output, but deduplicate events and
  add enough context to distinguish a retry from a duplicate rendering.

## Project and folder model

### Required outcomes

- Use one course working folder as the parent for independent project folders.
  The IDE should display the active project as a clear relative path such as
  `./ExpandingSpiralLocal`, where `.` denotes the selected course folder.
- Unify or eliminate the terms “Working Folder,” “Local Folder,” “Project
  Folder,” “Project files,” “workspace,” and “browser recovery.” Each retained
  term should refer to exactly one concept and be explained in student language.
- A built-in template is immutable source material; beginning work from it should
  create an ordinary local project folder automatically when local folder access
  is available. The workflow should not make students guess whether they must
  click Save or make a copy before editing.
- Creating a project from a template should prompt for a project-folder name,
  create that subfolder, populate it, select it, and autosave thereafter. It
  should not require a separate Save operation.
- Opening a folder should deliberately replace the file browser and associated
  tabs after handling unsaved in-memory work clearly.
- Autosave source files, telemetry recordings, setup logs, and relevant text
  output to predictable locations within the active project or course folder.
  Keep a small number of rotated autosaves (the user suggested four) rather than
  silently overwriting the sole recovery copy.
- Show the current project name or identifier in a useful status location. A
  project title may be explicit or derived predictably from the folder name.
- In the file sidebar, use `Project files` as the compact section heading, show
  the relative project-folder name above the list, and omit a repeated project
  title and `Main file: main.py` sentence when the file list already marks the
  main file. Keep file actions below the list and use thin separators rather
  than nested cards or tall heading bars.
- Offer file import. Use literal action names such as Duplicate instead of Copy
  if duplication is meant, and Make Main instead of a context-free Main.
- Evaluate whether Save, Rename, Change folder, and a “go to project folder”
  action are actually useful. Omit controls that add ambiguity without serving a
  normal student workflow.

### Observed problems

- A newly loaded live IDE has intermittently listed repository files such as
  `AGENTS.md`, implementation prompts, and service source instead of the default
  project. This must never be possible in an ordinary student session.
- Opening the MicroPython foundation project has unexpectedly requested renewed
  access to an old course folder.
- Creating a copy of the default spiral project has attached it to the old
  `xrp_test_2` course folder after `xrp_test_3` was selected.
- Project/folder labels and “browser recovery” appear redundantly in several
  panels, obscuring which state is authoritative.

## IDE behavior and interface

### Core behavior

- Support setting the course folder, creating and importing files, creating a
  project from a template, opening a project, editing, autosaving, explicitly
  saving when useful, selecting the main program, validating, flashing, running,
  stopping, resetting, inspecting program output, and debugging.
- Run should validate automatically when the current code has not been validated
  or has changed. Continue if validation passes; show the specific failure in
  output if it does not. Avoid stale text such as “No run yet” after a successful
  run.
- Rename Sync project to Flash robot or Flash project. USB setup/repair and Wi-Fi
  project flashing are different concepts. The UI should distinguish robot
  connected, course software verified, project flashed, and program ready.
- In physical mode, Run should start the program directly without requiring the
  physical USER button when the service can do so reliably.
- The run control should become Stop while running and return to Run when the
  program stops or completes. Reset and Run availability must track actual
  state, not get stuck after one completed run.
- The default project on first retrieval should be the straightforward expanding
  spiral demo, with two compact live parameters for winding rate and forward
  speed and an obstacle-distance stop. The requested nominal winding rate is
  1.2 turns/m with a useful wider slider range.
- Include a simple demo that drives forward until the ultrasound sensor reports
  a nearby obstacle, turns left, and continues until another nearby obstacle is
  detected.
- A Project selector may group demos, challenges, and tutorials, but those
  categories should be retained only if they help students understand the
  content.
- Render project `README.md` files as Markdown by default and allow direct source
  editing. A README/Guide action should open clear getting-started or robot-setup
  guidance in a useful tab.

### Editing and debugging

- Code font size must be adjustable with a minimum of 8 px; the default should
  be compact (the user repeatedly observed it as roughly two points too large).
- Tabs should work visibly. Do not prefix `.py` filenames or tab labels with
  redundant `PY` badges.
- Use normal Python comments for explanatory prose. Triple-quoted strings should
  not be presented as the default way to comment code.
- Student loops should use the supplied periodic execution mechanism rather than
  manual `print` counters or arbitrary `sleep_ms()` statements for regular
  sampling. Explain the timing model and why extra sleeps disrupt it.
- Provide useful debugging beyond ad hoc `print`: persistent program output,
  full system/terminal log, watch values where technically feasible, component
  checks with interpretable results, and student-published telemetry variables.
- Logs should append across validation, flash, run, completion, reset, and
  reconnect events until the user explicitly clears them or rotation occurs.
  Earlier messages must not disappear at program completion.
- “Status,” “Details,” “Program output,” and “System log” should be reorganized
  around distinct information. Avoid redundant headings and empty tabs. All
  background details needed for diagnosis should remain accessible.
- If a Status view remains, identify the project first, then target and
  connection state; explain any fallback storage rather than repeating a terse
  `Browser recovery` label. The view should not be open by default merely to
  display redundant state.
- Component checks should expose only what students need. Explain exactly how to
  run them and interpret results, with real use examples. An unimplemented or
  incorrect component should not be labeled merely Pending when Failed or Not
  implemented is the accurate state.

### Visual and interaction requirements

- Use a collapsible settings panel. Settings belongs at the far right of the top
  bar and should not cause title or navigation overlap.
- Use a common compact navigation bar across landing page, IDE, Monitor, Guide,
  Setup or Repair, and API. The later request favors explicit small navigation
  actions because an installed browser app has no normal Back control.
- Earlier iterations asked IDE and Monitor links to open in separate tabs with a
  diagonal-arrow cue. The underlying outcome is that navigation must not destroy
  useful working state and must clearly communicate whether it reuses or opens a
  view; the common navigation design should resolve this consistently.
- Do not hide Monitor or Guide in an unmarked horizontally scrolling header on a
  narrow window. Wrap, condense, or use a clear responsive menu.
- Top-bar controls, links, and status text should use smaller consistent type and
  roughly two pixels less control height. Run and Reset should be compact icons
  with clear tooltips; use a small gap to the left of Run. Use black rather than
  decorative blue for action icons and checkboxes.
- Use the title `UCSBXRP` with `UCSB` in UCSB blue and `XRP` in the established
  muted gray-red. An earlier request used `UCSBXRP | IDE` and
  `UCSBXRP | Monitor`; after explicit navigation buttons were added, the user
  judged `| IDE` and `| Monitor` redundant.
- Use white panel backgrounds, light-gray buttons, black enabled text, gray
  disabled text, compact spacing, and simple separator lines. Avoid nested inset
  cards, decorative frames, inconsistent fonts, oversized bars, and unnecessary
  color.
- Preserve the code editor’s existing high-contrast background and text colors
  unless visual testing identifies a concrete readability problem.
- Keep line numbers compact. Prevent label clipping and text overflow in controls
  such as Open folder and the Virtual/Physical XRP selector.
- Provide brief, accurate hover hints for controls. Labels must state behavior:
  Validate rather than Check, Zoom XRP rather than Inspect XRP, and so on.
- Expanded menus should normally close when the user clicks outside them.
- Remove redundant or developer-facing labels such as `Project loop API`,
  `Starts with main.py`, ambiguous `Startup`, duplicated autosave text, and
  button-like offline status indicators.
- Remove unused blank rows at the bottom of the IDE and Monitor.

## Monitor behavior and interface

### Core behavior and synchronization

- Monitor should be the product name and route name; the persistent `/dashboard/`
  route is confusing.
- IDE and Monitor must share target, active project, run state, live controls,
  virtual state, physical telemetry, world state, and relevant logs. It is not
  acceptable for IDE to report Physical XRP ready while Monitor reports an
  error, or for one app to run without the other receiving output and telemetry.
- A newly opened Monitor in virtual mode must be able to run the active default
  project immediately, even if Run has not first been pressed in the IDE.
- Run/Stop must work consistently from Monitor and reflect completion. Reset
  should reset the chosen target, not merely its drawing.
- Program output and the complete system log should have one clear home rather
  than independent contradictory copies. A later preference was to remove the
  duplicate output/log panels from Monitor and make the IDE log authoritative,
  while keeping live telemetry and world behavior in Monitor.

### Layout and visual structure

- Use a compact left Controls panel, central World/plots/output area, and a
  narrow right Live telemetry area with resizable boundaries where useful.
- Live controls should be permanently open immediately above Live telemetry in
  the same right-hand panel. The `Live controls` label and student-defined
  controls should use the same restrained green accent.
- Rename `Display & data` to `Controls`, `Signals` to `Plot signals`, and `Live
  values` to `Live telemetry`.
- Keep the world selector and Zoom XRP compact in the title area to the right of
  World. They must not overlap the grid or clip their option text.
- Use thin, dark, consistent panel separators. Remove redundant thick borders
  plus inset thin borders around plots, program output, live telemetry, and
  subpanels.
- Use smaller, consistent body type in the Controls panel and compact sliders
  like those in the referenced DemoActuator project. Do not reproduce that
  project’s low contrast, excessive whitespace, or overly terse labels.
- Remove unused headings and bars, including `Scrolling signals`; put essential
  labels close to the data rather than in tall title strips.
- Remove Monitor-only controls that do not serve monitoring, including
  `Execution target` and `Course environment`, when the shared target selector
  already provides the state.

### Live telemetry

- Use unambiguous physical terms and units. Prefer `yaw rate` to `angular rate`.
  Replace ambiguous `motor effort` with a term that states whether the value is a
  normalized motor command, voltage fraction, PWM command, or measured quantity.
- Explain or remove `seq`. Explain collision as a state if it remains. Do not
  present range twice in the world and telemetry panels without distinct
  meanings.
- Include button state, motor-supply state or voltage where available, IMU
  temperature, and encoder counts at the bottom, separated visually from the
  primary live values.
- Include wheel distance as a plottable variable. Telemetry sample rate and
  recording capacity should be clear; retained data should cover at least three
  minutes, with file streaming considered if it removes an arbitrary 30,000-
  sample ceiling.

### Strip plots

- Each selected signal keeps the same vertical pixel height as signals are
  added or removed; do not compress all traces into a fixed panel height.
- Label each axis compactly with variable and units. Add one unlabeled minor
  vertical time-grid line between numbered major lines.
- Reduce dead space between plot, axes, legends, and neighboring plots. Fix
  anti-aliasing or scaling artifacts in legend glyphs.
- Provide an explicit Clear plots action. Clearing a plot should not be an
  unexplained side effect of target reset.
- Wheel speed, encoder-derived quantities, and odometry-related plots must be
  physically meaningful and visually smooth at the relevant bandwidth. Jagged
  oscillation caused by differencing quantized encoder ticks or irregular sample
  intervals is a defect, even if the rendered path looks smooth.
- `Odometry position error` should be plotted only if a defined reference exists
  and the label explains it. A virtual robot without an external pose reference
  should not imply a GNSS-like measurement without explanation.
- Provide a library API through which student code can publish a named numeric
  variable with units for plotting. Each published variable appears as a compact
  unchecked green checkbox alongside built-in signals.

### World view

- The grid must be clipped to the world bounds and provide labeled coordinate
  values directly on the grid; do not add a detached or misaligned ruler.
- Use MKS units where suitable; millimeters are acceptable for robot-scale
  distances when labeled consistently.
- Center and display the virtual XRP in the default world even before a published
  pose is available, so the feature is discoverable.
- Render the XRP with dimensions and proportions close to the physical SparkFun
  robot. Use one dark gray chassis shade rather than decorative two-tone gray.
- Add a very small legend: green path line and brown-yellow ultrasound/range ray.
  Remove redundant labels such as `Virtual pose` and world-space `range` when the
  live telemetry panel already reports the measurement.
- Keep world controls outside the grid. The world preset dropdown should be
  compact and readable.

## Simulator and physical-runtime behavior

### Required outcomes

- The same student MicroPython project and public UCSBXRP API should operate on
  virtual and physical targets with target-specific hardware boundaries hidden
  in supplied code.
- Virtual behavior should be deterministic enough for repeatable debugging, but
  documentation should explain that in ordinary student language rather than
  using the unexplained phrase “deterministic simulation.”
- Motor commands, encoder counts, range sensing, button state, IMU values, pose,
  program completion, and errors should propagate through telemetry consistently.
- Physical telemetry rate should be increased substantially if measurement shows
  the RP2350, service, and network can sustain it without impairing control. The
  user suggested four times the earlier rate as a target, not as an unconditional
  requirement.
- Connection, flash, run, reset, and completion should not rely on arbitrary long
  sleeps when device acknowledgements or state transitions can be observed.

### Observed problems

- The expanding spiral ran virtually but initially failed physically because the
  live-number parameter validator demanded that a range contain an exact whole
  number of steps. The user correctly identified that normal numeric conversion
  and tolerant range handling are preferable to rigid floating-point arithmetic
  validation. Similar validators should be audited.
- Physical Run has sometimes produced no movement even after flash, while a
  subsequent attempt moved the robot. Intermittent success is not sufficient
  evidence that the lifecycle is reliable.
- Motor actuation, encoder response, and telemetry worked in earlier revisions
  and later regressed or became intermittent. Investigate end-to-end state and
  runtime changes rather than treating each success as final validation.
- Virtual wheel-speed and odometry plots developed abrupt, jagged artifacts even
  while the path remained smooth. The user hypothesized that speed should come
  from a regularized estimator associated with sensor interpretation or
  odometry, not a raw discrete derivative of scaled ticks. The ownership and
  estimator design require engineering analysis.

## UCSBXRP MicroPython API and student code

### API intent

- Provide a small, coherent API that removes repetitive hardware setup,
  scheduling, telemetry, and connection work while leaving the course concepts
  visible in student code.
- State exactly which functions, classes, services, and utilities students can
  call from `main.py` and from their component modules.
- Do not use `contracts` as the pedagogical term for interface requirements.
  Prefer plain terms such as component behavior, required methods, inputs,
  outputs, and responsibilities.
- Types such as `MotorEfforts` must be introduced in physical terms and tied to
  the course architecture, or renamed if they merely expose an implementation
  detail. The user repeatedly found `motor effort` ambiguous.
- Document the base classes and supplied classes with standard API information:
  purpose, data flow, state maintained, constructor parameters and types,
  method parameters and types, return values and types, important side effects,
  and errors or preconditions only where they matter.
- Explain each class in its physical and course context before presenting an
  abstract signature. For example, explain where target and measured wheel
  speeds originate and how a controller uses their difference before listing
  `WheelSpeedController` methods.
- Avoid crowded administrative headings such as Owns, Maintains, Used by,
  Receives, Provides, and jargon such as consumes. Use a flatter,
  purpose-oriented structure.
- Do not lead with minor conventions or unexplained claims such as “requires no
  persistent error state.” Define technical terms in place and introduce inverse
  kinematics only with the mechanical meaning students need.
- Include high-level student-facing API documentation and a detailed reference,
  with contextual links from the IDE where practical. Maintain a reviewable
  `USER_REFERENCE.md` or equivalent source.
- Assertions on entry or exit may be useful inside supplied base classes when
  they produce a direct student-facing error. They were suggested as a possible
  aid, not as a requirement to add formal checks to every method.
- Keep inline code type approximately the same visual size as body text.

### Loop timing, live controls, and published data

- The supplied runtime should establish a regular sample period. Student code
  should not need explicit sleeps to maintain rate, and the Guide should
  highlight and explain precisely why adding `sleep_ms()` to the recurring loop
  is normally wrong.
- Logging measurements with repeated `print` statements and counters should not
  be the normal telemetry mechanism.
- Student code should be able to declare a small set of live-adjustable numeric,
  boolean, or enumerated parameters. The UI should generate compact thin
  sliders, toggles, or radio controls, validate values sensibly, and synchronize
  changes while the program runs.
- Numeric parameter declarations should accept ordinary integer/float inputs and
  handle floating-point step ranges tolerantly. Reject only values that cannot
  be represented or used meaningfully; do not demand an unrealistically exact
  integer quotient.
- Student code should be able to publish named variables with units for optional
  plotting using a similarly low-friction API.

### Module clarity and reuse

- Rename vague or misleading files such as `student_components.py` when a more
  literal name such as `student_modules.py` better describes the contents.
- State for every student/supplied module what it is responsible for, what data
  it receives, what it returns, what state it maintains, and how other modules
  use it.
- Students should not have to copy and paste their earlier completed classes into
  each later challenge. Design a legible reuse/progression model while retaining
  the ability to switch individual reference and student implementations.
- Reference bytecode implementations may be supplied, but they are not the
  normative design if a clearer API or implementation is found.

## Challenges, tutorials, and instructor authoring

### Challenge projects

- Every challenge includes a rendered README that:
  - describes the task objectively and narratively;
  - states the observable goal without prescribing an unnecessary algorithm;
  - identifies exactly what students implement;
  - identifies supplied modules used by the project;
  - describes the inputs, outputs, and expected behavior of each student module;
  - gives a concise program-flow diagram when it materially aids understanding;
  - derives numeric task settings from the project configuration rather than
    duplicating fixed values that can drift from parametric `challenge.py` data.
- Challenge prose must be written to the student, not as notes between framework
  developers. Examples must actually demonstrate how to use the relevant code.
- Challenge 4 should not hard-code “find a shortest four-neighbor path” unless
  shortest-path optimality and that motion graph are intentional learning
  objectives. Phrases about frontier data structures, tie-breaking rules, or
  “neighbors” should not be included merely to constrain implementation.
- Component-check output and source should be minimal, interpretable, and tied to
  the challenge. Hide framework plumbing that students do not need to read.
- Visual aids generated from the simulator—such as a short sequence of annotated
  world thumbnails—may later make challenge behavior easier to understand.

### Python and MicroPython tutorial

- Provide a substantial, technically precise, student-facing tutorial project,
  organized into clearly named files covering the Python concepts needed in the
  course (for example variables and functions, classes, exceptions, and finite-
  state machines).
- Use the virtual XRP as a drawing or mobile-robot context where it improves the
  tutorial, so programming concepts lead naturally into later projects.
- Take inspiration from exceptionally clear university-level Python materials,
  while retaining UCSBXRP terminology and writing original course-specific
  explanations.

### Instructor challenge creation

- Provide a highly legible, general instructor interface for creating a new
  challenge without editing framework internals.
- It should support the challenge description, parameterization, student and
  supplied modules, initial project files, world configuration, component checks,
  and preview/testing in an extensible format.
- Test the authoring interface by designing a plausible new course challenge;
  it need not become one of the canonical five.
- Instructor documentation should include a complete, formatted, working
  example and explain how generated artifacts relate to the student project.
- Link the tool unobtrusively near the bottom of the landing page as `challenge
  creation wizard`. A second technical-overview link was requested earlier; a
  later preference is to incorporate that overview as a Guide appendix and avoid
  a redundant landing-page link.
- Longer term, more than one instructor should be able to make challenges without
  requiring Codex or direct edits to internal framework code.

## Project-owned worlds and future world editor

### Required direction

- World configurations belong to a project and should be visible with its files,
  not hidden as opaque application-global JSON.
- A world must represent arena walls, interior walls or rectangular obstacles,
  non-obstacle markers, waypoints, start and stop lines or timing gates, and
  start/stop boxes, with properties and units where needed.
- The same configuration should drive simulation, Monitor rendering, challenge
  preview, and documentation thumbnails.

### Deferred interface idea

- Provide a direct visual world editor using the Monitor canvas or a closely
  related view. A compact item palette and property editor should let an
  instructor place, move, size, and remove the supported world objects without
  hand-authoring JSON.
- This was explicitly described as valuable after basic commissioning, project,
  and physical-runtime functionality is dependable.

## Guide, API reference, and general documentation

### Student-facing Guide

- Use the simple title `Guide`; remove pre-titles such as `Course tools and
  workflow` and remove `student` from the title.
- Use approximately 11-point body text with inline code visually matched to body
  size. Current Guide and API typography has repeatedly appeared much too large.
- Organize around tasks and concepts a first-time student actually needs:
  browser requirements, initial setup, project model, virtual workflow, physical
  workflow, Validate, Flash, Run, Stop/Reset, telemetry, debugging, course API,
  challenges, tutorials, version control, offline behavior, and troubleshooting.
- Use concise lists when they communicate actions better than tables. Validate,
  Flash, Run, and Stop should not be an unexplained table under a `Physical XRP`
  heading.
- Replace ambiguous or colloquial phrases such as “five starters,” “simplest
  course workflow,” “work normally,” “no workspace is connected,” “small,
  coherent change,” “browser only,” and “current desktop Chrome or Edge” with
  explicit descriptions.
- List demos, challenges, and tutorials rather than referring to them through
  abbreviated counts.
- Avoid redundant unit notes and avoid text addressed to the instructor or the
  developer conversation.
- Rename `Course API` to `UCSB XRP API`. Link from the high-level explanation to
  the detailed reference.
- Explain the supplied loop schedule and the no-extra-sleep rule prominently and
  precisely.
- Review every title, link, callout, and new paragraph for student legibility;
  this is a global requirement rather than a request to fix only cited phrases.

### Diagrams

- Diagrams should show real relationships and correct arrows rather than a row of
  decorative boxes. `main.py` may be shown as mission coordination, connected to
  student modules, supplied services, target boundary, telemetry, and robot or
  simulator as appropriate.
- Use maintainable native web diagrams—structured SVG or a small diagram
  component/specification—rather than hand-positioned labels that break at
  responsive sizes.
- Clicking a diagram element should go to the relevant explanation or do
  nothing; it should not jump to an apparently unrelated location.
- Integrate the technical overview as an appendix or deeper Guide section when
  that produces a clearer information hierarchy.

### Detailed API reference

- Remove marketing-style pre-titles and oversized green labels.
- For each public class/function, provide ordinary reference documentation:
  purpose, constructor, parameters, types, return value and type, units, state,
  side effects, and a real example where useful.
- Required behavior statements need context and should be phrased as observable
  component behavior rather than terse administrative rules.
- Explain SensorModel speed estimation explicitly, including raw samples,
  encoder increments, smoothed speed, and the downstream users of each result.
- Explain wheel-speed control as comparison of a target wheel speed with an
  estimated actual wheel speed that produces bounded motor commands; do not rely
  on an opaque one-sentence signature.
- Apply equivalent purpose and data-flow clarity to DifferentialDrive, Odometry,
  NavigationController, GridPlanner, base classes, supplied services, numerical
  helpers, and utilities.

### Other documentation

- Revise `SYSTEM_DESIGN.md`, setup instructions, status text, challenge READMEs,
  source comments, and mouseover help to use the same literal terminology.
- The previously created remaining-hardware/network setup document was judged
  too cumbersome. Remove unnecessary safety tiers, check conditions, musts,
  thresholds, and user confirmations; replace them with the minimum concrete
  setup instructions needed to proceed.
- Add clear, concise technical comments to student-visible source where they
  explain a non-obvious mechanical or programming idea. Do not narrate obvious
  syntax or bury students in framework implementation details.

## Landing page and global navigation

### Required content and visual direction

- Use `UCSB Wheeled Robotics` in blue rather than `UCSB Mobile Robotics` in
  green.
- Use the subtitle `Program, Simulate, and Run Live Telemetry for the XRP robot`
  at substantially smaller size than the earlier hero text.
- Remove uninformative lines such as `Challenges 1–5 • Virtual + physical XRP`
  and evaluate whether `Start in the IDE` adds anything.
- Add a small left margin so content does not touch the browser edge.
- Place setup/repair on a separate lower row with visible vertical separation and
  label it `Open wizard for XRP initial set up or repair`.
- Explain browser compatibility and application installation early without
  overwhelming the landing page.
- Change `Install app for offline use (optional)` to `Install app for offline use
  — strongly recommended`, or install automatically when the platform genuinely
  permits a permission-free, non-disruptive path. Explain what installation
  changes before replacing the browser window with an app window.
- Distinguish installation of the browser app from installation of course
  software on the XRP. The earlier `Install course tools` action appeared to be
  optional because the same links were already usable, then reopened the landing
  page in an installed app window without explaining the transition.
- Prefer `Guide and overview` to an ambiguous `Getting started` label if it links
  to both introductory and architectural material.
- Use the common navigation actions Home, IDE, Monitor, Guide, Set up or Repair,
  and API across the suite.

## Local-first/PWA behavior and browser requirements

### Required outcome

- `Local-first` means the application is retrieved once from GitHub Pages and can
  subsequently operate without further application-server exchange, including
  after the laptop joins an XRP hotspot with no internet.
- The cached application must include the code, UI assets, current course
  release, templates, simulator, and documentation needed for normal work.
- On an internet-connected launch it should check for an updated release without
  unexpectedly breaking an active project. Updating application code and
  student project files are separate operations.
- Folder access is optional for opening the application but expected for the
  normal course workflow. If unavailable—for example on a phone—the virtual app
  can still demonstrate what the platform supports, with unsupported persistence
  and hardware features identified clearly.

### Required explanation

- Replace vague indicators such as `Offline ready`, `App cached`, `Saved for
  offline use`, `Works without internet`, and `Available without internet after
  one complete load` with a concise state plus a link to a precise Guide section.
- Explain that PWA/service-worker installation is browser-managed and is not a
  copy of the application inside the chosen course folder. State what works
  offline, what still needs browser storage/permissions, what can be lost if site
  data is cleared, and how to reopen the installed app.
- Do not tell students “the browser is on localhost or HTTPS.” Say that folder,
  serial, service-worker, and local-network features require a supported browser
  and a secure origin, then explain what the published site already provides.
- Detect unsupported browsers/features before the user reaches the failing step
  and offer useful guidance. Do not assume students run a local development
  server.

## Data recording, export, and annotation

### Required or strongly desired features

- Record telemetry to the active project folder when permission is available,
  with clear sample period, duration, file name, and status. Avoid adjacent
  redundant headings such as `Recording` and `Recorder ready`.
- Allow export of every strip plot in a broadly usable data or graphics format.
- Allow export of the world animation, at least for virtual runs and preferably
  for replayed telemetry, as WebM or another widely supported format.
- Give export its own compact, comprehensible section. A control must say Export,
  and encoding progress must state whether the simulation is replaying or a
  captured recording is being transcoded.
- Support both an explicit post-run export and, if useful, an option to record
  animation while telemetry recording is active. If no writable folder exists,
  use a normal save prompt rather than opening an unusable blob URL.
- Provide compact plot/world annotations, ideally by invoking a context action at
  a specific time or point, entering a short label in place, and toggling all
  annotations from Controls. Avoid a large, clunky annotation form.

### Platform boundary

- Mobile Safari and iOS Chrome opened an unsupported blob video in a new tab and
  then lost the export action. Full iOS export support was explicitly not
  required, but capability detection and a clear unsupported message are
  preferable to this failure.

## Version control and collaboration

### Desired outcome

- Student pairs should maintain one version-controlled project repository per
  group. The workflow should not assume Git is preinstalled on recent Windows or
  macOS machines.
- Evaluate the lowest-friction modern approach, likely GitHub-backed, for
  creating a group repository, saving meaningful revisions, and recovering
  work. Explain the workflow in student terms rather than saying “use the same
  project folder for the IDE and Git.”
- Do not store raw GitHub credentials in project files or insecure browser
  storage. If browser-mediated GitHub integration is added, use an appropriate
  authenticated flow and make its authority visible.
- The ordinary project workflow must remain usable without version-control setup
  so repository access cannot block robot programming during class.

## Packaging, repository, and deployment

### Required outcomes

- Publish a public repository and GitHub Pages application at the UCSBXRP path on
  `yonvisell.github.io`, containing every vendored asset and course-release file
  needed for self-contained use.
- Test the deployed URL as a separate runtime after publication; do not infer
  success from a local production build.
- At intermediate handoffs, leave one local development server on the agreed
  stable port and stop obsolete production/dev servers. The user has most
  recently relied on port 4174.
- Commit locally at stage boundaries and before risky refactors. Do not publish
  an intermediate version when the user explicitly asks to leave it local for
  review; otherwise push only after the named slice is working.
- Inspect the distribution for missing files, network-only dependencies, stale
  paths, unnecessary generated resources, and materials that should be archived
  rather than shipped.
- Keep dependency count and payload appropriate for a course PWA. Vendor or pin
  dependencies required offline.

## Validation and evidence

### Required validation style

- Validate behavior, not merely syntax, type checks, compilation, mocked unit
  tests, or one successful run. A passing virtual test does not establish
  physical behavior, and one physical success does not establish repeatability.
- Use Chrome automation and direct visual inspection at normal wide and narrow
  layouts. Inspect every major view, not only the element just edited.
- Use the simulator where hardware evidence is impossible, but return to the
  physical XRP for USB, Wi-Fi, flash, run, motor, encoder, telemetry, reset, and
  recovery behavior.
- Record exact configuration and observed results honestly. Distinguish not
  tested, tested with a mock, tested virtually, and tested on the physical RP2350
  XRP.
- Reassess after validation and repair newly exposed design issues rather than
  declaring the slice complete because a predefined list passed.

### Commissioning and project stress sequence

The user specifically wants repeated attempts to break the ordinary UI workflow,
including:

- fresh or reset robot commissioning;
- same-release recommission/repair;
- changed network configuration;
- cancelled and repeated serial-device selection;
- stale address and old-folder recovery;
- setup with and without an available project folder;
- switching between station mode and hotspot mode;
- default project validation, flash, run, stop/completion, and rerun;
- loading a second nontrivial project and repeating the physical workflow;
- running from Monitor before IDE Run;
- concurrent or sequential IDE/Monitor use;
- robot reset and service reconnect;
- actual wheel motion, encoder change, telemetry, live controls, logs, and final
  stopped state;
- virtual equivalents, including world and plot synchronization;
- browser reload, installed-PWA reopen, offline reload, and subsequent update;
- Windows testing later when a representative laptop is available.

### Visual and content review

- Inspect typography, contrast, clipping, responsive behavior, spacing, panel
  boundaries, affordances, status language, error language, menus, diagrams,
  markdown rendering, Guide/API links, and disabled/enabled states.
- Use adversarial student and instructor perspectives. Ask what a student sees on
  first launch, what they will click when uncertain, whether a failure explains
  recovery, whether module boundaries reinforce course learning, and whether an
  instructor can create and maintain challenges without internal knowledge.

## Recurring observed failures and confusion

These observations recur across multiple reports and should inform diagnosis:

- Stale connection state: wizard, IDE, and Monitor disagree about network mode,
  endpoint, readiness, or run state.
- Layered persistence: old course folders, source-repository files, recovery
  copies, and default projects appear in the wrong context.
- Incomplete diagnostics: system log omits user-visible actions and full terminal
  output, while duplicate logs disagree or clear at completion.
- Latent state transitions: controls disable or appear inert, navigation pauses
  without progress, and users cannot tell whether reset, connection, flash, or
  run is in progress.
- Happy-path overconfidence: an operation succeeds once after retries, while the
  next run, another app, or another robot fails.
- UI terminology describes internal implementation rather than the user’s task,
  with repeated folder/recovery/offline labels and status indicators styled like
  buttons.
- Documentation states signatures or framework rules without first explaining
  the physical purpose, data flow, student responsibility, or worked use.
- Visual fixes have sometimes been literal and local while inconsistent fonts,
  excess framing, clipping, whitespace, and responsive behavior remain elsewhere.
- Earlier regressions affected functionality that had once worked: motor run,
  encoder/telemetry behavior, station/hotspot connection, project selection, and
  simulator signal quality.

## Likely implications for design review

The following are deductions from the recurring concerns, not preselected
implementations:

- Connection and project state need explicit domain models with few transitions
  and authoritative persistence, rather than component-specific local-storage
  conventions and recovery fallbacks.
- Commissioning should produce a verified robot profile that the IDE and Monitor
  consume directly; they should not guess the endpoint again from defaults.
- Cross-app synchronization should have one mechanism and observable revision or
  freshness semantics. Duplicate app-local run and log state invites the
  contradictions already observed.
- Device operations should be modeled as acknowledged transitions with bounded
  timeouts and visible progress. Fixed sleeps and silent retries magnify both
  latency and uncertainty.
- Project templates, active local projects, browser-only temporary projects, and
  recovery snapshots need distinct types and names in code and UI.
- Student-visible code and documentation should follow the course’s conceptual
  hierarchy: mission in `main.py`, replaceable student modules, supplied course
  services, target hardware boundary, and telemetry. The UI and challenge
  generator should reinforce this hierarchy.
- Comprehensive validation should be scenario-based and repeatable, with
  physical evidence retained, but should remain an engineering aid rather than a
  ceremonial gate imposed on users.

## Explicitly deferred or uncertain ideas

- Full mobile-browser support is not required now.
- Physical translation and motion-induced sensor changes can be validated later
  when the robot is not elevated; wheel motion and encoder changes are valid now.
- A visual world editor and simulator-generated challenge thumbnails are desired
  after the core physical workflow is reliable.
- Browser-integrated GitHub/version-control support requires design work; the
  outcome is desired, but credential storage and exact implementation were posed
  as questions.
- Plot/world annotation interaction, continuous video recording, and exact export
  formats should be selected by usability and browser support rather than by the
  first proposed control layout.
- Higher physical telemetry rate is desired only if measurement confirms it does
  not degrade control or service reliability.
- Whether some folder controls, explicit Save, project Rename, and a separate
  Details tab are necessary remains open; simplify based on the actual student
  workflow.
- MicroPython remains the intended target at present. Long waits should prompt
  investigation of implementation and protocol behavior, not an unsupported
  conclusion that the runtime choice itself is wrong.
