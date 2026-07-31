# UCSB XRP course tools

This repository contains the browser IDE, XRP Monitor, getting-started guide,
shared target interface, deterministic virtual XRP, and the first canonical
`ucsb_xrp` runtime slice for the UCSB mobile robotics course.

## Local use

Use Node.js 24.17.0, recorded in `.nvmrc`.

```sh
nvm use
npm install
npm run dev
```

One Vite server starts both applications:

- IDE: `http://127.0.0.1:5173/ide/`
- XRP Monitor: `http://127.0.0.1:5173/dashboard/`
- getting started: `http://127.0.0.1:5173/guide/`

Port 5173 can be changed with, for example,
`npm run dev -- --port 5180`.

Run all current checks, including the production build and stable-Chrome
workflow:

```sh
npm run check
```

The narrower commands are:

```sh
npm run test:python
npm run test:micropython
npm test
npm run build
npm run test:browser
```

`npm run test:browser` uses the installed stable Google Chrome and starts a
temporary production preview on port 4175.

## IDE project workflow

The IDE always maintains browser recovery. Use **Open folder** to load a local
course folder with read/write permission, **New file** to add a project-relative
text file, and **Save files** to write the complete project back to the selected
folder. Open files appear in tabs. The working-folder handle is session-scoped,
so the folder must be selected again after a browser restart even though the
recovered project text remains available.

The Stage 1 commands have deliberately explicit meanings:

- **Validate code** compiles every Python project file with MicroPython without
  running it. Documentation and configuration files remain part of the saved
  project but are not treated as Python.
- **Run virtual XRP** runs `main.py` on the deterministic virtual target. It
  does not transfer code to a physical robot.
- **Stop program** terminates the program and commands zero motor effort.
- **Reset virtual XRP** stops the program and resets virtual pose, speed,
  effort, and encoders.
- **XRP Monitor** opens telemetry, the virtual world, live values, plots, and
  program output in a separate tab.

### Keyboard shortcuts

| Action | macOS | Windows/Linux |
| --- | --- | --- |
| Save all project files | `Command-S` | `Ctrl-S` |
| Validate code | `Command-Shift-Enter` | `Ctrl-Shift-Enter` |
| Run virtual XRP | `Command-Enter` | `Ctrl-Enter` |
| Open or close settings | `Command-,` | `Ctrl-,` |

Monaco uses `Tab` for indentation; the indent width is selectable in the
collapsible Settings panel.

## Current examples

`vendor/current/examples/records_and_units.py` demonstrates the provisional
value records without hardware. `no_motion_sensor_read.py` runs on the XRP with
the default motion-locked configuration, reads the available sensors, requests
zero effort only, and stops again in `finally`. No physical-motion example is
provided before raised-wheel H2 acceptance and per-robot calibration.

## Motor effort commands

`MotorEfforts(left, right)` is the course record for normalized,
dimensionless left and right motor commands. It is part of the active course
draft, including Challenge 1 fixed-effort characterization and the
`WheelSpeedController -> MotorEfforts -> XRPBot` control path. Only
`XRPBot.set_efforts()` applies physical motor-sign configuration and calls
XRPLib.

The library API is under review and this name is not frozen. The course
progression and physical meaning are the compatibility target; the draft
signatures may change to reduce student friction.

## Physical RP2350 bring-up

The attached robot is the current SparkFun XRP Controller with RP2350 and RM2.
Its original `PICODISK` image was preserved as XRP-WPILib 2.1.0. It now runs the
verified `SPARKFUN_XRP_CONTROLLER` MicroPython 1.28.0 image with XRPLib
2026.07.1, installed and checked over USB. The battery pack is disconnected,
but USB-C can energize motor-driver VIN when the board power switch is on;
XRPLib measured about 5.4 V and reported motor power available. No nonzero
effort has been issued.

The physical workflow is:

1. support the assembled robot with wheels clear and connect USB-C;
2. preserve any readable firmware identity and files;
3. enter the RP2350 UF2 bootloader through the documented BOOT/RESET or verified
   1200-baud touch procedure;
4. flash the verified non-beta MicroPython 1.28.0 UF2 selected by the official
   Open-STEM manifest, then install XRPLib 2026.07.1 and the course bundle;
5. verify the USB REPL, runtime identity, imports, reset recovery, non-motion
   peripherals, and zero-before/after cleanup without issuing nonzero effort;
6. install and explicitly start the private course supervisory service;
7. prove the application and course bundle offline, then later join the XRP
   access point for browser Local Network Access and transport acceptance;
8. perform powered raised-wheel motor acceptance only under the separate
   explicit motion gate.

The original and post-flash evidence are recorded in
`docs/hardware/2026-07-31-rp2350-usb-baseline.json` and
`docs/hardware/2026-07-31-rp2350-micropython-h1.json`. Firmware must not be
copied to the normal `PICODISK` status volume.

## Current boundary

The browser plumbing workflow is operational: multi-file editing,
working-folder save, MicroPython validation, run, motion and telemetry, output,
wheel-speed plotting, cross-tab stop/reset, and fail-to-zero after loss of the
run-owning IDE. Browser MicroPython and the physical RP2350 load the same
canonical `vendor/current/ucsb_xrp` sources; only XRPLib is simulated in the
browser. The physical-target interface remains intentionally provisional and
hidden until correlated command replies, atomic whole-project transfer, and
independent target supervision are implemented. See `STATUS.md`,
`IMPLEMENTATION_PLAN.md`, `docs/VALIDATION_PLAN.md`, and
`docs/STAGE1_TECHNICAL_FINDINGS.md`.
