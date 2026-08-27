"""Observation and delivery task for Challenge 5."""

from ucsb_xrp import DeliveryTask, load_world


# WORLD is the case selected in the Monitor. It determines the virtual range
# measurement and the start and destination shown to the student.
WORLD = load_world()

# Both cases use one dimensioned mission map. The gate-blocked entry defines
# the location and name of the changeable gate. DeliveryMission then marks that
# gate open or blocked from the measured range; it does not assume the selected
# virtual case is the answer.
MISSION_MAP_WORLD_ID = "gate-blocked"
MISSION_MAP_WORLD = load_world(world_id=MISSION_MAP_WORLD_ID)

DELIVERY_TASK = DeliveryTask(
    initial_pose=WORLD.initial_pose,
    arena=MISSION_MAP_WORLD.arena_map(),
    grid_resolution_mm=100.0,
    clearance_mm=35.0,
    destination=WORLD.waypoint("destination"),
    observed_feature_name="center_gate",
    range_sample_count=7,
    minimum_usable_range_count=4,
    blocked_range_threshold_mm=500.0,
    assume_blocked_without_range=True,
)
