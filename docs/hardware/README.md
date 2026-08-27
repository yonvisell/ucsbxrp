# Hardware evidence

`2026-08-26-dev28-integrated-repeatability.json` is the current attached-RP2350
record. It covers the dev.28 USB installation, retained Pink profile, automatic
Validate/Flash/Run after an IDE edit, immediate Stop and repeated Run, shared
IDE/Monitor output, motor and encoder telemetry, restoration of the default
project, and the complete 72-workflow browser gate. Hotspot coverage remains in
the earlier dev.15 record and must be repeated for the current release.

`2026-08-26-dev25-transaction-and-runtime.json` records the alternating runtime
activation transaction, explicit program-worker retirement before flash writes,
three immediate project cycles, and the independent raised-wheel motor probe.

`2026-08-26-dev22-release-and-repeatability.json` records coherent
page/manifest/device release identity, repeated USB repair, subsecond USB entry
from a running course service, Pink handoff, cross-runtime project identity,
two physical projects, encoder and motor telemetry, and the final zero-output
state.

`2026-08-25-dev15-comprehensive-validation.json` covers USB installation
readback, a reset in both network modes, an actual Mac join to the XRP hotspot,
Pink station operation, an elevated-wheel spiral run, telemetry batching, the
IDE/Monitor shared lifecycle, and the final zero-output state.

This directory retains machine-readable observations from the attached
SparkFun XRP Controller with RP2350. Records are evidence of what one device did
with an exact software revision; they are not a checklist for students.

`2026-08-21-dev11-browser-commissioning-validation.json` closes the complete
public Chrome workflow for release dev.11: retained course-folder permission,
Web Serial selection, no-change file readback, fresh-module runtime import,
Pink station activation, reset, local-network permission, service discovery,
automatic physical IDE handoff, project transfer, and stationary telemetry. It
also records the stale MicroPython module-cache defect exposed by the preceding
failed repair and the bounded correction in commit `13d1754`.

`2026-08-07-dev7-commissioning-repair-validation.json` records the attached
dev.7 changed-only install, no-change repetition, two deliberate one-file
repairs, verified direct-rename activation, final runtime imports, and reset.
It distinguishes those physical USB results from the still-uncompleted native
macOS folder-picker-to-Web-Serial sequence in the public wizard.

`2026-08-01-course-runtime-api-validation.json` records the UCSB-XRP 0.3
package/reference installation and the compile, sync, zero-drive run,
telemetry, stop, restart, and reset/reconnect lifecycle on the attached RP2350.
`2026-08-01-runtime-launch-regression.json` records the subsequent second-run
VM hang found by the two-app browser harness, the localized evidence, the
deferred-launch/quiet-window/watchdog correction, its complete software proof,
and the then-pending reset/install/repetition.

`2026-08-02-dev4-physical-browser-validation.json` closes that pending work.
It records the installed dev.4 service, strict zero-output lifecycle, passing
second Chrome launch, physical live-parameter update, final zero-command
telemetry, restored student demo, and the watchdog-safe USB repair correction
found during the same repetition.

`2026-08-02-dual-network-validation.json` records the default robot-hotspot
profile, Pink station profile, failed-station hotspot recovery, direct Chrome
IDE/Monitor connection, and a repeated zero-output service lifecycle on the
attached board. It also states the one remaining network-path boundary: Chrome
was not moved from Pink to the robot hotspot while this Codex session depended
on Pink.

The 2026-07-31 records preserve the original XRP-WPILib 2.1.0 identity, the
transition to the official board-specific MicroPython 1.28.0 firmware and
XRPLib 2026.07.1, early stationary sensor observations, and the initial
Challenge 1 source/bytecode checks. Their old tier terminology describes the
development sequence at the time and is superseded by the ordinary workflow in
the repository README.

`2026-08-01-rp2350-lan-and-raised-wheel.json` records the current LAN service
lifecycle and raised-wheel motor/encoder response, including the operator's
visual confirmation. Records omit Wi-Fi passwords, unredacted USB serials, and
other unique credentials.

`2026-08-01-rp2350-concurrency-regression.json` records the later zero-effort
dual-core telemetry stall, the evidence-bounded diagnosis, the corrected source
identities, and the first reset/retest. The separate
`2026-08-01-rp2350-concurrency-follow-up.json` records the installed final
service correction, two strict boot-aware lifecycle passes, the simultaneous
physical IDE/Monitor workflow, the later timeout, and the browser connection
teardown correction awaiting one post-reset device repeat. Both remain separate
from the earlier passing lifecycle and motor record.

The pinned firmware identity is recorded in `vendor/current/release.json`:

- board: `SPARKFUN_XRP_CONTROLLER`;
- asset: `SPARKFUN_XRP_CONTROLLER-20260406-v1.28.0.uf2`;
- MicroPython: 1.28.0;
- XRPLib: 2026.07.1.

`PICODISK` was the original XRP-WPILib status volume. Firmware was written only
to the temporary RP2350 bootloader volume, never to that normal status volume.
