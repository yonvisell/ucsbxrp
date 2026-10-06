# Measure motor effort versus wheel speed without wheel-speed feedback.
from time import sleep_ms, ticks_add, ticks_diff, ticks_ms
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
    measurement_start_ms = measurements.time_ms
    next_sample_ms = ticks_add(ticks_ms(), ROBOT_CONFIG.sample_period_ms)
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
                # Wait until the next scheduled sample, subtracting time spent computing.
                remaining_ms = ticks_diff(next_sample_ms, ticks_ms())
                if remaining_ms > 0:
                    sleep_ms(remaining_ms)
                measurements = model.update(bot.read())
                wheel_travel_mm = max(
                    abs(measurements.left_position_mm),
                    abs(measurements.right_position_mm),
                )
                if wheel_travel_mm > MAXIMUM_WHEEL_TRAVEL_MM:  # Bound either wheel's travel.
                    raise RuntimeError("Characterization travel limit reached")
                publish_motor_values(command, measurements, measurement_start_ms, ROBOT_CONFIG.sample_period_ms)
                next_sample_ms = ticks_add(next_sample_ms, ROBOT_CONFIG.sample_period_ms)
                # Skip missed intervals instead of taking several samples immediately.
                lateness_ms = ticks_diff(ticks_ms(), next_sample_ms)
                if lateness_ms >= 0:
                    missed = lateness_ms // ROBOT_CONFIG.sample_period_ms + 1
                    next_sample_ms = ticks_add(next_sample_ms, missed * ROBOT_CONFIG.sample_period_ms)
            print("effort:", command, "wheel_speeds_mm_s:", measurements.wheel_speeds)
    # Retain the final published measurement in one last stopped raw acquisition.
    bot.stop()
    bot.read()
    print("Motor characterization complete")
finally:
    bot.stop()
