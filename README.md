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

The IDE starts with Challenge 1. The **Course starter** menu loads any of the
five challenges. Select **Virtual XRP** for immediate use or **Physical XRP**
for the robot on the local network. Later starters retain all components
introduced so far; students carry their completed methods forward and enable
each named `USE_STUDENT_*` switch independently.

## IDE workflow

The IDE keeps a recoverable browser copy of the project. **Open folder** grants
access to a local working folder; **Save files** writes the complete project
back. New, renamed, duplicated, and deleted files remain project-relative, and
the selected startup file is saved in `.ucsb-xrp-project.json`. Open files use
normal editor tabs.

- **Validate code** compiles every Python file with MicroPython without running
  it.
- **Sync project** atomically transfers the complete project to a physical XRP.
- **Run virtual XRP** or **Run on XRP** executes the selected startup file.
- **Stop program** stops execution and commands zero motor effort.
- **Reset virtual XRP** or **Reset XRP** returns the target to a known state.
- **XRP Monitor** opens live telemetry and the world view in another tab.

Settings are collapsible and include editor/output font size (9 px default,
8 px minimum), indentation, word wrap, code overview, target selection, and
the physical XRP address. Status and verbose details are separate output tabs.

| Action | macOS | Windows/Linux |
| --- | --- | --- |
| Save project files | `Command-S` | `Ctrl-S` |
| Validate code | `Command-Shift-Enter` | `Ctrl-Shift-Enter` |
| Run | `Command-Enter` | `Ctrl-Enter` |
| Open settings | `Command-,` | `Ctrl-,` |

## XRP Monitor

The Monitor shares the active virtual or physical target with the IDE. It
shows connection/run state, pose and trail when available, wheel speed,
efforts, encoders, range, USER button, IMU, temperature, battery, collision,
and program output. For the virtual XRP, choose **Open field** or **Delivery
gate blocked**; the second scene exercises Challenge 5 observation and
replanning. The world uses the production XRP's dimensioned footprint and a
500 mm ruler. The compact left sidebar collapses to a narrow rail and selects a
2–30 second scrolling history for wheel speed, normalized motor command,
forward range,
acceleration, or angular rate. Signals can be combined or hidden for the
current experiment.

Recording is bounded to 30,000 samples. The exported CSV includes source,
pose availability, motion, encoders, collision, range, button, IMU,
temperature, battery, and sensor errors with units in the column names. It uses
seconds, radians, metres per second squared, and radians per second; course
distances and wheel speeds remain in millimetres and millimetres per second.

## Configure the physical XRP

The current robot uses the SparkFun XRP Controller with RP2350, MicroPython
1.28.0, and XRPLib 2026.07.1. With the Mac already on `Pink` and the XRP
connected by USB-C, run:

```sh
.venv/bin/python scripts/provision_xrp.py
```

The command detects one XRP, reads the network credential from the local
instructor details file without printing it, configures Wi-Fi, installs and
read-verifies the current course library/reference/service files, resets the
controller, and waits for its discovery reply. The current development robot
is `ucsb-xrp` at `http://192.168.7.30`.

If an access point associates the XRP but does not issue a DHCP lease, an
instructor can assign a known-free address in the same subnet without changing
the student workflow:

```sh
.venv/bin/python scripts/provision_xrp.py \
  --static-address 192.168.7.30 --gateway 192.168.7.1
```

Use `scripts/xrp_service_probe.py --address 192.168.7.30` for the complete
non-moving protocol lifecycle. With the robot raised and wheels clear,
`scripts/xrp_motor_check.py --address 192.168.7.30` runs one short bounded
motor/encoder response check. Neither command requires a staged checklist.
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
`OccupancyGrid`, and `DeliveryMission`. `MotorEfforts(left, right)` is the
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
The saved release includes the applications, workers, MicroPython WebAssembly,
course package, starters, and reference bytecode; private reference source is
excluded. Local development deliberately reports **Development build** and
does not save an offline browser copy, so stale assets do not hide changes.

## Validation

Run the complete software suite, including stable Chrome workflows:

```sh
npm run check
```

Narrower commands are `npm run test:python`, `npm run test:micropython`,
`npm test`, `npm run build`, `npm run test:offline`, and
`npm run test:browser`. See `docs/VALIDATION_PLAN.md` for the boundaries and
`STATUS.md` for current measured results.
