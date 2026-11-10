"""Bounded direct camera-pose input. Network work stays on the service core.

The sender maps its capture clock using the sync reply before sending a pose.
Clock uncertainty includes half the measured round trip. The receiver never
mistakes arrival time for exposure time. This is a classroom LAN protocol,
not an authenticated remote-control service; it carries measurements only.
"""

import json
import math

PORT = 5810
MAX_PACKET_BYTES = 768
MAX_PACKETS_PER_POLL = 4
SESSION_TTL_MS = 30000
MAX_CLOCK_UNCERTAINTY_MS = 100.0
MAX_CAPTURE_AGE_MS = 5000
MAX_RETIRED_EPOCHS = 16


def _integer(value):
    return isinstance(value, int) and not isinstance(value, bool)


def _number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def _epoch(value):
    return isinstance(value, str) and 0 < len(value) <= 64


class PoseReceiver:
    def __init__(self, robot_id, clock_id, publish, make_fix, make_pose, clock, ticks_diff, ticks_period_ms=1073741824):
        self.robot_id = robot_id
        self.clock_id = clock_id
        self.publish = publish
        self.make_fix = make_fix
        self.make_pose = make_pose
        self.clock = clock
        self.ticks_diff = ticks_diff
        self.ticks_period_ms = ticks_period_ms
        self.socket = None
        self.session = None
        self.retired_epochs = []
        self.accepted = 0
        self.rejected = 0

    def open(self):
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            sock.setblocking(False)
            sock.bind(("0.0.0.0", PORT))
        except Exception:
            sock.close()
            raise
        self.socket = sock

    def close(self):
        if self.socket is not None:
            self.socket.close()
            self.socket = None

    def handle(self, data, address):
        received = self.clock()
        if len(data) > MAX_PACKET_BYTES:
            self.rejected += 1
            return None
        try:
            value = json.loads(data)
            if not isinstance(value, dict) or not _integer(value.get("v")) or value.get("v") != 1 or value.get("robot_id") != self.robot_id:
                raise ValueError("identity")
            source = value.get("source_epoch")
            if not _epoch(source):
                raise ValueError("source epoch")
            if value.get("type") == "sync":
                token = value.get("token")
                if not _integer(token) or not 0 <= token < 2147483648:
                    raise ValueError("sync token")
                if source in self.retired_epochs:
                    raise ValueError("retired source")
                # An epoch switch retires the preceding sender session. The
                # next pose must echo this boot clock, endpoint and epoch.
                if self.session is not None and self.session[:2] == (address, source):
                    sequence = self.session[3]
                else:
                    sequence = -1
                    if self.session is not None and source != self.session[1]:
                        if len(self.retired_epochs) >= MAX_RETIRED_EPOCHS:
                            self.retired_epochs.pop(0)
                        self.retired_epochs.append(self.session[1])
                self.session = (address, source, received, sequence)
                return json.dumps({
                    "v": 1, "type": "sync_reply", "robot_id": self.robot_id,
                    "source_epoch": source, "token": token, "clock_id": self.clock_id,
                    "received_ms": received, "sent_ms": self.clock(),
                    "ticks_period_ms": self.ticks_period_ms,
                }).encode()
            if value.get("type") != "pose" or value.get("clock_id") != self.clock_id:
                raise ValueError("clock")
            session = self.session
            if session is None or session[:2] != (address, source) or not 0 <= self.ticks_diff(received, session[2]) <= SESSION_TTL_MS:
                raise ValueError("sync required")
            sequence = value.get("sequence")
            capture = value.get("capture_time_ms")
            uncertainty = value.get("clock_uncertainty_ms")
            if not _integer(sequence) or not session[3] < sequence < 2147483648:
                raise ValueError("sequence")
            if not _integer(capture) or not 0 <= capture < self.ticks_period_ms:
                raise ValueError("capture time")
            if not _number(uncertainty) or not 0 <= uncertainty <= MAX_CLOCK_UNCERTAINTY_MS:
                raise ValueError("clock uncertainty")
            age = self.ticks_diff(received, capture)
            if age < -uncertainty or age > MAX_CAPTURE_AGE_MS:
                raise ValueError("capture age")
            coordinates = (value.get("x_mm"), value.get("y_mm"), value.get("heading_rad"))
            if not all(_number(item) for item in coordinates) or max(abs(coordinates[0]), abs(coordinates[1])) > 100000:
                raise ValueError("pose")
            pose = self.make_pose(*coordinates)
            fix = self.make_fix(pose, capture, received, sequence, source, uncertainty)
            self.publish(fix)
            self.session = (address, source, session[2], sequence)
            self.accepted += 1
        except (ValueError, TypeError, KeyError, OverflowError):
            self.rejected += 1
        return None

    def poll(self):
        if self.socket is None:
            return
        for _ in range(MAX_PACKETS_PER_POLL):
            try:
                data, address = self.socket.recvfrom(MAX_PACKET_BYTES + 1)
            except OSError:
                break
            response = self.handle(data, address)
            if response is not None:
                try:
                    self.socket.sendto(response, address)
                except OSError:
                    pass
