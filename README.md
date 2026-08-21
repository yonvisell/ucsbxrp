# UCSB XRP course tools

This repository contains the `ucsb_xrp` MicroPython library, supplied reference
bytecode, five course starters, a browser IDE, the XRP Monitor, a deterministic
virtual XRP, and the on-robot service used to run the same projects on a
SparkFun RP2350 XRP.

## Open the applications

Students normally open the public course site; no Node.js, Python, Git, or
local web server is required:

- [yonvisell.github.io/ucsbxrp](https://yonvisell.github.io/ucsbxrp/)

For repository development, use the pinned Node.js 24.17.0 (`.nvmrc`), then
run:

```sh
npm install
npm run dev
```

- IDE: `http://127.0.0.1:5173/ide/`
- XRP Monitor: `http://127.0.0.1:5173/monitor/`
- XRP setup and repair: `http://127.0.0.1:5173/commission/`
- Getting started: `http://127.0.0.1:5173/guide/`

The IDE starts with the expanding-spiral demo. **New project from template**
creates any of the five challenges, two sensor-driven robot demos, or a staged
MicroPython tutorial as an ordinary editable project. The demos cover
obstacle-triggered turning and an expanding spiral with two live parameters.
Select **Virtual XRP** for immediate use or **Physical XRP** for a robot
hotspot or an existing local network. Later starters retain all components
introduced so far; students carry their completed methods forward and enable
each named `USE_STUDENT_*` switch independently.

## IDE workflow

A **workspace** is a parent folder containing one named folder per XRP project.
If a workspace is connected, **New project from template** asks for the project
folder name, creates that folder, and writes the template immediately. **Open
project** resumes an existing folder. Source edits then save automatically after
a short pause; **Save** forces an immediate write. The active folder is shown as
`./<project-folder>` above the file list. Its `UCSB_XRP_Autosaves` subfolder
retains the four prior complete project states before overwrite and also receives
monitored run output and telemetry. New, renamed, duplicated, and deleted files
remain project-relative, and `.ucsb-xrp-project.json` stores the project name and
main Python file.

The browser backup is independent of the project folder. Chrome remembers folder
handles when permitted and otherwise offers one reconnect action. With no
workspace connected, a template remains in the browser backup until **Save**
selects a workspace and names its project folder.

- **Validate** compiles every Python file with MicroPython without running
  it.
- **Flash project** atomically writes the complete project to a physical XRP.
- The play button validates first, runs the selected main file if validation
  passes, and becomes a stop button while the project is active. Stopping
  commands zero drive input.
- The reset button returns the selected target to its initial state.
- **XRP Monitor** opens live telemetry and the world view in another tab.

Settings are collapsible and include editor/output font size (9 px default,
8 px minimum), indentation, word wrap, code overview, target selection, and
the XRP Wi-Fi mode and existing-Wi-Fi address. Status, Program output, and
the connection/validation System log are separate tabs.

| Action | macOS | Windows/Linux |
| --- | --- | --- |
| Save | `Command-S` | `Ctrl-S` |
| Validate | `Command-Shift-Enter` | `Ctrl-Shift-Enter` |
| Run | `Command-Enter` | `Ctrl-Enter` |
| Open settings | `Command-,` | `Ctrl-,` |

## XRP Monitor

The Monitor shares the active virtual or physical target with the IDE. It
shows connection/run state, pose and trail when available, wheel speed,
drive commands, encoders, ultrasound distance, USER button, IMU, temperature,
battery, collision, and program output. For the virtual XRP, choose **Open field** or **Delivery
gate blocked**; the second scene exercises Challenge 5 observation and
replanning. The world uses the production XRP's dimensioned footprint, a
coordinate grid labeled in millimetres, and a small legend for the green path
and ochre ultrasound ray. The compact left sidebar collapses to a narrow rail and selects a
2–30 second scrolling history for wheel speed, normalized drive command,
ultrasound distance,
acceleration, or angular rate. Signals can be combined or hidden for the
current experiment. Each strip chart keeps the same vertical scale area as
signals are added or removed; additional charts scroll instead of shrinking.
One unlabeled grid line divides each pair of labeled time lines. When no pose
has been published, the world remains visible with a clearly labeled XRP
preview centered at the origin.
In a fresh virtual session, Monitor Run validates and starts the default
expanding-spiral project without requiring the IDE to run first. Once another
project is prepared by the IDE, both applications control that same revision.

**Live controls** remains open below the time window and shows controls declared
with `ucsb_xrp.live`. Numeric values use thin bounded sliders, Booleans use
checkboxes, and short choices use radio controls. Updates are validated and
applied together at the next `Robot` sample boundary. Named `live.watch()`
values appear below **Live telemetry** in the right panel, exposing current modes,
estimates, and error terms without periodic debug printing; telemetry remains
the time-history mechanism.

Recording retains the newest 30,000 samples: at least 10 minutes at the 50 Hz
virtual rate and about 30 minutes at the usual 16–17 Hz physical rate. The
Monitor shows the measured rate and corresponding time capacity while
recording. The exported CSV includes source,
pose availability, motion, encoders, collision, range, button, IMU,
temperature, battery, and sensor errors with units in the column names. It uses
seconds, radians, metres per second squared, and radians per second; course
distances and wheel speeds remain in millimetres and millimetres per second.
When a project folder is connected, every monitored run also writes aligned
`run-1.txt`, `run-1.json`, and `telemetry-1.csv` automatic copies. Generations
1–4 rotate newest to oldest; explicit CSV downloads are never rotated.

Enter a short note and choose **Add note** to mark the current telemetry time.
The note appears at the corresponding world pose and as a vertical marker on
each strip plot; **Hide notes** and **Show notes** change all views together.
At most 24 current notes are retained, and monitored-run metadata saves them
with the run. **Plots SVG** exports all selected plots as one editable vector
figure; **Plots PNG** exports the same figure as a high-resolution image.
After stopping a telemetry recording, **Video** creates a 960×720 WebM world replay
with the path, ultrasound ray, robot pose, scene, and visible notes. Replays
preserve real time up to 20 seconds and label the acceleration factor used for
longer recordings. The export path uses browser-native graphics and video
encoding and adds no upload or server dependency.

## Set up or repair a physical XRP

Open **Open wizard for XRP initial set up or repair** on the landing page, or
**Set up or repair XRP** in IDE Settings, using current desktop Chrome or Edge
on Windows or macOS. The wizard:

1. optionally connects a workspace for named project folders and setup logs,
   and waits for the complete offline web release;
2. selects the USB-C XRP through the browser's device picker;
3. checks the RP2350 controller, MicroPython 1.28.0, XRPLib, course library,
   supplied bytecode, and robot service;
4. installs only missing or changed files, read-verifies every installed file,
   and repairs the exact course firmware when necessary; and
5. restarts the XRP, verifies its Wi-Fi service, and opens the IDE with
   **Physical XRP** selected.

USB-C remains connected while the wizard inspects, installs, and verifies the
controller. The physical Run/Monitor/telemetry service then uses the selected
local Wi-Fi transport; USB remains the setup and repair path. The first setup
defaults to a distinct hotspot such as `UCSB-XRP-9EDE`, with
password `ucsb-xrp` and service address `http://192.168.42.1`. Join the named
network when the wizard asks. The web tools continue from Chrome's verified
offline copy. A repaired robot keeps its existing network unless another mode
is selected. **Existing Wi-Fi** is also available in the wizard and later from
IDE Settings; credentials pass directly to the XRP over USB and are not stored
by the web application.

Selecting a workspace performs a real write-and-read check and creates
`UCSB_XRP_Autosaves/xrp-setup-latest.txt`. The collapsed **Setup log** records
the controller check, changed-file count, reset, and each robot-service probe;
it never records the Wi-Fi password. The workspace can be chosen later in the IDE;
the visible log remains copyable meanwhile. **Verify robot connection** begins
after USB installation and reset. Existing-Wi-Fi mode can verify without
changing the computer's network; hotspot mode requires joining the network
shown by the wizard. Allow this site to access the local network when Chrome
asks. On macOS, Chrome must also be enabled under **System Settings → Privacy &
Security → Local Network**.

The commissioning handoff remembers the workspace but does not import its
contents as a project. For a new browser, the untouched spiral starter is
written immediately to `./Expanding-Spiral`. Recovered student work is never
moved automatically. A repository is opened only through **Open project**, so
unrelated Python files cannot replace the current starter.

The same **Install or repair XRP** action is intentionally idempotent: matching
files are not rewritten, changed files are replaced and hashed, the runtime is
import-checked, and the selected network profile is normalized before reset.
The browser must still show its own folder, serial-device, firmware-drive, and
local-network permission controls; the web application cannot bypass those
platform boundaries. The implementation feature-detects each browser API and
provides a direct explanation when the current browser or platform lacks it.

For instructor automation or fleet maintenance, the equivalent command-line
path remains available:

```sh
.venv/bin/python scripts/provision_xrp.py
```

Station mode and an optional known-free static address are supported without
changing the student workflow:

```sh
.venv/bin/python scripts/provision_xrp.py \
  --mode station --ssid Pink \
  --static-address 192.168.7.30 --gateway 192.168.7.1
```

Use `scripts/xrp_service_probe.py --address ADDRESS` for the complete
non-moving protocol lifecycle. With the robot raised and wheels clear,
`scripts/xrp_motor_check.py --address ADDRESS` runs one short bounded
motor/encoder response check. Neither command requires a staged checklist.
The installed service automatically reboots through a hardware watchdog if its
shared MicroPython runtime ever locks; USB remains the fallback repair path.
Detailed recovery and remaining floor-calibration work are in
`docs/REMAINING_HARDWARE_AND_NETWORK_SETUP.md`.

## Student version control

Use a course-owned GitHub repository and the same project folder in both the
UCSBXRP IDE and [GitHub Desktop](https://docs.github.com/en/desktop/overview/getting-started-with-github-desktop).
GitHub Desktop runs on current Windows and macOS and provides review, commit,
pull, and push without a command-line Git installation. The student workflow
is: clone once, select **Open project** for that cloned folder in the IDE, work
normally with automatic source saving, then review and commit in GitHub Desktop.

Uploading files through github.com is an installation-free fallback for
defined milestones, but it is not continuous folder synchronization. The
static UCSBXRP page deliberately never requests or stores a GitHub password or
personal access token. Secure one-click repository synchronization would need
a registered GitHub App and a course-operated token broker, which is
unnecessary for the current workflow.

GitHub Classroom is not the basis of this design because GitHub is
[decommissioning it on August 28, 2026](https://github.blog/changelog/2026-05-26-github-classroom-sign-ups-are-no-longer-available/).
Use ordinary repositories in a course organization; evaluate the replacement
Classroom 50 service separately if its roster and assignment automation become
useful.

## Course library

The five challenges are Straight Run, Turn and Return, Waypoint Courier,
Mapped Route, and Delivery Mission. Students progressively implement six
components:

- `SensorModel`
- `WheelSpeedController`
- `DifferentialDrive`
- `Odometry`
- `NavigationController`
- `GridPlanner`

Supplied services are `XRPBot`, `Robot`, `StraightLineController`, `ArenaMap`,
`OccupancyGrid`, and `DeliveryMission`. `DriveCommand(left, right)` is the
explicit, normalized two-wheel output of the controller; `XRPBot` alone applies
robot-specific signs and writes it to XRPLib. Its name is descriptive course
vocabulary, not a separate device or student requirement.

The retained source in `vendor/current/reference_source/` is editable build
input and is not definitive. The student/browser/device release uses the
reproducibly generated ordinary `.mpy` artifacts in
`vendor/current/reference_mpy/`. Public behavior and course clarity govern
future revisions.

## Offline use

```sh
npm run build
npm run preview
```

Open the public HTTPS course site once while online and wait for a status such
as **IDE saved in Chrome** or **Monitor saved in Chrome**. Chrome has then saved
the complete course apps and course release. They can reopen after Chrome is
closed and without an internet connection; no Node.js server or separate
installation is required. Robot commands and telemetry still use the selected
local robot connection.

The saved app is separate from student project files. A selected workspace
remains an ordinary folder on the computer; without one, project recovery data
belongs to Chrome. The course app is not copied into the workspace. Clearing
the site's Chrome data removes the saved app and browser-only recovery data,
but does not remove files in a selected workspace. The optional **Install
course tools** button on the landing page adds a launcher and standalone app
window when Chrome offers it; the installed app uses the same browser storage
and update process. Browser storage is not a permanent project backup and can
also be removed under storage pressure; workspace files are unaffected.

The saved release includes the applications, workers, MicroPython WebAssembly,
course package, starters, and reference bytecode; private reference source is
excluded. While online, each page checks for a complete newer release. It
activates the update only after every required asset is present, so an
interrupted update leaves the preceding complete release available. Local
development deliberately reports **Local development** and does not save a
browser copy, so stale assets do not hide changes.

## Validation

Run the complete software suite, including stable Chrome workflows:

```sh
npm run check
```

Narrower commands are `npm run test:python`, `npm run test:micropython`,
`npm test`, `npm run build`, `npm run test:offline`, and
`npm run test:browser`. See `docs/VALIDATION_PLAN.md` for the boundaries and
`STATUS.md` for current measured results.

For the self-contained GitHub Pages artifact, deployment workflow, license
packaging, and conservative resource audit, see
`docs/DISTRIBUTION_AND_EFFICIENCY.md`.
