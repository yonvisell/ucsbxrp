# Remaining XRP hardware and network setup

This document separates the work that is safe to do now from later sessions
that require motor power or a change of Wi-Fi network. It applies to the
current SparkFun XRP Controller with RP2350. It does not authorize motor
motion.

## Current verified state

| Item | Current state |
| --- | --- |
| Controller | Current SparkFun XRP Controller with RP2350; expected USB VID/PID `0x1B4F:0x0046` |
| Firmware | Board-specific `SPARKFUN_XRP_CONTROLLER` MicroPython 1.28.0 image verified and installed |
| MicroPython ABI | `_mpy == 7942` observed on the controller |
| XRPLib | XRPLib 2026.07.1 installed from the pinned release |
| Course release | Development release `2026.07-dev.2` |
| Course package | All eight canonical `ucsb_xrp` source-file hashes installed on the controller matched the host release; aggregate source SHA-256 `78637b538e41b1d7ed90f6511cba9376dcedbe5edc480048bcb97492336a1b0f` |
| Reference bytecode | Both exact Challenge 1 `.mpy` artifacts imported and passed the public contract vector on the RP2350 and browser MicroPython |
| Challenge 1 starter | The exact five-file starter ran over USB with physical XRPLib while motion-locked; calculated efforts remained zero and `finally` cleanup completed |
| USB | macOS permission granted; the MicroPython serial device and REPL have worked |
| H0 | Passed: controller identity, original firmware, selected firmware, and flash transition are recorded |
| H1 software checks | Imports, filesystem, soft-reset recovery, status LED command, released USER-button input, IMU, rangefinder, encoders, course-package import, and zero-effort cleanup passed |
| H1 isolation gate | **Not yet closed:** SW1 off, MOT LED off, and near-zero VIN were not recorded together |
| Motor motion | Not tested; no nonzero effort has been issued |
| Local offline application | Production offline loading is implemented and verified locally at both `/` and the deployment-style `/course-tools/` base path |
| RM2 and physical browser path | Not tested |
| Robot supervisory service | Not implemented or installed; physical-target controls correctly remain unavailable in the IDE |

The detailed records are
[the original USB baseline](hardware/2026-07-31-rp2350-usb-baseline.json),
[the post-flash H1 record](hardware/2026-07-31-rp2350-micropython-h1.json),
[the motion-locked course-example record](hardware/2026-07-31-rp2350-course-example-h1.json),
and
[the Challenge 1 package, bytecode, and starter record](hardware/2026-07-31-rp2350-challenge-one-h1.json).
These records are append-only; a new hardware session creates a new record
rather than editing an earlier observation.

For release `2026.07-dev.2`, the two verified physical reference artifacts are:

- `/lib/ucsb_xrp_reference/__init__.mpy`: SHA-256
  `f889f432acdacc96a7d0bb0ddcea220fd4d2415a24f5cb4c07c5faad31978696`;
  and
- `/lib/ucsb_xrp_reference/challenge_1.mpy`: SHA-256
  `6dfceb6b927d3155fc0d290bda80687da7600b18cb3f22394514fc99ec331ca3`.

Those same ordinary-bytecode artifacts passed the public Challenge 1 contract
vector on browser MicroPython and the physical RP2350. The physical reference
probe accessed no hardware and issued no motor effort.

## 1. Immediate session: close the H1 motor-rail isolation gate

H1 is a USB, non-motion acceptance tier. Its permitted motor-effort set is
exactly `{0.0}`. The battery being disconnected is not sufficient: USB-C can
feed the RP2350 board's motor-driver VIN rail while SW1 is on.

### Physical preparation

1. Leave the battery pack disconnected.
2. Put the board power switch, SW1, in the **off** position.
3. Connect USB-C. The RP2350 should remain available through its independent
   system-power path.
4. Visually confirm that the **MOT** LED is off.
5. Confirm that the PWR MOT indicator jumper has not been removed or moved to
   defeat the LED. That jumper controls the indicator; it does not disconnect
   the motor rail. If the indicator cannot be trusted, stop and treat the rail
   as energized until it is restored or independently measured.
6. Keep the robot supported with the wheels clear, even though this session is
   zero-only. Keep SW1 and the USB connector accessible.

Use the following wording to hand the physical confirmation to the person
running the probe:

> H1 physical gate: battery disconnected; SW1 off; MOT LED visibly off; PWR MOT
> indicator present; USB-C attached; wheels clear. No motor motion is
> authorized.

### Exact repository commands

From Terminal:

```sh
cd /Users/yon/Documents/Coursemobilerobotics
.venv/bin/python scripts/xrp_hardware.py probe
```

The read-only probe must report exactly one controller with the expected
VID/PID and `runtime_classification` equal to `micropython-usb-device`. If it
reports no controller, more than one candidate, a bootloader volume, or a
different runtime, stop rather than guessing a port.

Before running the gate, a reviewer must select and document a numerical
corrected-VIN limit that means near zero for this board and measurement path.
The repository does not silently choose that engineering criterion. The
wrapper rejects limits above 1.0 V, but 1.0 V is a hard ceiling rather than a
recommended value. Select the actual lower limit only after reviewing the
switch-off condition, voltage-divider interpretation, and expected measurement
uncertainty.

Then use the exact port reported by the read-only probe, the reviewed limit,
and a new evidence filename in this invocation:

```sh
.venv/bin/python scripts/h1_power_gate.py \
  --port <exact-port-from-probe> \
  --maximum-vin-v <reviewed-near-zero-limit-volts> \
  --output docs/hardware/<new-date>-rp2350-h1-power-gate.json \
  --confirm-battery-disconnected \
  --confirm-switch-off \
  --confirm-mot-led-off \
  --confirm-mot-led-circuit-intact
```

The angle-bracketed values are required session evidence, not defaults to copy
literally. `scripts/h1_power_gate.py` requires every fresh physical
confirmation, invokes only the repository's zero-effort device probe, uses the
exact selected port, and refuses to overwrite an existing evidence file. The
device probe requests zero effort before peripheral checks, repeats zero in
`finally`, and contains no nonzero motor command. Do not substitute XRPLib's
upstream installation check: that program progresses to motor and servo
motion.

The H1 isolation gate closes only when all of the following agree in the same
session:

- the human confirmation says SW1 is off;
- the human confirmation says the MOT LED is off and its indicator jumper is
  present;
- `board.state` is `pass`;
- `board.value.motor_supply_detected` is `false`;
- `board.value.vin_nominal_corrected_v` is clearly consistent with a
  de-energized, near-zero rail, rather than merely below XRPLib's 4.272 V
  `are_motors_powered()` threshold; and
- both `encoders_and_zero_effort` and `final_zero_effort` pass.

The wrapper records the threshold, four human confirmations, exact probe
result, probe and wrapper hashes, timestamp, selected port, and the fact that
the harness cannot issue nonzero effort. It reports `pass` only when all gate
conditions agree. It still requires an actual reviewed limit on the command
line; do not silently infer a pass from `motor_supply_detected == false` alone.

If the switch, LED, and reported VIN disagree, the result is a failed-closed
H1 gate. Leave SW1 off, disconnect USB if inspection is needed, and inspect the
switch position, indicator jumper, and wiring. Do not proceed to H2.

The following regression probes are also zero-only. They are useful after a
course-package update but are not substitutes for the physical LED and VIN
gate:

```sh
.venv/bin/mpremote connect <exact-port-from-probe> run scripts/device_runtime_probe.py
.venv/bin/mpremote connect <exact-port-from-probe> run scripts/device_ucsb_xrp_probe.py
```

A prompted capture should later confirm a physical USER-button transition and
manual rotation of each encoder with SW1 off. The current one-shot H1 probe
only established that those inputs were readable; it should not require a
student to race a command by pressing or turning something at an unspecified
instant.

## 2. Later session: H2 raised-wheel motor acceptance

Do not perform H2 until the repository contains a reviewed H2 harness with an
explicit motion gate, hard effort and duration limits, guaranteed zero cleanup,
and structured evidence output. There is no such command in the repository at
present, so there is intentionally no motor command in this document.

### Prerequisites

- H1 has a complete passing record from the same controller.
- The exact firmware, XRPLib version, course release, harness revision, and
  controller identity hash are known before power is enabled.
- The chassis is fixed on a stable stand; both driven wheels and the caster are
  clear of the table and cannot contact cables, clothing, or tools.
- The USB cable has strain relief and cannot enter a wheel.
- One person remains beside the robot with direct access to SW1 for the entire
  test.
- The intended motor-power source and wiring are inspected and recorded. The
  presence of USB-fed VIN is evidence of an energized rail, not authorization
  to use it as the test supply.
- The user gives fresh, session-specific authorization after seeing the setup.

Suggested authorization wording is:

> H2 physical gate: the robot is secured, both driven wheels are clear, SW1 is
> accessible, wiring and the intended power source have been checked, and I
> authorize the reviewed bounded raised-wheel motor test for this session.

### Required H2 sequence

The eventual harness must begin with an acknowledged zero command, exercise
one wheel at a time at low bounded effort for a hard bounded duration, return
to zero in `finally`, and independently reset on timeout. The acceptance
record must establish:

- left and right motor identity and forward sign;
- left and right encoder identity and sign;
- measured response to zero after each bounded interval;
- zero convergence after an exception, client disconnect, and watchdog expiry;
- no command beyond the declared effort or duration bound; and
- SW1 off and MOT LED off at the end of the session.

Only after H2 passes on the same release should H3 floor calibration begin.
H3 determines start effort, speed-to-effort response, effective wheel diameter,
effective track width, repeatability, and challenge behavior; nominal catalog
values are not substitutes for those measurements.

## 3. Work that does not require motor power or the XRP Wi-Fi network

The following work can continue with the current USB connection and ordinary
internet Wi-Fi:

- pure Python and MicroPython contract tests;
- reference-source and bytecode parity;
- deterministic virtual-XRP development;
- IDE and XRP Monitor project, telemetry, recording, and accessibility work;
- device-service implementation and USB installation;
- no-motion package imports, sensor reads, reset recovery, and exact-file hash
  checks; and
- production offline-shell build and browser tests.

The production offline shell is now implemented and locally verified at both
the root base path `/` and the deployment-style base path `/course-tools/`.
Those tests cover the IDE, XRP Monitor, guide, workers, MicroPython WebAssembly
runtime, current course bundle, visible `offline ready` state, offline reload,
and a motion-locked virtual Challenge 1 run. This is strong local application
evidence, but it is not evidence for the deployed HTTPS origin, RM2 transport,
or physical supervisory service.

The full current software check is:

```sh
cd /Users/yon/Documents/Coursemobilerobotics
nvm use
npm run check
```

The narrower offline checks are:

```sh
npm run build
npm run test:offline
npm run test:browser
```

These commands test the built application and stable-Chrome workflows. They do
not establish the physical RM2 transport or the deployed HTTPS permission path.

## 4. Robot-side service required before an RM2 session

Changing the Mac to the XRP network is not useful yet. The robot currently has
MicroPython, XRPLib, and the course library, but it does **not** have the private
supervisory service required by the browser applications. USB-C currently
provides serial/filesystem access; it does not expose the planned ordinary
browser target transport.

Before asking the user to change networks, the implementation must provide and
verify over USB:

1. a private service package separate from the student-facing `ucsb_xrp` API;
2. stable robot identity plus protocol, firmware, and course-release capability
   discovery;
3. correlated request IDs, bounded timeouts, and explicit success or structured
   failure replies;
4. atomic whole-project staging and commit so an interrupted transfer preserves
   the previous runnable project;
5. separate validate, synchronize, start, idempotent stop, and reset operations;
6. typed telemetry/catalog, logs, events, sequence numbers, and timestamps;
7. an independent lease/watchdog that converges motor commands to zero after
   owner loss, disconnect, reset, exception, or a non-yielding student program;
8. boot and soft-reset recovery; and
9. a protocol-conformance suite shared with the virtual target.

Physical-target controls should remain hidden until these properties receive
real target replies. A WebSocket transmission by itself is not evidence that a
command succeeded.

## 5. Deployed-HTTPS gate before joining the XRP network

The production application already passes local offline tests at `/` and
`/course-tools/`. The RM2 access point may have no internet route, so the same
release must still pass from its actual deployed HTTPS origin. Complete this
sequence while the Mac has ordinary internet access:

1. Build and test the exact release that will be used in the session.
2. Deploy that release at the supported HTTPS course origin.
3. In the same Chrome profile intended for the robot session, open the IDE,
   XRP Monitor, and guide once while online.
4. Require the visible `offline ready` application state, which confirms that
   the complete shell, workers, MicroPython WebAssembly runtime, and current
   course bundle are cached.
5. Reload the IDE, Monitor, guide, worker/runtime path, and course bundle with
   network access disabled, then run a virtual project. Restore network access
   and record the release/cache identity that passed.

A localhost preview is useful for development but does not replace acceptance
from the deployed HTTPS origin that will request access to the robot's local
network.

## 6. Bounded RM2, browser-permission, and physical-target session

Run this only after both the robot-side service and the deployed offline gate
pass.

1. Keep USB-C connected if it is useful for independent diagnostics. Leave
   motor motion unauthorized; use a motion-locked project for the initial
   network acceptance.
2. Open the deployed HTTPS IDE while the Mac is still online and confirm its
   offline/course-release state.
3. Join the robot access point in macOS Wi-Fi settings using credentials kept
   privately by the instructor. Do not paste a password or unique network name
   into source files, issue logs, evidence JSON, screenshots, or chat.
4. Return to Chrome and use the IDE's explicit **Connect to physical XRP**
   action. Do not enter a raw port or address in the normal student workflow.
5. Allow Local Network Access for this course origin when Chrome asks. If a
   previous denial suppresses the prompt, use the site's Chrome permissions to
   allow local-network access; if macOS also lists Google Chrome under **System
   Settings > Privacy & Security > Local Network**, enable it there, then
   reload the deployed page and click Connect again. Do not disable the macOS
   firewall or browser security features.
6. Verify identity, capability and release discovery before transferring any
   project. A mismatch must produce a legible repair action, not an automatic
   flash or downgrade.
7. Exercise, in order, a no-motion round trip, atomic project synchronization,
   run, idempotent stop, reset, telemetry, deliberate reconnect, and recovery
   from a lost browser connection. Every operation requires its correlated
   reply and visible final state.
8. Record the denied-permission, wrong-network, absent-robot, version-mismatch,
   interrupted-transfer, and reconnect outcomes without recording private
   network identifiers.
9. Stop the target, confirm its final state, then reconnect the Mac to its
   ordinary network.

If uninterrupted internet is essential during this session, Ethernet or a
second network adapter may preserve an internet route while the built-in Wi-Fi
joins the robot access point. That is optional and must not change the target
protocol. The present USB connection is not a substitute network interface.

## 7. Computer and browser preparation

- Use the repository's Node.js 24.17.0 (`nvm use`) for local builds and the
  installed stable Google Chrome for browser acceptance.
- USB serial permission has already worked. If macOS asks again after a device
  re-enumeration, allow the MicroPython controller and rerun the read-only
  probe; do not assume its device pathname is permanent.
- Use the same Chrome profile for online cache preparation and the later
  offline/RM2 session because service-worker storage and site permissions are
  profile-specific.
- Grant only the deployed course origin's Local Network Access request. Camera,
  microphone, location, and broad filesystem permissions are not required for
  robot transport.
- A local working-folder permission is independent of robot/network access and
  may need to be selected again after a browser restart.
- Do not manually weaken mixed-content, certificate, or firewall policy. If the
  deployed HTTPS page cannot reach the service under normal Chromium rules,
  treat that as a transport-design failure and revise the implementation.

## 8. Exact checklist for the next continuation

### User actions now

- Keep the battery disconnected and do not enable motor power for testing.
- When ready to close H1, set SW1 off, confirm the MOT LED and its indicator
  jumper as described above, leave USB-C connected, and provide the H1 physical
  gate statement.
- Keep the Mac on its ordinary Wi-Fi. Do not join the robot access point yet.
- Do not run XRPLib's installation-check example or change
  `RobotConfig.max_effort` to enable motion.

### Work the implementation can perform after that confirmation

- run the exact H0/H1 zero-only probes and write a new append-only evidence
  record;
- complete remaining software/library/simulator/IDE/Monitor slices over the
  current USB and internet connections;
- implement, test, and install the private supervisory service over USB;
- complete production offline and deployed-HTTPS checks; and
- report the exact release and evidence state before requesting any new
  physical authorization.

### User actions requested only later

- For H2, place the XRP on a stable raised-wheel stand and give the explicit
  session-specific H2 authorization only after reviewing the completed harness.
- For RM2, keep the private robot-network credentials available, confirm the
  deployed app reports offline readiness, and be ready to switch the Mac's
  Wi-Fi temporarily.
- For H3, provide an open marked floor area only after H2 passes on the same
  hardware and release.

The governing safety tiers and acceptance matrix are in
[the validation plan](VALIDATION_PLAN.md); the implementation dependencies are
in [the staged plan](../IMPLEMENTATION_PLAN.md); and the latest demonstrated
boundary is in [project status](../STATUS.md).
