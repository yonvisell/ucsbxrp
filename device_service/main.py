"""Start the private UCSB-XRP course connection service."""

import machine


# A watchdog can remain active while MicroPython restarts. Feed it before the
# larger service module is imported so repair, soft reset, and ordinary boot
# all have the same recovery path.
_BOOT_WATCHDOG_MS = 7000
_watchdog = machine.WDT(timeout=_BOOT_WATCHDOG_MS)
_watchdog.feed()

from ucsb_xrp_service.service import run

run(_watchdog)
