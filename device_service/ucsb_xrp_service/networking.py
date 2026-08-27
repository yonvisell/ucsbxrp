"""Small, testable Wi-Fi profile support for the XRP course service."""

MODE_STATION = "station"
MODE_ACCESS_POINT = "access_point"
CONFIG_VERSION = 2

DEFAULT_AP_PASSWORD = "ucsb-xrp"
# Keep the access point on the CYW43 port's native subnet. The firmware's
# built-in DHCP server assigns clients 192.168.4.x addresses and does not expose
# a supported way to move that pool; using another static subnet makes the XRP
# appear connected while leaving its HTTP service unreachable.
DEFAULT_AP_ADDRESS = "192.168.4.1"
LEGACY_AP_ADDRESS = "192.168.42.1"
DEFAULT_AP_NETMASK = "255.255.255.0"
DEFAULT_AP_CHANNELS = (1, 6, 11)


def normalize_config(value):
    """Return the version-2 profile shape, including legacy station files."""
    if not isinstance(value, dict):
        raise ValueError("Wi-Fi configuration must be an object")

    hostname = value.get("hostname", "ucsb-xrp")
    if not isinstance(hostname, str) or not hostname:
        raise ValueError("Wi-Fi hostname must be nonempty text")

    mode = value.get("mode", MODE_STATION)
    if mode not in (MODE_STATION, MODE_ACCESS_POINT):
        raise ValueError("Wi-Fi mode must be station or access_point")

    station = value.get("station")
    if not isinstance(station, dict):
        station = {
            "ssid": value.get("ssid"),
            "password": value.get("password"),
        }
        if value.get("ifconfig"):
            station["ifconfig"] = value["ifconfig"]

    access_point = value.get("access_point")
    if not isinstance(access_point, dict):
        access_point = {}
    access_point = dict(access_point)
    access_point.setdefault("password", DEFAULT_AP_PASSWORD)
    access_point.setdefault(
        "ifconfig",
        [
            DEFAULT_AP_ADDRESS,
            DEFAULT_AP_NETMASK,
            DEFAULT_AP_ADDRESS,
            DEFAULT_AP_ADDRESS,
        ],
    )

    if mode == MODE_STATION:
        if not isinstance(station.get("ssid"), str) or not station["ssid"]:
            raise ValueError("Station mode requires an SSID")
        if not isinstance(station.get("password"), str):
            raise ValueError("Station mode requires a password")

    ap_password = access_point.get("password")
    if not isinstance(ap_password, str) or not 8 <= len(ap_password) <= 63:
        raise ValueError("Access-point password must contain 8 to 63 characters")

    channel = access_point.get("channel")
    if channel is not None and channel not in DEFAULT_AP_CHANNELS:
        raise ValueError("Access-point channel must be 1, 6, or 11")

    ifconfig = access_point.get("ifconfig")
    if not isinstance(ifconfig, (list, tuple)) or len(ifconfig) != 4:
        raise ValueError("Access-point network settings must contain four values")
    if ifconfig[0] == LEGACY_AP_ADDRESS:
        # Releases through dev.11 moved the AP interface but could not move the
        # firmware DHCP pool. Repair that known profile transparently.
        access_point["ifconfig"] = [
            DEFAULT_AP_ADDRESS,
            DEFAULT_AP_NETMASK,
            DEFAULT_AP_ADDRESS,
            DEFAULT_AP_ADDRESS,
        ]

    return {
        "version": CONFIG_VERSION,
        "mode": mode,
        "hostname": hostname,
        "station": station,
        "access_point": access_point,
        "fallback_to_access_point": bool(
            value.get("fallback_to_access_point", True)
        ),
    }


def _interface_id(network_module, name, legacy_name):
    value = getattr(network_module.WLAN, name, None)
    if value is not None:
        return value
    return getattr(network_module, legacy_name)


def _feed(watchdog):
    if watchdog is not None:
        watchdog.feed()


def _status_name(network_module, status):
    names = (
        ("STAT_IDLE", "idle"),
        ("STAT_CONNECTING", "connecting"),
        ("STAT_WRONG_PASSWORD", "wrong_password"),
        ("STAT_NO_AP_FOUND", "network_not_found"),
        ("STAT_CONNECT_FAIL", "connect_failed"),
        ("STAT_GOT_IP", "connected"),
    )
    for constant, name in names:
        if status == getattr(network_module, constant, None):
            return name
    if status == 2:
        return "waiting_for_ip"
    return str(status)


def _mac_suffix(value):
    if isinstance(value, (bytes, bytearray)) and len(value) >= 2:
        return "{:02X}{:02X}".format(value[-2], value[-1])
    return "ROBOT"


def _access_point_identity(ap, profile):
    mac = ap.config("mac")
    ssid = profile.get("ssid") or "UCSB-XRP-{}".format(_mac_suffix(mac))
    channel = profile.get("channel")
    if channel is None:
        last_byte = mac[-1] if isinstance(mac, (bytes, bytearray)) and mac else 0
        channel = DEFAULT_AP_CHANNELS[last_byte % len(DEFAULT_AP_CHANNELS)]
    return ssid, channel


def _activate_access_point(config, network_module, watchdog):
    station = network_module.WLAN(
        _interface_id(network_module, "IF_STA", "STA_IF")
    )
    if station.active():
        try:
            station.disconnect()
        except Exception:
            pass
        station.active(False)

    ap = network_module.WLAN(_interface_id(network_module, "IF_AP", "AP_IF"))
    if ap.active():
        ap.active(False)
    profile = config["access_point"]
    ssid, channel = _access_point_identity(ap, profile)
    settings = {
        "ssid": ssid,
        "key": profile["password"],
        "channel": channel,
    }
    security = getattr(network_module.WLAN, "SEC_WPA_WPA2", None)
    if security is not None:
        settings["security"] = security
    ap.config(**settings)
    ap.active(True)
    # The CYW43 port applies a custom AP address only after the interface is up.
    ap.ifconfig(tuple(profile["ifconfig"]))
    _feed(watchdog)
    return {
        "ready": True,
        "connected": bool(ap.isconnected()),
        "mode": MODE_ACCESS_POINT,
        "status": "ready",
        "hostname": config["hostname"],
        "ssid": ssid,
        "address": ap.ifconfig()[0],
        "address_mode": "static",
        "channel": channel,
    }


def _begin_station(config, network_module, watchdog):
    ap = network_module.WLAN(_interface_id(network_module, "IF_AP", "AP_IF"))
    if ap.active():
        ap.active(False)

    profile = config["station"]
    wlan = network_module.WLAN(
        _interface_id(network_module, "IF_STA", "STA_IF")
    )
    wlan.active(True)
    if wlan.isconnected():
        try:
            current_ssid = wlan.config("ssid")
            if isinstance(current_ssid, bytes):
                current_ssid = current_ssid.decode("utf-8")
        except Exception:
            current_ssid = None
        if current_ssid != profile["ssid"]:
            wlan.disconnect()
    if profile.get("ifconfig"):
        wlan.ifconfig(tuple(profile["ifconfig"]))
    if not wlan.isconnected():
        wlan.connect(profile["ssid"], profile["password"])
    _feed(watchdog)
    return wlan


def _finish_station(
    config, wlan, timeout_ms, network_module, time_module, watchdog
):
    profile = config["station"]

    deadline = time_module.ticks_add(time_module.ticks_ms(), timeout_ms)
    failure_values = tuple(
        value
        for value in (
            getattr(network_module, "STAT_WRONG_PASSWORD", None),
            getattr(network_module, "STAT_NO_AP_FOUND", None),
            getattr(network_module, "STAT_CONNECT_FAIL", None),
        )
        if value is not None
    )
    while (
        not wlan.isconnected()
        and time_module.ticks_diff(deadline, time_module.ticks_ms()) > 0
    ):
        _feed(watchdog)
        if wlan.status() in failure_values:
            break
        time_module.sleep_ms(100)
    _feed(watchdog)
    status = wlan.status()
    return {
        "ready": bool(wlan.isconnected()),
        "connected": bool(wlan.isconnected()),
        "mode": MODE_STATION,
        "status": _status_name(network_module, status),
        "hostname": config["hostname"],
        "ssid": profile["ssid"],
        "address": wlan.ifconfig()[0] if wlan.isconnected() else None,
        "address_mode": "static" if profile.get("ifconfig") else "dhcp",
    }


def begin_network_activation(
    value,
    watchdog=None,
    network_module=None,
):
    """Start station association so other boot work can proceed in parallel."""
    if network_module is None:
        import network as network_module
    config = normalize_config(value)
    network_module.hostname(config["hostname"])
    _feed(watchdog)
    station = None
    if config["mode"] == MODE_STATION:
        station = _begin_station(config, network_module, watchdog)
    return {
        "config": config,
        "station": station,
        "network_module": network_module,
    }


def finish_network_activation(
    activation,
    timeout_ms=20000,
    watchdog=None,
    time_module=None,
):
    """Finish a previously started association and apply AP fallback."""
    if time_module is None:
        import time as time_module
    config = activation["config"]
    network_module = activation["network_module"]
    if config["mode"] == MODE_ACCESS_POINT:
        result = _activate_access_point(config, network_module, watchdog)
        result["requested_mode"] = MODE_ACCESS_POINT
        result["fallback"] = False
        return result

    result = _finish_station(
        config,
        activation["station"],
        timeout_ms,
        network_module,
        time_module,
        watchdog,
    )
    result["requested_mode"] = MODE_STATION
    result["fallback"] = False
    if result["ready"] or not config["fallback_to_access_point"]:
        return result

    station_status = result["status"]
    fallback = _activate_access_point(config, network_module, watchdog)
    fallback["requested_mode"] = MODE_STATION
    fallback["fallback"] = True
    fallback["station_status"] = station_status
    return fallback


def activate_network(
    value,
    timeout_ms=20000,
    watchdog=None,
    network_module=None,
    time_module=None,
):
    """Activate the requested profile and return a password-free status."""
    if network_module is None:
        import network as network_module
    if time_module is None:
        import time as time_module

    activation = begin_network_activation(
        value,
        watchdog=watchdog,
        network_module=network_module,
    )
    return finish_network_activation(
        activation,
        timeout_ms=timeout_ms,
        watchdog=watchdog,
        time_module=time_module,
    )


def public_network_state(result):
    """Return the stable, credential-free subset exposed by the HTTP service."""
    keys = (
        "mode",
        "requested_mode",
        "fallback",
        "status",
        "station_status",
        "ssid",
        "address",
        "address_mode",
        "channel",
    )
    return {key: result[key] for key in keys if key in result}
