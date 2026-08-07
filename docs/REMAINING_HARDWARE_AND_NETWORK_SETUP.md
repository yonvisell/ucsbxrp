# XRP setup and remaining physical work

## Configure or repair a robot

Open **Set up or repair XRP** from the public landing page or IDE Settings in
current desktop Chrome or Edge. Choose a project folder, connect the RP2350 XRP
by USB-C, select it once, and choose **Robot hotspot** or **Existing Wi-Fi**.
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

The current development robot was last physically validated on `Pink` at
`192.168.7.34` with release `2026.08-dev.5`; dev.6 passed software and browser
validation but was not installed. The browser commissioning release is dev.7
and still awaits its first attached-XRP pass. The previously validated default
hotspot was `UCSB-XRP-9EDE` at `192.168.42.1`.

## Remaining floor-dependent work

Only the final course surface and arenas remain:

1. measure wheel-speed response, effective wheel diameter and track width, and
   stopping distance;
2. compare moving IMU and range observations with the simulator; and
3. run the five complete challenges in their course arenas.

Use those measurements to refine `robot_config.py`, simulator comparison
envelopes, and instructor examples. They do not require another network or
student workflow.
