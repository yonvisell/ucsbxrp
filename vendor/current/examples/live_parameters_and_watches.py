"""Declare adjustable values and publish named intermediate results."""

from ucsb_xrp import live


GAIN = live.number(
    "gain",
    0.5,
    minimum=0.0,
    maximum=1.0,
    step=0.05,
    label="Controller gain",
)
CONTROLLER_ENABLED = live.toggle(
    "controller_enabled",
    True,
    label="Controller enabled",
)
ERROR_SIGN = live.choice(
    "error_sign",
    "positive",
    options=("positive", "negative"),
    label="Example error",
)

error_mm = 40.0 if ERROR_SIGN.value == "positive" else -40.0
correction = GAIN.value * error_mm if CONTROLLER_ENABLED.value else 0.0

live.watch("error_mm", error_mm, unit="mm", label="Position error")
live.watch("correction", correction, label="Controller correction")
live.apply_updates()

print("final_correction:", correction)
