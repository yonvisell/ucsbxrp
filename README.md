# UCSB XRP course tools

This repository contains the `ucsb_xrp` MicroPython library, supplied reference
bytecode, five challenge projects, two demos, five guided Python and MicroPython
tutorial projects, a browser IDE, the XRP Monitor, a repeatable physics-based
virtual XRP, and the on-robot
service used to run the same projects on a SparkFun RP2350 XRP. The five
tutorial projects progress from Python fundamentals to physical-XRP
preparation.

## Open the applications

Students normally open the public course site; no Node.js, Python, Git, or
local web server is required:

- [yonvisell.github.io/ucsbxrp](https://yonvisell.github.io/ucsbxrp/)

For repository development, use the pinned Node.js 24.17.0 (`.nvmrc`) when
available. The build also supports Node.js 20.19 or newer compatible LTS
releases, including the Node 20 runtime bundled with Codex. Then
run:

```sh
npm install
npm run dev
```

- IDE: `http://127.0.0.1:5173/ide/`
- XRP Monitor: `http://127.0.0.1:5173/monitor/`
- XRP setup and repair: `http://127.0.0.1:5173/commission/`
- Getting started: `http://127.0.0.1:5173/guide/`
- UCSB XRP API: `http://127.0.0.1:5173/reference/`

The IDE starts with the expanding-spiral demo. **New from template…**
creates any of the five challenges, two sensor-driven robot demos, or a staged
MicroPython tutorial as an ordinary editable project. The demos cover
obstacle-triggered turning and an expanding spiral with two live parameters.
Select **Virtual XRP** for immediate use or **Physical XRP** for a robot
hotspot or an existing local network. Later challenges retain all components
introduced so far; students carry their completed methods forward and enable
each named `USE_STUDENT_*` switch independently.

## IDE workflow

A **Working folder** is the parent folder for UCSBXRP work. Each **Current
project** is stored in one named **Project folder** inside it. After the IDE has
access to a Working folder, **New from template…** asks for the Project folder
name, creates that folder, and writes the template immediately. **Open project**
resumes an existing folder. Source edits then save automatically after a short
pause; Command/Ctrl+S forces an immediate write.
The active folder is shown as
`./<project-folder>` above the file list. Its `UCSB_XRP_Autosaves` subfolder
retains the four prior complete project states before overwrite and also receives
monitored run output and telemetry. New, renamed, duplicated, and deleted files
remain project-relative, and `.ucsb-xrp-project.json` stores the project name and
main Python file.

The copy retained by Chrome is independent of the project folder. Chrome
remembers folder access when permitted and otherwise offers one reconnect
action. With no Working folder selected, project changes remain only in that
browser until the student chooses a Working folder and names the Project
folder.

- **Compile** checks the project structure and compiles every Python file with
  MicroPython without running the virtual or physical XRP.
- The play button compiles first and starts the selected main file if
  compilation passes. For a physical XRP, it atomically prepares the complete
  current project in temporary controller RAM over Wi-Fi before starting it.
  The button becomes a stop button while the project is active; stopping
  commands zero drive input.
- The reset button stops the selected target and clears its live course state.
  On a physical XRP, it retains the prepared RAM project, boot state, and Wi-Fi
  connection, so Run can start the same project revision again immediately.
- **XRP Monitor** opens live telemetry and the world view in another tab.

Settings are collapsible and include editor/output font size (9 px default,
8 px minimum), indentation, word wrap, code overview, target selection, and
the XRP Wi-Fi mode and existing-Wi-Fi address. Status, Program output, and
the connection/compilation System log are separate tabs.

| Action | macOS | Windows/Linux |
| --- | --- | --- |
| Save | `Command-S` | `Ctrl-S` |
| Compile | `Command-Shift-Enter` | `Ctrl-Shift-Enter` |
| Run | `Command-Enter` | `Ctrl-Enter` |
| Open settings | `Command-,` | `Ctrl-,` |

## XRP Monitor

The Monitor shares the active virtual or physical target with the IDE. It
shows connection/run state, pose and trail when available, wheel speed,
drive commands, encoders, ultrasound distance, USER button, IMU, temperature,
battery, and contact state. Program output and the complete target-event history
remain in the IDE terminal. For the virtual XRP, choose **Open field** or **Delivery
gate blocked**; the second scene exercises Challenge 5 observation and
replanning. The world uses the production XRP's dimensioned footprint, a
coordinate grid labeled in millimetres, and a small legend for the green path
and ochre ultrasound ray. The compact left sidebar collapses to a narrow rail and selects a
2–30 second scrolling history for wheel speed, normalized drive command,
ultrasound distance,
acceleration, or yaw rate. Signals can be combined or hidden for the
current experiment. Each strip chart keeps the same vertical scale area as
signals are added or removed; additional charts scroll instead of shrinking.
One unlabeled grid line divides each pair of labeled time lines. When no pose
has been published, the world remains visible with a clearly labeled XRP
preview centered at the origin.
In a fresh virtual session, Monitor Run compiles and starts the default
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

Right-click a strip plot at the relevant time, enter a short label in the
revealed field, and press Enter. The note appears at that time and at the
corresponding world pose; **Hide notes** and **Show notes** change all views
together.
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

1. selects a Working folder for named Project folders and troubleshooting logs,
   and waits for the complete offline web release;
2. selects the USB-C XRP through the browser's device picker;
3. checks the RP2350 controller, MicroPython 1.28.0, XRPLib, course library,
   supplied bytecode, and robot service;
4. installs only missing or changed files, read-verifies every installed file,
   and repairs the exact course firmware when necessary; and
5. restarts the XRP, verifies its Wi-Fi service, and opens the IDE with
   **Physical XRP** selected.

USB-C remains connected while the wizard inspects, installs, and verifies the
controller and its persistent course runtime. Physical Run prepares the current
project in temporary controller RAM over the selected local Wi-Fi transport;
Stop, Monitor, and telemetry use the same Wi-Fi transport. USB remains the
path for persistent runtime installation, repair, and Wi-Fi configuration.
The first setup defaults to a distinct hotspot such as `UCSB-XRP-9EDE`, with
password `ucsb-xrp` and service address `http://192.168.4.1`. Join the named
network when the wizard asks. An optional last-name field can replace the
device suffix with a recognizable team name such as `UCSB-XRP-VISELL`. The web
tools continue from Chrome's complete saved copy. A repaired robot keeps its
existing network unless another mode is selected. **Existing Wi-Fi** is also
available in the wizard and later from IDE Settings; credentials pass directly
to the XRP over USB and are not stored by the web application.

Selecting a Working folder performs a real write-and-read check and creates
`UCSBXRP_diagnostic.log` in that folder. Setup, IDE, and Monitor append
environment details, operations, connection state, program/service errors, and
run summaries to this one bounded troubleshooting file. It does not contain
Wi-Fi passwords, credentials, project source, or telemetry measurements. The
collapsed **Setup log** shows the current setup attempt and remains copyable.
**Verify robot connection** begins after USB installation and reset.
Existing-Wi-Fi mode can verify without changing the computer's network; hotspot
mode requires joining the network shown by the wizard. Allow this site to
access the local network when Chrome asks. On macOS, Chrome must also be enabled
under **System Settings → Privacy & Security → Local Network**.

The commissioning handoff remembers the Working folder but does not import its
contents as a project. In a new browser, the built-in expanding-spiral demo
opens without writing a project folder. The student can create its project
folder when they decide to keep it. Existing student work is never moved
automatically. A repository is opened only through **Open project**, so
unrelated Python files cannot replace the current project.

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
Keep the default service probe non-moving. Run the bounded motor check only with
the robot raised and its wheels clear, then complete floor calibration in the
actual course arena before relying on physical distances or turns.

## Student version control

Each course team maintains one GitHub repository. Clone it with
[GitHub Desktop](https://docs.github.com/en/desktop/overview/getting-started-with-github-desktop),
then select that cloned repository as the IDE **Working folder**. Use **Open
project** for one project subfolder inside it, or create a new project there.
Pull before editing. The IDE saves source changes into the active project
folder; GitHub Desktop shows those changes for review, commit, and push. This
works on current Windows and macOS without a command-line Git installation.

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

Instructors can define a checked, initially unpublished challenge in the
[browser authoring wizard](author/) and create it from the downloaded
specification with `scripts/challenge_authoring.py`. See
[`docs/INSTRUCTOR_CHALLENGE_AUTHORING.md`](docs/INSTRUCTOR_CHALLENGE_AUTHORING.md)
and the [UCSBXRP instructor overview](overview/).

## Offline use

```sh
npm run build
npm run preview
```

Open the public HTTPS course site once while online and wait for **Course apps
saved in Chrome**. Caching starts automatically; no installation action is
required. Chrome has then saved the complete course apps and course release for
that site in the current Chrome profile. They can reopen after Chrome is closed
and without an internet connection; no Node.js server or separate installation
is required. Physical robot commands and telemetry still require the computer
to use local Wi-Fi that can reach the XRP.

The saved course apps are separate from student project files. A selected
Working folder remains an ordinary folder on the computer; without one,
project changes belong to Chrome, and recordings and program output that are
not saved or exported last only for the current browser session. The course
apps are not copied into the Working folder. Clearing the site's Chrome data
removes the saved course apps, settings, browser-held project changes, and
remembered folder access, but does not remove files in a selected Working
folder. Select the folder again to restore access. Browser storage is not a
permanent project backup and can also be removed under storage pressure;
working-folder files are unaffected.

The saved release includes the applications, workers, MicroPython WebAssembly,
course package, challenge projects, demos, tutorial, and reference bytecode;
private reference source is excluded. While online, each page checks for a
complete newer release. It
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
`npm run test:browser`. The attached-robot browser test is opt-in with
`XRP_E2E_PHYSICAL=1`; it remains non-moving unless the operator also sets
`XRP_E2E_MOTION=raised_wheels` while that condition is physically true.

The GitHub Pages workflow in `.github/workflows/pages.yml` validates and builds
the self-contained artifact, packages third-party notices, runs the stable
Chrome workflows, and deploys pushes to `main`.
