# UCSB XRP course tools

This repository contains the `ucsb_xrp` MicroPython library, supplied reference
bytecode, five course starters, a browser IDE, the XRP Monitor, a deterministic
virtual XRP, and the private service used to run the same projects on a
SparkFun RP2350 XRP.

## Open the applications

Use Node.js 24.17.0 (`.nvmrc`), then run:

```sh
npm install
npm run dev
```

- IDE: `http://127.0.0.1:5173/ide/`
- XRP Monitor: `http://127.0.0.1:5173/dashboard/`
- Getting started: `http://127.0.0.1:5173/guide/`

The IDE starts with Challenge 1. The **Project template** menu loads the five
challenges, two sensor-driven robot demos, or a staged MicroPython tutorial as
an ordinary editable project. The demos cover obstacle-triggered turning and
an expanding spiral with two live parameters. Select **Virtual XRP** for
immediate use or **Physical XRP** for a robot hotspot or an existing local
network. Later starters retain all components introduced so far; students
carry their completed methods forward and enable each named `USE_STUDENT_*`
switch independently.

## IDE workflow

The IDE keeps a recoverable browser copy of the project. **Open folder** resumes
a local project; **Save now** selects or immediately updates its folder. After
a folder is selected, edits save there automatically after a short pause. The
visible `UCSB_XRP_Autosaves` subfolder retains the four prior complete project
states before overwrite. New, renamed, copied, and deleted files remain
project-relative, and the selected main Python file is saved in
`.ucsb-xrp-project.json`. Chrome remembers the folder handle when permitted and
otherwise offers a one-click reconnect; browser recovery never depends on that
permission.

- **Validate code** compiles every Python file with MicroPython without running
  it.
- **Flash project** atomically writes the complete project to a physical XRP.
- **Run** executes the selected main file; while active it becomes **Stop**.
- **Stop** ends execution and commands zero drive input.
- **Reset** returns the selected target to its initial state.
- **XRP Monitor** opens live telemetry and the world view in another tab.

Settings are collapsible and include editor/output font size (9 px default,
8 px minimum), indentation, word wrap, code overview, target selection, and
the XRP Wi-Fi mode and existing-Wi-Fi address. Status and verbose details are
separate output tabs.

| Action | macOS | Windows/Linux |
| --- | --- | --- |
| Save now | `Command-S` | `Ctrl-S` |
| Validate code | `Command-Shift-Enter` | `Ctrl-Shift-Enter` |
| Run | `Command-Enter` | `Ctrl-Enter` |
| Open settings | `Command-,` | `Ctrl-,` |

## XRP Monitor

The Monitor shares the active virtual or physical target with the IDE. It
shows connection/run state, pose and trail when available, wheel speed,
drive commands, encoders, range, USER button, IMU, temperature, battery, collision,
and program output. For the virtual XRP, choose **Open field** or **Delivery
gate blocked**; the second scene exercises Challenge 5 observation and
replanning. The world uses the production XRP's dimensioned footprint and a
500 mm ruler. The compact left sidebar collapses to a narrow rail and selects a
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

Recording is bounded to 30,000 samples. The exported CSV includes source,
pose availability, motion, encoders, collision, range, button, IMU,
temperature, battery, and sensor errors with units in the column names. It uses
seconds, radians, metres per second squared, and radians per second; course
distances and wheel speeds remain in millimetres and millimetres per second.
When a folder is connected, every monitored run also writes aligned
`run-1.txt`, `run-1.json`, and `telemetry-1.csv` automatic copies. Generations
1–4 rotate newest to oldest; explicit CSV downloads are never rotated.

## Configure the physical XRP

The current robot uses the SparkFun XRP Controller with RP2350, MicroPython
1.28.0, and XRPLib 2026.07.1. Connect the flashed XRP by USB-C and run:

```sh
.venv/bin/python scripts/provision_xrp.py
```

The default student configuration installs and read-verifies the course
library, reference bytecode, and service, then starts a uniquely named robot
hotspot such as `UCSB-XRP-9EDE`. Join that network with the course password
`ucsb-xrp`; the robot service is always `http://192.168.42.1`. In IDE Settings,
select **Physical XRP** and **Robot hotspot**.

To place the XRP and computer on an existing local network instead, run:

```sh
.venv/bin/python scripts/provision_xrp.py --mode station --ssid Pink
```

Station setup reads the matching credential from the local instructor details
file without printing it, joins the network, restarts the service, and reports
its DHCP address. Select **Existing Wi-Fi** in IDE Settings and enter that
address. An isolated course router does not require an internet uplink after
the applications have been saved locally. If the requested network is absent,
the XRP starts its recoverable device-specific hotspot until the next reset.

If an access point associates the XRP but does not issue a DHCP lease, an
instructor can assign a known-free address in the same subnet without changing
the student workflow:

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
reference source is excluded. Local development deliberately reports
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
