# Current UCSBXRP product outcomes

This is the short, current view of the course product. It records the student or
instructor result that matters, the strongest available evidence, and the next
material improvement. It is not an acceptance contract and does not convert a
single successful test into a general claim. User observations are design
evidence; they are investigated rather than assumed either correct or incorrect.

Update this file at each coherent implementation stage. Preserve detailed test
records in `STATUS.md`, physical evidence in `docs/hardware/`, and historical
request context in the `USER_REQUIREMENTS_*` documents.

## Current baseline

- Browser applications: commit `2e7503a` plus the active uncommitted slice.
- Physical XRP course runtime: `2026.08-dev.36`, generation 17, source baseline
  `5d217ed`.
- Local production origin: `http://127.0.0.1:4174/`.
- The public GitHub Pages release is intentionally not updated during the
  current local revision sequence.

## Outcomes and remaining work

| Product outcome | Current evidence | Remaining work |
| --- | --- | --- |
| A student can open the suite and understand where Home, IDE, Monitor, Guide, setup, and API documentation are. | The applications share compact navigation and production-browser link tests pass. | Reconcile the landing, setup, authoring, Guide, and API title treatments; remove remaining redundant labels and verify every page at common laptop widths. |
| The IDE and Monitor fill the available window and remain usable as it changes size. | Standalone short, wide, tall, and narrow layouts and the same-tab combined workspace have production-browser coverage. | Fix the confirmed narrow-to-wide Project-panel state defect; repeat real-window expansion after browser-test viewport state is cleared. Continue inspecting proportions, not only overflow. |
| A student can tell which project is open and where its files are stored. | One active project authority, strict project-folder boundaries, folder-backed autosave, browser-draft fallback, and multi-IDE ownership tests pass. | Finish the human project model: group project actions, open remembered child projects without another system picker, explain temporary drafts once, and remove ambiguous storage controls. |
| Project creation and challenge progression preserve student work. | Named project folders, explicit templates, file import, automatic saves, conflict handling, and carried-forward challenge modules are implemented and tested. | Reassess naming, duplication, progression, and Git workflow as one student experience. Test reopening and changing projects repeatedly from IDE and Monitor. |
| Editing, validation, Run, Stop, Reset, output, and logs form one understandable workflow. | Virtual and physical command serialization, automatic validation when needed, retained program output, and shared IDE/Monitor run state have automated and physical evidence. | Remove remaining status duplication, make disabled states explain themselves, and stress repeated Run/Stop/Reset and project changes in both applications. Keep complete service detail available without dominating the student view. |
| The default project demonstrates useful robot behavior immediately. | Expanding Spiral runs in the simulator and has raised-wheel physical evidence, live speed/winding controls, range stopping, plots, and output. | Repeat after the current project/UI revisions, then run the second demo and nontrivial challenge projects on the attached XRP. Floor behavior remains a later calibrated test. |
| Setup or Repair can commission a new or existing RP2350 XRP without instructor-only steps. | Transactional Web Serial installation, changed-file comparison, release verification, restart, network profiles, and station-mode handoff have physical evidence. | Repeat reset/repair from the current browser release, then stress cancellation, zero-change repair, failed station join, hotspot handoff, custom hotspot name, and return to internet Wi-Fi. |
| Station and hotspot modes select only a verified robot route. | The connection record now retains one robot identity with inactive alternate routes; station operation on Pink and earlier hotspot operation are recorded. | Repeat current-release hotspot operation end to end. Verify that the wizard gives an explicit computer-Wi-Fi instruction and never hands stale `192.168.4.1` to the IDE after a station connection. |
| Monitor presents synchronized pose, telemetry, plots, controls, recording, notes, and export. | Shared virtual/physical state, late-open history, student plot registration, compact live controls, CSV/plot export, and WebM export have automated coverage. | Repeat physical telemetry under motor motion; review plot meanings and smoothing; refine annotation/export interaction; verify saved run artifacts use the active project folder. |
| A project owns a readable world description used by simulation and Monitor. | `world.json` supplies bounds, initial pose, walls/blocks, and course markers to the current simulator and view. | Add a compact visual world editor for bounds, walls, rectangular obstacles, start/finish regions, lines, waypoints, and marker properties. Preserve readable JSON and backward compatibility. |
| Course challenges state the task, student work, supplied support, and measurable result. | Five challenge starters, rendered README previews, isolated component checks, and virtual course workflows exist. | Continue the prose and program-structure review. Eliminate duplicated mutable parameters, make check outcomes literal, and use clear diagrams or simulator images where they materially clarify the task. |
| Students learn the Python and UCSBXRP concepts needed by the challenges. | A seven-file MicroPython tutorial compiles and runs, but it is primarily a set of completed examples. | Replace it with active, ordered tutorial projects: Python essentials; drawing with Virtual XRP; the sampled UCSBXRP program structure; and behavior plus telemetry. Give each a stable `main.py`, short student tasks, immediate exercise feedback, and a clear successor. |
| API and Guide documentation explain purpose as well as syntax. | The API lists public classes, arguments, units, returns, errors, and examples; the Guide covers setup, projects, targets, sampled timing, and offline use. | Continue student-legibility editing, reduce remaining oversized or inconsistent typography, use a diagram engine for nontrivial flows, add contextual API help, and merge the useful technical overview into a clear appendix. |
| Instructors can create and revise challenges without editing the application source by hand. | A challenge specification, generator, authoring page, documentation, validation, and unpublished-output boundary exist. | Exercise the tool with a new curriculum-appropriate challenge, simplify its interface and documentation, integrate the visual world editor, and verify generated projects through virtual execution and telemetry. |
| The web applications remain available after internet loss without owning student files. | The PWA caches the application shell and immediately preceding release; project files remain ordinary files in the chosen project folder. Offline production workflows pass. | Make installation/update language unambiguous, verify update adoption while edits and runs are active, and repeat with Windows/Edge and a Chromebook-class browser. Do not imply that cached browser assets are stored in the project folder. |
| The implementation remains small enough to understand and responsive enough for classroom use. | Obsolete state layers and accidental dependencies have already been removed; current builds and runtime loops are bounded. | After the complete browser/robot suite passes on a frozen baseline, perform one cohesive browser and MicroPython refactor, prune obsolete compatibility code, then measure startup, bundle, memory, plot rendering, telemetry, and device-loop costs before making only material optimizations. |

## Immediate sequence

1. Close the narrow-to-wide IDE layout defect and finish the project-action
   workflow.
2. Implement and validate the active tutorial redesign.
3. Implement the project-owned visual world editor.
4. Reconcile remaining titlebars, documentation, and student-facing source
   comments.
5. Run the complete virtual/browser suite, repeat current physical station and
   hotspot workflows, and commit the frozen functional baseline.
6. Refactor and measure performance only after that baseline is stable.
