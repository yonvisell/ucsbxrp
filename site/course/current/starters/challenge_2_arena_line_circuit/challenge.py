from sys import platform
from ucsb_xrp import Pose, load_world


# Physical runs use a local origin; only virtual runs use the selected track pose.
INITIAL_POSE = Pose(0.0, 0.0, 0.0) if platform == "rp2" else load_world().initial_pose
MAXIMUM_LOST_LINE_S = 0.4  # End the run after neither sensor detects tape for this long [s].
