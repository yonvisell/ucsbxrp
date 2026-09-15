"""Editable decision policy; missing evidence does not mean an open gate."""
def observed_gate(estimate_mm, threshold_mm):
    if estimate_mm is None:
        return None
    return estimate_mm <= threshold_mm
