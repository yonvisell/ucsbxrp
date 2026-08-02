"""Observation and delivery task for Challenge 5."""

from ucsb_xrp import ArenaMap, DeliveryTask, NavigationGoal, Pose


DELIVERY_TASK = DeliveryTask(
    initial_pose=Pose(0.0, 0.0, 0.0),
    arena=ArenaMap(
        bounds_mm=(-200.0, -500.0, 1100.0, 500.0),
        obstacles=(
            (350.0, -350.0, 450.0, -100.0),
            (350.0, 100.0, 450.0, 350.0),
        ),
        features={"center_gate": (350.0, -100.0, 450.0, 100.0)},
    ),
    grid_resolution_mm=100.0,
    clearance_mm=35.0,
    destination=NavigationGoal(900.0, 0.0, 0.0),
    observed_feature_name="center_gate",
    range_sample_count=7,
    minimum_usable_range_count=4,
    blocked_range_threshold_mm=500.0,
    assume_blocked_without_range=True,
)
