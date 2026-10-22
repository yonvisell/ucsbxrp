# Challenge 2.1: Record both floor sensors with zero motor effort.
# This supplied program is complete; no implementation or tuning is required.

from time import sleep_ms
from ucsb_xrp import RobotConfig, XRPBot, live

SAMPLE_PERIOD_MS = 20  # Wait 20 ms between successive reflectance readings.

left_plot = live.register_plot("reflectance_left", label="Left reflectance")  # Create the left reflectance plot.
right_plot = live.register_plot("reflectance_right", label="Right reflectance")  # Create the right reflectance plot.
bot = XRPBot(RobotConfig(sample_period_ms=SAMPLE_PERIOD_MS))  # Connect to the selected XRP.
try:
    bot.stop()  # Keep both motors stopped.
    while True:  # Record until Stop is pressed.
        raw = bot.read(include_reflectance=True)  # Read both reflectance sensors.
        if raw.reflectance is None:
            raise RuntimeError("Reflectance sensors are unavailable.")
        left_plot.value = raw.reflectance.left  # Plot the raw left reading.
        right_plot.value = raw.reflectance.right  # Plot the raw right reading.
        live.apply_updates()  # Publish both plot values.
        sleep_ms(SAMPLE_PERIOD_MS)  # Wait for the next sample.
finally:
    bot.stop()  # Keep both motors stopped.
