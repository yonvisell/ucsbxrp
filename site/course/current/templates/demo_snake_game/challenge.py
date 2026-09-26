# SnakeGame settings shared by the virtual and physical XRP.

from ucsb_xrp import load_world

try:
    import xrp_sim_bridge  # Available only in the browser's virtual XRP.
    WORLD = load_world()
except ImportError:
    # Physical runs use the bounded physical Snake arena when no browser bridge exists.
    WORLD = load_world(world_id="snake-physical")
