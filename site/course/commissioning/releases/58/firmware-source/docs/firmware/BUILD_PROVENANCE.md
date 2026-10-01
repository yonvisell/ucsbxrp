Native stationary and clean-WPI Mac browser acceptance are recorded in [NATIVE_QUALIFICATION.json](NATIVE_QUALIFICATION.json). Native Windows and motion remain unqualified.

# RP2350 GC-sync candidate recipe and provenance

The exact `.1` GC-sync image passed stationary native qualification with the
current service's nonblocking idle wake checks, 8 KiB log pages and native
string scanning for JSON admission. The exact runtime and measurement limits
are recorded above. Final native Chrome clean-WPI commissioning, battery-only
wireless, Run/Stop and complete saved/reopened recordings passed. The recipe
identifies the image and build inputs; an unchanged
firmware checksum alone does not qualify a different service revision.

The earlier post-Stop timeout exposed retained-log serialization cost. USB
inspection interrupted watchdog feeding, so later inspection reboots did not
establish a reboot during that original timeout. The bounded log correction
passed native first-state and cursor-drain checks below the client's 1.5-second
initial-state deadline on the measured normal workload.

The image must retain `ucsbxrp-rp2350-1.29.0-gcsync-20260930.1`. Any future
accepted image must be copied from the exact qualified bytes and checksum,
with its original marker. Renaming the marker or rebuilding for cosmetic
reasons creates a different artifact requiring qualification.

| Reference | UF2 bytes | UF2 SHA256 |
|---|---:|---|
| Stock comparison control, `ucsbxrp-rp2350-1.29.0-control-20260930.1` | 1,786,880 | `e816533312f25faa59a6c826d830a66866de354dbc54200b89dc989d1e6eb26d` |
| GC-sync `.1`, stationary native qualification passed | 1,789,952 | `8512b307d1043bccd9fbff7a5cc203d2c68451a6673b51126e3e4996556d177a` |

The original stock reference is under
`outputs/revisions/2026-09-30-mac-first-setup/firmware-gil/stock/`. The exact GC
candidate, independent source checkout, reviewed patch, configure/build logs,
macro dump and source/artifact hashes are under
`outputs/revisions/2026-09-30-mac-first-setup/firmware-gcsync/build/`.
Its archived reviewed patch is also preserved in `firmware-gcsync/frozen-v2/`.
The rejected GIL experiment and withdrawn GC-sync `.2` build remain unchanged
local evidence.

The `.2` image (`575c329513b46d7469258ef23e41a480a46601dcd34405018d64bb12894e34f6`)
is withdrawn. The hardware owner captured a failed next Run after an
allocating-loop Stop fallback reset, with native GC rendezvous failures in
`gcsync2-standard-01/report.json` and `gcsync2-after-stop-native-stats.json` under
the dated revision outputs. Native review found that the pinned SDK deadline
path [waits before checking the deadline](https://github.com/raspberrypi/pico-sdk/blob/98a542c1a62fb549ffb5d66a3e5892b06276b670/src/common/pico_time/time.c#L480-L486).
Its nominal 1 ms timed mutex wait was therefore not accepted as a GC polling
bound. Earlier passing workloads do not qualify that failed recovery path.
The exact withdrawn source and artifacts remain in `firmware-gcsync/build-v2/`.

[recipe.json](../../scripts/firmware/recipe.json) records the UF2/BIN/ELF/map
hashes and sizes, exact pins, 12 base/candidate source hashes, compiled settings,
Picotool package identity and literal build IDs. UF2 and BIN byte equality
identify the preserved artifact; ELF/map debug paths may vary between builds.

## Exact inputs and changes

- MicroPython v1.29.0: `0fd6c573ea815774668bbb16b8e197c8822368b2`.
- Pico SDK: `98a542c1a62fb549ffb5d66a3e5892b06276b670`. Seven direct relevant
  submodules and nested mbedTLS/framework use the recorded gitlinks.
- Picotool: `6f6458d792b93685a11423b244a585eaa99eafcf`, with the exact preserved
  host binary and CMake CONFIG package hashes. The build imports this local
  package without fetching or rebuilding the shared host tool.
- ARM GNU 15.3.rel1, GCC 15.3.1; CMake 3.28.3. The original macOS ARM64 package
  SHA256 and official source URL remain in the recipe. It was extracted locally
  with `pkgutil --expand-full`, without system installation. Other host/compiler
  configurations have no claimed reference-build qualification.
- `SOURCE_DATE_EPOCH=1787579045`, `MICROPY_GIT_TAG=v1.29.0`, and
  `MICROPY_GIT_HASH=0fd6c573ea`.
- `SPARKFUN_XRP_CONTROLLER`, `MinSizeRel`, and the complete upstream board
  frozen manifest, extended only with a one-line `ucsb_firmware.build_id` module.

[gcsync-port.patch](../../scripts/firmware/gcsync-port.patch) is the exact
12-file reviewed patch used for `.1`; its SHA256 is
`a100318739c5d9eeaa7365d8a901b2c38b9ea7e90b5d2689785616cafa62e1ff`.
It adds a cooperative GC rendezvous while ordinary interpreter execution
retains no GIL. VM/native wait hooks, peer root parking, GC ownership, lifecycle,
PendSV/IRQ and flash boundaries participate. The stock pending-callback thread
yield is preserved. Ordinary contended mutex acquisition retains a native GC
polling loop. Persistent service-worker idle waits must use nonblocking wake
acquisition and `time.sleep_ms(PROJECT_WORKER_IDLE_MS)`, with
`PROJECT_WORKER_IDLE_MS = 5` and shutdown checks, to avoid holding that
native polling loop indefinitely while idle. That service behavior is qualified
separately; it is not encoded by the firmware marker.

[compiler-compat.cmake](../../scripts/firmware/compiler-compat.cmake) retains
the original source-relative warning policy. GCC 15 array-bounds diagnostics
remain visible; `-Wno-error=array-bounds` applies only to the pinned mbedTLS
`aes.c` and `gcm.c`. It changes warning fatality without changing algorithms or
optimization. The `.1` compile retained seven such warnings; no GC-sync source
warnings appeared. Compilation alone does not resolve these diagnostics;
retain AES/TLS smoke qualification for any accepted firmware.

Recorded compiled checks preserve 150 MHz clock configuration, no GIL, stock
callback yield, USB `1B4F:0046`, CYW43/Wi-Fi/Bluetooth, PSRAM on GPIO 47, ARM
RP2350, disabled weakrefs, GPIO and stack defaults. Flash remains 16 MiB and
filesystem storage 15,204,352 bytes. Candidate UF2 program blocks end at
`0x100da700`, below the existing filesystem start `0x10180000`. The standard
ignored RP2350-E10 preamble matches the official reference. These are static
configuration/layout checks, not proof of actual runtime recovery.

## Read-only maintainer checks

Use an isolated pinned MicroPython checkout with all eight recorded dependency
gitlinks initialized, the extracted ARM toolchain and the pinned Picotool root
containing `picotool-src` and its installed `picotool` CONFIG package. Acquire
dependencies separately. These explicit paths do not depend on a user's CWD.

```sh
python3 scripts/firmware/build.py check-inputs \
  --source /path/to/micropython-v1.29.0 \
  --toolchain /path/to/extracted/arm-toolchain \
  --picotool-root /path/to/picotool-root \
  --cmake /path/to/cmake
```

This checks the main commit/epoch, full source ownership, exact patch
applicability, staged/untracked changes, dependency gitlinks and clean HEADs,
compiler/CMake identity and installed Picotool bytes. Add
`--toolchain-package /path/to/official.pkg` for the recorded package checksum.
Pristine stock or the complete recorded GC-sync state is accepted as a build
input; partial or unrelated changes fail. This does not accept a firmware for
deployment.

Focused checks need no build or source mutation:

```sh
python3 scripts/firmware/build.py verify-patch --source /path/to/micropython
python3 scripts/firmware/build.py verify-macros --variant gcsync \
  --macros /path/to/preserved/compiled-macros.txt
python3 scripts/firmware/build.py verify-artifacts --variant gcsync \
  --uf2 /path/to/preserved/firmware.uf2 \
  --bin /path/to/preserved/firmware.bin
python3 -m unittest discover -s scripts/firmware -p 'test_build.py'
```

Macro verification checks the recorded compiler dump for board, clock, GIL,
yield and GC hooks; it does not execute the firmware. Artifact verification
checks the frozen marker, exact UF2/BIN hashes, contiguous ordered program
blocks, family, ignored preamble and filesystem bounds. A matching marker
alone is insufficient. Output retains the recorded candidate qualification
status.

## Explicit experimental rebuild

An explicit build uses a new output directory, retains first-failure logs and
restores the input source's initial stock/GC-sync selection even after failure:

```sh
python3 scripts/firmware/build.py build \
  --source /path/to/isolated/micropython-v1.29.0 \
  --toolchain /path/to/extracted/arm-toolchain \
  --picotool-root /path/to/picotool-root \
  --cmake /path/to/cmake \
  --output /path/to/new-output \
  --variant gcsync
```

The helper builds host `mpy-cross`, extends the upstream manifest with the exact
marker, imports the pinned Picotool package, builds the firmware and checks its
actual compiled macros and UF2/BIN reference bytes. Git network protocols are
disabled; required inputs must already exist. Use `--variant stock` or `both`
only for an intentional control comparison. A rebuild with different UF2/BIN
bytes fails the reference gate and remains a separate unqualified artifact.

The `.1` image was compiled by the isolated candidate helper. This consolidated
entry point has host tests and read-only checks against that exact source,
macro dump and artifacts; it has not itself been used for a new firmware
rebuild. No firmware was rebuilt during this tooling revision. The helper has
no flash, serial, robot, vendor promotion or publication command. Avoid shared
source/cache mutation during hardware qualification.

## Runtime and adoption boundary

Concurrent `WLAN.scan()` during an active student program and Python
`hard=True` IRQ handlers remain unsupported. Native waits and thread restart
require hardware evidence. Acceptance must cover automatic GC under real HTTP
and Wi-Fi traffic, idle power/wake behavior, repeated Run, allocating loops,
Stop and fallback reset, next Run after recovery, step timing, USB recovery,
fresh commissioning and failed worker startup. The user's maximum permitted
performance slowdown is 5%; isolated successful timings do not establish that
limit. Stationary checks do not establish motion or Windows qualification.

The `.2` failure blocks its adoption. Exact `.1` with the final service passed
the recorded stationary native and clean-WPI Mac browser gates and is the
retained course release pin. For any later accepted candidate,
the integration owner must preserve the qualification record and firmware,
library, harness and safety identities; copy and checksum the exact qualified
bytes; enforce the unchanged frozen build ID with firmware/API identity; and
update release metadata, notices, status and deployment through a separately
authorized integration slice. Any different patch, bytes or marker requires a
new candidate identity and qualification.

[Upstream sources and notices](UPSTREAM_NOTICES.md) retains the licensing
provenance. Original notices remain in the pinned source and complete upstream
manifest; preserve applicable redistribution notices with any accepted image.
The full upstream [MicroPython v1.29 license](../../vendor/licenses/MicroPython-v1.29.0-LICENSE.txt)
is preserved byte-for-byte locally, including its MIT copyright/permission
notice and source-license summary. The accompanying
[native component license texts](../../vendor/licenses/firmware/README.md)
are also exact source copies; their manifest records each source path,
dependency commit, size and hash. These texts do not declare a single license
for all combined firmware constituents.
