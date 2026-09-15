"""Measure motor effort versus wheel speed without wheel-speed feedback."""
from time import sleep_ms
from experiment import (
    EFFORTS,
    EFFORT_DURATION_S,
    MAXIMUM_WHEEL_TRAVEL_MM,
    ZERO_DURATION_S,
)
from robot_config import ROBOT_CONFIG
from ucsb_xrp import DriveCommand, XRPBot, elapsed_time_s, live
from ucsb_xrp_reference import SensorModel

def run_demo():
    bot = XRPBot(ROBOT_CONFIG)
    model = SensorModel(ROBOT_CONFIG)
    bot.stop()
    try:
        bot.reset_encoders()
        measurements = model.reset(bot.read())
        for effort in EFFORTS:
            if not 0.0 <= effort <= 0.3:
                raise ValueError("Characterization effort must be within [0, 0.3]")
            intervals = (
                (0.0, ZERO_DURATION_S),
                (effort, EFFORT_DURATION_S),
                (0.0, ZERO_DURATION_S),
            )
            for command, duration_s in intervals:
                if duration_s <= 0 or duration_s > 1.0:
                    raise ValueError("Each effort interval must be within (0, 1] s")
                start_ms = measurements.time_ms
                bot.set_drive(DriveCommand(command, command))
                while elapsed_time_s(measurements.time_ms, start_ms) < duration_s:
                    # This program uses XRPBot directly, so it owns sampling;
                    # never add this delay to a Robot.step() loop.
                    sleep_ms(ROBOT_CONFIG.sample_period_ms)
                    measurements = model.update(bot.read())
                    wheel_travel_mm = max(
                        abs(measurements.left_position_mm),
                        abs(measurements.right_position_mm),
                    )
                    if wheel_travel_mm > MAXIMUM_WHEEL_TRAVEL_MM:
                        raise RuntimeError("Characterization travel limit reached")
                    live.plot("effort", command)
                    live.plot("left_speed_mm_s", measurements.wheel_speeds.left_mm_s)
                    live.plot("right_speed_mm_s", measurements.wheel_speeds.right_mm_s)
                print("effort:", command, "wheel_speeds_mm_s:", measurements.wheel_speeds)
        print("Motor characterization complete")
    finally:  # Stop the motors after normal completion or a Python exception.
        bot.stop()

run_demo()
