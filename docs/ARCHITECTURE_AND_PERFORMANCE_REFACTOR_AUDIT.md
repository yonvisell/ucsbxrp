# Architecture and performance audit

Audit snapshot: 2026-08-26, while the full browser and physical-XRP workflow was
still being qualified. This is a source and built-artifact audit, not a runtime
profile. Refactoring should begin only after the current end-to-end workflow has
one repeatable, committed baseline.

## Conclusions

1. Separate the web application build identity from robot-runtime compatibility.
   The current release record uses one sequence for both, so a documentation or
   UI release can unnecessarily require every XRP to be repaired.
2. Complete commissioning state only after the Wi-Fi service and robot identity
   have been verified. The present IDE handoff marker is written earlier and has
   neither an owner nor an expiry.
3. Extract project persistence from `IdeApp` before optimizing it. Manual save,
   autosave, conflict resolution, and update-safe reload currently implement
   parallel queue and revision logic.
4. Preserve command serialization, request idempotency, transactional runtime
   slots, update-safe reloads, and physical recovery mechanisms. These are not
   incidental complexity; they protect real cross-tab, flash, and RP2350 failure
   modes.
5. The clearest low-risk performance candidates are the Web Serial byte queue,
   redundant full-folder save I/O, and 10,000-event cross-tab telemetry replay.
   None has yet been measured with a profiler, so instrumentation comes first.

## Evidence and recommendations

### 1. Release identity and PWA updates

**Observed design.** `vendor/current/release.json:3-15` defines release sequence
27 and also sets the minimum robot release sequence to 27. The browser imports
that same record as both its current release and robot compatibility floor
(`packages/target/src/physical-target.ts:25-35`). The commissioning bundle uses
the same release ID and sequence for installed robot files
(`scripts/build_commissioning_bundle.py:56-99`). Current robot compatibility
accepts a runtime only when its protocol/API fields match and its sequence meets
that floor (`packages/target/src/physical-target.ts:177-230`).

**Simplification.** Give the published site and robot runtime independent
identities:

- `app_build_id`: content identity used only for PWA update/reload;
- `robot_runtime_sequence`: incremented only when installed robot files change;
- `minimum_robot_runtime_sequence`: the oldest runtime accepted by this app;
- protocol, protocol revision, and course API revision: explicit compatibility
  axes retained as they are now.

A guide, CSS, or simulator-only release must update the PWA without increasing
the robot floor. A robot-service/library change publishes a new runtime sequence
and deliberately chooses the minimum compatible sequence. Generate the
MicroPython build identity from the release manifest rather than maintaining
fallback constants in both `service.py:40` and `protocol.py:3-12`.

**PWA path.** The update coordinator correctly defers reload until an app can
save safely (`apps/shared/offline-release-coordinator.ts:17-84`), and the IDE
registers a revision-aware save gate (`apps/ide/src/IdeApp.tsx:1732-1825`). Keep
that behavior. The service worker installation is deliberately complete and
atomic: all build assets are included in the manifest
(`scripts/offline-build.mjs:53-85`) and cached before activation
(`scripts/offline-build.mjs:151-180`). Do not trade this for a network-dependent
lazy cache.

**Measured static cost.** The audited production manifest contains 223 assets,
9,836,713 bytes total; `dist/` contains 225 files and occupies 10,696 KiB. The
largest JavaScript artifacts are:

| artifact | raw | gzip |
| --- | ---: | ---: |
| Monaco editor API | 2,655,451 B | 675,346 B |
| Monitor | 1,111,746 B | 324,098 B |
| IDE | 901,586 B | 231,393 B |
| JSON language mode | 468,021 B | 121,688 B |
| JSON worker | 429,638 B | 126,945 B |
| editor worker | 300,427 B | 91,470 B |
| MicroPython worker | 221,384 B | 62,487 B |

These are build sizes, not evidence of slow interaction. Every production entry
registers the offline shell, asks the registration to update while online, then
enumerates the cache to verify every asset (`apps/shared/offline-shell.ts:317-395`).
The cost across several simultaneously opened applications is plausible but not
profiled. Measure it first. If material, elect one tab as installer with
`navigator.locks`; peer tabs can consume the existing BroadcastChannel release
notification (`offline-shell.ts:139-175`) without each repeating cache
enumeration. Route-level code splitting may reduce initial parse work while all
chunks remain precached; do not remove Monaco, ECharts, or Three.js based only on
bundle size.

### 2. Browser state, project state, and commissioning handoff

**Keep the current storage boundaries.** A single ordinary configuration file
on disk is not an adequate browser-state store: Chrome cannot silently reopen it
without a retained permission-bearing handle. The current division is sound in
principle:

- folder handles in IndexedDB (`apps/shared/course-folder.ts:45-50,93-104`);
- project identity, revision, and content digest in
  `.ucsb-xrp-project.json` (`apps/ide/src/project-files.ts:647-768`);
- small application preferences and transient cross-tab signals in
  local/session storage (`apps/ide/src/IdeApp.tsx:109-170` and
  `apps/shared/offline-shell.ts:22-47`);
- network identity in one versioned `RobotProfile`
  (`packages/target/src/target-preference.ts:25-44`).

Centralize the keys, schemas, migrations, and reset behavior behind a typed
browser-state module, but do not move robot credentials into project files or
make application startup depend on folder permission.

**Defect-prone handoff.** Commissioning writes the IDE handoff immediately after
USB installation (`apps/commission/src/CommissionApp.tsx:778-814`). Wi-Fi
runtime, compatibility, and robot identity are verified later; only then is the
RobotProfile stored and the IDE opened (`CommissionApp.tsx:847-929`). The
handoff itself is the permanent string `"pending"` with no owner, release, robot,
or expiry (`apps/shared/course-folder.ts:357-378`). A cancelled or failed Wi-Fi
stage can therefore leave a later IDE launch looking like a completed setup.

Move handoff creation to the verified branch immediately before navigation. Use
a typed, expiring, owner-specific record like the existing project-bootstrap
record (`apps/shared/project-bootstrap.ts:1-89`), and clear it on cancellation.
Include robot ID, runtime sequence, and project-folder identity so the IDE can
reject a stale or cross-robot handoff deterministically.

**Duplicate folder format.** The commissioning helper creates the default
project and writes only name and entrypoint metadata
(`apps/shared/default-project-folder.ts:33-87`). The IDE's canonical writer adds
session metadata and a content digest (`apps/ide/src/project-files.ts:801-810,
1008-1085`). Extract a small shared `ProjectFolderRepository` and have both use
the same create/read/commit format. This removes the commissioning-to-IDE
"legacy project" conversion without coupling shared code to `IdeApp`.

**Classroom discovery.** Station profiles always configure the generic hostname
`ucsb-xrp` (`apps/commission/src/commissioner.ts:663-693`), and discovery always
adds `http://ucsb-xrp.local` (`packages/target/src/target-preference.ts:146-157`).
Robot-ID checking prevents operating the wrong XRP, but mDNS ambiguity can keep
the intended robot undiscoverable in a room with many robots. Configure a stable
device-specific hostname derived from the robot ID (or the validated team name),
store it in `RobotProfile`, and retain the last DHCP address as the first
candidate.

### 3. Project persistence and recovery layers

The session model is coherent: identity, monotonic revisions, saved revision,
timestamp, and base digest are reconciled explicitly
(`apps/ide/src/project-session.ts:81-208,224-309`). Do not replace this with
last-write-wins timestamps.

The orchestration around it is duplicated. Manual save implements its own epoch,
queue, revision acknowledgement, deletion handling, and conflict reporting
(`apps/ide/src/IdeApp.tsx:1436-1529`). Autosave repeats the same sequence
(`IdeApp.tsx:1531-1636`), and release-safe reload has a third form
(`IdeApp.tsx:1732-1825`). Extract one `ProjectPersistenceController` with one
serialized `saveRevision()` operation and thin policies for manual, delayed, and
pre-update saves. This is the highest-value browser refactor: it reduces
behavioral divergence while preserving the already-tested session semantics.

Each changed save currently:

1. recursively reads and hashes the complete folder;
2. serializes the previous complete project into a rotating autosave;
3. writes every project file;
4. writes commit metadata;
5. recursively reads and hashes the complete folder again
   (`apps/ide/src/project-files.ts:1008-1085`).

This is a code-path observation, not a measured bottleneck. Instrument duration,
file count, and bytes before changing it. If it is material, preserve the
pre-write external-change digest check but write only files whose per-file digest
changed, then verify the committed aggregate digest. Do not skip the second read
until crash/external-edit tests prove an equivalent commit check.

Low-risk cleanup after the controller extraction:

- replace `Object.keys(files).length` inside every directory entry iteration
  with a counter (`project-files.ts:647-721`); the current form is quadratic but
  bounded to 250 files;
- delete the unused deprecated `chooseCourseFolder`, `rememberCourseFolder`, and
  `loadRememberedCourseFolder` wrappers (`course-folder.ts:136-139,216-220,
  416-418`) after confirming no downstream package imports them;
- move exact-source starter migrations
  (`project-files.ts:275-334`) into a versioned migration table and establish a
  removal release. Do not silently migrate anything except an exact unedited
  historical starter;
- retain the legacy workspace-handle and RobotProfile migrations until the
  oldest course installation expected in the classroom has been recommissioned.

The digest implementation concatenates the complete project into one temporary
byte array before SHA-256 (`project-files.ts:594-645`). Normal device projects
are limited to 256 KiB, so changing the digest scheme is not presently justified.
A Merkle/per-file scheme would require a careful metadata migration and is a
dangerous optimization without evidence.

### 4. Physical command and telemetry path

**Preserve command serialization.** IDE and Monitor share one physical client.
The coordinator serializes commands (`packages/target/src/physical-target-coordinator.ts:88-100`),
matching the service's one-response-at-a-time HTTP behavior
(`packages/target/src/physical-target.ts:933-945`). Commands carry stable request
IDs and the service retains 20 replies for idempotent retries
(`physical-target.ts:734-790`; `device_service/ucsb_xrp_service/service.py:1014-1035`).
Do not parallelize commands or remove reply caching.

**Telemetry is already batched at the robot boundary.** A course loop publishes
into a fixed 32-sample ring (`vendor/current/ucsb_xrp/_telemetry.py:28-36,
124-180,205-220`). The service returns all newer samples in one telemetry reply
(`device_service/ucsb_xrp_service/service.py:1106-1144`). The browser polls every
60 ms while running and 250 ms while idle (`physical-target.ts:297-305,
952-1001`). Thus a 50 Hz control loop normally sends several samples per HTTP
reply without losing its native sample timing.

The SharedWorker then expands every batch into individual events, copies every
runtime plot descriptor into every sample (`physical-target.ts:1038-1131`),
broadcasts each sample to every tab, retains 10,000 samples, and replays the full
history to each newly attached port
(`physical-target-coordinator.ts:79-85,280-329`; `telemetry-event-history.ts:5-51`).
Ten thousand samples represent 200 seconds at 50 Hz. The bounded memory is
intentional; the full attach burst is not.

After profiling, add a `telemetry-batch` worker message and port roles:

- Monitor subscribes to retained telemetry plus current status/log/runtime;
- IDE receives current status/log/runtime and the latest sample, unless a visible
  IDE feature actually consumes history;
- a new Monitor receives history in bounded chunks, not 10,000 `postMessage`
  calls in one turn;
- runtime plot definitions are sent only when their revision changes, rather
  than cloned into each sample.

This preserves sample fidelity and recording while reducing allocation and
cross-context messages. First audit consumers for mutation; reusing plot arrays
is unsafe if any subscriber changes them.

Console event IDs are retained and deduplicated in the coordinator
(`physical-target-coordinator.ts:295-308,344-362`) and again in each client
(`physical-target.ts:1780-1792`). The second layer may be removable once replay,
worker restart, and direct-client fallback tests establish exactly-once delivery.
It should not be removed speculatively.

The client intentionally has no second wrapper timeout around worker commands
(`physical-target.ts:1696-1728`); the direct network client owns those deadlines.
Reintroducing an outer timer would recreate boundary races where a valid command
reply is rejected while queued behind another tab.

### 5. MicroPython runtime and USB commissioning

`service.py` is large (1,437 lines), but a broad module split is high risk on
this target. The implementation documents shared-interpreter, shared-heap,
internal-flash, second-core import, and driver-concurrency constraints
(`service.py:415-422,439-515,527-615,645-695,910-987,1378-1437`). More imports
can increase heap pressure and move filesystem access into unsafe phases. Keep
protocol validation and networking separate as they are now; extract another
module only after measuring `gc.mem_free()` before/after service startup and
repeated run/stop/flash cycles on the RP2350.

The entrypoint import scanner recognizes only simple unindented `import` and
`from` statements and exact project module names (`service.py:381-412`). It is a
compatibility mechanism for controlled second-core imports, not a Python import
parser. Multiline imports, aliases of package children, conditional imports, and
dynamic imports can bypass its preload order. Do not "clean it up" independently.
Replace it only with a defined project-import model and tests for packages,
relative imports, aliases, repeated runs, and top-level side effects.

The run path's normal intentional deferral is 80 ms
(`service.py:45-52,645-680`). Six- and ten-second leases and the 2.5-second stop
grace are recovery deadlines, not normal operation delays. Reducing them will
not make an ordinary Run faster and can make a browser interruption reset a
healthy program.

The clearest commissioning performance candidate is in Web Serial. Incoming
bytes are appended to a JavaScript array, then removed one at a time with
`shift()` in both exact and delimiter reads
(`apps/commission/src/web-serial.ts:114-147,205-245`). Array-front removal is
linear and can amplify work during runtime-file transfer. This is a
high-confidence algorithmic hypothesis, not a measured duration. Replace it
with a chunk queue plus byte offset (or a bounded circular buffer), retain the
same timeout/error API, add large-transfer and split-delimiter tests, and run a
synthetic benchmark before and after.

### 6. Compatibility code: remove by support boundary, not appearance

Candidates that can be retired together after the minimum supported runtime is
explicitly advanced:

- legacy single-sample telemetry response handling
  (`physical-target.ts:1051-1057` and `service.py:964-987,1120-1144`);
- legacy `/api/v1/state`, once the hardware harness uses the telemetry endpoint
  (`service.py:1097-1103`; its current caller is
  `tests/e2e/physical-hardware.spec.ts:138`);
- legacy `courseRelease`/`serviceVersion` aliases in `/api/v1/info`
  (`service.py:1056-1073`), with a protocol-revision bump;
- the v1 RobotProfile migration (`target-preference.ts:112-138,288-305`);
- old Stage One localStorage recovery after a published deprecation window
  (`project-files.ts:337-390`).

Keep the legacy Wi-Fi profile normalization and old AP-address repair
(`device_service/ucsb_xrp_service/networking.py:18-91`) until existing robots
have passed recommissioning. Keep `/dashboard/` as a temporary URL alias if
published bookmarks exist; its small routing cost is not a performance concern.

## What is measured and what remains hypothetical

Measured in this audit:

- current production file count and raw/gzip artifact sizes listed above;
- static limits: 32 robot samples, 10,000 browser telemetry events, 2,000
  retained console events, 60/250 ms polling, and 223 precached assets;
- source-path duplication and exact serialization/replay operations cited above.

Not measured:

- page load, parse, render, or long-task duration;
- service-worker install/update/cache-verification latency;
- project save duration by file count/bytes;
- SharedWorker heap, structured-clone cost, or tab-attach latency;
- Wi-Fi request latency, lost-sample rate, or RP2350 CPU/heap headroom;
- Web Serial commissioning time attributable to the byte queue.

The next performance stage should capture those quantities before setting
budgets or changing behavior. Static size alone is not a bottleneck diagnosis.

## Recommended order after the complete workflow passes

1. **Freeze the evidence baseline.** Commit the passing browser/physical state;
   retain cold-load, commissioning/repair, station/AP, virtual run, physical
   flash/run/stop/reset, cross-tab, telemetry, and external-folder-edit evidence.
2. **Decouple release identities.** Add independent app and robot sequences,
   generate MicroPython identity, and test a web-only update against an older but
   compatible XRP runtime.
3. **Make commissioning atomic.** Move the handoff after identity verification,
   use an expiring typed handoff, use the canonical project repository, and add a
   device-specific station hostname.
4. **Extract browser persistence.** Create one persistence controller without
   changing behavior; run conflict, external-edit, multi-tab, autosave, and
   update-reload tests before and after.
5. **Instrument.** Add development-only performance marks around offline-shell
   verification, folder commits, USB transfer, connect/check/flash/run/stop, and
   telemetry delivery; collect Chrome traces and RP2350 free-heap observations.
6. **Apply low-risk wins in measured order.** Start with the Serial chunk queue,
   the project file counter, and any demonstrated redundant folder I/O.
7. **Batch SharedWorker telemetry.** Preserve ordered samples and recording;
   reduce per-sample cloning and attach replay only after a before/after trace.
8. **Prune compatibility as one protocol change.** Advance a documented support
   floor and remove client/service fallbacks together.
9. **Refactor MicroPython only if evidence requires it.** Keep the run/worker,
   flash-slot, watchdog, and import boundaries intact; qualify every structural
   change with repeated hardware run/stop/flash/repair cycles.

This order removes state ambiguity before pursuing speed, and it avoids a broad
rewrite of the two most hardware-sensitive state machines while their current
behavior is still being established.
