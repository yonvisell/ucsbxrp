# Test Challenge 6 components without starting either robot.

from differential_drive import DifferentialDrive
from grid_planner import GridPlanner
from navigation_controller import NavigationController
from odometry import Odometry
from range_safety_controller import RangeSafetyController
from sensor_model import SensorModel
from wheel_speed_controller import WheelSpeedController

from ucsb_xrp.component_checks import run_component_checks
from ucsb_xrp.student_api import RangeSafetyControllerBase


run_component_checks(
    SensorModel,
    WheelSpeedController,
    DifferentialDrive,
    Odometry,
    NavigationController,
    GridPlanner,
    include_range=True,
)


def check_range_safety_controller():
    print("RangeSafetyController.update")
    print("USE request, measured speed, range, and every configured setting")
    try:
        controller = RangeSafetyController(0.20, 400.0, 120.0, 250.0)
        if not isinstance(controller, RangeSafetyControllerBase):
            print("FAIL RangeSafetyController must extend RangeSafetyControllerBase")
            return
        far = controller.update(220.0, 0.0, 1000.0)
        missing = controller.update(220.0, 0.0, None)
        zero = controller.update(0.0, 80.0, 1000.0)
        reverse = controller.update(-40.0, 0.0, 1000.0)
        bounded = controller.update(400.0, 0.0, 1000.0)

        # The same range is safe at a low measured speed but not after the
        # robot has accumulated substantially more kinetic energy.
        same_range_slow = controller.update(200.0, 60.0, 210.0)
        same_range_fast = controller.update(200.0, 220.0, 210.0)

        quick_response = RangeSafetyController(0.10, 300.0, 120.0, 300.0).update(
            260.0, 0.0, 240.0
        )
        delayed_response = RangeSafetyController(0.45, 300.0, 120.0, 300.0).update(
            260.0, 0.0, 240.0
        )
        weak_braking = RangeSafetyController(0.20, 200.0, 120.0, 300.0).update(
            260.0, 0.0, 240.0
        )
        strong_braking = RangeSafetyController(0.20, 800.0, 120.0, 300.0).update(
            260.0, 0.0, 240.0
        )
        small_margin = RangeSafetyController(0.20, 300.0, 80.0, 300.0).update(
            260.0, 0.0, 240.0
        )
        large_margin = RangeSafetyController(0.20, 300.0, 180.0, 300.0).update(
            260.0, 0.0, 240.0
        )

        observations = (
            ("far range moves", 0.0 < far <= 220.0, far),
            ("missing range stops", missing == 0.0, missing),
            ("zero request stops", zero == 0.0, zero),
            ("reverse request stops", reverse == 0.0, reverse),
            ("maximum speed bounds", 0.0 < bounded <= 250.0, bounded),
            ("slow at shared range moves", same_range_slow > 0.0, same_range_slow),
            ("fast at shared range stops", same_range_fast == 0.0, same_range_fast),
            (
                "response delay reduces speed",
                0.0 < delayed_response < quick_response,
                (quick_response, delayed_response),
            ),
            (
                "stronger braking permits more speed",
                0.0 < weak_braking < strong_braking,
                (weak_braking, strong_braking),
            ),
            (
                "larger margin reduces speed",
                0.0 < large_margin < small_margin,
                (small_margin, large_margin),
            ),
        )
        for label, passed, observed in observations:
            print("OBSERVED", label, observed)
            if not passed:
                print("FAIL RangeSafetyController.update", label)
                return
    except NotImplementedError as error:
        print("NOT IMPLEMENTED", error)
        return
    except Exception as error:
        print("FAIL RangeSafetyController.update", type(error).__name__, error)
        return
    print("PASS RangeSafetyController.update")


check_range_safety_controller()
