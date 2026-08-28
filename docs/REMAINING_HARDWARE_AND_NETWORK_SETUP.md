# XRP setup and remaining physical work

## Student setup

Open **Set up or Repair** in current desktop Chrome or Edge.

1. Choose one **Working folder**. Each project receives its own named Project
   folder there.
2. Connect the XRP by USB-C and confirm the controller shown by the wizard. On
   first use, select **XRP Controller** in Chrome's device chooser.
3. Choose **Robot hotspot** or **Existing Wi-Fi**. A hotspot works without a
   router. Optionally enter one team member's last name to create a recognizable
   name such as `UCSB-XRP-VISELL`.
4. Select **Install course software** or **Check and repair course software**.
   The same action installs, updates, or repairs the robot and can be repeated.
5. Follow the displayed Wi-Fi instruction, then check the robot connection.
   The wizard opens the IDE in Physical XRP mode after the service replies.

USB-C is used for initial setup, firmware repair, and course-software repair.
After setup, **Run**, **Stop**, Reset, and telemetry use Wi-Fi. Run checks the
project structure, compiles every Python file when needed, and loads the exact
current project into the XRP's temporary run slot before starting it. The
computer must therefore be joined to the robot hotspot or the same local Wi-Fi
as the robot.

The robot-hotspot password is `ucsb-xrp`; its service address is
`192.168.4.1`. Reopen **Set up or Repair** to rename the hotspot, select a
different network, or repair an interrupted installation.

## Current development robot

The strongest retained raised-wheel evidence is for robot runtime
`2026.08-dev.36`, generation 17, on Pink. Run and Stop from both IDE and
Monitor, Reset and rerun, motor effort, both encoders and wheel distances,
sensors, pose, path, plots, logs, and final zero drive were observed. The exact
record is
`docs/hardware/2026-08-27-dev36-final-physical-browser-validation.json`.

The active browser/course bundle is `2026.08-dev.37`. It accepts compatible
robot runtimes from generation 36 onward, so this application revision does not
force a repair. Its native USB wizard, station lifecycle, and hotspot lifecycle
still require the focused current-release repeat described in
`docs/CURRENT_PRODUCT_OUTCOMES.md`.

## Remaining floor-dependent work

The remaining hardware work requires the final course surface and arenas:

1. measure wheel-speed response, effective wheel diameter and track width, and
   stopping distance;
2. compare moving IMU and range observations with the simulator; and
3. run the five complete challenges in their course arenas.

Use those measurements to refine `robot_config.py`, simulator comparison
envelopes, and instructor examples. They do not require another network or
student workflow.
