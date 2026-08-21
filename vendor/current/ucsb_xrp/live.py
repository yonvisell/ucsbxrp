"""Small runtime controls and named watch values for student programs.

Parameters are declared once, then read through their ``value`` property.
The Monitor may queue a new value while the program runs; ``apply_updates``
applies all queued values together at a control-loop boundary. ``Robot`` does
this automatically after each measured sample.
"""

import json
import math

try:
    import _thread

    _lock = _thread.allocate_lock()
except (ImportError, AttributeError):
    _lock = None

try:
    import xrp_sim_bridge as _bridge
except ImportError:
    _bridge = None


MAX_PARAMETERS = 16
MAX_WATCHES = 16
MAX_PLOTS = 16
MAX_ENCODED_VALUE = 2147483647

_parameters = []
_parameters_by_name = {}
_watches = []
_watches_by_name = {}
_plots = []
_plots_by_name = {}
_revision = 0
_runtime_json = '{"revision":0,"parameters":[],"watches":[],"plots":[]}'
_snapshot_dirty = False


def _acquire():
    if _lock is not None:
        _lock.acquire()


def _release():
    if _lock is not None:
        _lock.release()


def _clean_text(value, field, maximum, identifier=False):
    if not isinstance(value, str):
        raise TypeError(field + " must be a string")
    value = value.strip()
    if not value or len(value) > maximum:
        raise ValueError(field + " must contain 1 to " + str(maximum) + " characters")
    if identifier:
        first = value[0]
        if not (("a" <= first <= "z") or ("A" <= first <= "Z") or first == "_"):
            raise ValueError(field + " must begin with a letter or underscore")
        for character in value[1:]:
            if not (
                ("a" <= character <= "z")
                or ("A" <= character <= "Z")
                or ("0" <= character <= "9")
                or character == "_"
            ):
                raise ValueError(field + " may contain only letters, digits, and underscores")
    return value


def _finite_number(value, field):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise TypeError(field + " must be a number")
    value = float(value)
    if not math.isfinite(value):
        raise ValueError(field + " must be finite")
    return value


def _default_label(name):
    value = name.replace("_", " ")
    first = value[0]
    if "a" <= first <= "z":
        first = chr(ord(first) - 32)
    return first + value[1:]


def _same_value(left, right):
    return type(left) is type(right) and left == right


def _parameter_record(parameter):
    record = {
        "name": parameter.name,
        "label": parameter.label,
        "kind": parameter.kind,
        "value": parameter.value,
    }
    if parameter.unit:
        record["unit"] = parameter.unit
    if parameter.kind == "number":
        record["minimum"] = parameter.minimum
        record["maximum"] = parameter.maximum
        record["step"] = parameter.step
    elif parameter.kind == "choice":
        record["options"] = list(parameter.options)
    if parameter._pending is not None:
        record["pendingValue"] = parameter._pending
    return record


def _refresh_snapshot():
    global _revision, _runtime_json, _snapshot_dirty
    _revision += 1
    value = {
        "revision": _revision,
        "parameters": [_parameter_record(item) for item in _parameters],
        "watches": [dict(item) for item in _watches],
        "plots": [dict(item) for item in _plots],
    }
    _runtime_json = json.dumps(value, separators=(",", ":"))
    _snapshot_dirty = False
    if _bridge is not None:
        _bridge.publish_runtime_state(_runtime_json)


class LiveParameter:
    """A value that can be adjusted from the Monitor while a program runs."""

    __slots__ = (
        "name",
        "label",
        "kind",
        "unit",
        "minimum",
        "maximum",
        "step",
        "options",
        "value",
        "_pending",
        "_slot",
        "_encoded",
    )

    def __init__(
        self,
        name,
        label,
        kind,
        value,
        unit="",
        minimum=None,
        maximum=None,
        step=None,
        options=(),
    ):
        self.name = name
        self.label = label
        self.kind = kind
        self.unit = unit
        self.minimum = minimum
        self.maximum = maximum
        self.step = step
        self.options = tuple(options)
        self.value = value
        self._pending = None
        self._slot = -1
        self._encoded = self._encode(value)

    def _encode(self, value):
        if self.kind == "number":
            return int(round((value - self.minimum) / self.step))
        if self.kind == "toggle":
            return 1 if value else 0
        return self.options.index(value)

    def _decode(self, encoded):
        if self.kind == "number":
            maximum_index = int(round((self.maximum - self.minimum) / self.step))
            index = min(maximum_index, max(0, int(encoded)))
            value = self.minimum + index * self.step
            return min(self.maximum, max(self.minimum, value))
        if self.kind == "toggle":
            return bool(encoded)
        index = min(len(self.options) - 1, max(0, int(encoded)))
        return self.options[index]

    def _validate_value(self, value):
        if self.kind == "number":
            value = _finite_number(value, self.name)
            if value < self.minimum or value > self.maximum:
                raise ValueError(
                    self.name
                    + " must be between "
                    + str(self.minimum)
                    + " and "
                    + str(self.maximum)
                )
            encoded = self._encode(value)
            return self._decode(encoded)
        if self.kind == "toggle":
            if not isinstance(value, bool):
                raise TypeError(self.name + " must be True or False")
            return value
        if not isinstance(value, str) or value not in self.options:
            raise ValueError(self.name + " must be one of " + ", ".join(self.options))
        return value


def _declare(parameter):
    _acquire()
    try:
        if parameter.name in _parameters_by_name:
            raise ValueError("live parameter already exists: " + parameter.name)
        if len(_parameters) >= MAX_PARAMETERS:
            raise ValueError("at most " + str(MAX_PARAMETERS) + " live parameters may be declared")
        if _bridge is not None:
            descriptor = _parameter_record(parameter)
            parameter._slot = int(
                _bridge.register_live_parameter(
                    json.dumps(descriptor, separators=(",", ":")),
                    parameter._encoded,
                )
            )
        _parameters.append(parameter)
        _parameters_by_name[parameter.name] = parameter
        _refresh_snapshot()
        return parameter
    finally:
        _release()


def number(name, default, minimum, maximum, step, unit="", label=None):
    """Declare a bounded numeric parameter rendered as a compact slider."""
    name = _clean_text(name, "name", 32, identifier=True)
    label = _clean_text(label or _default_label(name), "label", 48)
    unit = "" if unit == "" else _clean_text(unit, "unit", 16)
    minimum = _finite_number(minimum, "minimum")
    maximum = _finite_number(maximum, "maximum")
    step = _finite_number(step, "step")
    if maximum <= minimum:
        raise ValueError("maximum must be greater than minimum")
    if step <= 0 or step > maximum - minimum:
        raise ValueError("step must be positive and no larger than the range")
    encoded_maximum = int(round((maximum - minimum) / step))
    if encoded_maximum > MAX_ENCODED_VALUE:
        raise ValueError("numeric parameter declares too many steps")
    parameter = LiveParameter(
        name,
        label,
        "number",
        _finite_number(default, "default"),
        unit=unit,
        minimum=minimum,
        maximum=maximum,
        step=step,
    )
    parameter.value = parameter._validate_value(parameter.value)
    parameter._encoded = parameter._encode(parameter.value)
    return _declare(parameter)


def toggle(name, default, label=None):
    """Declare an on/off parameter rendered as a compact switch."""
    name = _clean_text(name, "name", 32, identifier=True)
    label = _clean_text(label or _default_label(name), "label", 48)
    if not isinstance(default, bool):
        raise TypeError("default must be True or False")
    return _declare(LiveParameter(name, label, "toggle", default))


def choice(name, default, options, label=None):
    """Declare a short categorical parameter rendered as radio choices."""
    name = _clean_text(name, "name", 32, identifier=True)
    label = _clean_text(label or _default_label(name), "label", 48)
    if not isinstance(options, (tuple, list)) or not 2 <= len(options) <= 6:
        raise ValueError("options must contain 2 to 6 choices")
    cleaned = tuple(_clean_text(item, "option", 24) for item in options)
    if len(set(cleaned)) != len(cleaned):
        raise ValueError("choice options must be unique")
    if default not in cleaned:
        raise ValueError("default must be one of the choices")
    return _declare(
        LiveParameter(name, label, "choice", default, options=cleaned)
    )


def watch(name, value, unit="", label=None):
    """Stage one named value for publication at the next loop boundary."""
    global _snapshot_dirty
    name = _clean_text(name, "name", 32, identifier=True)
    label = _clean_text(label or _default_label(name), "label", 48)
    unit = "" if unit == "" else _clean_text(unit, "unit", 16)
    if isinstance(value, float) and not math.isfinite(value):
        raise ValueError("watch value must be finite")
    if not isinstance(value, (bool, int, float, str)):
        raise TypeError("watch value must be a number, boolean, or string")
    if isinstance(value, str) and len(value) > 64:
        raise ValueError("watch text may contain at most 64 characters")
    _acquire()
    try:
        existing = _watches_by_name.get(name)
        if existing is None:
            if len(_watches) >= MAX_WATCHES:
                raise ValueError("at most " + str(MAX_WATCHES) + " watches may be published")
            existing = {"name": name, "label": label, "value": value}
            if unit:
                existing["unit"] = unit
            _watches.append(existing)
            _watches_by_name[name] = existing
        else:
            existing["label"] = label
            existing["value"] = value
            if unit:
                existing["unit"] = unit
            else:
                existing.pop("unit", None)
        _snapshot_dirty = True
    finally:
        _release()


def plot(name, value, unit="", label=None):
    """Stage one numeric value for an optional Monitor strip plot."""
    global _snapshot_dirty
    name = _clean_text(name, "name", 32, identifier=True)
    label = _clean_text(label or _default_label(name), "label", 48)
    unit = "" if unit == "" else _clean_text(unit, "unit", 16)
    value = _finite_number(value, "plot value")
    _acquire()
    try:
        existing = _plots_by_name.get(name)
        if existing is None:
            if len(_plots) >= MAX_PLOTS:
                raise ValueError(
                    "at most " + str(MAX_PLOTS) + " plot values may be published"
                )
            existing = {"name": name, "label": label, "value": value}
            if unit:
                existing["unit"] = unit
            _plots.append(existing)
            _plots_by_name[name] = existing
        else:
            existing["label"] = label
            existing["value"] = value
            if unit:
                existing["unit"] = unit
            else:
                existing.pop("unit", None)
        _snapshot_dirty = True
    finally:
        _release()


def apply_updates():
    """Apply the most recent Monitor values as one control-loop update."""
    changed = False
    _acquire()
    try:
        for parameter in _parameters:
            if _bridge is not None:
                encoded = int(_bridge.read_live_parameter(parameter._slot))
                if encoded != parameter._encoded:
                    parameter.value = parameter._decode(encoded)
                    parameter._encoded = encoded
                    changed = True
            elif parameter._pending is not None:
                parameter.value = parameter._pending
                parameter._encoded = parameter._encode(parameter.value)
                parameter._pending = None
                changed = True
        if changed or _snapshot_dirty:
            _refresh_snapshot()
    finally:
        _release()
    return changed


def queue_update(name, value):
    """Queue a validated physical-target update for the next sample boundary."""
    _acquire()
    try:
        parameter = _parameters_by_name.get(name)
        if parameter is None:
            raise ValueError("unknown live parameter: " + str(name))
        value = parameter._validate_value(value)
        if _same_value(value, parameter.value):
            parameter._pending = None
        else:
            parameter._pending = value
        _refresh_snapshot()
    finally:
        _release()


def runtime_snapshot_json():
    """Return the immutable runtime snapshot consumed by the target service."""
    return _runtime_json


def clear():
    """Clear state before a new physical project starts."""
    global _revision, _snapshot_dirty
    _acquire()
    try:
        _parameters[:] = []
        _parameters_by_name.clear()
        _watches[:] = []
        _watches_by_name.clear()
        _plots[:] = []
        _plots_by_name.clear()
        _revision = 0
        _snapshot_dirty = False
        _refresh_snapshot()
    finally:
        _release()


__all__ = (
    "LiveParameter",
    "apply_updates",
    "choice",
    "number",
    "plot",
    "toggle",
    "watch",
)
