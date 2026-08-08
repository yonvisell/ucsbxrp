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
- XRP Monitor: `http://127.0.0.1:5173/dashboard/`
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

The IDE keeps a recoverable browser copy of the project. **Open folder** resumes
a local project; **Save** selects or immediately updates its folder. After a
folder is selected, edits save there automatically after a short pause. The
visible `UCSB_XRP_Autosaves` subfolder retains the four prior complete project
states before overwrite. New, renamed, duplicated, and deleted files remain
project-relative, and the selected main Python file is saved in
`.ucsb-xrp-project.json`. Chrome remembers the folder handle when permitted and
otherwise offers a one-click reconnect; browser recovery never depends on that
permission.

- **Validate** compiles every Python file with MicroPython without running
  it.
- **Flash project** atomically writes the complete project to a physical XRP.
- The play button runs the selected main file and becomes a stop button while
  the project is active. Stopping commands zero drive input.
- The reset button returns the selected target to its initial state.
- **XRP Monitor** opens live telemetry and the world view in another tab.

Settings are collapsible and include editor/output font size (9 px default,
8 px minimum), indentation, word wrap, code overview, target selection, and
the XRP Wi-Fi mode and existing-Wi-Fi address. Status and verbose details are
separate output tabs.

| Action | macOS | Windows/Linux |
| --- | --- | --- |
| Save | `Command-S` | `Ctrl-S` |
| Validate | `Command-Shift-Enter` | `Ctrl-Shift-Enter` |
| Run | `Command-Enter` | `Ctrl-Enter` |
| Open settings | `Command-,` | `Ctrl-,` |

## XRP Monitor

The Monitor shares the active virtual or physical target with the IDE. It
shows connection/run state, pose and trail when available, wheel speed,
drive commands, encoders, range, USER button, IMU, temperature, battery, collision,
and program output. For the virtual XRP, choose **Open field** or **Delivery
gate blocked**; the second scene exercises Challenge 5 observation and
replanning. The world uses the production XRP's dimensioned footprint and a
coordinate grid labeled in millimetres. The compact left sidebar collapses to a narrow rail and selects a
2–30 second scrolling history for wheel speed, normalized drive command,
forward range,
acceleration, or angular rate. Signals can be combined or hidden for the
current experiment. Each strip chart keeps the same vertical scale area as
signals are added or removed; additional charts scroll instead of shrinking.
One unlabeled grid line divides each pair of labeled time lines. When no pose
has been published, the world remains visible with a clearly labeled XRP
preview centered at the origin.

**Live controls** remains open below the time window and shows controls declared
with `ucsb_xrp.live`. Numeric values use thin bounded sliders, Booleans use
checkboxes, and short choices use radio controls. Updates are validated and
applied together at the next `Robot` sample boundary. Named `live.watch()`
values appear below **Live values** in the right panel, exposing current modes,
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
When a folder is connected, every monitored run also writes aligned
`run-1.txt`, `run-1.json`, and `telemetry-1.csv` automatic copies. Generations
1–4 rotate newest to oldest; explicit CSV downloads are never rotated.

## Set up or repair a physical XRP

Open **Open wizard for XRP initial set up or repair** on the landing page, or
**Set up or repair XRP** in IDE Settings, using current desktop Chrome or Edge
on Windows or macOS. The wizard:

1. connects a normal local project folder and waits for the complete offline
   web release;
2. selects the USB-C XRP through the browser's device picker;
3. checks the RP2350 controller, MicroPython 1.28.0, XRPLib, course library,
   supplied bytecode, and robot service;
4. installs only missing or changed files, read-verifies every installed file,
   and repairs the exact course firmware when necessary; and
5. restarts the XRP, verifies its Wi-Fi service, and opens the IDE with
   **Physical XRP** selected.

The first setup defaults to a distinct hotspot such as `UCSB-XRP-9EDE`, with
password `ucsb-xrp` and service address `http://192.168.42.1`. Join the named
network when the wizard asks. The web tools continue from Chrome's verified
offline copy. A repaired robot keeps its existing network unless another mode
is selected. **Existing Wi-Fi** is also available in the wizard and later from
IDE Settings; credentials pass directly to the XRP over USB and are not stored
by the web application.

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

Use a course-owned GitHub repository and the same local folder in both the
UCSBXRP IDE and [GitHub Desktop](https://docs.github.com/en/desktop/overview/getting-started-with-github-desktop).
GitHub Desktop runs on current Windows and macOS and provides review, commit,
pull, and push without a command-line Git installation. The student workflow
is: clone once, open that cloned folder in the IDE, work normally with IDE
autosave, then review and commit in GitHub Desktop.

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

Load each production application once and wait for **Saved for offline use**.
The web application and course release then operate locally without further
exchange with the web host; robot commands and telemetry remain local network
traffic. The saved release includes the applications, workers, MicroPython
WebAssembly, course package, starters, and reference bytecode; private
reference source is excluded. While online, each page explicitly checks for a
new complete release without reusing a stale service-worker response. A new
release replaces the active cache only after every required asset is present;
the preceding complete release remains available during an interrupted
update. Local development deliberately reports
**Development build** and does not save an offline browser copy, so stale
assets do not hide changes.

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
