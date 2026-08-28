# Implementation plan

This is the live implementation sequence for UCSBXRP. `STATUS.md` records
completed work and retained evidence; it is not the plan. The three active
`v2_` course documents define the learning progression and public API, while
`SYSTEM_DESIGN.md` defines the current software boundaries.

## Current baseline

Robot runtime release `2026.08-dev.40`, generation 23, is the physical baseline.
Its retained raised-wheel record names source commit `0b301cd`. Browser and
course-material changes do not require reinstalling that runtime unless the
service, protocol, public API, or installed library becomes incompatible. The
retained evidence is summarized at the top of `STATUS.md` and in
`docs/hardware/2026-08-27-dev40-station-repeatability.json`.

The active browser/course bundle is also `2026.08-dev.40`. It requires a robot
runtime from release sequence 39 onward for the atomic edited-project Run
transaction.

The baseline includes:

- one MicroPython project and public `ucsb_xrp` API for virtual and physical
  targets;
- five challenge starters, two robot demos, and five active tutorial projects
  covering Python, virtual drawing, sampled robot programs, telemetry, and
  physical-XRP preparation;
- folder-backed projects with browser-draft fallback, automatic saves, output,
  telemetry, and conflict detection;
- shared IDE/Monitor project ownership, Run/Stop/Reset state, program output,
  telemetry, plots, recording, annotations, and exports;
- transactional USB setup/repair, station and hotspot profiles, and a RAM-backed
  physical project lifecycle;
- a static local-first web release with offline application assets and separate
  ordinary project files; and
- an instructor challenge specification, generator, and publication boundary.

This evidence does **not** establish the current release's native Web Serial
wizard and hotspot workflow end to end, floor motion, all physical challenges,
multi-robot classroom behavior, or current Windows/Edge and Chromebook behavior.
Those remain empirical work rather than inferred passes.

## Working method

- Implement a student-visible outcome across every affected boundary rather
  than advancing an isolated substitute interface.
- Keep student Python ordinary, compact, and target-independent. Put recurring
  timing, hardware, telemetry, and course behavior in supplied code.
- Preserve the separation between the browser connection layer, the
  MicroPython course package, the physical service, and simulated hardware.
- Treat the Project folder as the authoritative native project when permission
  is available. A Working folder is only its parent. Browser storage preserves
  a temporary draft; it is not a second folder tree.
- Retain transactional runtime installation, exact project revision transfer,
  command serialization, and explicit robot identity. Simplification must not
  weaken those boundaries.
- Validate at the lowest useful layer, then exercise the complete affected
  workflow. Record physical and deployed-origin evidence separately.
- Commit at each coherent stage after focused checks and one representative
  end-to-end workflow pass. Update `STATUS.md` and material design documents at
  that boundary.

## Active work — Integrated browser release

Status: in progress.

Finish one coherent browser release rather than extending isolated surfaces.

- Keep one server on port 4174 and one immutable production bundle. The IDE,
  Monitor, editor canvas, and embedded workspace must fill and react to the
  actual viewport in both resize directions.
- Use one literal folder model: a Working folder contains named Project folders.
  Keep project commands together, autosave folder-backed work, and preserve the
  current project after a cancelled or denied picker.
- Retain the completed Guide/API/tutorial revisions, rendered project READMEs,
  clean instructor specification, visual world editor, and direct contextual
  reference links.
- Deliver telemetry history to Monitor in ordered batches; do not send the IDE
  a high-rate stream that it does not display.
- Commit the integrated source, publish the same build to GitHub Pages, and
  inspect the deployed applications separately from the local server.

Outcome: a new student can open or create a project, edit and run it, inspect
telemetry, and find the relevant instructions without learning browser-storage
internals or encountering a layout that depends on the initial window size.

## Next stage — Student materials and course-project consistency

Reconcile the Guide, API reference, template READMEs, tutorial, challenge
controls, and application language with the actual current workflow. Most of
this surface has already been revised; use a short novice walkthrough to find
remaining confusion instead of another wholesale prose rewrite.

- Describe each challenge task, student responsibility, supplied support, and
  measurable result in literal undergraduate-facing language.
- Keep challenge parameters in one executable source of truth; do not duplicate
  mutable values in prose.
- Explain the sampled program loop, component responsibilities, project files,
  USB setup, Wi-Fi runtime, offline application, and native project storage
  without framework terminology.
- Keep detailed API entries complete for arguments, types, units, return values,
  state, errors, and short working examples.
- Verify rendered Markdown, direct documentation links, contextual API links,
  diagrams, typography, and narrow layouts in production Chrome.

Usable result: a student can determine what to implement, what supplied code
does, how to run and inspect it, and where to find the exact API behavior.

## Next physical stage — Setup, repair, and both network modes

Repeat the complete current-release student path rather than transferring
earlier-release evidence.

- Starting from a commissioned and a deliberately repaired XRP, run the native
  Chrome folder and Web Serial wizard through device verification, changed-only
  installation, restart, service proof, and IDE handoff.
- On a station network, open the default project, Run, Stop, Reset, rerun, open a
  second project, and repeat while IDE and Monitor share output and telemetry.
- Repeat the same project lifecycle on the robot hotspot, including the explicit
  computer-network handoff and return to an internet network.
- Exercise cancelled selection, denied or lost permission, stale endpoint,
  interrupted repair before activation, zero-change repair, and an unavailable
  selected network. Preserve actionable diagnostics and the last verified
  runtime.
- Qualify the deployed Pages origin independently after the local production
  artifact passes.

Usable result: an instructor can give a newly repaired robot and the public URL
to a student without manually commissioning that student's robot or repairing
browser state.

## Architecture stage — Updates, discovery, and project lineage

Begin only after the preceding browser and robot workflows pass on one frozen
baseline.

- Keep the existing content-derived offline-manifest identity for application
  assets. Treat robot release sequence and its minimum-compatible floor
  separately; raise the floor only for an incompatible runtime change.
- Add challenge-template revision and base-content identity so an instructor
  correction can be offered without replacing student work.
- Keep one verified robot profile with explicit station and hotspot routes.
  Rediscovery after restart may try known routes, but only an identity-checked
  response can become current.
- Add template identity and revision data sufficient to offer an instructor
  correction without overwriting a student's existing project. Keep migration
  explicit when a coordinated API change is unavoidable.
- Audit browser persistence and recovery records. Remove obsolete layers only
  after their supported migration boundary and failure behavior are understood.

Usable result: course corrections can be published during the term while
student folders, compatible robots, and recoverable prior releases remain
intact.

## Instructor stage — Challenge and world authoring

- Review the current authoring tool with a genuinely new curriculum-appropriate
  challenge, including generated project, virtual execution, telemetry, and
  export.
- Reuse the completed visual world editor for the generated project and, only
  if students must alter a world, offer the same editor for project-owned
  `world.json` while retaining readable JSON as the advanced representation.
- Keep student-component declarations, carried-forward work, supplied files,
  evidence, and publication data explicit in the challenge specification.
- Let the browser produce an immediately usable unpublished project through
  Open draft in IDE or a downloadable project archive. Publication remains a
  deliberate instructor operation after functional and instructional review.

Usable result: another instructor can create, inspect, test, revise, and publish
a challenge without editing generator internals.

## Refactoring and measured performance stage

Refactor only from a fully passing browser/robot baseline.

- Remove obsolete code, compatibility paths, duplicated state, and unused
  dependencies where the supported boundary is known.
- Prefer cohesive controllers for project persistence, target connection, and
  command state only when they remove demonstrated duplication or races.
- Profile before optimizing. Pursue material low-risk improvements in UI
  response, telemetry retention and replay, Web Serial transfer, folder I/O,
  MicroPython memory, and service latency.
- Preserve appearance and behavior during performance-only work and rerun the
  full software, browser, and physical workflows afterward.

Usable result: the implementation is smaller and easier to maintain, with
measured responsiveness or memory improvements rather than speculative churn.

## Final empirical stage — Course surface and classroom use

- Measure wheel-speed response, effective wheel diameter, track width, stopping
  distance, range behavior, and motion-induced IMU behavior on the course
  surface.
- Update `robot_config.py`, simulator comparison envelopes, and instructor
  examples from those measurements.
- Run all five challenges physically and observe at least one first-time student
  pair using setup, project creation, component checks, Run, telemetry, and
  recovery.
- Exercise current Windows/Edge, macOS/Chrome, a Chromebook where relevant,
  several nearby XRPs, two laptops addressing one robot, and ordinary classroom
  permission failures.

Usable result: software evidence is supplemented by calibration and real
classroom evidence before the course depends on the release.

## Explicitly deferred

- UF2 recovery should be exercised on a controller with genuinely incompatible
  firmware, not by rewriting a healthy robot solely to satisfy a test.
- Mobile hardware control and mobile WebM export are not release requirements;
  unsupported capabilities should fail clearly.
- An embedded Git implementation, credential storage, or a larger editor
  dependency should be adopted only after an observed student workflow shows a
  material advantage over ordinary folders and GitHub Desktop.
