"""Convert encoder readings and device time into wheel measurements."""

from ucsb_xrp.student_api import SensorModelBase


class SensorModel(SensorModelBase):
    """Retain measurement history for one run and return physical values."""

    def reset(self, raw):
        # Save this run's count and time origins and initialize speed state.
        # Return Measurements with zero wheel travel and the raw range/button.
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        # Compare raw with reset and the preceding sample. Return positions,
        # latest increments, regularized speeds, elapsed time, range, and button.
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        # Range estimation is introduced in Challenge 5.
        raise NotImplementedError("Complete SensorModel.estimate_range in Challenge 5")
