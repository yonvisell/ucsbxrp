"""Small runtime controls and named watch values for student programs.

Parameters are declared once, then read through their ``value`` property.
The Monitor may queue a new value while the program runs; ``apply_updates``
applies all queued values together at a control-loop boundary. ``Robot`` does
this automatically after each measured sample.
"""

import json
import math
from ._build_config import DEBUG_VALIDATION

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
_runtime_snapshot = (0, (), (), ())
_runtime_json = '{"revision":0,"parameters":[],"watches":[],"plots":[]}'
_runtime_json_snapshot = _runtime_snapshot
_snapshot_dirty = False
_parameter_snapshot_dirty = False
_sample_plots = ()
_sample_plots_dirty = False
_plot_schema = ()
_watch_schema = ()
_plot_schema_dirty = False
_watch_schema_dirty = False
_parameter_records = ()
_parameter_records_dirty = True


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


class _ValueFrame:
    """One immutable value vector sharing its registered descriptor schema.

    Iteration expands rows for the service/virtual bridge, never for acquisition.
    """

    __slots__ = ("_schema", "_values")

    def __init__(self, schema, values):
        self._schema = schema
        self._values = values

    @property
    def schema(self):
        return self._schema

    @property
    def values(self):
        return self._values

    def __len__(self):
        return len(self.values)

    def __getitem__(self, index):
        return self.schema[index] + (self.values[index],)

    def __iter__(self):
        for index in range(len(self.values)):
            yield self.schema[index] + (self.values[index],)

    def __eq__(self, other):
        return tuple(self) == tuple(other)


def _watch_value(value):
    if isinstance(value, float) and not math.isfinite(value):
        raise ValueError("watch value must be finite")
    if not isinstance(value, (bool, int, float, str)):
        raise TypeError("watch value must be a number, boolean, or string")
    if isinstance(value, str) and len(value) > 64:
        raise ValueError("watch text may contain at most 64 characters")
    return value


class LiveValue:
    """A registered plot or watch; assign value from the program's loop."""

    __slots__ = ("_record", "_plot")

    def __init__(self, record, is_plot):
        self._record = record
        self._plot = is_plot

    @property
    def value(self):
        return self._record[3]

    @value.setter
    def value(self, value):
        global _snapshot_dirty, _sample_plots_dirty, _plot_schema_dirty, _watch_schema_dirty
        if DEBUG_VALIDATION:
            value = _finite_number(value, "plot value") if self._plot else _watch_value(value)
        # Staging belongs to the program thread. The service reads only the
        # immutable frame committed at a boundary, not this mutable slot.
        if (self._record[3] is None) != (value is None):
            if self._plot:
                _plot_schema_dirty = True
            else:
                _watch_schema_dirty = True
        self._record[3] = value
        _snapshot_dirty = True
        if self._plot:
            _sample_plots_dirty = True


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


def _value_records(values):
    """Expand compact values for JSON only when a display view is requested."""
    records = []
    for name, label, unit, value in values:
        record = {"name": name, "label": label, "value": value}
        if unit:
            record["unit"] = unit
        records.append(record)
    return records


def _encode_snapshot(snapshot):
    revision, parameters, watches, plots = snapshot
    return json.dumps({
        "revision": revision,
        "parameters": parameters,
        "watches": _value_records(watches),
        "plots": _value_records(plots),
    }, separators=(",", ":"))


def _freeze_sample_plots():
    """Called with the live lock held, before retaining an acquisition."""
    global _sample_plots, _sample_plots_dirty, _plot_schema, _plot_schema_dirty
    if _sample_plots_dirty:
        if _plot_schema_dirty:
            _plot_schema = tuple(tuple(item[:3]) for item in _plots if item[3] is not None)
            _plot_schema_dirty = False
        _sample_plots = _ValueFrame(_plot_schema, tuple(item[3] for item in _plots if item[3] is not None))
        _sample_plots_dirty = False
    return _sample_plots


def _refresh_snapshot(commit_values=True):
    """Freeze a boundary view while the caller holds the live-state lock."""
    global _revision, _runtime_snapshot, _runtime_json, _runtime_json_snapshot
    global _snapshot_dirty, _parameter_snapshot_dirty
    global _parameter_records, _parameter_records_dirty, _watch_schema, _watch_schema_dirty
    _revision += 1
    if _parameter_records_dirty:
        _parameter_records = tuple(_parameter_record(item) for item in _parameters)
        _parameter_records_dirty = False
    if commit_values:
        if _watch_schema_dirty:
            _watch_schema = tuple(tuple(item[:3]) for item in _watches if item[3] is not None)
            _watch_schema_dirty = False
        watches = _ValueFrame(_watch_schema, tuple(item[3] for item in _watches if item[3] is not None))
        plots = _freeze_sample_plots()
    else:
        # A service-side pending-parameter refresh must not read producer slots
        # midway through the next control iteration.
        watches, plots = _runtime_snapshot[2], _runtime_snapshot[3]
    value = (_revision, _parameter_records, watches, plots)
    # These detached records are never mutated. The physical service can encode
    # them after releasing the lock, without delaying parameter/plot updates.
    _runtime_snapshot = value
    if _bridge is not None:
        # The virtual target delivers its boundary view through this bridge;
        # the physical target instead serializes only when a client asks for it.
        _runtime_json = _encode_snapshot(value)
        _runtime_json_snapshot = value
        _bridge.publish_runtime_state(_runtime_json)
    # Clear only after the frame and any required bridge publication succeed;
    # an allocation/encoding failure must leave the next boundary able to retry.
    if commit_values:
        _snapshot_dirty = False
    _parameter_snapshot_dirty = False


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
    global _parameter_records_dirty
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
        _parameter_records_dirty = True
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


def _stage_value(name, value, unit, label, records, by_name, maximum, kind):
    """Compatibility publisher; new course code uses pre-registered slots."""
    global _plot_schema_dirty, _watch_schema_dirty
    entry = by_name.get(name) if isinstance(name, str) else None
    if (entry is not None and isinstance(unit, str)
            and (label is None or isinstance(label, str))
            and _same_value(entry[1], unit) and _same_value(entry[2], label)):
        record = entry[0]
        if _same_value(record[3], value):
            return False
        if (record[3] is None) != (value is None):
            if records is _plots:
                _plot_schema_dirty = True
            else:
                _watch_schema_dirty = True
        record[3] = value
        return True
    input_unit, input_label = unit, label
    name = _clean_text(name, "name", 32, identifier=True)
    label = _clean_text(label or _default_label(name), "label", 48)
    unit = "" if unit == "" else _clean_text(unit, "unit", 16)
    entry = by_name.get(name)
    if entry is None:
        if len(records) >= maximum:
            raise ValueError("at most " + str(maximum) + " " + kind + " may be published")
        record = [name, label, unit, value]
        records.append(record)
        metadata_changed = changed = True
    else:
        record = entry[0]
        metadata_changed = (record[1] != label or record[2] != unit
                            or (record[3] is None) != (value is None))
        changed = metadata_changed or not _same_value(record[3], value)
        record[1], record[2], record[3] = label, unit, value
    if metadata_changed:
        if records is _plots:
            _plot_schema_dirty = True
        else:
            _watch_schema_dirty = True
    by_name[name] = (record, input_unit, input_label)
    return changed


def watch(name, value, unit="", label=None):
    """Stage a watch; register_watch avoids name lookup in recurring code."""
    global _snapshot_dirty
    if DEBUG_VALIDATION:
        _watch_value(value)
    if _stage_value(name, value, unit, label, _watches, _watches_by_name,
                    MAX_WATCHES, "watches"):
        _snapshot_dirty = True


def plot(name, value, unit="", label=None):
    """Stage a plot; register_plot avoids name lookup in recurring code."""
    global _snapshot_dirty, _sample_plots_dirty
    if DEBUG_VALIDATION:
        value = _finite_number(value, "plot value")
    if _stage_value(name, value, unit, label, _plots, _plots_by_name,
                    MAX_PLOTS, "plot values"):
        _snapshot_dirty = True
        _sample_plots_dirty = True


def register_plot(name, initial=None, unit="", label=None):
    """Register before the loop, then assign the returned signal's value."""
    global _snapshot_dirty, _sample_plots_dirty
    if initial is not None:
        initial = _finite_number(initial, "plot value")
    _stage_value(name, initial, unit, label, _plots, _plots_by_name, MAX_PLOTS, "plot values")
    _snapshot_dirty = _sample_plots_dirty = True
    return LiveValue(_plots_by_name[name.strip()][0], True)


def register_watch(name, initial=None, unit="", label=None):
    """Register before the loop, then assign the returned signal's value."""
    global _snapshot_dirty
    if initial is not None:
        initial = _watch_value(initial)
    _stage_value(name, initial, unit, label, _watches, _watches_by_name, MAX_WATCHES, "watches")
    _snapshot_dirty = True
    return LiveValue(_watches_by_name[name.strip()][0], False)


def apply_updates():
    """Apply the most recent Monitor values as one control-loop update."""
    global _parameter_records_dirty
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
        if changed:
            _parameter_records_dirty = True
        if changed or _snapshot_dirty:
            _refresh_snapshot()
    finally:
        _release()
    return changed


def queue_update(name, value, defer_snapshot=False):
    """Queue a validated update; compact transport can defer its snapshot."""
    global _snapshot_dirty, _parameter_snapshot_dirty, _parameter_records_dirty
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
        # The physical HTTP handler must not serialize all watches and plots
        # under this cross-core lock for each slider event. Old clients asking
        # for an immediate snapshot materialize it below; otherwise the next
        # course step publishes the applied value.
        _snapshot_dirty = True
        _parameter_records_dirty = True
        if not defer_snapshot:
            _parameter_snapshot_dirty = True
        if _bridge is not None:
            _refresh_snapshot()
        return value
    finally:
        _release()


def runtime_snapshot_json():
    """Encode the latest committed view without holding the control-path lock."""
    global _runtime_json, _runtime_json_snapshot
    _acquire()
    try:
        if _parameter_snapshot_dirty:
            _refresh_snapshot(commit_values=False)
        snapshot = _runtime_snapshot
        if _runtime_json_snapshot is snapshot:
            return _runtime_json
    finally:
        _release()

    encoded = _encode_snapshot(snapshot)
    _acquire()
    try:
        # A control boundary or clear() may have published a new view while
        # encoding. Return this consistent view without replacing a newer cache.
        if _runtime_snapshot is snapshot:
            _runtime_json = encoded
            _runtime_json_snapshot = snapshot
    finally:
        _release()
    return encoded


def _plot_sample_snapshot():
    """Return the immutable values published before this acquisition boundary."""
    _acquire()
    try:
        # Old rows retain their tuples when the next staged values change.
        return _freeze_sample_plots()
    finally:
        _release()


def clear():
    """Clear state before a new physical project starts."""
    global _revision, _snapshot_dirty, _sample_plots, _sample_plots_dirty
    global _plot_schema, _watch_schema, _plot_schema_dirty, _watch_schema_dirty
    global _parameter_records_dirty
    _acquire()
    try:
        _parameters[:] = []
        _parameters_by_name.clear()
        _watches[:] = []
        _watches_by_name.clear()
        _plots[:] = []
        _plots_by_name.clear()
        _plot_schema = _watch_schema = ()
        _plot_schema_dirty = _watch_schema_dirty = False
        _parameter_records_dirty = True
        _sample_plots = ()
        _sample_plots_dirty = False
        _revision = 0
        _snapshot_dirty = False
        _refresh_snapshot()
    finally:
        _release()


__all__ = (
    "LiveParameter",
    "LiveValue",
    "register_plot",
    "register_watch",
    "apply_updates",
    "choice",
    "number",
    "plot",
    "toggle",
    "watch",
)
