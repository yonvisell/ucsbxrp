export const SIMULATED_XRPLIB_FILES: Record<string, string> = {
  "XRPLib/__init__.py":
    '"""Simulated hardware subset of XRPLib for the UCSB virtual XRP."""\n',
  "XRPLib/encoded_motor.py": `import xrp_sim_bridge


def _bounded_effort(value):
    return max(-1.0, min(1.0, float(value)))


class EncodedMotor:
    _instances = {}

    def __init__(self, side):
        self.side = side

    @classmethod
    def get_default_encoded_motor(cls, index=1):
        if index not in (1, 2):
            raise ValueError("virtual XRP supports encoded motor 1 or 2")
        if index not in cls._instances:
            cls._instances[index] = cls("left" if index == 1 else "right")
        return cls._instances[index]

    def set_effort(self, effort):
        xrp_sim_bridge.set_motor_effort(
            self.side,
            _bounded_effort(effort),
        )

    def coast(self):
        self.set_effort(0.0)

    def brake(self):
        self.set_effort(0.0)

    def get_position_counts(self):
        return int(xrp_sim_bridge.get_encoder_count(self.side))

    def reset_encoder_position(self):
        xrp_sim_bridge.reset_encoder(self.side)


`,
  "XRPLib/board.py": `import xrp_sim_bridge


class Board:
    _instance = None

    @classmethod
    def get_default_board(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def is_button_pressed(self):
        return bool(xrp_sim_bridge.is_button_pressed())

    def wait_for_button(self):
        return None

    def get_battery_voltage(self):
        return float(xrp_sim_bridge.get_battery_v())


`,
  "XRPLib/rangefinder.py": `import xrp_sim_bridge


class Rangefinder:
    _instance = None

    @classmethod
    def get_default_rangefinder(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def distance(self):
        distance_mm = xrp_sim_bridge.get_range_mm()
        return 65535 if distance_mm is None else float(distance_mm) / 10.0
`,
  "XRPLib/imu.py": `import xrp_sim_bridge


class IMU:
    _instance = None

    @classmethod
    def get_default_imu(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def get_acc_rates(self):
        return tuple(xrp_sim_bridge.get_acceleration_mg())

    def get_gyro_rates(self):
        return tuple(xrp_sim_bridge.get_angular_rate_mdps())

    def temperature(self):
        return float(xrp_sim_bridge.get_temperature_c())
`,
};
