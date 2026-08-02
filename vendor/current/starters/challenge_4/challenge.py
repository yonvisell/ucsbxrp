"""Dimensioned map and route for Challenge 4: Mapped Route."""

from ucsb_xrp import ArenaMap, NavigationGoal, Pose


INITIAL_POSE = Pose(100.0, 100.0, 0.0)
DESTINATION = NavigationGoal(1100.0, 700.0, 0.0)
ARENA_MAP = ArenaMap(
    bounds_mm=(0.0, 0.0, 1200.0, 800.0),
    obstacles=((450.0, 200.0, 750.0, 600.0),),
)
GRID_RESOLUTION_MM = 100.0
CLEARANCE_MM = 35.0
