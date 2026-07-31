"""Read-only MicroPython runtime probe; executes from host without installation."""

import gc
import json
import os
import sys


def _names(path):
    try:
        return sorted(os.listdir(path))
    except OSError:
        return None


implementation = sys.implementation
uname = os.uname()
result = {
    "implementation": {
        "name": implementation.name,
        "version": list(implementation.version[:3]),
        "machine": getattr(implementation, "_machine", None),
        "mpy": getattr(implementation, "_mpy", None),
    },
    "uname": {
        "sysname": uname.sysname,
        "nodename": uname.nodename,
        "release": uname.release,
        "version": uname.version,
        "machine": uname.machine,
    },
    "filesystem": {
        "root": _names("/"),
        "lib": _names("/lib"),
    },
    "memory_free_bytes": gc.mem_free(),
}

print("UCSB_XRP_PROBE=" + json.dumps(result))
