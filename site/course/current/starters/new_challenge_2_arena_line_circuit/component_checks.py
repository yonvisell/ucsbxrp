# Hardware-free checks call student classes directly, regardless of Run selectors.
from line_follower import LineFollower
from ucsb_xrp.component_checks import run_component_checks


def check_line_follower():
    run_component_checks(line_follower=LineFollower)

from sensor_processor import SensorProcessor
from differential_drive import DifferentialDrive


def check_reflectance_preservation():
    run_component_checks(contracts=("sensor_processor.reflectance",), sensor_processor=SensorProcessor)


run_component_checks(SensorProcessor, DifferentialDrive, LineFollower, include_reflectance=True)
