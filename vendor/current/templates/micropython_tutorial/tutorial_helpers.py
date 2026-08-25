"""Small reusable motion functions for Lessons 5 through 7."""

from time import sleep_ms

from ucsb_xrp import DriveCommand


def drive_for(bot, left_command, right_command, duration_ms):
    """Apply one bounded drive command for a positive number of milliseconds."""
    if duration_ms <= 0:
        raise ValueError("duration_ms must be positive")
    bot.set_drive(DriveCommand(left_command, right_command))
    try:
        sleep_ms(duration_ms)
    finally:
        bot.stop()


def drive_until_close(
    bot,
    left_command,
    right_command,
    stop_range_mm,
    time_limit_ms,
    sample_period_ms=50,
):
    """Drive until the range threshold or time limit; return the final range."""
    if stop_range_mm <= 0:
        raise ValueError("stop_range_mm must be positive")
    if time_limit_ms <= 0 or sample_period_ms <= 0:
        raise ValueError("time settings must be positive")

    elapsed_ms = 0
    bot.set_drive(DriveCommand(left_command, right_command))
    try:
        while elapsed_ms < time_limit_ms:
            sample = bot.read(include_range=True)
            if sample.range_mm is not None and sample.range_mm <= stop_range_mm:
                return sample.range_mm

            wait_ms = min(sample_period_ms, time_limit_ms - elapsed_ms)
            sleep_ms(wait_ms)
            elapsed_ms += wait_ms
        return None
    finally:
        bot.stop()
