# Hardware evidence

This directory retains machine-readable observations from the attached
SparkFun XRP Controller with RP2350. Records are evidence of what one device did
with an exact software revision; they are not a checklist for students.

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
