# XRP setup and remaining physical work

## Current development robot

The attached SparkFun RP2350 XRP is connected to `Pink` at
`192.168.7.32` and runs course release `2026.08-dev.4`. USB installation,
Wi-Fi discovery, compilation, project synchronization, execution,
live telemetry, live parameter updates, stop/restart, reset/reconnect, and
raised-wheel motor response have been exercised. The student-facing obstacle
demo is retained on the controller and is stopped.

The local applications are:

- IDE: `http://127.0.0.1:4174/ide/`
- XRP Monitor: `http://127.0.0.1:4174/dashboard/`
- Guide: `http://127.0.0.1:4174/guide/`

No additional setup is needed for this robot. Select **Physical XRP** in the
IDE; the Monitor follows the same target and address. **Run** synchronizes
changed files automatically. **Sync project** transfers without starting.

## Configure or repair an XRP

Connect the controller by USB-C and run:

```sh
.venv/bin/python scripts/provision_xrp.py
```

The command reads the locally stored `Pink` credential without displaying it,
installs and read-verifies the course service and library, restarts the XRP,
and prints its current network address. Enter that address once in IDE
Settings. Students then use the same IDE and Monitor workflow for virtual and
physical targets.

If the web apps cannot reach a previously configured robot, rerunning the same
command is the shortest repair path: it also reports a changed DHCP address.
Reflash the pinned SparkFun RP2350 MicroPython UF2 only if the controller no
longer enumerates as a MicroPython USB device. GPIO15 is an ordinary GPIO and
does not replace the controller's RESET input.

## Remaining floor-dependent work

The remaining evidence depends on the final course surface rather than another
software or network setup:

1. measure wheel-speed response, effective wheel diameter and track width, and
   stopping distance;
2. compare moving IMU and range observations with the simulator; and
3. run the five complete challenges in their course arenas.

Use those measurements to refine `robot_config.py`, simulator comparison
envelopes, and instructor examples. They should not add another student
workflow, confirmation sequence, or target protocol.
