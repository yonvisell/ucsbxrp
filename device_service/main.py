"""Start the private UCSB-XRP course connection service."""

import json
import machine
import network


# A watchdog can remain active while MicroPython restarts. Feed it before the
# larger service module is imported so repair, soft reset, and ordinary boot
# all have the same recovery path.
_BOOT_WATCHDOG_MS = 7000
_watchdog = machine.WDT(timeout=_BOOT_WATCHDOG_MS)
_watchdog.feed()

# Begin station association before importing the larger service and course
# packages. The CYW43 can scan, authenticate, and obtain DHCP while MicroPython
# loads those modules, shortening a complete controller restart substantially.
from ucsb_xrp_service.networking import begin_network_activation

_network_activation = begin_network_activation(
    json.load(open("/xrp_wifi.json")),
    watchdog=_watchdog,
    network_module=network,
)

from ucsb_xrp_service.service import prepare_for_repl, run

try:
    run(_watchdog, network_activation=_network_activation)
finally:
    # Ctrl-C from the commissioning wizard stops the service core. Retire the
    # persistent project worker as well before Chrome enters raw REPL.
    prepare_for_repl()
