# RP2350 firmware recipe and provenance

The development release selects the exact tested image
`ucsbxrp-rp2350-1.29.0-gcsync-net-20261105.1`.
[NATIVE_NET_QUALIFICATION.json](NATIVE_NET_QUALIFICATION.json) records its bounded
stationary backpressure test and the normal-course 220 mm/s arena route on one
robot. Native Windows and repeatability across robots remain unqualified.
This is a local source checkpoint. Final app build, offline output verification
and browser verification remain pending; the overall revision is not accepted
and no publication has occurred.

| Preserved reference | UF2 bytes | UF2 SHA256 |
|---|---:|---|
| Stock control, `control-20260930.1` | 1,786,880 | `e816533312f25faa59a6c826d830a66866de354dbc54200b89dc989d1e6eb26d` |
| Prior accepted `gcsync-20260930.1` | 1,789,952 | `8512b307d1043bccd9fbff7a5cc203d2c68451a6673b51126e3e4996556d177a` |
| Current `gcsync-net-20261105.1` | 1,789,952 | `bbb7f832c65e2aa8c8973037767053c1411c612ade0b1bc676e213d2c99c8587` |

The prior accepted image remains in the repository. Its broader historical
stationary, cryptographic and clean-WPI Mac commissioning evidence remains in
[NATIVE_QUALIFICATION.json](NATIVE_QUALIFICATION.json); those tests were not all
repeated on the network image. The withdrawn GC-sync `.2` timed-mutex experiment
is not used. [HISTORICAL_DIAGNOSTIC.md](HISTORICAL_DIAGNOSTIC.md) preserves its
failure and the earlier acceptance record.

## Exact inputs and changes

[recipe.json](../../scripts/firmware/recipe.json) records all three UF2/BIN/ELF/map
identities, 13 source-file hashes for each complete state, compiled settings,
Picotool identity and dependency pins. UF2/BIN equality identifies the accepted
artifact; ELF/map debug paths may differ between builds.

- MicroPython v1.29.0: `0fd6c573ea815774668bbb16b8e197c8822368b2`.
- Pico SDK: `98a542c1a62fb549ffb5d66a3e5892b06276b670`; the seven direct relevant
  submodules and nested mbedTLS/framework use their recorded gitlinks.
- ARM GNU 15.3.rel1, GCC 15.3.1; CMake 3.28.3; Picotool
  `6f6458d792b93685a11423b244a585eaa99eafcf`. The macOS ARM64 toolchain package,
  preserved Picotool executable and CMake CONFIG files retain recorded hashes.
- `SOURCE_DATE_EPOCH=1787579045`, `MICROPY_GIT_TAG=v1.29.0`,
  `MICROPY_GIT_HASH=0fd6c573ea`, `SPARKFUN_XRP_CONTROLLER`, `MinSizeRel`.
- The complete upstream frozen manifest is extended only by
  `ucsb_firmware.build_id`; the literal tested marker is unchanged.

[gcsync-port.patch](../../scripts/firmware/gcsync-port.patch) is the unchanged
12-file accepted port patch, SHA256
`a100318739c5d9eeaa7365d8a901b2c38b9ea7e90b5d2689785616cafa62e1ff`.
It provides cooperative GC rendezvous while retaining no GIL and the stock
pending-callback yield. Peer roots, VM/native waits, lifecycle, PendSV/IRQ and
flash boundaries participate. The service's persistent worker uses nonblocking
idle wake acquisition and a 5 ms sleep; that runtime behavior is qualified
separately from the native marker.

[lwip-nonblocking-send.patch](../../scripts/firmware/lwip-nonblocking-send.patch)
changes only `extmod/modlwip.c`, SHA256
`09df5d3550b90d623601514e6b77aa470c57d920065f7724f126d27a263c5658`.
A nonblocking `tcp_write` allocation failure returns EAGAIN with no accepted
bytes, instead of entering up to 200 synchronous 50 ms waits. Blocking retry
exhaustion retains ERR_MEM instead of reporting unsent bytes as accepted after
an unrelated successful `tcp_output`. The extracted native C tests exercise
these failures, ordered later retry, partial writes, blocking recovery and
terminal errors. They establish send semantics, not the initiating cause of
any earlier hardware incident. Existing post-enqueue output-error accounting
is outside this patch.

The exact current image was built in an isolated candidate tree before
promotion; its private build record hashes the applied patches, helper snapshot
and all 13 native sources. That record's experimental qualification wording is
historical. The separate qualification record below records later hardware
results. Promotion copies the tested UF2 bytes; it does not rebuild or rename
the frozen marker. The maintained helper now reproduces the candidate source
state and verifies its exact artifact, but has not yet completed a fresh
end-to-end rebuild of this variant.

[compiler-compat.cmake](../../scripts/firmware/compiler-compat.cmake) leaves GCC
array-bounds warnings visible, relaxing fatality only for pinned mbedTLS `aes.c`
and `gcm.c`. No algorithm or optimization changes. The original build retained
seven such warnings. Board configuration remains 150 MHz, USB `1B4F:0046`,
CYW43/Wi-Fi/Bluetooth, PSRAM on GPIO 47, ARM RP2350 and upstream stack defaults.
Flash is 16 MiB; filesystem start is `0x10180000`. Current UF2 program blocks
end at `0x100da700`, with the standard ignored RP2350-E10 preamble. These are
layout checks, not a substitute for backup/readback during installation.

## Verification and explicit rebuild

```sh
python3 scripts/firmware/build.py check-inputs \
  --source /path/to/isolated/micropython-v1.29.0 \
  --toolchain /path/to/extracted/arm-toolchain \
  --picotool-root /path/to/picotool-root --cmake /path/to/cmake
python3 scripts/firmware/build.py verify-patch --source /path/to/micropython
python3 scripts/firmware/build.py verify-macros --variant gcsync-net \
  --macros /path/to/preserved/compiled-macros.txt
python3 scripts/firmware/build.py verify-artifacts --variant gcsync-net \
  --uf2 /path/to/preserved/firmware.uf2 --bin /path/to/preserved/firmware.bin
python3 -m unittest discover -s scripts/firmware -p 'test_*.py'
```

Input verification requires the pinned commit/epoch, clean dependency HEADs and
gitlinks, toolchain identity, exact owned source states and patch applicability.
It accepts complete `stock`, `gcsync` or `gcsync-net` states; partial or unrelated
changes fail. Both patches are hashed and applied from the same captured bytes.
Add `--toolchain-package /path/to/official.pkg` to check the original package.

```sh
python3 scripts/firmware/build.py build \
  --source /path/to/isolated/micropython-v1.29.0 \
  --toolchain /path/to/extracted/arm-toolchain \
  --picotool-root /path/to/picotool-root --cmake /path/to/cmake \
  --output /path/to/new-output --variant gcsync-net
```

An explicit build uses a new output directory, preserves first-failure logs,
disables Git network fetches and restores the initial source selection. It
checks compiled macros and exact UF2/BIN equality. `gcsync-net` is the default;
`stock` and `gcsync` retain the old controls; `both` still means those two old
controls. Different UF2/BIN bytes fail the reference gate and require separate
qualification. The helper performs no flashing, device control or publication.

## Runtime and adoption boundary

The qualified installed dev94 runtime is `ef032161…`. The promoted runtime
manifest is `a6b19643…`: every file has identical bytes; only
`minimumRobotReleaseSequence` changes from 85 to 94. The installed sequence 94
and exact native marker satisfy the browser checks, so this metadata change
requires no reflash or runtime reinstall. Future Setup installs the new
manifest. The full hashes and evidence identities are in
[NATIVE_NET_QUALIFICATION.json](NATIVE_NET_QUALIFICATION.json).

Physical evidence applies to the tested robot, network and bounded reader pause;
it does not establish unlimited backpressure tolerance or universal wheel
coefficients. The 220 mm/s route used private robot-specific tuning. Concurrent
`WLAN.scan()` with an active worker, arbitrary blocking native extensions and
Python `hard=True` IRQ callbacks remain unsupported. Automatic GC stays enabled.

[Upstream sources and notices](UPSTREAM_NOTICES.md), the complete
[MicroPython license](../../vendor/licenses/MicroPython-v1.29.0-LICENSE.txt) and
[component texts](../../vendor/licenses/firmware/README.md) retain their exact
upstream bytes and source attribution. Their terms remain applicable to the
combined image; the TCP patch changes no dependency or license selection.
