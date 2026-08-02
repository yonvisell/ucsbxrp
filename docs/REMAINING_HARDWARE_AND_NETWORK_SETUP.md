# XRP setup and remaining physical work

This is the complete setup model for the current SparkFun XRP Controller with
RP2350. It replaces the earlier multi-tier checklist.

## Normal course setup

1. Connect the XRP to the instructor Mac by USB-C.
2. From this repository, run:

   ```sh
   .venv/bin/python scripts/provision_xrp.py
   ```

   It detects the board, reads the `Pink` password from the instructor details
   file without printing it, joins the network, installs or repairs the course
   library and connection service, verifies each copied file, and reports the
   robot name and LAN address.

   If the router reports `waiting_for_ip` instead of issuing a DHCP lease, use
   one known-free address on the same subnet. For the current `Pink` setup:

   ```sh
   .venv/bin/python scripts/provision_xrp.py \
     --static-address 192.168.7.30 --gateway 192.168.7.1
   ```
3. Open IDE Settings, enter the address printed by setup, and select
   **Physical XRP**. XRP Monitor uses the same saved target automatically.
4. Use **Validate code**, **Sync project**, and **Run on XRP**. Open **XRP
   Monitor** for telemetry, plots, logs, recordings, and the world view.

Wi-Fi credentials are read from a local instructor file during setup. They are
not copied into the repository, browser storage, logs, screenshots, or evidence
files. USB remains useful for firmware recovery; routine project work uses the
LAN shared by the Mac and robot.

## Current verified controller state

- SparkFun XRP Controller with RP2350, observed as USB VID/PID
  `0x1B4F:0x0046`.
- Board-specific MicroPython 1.28.0 firmware and XRPLib 2026.07.1 are installed.
- The USB REPL, filesystem, reset recovery, LED, released USER button, IMU,
  rangefinder, encoders, and zero motor output have been exercised.
- The canonical Challenge 1 package and supplied bytecode were hash-checked and
  executed on the controller.
- Detailed historical observations are retained under `docs/hardware/`.

## Resume the current development robot

The Mac and XRP use `Pink`; the XRP is configured at `192.168.7.30`. Pink
accepted the Wi-Fi association but did not issue a DHCP lease during the latest
repair, so setup retained that previously used address with gateway/DNS
`192.168.7.1`.

The current service build is already installed. The controller stopped
responding during the final repetition after the physical browser connection
lifecycle changed. Tap **RESET** once, or briefly disconnect and reconnect USB
power, then run:

```sh
.venv/bin/python scripts/xrp_service_probe.py --address 192.168.7.30
```

This performs the complete no-motion service lifecycle: browser preflight,
compile, transactional sync, run/output/telemetry, stop/restart, reset, and
reconnect. If the service does not return after the reset, repair it with:

```sh
.venv/bin/python scripts/provision_xrp.py \
  --static-address 192.168.7.30 --gateway 192.168.7.1
```

The final browser repetition then consists of selecting **Physical XRP** in
the IDE, validating and running Challenge 1, watching the same state in XRP
Monitor, and stopping from either app. No firmware, router, or credential
change is expected.

Raised-wheel motor and encoder response has already passed. It can be repeated
when calibration work resumes with:

```sh
.venv/bin/python scripts/xrp_motor_check.py --address 192.168.7.30
```

The check uses short 0.22-effort pulses, commands zero before and after every
pulse, and records both encoders. Floor motion and calibration runs remain
separate because those results depend on the final course surface and robot.

## If the robot is not found

1. Leave USB connected and rerun setup; it reports the current Wi-Fi state and
   corrects the saved network configuration.
2. Confirm that the Mac and robot are on the same network and that client
   isolation is not enabled on the access point.
3. Use the IP address printed by setup in the IDE's compact connection
   diagnostics. Students should not normally need this fallback.
4. If MicroPython does not enumerate, use the documented UF2 recovery path and
   rerun setup. Do not copy a firmware image to the normal `PICODISK` status
   volume.

## Work deferred until floor trials

The remaining physical work is wheel-speed calibration, effective wheel
diameter and track-width calibration, motion-induced IMU/range comparisons,
and full floor trials for the five challenges. Those measurements should update
`robot_config.py` and simulator comparison envelopes; they do not require a new
student workflow or a second network configuration.
