# Physical XRP firmware

The development release pins a UCSBXRP-derived ARM build of MicroPython
**1.29.0** for the **SparkFun XRP Controller (RP2350)**. It adds the reviewed
cooperative garbage-collection port patch and a frozen build identity to the
upstream board build. The native stationary matrices **passed** for the exact
firmware and course runtime below. The final clean WPI → UCSBXRP native Chrome
commissioning, battery-only wireless, Run/Stop and recording reopening also
**passed**.
[NATIVE_QUALIFICATION.json](../../../docs/firmware/NATIVE_QUALIFICATION.json)
records the measured scope and limitations; motion and native Windows have not
been qualified.

## Exact derived image

- File: `UCSBXRP_SPARKFUN_XRP_CONTROLLER-20260930-v1.29.0-gcsync1.uf2`
- Bytes: `1789952`
- SHA-256: `8512b307d1043bccd9fbff7a5cc203d2c68451a6673b51126e3e4996556d177a`
- Git blob SHA-1: `48df9fa8dcafa2cb06aa36bff8070119cc1d3566`
- Frozen `ucsb_firmware.build_id`: `ucsbxrp-rp2350-1.29.0-gcsync-20260930.1`
- Upstream MicroPython commit: `0fd6c573ea815774668bbb16b8e197c8822368b2`
- Exact 12-file patch SHA-256: `a100318739c5d9eeaa7365d8a901b2c38b9ea7e90b5d2689785616cafa62e1ff`
- Qualified course runtime manifest SHA-256: `8671b0de9cef4da79ad1805f862f0646caa631eda40fa5c240f69a8cd294ed8c`

[../release.json](../release.json) records the current build pin. The stationary
acceptance applies to these exact firmware bytes with the recorded runtime,
automatic GC enabled, and a 150 MHz clock. Preserve their identities when
integrating this configuration;
renaming or rebuilding creates a different artifact.

## Source and reproducible build

[Build provenance](../../../docs/firmware/BUILD_PROVENANCE.md) records the exact
MicroPython/dependency/toolchain pins, upstream frozen manifest, epoch, warning
policy, source hashes, controls and withdrawn experiments. The
[recipe](../../../scripts/firmware/recipe.json),
[helper](../../../scripts/firmware/build.py) and
[port patch](../../../scripts/firmware/gcsync-port.patch) provide read-only input,
patch, compiled-macro and UF2/BIN verification, plus an explicit isolated build
command. A rebuilt image must match the preserved UF2/BIN bytes to retain that
artifact identity; matching bytes alone do not establish native qualification.

The configuration retains no GIL, the stock pending-callback yield, 150 MHz
clock, USB `1B4F:0046`, CYW43/Wi-Fi/Bluetooth, PSRAM and the upstream board
manifest. Only the frozen identity module extends that manifest. GCC 15's
array-bounds warnings remain visible, with fatality relaxed only for the pinned
mbedTLS `aes.c` and `gcm.c`. No overclock is used.

Flash remains 16 MiB, with filesystem storage starting at `0x10180000`.
Image program blocks end at `0x100da700`. These verified image boundaries
preserve the filesystem layout; they do not replace migration backup or
readback validation. The standard ignored RP2350-E10 preamble is retained.

The complete, byte-for-byte upstream
[MicroPython license](../../licenses/MicroPython-v1.29.0-LICENSE.txt) includes its
MIT notice and third-party source-license summary.
[Upstream notices](../../../docs/firmware/UPSTREAM_NOTICES.md) identifies the
pinned constituent licenses and source repositories. The full, byte-exact
[native component notices](../../licenses/firmware/README.md) include BTstack,
CYW43, lwIP, mbedTLS, TinyUSB, Pico SDK and frozen micropython-lib texts, with
source paths and hashes. Their terms and notices remain applicable to the
combined firmware.

## Qualification boundary

The `.2` timed-mutex experiment was withdrawn after a failed next Run following
an allocating-loop Stop fallback reset. This release pin retains the original
`.1` image. The current service uses a nonblocking persistent-worker idle wake
wait with `PROJECT_WORKER_IDLE_MS = 5` and shutdown checks, 8 KiB log pages
with tail metadata, and native string scanning for JSON admission. Its passed
stationary matrix includes the unchanged four 50-step runs and 300-step run
with complete telemetry and no sequence gaps; closure/function and 2 MiB
PSRAM/SRAM sentinel stress; 16 explicit collections from each core with zero
rendezvous failures; cooperative and sleep-heavy Stop; allocating/blocked Stop
fallback and next Run; idle/active interpreter soft reboot and next Run; NIST
AES vectors and LAN TLS 1.2 AES-GCM; and CPU calculation with and without
telemetry polling.

The four unchanged short runs averaged **23.344997 ms**, versus the preserved
stock mean of **23.65 ms**: **−1.29%** elapsed interval, within the user's 5%
slowdown limit for this measured stationary workload. The course comparison
uses the original harness/project. It is descriptive rather than randomized
alternation; CPU diagnostic host revisions differ. It does not establish a
motion timing result. The large sentinel stress used a 5 s request deadline
and 120 s execution window; ordinary tests retained their 2 s request deadline.

After verified erase, the actual WPI editor has installed
**MicroPython 1.25.0-preview.beta06, XRPLib 2.1.3, BLE and phew**. The native
Chrome app created a fresh master and `xrp-working-02`, transferred the exact
course firmware, reinspected its identity, read-verified 64 installed files and
completed battery-only class Wi-Fi verification. Native stationary completed
runs retained 302 observations each; Stop finalized 1,053 observations. The
native saved-trial UI reopened both after browser reload, and CSV export
preserved all 1,053 stopped-run rows. Sequences were contiguous with zero drive
commands and zero reported telemetry/output drops. This reconstruction does
not establish an undocumented factory-shipped image.

The exact initiating corruption remains unobserved. One fresh-restart Wi-Fi
readiness timeout was retained; a subsequent restart recovered without file or
configuration changes. Exact Mac browser evidence is in the dated
[native qualification record](../../../docs/firmware/NATIVE_QUALIFICATION.json).
Concurrent `WLAN.scan()` during an active program and Python `hard=True` IRQ
callbacks remain unsupported. No motor-motion or Windows qualification is
claimed here. The September 18 direct-USB tests of unmodified upstream images
are historical evidence for those configurations.

The original official file
`SPARKFUN_XRP_CONTROLLER-20260824-v1.29.0.uf2` remains a comparison reference.
[Official board downloads](https://micropython.org/download/SPARKFUN_XRP_CONTROLLER/)
describe that upstream firmware; the derived image above is identified by its
own source recipe, patch, marker and checksum.

## Official recovery eraser

`nuke_universal.uf2` is an unmodified Raspberry Pi
[official prebuilt](https://github.com/raspberrypi/pico-sdk-prebuilts/releases/tag/v2.3.1-0).
It is `114688` bytes, with SHA-256
`f3c3b6a62d2d7e944f336bc2ec73393f00adfbb56b6fa7440ba7ee3d5ad5b49d`.
Its attribution, source-announcement boundary and bundled
[Raspberry Pi BSD notice](../../licenses/Pico-SDK-BSD-3-Clause-LICENSE.txt) are
recorded in [upstream notices](../../../docs/firmware/UPSTREAM_NOTICES.md).
It erases flash, including saved robot files and configuration; it is a
separate recovery asset, not the derived MicroPython firmware.
