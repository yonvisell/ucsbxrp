"""Observation and delivery task for Challenge 5."""

from ucsb_xrp import DeliveryTask, load_world


WORLD = load_world()
DELIVERY_TASK = DeliveryTask(
    initial_pose=WORLD.initial_pose,
    arena=WORLD.arena_map(),
    grid_resolution_mm=100.0,
    clearance_mm=35.0,
    destination=WORLD.waypoint("destination"),
    observed_feature_name="center_gate",
    range_sample_count=7,
    minimum_usable_range_count=4,
    blocked_range_threshold_mm=500.0,
    assume_blocked_without_range=True,
)
