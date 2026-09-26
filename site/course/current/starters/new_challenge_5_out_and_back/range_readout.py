# Print one raw range batch while the robot remains stopped.

from challenge import OUTBOUND_ROUTE, RANGE_COLLECTION_TIMEOUT_S, RANGE_SAMPLE_COUNT
from course_setup import make_robot
from robot_config import ROBOT_CONFIG
from ucsb_xrp import Pose


point = OUTBOUND_ROUTE[-1]
robot = make_robot(ROBOT_CONFIG)
try:  # Run this block, then stop the motors in finally.
    robot.start(Pose(point.x_mm, point.y_mm, point.heading_rad))  # Initialize the estimated observation pose; reset measurements.
    # Collect separate ultrasound readings; a missing echo is None.
    samples = robot.collect_range_samples(RANGE_SAMPLE_COUNT, timeout_s=RANGE_COLLECTION_TIMEOUT_S)
    print(samples)
finally:
    robot.stop()  # Stop after range collection or an exception.
