# Current recovery handoff

Updated: 2026-08-28 after the first runtime/offline recovery checkpoint.

## Governing objective

Continue from the new prompt at the head of
`docs/USER_NEW_PROMPT_GUIDANCE.md`. Produce a public UCSBXRP release that a
colleague or TA can use independently with a new computer and XRP: choose one
Working folder, set up or repair the robot, create or open a Project, compile
and run on virtual or physical XRP, use Monitor and saved run data, and recover
from ordinary failures without hidden state or unexplained windows.
Functionality and first-use comprehension take priority over secondary polish.

The older prompts in that file and `docs/open-user-issues-now.md` are evidence
for remaining gaps; they are not competing plans. `docs/CURRENT_PRODUCT_OUTCOMES.md`
is the live product backlog and `STATUS.md` is the validation ledger.

## Failure evidence that must remain in scope

The failed public session used Working folder
`/Users/yon/Documents/New_XRP_0828` and its 130-line diagnostic log. Three
GitHub-served surfaces were simultaneously present on the secondary display:
an installed-PWA Monitor, an installed-PWA combined workspace, and a normal
Chrome IDE. Together they produced multiple IDE authorities, duplicate target
records, a completed run replayed as a new millisecond run, a virtual run
stopped by navigation, state-dependent workspace controls, and unpredictable
window creation. These were one architecture failure involving surface
ownership, runtime lifetime, history replay, and persistence—not an isolated
Run-button error.

The current checkpoint addresses that entire constellation:

- IDE, Monitor, and Side by side now use one ordinary browser workspace and do
  not open new app windows.
- The workspace keeps both embedded clients mounted while changing layout, so
  the IDE authority is not unloaded by switching to Monitor.
- Duplicate IDEs expose one active provider and a visible **Use this IDE**
  takeover instead of silently competing.
- Retained run history is explicitly delimited and never treated as a new run.
- Active and completed late-Monitor attachment preserve one stable target run
  identity.
- Two Monitors write one archive and one terminal diagnostic event.
- The cumulative log is now `UCSBXRP_diagnostic.log`.
- Installed-app promotion is removed. The complete site is cached
  automatically, reopens from a bookmark in an ordinary tab, and a selected
  Working folder receives `Open UCSBXRP.html` as a transparent launcher.

## Evidence at this checkpoint

- `npm run build`: passed; offline manifest contains 322 files.
- `npm run test:offline`: passed.
- 50 focused target, folder, diagnostic, and run-dataset tests: passed.
- Eight production-Chrome scenarios passed together:
  - late Monitor after a completed run;
  - two simultaneous Monitors with one saved archive/log event;
  - two IDE tabs and provider continuation;
  - live IDE resizing;
  - split/narrow workspace resizing and collapse;
  - default IDE workspace mode;
  - project-backed offline Run;
  - close all pages, go offline, then open Guide and IDE by URL.

No physical XRP test and no public deployment were performed for this
checkpoint. The attached robot and Pink station path remain the next critical
empirical boundary.

## Immediate remaining work

1. **Connection and setup reliability.** Exercise a clean/repaired XRP on Pink
   from the current browser surface. Confirm `.ucsbxrp.json` is the only
   serializable workspace/robot authority, station identity survives the setup
   handoff, Reconnect uses the verified address and SSID, IDE and Monitor agree,
   and Run/Stop/Reset/rerun produce motors, encoders, telemetry, output, and a
   useful cumulative log. Then regression-test hotspot without stranding the
   development session.
2. **Project workflow.** Replace the remaining confusing Project-panel action
   distribution and vocabulary with one visible workflow: open an existing
   Project inside the Working folder, create a named Project from a clearly
   categorized template, or save the built-in preview as a Project. A fresh or
   newly commissioned Working folder must open Expanding Spiral, never a stale
   challenge. Picker cancellation or invalid folders must leave the current
   Project unchanged and explain the next action.
3. **Monitor semantics and presentation.** Reassess recording versus automatic
   run capture, export wording/state, notes, sample counts/rates, World zoom and
   axes, arena walls/legend, controls width, path reset, and run replacement as
   one workflow. Do not restore separate IDE/Monitor program-output surfaces.
4. **Guide/API/challenge/tutorial clarity.** Apply the current user guidance:
   consistent objective language, real API parameter/return/exception
   documentation and class purposes, usable diagrams, legible typography,
   rendered README files, clear component responsibilities, and a more gradual
   Python-to-UCSBXRP tutorial sequence. This follows the connection/project
   runtime boundary.
5. **First-use adversarial pass.** Start from a fresh browser profile/Working
   folder and factory-like robot state; perform setup, default virtual run,
   physical run, second Project, Monitor, refresh/reopen/offline, and ordinary
   recovery using only visible UI. Inspect every resulting screen and log, not
   only assertions.
6. **Consolidation.** Refactor only after these workflows pass. Remove obsolete
   state/recovery paths, stale docs, dead routes, and unnecessary package files;
   then measure the obvious bundle/runtime low-hanging fruit.
7. Commit final stages locally, remove internal/user harness files from the
   public Git tree while retaining them locally, push, and verify the exact
   GitHub Pages build from a clean browser session.

## Directives and backlog sources

Read these in this order, without restarting broad audits:

1. This handoff.
2. The **NEW PROMPT FROM USER** at the head of
   `docs/USER_NEW_PROMPT_GUIDANCE.md`.
3. `docs/CURRENT_PRODUCT_OUTCOMES.md`, especially active outcomes and later
   usability refinements.
4. `docs/open-user-issues-now.md` for eclectic UI/feature observations that
   must be interpreted rather than treated as literal requirements.
5. `STATUS.md` for completed evidence and hardware baseline.
6. `SYSTEM_DESIGN.md` only where an implementation decision needs current
   architectural context.

The older `USER_REQUIREMENTS_*` and audit documents are source history. Extract
unique unresolved user outcomes, but do not recreate another checklist or
repeat audits already merged into `CURRENT_PRODUCT_OUTCOMES.md`.

## Repository and local-only material

Preserve these untracked paths: `arena_cam/`,
`docs/USER_NEW_PROMPT_GUIDANCE.md`, `docs/open-user-issues-now.md`,
`docs/hardware/2026-08-28-dev40-station-and-motion.json`, and `outputs/`.
Before any public push, untrack and ignore the Codex/user harness identified by
the repository audit: root `AGENTS.md`, `CODEX_IMPLEMENTATION_PROMPT.md`,
`IMPLEMENTATION_PLAN.md`, `PROJECT_CONTEXT.md`, `STATUS.md`; the current
recovery/product/requirements/audit documents; local hardware evidence; and
generated outputs. Keep public course-facing Guide/API/reference, instructor
authoring, system-design, legal, template, and README material.

Do not rewrite public history unless explicitly requested. Removing internal
files from the current Git tree is sufficient for this release; preserve local
copies under ignored paths.

## Resume commands

1. `git status --short` and preserve the local-only paths above.
2. Confirm exactly one cache-free Vite server on `127.0.0.1:4174`; do not start
   another port.
3. Inspect current target settings from `.ucsbxrp.json`, browser UI, and the
   attached XRP before changing connection code.
4. Continue with the Pink physical first-use slice, then Project workflow.

The prior task was compacting unusually often because of its exceptional
length. Resume from this file and the checkpoint commit without repeating the
completed architecture diagnosis.
