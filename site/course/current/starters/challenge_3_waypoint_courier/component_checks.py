# Check the project component calculations
# Select Run code tests in the IDE

from differential_drive import DifferentialDrive
from navigation_controller import NavigationController
from localization import Localization
from sensor_processor import SensorProcessor

from ucsb_xrp.component_checks import run_component_checks


run_component_checks(
    SensorProcessor,
    DifferentialDrive,
    navigation_controller=NavigationController,
    localization=Localization,
)
