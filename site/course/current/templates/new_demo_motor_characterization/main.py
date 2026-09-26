# Measure motor effort versus wheel speed without wheel-speed feedback.
from time import sleep_ms
from experiment import (
    EFFORTS,
    EFFORT_DURATION_S,
    MAXIMUM_WHEEL_TRAVEL_MM,
    ZERO_DURATION_S,
)
from robot_setup import ROBOT_CONFIG
from live_variables import publish_motor_values
from ucsb_xrp import DriveCommand, XRPBot, elapsed_time_s
from ucsb_xrp_reference import SensorProcessor

# Direct XRPBot commands bypass Robot's wheel-speed feedback.
bot = XRPBot(ROBOT_CONFIG)
model = SensorProcessor(ROBOT_CONFIG)
bot.stop()
try:  # Ensure finally stops motors on exit.
    bot.reset_encoders()
    # Use the first raw reading after encoder reset as the measurement origin.
    measurements = model.reset(bot.read())
    # Repeat zero command, commanded effort, and zero command at each level.
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
                sleep_ms(ROBOT_CONFIG.sample_period_ms)  # Robot.step would supply this delay.
                measurements = model.update(bot.read())
                wheel_travel_mm = max(
                    abs(measurements.left_position_mm),
                    abs(measurements.right_position_mm),
                )
                if wheel_travel_mm > MAXIMUM_WHEEL_TRAVEL_MM:  # Bound either wheel's travel.
                    raise RuntimeError("Characterization travel limit reached")
                publish_motor_values(command, measurements)
            print("effort:", command, "wheel_speeds_mm_s:", measurements.wheel_speeds)
    print("Motor characterization complete")
finally:
    bot.stop()
