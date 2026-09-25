# Inputs: estimated range and gate threshold in mm; estimate may be None.
# Returns: True for a blocked gate, False for an open gate, None without range.
def observed_gate(estimate_mm, threshold_mm):
    if estimate_mm is None:
        return None
    return estimate_mm <= threshold_mm
