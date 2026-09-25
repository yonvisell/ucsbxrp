# Test Challenge 7 components without starting either robot.

from differential_drive import DifferentialDrive
from grid_planner import GridPlanner
from navigation_controller import NavigationController
from odometry import Odometry
from pose_corrector import PoseCorrector
from sensor_model import SensorModel
from ucsb_xrp import Pose
from ucsb_xrp.component_checks import run_component_checks
from ucsb_xrp.student_api import PoseCorrectorBase
from wheel_speed_controller import WheelSpeedController


run_component_checks(
    SensorModel,
    WheelSpeedController,
    DifferentialDrive,
    Odometry,
    NavigationController,
    GridPlanner,
    include_range=True,
)


def check_pose_corrector():
    print("PoseCorrector varied wall observations")
    try:
        corrector = PoseCorrector(50.0)
        if not isinstance(corrector, PoseCorrectorBase):
            print("FAIL PoseCorrector must extend PoseCorrectorBase")
            return
        raw = Pose(120.0, -75.0, 0.31)
        corrector.reset(raw)
        after_x = corrector.observe_x(raw, 780.0, 1000.0, True)
        after_y = corrector.observe_y(raw, 275.0, -600.0, False)
        later = corrector.corrected_pose(Pose(145.0, -50.0, -0.60))

        reset_pose = Pose(-40.0, 30.0, 1.20)
        after_reset = corrector.reset(reset_pose)
        after_negative_x = corrector.observe_x(
            reset_pose, 200.0, -500.0, False
        )
        after_positive_y = corrector.observe_y(
            reset_pose, 300.0, 800.0, True
        )

        second = PoseCorrector(25.0)
        second_raw = Pose(40.0, 60.0, -1.10)
        second.reset(second_raw)
        second_x = second.observe_x(second_raw, 500.0, 600.0, True)
        second_xy = second.observe_y(second_raw, 200.0, -400.0, False)

        observations = (
            (
                "positive-x correction preserves y and heading",
                abs(after_x.x_mm - 170.0) < 1e-9
                and abs(after_x.y_mm + 75.0) < 1e-9
                and abs(after_x.heading_rad - 0.31) < 1e-9,
                after_x,
            ),
            (
                "negative-y correction retains x correction",
                abs(after_y.x_mm - 170.0) < 1e-9
                and abs(after_y.y_mm + 275.0) < 1e-9,
                after_y,
            ),
            (
                "translation follows later odometry and preserves heading",
                abs(later.x_mm - 195.0) < 1e-9
                and abs(later.y_mm + 250.0) < 1e-9
                and abs(later.heading_rad + 0.60) < 1e-9,
                later,
            ),
            (
                "reset clears both corrections",
                after_reset == reset_pose,
                after_reset,
            ),
            (
                "negative-x wall side",
                abs(after_negative_x.x_mm + 250.0) < 1e-9
                and abs(after_negative_x.y_mm - 30.0) < 1e-9,
                after_negative_x,
            ),
            (
                "positive-y follows negative-x",
                abs(after_positive_y.x_mm + 250.0) < 1e-9
                and abs(after_positive_y.y_mm - 450.0) < 1e-9,
                after_positive_y,
            ),
            (
                "second sensor offset and positive-x wall",
                abs(second_x.x_mm - 75.0) < 1e-9
                and abs(second_x.y_mm - 60.0) < 1e-9,
                second_x,
            ),
            (
                "second sensor offset and negative-y wall",
                abs(second_xy.x_mm - 75.0) < 1e-9
                and abs(second_xy.y_mm + 175.0) < 1e-9,
                second_xy,
            ),
        )
        for label, passed, observed in observations:
            print("OBSERVED", label, observed)
            if not passed:
                print("FAIL PoseCorrector", label)
                return
        try:
            corrector.observe_x(reset_pose, 0.0, 900.0, True)
        except ValueError:
            pass
        else:
            print("FAIL PoseCorrector accepted zero range")
            return
    except NotImplementedError as error:
        print("NOT IMPLEMENTED", error)
        return
    except Exception as error:
        print("FAIL PoseCorrector", type(error).__name__, error)
        return
    print("PASS PoseCorrector")


check_pose_corrector()
