# SnakeGame settings shared by the virtual and physical XRP.

from ucsb_xrp import load_world

try:
    import xrp_sim_bridge  # Available only in the browser's virtual XRP.
    # Read selected-world markers and geometry from the same source as the simulator.
    WORLD = load_world()
except ImportError:
    WORLD = load_world(world_id="snake-physical")
