# XRP setup and remaining physical work

## Current development robot

The SparkFun RP2350 XRP is fully configured. It joins `Pink` at
the address printed by the provisioner; its latest DHCP lease was
`192.168.7.32`. The current firmware, XRPLib, UCSB library, reference bytecode,
and browser service are installed. USB can remain connected, but normal IDE
and Monitor traffic uses `Pink`.

Nothing else needs to be configured for the present raised-wheel setup. Open:

- IDE: `http://127.0.0.1:4174/ide/`
- XRP Monitor: `http://127.0.0.1:4174/dashboard/`
- Guide: `http://127.0.0.1:4174/guide/`

Select **Physical XRP** in the IDE. The Monitor follows the same target and
address automatically. The normal sequence is **Validate code**, **Sync
project**, then **Run**.

## Configure another course XRP

Connect the controller by USB-C and run:

```sh
.venv/bin/python scripts/provision_xrp.py
```

The command reads the instructor's local `Pink` credential without printing
it, installs or repairs the complete device release, verifies every file,
restarts the controller, and prints its LAN address. Enter that address once in
IDE Settings. Students then use the same IDE/Monitor workflow for the virtual
and physical XRP.

## If the robot is not reachable

The service watchdog automatically reboots a locked runtime. If it has not
returned after about 20 seconds, press **RESET** once. If it still does not
appear, rerun `scripts/provision_xrp.py`; this is both the setup and repair
command. UF2 recovery is relevant only if the controller no longer enumerates
as MicroPython over USB.

## Remaining floor-dependent work

The software, virtual XRP, stationary sensors, Wi-Fi path, complete physical
project path, raised-wheel motors, and encoders are validated. The remaining
work requires placing the wheels on the final course surface:

1. measure wheel-speed response, effective wheel diameter and track width, and
   stopping distance;
2. compare moving IMU and range observations with the simulator; and
3. run the five complete challenges in their course arenas.

Use those measurements to refine `robot_config.py` and the simulator's
comparison envelopes. No additional network mode, student handoff, or browser
workflow is needed.
