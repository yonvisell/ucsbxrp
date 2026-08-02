# XRP setup and remaining physical work

## Configure or repair a robot

Connect the flashed RP2350 XRP by USB-C and run:

```sh
.venv/bin/python scripts/provision_xrp.py
```

This read-verifies the current course release and creates a device-specific
`UCSB-XRP-…` hotspot. Join it with password `ucsb-xrp`; the robot address is
`http://192.168.42.1`. Select **Physical XRP** and **Robot hotspot** in IDE
Settings. Open the production applications online once and wait for **Saved for
offline use** before changing Wi-Fi; thereafter the web application runs
locally.

An instructor-managed local network is optional:

```sh
.venv/bin/python scripts/provision_xrp.py --mode station --ssid Pink
```

The command reads the local credential without displaying it and reports the
XRP's current address. Select **Existing Wi-Fi** and enter that address. The
router does not need an internet uplink after the applications are local. If
the selected network is unavailable, the XRP starts its own recoverable hotspot
until reset. Rerun either command to change mode or repair the installation.

The current development robot was last restored to `Pink` at `192.168.7.34` on
course release `2026.08-dev.5`. The default hotspot was validated as
`UCSB-XRP-9EDE` at `192.168.42.1`.

## Remaining floor-dependent work

Only the final course surface and arenas remain:

1. measure wheel-speed response, effective wheel diameter and track width, and
   stopping distance;
2. compare moving IMU and range observations with the simulator; and
3. run the five complete challenges in their course arenas.

Use those measurements to refine `robot_config.py`, simulator comparison
envelopes, and instructor examples. They do not require another network or
student workflow.
