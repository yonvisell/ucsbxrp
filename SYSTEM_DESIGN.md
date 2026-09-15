# System design

## 1. Scope and governing boundary

The system coordinates four products: the `ucsb_xrp` MicroPython package and
reference modules, browser IDE, XRP Monitor, and virtual XRP. A small on-robot
service makes the physical RP2350 XRP implement the same browser target
interface.

Course behavior remains in Python:

```text
physical: student project -> ucsb_xrp -> XRPBot -> XRPLib -> XRP
virtual:  student project -> ucsb_xrp -> XRPBot -> simulated XRPLib -> plant
```

The simulator supplies device observations and planar physics. It does not
estimate pose, navigate, plan, or execute a mission. Three.js renders the
authoritative planar state; it does not calculate robot motion.

The active `v2_` documents define the learning sequence and component
responsibilities. Implementations and exact APIs can improve when the coordinated
change makes student reasoning or instructor operation clearer.

## Classroom session and recovery boundaries

The September 2026 reliability revision preserves the public Python API and
adds these cross-application constraints:

- A Project selection commits its folder capability, source session, and target
  settings together. Another page's shared selection does not retarget an
  already open IDE. IndexedDB retains Working-folder capabilities and a bounded
  project-ID-to-folder capability registry; ordinary serialized settings remain
  in `.ucsbxrp.json`. Recovery records hold complete per-tab unsaved snapshots,
  separate from normal active-project selection.
- Project writes require a browser lock, native exclusive streams, and unique
  on-disk writer tickets. Writers publish choosing/ticket state, wait in ticket
  order with a bounded deadline, and recheck admission before mutation. Orphan
  tickets never expire into overlapping writes; explicit recovery requires the
  user to close other editors and confirm the exact records. A complete
  previous/intended commit record precedes source mutation. These mechanisms
  coordinate cooperating UCSBXRP clients; arbitrary external programs cannot
  be excluded atomically by browser APIs. Native cross-browser filesystem
  behavior remains subject to platform qualification.
- Project chooser reads drain the current editor's queued commits before
  inspection. Monitor reads retry active writers and bracket source reads with
  exact metadata-generation checks; they reject a stable content-digest mismatch
  for IDE review. A failed read retains the selected capability and offers
  Refresh. Read retries never recover or remove another writer's records.
- Target coordinators isolate endpoints and invalidate obsolete operations.
  Stop can interrupt pending Run preparation. The robot service checks boot,
  control-session, and generation identity before state-changing operations;
  observers may read status and request Stop. Takeover requires a stopped robot.
- An attempted page departure stops only work owned or being prepared by that
  departing controller. Target subscriptions remain connected while the browser
  asks whether to leave, so choosing Stay preserves completion events, recording
  and subsequent commands. Actual page departure releases the client; physical
  browser-history suspension and restoration retain their separate lifecycle.
- Run boundaries carry stable run/project/revision identity independently of
  bounded console output. Monitor binds archives to that source capability,
  deduplicates on disk, and finds the matching retained run before editing
  notes. Annotation additions and version-checked text edits merge into the
  saved run without replacing its samples or unrelated notes; interrupted
  changes retain a journal. Concurrent edits of one note require conflict
  review, and reopening a retained run restores its verified notes. Failed note
  saves retain a separate downloadable copy and an ordinary navigation guard.
  An unresolved or ambiguous destination requires manual export.
- Compiler startup and execution have separate deadlines. Virtual sleeps and
  computation advance one monotonic simulator clock; long sleeps are chunked.
  Runtime output and HTTP input are bounded. Physical plot values are sampled
  with their corresponding telemetry rows.
- Setup attempts carry cancellation epochs through serial/network work and
  workspace publication. Runtime assets are verified before entering the
  watchdog-sensitive transaction. Bootstrap/config replacement uses rename
  over an existing destination, and HTTP parsing is course-owned around the
  unchanged pinned `phew` dependency.
- A warmed offline cache establishes readiness locally. Active documents pin
  their release assets across updates. A workspace parent adopts updates only
  after all embedded applications pass their own reload guard. Documentation
  opens beside those applications, preserving their execution and source.

These are implementation constraints, not physical qualification claims. The
revision harness and evidence ledger are local operational documents under
`outputs/revisions/2026-09-14/`.

## Student experience and timing contracts

- Direct IDE first use combines Working-folder permission and creation of an
  unused `my_demo_spiral_NN` Project. Native directory access still requires a
  browser picker. Display-name changes use the existing transactional metadata
  writer and retain the folder, source identity, and archive relationships.
- Projects declaring student components can carry compatible files into another
  such project, including a calibration demo. The existing file-change preview
  remains mandatory; task-specific content comes from the destination template.
  New candidate IDs coexist with the established catalog.
- Shared typography, button states, pane dividers, and content-edge spacing are
  defined in `apps/shared/theme.css`. Screen-density choices are distinct from
  the larger document-reading scale; Markdown, Guide, and API examples use
  readable code blocks with explicit copy actions where appropriate.
  The command toolbar retains its intrinsic width; status text wraps into the
  available space without covering Run or Stop at narrower window sizes.
- Note editing captures a fixed observation, including its identity when several
  observations share one timestamp. Editing a note during a run must retain an
  immediate Stop action and preserve the draft when the robot stops.
- Source acquisition time, publication time, physics time, and browser lifecycle
  time remain separate. Additive timing metadata carries a scoped clock ID,
  raw and unwrapped acquisition time, raw sample identity, configured period,
  and the separately timed range/diagnostic groups. CSV includes timing even
  when no timing channel is plotted. Legacy files remain readable without
  inventing unavailable acquisition times. `docs/TELEMETRY_FORMAT.md` defines
  the recorded fields and future independent GNSS clock requirements.
- Each IDE keeps a headless run recorder subscribed independently of its
  project-provider role. It captures the run's original project revision,
  destination folder, world and output; completion queues the same archive
  transaction used by Monitor. Concurrent writers converge on one run identity.
  A pending save protects navigation and the next Run. A failed save retains a
  downloadable recovery and a visible retry action instead of discarding data.
  Starting a browser download does not acknowledge recovery; the user must
  explicitly confirm that the recovery file was saved before releasing it.
- Monitor can reopen a committed trial from the Project's four retained runs.
  Picker availability uses the verified folder's identity independently of an
  incomplete current-target descriptor, including a cold workspace launch.
  It validates the metadata/CSV pair and rotation identity before displaying the
  saved world and plots. Current robot values remain explicitly identified as
  live. Reading a trial does not select, reset or command a target. Note edits
  preserve numeric CSV fields; interrupted or changed archives are rejected.
  Saved-trial reads and late-Monitor verification use a two-second retry window
  for known Project writers or an observed generation change, with visible progress.
  They never acquire or recover a writer. An unchanged orphan journal or corrupt
  archive remains an error. Run/Project cancellation rejects obsolete results;
  local note edits and full-run recovery remain protected until the applicable
  note merge succeeds. Folder refresh does not replace pending recovery status.
  Program plot metadata includes its exact, unique CSV column, including any
  suffix needed when distinct names would otherwise collide after formatting.
  A signal whose unit changes also receives a per-observation unit column.
  The reader retains those units, and plots omit values of a different unit
  from the one identified by the displayed axis.
- A resolved export destination does not acknowledge an archive. Monitor keeps
  unresolved archives with their original data, notes and destination until a
  verified save or explicit discard. Retry acknowledgements apply only to the
  committed note revision. Pending saves and recovery block a local Run and
  protect page/update navigation. Retention admits at most four unresolved
  recordings without eviction. A peer run arriving at capacity remains live
  and stoppable but is explicitly unrecorded; freeing capacity does not start
  recording midway through that run. Reset and display changes do not release
  retained recovery.

## 2. Browser applications

One Vite production build contains the IDE, Monitor, commissioning wizard,
guide, landing page, and shared packages.

### IDE

The IDE is the programming surface. It provides:

- one selected Working folder containing named Project folders and automatic
  project writes; built-in projects remain available as read-only previews
  before a folder is selected;
- multi-file creation, rename, duplicate, delete, tabs, and main-file
  metadata;
- one grouped project catalog containing the five cumulative challenges,
  sensor-driven obstacle-turn and expanding-spiral demos, and a staged
  MicroPython tutorial; an empty Working folder offers explicit creation of a
  numbered Project containing the Expanding spiral program;
- local Monaco workers, course-API completion/hover/signature/definition help,
  and exact-release MicroPython compilation;
- explicit **Compile**, one stateful Run/Stop control, and Reset; physical Run
  loads the exact current project into controller RAM before starting it;
- virtual/physical target selection, robot-hotspot/existing-Wi-Fi selection,
  and an existing-Wi-Fi address setting;
- a flat white layout with compact collapsible project, settings, and
  output regions, literal file names, and concise hover/focus help; and
- separate concise Status, Problems, Program output, and compilation/service
  System log. Compiler failures retain their raw output while also producing
  clickable file/line/column entries and Monaco markers.

Project state is represented as `{name, entrypoint, files}` at every execution
boundary. The entrypoint, file paths, and file contents produce one SHA-256
revision identifier; the display name does not affect whether the robot has the
current code. Length-prefixing makes that calculation unambiguous. The shared
target publishes `{name, entrypoint, revision, stale, projectId?}` to the UI;
source remains inside the target boundary. Paths are normalized and Python sources are
compiled before synchronization or execution.
Each runnable project may contain `world.json`. It is a bounded declarative
catalog of named worlds: millimeter bounds, initial pose, rectangular blocks or
walls, start/finish lines or boxes, general visual markers, and waypoints.
Compile parses this file before a run. Start, finish, and general markers are
display-only; only `waypoint` entries enter the ordered navigation goals returned
by `ProjectWorld`. The selected definition configures the simulator, Monitor,
and replay export; `ucsb_xrp.load_world()` exposes the same geometry to project
Python. The browser parser retains unrecognized marker properties without
interpreting them so a later editor can preserve compatible extension data.
This keeps the simulated environment, visible course figure, and challenge map
from drifting into separate copies. The prepared-project manifest retains the
world text for the current controller boot so Monitor can recover it from a
physical XRP after a page reload.
A virtual Run retains the selected world when `world.json` is unchanged;
replacing that file selects its declared default world.
Catalog entries are complete `CourseProject` values, not a persistent special
mode. A Working folder is a parent directory; each project is one named child
directory containing source, metadata, rotated copies, run output, and
telemetry. **Open project** accepts only a directory with a valid root
`.ucsb-xrp-project.json` and the declared main file. It rejects a Working-folder
parent, nested project metadata, and malformed metadata before reading child
trees or changing the active autosave connection. Legacy root metadata without
session or digest fields remains importable. When a Working folder is active,
loading a template first asks for the child-directory name and writes the
complete project immediately. Without a Working folder, catalog projects can be
previewed but not edited, compiled, or run. Any Python file can be selected as
its entrypoint. IndexedDB retains non-serializable Working-folder capabilities and a bounded
project-ID-to-folder capability registry for exact run destinations. The folder's `.ucsbxrp.json` file is the serialized
source for its active Project, robot profile, and course application settings.
An active Project therefore cannot exist independently of its Working folder.
Selecting another Working folder resolves that folder's own configuration and
never carries an earlier active Project with it. If folder permission does not
survive, one explicit Reconnect gesture restores it.
Folder writes enter one serialized, revision/epoch-checked persistence queue
without a fixed debounce delay. Superseded queued snapshots are coalesced so an
older edit cannot overwrite a newer edit or explicit save. Before
overwriting source, a complete commit journal preserves the previous and
intended snapshots. Four checkpoint generations in `UCSB_XRP_Autosaves` retain
meaningful prior editing intervals instead of rotating at every keystroke.
Each project also has a stable project ID, monotonic content revision, saved
revision, and update time in `.ucsb-xrp-project.json`. IDE startup first obtains
the Working-folder capability, then reads `.ucsbxrp.json` and opens that named
direct-child Project. An empty folder offers a numbered Project dialog, with no creation until
approved. A verified physical target remains selected after creation. A current-release browser recovery record is retained
only for exceptional unsaved work; earlier browser project/configuration keys
are ignored rather than migrated. The selected folder files remain
authoritative. Monitor resolves archives using the executing run's immutable project ID,
revision, and registered native folder capability. Current shared selection
does not redirect a completed or active run archive.

Successful compilation has one ephemeral authority: the SHA-256 digest of the
exact Project bytes in the current browser tab. Run compares the current bytes
to that digest and compiles when they differ; navigation between Guide and IDE
does not invent a file-change event or use an elapsed-time heuristic. This
digest is execution metadata, not a second Project or folder state.

The project catalog is declarative. The instructor authoring command copies the
closest working challenge into a draft, registers it with `published: false`,
and records the component file, class, selection flag, and carry-forward
metadata used by the student template system. That catalog metadata, rather
than README formatting, defines the component boundary. The validator checks
the metadata against Python source and `course_setup.py`, then checks required
project files, README sections, Python syntax, and world geometry. Publishing
repeats those checks before the catalog entry becomes visible to students; it
does not synthesize or bless a robot behavior that has not been run by the
instructor.

### Commissioning and repair

The commissioning wizard is the ordinary student entrypoint for a new,
outdated, or damaged XRP. Selecting a Working folder is the first required
step. One successful folder selection verifies write access, records the sole
browser directory capability, creates the setup log, and advances to USB. The
application cache remains browser-owned; a page cannot place that cache inside
a user-selected folder. Meaningful controller, installation, reset, and
network-probe events append to the same password-free log.
Raw serial traffic is not retained.

The wizard fetches and verifies the required setup assets before one
user-selected Web Serial connection enters the MicroPython raw REPL. It
then performs a credential-free controller inspection, maintains any
already-active hardware watchdog, and checks the exact RP2350 board and
MicroPython version. An incompatible or absent runtime branches to the pinned
official UF2 image: the controller enters its bootloader, the user selects the
temporary firmware volume, the browser writes the hash-verified image, and the
wizard inspects the re-enumerated controller again.

The production build generates one commissioning manifest from the exact file
map used by `scripts/install_xrp_service.py`. Each destination has a byte count
and SHA-256 digest. After asset preflight, the browser hashes existing files and
writes only changed payloads through temporary names. It verifies each temporary
file before atomic rename over its destination, checks installed hashes, and
import-checks `ucsb_xrp`, the on-robot service, and required
XRPLib modules. Repeating the operation therefore repairs drift without
rewriting matching files. New robots default to their device-specific hotspot;
an optional team last name produces `UCSB-XRP-NAME`. Repairs retain a valid
existing profile unless the user chooses hotspot or station mode. Station
credentials move directly from the page to the XRP over USB and are not
persisted in browser storage or returned in status replies.

The XRP remains connected by USB throughout inspection and installation. USB
is the firmware, repair, and network-configuration path; the installed HTTP
service uses either the XRP hotspot or existing Wi-Fi for physical Run,
Monitor, and telemetry. After network activation and reset, the wizard reports
every service-probe attempt and distinguishes an unreachable network from an
incompatible service. An exact service/release and robot-identity reply stores
the network mode and endpoint that were actually verified. Thus, a failed
station join that fell back to a robot hotspot cannot provide the unreachable
station route. After verification, the wizard writes the robot profile to
`.ucsbxrp.json`, displays a clear completion state, and waits for the student to
choose **Open IDE**. It creates no localStorage handoff record. The IDE then
reads the same Working-folder configuration. An empty Working folder offers
explicit creation of a numbered Project containing Expanding spiral while
preserving the verified physical target; an existing folder reopens its
configured active Project. The
Working folder itself is never imported as a project. The wizard cannot silently choose
an operating-system Wi-Fi network or bypass browser folder, serial-device,
firmware-volume, and local-network permissions; these are the only intentional
user-mediated boundaries.

### XRP Monitor

The Monitor is the observation surface. It subscribes to the same target as the
IDE and presents only available data. It contains:

- target and run state;
- a project-defined, dimensioned top-down world view with bounded 100 mm grid
  lines, labeled 500 mm x/y values, start and waypoint markers, blocks or walls,
  robot pose, heading, trail, range ray, contact state, and arena/XRP zoom views;
- a compact collapsible sidebar with selectable 2–30 second histories of wheel
  speed, dimensionless drive command, simulation-only odometry comparison,
  forward range, acceleration, and yaw rate;
- a permanently open Live controls region above the telemetry values for
  bounded numeric, Boolean, and choice parameters;
- live pose, drive commands, ultrasound distance, acceleration, and yaw rate,
  followed by a separated device-state group for the USER button, motor supply,
  IMU temperature, and encoder counts;
- named program watch values below the sensor values in the right panel;
- one shared target-event and program-output history, presented as Program
  output and System log tabs in the IDE;
- bounded telemetry recording and deterministic CSV export;
- timestamped notes shared by the world, strip plots, plot exports, and run
  metadata; and
- combined SVG/PNG plot export plus a browser-native WebM world replay from a
  stopped recording. Display and export
  convert hardware-native acceleration and angular-rate values to m/s² and
  rad/s; course geometry remains in millimeters.

The world/values and upper/lower allocations have independent
pointer- and keyboard-operable separators whose positions persist locally.
The virtual scene and zoom controls share a compact toolbar above the world;
target selection and the
physical endpoint remain shared IDE settings rather than duplicated Monitor
controls. Environment selection resets virtual state and is disabled while a
project is running. A physical target shows a world pose only when the course
`Robot` loop publishes an estimate; stationary device sensors remain visible
without a pose.

Plot export is generated on demand from the retained samples rather than from
a screenshot, producing stable axes and one figure containing every selected
signal. World export replays the latest monotonic pose segment into an isolated
canvas; it does not mutate the live Three.js world or the running target. The
output is real time for recordings up to 20 seconds and bounded to 20 seconds
for longer data by an explicit playback-rate label. No telemetry or media is
sent off-device.

Every source telemetry sample enters the bounded recorder in order. Visible
React state is published at most once per animation frame, and the Three.js
trail appends into one reusable geometry rather than rebuilding the complete
path for each sample. A Monitor iframe hidden by the Workspace remains
connected and records the run, but pauses chart, Three.js, resize, and runtime
control rendering until its pane becomes visible. Reactivation backfills the
bounded active recording once, so a long hidden interval does not erase the
earlier live trail. A successful Reset is an explicit recording boundary: the
pre-Reset run is completed and archived, the live world path is cleared, and
only then may the reset-state sample appear. Its completed recording, output
and notes remain available for plots and export until the next Run or explicit
Clear run. Archive acknowledgement or failure stays bound to that retained run;
Reset does not discard the manual recovery copy.
For a physical target, command acknowledgement alone is not a recording
boundary. Controlled Reset verifies control ownership, stops the known run and
drains its retained telemetry/output before clearing device state. The owner
uses the authorized telemetry transport; an observer verifies emergency Stop
through read-only status. Terminal pages with remaining samples or output keep
the recording open, and current idle telemetry follows the completed run.

### Guide and visual system

The Guide covers the first virtual run, Working and Project folders, component
tests, physical setup, Monitor evidence and exports, project flow, offline use,
GitHub, shortcuts, and troubleshooting. The separate UCSB XRP API page is the
detailed Python reference. It documents each student base class through its
purpose, retained state, constructor, properties, method parameters and units,
return values, exceptions, and required behavior; it also covers every public
record, service, world/map type, configuration value, low-level XRP method, and
numerical function. IDE tabs link directly to the applicable API entry,
including the project-owned world.json definition. Both pages open in a new
tab and are part of the offline release.

The offline shell belongs to the site and Chrome profile, not to a selected
Working folder. After one complete online load, the applications, virtual XRP,
Guide, API reference, and course release may reopen without internet or a local
server. Installation adds a launcher but does not change that storage model.
Clearing or evicting site data removes the shell and browser-held project data but
does not remove native project folders. Physical operation still requires a
local network path to the XRP, and GitHub operations and first-load/update
checks still require internet.

All applications use the same high-contrast theme, compact controls, visible
focus, semantic labels, and responsive layout. The IDE and Monitor use
accessible play/stop and reset icon buttons in their 27 px headers, a compact
target selector, and an explicit name for **Compile**. Icon controls retain
semantic names and hover/focus help. The landing page presents IDE, Monitor, and Guide together,
then gives initial setup/repair its own clearly separated action.

Current desktop Chrome and Edge on Windows and macOS are the supported student
browsers because they provide the required Web Serial and local-folder APIs.
The application checks those capabilities before use. A local project folder
can also be a Git working tree; students clone, review, commit, and push with
GitHub Desktop, while the IDE edits and autosaves the same files. The static
site never requests or stores GitHub credentials. Browser-only upload remains
a checkpoint fallback rather than a second synchronization system.

## 3. Shared target interface

`TargetClient` exposes `connect`, `disconnect`, `check`, `synchronize`, `run`,
`runCurrent`, `markProjectStale`, `stop`, `reset`, `setRuntimeParameter`, and
event subscription. The
virtual target additionally accepts a world ID from the active project's world
catalog. Events include status, synchronized-project state, source-bound compiler
results, controller ownership, live/retained run envelopes, project world,
runtime state, console, and telemetry; samples
carry source, sequence/time, pose availability, motion,
encoders, collision, range, button, IMU, temperature, battery, and sensor-error
fields.
`synchronize` is retained as the target-interface transfer operation. On the
physical target it transactionally prepares a boot-lifetime RAM project; it
does not write internal flash. Connection state and current/stale project
identity are shown separately, so a connected robot cannot be mistaken for a
robot that has the current project ready. A true controller boot has no
current student project until a browser prepares one; an obsolete flash copy
is never an implicit execution source.

One IDE tab is the active source for Run. The first connected IDE owns that
role until it closes or a student explicitly selects **Use this project** in
another IDE. Standby IDEs remain fully editable and continue saving their own
files, but their edits do not mark, prepare, or run a shared target project.
When an IDE owns that role, Run requests its current in-memory snapshot with a
bounded, cancellable wait; a retained target descriptor is never substituted for
an unresponsive editor. A standalone Monitor with no registered provider reads
the selected native Project, establishes its durable identity, and binds the
run to that folder before launch. A delayed standalone read is invalidated by
Stop, Reset, or a changed folder selection. Editor ownership is not stored on
disk or in browser storage; a different editor takes over explicitly.

Runtime state is a bounded immutable snapshot: at most 16 validated parameter
descriptors, 16 watch values, and 16 numerical plot values. For the virtual
target, each parameter has one fixed shared-memory slot; numbers are encoded as
integers so a browser update cannot be read halfway through. The physical service queues
the validated value behind the `ucsb_xrp.live` lock. In both targets,
`Robot.start()` and `Robot.step()` apply the latest queued values together at a
measured sample boundary. Programs that do not use `Robot` may expose their own
explicit boundary with `live.apply_updates()`. The Monitor shows pending state
until the program publishes the applied snapshot.

The UI depends only on this interface. Target-specific details—workers for the
virtual XRP and a single shared HTTP poller for the physical XRP—stay inside
their clients. A physical-target `SharedWorker` serializes the device
connection and broadcasts status and output to IDE and Monitor. Monitor ports
also receive live telemetry and retained history in ordered batches. IDE
recorders subscribe to this stream independently of visible plots. Tests and
browsers without `SharedWorker` use the same direct client as a fallback. Only
failure to construct the browser worker selects that fallback; a robot
discovery error is returned without opening a duplicate connection.
Selected target and endpoint are shared between applications through one
versioned browser RobotProfile. It stores the commissioned `robotId`, the
explicitly selected network, separate station and hotspot routes, and the last
verified network observation. A verified station connection may refresh its
DHCP route. A hotspot or station-fallback observation never replaces that
route, and neither application accepts a reachable service whose identity does
not match the selected robot. RobotProfile is browser/device configuration; it
does not belong in a student project folder or Git repository.

## 4. Virtual XRP

A `SharedWorker` maintains the target state shared by IDE and Monitor tabs:

- project world catalog, selected world, and latest plant state;
- target status, console history, and role-aware telemetry delivery;
- the current complete project and its public revision descriptor;
- active run identity and owner lease; and
- cross-tab stop/reset and runtime termination.

The tab that starts a virtual run creates one short-lived worker for that run. The
shared target returns the exact retained project to that owner, so the Monitor
can start code prepared by the IDE without duplicating editor state. The worker
loads official MicroPython 1.28 WebAssembly, the exact release `ucsb_xrp` source,
exact reference `.mpy` files, the project, and a simulated XRPLib. It
compiles every project file, runs the selected entrypoint, and forwards output
and authoritative simulator state. Terminating the worker stops non-yielding
student code without freezing either application.

Run in the IDE compiles changed or previously unchecked files before launch.
When an IDE is active, Monitor Run obtains that IDE's exact current snapshot,
including an edit made immediately before Run. With no active IDE, the virtual
Monitor has one intentional fallback: it compiles and starts the immutable
default Expanding spiral project. The physical Monitor instead asks the user to
open or select an IDE project. Bounded console history is retained across runs
and cleared only by an explicit UI action or target replacement.

The deterministic plant uses fixed 20 ms integration, differential-drive
kinematics, drive-command deadbands, asymmetric response, first-order acceleration and
deceleration, encoder quantization, robot footprint, world bounds, rectangular
obstacles, collision prevention, geometric forward range, planar IMU values,
temperature, battery, and button state. MicroPython `sleep_ms` advances the
same plant, so open-loop student programs and sensor-driven programs observe one
clock and one physical state.

## 5. Physical XRP service

The RP2350 runs one on-robot MicroPython HTTP service over either of two network
profiles. **Robot hotspot** is the default student profile: each XRP derives a
distinct `UCSB-XRP-xxxx` SSID from its radio identity, uses the fixed course
password and `192.168.4.1` service address, and selects channel 1, 6, or 11
from the same identity. The wizard may instead store a validated
`UCSB-XRP-NAME` SSID based on one team member's last name. **Existing Wi-Fi**
joins a private course router or an ordinary local network by DHCP or optional
static configuration. A failed station association starts the recoverable
robot hotspot until reset. These are alternative transports for the same
service and target interface; the system does not depend on simultaneous AP
and station operation. USB is retained for initial configuration,
deterministic file installation, mode changes, and recovery.

The versioned JSON API provides:

- identity, release, capabilities, and the retained project descriptor;
- controller-session claims, read-only observer state, and stopped takeover;
- MicroPython compilation;
- transactional whole-project preparation in alternating RAM volumes;
- run, stop, lease renewal, and reset;
- captured stdout/stderr and service events; and
- polled hardware telemetry and live-program state/parameter updates.

Check, Prepare, Run, Reset, parameter updates and lease renewal require boot,
controller-session, control-generation and run identity. A projectless Run also
names the expected prepared-project revision. One session claims an unowned
stopped XRP; transfer from a live owner
requires explicit takeover while execution is stopped. Independent browsers
without control observe the read-only state/log route and can send Stop scoped
to the current boot/run. Observer traffic never renews controller or run leases.
The control lease is normally 6 s, extended to a 10 s startup grace period.

Commands carry bounded request IDs and return correlated replies. The bounded
reply cache binds each ID to its operation and payload: an exact retry replays
the acknowledgement without executing again, while different semantics with
the same ID are rejected. Prepare, Run, and Stop repeat an interrupted request
once with that same ID. If both Prepare replies are lost, the browser treats
the operation as complete only when the XRP's active boot-lifetime manifest
reports the exact requested revision. The device advertises
a 128 KiB encoded-command limit and a 16 KiB `world.json` limit; project files
and paths are bounded. A course-owned HTTP admission layer around unchanged
Phew bounds headers, decoding complexity, concurrent connections and body
readers, and read/write/idle waits. Browser CORS and Private Network Access
preflights are answered by the device. Each boot has an identifier, so clients reset log cursors when
sequence numbers restart. The client uses request deadlines, bounded polling,
one shared connection per endpoint coordinator, and short repeated discovery
probes after an intentional reboot; an in-flight telemetry timeout cannot
replace the reconnecting status.
The shared client requests active-run telemetry on the course's 20 ms sample
cadence and returns to 250 ms when idle. Request duration counts toward the
cadence, so a slower response reduces the request rate instead of accumulating
work. The physical worker has a stable asset URL and an explicit coordinator
generation. Telemetry first checks the current controller session, control
generation, boot and run; an unauthorized request is rejected before poll
arbitration or hardware/ring work. Within that authorized session, a separate
`(pollGeneration, pollOwner)` lease serializes generated pollers. Its duration
is 750 ms after response serialization. The same pair renews it; a higher poll
generation can supersede a lower one within the session, and a competing
equal/lower pair receives a small refusal response. An expired poll lease is
cleared on the next eligible request. This subsecond expiry does not transfer
controller authority, shorten the 6 s control lease, or let a newer browser
release preempt another session's active run. A successful controller takeover
clears the previous poll lease. When stopped, admitted polls within one idle
cadence reuse the exact same hardware sample and sequence. The XRP buffers the
50 Hz course samples and retained output, then returns them in small
cursor-ordered pages. A client requests the next
page immediately while a backlog remains and publishes a terminal state only
after that backlog is drained. This bounds the single HTTP response that a
Run, Stop, Reset, or parameter command may have to wait behind. The ring is
finite; if Wi-Fi throughput cannot carry every retained sample, the sequence
gap remains explicit in the log and recording metadata. Neither HTTP polling
nor such an observation gap changes the on-robot control loop.

Browser page lifecycle events are logged with visibility and online state. On
return from sleep, back-forward cache, or a network transition, one coalesced
resume signal is retained until the next physical health outcome. A healthy
outcome consumes it; an error triggers one identity-checked rediscovery using
the commissioned routes. No periodic reconnect loop is added, and an explicit
**Reconnect XRP** remains available in both IDE and Monitor.

The project transfer manifest includes the same content revision calculated by
the browser. A transfer builds an inactive RAM-backed FAT volume and becomes
active only after validation, compilation, and every file write succeed.
Discovery and telemetry expose that descriptor for the current boot, allowing
either application to run the prepared revision and allowing an IDE edit to
mark it stale until the next Run. Ordinary Reset stops the student program,
clears course telemetry and live-control state, and retains that prepared
revision. The next Run therefore starts immediately unless the browser project
has changed.

Student code runs on the second RP2350 core. Once started, one project worker
remains alive for the service lifetime and blocks on a lock between runs. Run
queues one job and wakes that worker only after the `loading` reply has left the
HTTP service. Normal project preparation writes only the RAM-backed project
volume, so edit-run cycles never coordinate internal-flash changes with the
second core. Persistent course-runtime installation remains a USB
setup/repair operation performed while student code is not running. The
service resolves course packages and XRPLib singletons, compiles the
entrypoint, evicts prior project modules, and collects garbage before launch.
The active project manifest remains in RAM. A browser Run marks the launch as
managed, so `Robot.start()` begins immediately; a directly executed standalone
program retains the explicit USER button wait. A 7 s hardware watchdog is fed
by the service event loop, so a future shared-VM deadlock reboots the controller
instead of requiring a physical reset. A renewable run lease is owned outside
the student program; expiration restarts the target if browser ownership is
lost. Normal completion, exceptions, Stop, and Reset converge on a cooperative
program-core exit and zero drive command. Only a non-cooperative program,
watchdog event, lease loss, or setup/repair uses the controller-restart path.
Program output is line-buffered into the same bounded log stream used by the
applications.

XRPLib peripheral drivers are not accessed simultaneously from both RP2350
cores. Before and after a run, the service reads hardware directly. During a
run, it uses the course `Robot` channel for pose, wheel speed, drive command, range,
and button state, and retains the latest stationary IMU, battery, and encoder
sample. Garbage collection runs on the service core before launch; motor stop
and file cleanup finish on the program core before it releases hardware
ownership. Direct reads resume only afterward. This keeps HTTP allocation,
polling, and asynchronous stop paths from contending with student code on the
board's memory manager, I2C, encoder, and motor drivers.

Browser commissioning defaults to the robot hotspot and needs no private
network credential. Existing-Wi-Fi setup accepts a password only for the
duration of the USB write and never includes it in a status reply or browser
store. Every installed course/service/reference file is content-hashed before
and after replacement. The browser and command-line provisioner use one
exact release file map; the latter remains useful for instructor fleet
automation and optional static station addressing, but is not a student
prerequisite.

## 6. Course library and release

The public package uses small immutable value records compatible with CPython
and MicroPython. Distances and positions are millimeters; speeds are
millimeters per second; computed time is seconds; hardware timestamps are
integer milliseconds; angles are radians; each left/right drive command is
normalized.
World `+x` is forward, `+y` is left, and positive heading is counterclockwise.

Students implement six independently selectable components:
`SensorModel`, `WheelSpeedController`, `DifferentialDrive`, `Odometry`,
`NavigationController`, and `GridPlanner`. Supplied services keep hardware,
control-loop, mapping, and mission boilerplate out of student code. `XRPBot`
is the sole direct XRPLib adapter; `Robot` runs the measured sample/control
loop and publishes pose/drive-command state for physical telemetry. Its sample
clock advances absolute wrap-safe deadlines and skips missed periods, so timing
does not drift with student computation or produce catch-up bursts.

Retained reference source is a revisable implementation, not the API's
definition. Reproducible MicroPython 1.28 cross-compilation produces ordinary
portable `.mpy` artifacts. Release metadata records source identity, compiler
identity, artifact hashes, firmware, and XRPLib revision. Tests exercise source
and exact bytecode against the same required public behavior.

Five cumulative challenge projects separate:

- `main.py`: the readable task entrypoint;
- `challenge.py`: task/environment values;
- `robot_config.py`: measured robot and controller values;
- one literally named file per student component;
- `course_setup.py`: explicit component selection and assembly.

## 7. Offline release and data

The production service worker makes the web tools local-first in the standard
sense: after one complete online load, application code and course assets run
from browser-local storage without another exchange with the web host. On each
online start it checks for an updated service worker without accepting a stale
cached response. It activates a new cache only after every required asset is
present and retains the preceding complete release during an interrupted
update. It caches the complete public release—application
shells, workers, MicroPython WebAssembly, course source, challenges, templates,
reference bytecode, the pinned RP2350 UF2 and commissioning manifest, and
third-party notices—and exposes a visible readiness state. One GitHub Pages
artifact workflow obtains either the root or project
base path from Pages and publishes the same static release. When a newer
complete shell activates, each open page adopts it only at a state-safe
boundary. Read-only pages may reload immediately. The IDE first preserves the
exact active project revision and folder handle; the Monitor waits for commands,
recordings, notes, exports, and automatic run archives; setup waits for folder,
serial, installation, and network operations; the challenge editor waits until
its current specification is reproducible. A cancelled browser reload remains
pending and can be retried. Commissioning payloads use release-scoped paths and
the firmware URL includes its complete SHA-256 digest, so a newly active worker
cannot mix new setup files with an older page. The current and immediately
preceding complete caches, plus caches pinned by still-open documents, are
retained through the handoff. Unidentified older clients conservatively defer
cleanup until they identify or close.

Development disables caching to prevent stale bundles from masking changes.
Private reference source and instructor credentials are not web assets. This
application cache is owned by the HTTPS origin and is not copied into the
selected Working folder. It needs no Node process after caching; a `file://` copy
is not substituted because the module, worker, WebAssembly, and service-worker
boundaries require an HTTP(S) origin. Clearing site data removes the cached
release but not project folders.

Robot commands and telemetry still cross the selected local robot network.
When an HTTPS Pages origin (the site address and protocol that own the browser
permissions) connects to the XRP's HTTP service, the document
first triggers Chrome's local-network permission before handing polling to the
shared worker. Requests identify the target address space as local. This keeps
one physical poller across tabs while satisfying the browser's worker
permission boundary.

Telemetry recording stores the newest 30,000 copied observations and reports
known observation loss and retention eviction. Several virtual observations can
share a physics step, and catch-up can skip unobserved physics steps without
losing a publication. Retained duration depends on the actual publication rate;
export metadata reports its measured span rather than a minimum duration. CSV export is explicit and
self-describing; it preserves blanks
for unavailable physical values rather than inventing zero. Manual recordings
remain session-local until exported. Independently, each IDE and Monitor captures every
run and rotates four aligned output-text, metadata-JSON, and telemetry-CSV
generations into the run's original project folder. A Web Lock plus a compact run
fingerprint prevents duplicate archives when multiple windows observe the
same run. Explicit exports are never included in rotation.

## 8. Failure and maintenance model

Ordinary failures remain visible and recoverable: no robot, wrong address,
local-network denial, incompatible protocol, syntax/runtime errors, interrupted
transfer, expired run owner, browser refresh, and unavailable sensors. No UI
state is reported as successful until a target reply or event establishes it.

Commissioning adds explicit recovery for the wrong controller/runtime, partial
file installation, an existing service watchdog, unavailable station Wi-Fi,
and reset/re-enumeration. The course runtime is installed into alternating
release slots. Every staged file and the runtime manifest are read-verified
before a redundant activation record selects that slot; boot confirms it only
after successful import and can fall back to the previous confirmed slot.
Matching files are copied from the inactive release when possible, so a
same-release repair remains small. The two bootstrap files are separately
verified and replaced atomically. Successful installation ends with reset after
complete readback and activation verification; cancellation/failure also closes
raw REPL through the bounded recovery/reset path.
The wizard treats an unreachable post-reset Wi-Fi service as incomplete. It
retains exact installation evidence in the Working folder, waits for the user
to confirm the computer network, and supports resume after browser closure.
Back, Exit, folder changes and a new setup attempt invalidate old probes and
profile writes. A user can also reconnect by USB and repeat repair after power
loss or interruption.

The dependency set is deliberately small and pinned. Tests cover public Python
required interfaces, deterministic physics, protocol validation, bytecode parity,
project/storage helpers, recording, stable-Chrome workflows, offline execution,
and live device behavior. Physical captures document measured facts but do not
become universal algorithm tolerances.

Floor-dependent calibration—wheel response, effective geometry, stopping
distance, motion-induced sensors, and full arena runs—remains the only separate
hardware slice. It refines configuration and model envelopes without changing
the target protocol or student workflow.

## 9. Student checks and explicit telemetry evidence

IDE **Compile** checks project structure and compiles every Python file without
running either robot, even when a selected physical XRP is temporarily
unreachable; it does not claim algorithmic correctness. The browser compiler
is the release's actual MicroPython runtime, not a CPython approximation.
Challenge
projects separately include `component_checks.py` and a
**Test components** action. These small repeatable checks execute in an
isolated MicroPython worker without commanding either target. PASS, NOT
IMPLEMENTED, and FAIL remain visible in Program output, and NOT IMPLEMENTED is
not a gate: students can implement and select one component at a time. The project file only imports
the classes introduced by that challenge and calls the supplied check runner;
fixtures and assertions live once in `ucsb_xrp.component_checks`. This keeps the
student-visible use case short and prevents five challenge copies of test logic
from drifting. Checks state externally visible behavior and avoid requiring the
supplied internal algorithm.

Telemetry names its evidence source. A physical pose is the course Odometry
estimate. A virtual sample carries both that estimate and simulator ground
truth. The same sample may carry requested body motion, target wheel speeds,
measured wheel speeds, and final normalized drive commands. Compatibility
pose fields remain, but new analysis uses explicit fields. The Monitor exposes
target-versus-measured wheel speed and virtual odometry position error so an
incorrect student estimator or controller cannot look correct merely because
the simulator knows the true state. Integer encoder counts are the authoritative
measurement on both targets. `SensorModel` converts those sensor readings into
two distinct results: exact signed wheel increments for odometry and a
time-aware regularized wheel-speed estimate for feedback control. The supplied
speed estimator fits cumulative wheel position over a short trailing time
window and applies the response time selected by
`wheel_speed_filter_time_constant_ms`. Its history is bounded by that configured
window and the course sample period. The same regularized value feeds the wheel
controller, telemetry, plots, and CSV; the browser does not substitute or
smooth a different display-only value. Cumulative left/right wheel distance is
likewise carried from `Measurements` rather than reconstructed in the browser.
Student checks require sensible attenuation and response without requiring the
supplied internal formula.

Programs may add up to 16 numerical analysis signals with `live.plot`. A signal
has a stable identifier, student-facing label, unit, and current finite value.
It travels with the bounded runtime snapshot and is copied into each recorded
telemetry sample; the Monitor never executes student expressions. New signals
are visible by default and can be hidden individually. Hiding a plot does not
remove its samples or timing from the recording.

## 10. Install and export boundaries

The Web App Manifest provides an optional standalone installation and launcher;
the service worker remains the offline authority. Installation does not copy a
runnable site into the Working folder and does not make browser storage permanent.

Manual Monitor exports use `exports/` inside the recorded run's original
project when available. Each export captures and awaits that run's destination
resolution independently of archive completion. Missing or inaccessible folder
identity invokes browser recovery; a download request is reported as requested,
and only a completed filesystem write is reported as saved. Destination
selection precedes expensive rendering. World replay deterministically renders recorded telemetry to
a private canvas and records WebM; it neither screen-records nor reruns the
simulation. Recording and robot execution remain independent states.

## 11. Student documentation and responsibility boundaries

The Guide is task-oriented: it names the available challenges, demos, and
tutorial, then presents virtual execution, Working-folder storage, component
tests, physical setup, Monitor evidence, code roles, offline use, GitHub, and
troubleshooting in that order. It avoids internal deployment vocabulary and
defines each student-visible storage or target term where it first appears.
Each tutorial ships as a complete runnable example that produces program or
Monitor output before asking the student to alter one bounded behavior; its
checks explain regressions but are not blank-filling gates.

The separately built `UCSB XRP API` page is the detailed code reference. Every
student component entry states its purpose, source and base class, state between
calls, constructor, properties, method parameters and types, return values,
exceptions, units, and required behavior. The IDE maps known
component/configuration filenames to the corresponding reference anchor, while
the Guide retains the high-level closed command/measurement loop. Each challenge
README repeats only the challenge-specific objective, student and supplied
responsibilities, flow, and work sequence needed to understand that project
without leaving its folder. The Guide and API pages are part of the verified
offline shell.
