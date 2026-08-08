# XRP setup and remaining physical work

## Configure or repair a robot

Open **Open wizard for XRP initial set up or repair** from the public landing
page, or **Set up or repair XRP** in IDE Settings, in current desktop Chrome or
Edge. Choose a project folder, connect the RP2350 XRP by USB-C, select it once,
and choose **Robot hotspot** or **Existing Wi-Fi**.
The wizard waits for the verified offline web copy, installs and read-verifies
only changed course files, repairs MicroPython when needed, restarts the XRP,
verifies its Wi-Fi service, and opens the IDE in physical mode.

A new robot defaults to its uniquely named `UCSB-XRP-…` hotspot at
`192.168.42.1`; its password is `ucsb-xrp`. A repaired robot keeps its current
network unless another mode is selected. The same wizard changes a network or
repairs an interrupted installation. Browser-managed folder, USB-device,
firmware-drive, and local-network permission prompts remain explicit.

`scripts/provision_xrp.py` remains an optional instructor/fleet interface to
the same installation file set; it is not part of the normal student path.

The current development robot now runs release `2026.08-dev.7` in hotspot mode
at `192.168.42.1`. Its 23-file USB repair passed no-change repetition and two
controlled one-file repairs. The public wizard also reached the native macOS
project-folder chooser; completing that chooser-to-Web-Serial path and granting
the final Pages origin local-network access are the remaining browser-specific
observations. The previously validated station profile is `Pink` at
`192.168.7.34`.

## Remaining floor-dependent work

Only the final course surface and arenas remain:

1. measure wheel-speed response, effective wheel diameter and track width, and
   stopping distance;
2. compare moving IMU and range observations with the simulator; and
3. run the five complete challenges in their course arenas.

Use those measurements to refine `robot_config.py`, simulator comparison
envelopes, and instructor examples. They do not require another network or
student workflow.
