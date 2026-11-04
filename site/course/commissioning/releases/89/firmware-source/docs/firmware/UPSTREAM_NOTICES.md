# Firmware upstream sources and notices

The build retains the upstream SparkFun XRP board configuration and its complete
frozen-module manifest. The port patch modifies MIT-licensed MicroPython files;
their original notices remain in the source checkout. Preserve applicable source
and binary redistribution notices when integrating a firmware image.
[Bundled native component notices](../../vendor/licenses/firmware/README.md)
retain the full upstream text, with exact source paths and hashes in their
[manifest](../../vendor/licenses/firmware/manifest.json). The table records
upstream license files; it does not replace their full terms or declare one
license for the combined image.

| Component | Pinned source and notice |
|---|---|
| MicroPython v1.29.0 | [MIT license](https://github.com/micropython/micropython/blob/0fd6c573ea815774668bbb16b8e197c8822368b2/LICENSE); [SparkFun XRP board](https://github.com/micropython/micropython/tree/0fd6c573ea815774668bbb16b8e197c8822368b2/ports/rp2/boards/SPARKFUN_XRP_CONTROLLER) |
| Pico SDK | [Bundled BSD 3-clause notice](../../vendor/licenses/Pico-SDK-BSD-3-Clause-LICENSE.txt), copied byte-for-byte from the [pinned upstream license](https://github.com/raspberrypi/pico-sdk/blob/98a542c1a62fb549ffb5d66a3e5892b06276b670/LICENSE.TXT); retain component-specific notices as supplied |
| TinyUSB | [MIT license](https://github.com/micropython/tinyusb/blob/b549ac1d84cbbe550c9590951e2290098b3fb16c/LICENSE) |
| lwIP | [BSD 3-clause notice](https://github.com/lwip-tcpip/lwip/blob/77dcd25a72509eb83f72b033d219b1d40cd8eb95/COPYING) |
| mbedTLS | [Apache-2.0 OR GPL-2.0-or-later licenses](https://github.com/Mbed-TLS/mbedtls/blob/0bebf8b8c7f07abe3571ded48a11aa907a1ffb20/LICENSE); [pinned framework source](https://github.com/Mbed-TLS/mbedtls-framework/tree/dff9da04438d712f7647fd995bc90fadd0c0e2ce) |
| CYW43 driver | [Raspberry Pi semiconductor-specific license](https://github.com/georgerobotics/cyw43-driver/blob/055d64274b014dd7b1c2fc94d26e8a18face7124/LICENSE.RP); [general noncommercial license](https://github.com/georgerobotics/cyw43-driver/blob/055d64274b014dd7b1c2fc94d26e8a18face7124/LICENSE); retain supplied [Wi-Fi/Bluetooth blob provenance](https://github.com/georgerobotics/cyw43-driver/tree/055d64274b014dd7b1c2fc94d26e8a18face7124/firmware) |
| BTstack | [BlueKitchen notice and noncommercial terms](https://github.com/bluekitchen/btstack/blob/77e752abd6a0992334047a48038a5a3960e5c6bc/LICENSE) |
| micropython-lib | [Aggregate license file](https://github.com/micropython/micropython-lib/blob/ee4bb8ff139e24c42b739935fbd8ec7c4d061e02/LICENSE); modules retain their individual manifest/license metadata |
| Picotool, host packaging tool | [BSD 3-clause notice](https://github.com/raspberrypi/picotool/blob/6f6458d792b93685a11423b244a585eaa99eafcf/LICENSE.TXT) |

The ARM GNU 15.3.rel1 host package's official download URL and SHA256 are in
[recipe.json](../../scripts/firmware/recipe.json). Retain its bundled compiler
and runtime-library notices; its extracted `share/doc/arm-none-eabi/readme.txt`
and `share/doc/gcc/Copying.html` document the supplied tools. Compiler licensing
alone does not specify the combined firmware's licensing.

The reference pair, recipe adaptations, build identities and acceptance
boundaries are documented in [BUILD_PROVENANCE.md](BUILD_PROVENANCE.md).

## Official flash eraser

The recovery download `nuke_universal.uf2` is an unmodified Raspberry Pi
[Pico SDK prebuilt release v2.3.1-0](https://github.com/raspberrypi/pico-sdk-prebuilts/releases/tag/v2.3.1-0)
[asset](https://github.com/raspberrypi/pico-sdk-prebuilts/releases/download/v2.3.1-0/nuke_universal.uf2).
Its size is `114688` bytes and its SHA-256 is
`f3c3b6a62d2d7e944f336bc2ec73393f00adfbb56b6fa7440ba7ee3d5ad5b49d`.
The upstream release describes builds using the 2.3.1 releases of Pico SDK and
Pico Examples. Pico Examples tag `sdk-2.3.1` identifies commit
`0d62f75bafc2c8120d3276c3343d1a9195e909e9`:
[eraser source](https://github.com/raspberrypi/pico-examples/blob/0d62f75bafc2c8120d3276c3343d1a9195e909e9/flash/nuke/nuke.c)
and [source notice](https://github.com/raspberrypi/pico-examples/blob/0d62f75bafc2c8120d3276c3343d1a9195e909e9/LICENSE.TXT).
The publisher's announced source version does not establish a locally reproduced
binary. The [bundled Raspberry Pi BSD notice](../../vendor/licenses/Pico-SDK-BSD-3-Clause-LICENSE.txt)
retains the SDK copyright, conditions and disclaimer. It was initially copied
from the MicroPython build's pinned SDK 2.3.0 source. The official eraser's
announced [Pico Examples notice](https://github.com/raspberrypi/pico-examples/blob/0d62f75bafc2c8120d3276c3343d1a9195e909e9/LICENSE.TXT)
and [SDK 2.3.1 notice](https://github.com/raspberrypi/pico-sdk/blob/2.3.1/LICENSE.TXT)
were independently fetched and verified byte-identical: each is `1489` bytes,
with SHA-256
`483f865953435b66c443dee7558debe3cc3cf8fcbb6a112fd9fc6a795d53f1f6`.
Component-specific notices remain applicable; the eraser is separate from our
MicroPython build.
