# UCSBXRP user requirements and gaps

## Scope and interpretation

This report compares the current repository with
`docs/USER_REQUIREMENTS_AND_INTENT.md` and the active course authorities named
by `PROJECT_CONTEXT.md`. It is an engineering audit, not a transcription of the
request history. User-reported symptoms are treated as observations; proposed
causes and mechanisms are accepted only where the current implementation or
retained evidence supports them.

The audit snapshot is commit `8d760ca` plus the current coherent browser,
documentation, course-source, and state-model work for release
`2026.08-dev.26`. The attached XRP still runs the separately qualified dev.25
runtime until the next physical stage.

Status terms are used literally:

- **Verified current behavior**: present in the current source and exercised by
  an identified automated or physical test. The evidence tier is stated.
- **Likely gap**: the requested outcome is absent, contradictory, or not robust
  in the current implementation. This is a finding, not merely an untested idea.
- **Deferred idea**: intentionally outside the immediate baseline and not a
  current release defect.
- **Obsolete or superseded request**: an earlier formulation or mechanism that
  has been replaced by a later, more coherent direction.

Priorities describe product consequence:

- **P0**: can select the wrong robot or project, break a required physical
  workflow, or prevents honest release qualification.
- **P1**: important course, instructor, interoperability, or recovery gap.
- **P2**: quality, accessibility, performance, or maintainability debt that does
  not presently block the core workflow.

## Audit baseline

Under the repository's required Node 24 runtime, the current snapshot produces:

- `npm test`: 33 files, 272 tests passed.
- `npm run test:python`: 200 tests passed, including release integrity, API
  parity, course starters, and authoring.
- `npm run test:micropython`: MicroPython 1.28 public-interface,
  canonical-source, service-syntax, hardware-boundary, and portable-MPY checks
  passed.
- `npm run build` and offline verification: TypeScript, Vite production build,
  commissioning bundle, and 223-file offline shell passed. Vite still reports
  large IDE, Monitor, and editor chunks.
- Stable Chrome: all 70 non-hardware workflows passed; the physical workflow is
  intentionally opt-in and belongs to the next stage.

The current dev.25 working release has now been exercised on the attached XRP
in station mode on `Pink` at `192.168.7.25`. The robot reported managed runtime
generation 4 and manifest digest
`0de338a671d267814a9da95ced73249ffba16be63d27b689fb70cac03de3b997`.
Repeated service probe, Flash, Run, and Stop passed; a bounded motor/encoder run
passed and ended at zero motor effort; and the physical IDE/Monitor Playwright
workflow passed. This establishes a nominal physical dev.25 installation and
student run path. It does not yet establish interrupted-install rollback,
failed-candidate fallback, reliable reset-only reconnect, hotspot operation,
installed-PWA behavior, or deployed-site behavior. The earlier structured
dev.22 record remains at
`docs/hardware/2026-08-26-dev22-release-and-repeatability.json`; the dev.25
observations should be retained in a corresponding immutable evidence record.

## Verified current behavior

### V1. Commissioning is a substantive repair workflow

**Status: Verified current behavior — source, automated tests, and nominal
dev.25 station-mode physical workflow. Rollback and hotspot branches remain
unverified.**

The commissioning application identifies the RP2350 controller, installs the
course firmware and runtime through Web Serial, verifies byte counts and
SHA-256 digests, invalidates only the managed MicroPython module namespaces,
checks required imports, preserves an explicitly retained network profile, and
records progress in a setup log. It fetches and verifies all changed assets
before the first device mutation. Evidence:

- `apps/commission/src/commissioner.ts`
- `apps/commission/src/CommissionApp.tsx`
- `apps/commission/src/commissioner.test.ts`
- `tests/e2e/commissioning.spec.ts`

The current work replaces live, file-by-file course activation with a small
stable bootstrap and A/B runtime slots. An activation record is published only
after the inactive slot and its manifest have been verified. Boot attempts a
new candidate once, confirms it after service startup, and otherwise returns to
the last confirmed runtime. Release identity now separates build sequence,
service version, protocol version/revision, course API revision, library
version, bootstrap version, and runtime-manifest digest. Evidence:

- `device_service/course_boot.py`
- `device_service/main.py`
- `apps/commission/src/commissioner.ts`
- `vendor/current/release.json`
- `tests/python/test_course_boot.py`
- `tests/python/test_build_commissioning_bundle.py`

This is the correct architectural response to mixed-release risk. It should not
be replaced by more cache clearing, retries, or exact version-string bandages.

### V2. Robot identity and configured versus observed network state are explicit

**Status: Verified current behavior — source and automated tests; multi-robot
physical exercise remains outstanding.**

`/api/v1/info` reports `robotId` from `machine.unique_id()`, runtime release and
sequence, generation, manifest digest, API/library revisions, protocol revision,
and bootstrap version. Commissioning verifies that the Wi-Fi service has the
same identity as the USB-selected controller. The browser stores a versioned
`RobotProfile`, preserves configured station/hotspot intent separately from the
last effective network observation, and supplies the expected identity through
candidate discovery and the shared coordinator. Direct connection, permission
probing, and reset reconnection reject a different or identity-less robot.
The browser also evaluates independent compatibility fields rather than
requiring service version to equal course release. Evidence:

- `device_service/ucsb_xrp_service/service.py`
- `apps/commission/src/CommissionApp.tsx`
- `packages/target/src/target-preference.ts`
- `packages/target/src/target-preference.test.ts`
- `packages/target/src/physical-target.ts`
- `packages/target/src/physical-target-coordinator.ts`
- `packages/target/src/physical-target.test.ts`
- `packages/target/src/physical-target-coordinator.test.ts`

### V3. Shared target state and ordinary project execution are real

**Status: Verified current behavior — automated tests and dev.25 physical
station-mode evidence.**

IDE and Monitor use shared physical and virtual target workers. Project state is
revisioned, a flashed project can be reused without a second transfer, stale
state is surfaced, run/stop/reset are explicit operations, and output and
telemetry carry event identities. The physical service uses two project slots
and an atomic active pointer. It now retires core 1 before internal-flash writes
and starts the worker after the Run reply, addressing the measured RP2350 flash
and threading conflict. Evidence:

- `packages/target/src/physical-target-coordinator.ts`
- `packages/target/src/physical-target.ts`
- `device_service/ucsb_xrp_service/service.py`
- current dev.25 attached-XRP observation: generation 4, runtime-manifest digest
  `0de338a671d267814a9da95ced73249ffba16be63d27b689fb70cac03de3b997`,
  repeated Flash/Run/Stop passed
- `docs/hardware/2026-08-26-dev22-release-and-repeatability.json`

### V4. The IDE has a usable project and folder model

**Status: Verified current behavior — source, automated browser tests, and
dev.25 physical IDE use.**

The IDE distinguishes templates from editable projects, rejects the course
source repository as a student project folder, restores remembered folders
when permission exists, maintains a browser recovery copy, rotates autosaves,
supports multiple files and Markdown preview, and updates the physical-project
revision consistently across JavaScript and MicroPython. Evidence:

- `apps/ide/src/project-files.ts`
- `apps/ide/src/IdeApp.tsx`
- `tests/e2e/project-workflow.spec.ts`
- `tests/e2e/ide-storage-recovery.spec.ts`
- `tests/e2e/physical-hardware.spec.ts`

### V5. Monitor is functional, not a placeholder dashboard

**Status: Verified current behavior — automated browser tests and dev.25
physical IDE/Monitor, motor, encoder, and telemetry evidence.**

Monitor shares target/project state with the IDE and provides run controls,
telemetry values, strip plots, world view, live runtime parameters, console
events, recording, annotations, and CSV/SVG/PNG/WebM export. The standalone
Dashboard route is only a compatibility redirect. Evidence:

- `apps/dashboard/src/DashboardApp.tsx`
- `packages/target/src/telemetry-recording.ts`
- `tests/e2e/monitor-recording.spec.ts`
- `tests/e2e/complete-path.spec.ts`
- `tests/e2e/physical-hardware.spec.ts`
- `docs/hardware/2026-08-26-dev22-release-and-repeatability.json`

### V6. The simulator and course package exercise the intended conceptual boundary

**Status: Verified current behavior — source and automated MicroPython tests.**

The simulator supplies deterministic planar hardware/world state; `ucsb_xrp`
owns sensing, odometry, navigation, mapping, planning, mission helpers, live
publishing, and project-world access. Student components are explicit and the
same project package is used on virtual and physical targets. Evidence:

- `packages/simulator/src/index.ts`
- `vendor/current/ucsb_xrp/`
- `vendor/current/reference_source/ucsb_xrp_reference/`
- `scripts/prove-micropython.mjs`

### V7. Challenge authoring has a usable repository-side path

**Status: Verified current behavior — automated tests.**

The repository CLI can create, validate, and publish a challenge specification,
including starter files, student implementation declarations, world data, and
catalog integration. The README validator now follows the current
student-centered headings rather than the obsolete administrative headings.
Evidence:

- `scripts/challenge_authoring.py`
- `docs/INSTRUCTOR_CHALLENGE_AUTHORING.md`
- `tests/python/test_challenge_authoring.py`

### V8. Offline packaging and release-coherence guards exist

**Status: Verified current behavior — local production build and automated
browser checks.**

The PWA vendors the MicroPython runtime and course assets, precaches an offline
shell, applies cross-origin-isolation headers to cached responses, and refuses
commissioning when the loaded page and commissioning manifest name different
releases. Local development removes conflicting production workers/caches.
Evidence:

- `scripts/offline-build.mjs`
- `scripts/verify-offline-build.mjs`
- `apps/shared/offline-release-coordinator.ts`
- `apps/shared/offline-release-coordinator.test.ts`
- `apps/shared/offline-shell.ts`
- `apps/commission/src/CommissionApp.tsx`

### V9. Visual and documentation work has moved toward the requested style

**Status: Verified current behavior — source and automated layout/contrast
tests; current visual inspection still required.**

The shared theme provides high-contrast light/dark palettes, focus visibility,
reduced-motion and forced-colors behavior. Guide and API styles have been
simplified and their prose is substantially more student-facing. Wide/narrow
navigation and critical layout paths have browser coverage. Evidence:

- `apps/shared/theme.css`
- `apps/shared/theme.test.ts`
- `apps/guide/src/styles.css`
- `apps/reference/src/styles.css`
- `tests/e2e/navigation-links.spec.ts`

## Likely gaps

## P0

### G0.1. Reset recovery does not rediscover a changed station address

**Status: Partly resolved; endpoint rediscovery remains a gap.**

The redundant SharedWorker recovery deadline has been removed, so it can no
longer reject just before the direct client's reply. However,
`reconnectAfterReset` still polls only the bound endpoint. Older physical runs
measured longer reassociation times; the current dev.25 pass found reset-only
reconnect at approximately eight seconds or slightly longer, while ordinary
Flash/Run/Stop remained immediate and reliable.

Candidate discovery is used at initial connection, not during reset, so a
changed DHCP address cannot be recovered even though identity verification is
now available.

**Required correction:** make reset a coordinator-owned transition. Return an
acknowledgement, show recovery progress, search known addresses for the same
`robotId`, verify compatibility and boot identity, then update the endpoint
atomically. Use a recovery ceiling justified by repeated hardware measurements
without adding latency to ordinary operations. This is rediscovery, not a blind
delay.

### G0.2. IDE target startup races restoration of the authoritative folder project

**Status: Resolved in dev.26 source and verified in Stable Chrome.**

ProjectSession is now integrated across IDE startup, editing, file operations,
folder attachment, save, autosave, and update-safe reload. The IDE does not
display or stage a project until folder/browser reconciliation finishes. An
explicit cross-tab bootstrap record keeps Monitor Run disabled until that exact
revision reaches the shared target. A held IndexedDB restoration test proves
that the wrong browser draft is neither exposed nor run.

### G0.3. Dev.25 nominal physical operation is qualified; dev.26 physical and rollback branches are not

**Status: Likely gap — remaining release qualification, not evidence of a
nominal physical source defect.**

The release boundary changes boot, import paths, installation layout,
rollback, confirmation, service identity, provisioning, and physical target
compatibility. Automated coverage is strong, and the attached dev.25 XRP has
now established the nominal station-mode path: service probe, repeated Flash,
Run, Stop, bounded motor/encoder motion with final zero effort, and physical
IDE/Monitor Playwright all passed on `Pink` at `192.168.7.25`. The installed
runtime reported generation 4 and digest
`0de338a671d267814a9da95ced73249ffba16be63d27b689fb70cac03de3b997`.

The remaining unqualified branches are:

- interrupted inactive-slot write preserving the confirmed runtime;
- invalid candidate or pre-confirmation reset falling back correctly;
- station and hotspot handoff with the slotted runtime;
- reset-only reconnect against dev.25, which remains around or beyond the
  current eight-second client ceiling;
- exact deployed-site and installed-PWA behavior.

Dev.25 is physically qualified for the nominal station-mode run path; dev.26
has complete software qualification but is not yet installed. Neither release
is yet qualified for rollback, identity-aware reset rediscovery, hotspot, or
deployment operation. Bootstrap upgrade behavior also needs a deliberate test
because `main.py` and `course_boot.py` remain two separately replaced bootstrap
files even though runtime activation is transactional.

### G0.4. The current edited course source is not represented by the release manifest

**Status: Resolved for dev.26 source.**

The canonical source hash, release metadata, commissioning bundle, and offline
shell are coherent. The release-integrity test passes. Dev.25 physical evidence
remains attributed only to the installed dev.25 runtime.

## P1

### G1.1. Device operations have request timeouts, not durable operation state

**Status: Partly resolved; lost-reply retry remains a gap.**

The redundant SharedWorker deadline is gone. The direct HTTP request still has
a three-second transport deadline for check, sync, Run, and live-parameter
commands. The service permits up to 48 files and 256 KiB, as defined by
`device_service/ucsb_xrp_service/protocol.py`. A device can finish an operation
after the caller has rejected it, leaving the browser uncertain whether retry
is safe.

**Required correction:** retry a lost transport reply with the same request ID,
using the service's existing cached correlated reply. Keep short deadlines for
reachability probes and measure the few operation-specific ceilings. Do not add
a second operation-state subsystem unless hardware evidence requires it.

### G1.2. Identity checks fail safely, but classroom discovery and command ownership remain incomplete

**Status: Likely gap; wrong-robot acceptance is resolved in the current working
tree.**

The `RobotProfile` and expected-identity checks now prevent a browser configured
for one XRP from accepting another. However, station hostname remains the
shared `ucsb-xrp.local` (`device_service/ucsb_xrp_service/networking.py` and
`packages/target/src/target-preference.ts`). If DHCP changes an intended
robot's saved address in a room containing several XRPs, the generic hostname
can resolve a different unit; the identity check rejects it safely but cannot
locate the intended unit. Service routes also remain accessible to other peers
on the LAN, so identity verification is not command authorization.

**Required correction:** derive a unique station hostname from the stable robot
ID and test discovery with multiple robots. Consider a commissioning-generated
capability token if shared-LAN command interference is observed or considered a
credible classroom risk.

### G1.3. Challenge 4 has a contradictory path-planning contract

**Status: Resolved.**

The student base class, component checks, starters, catalog, browser API,
course documents, and summary now require a valid route through horizontally or
vertically adjacent free cells, or `None` when no route exists. A regression
test deliberately accepts a valid non-shortest route. The reference
implementation may remain breadth-first without making optimality a student
requirement.

### G1.4. Active v2 Guide/API authorities lag the public package

**Status: Resolved for the current public API.**

The active Guide/API, browser reference, USER_REFERENCE, course summary, and
parity tests now cover the actual student-component import boundary,
`Rectangle`, `ProjectWorld`, `load_world`, `live.plot`, and wheel-speed filter
configuration. They no longer state the obsolete exact-whole-step slider rule.

### G1.5. Instructor browser authoring stops before preview and execution

**Status: Likely gap; repository CLI path is verified.**

The browser explicitly downloads JSON and leaves integration, project testing,
review, and publication separate (`apps/author/src/AuthorApp.tsx`). World and
file overrides remain raw JSON/source, and the success state explicitly says
that no project files were created or checked.

**Required correction:** retain versioned repository publication in the CLI,
but make the browser generate a complete project preview/archive and run the
same virtual and component checks. The canonical challenge specification
should express semantic roles, not prose heading strings.

### G1.6. The world contract is incomplete and differs between TypeScript and Python

**Status: Likely gap.**

TypeScript accepts only `start_line`, `start_box`, and `waypoint`
(`packages/simulator/src/world.ts`). `stop_line`, `timing_gate`, `stop_box`, and
generic non-obstacle markers requested by the course direction are absent.
Python stores marker dictionaries with much weaker validation and validates
waypoints only when accessed (`vendor/current/ucsb_xrp/world.py`).

**Required correction:** define one versioned world schema with shared
conformance fixtures and equivalent TypeScript/MicroPython validators. Add the
missing semantic marker types before developing a visual editor.

### G1.7. Folder persistence is recoverable but not cross-file transactional

**Status: Likely gap.**

`writeProjectFolder` in `apps/ide/src/project-files.ts` writes project files
sequentially and metadata last. Session metadata now supplies stable identity
and revisions, and the prior complete project is autosaved before overwrite,
but the metadata does not contain a committed file-hash set. Interruption can
therefore still leave a mixed folder generation that appears to have one saved
revision.

**Required correction:** write a revisioned metadata commit manifest containing
schema/API revision and file hashes. Detect incomplete generations on reopen and
offer restoration of the prior autosave. This should strengthen the folder as
the authority, not add another persistence tier.

### G1.8. Active PWA builds still consume mutable `current` metadata

**Status: Likely gap; mismatch guard is verified.**

The commissioning page loads the stable
`course/commissioning/manifest.json`, while the worker still treats that file
and `course/current/release.json` as network-first mutable resources
(`scripts/offline-build.mjs`). The page/manifest identity guard prevents
wrong-release USB mutation. Current uncommitted work also coordinates a safe
reload across open apps and lets IDE/Monitor defer it while work is unsaved or a
run is active (`apps/shared/offline-release-coordinator.ts` and
`apps/shared/offline-shell.ts`). That resolves unsafe reload timing, but it does
not make the active build's release metadata immutable.

**Required correction:** an app build should embed immutable,
content-addressed release URLs such as `course/releases/<build-id>/...`.
`latest` may announce an update, but the active shell must consume only its own
release. Activate a complete new worker/cache as one unit.

### G1.9. Current validation coverage does not yet match the required stress sequence

**Status: Substantially improved; physical branches remain.**

Stable Chrome now covers repeated Run/Stop across IDE and Monitor, stale-edit
auto-validation, reload/rerun, delayed folder restoration, repeated station/AP
profile cycles, wrong-robot rejection, mocked Web Serial cancel/retry/repair,
verified handoff, complete offline reopen, and course-release navigation. Still
unverified on dev.26 hardware are real hotspot/station transitions, native
serial re-enumeration, identity rejection with two physical XRPs, reset with a
changed DHCP address, deployed-site local-network permission, and representative
Windows behavior. Physical floor travel, motion-induced IMU response, and
changing ultrasonic scenes correctly remain dependent on an arena setup.

**Required correction:** record one immutable structured evidence file per
release and generate the current coverage summary from those files. Do not let
`STATUS.md`, `docs/REMAINING_HARDWARE_AND_NETWORK_SETUP.md`, and
`docs/hardware/README.md` independently claim different current states.

## P2

### G2.1. Capability detection does not cover the actual browser prerequisites

**Status: Likely gap.**

The landing page checks secure context, Web Serial, and directory picker, but
not SharedWorker, cross-origin isolation/SharedArrayBuffer, service worker and
cache availability, local-network access, or WebM recording
(`index.html:75-85`). Unsupported flows can therefore fail only after entry.

**Correction:** expose a centralized capability matrix and useful fallback
before enabling each workflow.

### G2.2. Accessibility verification is narrower than functionality

**Status: Likely gap.**

Theme contrast, focus styles, reduced motion, forced colors, and narrow layout
have tests. The repository lacks a comprehensive semantic accessibility scan,
keyboard-only focus-order/modal regression, 200% zoom check, and retained
screen-reader review. Canvas plots and worlds cannot expose the full numerical
history through labels alone.

**Correction:** add automated WCAG checks and a short manual keyboard,
screen-reader, and zoom release pass. Provide a current-values/data-table route
for telemetry represented essentially by canvas.

### G2.3. Monitor retains overlapping histories and archives only after a run ends

**Status: Likely gap; current behavior is bounded.**

The plot path clones up to 1,200 samples per update, two recorders may retain
30,000 samples each, and the worker retains a separate 10,000-event history:

- `apps/dashboard/src/DashboardApp.tsx`
- `packages/target/src/telemetry-recording.ts`
- `packages/target/src/telemetry-event-history.ts`

The recorder satisfies the current three-minute minimum, but a tab failure
during a long run loses the archive because persistence occurs after stop.

**Correction:** use one shared ring with decimated render views and journal
full telemetry in chunks when a project folder is available. Measure before
changing visible behavior.

### G2.4. Virtual execution is not fully independent of host scheduling

**Status: Likely gap, low current consequence.**

The physics core uses a fixed 20 ms step, but before the first explicit sleep
the MicroPython worker advances from `performance.now()`
(`packages/target/src/micropython.worker.ts`). CPU scheduling can affect
pre-sleep hardware interactions and overrun behavior.

**Correction:** provide an explicit virtual event clock for deterministic mode
and report controller overrun separately from simulated time.

### G2.5. Worker invalidation and build payload remain manual maintenance risks

**Status: Likely gap.**

Physical and virtual SharedWorker names are manually versioned
(`packages/target/src/physical-target.ts` and
`packages/target/src/virtual-target.ts`). The production build reports
large Monitor, IDE, and editor chunks.

**Correction:** derive worker name/handshake identity from generated build and
protocol metadata. Profile load and memory before code splitting; split only
along product boundaries that preserve offline reliability.

### G2.6. Small documentation and route inconsistencies remain

**Status: Likely gap, visual/content polish.**

The Guide brand says “Guide” but its page heading remains “UCSBXRP guide”
(`apps/guide/src/GuideApp.tsx`). The API heading remains “UCSB XRP Python API
reference” (`apps/reference/src/ReferenceApp.tsx`). These may be
reasonable product titles, but they do not exactly match the requested simple
“Guide” and “API Reference” hierarchy. The legacy `/dashboard/` route is still
built and included in navigation fallback even though it is only a redirect
(`vite.config.ts`, `scripts/offline-build.mjs`).

**Correction:** settle one shared documentation title hierarchy after visual
inspection. Retain a minimal dashboard compatibility redirect if needed, but
remove it from the application precache after a stated deprecation period.

## Deferred ideas

The following are not current release defects unless they become necessary to
solve a validated core problem:

- **Deferred idea:** full mobile-browser support. Unsupported mobile hardware
  and export flows should still fail clearly.
- **Deferred idea:** a visual world editor and simulator-generated challenge
  thumbnails. Complete the world schema and physical workflow first.
- **Deferred idea:** browser-integrated GitHub repository creation and
  authentication. The current GitHub Desktop workflow is the lower-risk
  student path; ordinary robot work must remain independent of Git setup.
- **Deferred idea:** continuous video capture and a richer annotation editor.
  Current snapshots, plots, notes, and bounded recording are functional.
- **Deferred idea:** higher physical telemetry rate. Increase it only after
  measuring effects on controller timing and service reliability.
- **Deferred idea:** physical floor-travel and motion-induced sensor validation
  until an arena permits it. Elevated-wheel encoder/motor evidence remains
  valid for the narrower claim.
- **Deferred idea:** explicit Save, Rename, Details, and additional folder
  controls. Their necessity should follow observation of the student workflow.

## Obsolete or superseded requests and mechanisms

- **Obsolete or superseded:** treating `serviceVersion == courseRelease` as the
  compatibility rule. Dev.25 correctly separates service, protocol, API,
  bootstrap, and runtime-release identity.
- **Obsolete or superseded:** accepting live file-by-file replacement of
  `/lib/ucsb_xrp*` as the course release model. The A/B slotted runtime is the
  current design; future fixes should preserve that boundary.
- **Obsolete or superseded:** repeated repair as the response to every network
  timeout. Installation state and computer/robot network reachability are
  independent; diagnose profile, SSID, route, endpoint, identity, and freshness
  before writing the robot again.
- **Obsolete or superseded:** a separate full Dashboard product. Monitor is the
  current student-facing surface; `/dashboard/` is compatibility only.
- **Obsolete or superseded:** a local Node server or Node installation as a
  student prerequisite. Node 24 is a repository-development constraint, not a
  published-app requirement.
- **Obsolete or superseded:** generic student-facing motor locks, safety tiers,
  handovers, and repeated confirmations. The intended supervised XRP workflow
  uses ordinary bounded engineering care. Development hardware actions still
  follow repository motion-test policy and must end at zero effort.
- **Obsolete or superseded:** assuming MicroPython itself is the cause of a long
  operation. Current evidence points first to service protocol, flash/thread,
  network, or state-transition behavior; a runtime change would require its own
  evidence.

## Recommended dependency order

1. Preserve the coherent dev.26 software result in Git, install it on the
   attached XRP, and repeat station-mode service, motor/encoder, IDE/Monitor,
   default-project, and second-project workflows.
2. Validate rollback, identity-aware reset rediscovery, hotspot, and
   deployed-PWA branches without weakening the slot/rollback boundary.
3. Add portable-project limits and digest-based detection of external/Git edits
   before consolidating the IDE persistence controller.
4. Consolidate endpoint rediscovery and same-request-ID transport retry.
5. Separate website/catalog release identity from robot-runtime compatibility,
   then add unique station hostnames for classroom discovery.
6. Reconcile and extend the shared world schema before building its visual
   editor.
7. Bound per-tab telemetry delivery and address residual accessibility,
   performance, worker invalidation, and visual cleanup after the physical
   baseline is stable.

This ordering closes wrong-target and wrong-project risks before expanding
authoring or presentation scope, and treats the current course-service release
problem as a release/state design issue rather than a sequence of local
patches.
