# Physical XRP firmware

The unpublished dev94 release selects MicroPython 1.29.0 for the SparkFun XRP
Controller (RP2350), with the accepted cooperative GC port and a narrow TCP
nonblocking-send repair. The exact tested UF2 is copied without rebuilding.
This is a local source checkpoint: final app build and browser verification
remain pending, and the overall revision is not accepted.

- File: `UCSBXRP_SPARKFUN_XRP_CONTROLLER-20261105-v1.29.0-gcsync-net1.uf2`
- Bytes: `1789952`
- SHA256: `bbb7f832c65e2aa8c8973037767053c1411c612ade0b1bc676e213d2c99c8587`
- Git blob SHA1: `f5e03efb3c2705a966555114ea4ee736648da619`
- Frozen build ID: `ucsbxrp-rp2350-1.29.0-gcsync-net-20261105.1`
- MicroPython commit: `0fd6c573ea815774668bbb16b8e197c8822368b2`

[NATIVE_NET_QUALIFICATION.json](../../../docs/firmware/NATIVE_NET_QUALIFICATION.json)
records repeated course starts, a bounded three-second paused reader with lease
and Stop recovery, and one normal-course five-goal arena pass at 220 mm/s with
independent camera confirmation. Automatic GC remains enabled. These tests
qualify the recorded robot/runtime/workload, not arbitrary network stalls,
universal motor coefficients or native Windows. The prior stationary and
clean-WPI Mac browser matrix was not wholly repeated on this new image.

The exact installed runtime `ef032161…` has the same file hashes as the newly
bundled `a6b19643…`; only minimum compatible robot sequence changes from 85 to
94. The installed dev94 runtime remains compatible without a reinstall.

## Sources and preserved references

[Build provenance](../../../docs/firmware/BUILD_PROVENANCE.md),
[recipe](../../../scripts/firmware/recipe.json) and
[helper](../../../scripts/firmware/build.py) retain dependency/toolchain pins,
source and artifact hashes, compiled settings and explicit isolated-build
commands. The unchanged
[GC patch](../../../scripts/firmware/gcsync-port.patch) is followed by the
[TCP patch](../../../scripts/firmware/lwip-nonblocking-send.patch). The latter
returns EAGAIN immediately when a nonblocking TCP enqueue lacks memory and
prevents false accepted-byte reports after blocking retry exhaustion.

The old accepted file
`UCSBXRP_SPARKFUN_XRP_CONTROLLER-20260930-v1.29.0-gcsync1.uf2` remains intact:
SHA256 `8512b307d1043bccd9fbff7a5cc203d2c68451a6673b51126e3e4996556d177a`,
build ID `ucsbxrp-rp2350-1.29.0-gcsync-20260930.1`. Its distinct historical
[NATIVE_QUALIFICATION.json](../../../docs/firmware/NATIVE_QUALIFICATION.json)
records the original stationary, crypto and clean-WPI Mac commissioning matrix.
The `.2` timed-mutex experiment remains withdrawn. The original official
`SPARKFUN_XRP_CONTROLLER-20260824-v1.29.0.uf2` is also retained as a reference.

The board retains 150 MHz, no GIL, upstream frozen modules, USB `1B4F:0046`,
CYW43/Wi-Fi/Bluetooth and PSRAM. Program blocks end at `0x100da700`, below the
unchanged filesystem start `0x10180000`. Identical artifact bytes preserve
identity; they do not qualify a different service or workload.

The complete [MicroPython license](../../licenses/MicroPython-v1.29.0-LICENSE.txt)
and [native component notices](../../licenses/firmware/README.md) remain
byte-for-byte upstream texts.
[Upstream notices](../../../docs/firmware/UPSTREAM_NOTICES.md) identifies their
pinned sources and applicable constituent terms.

## Official recovery eraser

`nuke_universal.uf2` is the unmodified Raspberry Pi
[official prebuilt](https://github.com/raspberrypi/pico-sdk-prebuilts/releases/tag/v2.3.1-0),
114688 bytes, SHA256
`f3c3b6a62d2d7e944f336bc2ec73393f00adfbb56b6fa7440ba7ee3d5ad5b49d`.
Its source attribution and
[BSD notice](../../licenses/Pico-SDK-BSD-3-Clause-LICENSE.txt) are preserved.
It erases flash, including saved files and configuration; it is a separate
recovery asset.
