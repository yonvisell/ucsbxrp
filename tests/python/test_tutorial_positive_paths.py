import contextlib
import io
import json
import math
import pathlib
import runpy
import sys
import types
import unittest

from tests.python._tutorial_positive_solutions import (
    tutorial_five_solution,
    tutorial_four_solution,
    tutorial_one_solution,
    tutorial_three_solution,
    tutorial_two_solution,
)


ROOT = pathlib.Path(__file__).resolve().parents[2]
TEMPLATES = ROOT / "vendor" / "current" / "templates"
COURSE_SOURCE = str(ROOT / "vendor" / "current")


def _clear_course_live_state():
    live_module = sys.modules.get("ucsb_xrp.live")
    clear = getattr(live_module, "clear", None)
    if callable(clear):
        clear()


@contextlib.contextmanager
def _project_imports(tutorial, replacements):
    module_names = {
        "course_setup",
        "exercise_checks",
        "robot_config",
        "student_work",
        *replacements,
    }
    saved_modules = {
        name: sys.modules.pop(name)
        for name in module_names
        if name in sys.modules
    }
    original_path = list(sys.path)
    sys.path[:0] = [str(tutorial), COURSE_SOURCE]
    sys.modules.update(replacements)
    _clear_course_live_state()
    try:
        yield
    finally:
        sys.path[:] = original_path
        for name in module_names:
            sys.modules.pop(name, None)
        sys.modules.update(saved_modules)
        _clear_course_live_state()


class _VirtualRobot:
    def __init__(self):
        self.step_calls = []
        self.stop_count = 0
        self.last_command = None
        self.path_length_mm = 0.0
        self.time_ms = 0
        self.left_position_mm = 0.0
        self.right_position_mm = 0.0
        self.pose = None

    def _state(self):
        from ucsb_xrp import Measurements, RobotState

        button_pressed = 48 <= len(self.step_calls) <= 55
        range_mm = max(40.0, 300.0 - max(0.0, self.pose.x_mm))
        measurements = Measurements(
            self.time_ms,
            0.02 if self.step_calls else 0.0,
            self.left_position_mm,
            self.right_position_mm,
            0.0,
            0.0,
            0.0,
            0.0,
            range_mm,
            button_pressed,
        )
        return RobotState(measurements, self.pose)

    def start(self, initial_pose):
        self.pose = initial_pose
        return self._state()

    def step(self, command, read_range=False):
        from ucsb_xrp import Pose

        self.step_calls.append((command, read_range))
        if len(self.step_calls) > 500:
            raise AssertionError("tutorial runner exceeded 500 samples")
        dt_s = 0.02
        forward_mm = command.forward_speed_mm_s * dt_s
        heading_change_rad = command.turn_rate_rad_s * dt_s
        heading_midpoint_rad = self.pose.heading_rad + heading_change_rad / 2.0
        self.pose = Pose(
            self.pose.x_mm + forward_mm * math.cos(heading_midpoint_rad),
            self.pose.y_mm + forward_mm * math.sin(heading_midpoint_rad),
            self.pose.heading_rad + heading_change_rad,
        )
        half_track_mm = 77.5
        self.left_position_mm += forward_mm - half_track_mm * heading_change_rad
        self.right_position_mm += forward_mm + half_track_mm * heading_change_rad
        self.path_length_mm += abs(forward_mm)
        self.time_ms += 20
        self.last_command = command
        return self._state()

    def stop(self):
        from ucsb_xrp import STOP_COMMAND

        self.stop_count += 1
        self.last_command = STOP_COMMAND


class TutorialPositivePathTests(unittest.TestCase):
    tutorials = (
        ("tutorial_1_python_essentials", tutorial_one_solution),
        ("tutorial_2_virtual_drawing", tutorial_two_solution),
        ("tutorial_3_robot_programs", tutorial_three_solution),
        ("tutorial_4_behavior_telemetry", tutorial_four_solution),
        ("tutorial_5_physical_preflight", tutorial_five_solution),
    )

    @classmethod
    def setUpClass(cls):
        sys.path.insert(0, COURSE_SOURCE)

    @classmethod
    def tearDownClass(cls):
        sys.path.remove(COURSE_SOURCE)

    def test_private_positive_implementations_pass_all_exercise_checkers(self):
        for directory_name, solution_factory in self.tutorials:
            tutorial = TEMPLATES / directory_name
            solution = solution_factory()
            output = io.StringIO()
            with self.subTest(tutorial=directory_name), _project_imports(
                tutorial, {"student_work": solution}
            ), contextlib.redirect_stdout(output):
                checks = runpy.run_path(
                    str(tutorial / "exercise_checks.py"),
                    run_name=directory_name + "_positive_checks",
                )
                self.assertTrue(checks["run_exercise_checks"]())
                self.assertNotIn("NOT COMPLETED", output.getvalue())
                self.assertNotIn("INCORRECT", output.getvalue())

    def test_shipped_tutorial_examples_are_runnable_before_any_edit(self):
        for directory_name, _solution_factory in self.tutorials:
            tutorial = TEMPLATES / directory_name
            output = io.StringIO()
            with self.subTest(tutorial=directory_name), _project_imports(
                tutorial, {}
            ), contextlib.redirect_stdout(output):
                checks = runpy.run_path(
                    str(tutorial / "exercise_checks.py"),
                    run_name=directory_name + "_shipped_checks",
                )
                self.assertTrue(checks["run_exercise_checks"]())
                self.assertNotIn("NOT COMPLETED", output.getvalue())
                self.assertNotIn("INCORRECT", output.getvalue())

    def test_positive_virtual_runners_finish_bounded_and_stopped(self):
        for directory_name, solution_factory in self.tutorials[1:]:
            tutorial = TEMPLATES / directory_name
            solution = solution_factory()
            robot = _VirtualRobot()
            replacements = {
                "student_work": solution,
                "course_setup": types.SimpleNamespace(
                    make_robot=lambda _config, robot=robot: robot
                ),
                "robot_config": types.SimpleNamespace(ROBOT_CONFIG=object()),
            }
            output = io.StringIO()
            with self.subTest(tutorial=directory_name), _project_imports(
                tutorial, replacements
            ), contextlib.redirect_stdout(output):
                runpy.run_path(
                    str(tutorial / "main.py"),
                    run_name=directory_name + "_positive_run",
                )

            self.assertGreater(len(robot.step_calls), 0)
            self.assertLessEqual(len(robot.step_calls), 500)
            maximum_path_mm = (
                1400.0
                if directory_name == "tutorial_2_virtual_drawing"
                else 1000.0
            )
            self.assertLess(robot.path_length_mm, maximum_path_mm)
            expected_stop_count = (
                2 if directory_name == "tutorial_5_physical_preflight" else 1
            )
            self.assertEqual(robot.stop_count, expected_stop_count)
            self.assertEqual(robot.last_command.forward_speed_mm_s, 0.0)
            self.assertEqual(robot.last_command.turn_rate_rad_s, 0.0)
            if directory_name == "tutorial_2_virtual_drawing":
                self.assertLess(math.hypot(robot.pose.x_mm, robot.pose.y_mm), 15.0)
                heading_error = (robot.pose.heading_rad + math.pi) % (
                    2.0 * math.pi
                ) - math.pi
                self.assertLess(abs(heading_error), 0.08)

        self.assertIn("button_was_pressed: True", output.getvalue())

    def test_robot_tutorials_do_not_construct_a_robot_before_checks_pass(self):
        for directory_name, solution_factory in self.tutorials[2:4]:
            tutorial = TEMPLATES / directory_name
            constructed = []
            replacements = {
                "student_work": solution_factory(),
                "exercise_checks": types.SimpleNamespace(
                    run_exercise_checks=lambda: False
                ),
                "course_setup": types.SimpleNamespace(
                    make_robot=lambda _config: constructed.append(True)
                ),
                "robot_config": types.SimpleNamespace(ROBOT_CONFIG=object()),
            }
            with self.subTest(tutorial=directory_name), _project_imports(
                tutorial, replacements
            ), contextlib.redirect_stdout(io.StringIO()):
                runpy.run_path(
                    str(tutorial / "main.py"),
                    run_name=directory_name + "_failed_checks",
                )
            self.assertEqual(constructed, [])

    def test_physical_preflight_uses_centered_course_arena(self):
        world_path = (
            TEMPLATES / "tutorial_5_physical_preflight" / "world.json"
        )
        world = json.loads(world_path.read_text(encoding="utf-8"))["worlds"][0]
        self.assertEqual(
            world["bounds"],
            {
                "minimum_x_mm": -1524,
                "minimum_y_mm": -609.6,
                "maximum_x_mm": 1524,
                "maximum_y_mm": 609.6,
            },
        )


if __name__ == "__main__":
    unittest.main()
