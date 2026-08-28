# Current release recovery handoff

Updated: 2026-08-28, immediately before restarting the ChatGPT/Codex desktop app.

## Objective

Produce a dependable public UCSBXRP release that a colleague or TA can use independently: choose a Working folder, commission a new XRP, create or open a Project, compile and run it on virtual or physical hardware, use Monitor and saved run data, and diagnose ordinary failures without hidden state or unexplained windows. Functionality and first-use comprehension take priority over secondary polish.

## Repository and local runtime

- Repository HEAD: `ebba6e9`.
- No tracked source changes were made during this interrupted recovery pass.
- Preserve the existing untracked user material: `arena_cam/`, `docs/USER_NEW_PROMPT_GUIDANCE.md`, `docs/open-user-issues-now.md`, `docs/hardware/2026-08-28-dev40-station-and-motion.json`, and `outputs/`.
- Before restart, the only Node listener was Vite on `127.0.0.1:4174` (PID 68647, parent 68626). Restarting ChatGPT will probably stop it; restart exactly one server on port 4174 afterward.
- Obsolete preview servers on ports 5173 and 5174, seven orphaned Codex UI kernels, and a 20-hour runaway Coursemobilerobotics worker were stopped. The persistent launch job `codex.current-driven-oscillator` was unloaded.

## Direct evidence from the failed public-release session

The Working folder is `/Users/yon/Documents/New_XRP_0828`. Its diagnostic file is `/Users/yon/Documents/New_XRP_0828/UCSBXRP diagnostic log.txt` (130 lines). The three relevant UCSBXRP windows were inspected on the secondary physical display:

1. an installed-PWA Monitor window;
2. an installed-PWA `/workspace/` window with embedded IDE and Monitor;
3. a normal Chrome IDE window.

The log establishes the central state failure:

- two IDE instances were attached simultaneously to one virtual target;
- one action was received and logged by both IDEs with the same event and request identifiers;
- a newly opened Monitor replayed an already completed run as a new run lasting only milliseconds;
- at 18:35:07 an IDE navigation/disconnect stopped the active virtual run (`request_id="disconnect-6"`), followed immediately by a replacement IDE session;
- the replacement surface replayed prior Run and Stop records as though they were current.

This is an architecture defect involving redundant controllers, page-owned runtime lifetime, and history replay. It is not a defective Run button and should not be handled by another stored flag or state fallback.

## Confirmed code causes

1. `packages/target/src/virtual-target-event-hub.ts::replayCurrentState()` deliberately marks console events before the latest Run as replayed but sends the latest Run and later events as live. A late Monitor therefore creates a false new run.
2. `packages/target/src/virtual-target.ts` owns the MicroPython runtime worker in the IDE page. `pagehide`/`beforeunload` calls `disconnect()`, and disconnecting the run owner terminates the active virtual run.
3. `apps/shared/AppNavigation.tsx` opens IDE-to-Monitor and Monitor-to-IDE links with `_blank`; inside the installed app this creates additional PWA windows.
4. `apps/shared/SplitWorkspaceLink.tsx` replaces the current tab with `/workspace/`, unloading the run-owning IDE.
5. `public/manifest.webmanifest` scopes the installed standalone app to the entire UCSBXRP site. The landing page strongly recommends installation even though the service worker already supplies offline assets independently of installation.
6. `apps/workspace/src/WorkspaceApp.tsx` and `styles.css` add a redundant `IDE + Monitor` title, a five-pixel split gap, non-collapsible 36--64 percent limits, and another IDE instance.
7. The collapsed Monitor controls rail is 28 px wide; the user found it much too wide.

## Recovery strategy already agreed

Use one browser surface and one runtime authority. Do not add another persistence location or migration layer. The Working-folder `.ucsbxrp.json` remains the serialized user configuration authority; a browser directory handle is only the browser capability needed to access that folder.

Implementation order:

1. Simplify PWA/browser navigation and the IDE--Monitor workspace so opening Monitor or the combined view does not create redundant controllers or silently replace a running owner.
2. Make every retained console event explicitly historical. A late Monitor may reconstruct an actually active run from the current target status and retained telemetry, but must never synthesize a completed run or save it again.
3. Remove page-lifetime ownership from the virtual runtime if practical; otherwise make the UI keep the actual owner alive and prohibit owner-replacing navigation during a run. Prefer moving runtime authority into the shared target over more ownership leases or recovery flags.
4. Standardize the cumulative diagnostic filename as `UCSBXRP_diagnostic.log`, deduplicate shared event identifiers across surfaces, and do not log telemetry values.
5. Exercise realistic sequences: fresh load; folder/setup handoff; Expanding Spiral default; Compile/Run/Stop/Reset; open Monitor before, during, and after a run; refresh/reopen; side-by-side; second tab; then Project creation/opening and error recovery.
6. Verify station-mode setup, physical run, telemetry, and Monitor on Pink before deployment. Hotspot remains a regression path, but station mode is the immediate development path.
7. Only after these workflows pass, consolidate harness documents, refactor/prune obsolete state paths, address the remaining high-value Project/Guide/API/Monitor usability issues, commit, publish, and verify the exact public build.

## Harness consolidation result

`docs/CURRENT_PRODUCT_OUTCOMES.md` should be the sole live product backlog; `STATUS.md` the evidence/resume ledger; `docs/VALIDATION_PLAN.md` the validation strategy; `SYSTEM_DESIGN.md` the current architecture. The top of `STATUS.md`, `IMPLEMENTATION_PLAN.md`, and portions of `SYSTEM_DESIGN.md` are stale and contradict dev.41 evidence. Do not rewrite all documents before fixing the runtime; record this recovery at the top, then archive superseded audits after extracting any unique product principles.

The completed documentation agent proposed moving historical audits to `docs/archive/` rather than deleting them. Its detailed path list remains in the conversation record; no files were moved.

## Agents and work state

- `guide_api_consistency` completed a read-only authority/archive audit; no files changed.
- `first_use_adversary` and `remaining_gap_audit` were interrupted for the app restart before delivering final reports; no shared-file changes were reported.
- Resume with a clean context from this file and the current user guidance; do not repeat the initial diagnosis or restart broad audits.

## First commands after restart

1. Confirm `git status --short` and preserve the untracked paths listed above.
2. Confirm no stale servers; start exactly one Vite server on `127.0.0.1:4174` if needed.
3. Re-read this file, then inspect the complete runtime lifecycle in `virtual-target.shared-worker.ts`, `virtual-target.ts`, `virtual-target-event-hub.ts`, and the Monitor run-dataset event handler.
4. Implement the single-authority/navigation and replay correction as the first vertical slice, add scenario-level regression tests, update `STATUS.md`, and commit the slice locally.
