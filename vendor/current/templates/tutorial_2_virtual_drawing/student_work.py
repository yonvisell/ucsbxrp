"""Describe a drawing for the Tutorial 2 virtual-robot runner."""


class DrawingSegment:
    """One constant forward-speed and turn-rate command held for several samples."""

    def __init__(self, name, forward_speed_mm_s, turn_rate_rad_s, steps):
        raise NotImplementedError("complete DrawingSegment.__init__")


def build_drawing():
    """Return eight segments that alternate between a side and a left turn."""
    raise NotImplementedError("complete build_drawing")
