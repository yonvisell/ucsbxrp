"""Enter separately measured light-floor and dark-tape readings per sensor."""
from math import isfinite

LEFT_LIGHT = 0.0
LEFT_DARK = 1.0
RIGHT_LIGHT = 0.0
RIGHT_DARK = 1.0

def contrast(raw, light, dark):
    if not all(isfinite(value) for value in (raw, light, dark)) or dark - light < 0.1:
        raise ValueError("Measure a dark reading at least 0.1 above the light reading")
    return max(0.0, min(1.0, (raw - light) / (dark - light)))
