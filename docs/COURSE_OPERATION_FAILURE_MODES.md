# Course operation failure modes

Date: 2026-08-26

> **Historical adversarial snapshot (2026-08-26, dev.22).** This document
> preserves failure hypotheses and classroom-risk reasoning from that release.
> Its implementation descriptions and priorities are not current. Use
> `STATUS.md` for retained evidence, `IMPLEMENTATION_PLAN.md` for the live work
> sequence, and `docs/VALIDATION_PLAN.md` for current validation boundaries.
> Reassess a hypothesis below against the current architecture before acting on
> it.

## Purpose

This document asks what can interrupt a laboratory when a full undergraduate
class uses UCSBXRP. It is deliberately adversarial, but it is not a certification
checklist and it does not assume that every reported observation has the stated
cause. User reports in `USER_REQUIREMENTS_AND_INTENT.md` are design evidence, not
objective truth. A reported symptom remains an observation until it is
reproduced and localized.

The analysis is grounded in the current repository: release
`2026.08-dev.22`, the generated offline shell, browser folder model, physical and
virtual shared targets, commissioning installer, on-robot service, current
hardware records, and current validation/status documents. It distinguishes:

- **Confirmed behavior**: directly apparent in current code or retained physical
  evidence.
- **Observed problem**: reported or recorded, but its generality or root cause is
  not established.
- **Hypothesis**: a credible failure that still requires deliberate testing.

Priorities refer to classroom disruption, not safety severity:

- **P0**: can stop much of the class, select the wrong robot, or threaten many
  projects at once.
- **P1**: likely to stop one team for a material part of a laboratory or risk a
  team's work.
- **P2**: recoverable edge case or degraded evidence that should not consume an
  instructor's attention during class.

## Central finding

The strongest parts of the present system are integrity within one known
release: the web shell is content-addressed, the USB installer hashes every
managed destination, physical project flashing uses alternating slots, project
identity is content-derived, and browser and robot logs carry explicit state.
The most consequential unresolved risk is integrity *across* releases.

The web shell already has its own content-derived cache identity and can change
without changing the robot release. The physical compatibility check is much
coarser: it requires both the robot's `courseRelease` and `serviceVersion` to
equal the `release_id` embedded in the web application, while the current
service build sets both robot values to that same release string. The service
does not report the installed managed-file digest or `ucsb_xrp` version over
Wi-Fi. A compatible service/library correction therefore has two unsatisfactory
choices: retain the old version string and allow genuinely different installed
bytes to appear current, or increment it and make every unupdated robot
incompatible with the current page. Course content has no separate explicit
revision, and an old project has no metadata declaring the API or template
revision for which it was created. Exact release equality therefore blocks
changes that may be safe while failing to prove equality where it matters.

For a course in progress, the product needs five explicit, related states:

| State | Meaning | Update rule during the term |
| --- | --- | --- |
| Web build | IDE, Monitor, simulator, Guide, commissioning UI, workers | May receive compatible fixes; activation waits for an idle, saved boundary. |
| Course-content revision | Challenge text, worlds, parameters, checks, and templates | May change without reinstalling robot software; existing projects are never silently overwritten. |
| Project lineage | Template ID, template revision, base file hashes, and local project revision | Records what a team started from and whether a proposed update conflicts with its edits. |
| Robot runtime | Firmware, XRPLib, `ucsb_xrp` API/implementation, reference bytecode | Normally frozen for the term; changed only for a demonstrated runtime defect. |
| Robot transport service | Protocol version, capabilities, and service implementation | Compatible browser/service ranges permit rolling updates; an incompatible protocol change requires USB repair. |

The ordinary entry point should remain the one published HTTPS page. Students
should open it while internet is available and wait until the current course
apps are fully stored before joining a robot hotspot. An installed PWA is a
launcher and offline fallback for that same origin and Chrome profile, not a
second distribution. Requiring the live page alone is not sufficient: the XRP
hotspot has no internet, service workers can legitimately retain an older
complete build, and loading the current page does not update a previously
created local project or the robot runtime.

The stable operating policy should therefore be:

1. Freeze a term runtime and protocol unless a physical/runtime defect requires
   change.
2. Publish browser and course-content fixes through the canonical page with a
   visible build/content revision and compatibility result.
3. Download and verify an update immediately, but do not activate or reload it
   while a program is running, a folder write is pending, a dialog is open, or
   unsaved editor state has not reached the browser backup.
4. Treat every created project as student-owned. A challenge update is a
   separate, explicit, reversible operation, not template reloading.
5. Keep the preceding complete web build and robot runtime installable until the
   new build has survived a representative classroom transition.

At the start of a session, one preflight should resolve the desired term-stable
channel from the network, verify and cache its complete web/content manifest,
and report both **available** and **active** revisions. When a robot is reachable,
the same view should compare its reported installed-manifest digest and
compatibility fields. `Current` should mean that the relevant bytes or declared
compatibility have been established; it should never mean only that two manually
maintained strings happen to match.

## Safe challenge and project updates

Current templates are immutable inputs and new project folders do not overwrite
an existing named folder. This is a sound starting point. The missing operation
is updating a challenge that students have already instantiated.

A clean mechanism should add `templateRevision`, required API compatibility,
and the base hash of each template file to `.ucsb-xrp-project.json`. An update
package should identify exactly which source template and revision it replaces.
For each file:

- if the local hash still equals the recorded base hash, the new version can be
  applied after creating the normal complete recovery snapshot;
- if the local file differs, the student's bytes remain authoritative and the
  update is shown as a conflict or written as a clearly named candidate file;
- student component files are never replaced;
- hybrid files such as `course_setup.py` require a semantic operation that
  preserves component-selection choices, not a whole-file overwrite; and
- the complete multi-file update commits atomically from the user's perspective
  and records its prior and resulting revisions.

For an urgent in-class correction, creating a **revised challenge copy** is the
lowest-risk fallback: instantiate the corrected template in a new folder, carry
forward only declared student component files and selections, and retain the
old project untouched. It is less elegant than a clean three-way update but is
safer than asking every team to paste code or reload a template over its work.

An alternative is to keep instructor-owned task data in a separately versioned
challenge pack and combine it with the student project only when validating or
flashing. This makes a live correction easy, but the resolved run must still be
reproducible offline, the exact pack revision must be archived with telemetry,
and students must not be able to confuse an overlay with files they can edit.
That architecture is worthwhile only if challenge updates prove frequent; it is
not automatically simpler than conflict-aware local updates.

## Failure hypotheses by workflow

### 1. Version equality either hides runtime drift or forces fleet lockstep — P0

**Status.** Confirmed architectural coupling; the classroom consequence is a
hypothesis. `physical-target.ts` rejects any robot whose course release or
service version is not exactly the browser's `release_id`, and the commissioning
bundle also requires exact page/manifest release equality. Conversely, `/info`
does not establish the hashes of the installed runtime, and `ucsb_xrp` currently
retains one `0.4.0-dev` version across multiple enclosing development releases.

**Observable symptom.** After opening the current page, many teams simultaneously
see a release-mismatch message and cannot Flash, Run, Stop through the normal UI,
or see telemetry. Alternatively, every version label says current although some
robots still contain older service/library bytes and reproduce a fixed defect.

**Plausible causes.** A backward-compatible service or library fix incremented
the exact release; the version constant was deliberately left unchanged to avoid
that disruption; a course-content change was incorrectly treated as a robot
release; different machines activated new pages at different times; some robots
were repaired and others were not.

**Product prevention, detection, and recovery.** Separate web/content revisions
from runtime/service compatibility. Report the installed managed-release digest,
service build, library version/API revision, protocol range, capabilities,
firmware, and XRPLib identity. Check compatibility ranges plus required hashes
rather than one string. Permit at least the previous compatible service during a
rolling classroom update. If a robot update is genuinely required, state why and
offer the idempotent USB repair; do not describe a challenge-text change as robot
software damage.

**Evidence still needed.** Exercise a transition matrix with web build N and
N+1, robot service/library N and N+1, and projects created by both content
revisions. Include an old runtime that falsely reuses the new version string.
Prove which pairs run, which pairs receive a precise block, that all reported
identities correspond to verified bytes, and that a content-only release never
requires USB work.

### 2. Automatic service-worker activation reloads active work — P0

**Status.** Confirmed current behavior; disruption has not been demonstrated at
class scale. On online startup the app explicitly checks for a new worker, verifies
the complete precache, and reloads once for a changed build or missing isolation.
There is no update activation gate tied to run state or the IDE's 900 ms folder
autosave.

**Observable symptom.** The editor or PWA refreshes while a student is typing,
flashing, recording, or running. A virtual run stops. A physical run may continue
briefly and then reset when its lease is no longer renewed. The reopened page may
ask to reconnect a folder or local-network permission.

**Plausible causes.** A deployment occurred during class; a laptop was asleep
while an update became available; the first service-worker-controlled load needs
the isolation refresh; a pending source write had not completed.

**Product prevention, detection, and recovery.** Download and verify in the
background, then expose `Update ready`. Activate only when both targets are idle,
no file operation is pending, browser backup is current, and the user is not in a
modal operation. A sole physical client should explicitly Stop and verify zero
command before its worker is discarded. After reload, restore the exact project,
active file, cursor, target, and update result. Instructor deployment should be
pausable during laboratory hours.

**Evidence still needed.** Trigger an actual update while typing within the
autosave debounce, during folder save, during virtual and physical runs, during
manual recording/export, and with IDE and Monitor in separate windows. Inspect
disk, browser backup, final motor command, run archive, and post-reload state.

### 3. Old and new tabs, PWA windows, or Chrome profiles form split products — P0

**Status.** Hypothesis. One origin and profile normally share local storage and a
named `SharedWorker`; different profiles, incognito windows, localhost versus
Pages, or an old deployment path do not. The previous complete cache is retained
during an update, so old JavaScript can coexist transiently with a new page.

**Observable symptom.** IDE and Monitor disagree about target, project, Run state,
or release. Two physical pollers contact one XRP. A newly opened window appears
fresh and offers the default project while another contains the team's work.

**Plausible causes.** The PWA was installed under another Chrome profile; one tab
uses `localhost` and another the public origin; one window has not reloaded after
an update; `SharedWorker` construction failed and each app selected its direct-
client fallback.

**Product prevention, detection, and recovery.** Display origin, profile-local
web build, course-content revision, and shared-session ID in the diagnostics.
Refuse cross-build coordination when worker/client protocol versions differ.
Prefer one canonical URL in student documentation. If `SharedWorker` is
unavailable, state that cross-window operation is degraded and enforce a
single-controller lease rather than silently opening independent clients.

**Evidence still needed.** Run two old/new tabs through a real deployment update;
open the installed PWA plus browser tabs in the same and different profiles;
force the direct-client fallback; and inspect the number of device requests and
the consistency of Run/Stop/project events.

### 4. A bad web or robot update has no usable classroom rollback — P0

**Status.** Hypothesis supported by current architecture. The service worker
retains one preceding complete cache, and the robot installer is repeatable, but
there is no ordinary user control to select the previous web build or reinstall
the previous robot runtime. Exact release equality also makes independent
rollback of only one side unusable.

**Observable symptom.** A newly deployed build fails across the room; clearing
site data makes matters worse because the class is about to leave internet Wi-Fi;
robots already updated cannot communicate with the restored old page.

**Plausible causes.** A build passed unit and single-device tests but fails under
scale, Windows, a campus permission policy, or a particular project. Deployment
was automatic from `main` during class.

**Product prevention, detection, and recovery.** Use a term-stable release
channel with an explicit promotion step. Retain a tested prior complete web build
and robot bundle, plus a compatibility window that permits asymmetric rollback.
Provide an instructor-visible `Use previous classroom release` operation rather
than asking students to manipulate site data. Preserve all project folders
through rollback.

**Evidence still needed.** Deliberately deploy a defective candidate to a test
origin, upgrade one robot and several browser profiles, then recover without
deleting project files, browser recovery, or permissions. Verify rollback while
offline and after hotspot transition.

### 5. An old project compiles against a new runtime but is behaviorally wrong — P0

**Status.** Confirmed metadata gap; behavioral failure is a hypothesis. Current
project metadata stores name, entrypoint, and template ID, but not template
revision, required API version, base hashes, firmware assumptions, or migration
history. `ucsb_xrp` is marked `0.4.0-dev` while the enclosing release changes.

**Observable symptom.** Validate passes, but a robot behaves differently after a
course update; a reference/student selector imports the wrong interface; units,
defaults, or semantics differ without a useful incompatibility message.

**Plausible causes.** A nominally compatible method changed semantics; a project
copied between teams lacks provenance; a challenge was created under an older
template; reference `.mpy` and source expectations differ.

**Product prevention, detection, and recovery.** Record required API compatibility
and project lineage. Check those requirements before validation or flashing.
Use explicit migrations whose input revision is known and whose output is a new
recoverable project revision. Maintain behavior tests at public boundaries; do
not infer compatibility from successful parsing.

**Evidence still needed.** Retain representative projects from each shipped term
revision and run their component checks and virtual/physical no-motion paths
against later compatible runtimes. Include an intentionally incompatible API
change and verify a precise pre-run block.

### 6. First launch is incomplete before the laptop joins the XRP hotspot — P0

**Status.** Mitigated in design and browser tests; class-scale and storage-
pressure behavior remain hypotheses. The complete shell includes applications,
workers, MicroPython, course files, firmware, and documentation, and the wizard
waits for readiness before network handoff.

**Observable symptom.** After joining the robot hotspot, a page is blank, a
worker or WASM file fails, Setup cannot fetch a changed robot file, the Guide is
missing, or virtual Run is disabled indefinitely.

**Plausible causes.** The student changed networks before readiness; a browser
process was closed during precache; storage quota/eviction removed part of the
origin; the first-load isolation refresh had not occurred; the wrong Chrome
profile was reopened.

**Product prevention, detection, and recovery.** Make `Current course apps
verified in this Chrome profile` a hard prerequisite only for hotspot setup,
with the exact web/content revision and a retry that verifies cache contents.
Detect quota and private/incognito limitations. Preserve internet-return
instructions on screen and in a small printable course note. If incomplete,
return to internet Wi-Fi and reopen the canonical URL; do not recommission the
robot.

**Evidence still needed.** Interrupt cache installation at multiple points,
simulate quota failure and eviction, close/reopen Chrome and the installed PWA,
then repeat the hotspot transition on current macOS and Windows Chrome.

### 7. The student opens the wrong Chrome profile or loses site data — P1

**Status.** Hypothesis with known browser-storage consequences. Clearing site
data removes the web cache, browser project backup, remembered handles, endpoint,
and origin-scoped permissions; it does not remove ordinary project folders.

**Observable symptom.** UCSBXRP opens as a fresh installation with Expanding
Spiral, no course folder, and Virtual target. The student concludes that work was
lost or creates a second default folder.

**Plausible causes.** Personal/school Chrome profiles were switched; Guest or
Incognito was used; browser cleanup or institutional policy removed origin data;
the PWA belongs to another profile.

**Product prevention, detection, and recovery.** Treat disk project folders and
Git as durable; describe browser backup as temporary. On fresh state, emphasize
`Open existing project` before `Create`. A project folder's metadata should make
recovery self-contained. The setup/diagnostic page should identify the current
origin and absence of remembered state without implying disk loss.

**Evidence still needed.** Clear all origin data and recover only from a project
folder and Git on both operating systems. Verify that no action overwrites the
folder merely because the browser is fresh.

### 8. A browser or enterprise policy fails only at the first privileged step — P1

**Status.** Partly detected; policy diversity is untested. Desktop Chrome and
Edge are the stated targets, but Web Serial, File System Access, service workers,
local-network access, downloads, and popups have separate capability and policy
boundaries.

**Observable symptom.** Virtual editing works, then folder selection, serial
selection, local XRP fetch, PWA installation, or export fails. The student
interprets it as a robot defect.

**Plausible causes.** Unsupported browser, school-managed Chrome policy,
disabled third-party or local-network features, pop-up/download blocking,
private mode, or an outdated browser.

**Product prevention, detection, and recovery.** Run a concise capability
preflight before class operations and name the missing capability. Do not gate
virtual work on optional PWA installation or Git. Keep virtual/browser-backup
work available while directing the affected team to a supported lab laptop.

**Evidence still needed.** Test a representative managed Windows laptop, not
only an unrestricted development Mac. Deny each permission independently and
verify that the recovery message identifies folder, serial, local network, or
download rather than reporting a generic connection failure.

### 9. An instructor publishes a revised challenge, but existing teams remain on different tasks — P0

**Status.** Confirmed current limitation. Updating the catalog changes future
template instances; an already-created project remains an independent local
copy. No same-challenge update or template revision comparison exists.

**Observable symptom.** Some teams see corrected distances, world geometry, or
instructions while others run the original task. Results cannot be compared and
the instructor cannot tell which revision generated a run.

**Plausible causes.** Some teams recreated the project or refreshed the page;
others continued an existing folder; a cached page retained the prior template;
the correction touched several files but was communicated as one value.

**Product prevention, detection, and recovery.** Implement the project-lineage
and conflict-aware update mechanism described above. Display challenge revision
in the project and include it in run metadata. For the current implementation,
the safe fallback is a new revised project folder plus declared carry-forward,
never reselecting a template into the old folder.

**Evidence still needed.** Update `challenge.py`, `world.json`, README, checks,
and `course_setup.py` together in test projects where none, one, or all files
have student edits. Verify student files byte-for-byte, old folder preservation,
and identical resolved run revisions across teams.

### 10. A challenge update overwrites legitimate student edits — P0

**Status.** Hypothesis for any future updater; current template creation avoids
this by not updating existing folders. The risk is central because students may
reasonably edit `challenge.py`, `robot_config.py`, `world.json`, `main.py`, or
even supplied scaffolding while diagnosing a problem.

**Observable symptom.** Calibration, task parameters, comments, selected student
components, or debugging code disappears after `Update challenge`; the project
still runs, so loss may be noticed only later.

**Plausible causes.** Files were classified rigidly as instructor-owned; an
updater compared only file names, not base hashes; a semantic merge reset
selection flags; update ran while autosave or Git was changing the same folder.

**Product prevention, detection, and recovery.** No local byte is overwritten
unless it still matches its recorded template base or the user accepts an
explicit diff. Acquire the same folder write lock as autosave and run archives,
write a complete pre-update snapshot, verify the final revision, and keep
conflicts visible. Never use timestamp alone as evidence of ownership.

**Evidence still needed.** Fault-inject edits to every project file, including
same-line changes and line-ending differences, and interrupt update between
files. Recover using both the normal UI and the rotated JSON snapshot.

### 11. External Git or filesystem changes are overwritten by the open IDE — P0

**Status.** Confirmed architectural risk; no reproduced loss is recorded. The
IDE reads a project folder when opened, then holds an in-memory project and
autosaves it after edits. It does not observe external modifications. Reconnect
after permission loss attaches the browser recovery copy and can subsequently
save it over newer disk content.

**Observable symptom.** A teammate pulls from GitHub Desktop or edits a file in
another editor, then the browser silently restores its older in-memory version.
Git reports an unexpected reversal or conflict.

**Plausible causes.** Git pull occurred while the IDE remained open; two laptops
used a cloud-synchronized folder; permission was lost while disk changed; a
service-worker reload restored browser state before re-reading the folder.

**Product prevention, detection, and recovery.** Before every disk write, compare
current file hashes or a folder revision with the values last read/written. If
external change is detected, stop autosave and offer Reload, Compare, or Save as
new project. Add an explicit `Reload project from folder` operation. Until then,
the Guide should instruct teams to close/reload the project around Pull and not
edit the same checkout concurrently.

**Evidence still needed.** Modify and Git-pull files externally before, during,
and after the autosave debounce and after permission loss. Verify that a future
conflict detector never destroys either version and that recovery snapshots are
legible.

### 12. Folder writes leave a mixed project or fail differently on Windows — P1

**Status.** Per-file writes and four pre-overwrite JSON generations are
confirmed; whole-folder atomicity is not present. Current path checks reject
many Windows-invalid characters but do not cover case-insensitive collisions,
reserved device names, trailing dots/spaces, Unicode normalization, long paths,
disk-full behavior, or removable/cloud folder semantics.

**Observable symptom.** Some files update and others do not; `main.py` refers to
new code while another module is old; `Main.py` and `main.py` collapse to one
file; autosave stays at error; a project works on macOS but cannot be cloned or
written on Windows.

**Plausible causes.** Power loss/browser crash between file writes; full disk;
OneDrive/iCloud interference; Windows reserved name or path length; case-
insensitive filesystem; antivirus holds a file.

**Product prevention, detection, and recovery.** Validate portable names and
case-folded uniqueness at file creation/import. Write a new complete generation
and final project manifest before considering a save current, or at minimum
verify every written file and expose one-click restoration from the complete
JSON snapshot. Never report `Saved` from partial completion.

**Evidence still needed.** Run actual Windows NTFS/OneDrive and macOS APFS tests,
inject failure after each file, exhaust available space in a bounded test
volume, and recover a runnable project without manual JSON surgery.

### 13. USB selection reaches the wrong or no XRP — P1

**Status.** Partly mitigated. The picker filters the SparkFun VID/PID, a previously
authorized single controller can be confirmed, and more than one granted XRP is
reported. Device identity beyond VID/PID is not bound through the later Wi-Fi
handoff.

**Observable symptom.** No serial device appears although the board has power;
the port is busy; Setup modifies another team's attached robot; or a cancelled
picker leaves Setup appearing active.

**Plausible causes.** Charge-only or damaged cable, unpowered hub, terminal or
`mpremote` holding the port, multiple robots attached/authorized, wrong Chrome
profile permission, USB disconnect during raw REPL, or user cancellation.

**Product prevention, detection, and recovery.** Distinguish `no USB data
device`, `port busy`, `selection cancelled`, and `multiple XRP controllers`.
Read a stable hardware/radio identity over USB and carry it through commissioning
to network verification. Release failed sessions promptly and return the robot
to normal boot. Recovery is to close the competing serial tool, use a known data
cable/direct port, leave one robot attached, and repeat the idempotent operation.

**Evidence still needed.** Test charge-only cable, hub disconnect, another serial
client, repeated cancel/select, two authorized XRPs, two simultaneously attached
XRPs, and browser closure at each raw-REPL stage on both operating systems.

### 14. Firmware recovery writes the wrong volume or does not re-enumerate — P1

**Status.** Browser automation covers the branch; the attached correct controller
has not needed a realistic UF2 repair. The chosen volume name is checked for
`RP2350` or `RPI-RP2`, and the firmware asset is hash-verified before writing.

**Observable symptom.** Firmware copy appears complete but the expected serial
port never returns; the browser requests the device again; another RP2350 board
was updated; files formerly on the robot disappear.

**Plausible causes.** More than one bootloader volume, incorrect volume despite a
generic name, OS copy still pending, USB cable reset, firmware legitimately
reformats/changes the filesystem, or re-enumerated permission differs.

**Product prevention, detection, and recovery.** Require only one RP2350
bootloader device present and preserve the USB identity where the platform
allows. Treat post-write re-enumeration and exact MicroPython/board inspection as
the success criterion, not closing the file write. Always continue through a
complete course-file comparison after firmware.

**Evidence still needed.** Use a controller with genuinely incompatible
firmware, power-cycle at safe branch boundaries, and test Windows/macOS volume
copy and re-enumeration. Do not rewrite a working classroom controller merely to
claim coverage.

### 15. USB repair is interrupted between managed files, leaving a mixed runtime — P0

**Status.** Confirmed design boundary. Each changed destination is installed via
a temporary file and rename, and all destinations are re-hashed before reset;
however the multi-file runtime update itself is not one atomic transaction. On
an error the wizard attempts reset, which can boot a partially updated set.

**Observable symptom.** The wizard fails or the laptop loses power; afterward the
robot service will not start, imports fail, or version constants disagree even
though some file hashes are current.

**Plausible causes.** USB loss, browser/OS crash, controller reset/watchdog,
filesystem full, or memory failure after several files have been replaced.

**Product prevention, detection, and recovery.** Add an on-device managed-release
manifest with `installing`, expected hashes, and `active` state. Prefer two
runtime slots plus an active pointer if flash capacity and MicroPython import
paths permit; otherwise retain rollback copies of replaced managed files until
complete import verification. A partial state should boot a small recovery
service or state plainly that USB repair is required, not present itself as an
ordinary compatible service. Repeating Setup remains the immediate recovery.

**Evidence still needed.** Interrupt power/USB after every changed file and
during final hash/import checks. Confirm either the preceding runtime boots or
the robot enters a deterministic repair-required state, and that one repeat
restores it without a full firmware flash.

### 16. Obsolete managed files survive an update and shadow the new runtime — P1

**Status.** Hypothesis supported by installer scope. The manifest verifies
expected destinations but does not enumerate and remove files that belonged to
an earlier release and no longer belong to the current one.

**Observable symptom.** A removed/renamed module still imports, a stale package
child is selected, behavior differs between a fresh and repeatedly updated XRP,
or flash storage fills over the term.

**Plausible causes.** Package reorganization, renamed reference modules, old
temporary files, or an earlier experimental install outside the current file
map.

**Product prevention, detection, and recovery.** The managed-release manifest
must record ownership. After the new complete set verifies, delete only obsolete
paths previously owned by UCSBXRP; never sweep unrelated student files. Report
unexpected managed-tree contents. Namespace eviction before verification, which
fixed the prior cached-module regression, remains necessary but is not a
filesystem cleanup substitute.

**Evidence still needed.** Install a prior layout containing renamed and removed
modules, update it, reboot, enumerate the managed trees, and compare imports with
a freshly commissioned robot.

### 17. Hashes match but the freshly installed runtime is not actually usable — P1

**Status.** A specific stale-`sys.modules` verifier defect was observed and fixed;
current verification evicts only the course namespaces, collects garbage, then
imports the library, reference package, service, and required XRPLib modules.
Other runtime-resource failures remain hypotheses.

**Observable symptom.** `Installed runtime mismatch` repeats after a clean
readback, or the verifier passes but the service fails only after reset or first
Run.

**Plausible causes.** Cached modules, insufficient heap, MicroPython-only syntax,
import-order side effect, stale bytecode ABI, hardware peripheral initialization,
or a boot path not exercised in the raw REPL.

**Product prevention, detection, and recovery.** Keep file integrity, clean
imports, and post-reset service proof as separate states. Compile every installed
service module with the exact MicroPython target before release. Include actual
and expected library, service, protocol, firmware, and missing-module values in
the error. Do not rewrite matching files repeatedly when the failing boundary is
network or boot.

**Evidence still needed.** Repeat same-release repair after long runs and low-
memory projects, then cold boot and exercise `/info`, Flash, and a no-motion Run.
Inject an import failure with correct hashes to verify phase-specific diagnosis.

### 18. The post-USB Wi-Fi probe verifies another team's robot — P0

**Status.** High-confidence architecture hypothesis. Hotspot SSIDs are unique,
but all station profiles currently use hostname `ucsb-xrp`, the client fallback
includes `http://ucsb-xrp.local`, and the Wi-Fi handoff verifies release/protocol
without comparing a USB-observed device identity. On a shared LAN, several
robots can therefore advertise the same hostname. On hotspots, every robot has
the same `192.168.4.1` address, so selecting the wrong SSID still reaches a valid
same-release XRP.

**Observable symptom.** A team's IDE successfully connects, flashes, and runs a
nearby team's robot. Both pages appear healthy; the error is physical identity,
not connectivity.

**Plausible causes.** Student joins the wrong saved hotspot; duplicate optional
team name; generic mDNS hostname resolves nondeterministically; stale DHCP
address now belongs to another XRP; identity is inferred from address/release.

**Product prevention, detection, and recovery.** Give every XRP a stable public
device ID and unique hostname derived from its radio/controller identity. Bind
the USB-selected ID, configured SSID, post-reset `/info` ID, retained target
profile, and visibly labeled physical robot. Reject a reachable same-release
robot whose ID differs. Permit an explicit `Use this different XRP` reassignment
only when the user can identify it physically.

**Evidence still needed.** Put multiple same-release XRPs on one LAN and expose
their mDNS records; deliberately join the wrong hotspot; reuse an old DHCP
address; and verify that Setup, IDE, and Monitor refuse the wrong identity.

### 19. Campus or local station Wi-Fi cannot carry peer robot traffic — P0

**Status.** Environmental hypothesis. The design supports station mode, but
campus secure networks commonly involve enterprise authentication, client
isolation, captive policy, or 5 GHz steering that a small 2.4 GHz robot may not
support. The current station form assumes an SSID and password of at least eight
characters, not open or enterprise credentials.

**Observable symptom.** The XRP reports a failed station join and starts its
fallback hotspot, or both laptop and robot appear on the named network but the
laptop cannot reach the service. Many teams fail together at one location.

**Plausible causes.** WPA enterprise rather than pre-shared key, AP/client
isolation, guest network, multicast/mDNS filtering, captive portal, 5 GHz-only
coverage, DHCP exhaustion, or firewall policy.

**Product prevention, detection, and recovery.** Qualify one dedicated 2.4 GHz
course network with peer communication, or make per-robot hotspots the documented
campus default. Report requested mode, effective fallback mode, SSID, address,
and station failure reason. Never tell the student to repair files when USB has
verified them and only network reachability failed.

**Evidence still needed.** Test the actual classroom network with a representative
number of robots and laptops, including DHCP renewal and AP roaming. Record
whether peer unicast, mDNS, local-network permission, and internet coexist.

### 20. A room of robot hotspots becomes unreliable or confusing — P0

**Status.** Scale hypothesis. Device-specific SSIDs and deterministic channels
1/6/11 reduce naming and channel overlap, but a full class has many access points
and laptops in one room. The laptop loses internet while attached to a robot AP.

**Observable symptom.** SSIDs appear slowly or disappear, association drops,
telemetry becomes intermittent, students join adjacent robots, or operating
systems automatically return to the internet network mid-run.

**Plausible causes.** Channel contention, near/far interference, saved-network
auto-join priorities, duplicate chosen team suffixes, laptop power management,
or the robot rebooting under load.

**Product prevention, detection, and recovery.** Enforce and display unique
robot identity independent of SSID. Preassign or inspect team hotspot names and
channels. Keep polling and telemetry bounded, make reconnection explicit, and
retain the current project during network loss. If scale measurements are poor,
prefer a qualified course router rather than adding more retry logic.

**Evidence still needed.** Operate a representative full cohort concurrently in
the actual room, not sequentially on one robot. Measure association time,
request latency/loss, Stop latency, telemetry gaps, channel occupancy, and wrong-
SSID attempts.

### 21. Local-network permission, firewall, VPN, or endpoint discovery mimics a dead XRP — P1

**Status.** Partly mitigated and partly environmental. The document primes
Chrome's HTTPS-to-local-HTTP permission, device responses include CORS/private-
network headers, and the endpoint reported by the XRP becomes authoritative.

**Observable symptom.** USB setup succeeds, the correct Wi-Fi is visible, but
Chrome reports `Failed to fetch` or repeated one-second/three-second timeouts.
Another browser/origin may work.

**Plausible causes.** Chrome local-network denial, macOS Privacy & Security,
Windows firewall/public-network classification, VPN/proxy, endpoint security,
wrong network, stale DHCP address, blocked mDNS, or service still booting.

**Product prevention, detection, and recovery.** Diagnose layers in order:
computer network/route, expected robot identity, direct `/info` reachability,
browser permission, then service compatibility. Provide OS-specific permission
guidance only for the detected phase. A connection retry should preserve the
verified USB installation and project state.

**Evidence still needed.** Deny each permission, enable a VPN/proxy and Windows
public firewall, change DHCP address, disable mDNS, and compare browser versus a
direct network probe. Confirm error text identifies the layer.

### 22. Reset/reconnect timing is shorter than real station startup — P1

**Status.** Concrete mismatch requiring remeasurement. Current physical-client
reset recovery has an 8 s deadline, while retained attached-hardware evidence
records a 17 s station-mode return after reset in an earlier release. Other
reconnect paths and commissioning use different windows.

**Observable symptom.** Reset reports failure and disables controls although the
XRP becomes reachable several seconds later; retry then succeeds without any
repair.

**Plausible causes.** Wi-Fi association/DHCP variation, congested AP, service
boot time, inconsistent timeout constants, or the earlier measurement no longer
representing current firmware.

**Product prevention, detection, and recovery.** Derive reconnect ceilings from
measured boot distributions for hotspot and station modes, while reporting
progress and permitting cancellation. Keep short per-request deadlines inside a
longer bounded state-transition window. Accept a late authoritative ready event
instead of leaving app-local error state.

**Evidence still needed.** Measure cold/warm reset-to-`/info` distributions over
many repetitions on both networks and under room load, then test IDE/Monitor
state through the slow tail.

### 23. An edit and Monitor Run occur nearly simultaneously — P1

**Status.** Architecture hypothesis. IDE file changes mark the shared project
stale after a 160 ms debounce. In two windows, one student can edit while the
partner presses Run before that event reaches the shared target.

**Observable symptom.** Monitor runs the preceding revision while the IDE visibly
shows new code; the robot descriptor says flashed/current for a revision the team
did not intend.

**Plausible causes.** Human concurrency across two screens, delayed worker
message, an editor update not yet committed to React state, or one app using a
direct-client fallback.

**Product prevention, detection, and recovery.** Publish a monotonically
increasing project edit epoch immediately on change, separate from the debounced
full snapshot. Run must include the exact expected project revision/epoch and be
rejected if any newer edit exists. Display the revision launched in logs and run
archives. Do not solve the race by lengthening a timer.

**Evidence still needed.** Automate edits at offsets before and after Run from a
second tab, including rapid sequences and direct-client fallback. Verify that
the launched revision always equals the latest acknowledged project snapshot.

### 24. IDE and Monitor agree on target state but save evidence to the wrong folder — P1

**Status.** Mitigated by separate remembered project handles, storage events,
folder epochs, and write locks; transition races remain hypotheses. Monitor
archives a run to the folder connected when the run starts and abandons the
write if its folder epoch changes.

**Observable symptom.** Source belongs to project B while telemetry/output is
written under project A, or a run finishes with no archive after project/folder
change. The onscreen run remains available but provenance is incomplete.

**Plausible causes.** Project changed during a run, storage event delayed,
different profile/origin, Monitor opened before the folder handle was remembered,
permission loss, duplicate Monitor tabs, or browser closure before archive.

**Product prevention, detection, and recovery.** Bind every run to target kind,
project content revision, challenge revision, robot ID, and intended archive
folder at start. Disable project switching while a physical run is active or
make the resulting archive cancellation explicit. On completion, verify the
folder still represents that project before writing.

**Evidence still needed.** Switch/open/create/reconnect folders at each run state,
close one or both tabs near completion, and use two Monitor tabs. Inspect archive
folder, fingerprint deduplication, and metadata.

### 25. Validation, Flash, and Run are mistaken for stronger guarantees — P1

**Status.** Confirmed semantic boundary. Validate compiles Python; physical Flash
also compiles and atomically activates the project slot; neither proves algorithm,
hardware wiring, calibration, environment, or safe termination.

**Observable symptom.** UI says validated/flashed/current, but the robot does not
move, turns backward, immediately reports no path, or fails after USER-button or
sensor interaction.

**Plausible causes.** Student logic error, wrong component selection, stale task
assumption, dead motor power, encoder sign, sensor absence, floor calibration,
or runtime-only exception.

**Product prevention, detection, and recovery.** Keep status dimensions literal:
syntax checked, robot runtime compatible, project revision flashed, program
running, telemetry received. Component checks and no-motion device checks should
be easy but never labeled as full mission proof. Preserve the first exception
and current project revision in output.

**Evidence still needed.** Deliberately introduce one defect at each layer and
verify the UI does not collapse them into `Run failed` or `robot not ready`.

### 26. Stop is unavailable precisely when the program or network fails — P0

**Status.** Substantial mitigations are implemented: student code normally stops
in `finally`; Stop is cooperative, then resets after a 2.5 s grace if unobserved;
the run lease is 10 s at startup and 6 s thereafter; the service watchdog is 7 s;
all paths issue zero commands on normal cleanup. Network-loss behavior at cohort
scale remains a hypothesis.

**Observable symptom.** Stop appears inert or times out while wheels continue;
the service says connecting; eventually the controller resets. Logs may end
before confirming zero output.

**Plausible causes.** Non-yielding code, shared MicroPython VM lock, Wi-Fi loss,
telemetry response blocking the single service connection, browser reload,
laptop sleep, motor-driver failure, or reset itself taking longer than UI timeout.

**Product prevention, detection, and recovery.** Stop must remain enabled during
loading/running/reconnecting, report requested/acknowledged/cooperative/reset
phases, and verify a fresh zero-command sample or explicitly say it could not.
The classroom recovery is immediate physical intervention—lift/contain the
small robot, remove motor power or press RESET—followed by phase-specific
diagnosis; it is not repeated clicking or blind re-flashing.

**Evidence still needed.** Stop infinite loops, allocation deadlocks, network
disconnect, browser/process closure, laptop sleep, blocked telemetry, and motor
driver exceptions while measuring time to physical zero and the accuracy of UI
state.

### 27. Reset means different things to the student, browser, simulator, and robot — P1

**Status.** Current Reset targets the chosen virtual/physical target rather than
only the drawing, but its visible consequences remain easy to misinterpret.

**Observable symptom.** Students expect Reset to preserve/run project or clear
plots, pose, output, live values, encoders, or flashed code differently. A
physical reset reconnects with retained project while a virtual reset may
reinitialize world state.

**Plausible causes.** One label covers target reboot, virtual plant reset, run
termination, log cursor reset, sensor reset, and UI plot retention.

**Product prevention, detection, and recovery.** Document and display the exact
postcondition: program stopped, target state reset, flashed project retained or
not, world/pose state, plots/logs retained, and reconnection in progress. Keep
`Clear plots`, `Clear output`, and `Reset target` independent.

**Evidence still needed.** Compare post-reset state field-by-field on both
targets before a run, during loading, during a run, after exception, and after a
network interruption.

### 28. Telemetry or logs look smooth and complete when samples are missing — P1

**Status.** Current clients detect sequence gaps, the service retains only 32
recent run samples and 160 log lines, shared target history and recording are
bounded, and CSV reports dropped samples. Late Monitor and long-run behavior are
covered in software, but room-load behavior is not.

**Observable symptom.** Plots have gaps or misleading connecting lines; a key
exception scrolls out; late-open Monitor misses early motion; output archive is
incomplete; sensor values remain stale rather than visibly unavailable.

**Plausible causes.** Network latency exceeds the device ring, multiple clients,
browser throttling/background tabs, high print volume, low memory, reset/boot ID
change, or recording started late.

**Product prevention, detection, and recovery.** Preserve explicit sequence
gaps and unavailable values; do not interpolate them as measurements. Rate-limit
or summarize excessive student output. Archive run start, revision, sample rate,
gap count, dropped count, and final-state evidence. A late Monitor should state
the earliest retained time.

**Evidence still needed.** Saturate output and telemetry, background/throttle a
tab, delay polling beyond the 32-sample device ring, open Monitor late, and run
concurrent robots under real Wi-Fi load.

### 29. Live controls change the wrong run or two users fight over values — P2

**Status.** Values are bounded and applied at measured boundaries; pending state
is visible. Two Monitor tabs intentionally use last-value-wins semantics, and
live values are transient rather than saved configuration.

**Observable symptom.** A slider snaps back, an update applies after a program
has ended, two teammates alternately change it, or a rerun starts from defaults
despite prior tuning.

**Plausible causes.** Debounce timing, network retry, run ID change, two windows,
student expectation that live values persist, or program redeclaring different
parameters.

**Product prevention, detection, and recovery.** Bind updates to robot ID and run
ID, discard stale-run updates, show who/which window last changed a value if
multi-window use is common, and provide an explicit action to copy a useful
value into the appropriate source file. Never silently persist transient tuning
as course configuration.

**Evidence still needed.** Rapidly adjust values from two Monitor tabs across
Stop/Run/reset/reconnect and verify the applied value and run identity in logs.

### 30. Motor power failure is mistaken for a code or Wi-Fi failure — P1

**Status.** Known physical distinction. USB can power the controller and leave
the service, sensors, and browser healthy while motor batteries/supply cannot
produce useful wheel torque. Battery voltage and commands are available in
telemetry when the relevant reads succeed.

**Observable symptom.** Run state, program output, and nonzero drive commands are
visible but neither wheel moves; or wheels spin raised and stall on the floor.

**Plausible causes.** Depleted/reversed/poor-contact motor batteries, motor-power
switch, supply sag, loose motor cable, mechanical jam, command limit/start
calibration, or code requesting zero.

**Product prevention, detection, and recovery.** The no-motion diagnostic should
separate requested motion, final drive command, battery voltage under load,
encoder change, and wheel observation. Warn on measured low/sagging supply only
from calibrated evidence. Recovery proceeds from power/contact/mechanics to
software, not from `reinstall everything`.

**Evidence still needed.** Fault-inject low cells, one bad contact, motor power
off, one disconnected motor, and load-induced sag while capturing command,
voltage, encoder, reset, and service state.

### 31. Encoder or motor faults produce plausible but wrong motion — P1

**Status.** Hardware/calibration hypothesis. The API normalizes motor and encoder
signs, and retained raised-wheel evidence confirms one robot, not the fleet.

**Observable symptom.** One wheel runs backward, controller saturates, odometry
claims motion while the robot turns, or the robot moves while an encoder remains
fixed. The virtual target behaves correctly.

**Plausible causes.** Swapped/reversed connectors, damaged encoder, loose wheel or
hub, unequal friction, gearbox damage, student calibration copied from another
robot, sign error, or count quantization at very low speed.

**Product prevention, detection, and recovery.** Provide a short commissioning
check that commands each wheel separately at bounded effort and compares expected
encoder sign/change, with an explicit raised/floor context. Store calibration per
robot project, not globally or by template update. Detect command-with-no-count
and count-with-zero-command anomalies without pretending they identify one root
cause.

**Evidence still needed.** Test representative fleet variation and each injected
wiring/mechanical fault. Complete floor calibration and all challenges on the
actual course surface.

### 32. Range, IMU, or other sensors fail in ways that look like algorithms — P1

**Status.** Sensor errors and unavailable values are represented; physical
behavior under full-class and course-scene conditions remains incompletely
tested.

**Observable symptom.** Obstacle demo never stops or stops immediately;
Delivery Mission selects the wrong map; range alternates between missing and
short values; IMU/battery fields freeze or show an error; several nearby robots
interfere.

**Plausible causes.** Loose cable/I2C fault, angled/soft/small target, near-field
limit, acoustic crosstalk among ultrasound sensors, reflective room geometry,
battery sag, sensor read contention, or student estimator threshold.

**Product prevention, detection, and recovery.** Keep raw usability, sample
count, estimate, decision threshold, and resulting map choice distinguishable.
Unavailable must remain blank/None, never zero. Surface `sensorError` and the
last fresh-sample time. Challenge scheduling may need staggered ultrasonic runs
if crosstalk is measured.

**Evidence still needed.** Exercise open/blocked scenes, target materials and
angles, missing/disconnected sensors, multiple simultaneously pinging robots,
moving range, and low battery in the actual room.

### 33. A mechanically valid program fails on the course surface — P1

**Status.** Explicit remaining evidence gap. Floor-dependent wheel response,
effective diameter/track width, stopping distance, slip, collision geometry, and
complete arena runs are not established by raised-wheel or simulator tests.

**Observable symptom.** A project passes component checks and simulation but
misses distances, headings, waypoints, clearances, or delivery goals. Different
robots fail differently.

**Plausible causes.** Surface friction, wheel/caster variation, battery state,
load, footprint/clearance mismatch, track-width calibration, obstacle placement,
or simulator envelope narrower than the fleet.

**Product prevention, detection, and recovery.** Calibrate per robot using short
course experiments and store results in `robot_config.py`. Define challenge
tolerances and simulator variability from measured fleet distributions. Course
task changes should revise instructor task/world files, not overwrite robot
calibration or student components.

**Evidence still needed.** Run every challenge on the final surface with multiple
robots, batteries, directions, and starting placements; compare ground truth,
odometry, commands, and outcomes.

### 34. Git becomes a prerequisite or a new source of data loss — P1

**Status.** Current workflow keeps Git external through GitHub Desktop, and the
IDE remains usable without it. Templates do not currently create a `.gitignore`
for `UCSB_XRP_Autosaves`, so generated run/log/telemetry files can appear as
untracked content.

**Observable symptom.** Students cannot start because GitHub sign-in/repository
access fails; they commit large telemetry/autosave files; one partner cannot
push; a merge conflict is resolved by discarding work; Git pull is overwritten
by the open IDE.

**Plausible causes.** Git not installed, authentication/invitation issue, no
internet on robot hotspot, repository cloned at the wrong level, generated data
not ignored, simultaneous edits, or the external-change hazard above.

**Product prevention, detection, and recovery.** Robot programming must remain
independent of Git availability. Provide a generated portable `.gitignore`, a
small project metadata file intended for commit, and explicit Pull-before-open /
close-or-reload-after-Pull guidance. Keep manual export/recovery usable when
GitHub is unavailable. Do not put credentials in project files or browser local
storage.

**Evidence still needed.** Start from clean Windows/macOS laptops without Git,
create/accept a team repository, work offline on a hotspot, reconnect/pull/push,
create and resolve an ordinary conflict, and confirm generated files do not
obscure the source diff.

### 35. Pair work on two laptops creates two authoritative projects — P1

**Status.** Workflow hypothesis. Browser state and folder handles are local to a
machine/profile; Git is the intended collaboration history but is not live sync.

**Observable symptom.** Both partners arrive with different current branches,
projects, calibration, or challenge revisions; each can successfully flash a
different revision to the same robot.

**Plausible causes.** Both edited offline, one forgot to push/pull, one used a
renamed folder or browser-only copy, or Git access failed during the prior class.

**Product prevention, detection, and recovery.** Display and archive project
content revision, Git commit when detectable without credentials, challenge
revision, and robot ID. Before Flash, warn when the current robot holds a project
revision not descended from the local session only if that can be stated
accurately; do not invent a merge model. The team must select one Git history
and preserve the other as a branch/copy before reconciliation.

**Evidence still needed.** Rehearse pair handoff with offline divergent edits and
recovery without email/renamed-folder exchange.

## Instructor recovery during class

The instructor needs phase-specific triage, not a universal retry or repair
script. The first question is whether the failure is cohort-wide, one computer,
one connection, one project, or one physical robot.

| Visible pattern | Most informative first distinction | Recovery that preserves work |
| --- | --- | --- |
| Many teams fail immediately after opening the page | Web/content build and robot compatibility versus campus network | Stop deployment/individual repairs; hold or roll back the classroom web build and state the compatible robot release. |
| One laptop opens a fresh default project | Wrong profile/origin or cleared browser state versus missing disk folder | Open the existing project folder or clone; do not recreate it over the same name. |
| USB verifies files but Wi-Fi cannot reach the robot | Installed runtime versus computer network/route/permission | Preserve USB result; join the intended network, verify exact robot identity and `/info`, then retry connection. |
| Browser reaches a release-mismatched robot | Compatible older service versus genuinely required runtime update | If compatibility permits, continue; otherwise run changed-only USB repair on that robot alone. |
| Run has commands but no encoder change | Motor power/mechanical path versus code requesting zero | Inspect battery under load, motor switch/contact, individual wheel and encoder; do not clear browser/project state. |
| Virtual works, physical raises an exception | API/runtime/peripheral boundary | Preserve traceback, project revision, release and robot ID; use no-motion reproduction before re-flashing. |
| Stop or connection is lost during motion | Network/control recovery versus physical containment | Use physical motor power/RESET as needed, then inspect lease/watchdog/boot/log evidence. |
| Project changed unexpectedly | Browser recovery versus disk/Git/external edit | Stop autosave if possible; preserve both versions, inspect rotated project JSON and Git, then choose/merge explicitly. |
| A challenge must change during class | Content correction versus runtime/API change | Publish/test the smallest content revision; apply as a revised copy or conflict-aware update; never instruct blanket template reload. |

A compact instructor diagnostic bundle should be copyable without credentials
and should contain: canonical origin; web build and course-content revision;
offline-cache state; browser capability/permission results; active project,
template, content revision and hash; folder attachment state; target kind;
expected and observed robot ID; endpoint/network mode/SSID; firmware, XRPLib,
library, service and protocol versions; flashed project revision; boot/run IDs;
last acknowledged operation; telemetry/log gap counts; and the bounded relevant
log tail. This is more useful than asking for screenshots of several panels.

## Evidence program before course deployment

The decisive evidence is a small number of adversarial transitions performed on
the real deployment, representative student computers, and multiple robots.
The following campaigns should drive design changes rather than become a
ceremonial gate:

1. **Release transition.** Web N/N+1, content N/N+1, service N/N+1, runtime N/N+1,
   and project N/N+1; update while idle, dirty, saving, running, offline, and in
   old/new tabs; then rollback.
2. **Non-destructive challenge change.** Clean and locally edited copies,
   multiple changed files, `course_setup.py` selections, interruption, Git
   external changes, and byte-for-byte preservation of student components.
3. **Identity and network scale.** Several robots on one station LAN and many
   hotspots in the classroom; wrong SSID/address/mDNS, DHCP changes, local-
   network denial, Windows firewall, VPN, and campus isolation.
4. **Commissioning interruption.** Wrong/multiple USB devices, cancellation,
   serial contention, realistic incompatible firmware, power loss after each
   managed-file boundary, stale files, low space, same-release repair, and cold
   boot proof.
5. **Shared application state.** IDE and Monitor in tabs/PWA windows, same and
   different profiles/origins, forced no-`SharedWorker` fallback, simultaneous
   edit/Run, project/folder change during a run, and update activation.
6. **Physical fault injection.** Motor power off/sagging, one motor/encoder
   disconnected, mechanical load/jam, sensor missing/noisy/crosstalk, network
   loss during motion, non-yielding student code, and measured time to zero.
7. **Durable work recovery.** Cleared site data, permission loss, interrupted
   multi-file save, Windows path/case edge cases, Git pull while IDE is open,
   pair divergence, and restoration from folder/Git/rotated snapshot.

## Operational conclusion

The live published page should be the canonical way to obtain the current
course product, but the page, cached application, robot runtime, and student
project are distinct state domains. Collapsing them into one exact release or
trying to make template reload overwrite local projects will create the very
classroom failures the system is intended to prevent.

The minimal robust design is a term-frozen robot runtime, compatibility-based
browser/service negotiation, update activation only at a saved idle boundary,
stable robot identity across USB and Wi-Fi, and explicit conflict-aware project
lineage. With those boundaries, an instructor can correct the web application
or a challenge during the course without touching student component files and
without recommissioning an otherwise compatible fleet.
