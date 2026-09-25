"""Small, testable Wi-Fi profile support for the XRP course service."""

MODE_STATION = "station"
MODE_ACCESS_POINT = "access_point"
CONFIG_VERSION = 2
STATION_CONNECT_TIMEOUT_MS = 20000
STATION_ATTEMPT_TIMEOUT_MS = 7000
STATION_RETRY_DELAY_MS = 500
STATION_MAX_ATTEMPTS = 3
STATION_RECOVERY_RETRY_MS = 10000
STATION_CONFIGURATION_ERRORS = (
    "wrong_password", "network_mismatch", "address_configuration_mismatch",
)

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
        # Retain this field for older setup tools, but never restore implicit AP.
        "fallback_to_access_point": False,
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
    if (
        not isinstance(value, (bytes, bytearray))
        or len(value) != 6
        or not any(value)
        or all(part == 255 for part in value)
    ):
        raise RuntimeError("The XRP radio did not report a usable MAC address")
    return "{:02X}{:02X}".format(value[-2], value[-1])


def _access_point_identity(ap, profile):
    mac = ap.config("mac")
    suffix = _mac_suffix(mac)
    ssid = profile.get("ssid") or "UCSB-XRP-{}".format(suffix)
    channel = profile.get("channel")
    if channel is None:
        channel = DEFAULT_AP_CHANNELS[mac[-1] % len(DEFAULT_AP_CHANNELS)]
    return ssid, channel


def _station_power_management(wlan, network_module, apply=False):
    """Apply or inspect the responsive station-radio setting."""
    result = {
        "requested": "disabled",
        "verified": False,
    }
    pm_none = getattr(getattr(network_module, "WLAN", None), "PM_NONE", None)
    if pm_none is None:
        pm_none = getattr(network_module, "PM_NONE", None)
    if pm_none is None:
        result["status"] = "unsupported"
        return result

    if apply:
        try:
            wlan.config(pm=pm_none)
        except Exception as exc:
            result["status"] = "set_failed"
            result["detail"] = type(exc).__name__
            return result

    try:
        observed = wlan.config("pm")
    except Exception as exc:
        result["status"] = "read_failed"
        result["detail"] = type(exc).__name__
        return result

    result["observed"] = observed
    result["verified"] = observed == pm_none
    result["status"] = "verified" if result["verified"] else "mismatch"
    return result


def _usable_address(value):
    if not isinstance(value, str):
        return False
    parts = value.split(".")
    if len(parts) != 4:
        return False
    try:
        octets = tuple(int(part) for part in parts)
    except ValueError:
        return False
    return (
        all(0 <= part <= 255 for part in octets)
        and 0 < octets[0] < 224
        and octets[0] != 127
    )


def _station_state(wlan, network_module):
    """Read the actual radio and address state, including DHCP completion."""
    active = bool(wlan.active())
    connected = active and bool(wlan.isconnected())
    dhcp_enabled = bool(wlan.ipconfig("dhcp4"))
    dhcp_bound = dhcp_enabled and bool(wlan.ipconfig("has_dhcp4"))
    address = wlan.ifconfig()[0] if connected else None
    address_ready = _usable_address(address) and (
        not dhcp_enabled or dhcp_bound
    )
    status = _status_name(network_module, wlan.status()) if active else "inactive"
    ready = connected and address_ready and status == "connected"
    if connected and not address_ready:
        status = "waiting_for_ip"
    return {
        "ready": bool(ready),
        "connected": connected,
        "status": status,
        "ssid": wlan.config("ssid") if connected else None,
        "address": address if ready else None,
        "address_mode": "dhcp" if dhcp_enabled else "static",
        "dhcp_enabled": dhcp_enabled,
        "dhcp_bound": dhcp_bound,
    }


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
    # On a cold CYW43 driver, reading active() does not initialize its MAC.
    # Setting False does initialize it while keeping the AP off; configure the
    # real device name and password before enabling any hotspot broadcast.
    ap.active(False)
    _feed(watchdog)
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
    active = bool(ap.active())
    address = ap.ifconfig()[0] if active else None
    ready = active and _usable_address(address)
    return {
        "ready": ready,
        "connected": active and bool(ap.isconnected()),
        "mode": MODE_ACCESS_POINT,
        "status": "ready" if ready else "inactive",
        "hostname": config["hostname"],
        "ssid": ap.config("ssid"),
        "address": address if ready else None,
        "address_mode": "static",
        "channel": ap.config("channel"),
    }


def _begin_station(config, network_module, watchdog, reset_radio=False):
    ap = network_module.WLAN(_interface_id(network_module, "IF_AP", "AP_IF"))
    if ap.active():
        ap.active(False)
    network_module.hostname(config["hostname"])

    profile = config["station"]
    wlan = network_module.WLAN(
        _interface_id(network_module, "IF_STA", "STA_IF")
    )
    if reset_radio or wlan.active():
        # A warm USB activation can still observe the previous authenticated
        # link after disconnect() returns. Deactivate it before every new join,
        # including the first attempt, so old DHCP/SSID state cannot validate
        # new credentials or become a spurious configuration failure.
        try:
            wlan.disconnect()
        except Exception:
            pass
        _feed(watchdog)
        wlan.active(False)
        _feed(watchdog)
    wlan.active(True)
    # RP2 Wi-Fi power saving can leave a station reporting "connected" while
    # incoming HTTP requests stall. The XRP is an interactive robot, so a
    # responsive link is more useful here than the small radio-power saving.
    power_management = _station_power_management(
        wlan,
        network_module,
        apply=True,
    )
    if wlan.isconnected():
        # Setup must test the saved credentials even when the SSID is unchanged.
        # An existing authenticated link would otherwise hide a new bad password
        # until the controller restarts.
        wlan.disconnect()
    if profile.get("ifconfig"):
        wlan.ifconfig(tuple(profile["ifconfig"]))
    else:
        # This request is nonblocking on the pinned CYW43 firmware. In contrast,
        # ifconfig('dhcp') can block for 10 seconds without feeding the watchdog.
        # Explicitly restore DHCP after a previous static-address profile.
        wlan.ipconfig(dhcp4=True)
    # A disconnect can complete asynchronously. Always submit the new join;
    # an immediate isconnected() result must not retain the old credentials.
    wlan.connect(profile["ssid"], profile["password"])
    _feed(watchdog)
    return wlan, power_management


def _start_station_attempt(activation, watchdog, time_module):
    """Submit one nonblocking join, restarting a failed radio between attempts."""
    config = activation["config"]
    network_module = activation["network_module"]
    activation["attempt_started_ms"] = time_module.ticks_ms()
    activation["attempts"] += 1
    activation["next_retry_ms"] = None
    activation["interface_error"] = None
    _feed(watchdog)
    try:
        station, power_management = _begin_station(
            config, network_module, watchdog,
            reset_radio=activation["attempts"] > 1 or activation.get("recovering", False),
        )
        activation["station"] = station
        activation["power_management"] = power_management
    except Exception as exc:
        # Radio availability is not evidence that a verified runtime is broken.
        # Driver error text can contain supplied values; retain only its class.
        activation["interface_error"] = type(exc).__name__
    _feed(watchdog)


def _validate_station_observation(state, profile):
    """Keep live radio observations separate from profile readiness."""
    if state["ready"]:
        expected_mode = "static" if profile.get("ifconfig") else "dhcp"
        if (
            state["address_mode"] != expected_mode
            or (profile.get("ifconfig") and state["address"] != profile["ifconfig"][0])
        ):
            state["ready"] = False
            state["address"] = None
            state["status"] = "address_configuration_mismatch"
        elif state["ssid"] != profile["ssid"]:
            state["ready"] = False
            state["address"] = None
            state["status"] = "network_mismatch"


def _station_observation(activation):
    config = activation["config"]
    profile = config["station"]
    try:
        state = _station_state(activation["station"], activation["network_module"])
    except Exception as exc:
        state = {
            "ready": False, "connected": False, "status": "unavailable",
            "address": None, "ssid": None, "interface_error": type(exc).__name__,
        }
    if activation.get("interface_error") and not state["ready"]:
        state["status"] = "unavailable"
        state["interface_error"] = activation["interface_error"]
    _validate_station_observation(state, profile)
    state.update({
        "mode": MODE_STATION, "requested_mode": MODE_STATION, "fallback": False,
        "hostname": config["hostname"], "ssid": state["ssid"] or profile["ssid"],
        "power_management": activation.get("power_management"),
    })
    return state


def poll_network_activation(
    activation, timeout_ms=STATION_CONNECT_TIMEOUT_MS, watchdog=None,
    time_module=None, background=False,
):
    """Advance station recovery once, without sleeping or changing network mode."""
    if time_module is None:
        import time as time_module
    _feed(watchdog)
    now = time_module.ticks_ms()
    state = _station_observation(activation)
    if state["ready"]:
        activation["completed"] = True
        activation["blocked_status"] = None
        activation["next_retry_ms"] = None
        activation["recovery_ms"] = None
    elif state["status"] in STATION_CONFIGURATION_ERRORS:
        activation["completed"] = True
        activation["blocked_status"] = state["status"]
        activation["last_failure"] = state["status"]
        activation["next_retry_ms"] = None
        activation["recovery_ms"] = None
    elif activation["completed"]:
        if activation.get("blocked_status"):
            state["status"] = activation["blocked_status"]
        elif background:
            recovery_ms = activation.get("recovery_ms")
            if recovery_ms is None:
                recovery_ms = time_module.ticks_add(now, STATION_RECOVERY_RETRY_MS)
                activation["recovery_ms"] = recovery_ms
            if time_module.ticks_diff(now, recovery_ms) >= 0:
                activation.update({
                    "started_ms": now, "attempts": 0, "completed": False,
                    "completed_ms": None, "recovering": True, "recovery_ms": None,
                })
                _start_station_attempt(activation, watchdog, time_module)
                state = _station_observation(activation)
                now = time_module.ticks_ms()

    if not activation["completed"]:
        deadline = time_module.ticks_add(activation["started_ms"], timeout_ms)
        retry_ms = activation.get("next_retry_ms")
        if (
            not state["ready"] and retry_ms is not None
            and time_module.ticks_diff(now, retry_ms) >= 0
            and time_module.ticks_diff(deadline, now) > 0
        ):
            _start_station_attempt(activation, watchdog, time_module)
            state = _station_observation(activation)
            now = time_module.ticks_ms()
        if state["ready"]:
            activation["completed"] = True
            activation["next_retry_ms"] = None
        elif state["status"] in STATION_CONFIGURATION_ERRORS:
            activation["completed"] = True
            activation["blocked_status"] = state["status"]
            activation["last_failure"] = state["status"]
            activation["next_retry_ms"] = None
        elif time_module.ticks_diff(deadline, now) <= 0:
            activation["completed"] = True
            activation["last_failure"] = state["status"]
            activation["next_retry_ms"] = None
        elif activation.get("next_retry_ms") is None and (
            state["status"] in ("network_not_found", "connect_failed", "unavailable", "inactive")
            or (
                state["status"] != "waiting_for_ip"
                and time_module.ticks_diff(now, activation["attempt_started_ms"])
                >= STATION_ATTEMPT_TIMEOUT_MS
            )
        ):
            activation["last_failure"] = state["status"]
            if activation["attempts"] >= STATION_MAX_ATTEMPTS:
                activation["completed"] = True
            else:
                activation["next_retry_ms"] = time_module.ticks_add(now, STATION_RETRY_DELAY_MS)

    if activation["completed"] and activation.get("completed_ms") is None:
        activation["completed_ms"] = now
    elapsed_end = activation.get("completed_ms")
    if elapsed_end is None:
        elapsed_end = now
    retry_ms = activation.get("next_retry_ms")
    if retry_ms is None:
        retry_ms = activation.get("recovery_ms")
    state.update({
        "connection_attempts": activation["attempts"],
        "connection_elapsed_ms": max(0, time_module.ticks_diff(elapsed_end, activation["started_ms"])),
        "retry_in_ms": max(0, time_module.ticks_diff(retry_ms, now)) if retry_ms is not None else None,
        "last_failure": activation.get("last_failure"),
    })
    _feed(watchdog)
    return state


def begin_network_activation(
    value,
    watchdog=None,
    network_module=None,
    time_module=None,
):
    """Start station association so other boot work can proceed in parallel."""
    if network_module is None:
        import network as network_module
    if time_module is None:
        import time as time_module
    config = normalize_config(value)
    _feed(watchdog)
    started_ms = time_module.ticks_ms()
    activation = {
        "config": config, "station": None, "power_management": None,
        "network_module": network_module, "started_ms": started_ms,
        "attempts": 0, "completed": False, "completed_ms": None, "blocked_status": None,
        "next_retry_ms": None, "recovery_ms": None,
    }
    if config["mode"] == MODE_STATION:
        _start_station_attempt(activation, watchdog, time_module)
    else:
        network_module.hostname(config["hostname"])
    return activation


def finish_network_activation(
    activation,
    timeout_ms=STATION_CONNECT_TIMEOUT_MS,
    watchdog=None,
    time_module=None,
):
    """Wait for the requested mode within its shared, watchdog-fed boot budget."""
    if time_module is None:
        import time as time_module
    config = activation["config"]
    network_module = activation["network_module"]
    if config["mode"] == MODE_ACCESS_POINT:
        result = _activate_access_point(config, network_module, watchdog)
        result["requested_mode"] = MODE_ACCESS_POINT
        result["fallback"] = False
        return result

    while True:
        result = poll_network_activation(
            activation, timeout_ms=timeout_ms, watchdog=watchdog, time_module=time_module,
        )
        if activation["completed"]:
            return result
        remaining_ms = timeout_ms - time_module.ticks_diff(time_module.ticks_ms(), activation["started_ms"])
        time_module.sleep_ms(min(100, max(1, remaining_ms)))


def activate_network(
    value,
    timeout_ms=STATION_CONNECT_TIMEOUT_MS,
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
        time_module=time_module,
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
        "ready",
        "connected",
        "mode",
        "requested_mode",
        "fallback",
        "status",
        "station_status",
        "ssid",
        "address",
        "address_mode",
        "dhcp_enabled",
        "dhcp_bound",
        "channel",
        "power_management",
        "station_power_management",
        "interface_error",
        "connection_attempts",
        "connection_elapsed_ms",
        "retry_in_ms",
        "last_failure",
    )
    return {key: result[key] for key in keys if key in result}


def current_network_state(result, network_module=None, station_profile=None):
    """Refresh address and link status from the active WLAN interface."""
    if network_module is None:
        import network as network_module
    current = dict(result) if isinstance(result, dict) else {}
    mode = current.get("mode")
    if mode not in (MODE_STATION, MODE_ACCESS_POINT):
        return current

    interface_name = "IF_STA" if mode == MODE_STATION else "IF_AP"
    legacy_name = "STA_IF" if mode == MODE_STATION else "AP_IF"
    try:
        wlan = network_module.WLAN(
            _interface_id(network_module, interface_name, legacy_name)
        )
        if mode == MODE_STATION:
            state = _station_state(wlan, network_module)
            if station_profile is not None:
                _validate_station_observation(state, station_profile)
            elif current.get("status") in ("network_mismatch", "address_configuration_mismatch"):
                # Callers without the selected profile cannot prove that a
                # previously rejected network/address is now acceptable.
                state["ready"] = False
                state["address"] = None
                state["status"] = current["status"]
            if not state["ready"] and current.get("status") == "wrong_password":
                # Preserve a diagnosed configuration failure if the driver
                # later settles to idle; that must not hide a rejected password.
                state["status"] = current["status"]
            if not state["ssid"]:
                state["ssid"] = current.get("ssid")
            current.update(state)
            current["power_management"] = _station_power_management(
                wlan,
                network_module,
            )
        else:
            active = bool(wlan.active())
            address = wlan.ifconfig()[0] if active else None
            current["ready"] = active and _usable_address(address)
            current["connected"] = active and bool(wlan.isconnected())
            current["status"] = "ready" if current["ready"] else "inactive"
            current["address"] = address if current["ready"] else None
            if active:
                current["ssid"] = wlan.config("ssid")
                current["channel"] = wlan.config("channel")
        current.pop("interface_error", None)
    except Exception as exc:
        # Never publish a boot-time address after the interface can no longer
        # be inspected; that would direct clients to a possibly stale host.
        current["ready"] = False
        current["connected"] = False
        current["status"] = "unavailable"
        current["address"] = None
        current["interface_error"] = type(exc).__name__
    return current
