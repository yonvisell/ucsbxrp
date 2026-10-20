# Challenge 2.1: Record both floor sensors with zero motor effort.
# This supplied program is complete; no implementation or tuning is required.

from time import sleep_ms
from ucsb_xrp import RobotConfig, XRPBot, live

SAMPLE_PERIOD_MS = 20  # Wait 20 ms between successive reflectance readings.

left_plot = live.register_plot("reflectance_left", label="Left reflectance")  # Register the left sensor's dimensionless plot once.
right_plot = live.register_plot("reflectance_right", label="Right reflectance")  # Register the right sensor's dimensionless plot once.
bot = XRPBot(RobotConfig(sample_period_ms=SAMPLE_PERIOD_MS))  # Connect to the selected XRP's sensors and motors.
try:
    bot.stop()  # Set both motor efforts to zero before collecting measurements.
    while True:  # Continue collecting until the IDE or Monitor Stop command ends the run.
        raw = bot.read(include_reflectance=True)  # Read both floor sensors without controlling wheel speed.
        if raw.reflectance is None:
            raise RuntimeError("Reflectance sensors are unavailable.")  # Report missing readings instead of recording empty plots.
        left_plot.value = raw.reflectance.left  # Send the uncorrected left reading to its plot.
        right_plot.value = raw.reflectance.right  # Send the uncorrected right reading to its plot.
        live.apply_updates()  # Publish the two plot values to Monitor's live view.
        sleep_ms(SAMPLE_PERIOD_MS)  # Space the readings without applying wheel-speed feedback.
finally:
    bot.stop()  # Leave both motor efforts at zero after Stop or a program error.
