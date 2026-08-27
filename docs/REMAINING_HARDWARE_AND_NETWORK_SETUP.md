# XRP setup and remaining physical work

## Student setup

Open **Set up or Repair** in current desktop Chrome or Edge.

1. Choose one **course folder**. Each project receives its own subfolder there.
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
After setup, **Flash project**, **Run**, **Stop**, and telemetry use Wi-Fi. The
computer must therefore be joined to the robot hotspot or the same local Wi-Fi
as the robot.

The robot-hotspot password is `ucsb-xrp`; its service address is
`192.168.4.1`. Reopen **Set up or Repair** to rename the hotspot, select a
different network, or repair an interrupted installation.

## Current development robot

The attached RP2350 has release `2026.08-dev.22`. USB readback verified all 26
installed files, service version, protocol version, and hotspot profile. Its
hotspot is `UCSB-XRP-VISELL` at `192.168.4.1`.

The current release has completed repeated network-service and raised-wheel
tests. One unchanged robot boot handled 200 telemetry requests, ten project
flashes, ten no-motion Run/Stop cycles, and two bounded motion runs. Both motors
and encoders responded, the Monitor received course-loop telemetry, Stop
returned the robot to zero output, and repeated polling did not grow a log file
on the robot. The default Expanding Spiral project was restored afterward.

## Remaining floor-dependent work

The remaining hardware work requires the final course surface and arenas:

1. measure wheel-speed response, effective wheel diameter and track width, and
   stopping distance;
2. compare moving IMU and range observations with the simulator; and
3. run the five complete challenges in their course arenas.

Use those measurements to refine `robot_config.py`, simulator comparison
envelopes, and instructor examples. They do not require another network or
student workflow.
