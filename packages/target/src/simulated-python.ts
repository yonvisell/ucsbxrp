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
        self._position_counts = 0

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
        return self._position_counts

    def reset_encoder_position(self):
        self._position_counts = 0


`,
  "XRPLib/board.py": `class Board:
    _instance = None

    @classmethod
    def get_default_board(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def is_button_pressed(self):
        return False

    def wait_for_button(self):
        return None


`,
  "XRPLib/rangefinder.py": `class Rangefinder:
    _instance = None

    @classmethod
    def get_default_rangefinder(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def distance(self):
        return 65535
`,
};
