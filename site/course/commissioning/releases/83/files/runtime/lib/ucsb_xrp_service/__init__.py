"""Private browser-to-XRP course service."""

from .protocol import PROTOCOL_VERSION
from .protocol import SERVICE_VERSION as _LEGACY_SERVICE_VERSION


try:
    import course_boot

    _runtime = course_boot.runtime_identity()
except (ImportError, AttributeError):
    _runtime = None

SERVICE_VERSION = (
    _runtime.get("serviceVersion")
    if isinstance(_runtime, dict) and _runtime.get("serviceVersion")
    else _LEGACY_SERVICE_VERSION
)

__all__ = ("PROTOCOL_VERSION", "SERVICE_VERSION")
