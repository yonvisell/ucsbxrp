# Supplied input/output checks exercise your files without moving the robot.

from differential_drive import DifferentialDrive
from sensor_processor import SensorProcessor
from ucsb_xrp.component_checks import run_component_checks


run_component_checks(SensorProcessor, DifferentialDrive)  # Check both student classes, regardless of the selectors used for Run.
