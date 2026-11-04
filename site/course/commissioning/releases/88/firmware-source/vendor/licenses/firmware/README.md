# Native firmware upstream notices

These files are byte-for-byte copies from the pinned upstream source used to
build `ucsbxrp-rp2350-1.29.0-gcsync-20260930.1`. Their source paths, dependency
commits, lengths and SHA-256 values are recorded in [manifest.json](manifest.json).
The manifest identifies copies; it does not select licensing terms for the
combined firmware or establish native qualification.

| Component | Preserved upstream text |
|---|---|
| MicroPython | [Complete v1.29.0 license](../MicroPython-v1.29.0-LICENSE.txt) |
| BTstack | [BlueKitchen license](btstack/LICENSE); [Pico SDK-supplied Raspberry Pi counterpart](pico-sdk/src/rp2_common/pico_btstack/LICENSE.RP) |
| CYW43 driver | [General license](cyw43-driver/LICENSE); [Raspberry Pi counterpart](cyw43-driver/LICENSE.RP); [firmware provenance](cyw43-driver/firmware/README.md) |
| lwIP | [Copyright and license](lwip/COPYING) |
| mbedTLS | [Complete upstream dual-license text](mbedtls/LICENSE) |
| TinyUSB | [Copyright and MIT license](tinyusb/LICENSE) |
| Pico SDK | [BSD notice](pico-sdk/LICENSE.TXT); [printf notice](pico-sdk/src/rp2_common/pico_printf/LICENSE); [CMSIS license](pico-sdk/src/rp2_common/cmsis/stub/CMSIS/LICENSE.txt) |
| Frozen micropython-lib modules | [Aggregate upstream license](micropython-lib/LICENSE) |

The printf and CMSIS source units are present in the preserved native build
inputs. The CYW43 firmware README is provenance text supplied alongside its
binary blobs; it is not an independent grant of licensing rights. Frozen
micropython-lib modules retain their upstream module metadata and source
notices in the source checkout.

[Upstream sources and notices](../../../docs/firmware/UPSTREAM_NOTICES.md)
links these texts to the pinned repositories and records the separate official
flash eraser's source announcement and notice identity. [Build provenance](../../../docs/firmware/BUILD_PROVENANCE.md)
records the exact firmware bytes and validation boundary.
