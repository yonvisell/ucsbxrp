# XRP setup and remaining physical work

## Current development robot

The SparkFun RP2350 XRP previously joined `Pink`; its latest DHCP lease was
`192.168.7.32`. Release `2026.08-dev.2` passed the complete physical service
and raised-wheel checks. The completed `2026.08-dev.3` release is ready on the
Mac but is not yet installed: in the latest probe the controller appeared on
neither USB nor its last LAN address.

The production applications are available at:

- IDE: `http://127.0.0.1:4174/ide/`
- XRP Monitor: `http://127.0.0.1:4174/dashboard/`
- Guide: `http://127.0.0.1:4174/guide/`

After the controller returns, select **Physical XRP** in the IDE. The Monitor
follows the same target and address automatically. The normal sequence is
**Validate code**, then **Run**; Run synchronizes changed files automatically.
**Sync project** remains available when an instructor wants an explicit
transfer without starting the program.

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

## Restore the current development robot

Disconnect both USB and battery power from the controller, then reconnect USB
normally. Once a MicroPython serial port appears, run:

```sh
.venv/bin/python scripts/provision_xrp.py
```

That installs and read-verifies release `2026.08-dev.3`, restores `Pink`,
restarts the service, and prints the current LAN address. If normal USB
reconnection still produces no serial port, reconnect once in BOOTSEL mode,
flash the current SparkFun RP2350 MicroPython UF2, reconnect normally, and run
the same provision command.

GPIO15 is an ordinary GPIO, not the RP2350 hardware reset signal. Connecting
the header RESET input to GPIO15 can let a healthy program request a reset, but
cannot recover a VM or USB interface that is already unresponsive.

After provisioning, the two direct repetitions are:

```sh
.venv/bin/python scripts/xrp_service_probe.py --address ADDRESS
.venv/bin/python scripts/xrp_motor_check.py --address ADDRESS
```

Use the address printed by the provisioner. No separate network mode or setup
sequence is required.

## Remaining floor-dependent work

The prior release validated stationary sensors, Wi-Fi, the complete physical
project path, raised-wheel motors, and encoders. After the short release
repetition above, the remaining work requires the final course surface:

1. measure wheel-speed response, effective wheel diameter and track width, and
   stopping distance;
2. compare moving IMU and range observations with the simulator; and
3. run the five complete challenges in their course arenas.

Use those measurements to refine `robot_config.py` and the simulator's
comparison envelopes. No additional network mode, student handoff, or browser
workflow is needed.
