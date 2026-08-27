import ast
import contextlib
import importlib
import io
import json
import os
import pathlib
import re
import runpy
import sys
import tempfile
import types
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[2]
STARTERS = ROOT / "vendor" / "current" / "starters"
TEMPLATES = ROOT / "vendor" / "current" / "templates"
COMPONENT_TEMPLATES = ROOT / "vendor" / "current" / "student_component_templates"


class CourseStarterTests(unittest.TestCase):
    def test_challenge_one_reports_wrap_safe_elapsed_time_and_mean_travel(self):
        starter = STARTERS / "challenge_1"
        elapsed_calls = []

        class FakeMeasurements:
            def __init__(self, time_ms, left_position_mm, right_position_mm):
                self.time_ms = time_ms
                self.left_position_mm = left_position_mm
                self.right_position_mm = right_position_mm

        class FakeState:
            def __init__(self, measurements):
                self.measurements = measurements

        class FakeRobot:
            def __init__(self):
                self.stopped = False

            def start(self, _initial_pose):
                return FakeState(FakeMeasurements(1_073_741_800, 0.0, 0.0))

            def step(self, _command):
                return FakeState(FakeMeasurements(20, 496.0, 504.0))

            def stop(self):
                self.stopped = True

        class FakeStraightLineController:
            def __init__(self, _config):
                self.update_count = 0

            def start(self, _measurements, _distance_mm):
                pass

            def is_complete(self):
                return self.update_count == 1

            def update(self, _measurements):
                self.update_count += 1
                return object()

        robot = FakeRobot()

        def wrap_safe_elapsed_time_s(later_ms, earlier_ms):
            elapsed_calls.append((later_ms, earlier_ms))
            return 0.244

        fake_modules = {
            "challenge": types.SimpleNamespace(
                INITIAL_POSE=object(),
                TARGET_TIME_S=8.0,
                TRAVEL_DISTANCE_MM=500.0,
            ),
            "course_setup": types.SimpleNamespace(
                make_robot=lambda _config: robot,
            ),
            "robot_config": types.SimpleNamespace(
                ROBOT_CONFIG=object(),
                STRAIGHT_CONFIG=object(),
            ),
            "ucsb_xrp": types.SimpleNamespace(
                StraightLineController=FakeStraightLineController,
                elapsed_time_s=wrap_safe_elapsed_time_s,
            ),
        }
        saved_modules = {
            name: sys.modules.pop(name)
            for name in fake_modules
            if name in sys.modules
        }
        sys.modules.update(fake_modules)
        output = io.StringIO()
        try:
            with contextlib.redirect_stdout(output):
                runpy.run_path(str(starter / "main.py"), run_name="__main__")
        finally:
            for name in fake_modules:
                sys.modules.pop(name, None)
            sys.modules.update(saved_modules)

        self.assertEqual(elapsed_calls, [(20, 1_073_741_800)])
        self.assertTrue(robot.stopped)
        self.assertIn("mean_wheel_travel_mm: 500.0", output.getvalue())
        self.assertIn("measured_elapsed_time_s: 0.244", output.getvalue())

    def test_demo_and_tutorial_templates_are_complete_compilable_projects(self):
        directories = sorted(path for path in TEMPLATES.iterdir() if path.is_dir())
        self.assertEqual(
            [path.name for path in directories],
            [
                "demo_obstacle_turn",
                "demo_spiral",
                "tutorial_1_python_essentials",
                "tutorial_2_virtual_drawing",
                "tutorial_3_robot_programs",
                "tutorial_4_behavior_telemetry",
            ],
        )
        for directory in directories:
            self.assertTrue((directory / "README.md").is_file())
            python_files = sorted(directory.glob("*.py"))
            self.assertGreaterEqual(len(python_files), 3)
            for path in python_files:
                with self.subTest(template=directory.name, file=path.name):
                    compile(path.read_text(encoding="utf-8"), str(path), "exec")

    def test_tutorials_are_active_ordered_projects_with_one_student_file(self):
        tutorials = [
            TEMPLATES / "tutorial_1_python_essentials",
            TEMPLATES / "tutorial_2_virtual_drawing",
            TEMPLATES / "tutorial_3_robot_programs",
            TEMPLATES / "tutorial_4_behavior_telemetry",
        ]
        for number, tutorial in enumerate(tutorials, start=1):
            readme = (tutorial / "README.md").read_text(encoding="utf-8")
            student_source = (tutorial / "student_work.py").read_text(encoding="utf-8")
            with self.subTest(tutorial=number):
                self.assertIn("Edit only `student_work.py`", readme)
                self.assertIn("NOT COMPLETED", readme)
                self.assertIn("INCORRECT", readme)
                self.assertIn("NotImplementedError", student_source)
                self.assertEqual(
                    [path.name for path in tutorial.glob("student_*.py")],
                    ["student_work.py"],
                )
                self.assertTrue((tutorial / "exercise_checks.py").is_file())
                self.assertFalse((tutorial / "component_checks.py").exists())

                world = json.loads((tutorial / "world.json").read_text(encoding="utf-8"))
                self.assertIn(world["default_world"], [item["id"] for item in world["worlds"]])
                self.assertEqual(world["worlds"][0]["initial_pose"]["heading_rad"], 0)

        python_readme = (tutorials[0] / "README.md").read_text(encoding="utf-8")
        for concept in ("function", "list", "tuple", "loop", "ValueError", "None"):
            self.assertIn(concept, python_readme)

        drawing_readme = (tutorials[1] / "README.md").read_text(encoding="utf-8")
        self.assertIn("class", drawing_readme)
        self.assertIn("Monitor path acts like a pen", drawing_readme)

        robot_readme = (tutorials[2] / "README.md").read_text(encoding="utf-8")
        for operation in ("robot.start", "robot.step", "robot.stop"):
            self.assertIn(operation, robot_readme)
        self.assertIn("Do not add another delay", robot_readme)
        self.assertNotIn("sleep_ms", (tutorials[2] / "student_work.py").read_text(encoding="utf-8"))

        telemetry_source = (tutorials[3] / "student_work.py").read_text(encoding="utf-8")
        for operation in ("live.number", "live.choice", "live.toggle", "live.watch", "live.plot"):
            if operation in ("live.watch", "live.plot"):
                self.assertIn(operation, (tutorials[3] / "README.md").read_text(encoding="utf-8"))
            else:
                self.assertIn(operation, telemetry_source)

    def test_unfinished_tutorial_exercises_report_clear_outcomes(self):
        tutorials = sorted(TEMPLATES.glob("tutorial_[1-4]_*"))
        course_source = str(ROOT / "vendor" / "current")
        for tutorial in tutorials:
            output = io.StringIO()
            saved_modules = {
                name: sys.modules.pop(name)
                for name in ("student_work", "exercise_checks")
                if name in sys.modules
            }
            sys.path.insert(0, course_source)
            sys.path.insert(0, str(tutorial))
            try:
                with self.subTest(tutorial=tutorial.name), contextlib.redirect_stdout(output):
                    exercise_checks = runpy.run_path(
                        str(tutorial / "exercise_checks.py"), run_name="exercise_checks"
                    )
                    exercise_checks["run_exercise_checks"]()
                text = output.getvalue()
                self.assertIn("NOT COMPLETED", text)
                self.assertIn("0 incorrect", text)
            finally:
                sys.path.remove(str(tutorial))
                sys.path.remove(course_source)
                sys.modules.pop("student_work", None)
                sys.modules.pop("exercise_checks", None)
                sys.modules.update(saved_modules)

    def test_all_five_starters_are_complete_compilable_projects(self):
        directories = sorted(path for path in STARTERS.iterdir() if path.is_dir())
        self.assertEqual(
            [path.name for path in directories],
            ["challenge_1", "challenge_2", "challenge_3", "challenge_4", "challenge_5"],
        )
        component_files = (
            "sensor_model.py",
            "wheel_speed_controller.py",
            "differential_drive.py",
            "odometry.py",
            "navigation_controller.py",
            "grid_planner.py",
        )
        for directory in directories:
            paths = {path.name: path for path in directory.glob("*.py")}
            challenge_number = int(directory.name.rsplit("_", 1)[1])
            component_count = (2, 4, 5, 6, 6)[challenge_number - 1]
            required = {
                "challenge.py",
                "component_checks.py",
                "course_setup.py",
                "main.py",
                "robot_config.py",
                *component_files[:component_count],
            }
            self.assertEqual(set(paths), required, directory.name)
            for name, path in paths.items():
                with self.subTest(challenge=directory.name, file=name):
                    compile(path.read_text(encoding="utf-8"), str(path), "exec")

    def test_later_starters_use_the_same_documented_component_templates(self):
        introduced_by_challenge = {
            "sensor_model.py": 1,
            "wheel_speed_controller.py": 1,
            "differential_drive.py": 2,
            "odometry.py": 2,
            "navigation_controller.py": 3,
            "grid_planner.py": 4,
        }
        for filename, first_challenge in introduced_by_challenge.items():
            canonical = (COMPONENT_TEMPLATES / filename).read_text(encoding="utf-8")
            for challenge_number in range(first_challenge, 6):
                starter = STARTERS / ("challenge_%d" % challenge_number) / filename
                with self.subTest(
                    component=filename,
                    challenge=challenge_number,
                ):
                    self.assertEqual(starter.read_text(encoding="utf-8"), canonical)

    def test_each_starter_has_one_switch_per_component_introduced_so_far(self):
        expected_switches = {
            "challenge_1": 2,
            "challenge_2": 4,
            "challenge_3": 5,
            "challenge_4": 6,
            "challenge_5": 6,
        }
        for challenge, expected_count in expected_switches.items():
            source = (STARTERS / challenge / "course_setup.py").read_text(
                encoding="utf-8"
            )
            switches = {
                node.targets[0].id
                for node in ast.walk(ast.parse(source))
                if isinstance(node, ast.Assign)
                and len(node.targets) == 1
                and isinstance(node.targets[0], ast.Name)
                and node.targets[0].id.startswith("USE_STUDENT_")
            }
            self.assertEqual(len(switches), expected_count, challenge)

    def test_component_selection_uses_student_and_supplied_implementations(self):
        base_cases = (
            ("USE_STUDENT_SENSOR_MODEL", "make_sensor_model", "sensor_model"),
            (
                "USE_STUDENT_WHEEL_SPEED_CONTROLLER",
                "make_wheel_speed_controller",
                "wheel_speed_controller",
            ),
            (
                "USE_STUDENT_DIFFERENTIAL_DRIVE",
                "make_differential_drive",
                "differential_drive",
            ),
            ("USE_STUDENT_ODOMETRY", "make_odometry", "odometry"),
        )
        module_names = (
            "course_setup",
            "sensor_model",
            "wheel_speed_controller",
            "differential_drive",
            "odometry",
            "navigation_controller",
            "grid_planner",
        )
        for challenge_number in range(2, 6):
            challenge = "challenge_{}".format(challenge_number)
            directory = STARTERS / challenge
            saved_modules = {
                name: sys.modules.pop(name)
                for name in module_names
                if name in sys.modules
            }
            original_path = list(sys.path)
            sys.path[:0] = [
                str(directory),
                str(ROOT / "vendor" / "current" / "reference_source"),
                str(ROOT / "vendor" / "current"),
            ]
            try:
                setup = importlib.import_module("course_setup")
                from ucsb_xrp import NavigationConfig, RobotConfig

                robot_config = RobotConfig()
                navigation_config = NavigationConfig(
                    120.0, 60.0, 150.0, 0.8, 10.0, 0.05, 0.2
                )
                cases = list(base_cases)
                if challenge_number >= 3:
                    cases.append(
                        (
                            "USE_STUDENT_NAVIGATION_CONTROLLER",
                            "make_navigation_controller",
                            "navigation_controller",
                        )
                    )
                if challenge_number >= 4:
                    cases.append(
                        (
                            "USE_STUDENT_GRID_PLANNER",
                            "make_grid_planner",
                            "grid_planner",
                        )
                    )

                for flag, factory_name, student_module in cases:
                    factory = getattr(setup, factory_name)
                    if factory_name == "make_grid_planner":
                        arguments = ()
                    elif factory_name == "make_navigation_controller":
                        arguments = (navigation_config,)
                    else:
                        arguments = (robot_config,)
                    setattr(setup, flag, False)
                    supplied = factory(*arguments)
                    setattr(setup, flag, True)
                    student = factory(*arguments)
                    self.assertTrue(
                        type(supplied).__module__.startswith("ucsb_xrp_reference")
                    )
                    self.assertEqual(type(student).__module__, student_module)
            finally:
                sys.path[:] = original_path
                for name in module_names:
                    sys.modules.pop(name, None)
                sys.modules.update(saved_modules)

    def test_component_check_files_expose_one_clear_call_not_check_machinery(self):
        expected_components = {
            "challenge_1": 2,
            "challenge_2": 4,
            "challenge_3": 5,
            "challenge_4": 6,
            "challenge_5": 7,
        }
        project_module_names = (
            "sensor_model",
            "wheel_speed_controller",
            "differential_drive",
            "odometry",
            "navigation_controller",
            "grid_planner",
        )
        for challenge, component_count in expected_components.items():
            directory = STARTERS / challenge
            path = directory / "component_checks.py"
            source = path.read_text(encoding="utf-8")
            with self.subTest(challenge=challenge):
                self.assertLessEqual(len(source.splitlines()), 40)
                self.assertIn("student-owned component classes", source)
                self.assertIn("PASS means", source)
                self.assertIn("The imports below are the classes", source)
                self.assertIn("run_component_checks(", source)
                self.assertNotIn("def check_", source)
                self.assertNotIn("RawSensors", source)

                calls = [
                    node
                    for node in ast.walk(ast.parse(source))
                    if isinstance(node, ast.Call)
                    and isinstance(node.func, ast.Name)
                    and node.func.id == "run_component_checks"
                ]
                self.assertEqual(len(calls), 1)
                expected_classes = component_count - (1 if challenge == "challenge_5" else 0)
                self.assertEqual(len(calls[0].args), expected_classes)
                self.assertEqual(
                    {item.arg for item in calls[0].keywords},
                    {"include_range"} if challenge == "challenge_5" else set(),
                )

                saved_modules = {
                    name: sys.modules.pop(name)
                    for name in project_module_names
                    if name in sys.modules
                }
                output = io.StringIO()
                course_source = str(ROOT / "vendor" / "current")
                sys.path.insert(0, course_source)
                sys.path.insert(0, str(directory))
                try:
                    with self.assertRaisesRegex(
                        AssertionError,
                        "no component checks passed",
                    ), contextlib.redirect_stdout(output):
                        runpy.run_path(str(path), run_name="__main__")
                finally:
                    sys.path.remove(str(directory))
                    sys.path.remove(course_source)
                    for name in project_module_names:
                        sys.modules.pop(name, None)
                    sys.modules.update(saved_modules)

                text = output.getvalue()
                self.assertIn(
                    "Concrete component examples use MicroPython without starting either robot.",
                    text,
                )
                self.assertIn(
                    "0 passed · {} not implemented · 0 failed".format(
                        component_count
                    ),
                    text,
                )
                self.assertEqual(text.count("CHECK · "), component_count)
                self.assertEqual(text.count("INPUT · "), component_count)
                self.assertEqual(text.count("EXPECT · "), component_count)
                self.assertIn("input", source.lower())
                self.assertIn("Complete SensorModel.reset", text)
                self.assertNotIn("PENDING", text)

    def test_supplied_components_pass_every_concrete_component_example(self):
        course_source = str(ROOT / "vendor" / "current")
        reference_source = str(ROOT / "vendor" / "current" / "reference_source")
        sys.path.insert(0, reference_source)
        sys.path.insert(0, course_source)
        try:
            from ucsb_xrp.component_checks import run_component_checks
            from ucsb_xrp_reference import (
                DifferentialDrive,
                GridPlanner,
                NavigationController,
                Odometry,
                SensorModel,
                WheelSpeedController,
            )

            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                run_component_checks(
                    SensorModel,
                    WheelSpeedController,
                    DifferentialDrive,
                    Odometry,
                    NavigationController,
                    GridPlanner,
                    include_range=True,
                )
            self.assertIn(
                "7 passed · 0 not implemented · 0 failed",
                output.getvalue(),
            )
            self.assertEqual(output.getvalue().count("CHECK · "), 7)
            self.assertEqual(output.getvalue().count("INPUT · "), 7)
            self.assertEqual(output.getvalue().count("EXPECT · "), 7)
            self.assertEqual(output.getvalue().count("OBSERVED · "), 7)
        finally:
            sys.path.remove(course_source)
            sys.path.remove(reference_source)
            for name in tuple(sys.modules):
                if name == "ucsb_xrp_reference" or name.startswith(
                    "ucsb_xrp_reference."
                ):
                    sys.modules.pop(name, None)

    def test_grid_planner_check_accepts_a_valid_nonminimum_route(self):
        course_source = str(ROOT / "vendor" / "current")
        sys.path.insert(0, course_source)
        try:
            from ucsb_xrp import GridCell, GridPath, OccupancyGrid
            from ucsb_xrp.component_checks import run_component_checks

            class DepthFirstGridPlanner:
                def plan(self, grid, start, goal):
                    if start is None or goal is None:
                        return None
                    if grid.is_blocked(start) or grid.is_blocked(goal):
                        return None

                    pending = [(start, (start,))]
                    visited = set()
                    while pending:
                        current, route = pending.pop()
                        if current in visited:
                            continue
                        visited.add(current)
                        if current == goal:
                            return GridPath(route)
                        for adjacent in grid.neighbors(current):
                            if adjacent not in visited:
                                pending.append((adjacent, route + (adjacent,)))
                    return None

            open_grid = OccupancyGrid(
                100.0,
                0.0,
                0.0,
                3,
                2,
                (False, False, False, False, False, False),
            )
            nonminimum = DepthFirstGridPlanner().plan(
                open_grid,
                GridCell(0, 0),
                GridCell(2, 0),
            )
            self.assertEqual(len(nonminimum.cells), 5)

            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                run_component_checks(grid_planner=DepthFirstGridPlanner)

            self.assertIn(
                "PASS · GridPlanner · connected route through free cells",
                output.getvalue(),
            )
            self.assertIn(
                "1 passed · 0 not implemented · 0 failed",
                output.getvalue(),
            )
        finally:
            sys.path.remove(course_source)

    def test_partial_component_progress_reports_without_failing(self):
        course_source = str(ROOT / "vendor" / "current")
        reference_source = str(ROOT / "vendor" / "current" / "reference_source")
        sys.path.insert(0, reference_source)
        sys.path.insert(0, course_source)
        try:
            from ucsb_xrp.component_checks import run_component_checks
            from ucsb_xrp_reference import SensorModel

            class UnfinishedWheelSpeedController:
                def __init__(self, config):
                    self.config = config

                def reset(self):
                    pass

                def update(self, target, measured):
                    raise NotImplementedError

            UnfinishedWheelSpeedController.__name__ = "WheelSpeedController"
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                run_component_checks(
                    SensorModel,
                    UnfinishedWheelSpeedController,
                )
            self.assertIn(
                "1 passed · 1 not implemented · 0 failed",
                output.getvalue(),
            )
        finally:
            sys.path.remove(course_source)
            sys.path.remove(reference_source)
            for name in tuple(sys.modules):
                if name == "ucsb_xrp_reference" or name.startswith(
                    "ucsb_xrp_reference."
                ):
                    sys.modules.pop(name, None)

    def test_component_failure_names_the_compared_value(self):
        course_source = str(ROOT / "vendor" / "current")
        sys.path.insert(0, course_source)
        try:
            from ucsb_xrp import WheelSpeeds
            from ucsb_xrp.component_checks import run_component_checks

            class IncorrectDifferentialDrive:
                def __init__(self, config):
                    self.config = config

                def wheel_speeds(self, command):
                    return WheelSpeeds(0.0, 0.0)

            IncorrectDifferentialDrive.__name__ = "DifferentialDrive"
            output = io.StringIO()
            with self.assertRaisesRegex(
                AssertionError,
                "1 component check",
            ), contextlib.redirect_stdout(output):
                run_component_checks(IncorrectDifferentialDrive)

            self.assertIn(
                "straight left target (mm/s): expected 80.0, received 0.0",
                output.getvalue(),
            )
        finally:
            sys.path.remove(course_source)

    def test_component_examples_reject_missing_required_behavior(self):
        course_source = str(ROOT / "vendor" / "current")
        reference_source = str(ROOT / "vendor" / "current" / "reference_source")
        sys.path.insert(0, reference_source)
        sys.path.insert(0, course_source)
        try:
            from ucsb_xrp import Measurements, MotionCommand, Pose, WheelSpeeds
            from ucsb_xrp.component_checks import run_component_checks
            from ucsb_xrp_reference import (
                NavigationController as SuppliedNavigationController,
                Odometry as SuppliedOdometry,
                SensorModel as SuppliedSensorModel,
                WheelSpeedController as SuppliedWheelSpeedController,
            )

            class NominalTimeSensorModel(SuppliedSensorModel):
                def update(self, raw):
                    measured = super().update(raw)
                    return Measurements(
                        measured.time_ms,
                        self.config.sample_period_ms / 1000.0,
                        measured.left_position_mm,
                        measured.right_position_mm,
                        measured.left_increment_mm,
                        measured.right_increment_mm,
                        measured.left_speed_mm_s,
                        measured.right_speed_mm_s,
                        measured.range_mm,
                        measured.button_pressed,
                    )

            class MeasurementBlindWheelController(SuppliedWheelSpeedController):
                def update(self, target, measured):
                    return super().update(target, WheelSpeeds(0.0, 0.0))

            class IncorrectCurveOdometry(SuppliedOdometry):
                def update(self, left_increment_mm, right_increment_mm):
                    if left_increment_mm == 0.0 and right_increment_mm == 100.0:
                        self._pose = Pose(1.0, 1.0, 1.0)
                        return self._pose
                    return super().update(left_increment_mm, right_increment_mm)

            class AlwaysLeftNavigationController(SuppliedNavigationController):
                def update(self, pose):
                    command = super().update(pose)
                    if command.turn_rate_rad_s < 0.0:
                        return MotionCommand(
                            command.forward_speed_mm_s,
                            -command.turn_rate_rad_s,
                        )
                    return command

            incomplete_components = (
                (NominalTimeSensorModel, "SensorModel"),
                (MeasurementBlindWheelController, "WheelSpeedController"),
                (IncorrectCurveOdometry, "Odometry"),
                (AlwaysLeftNavigationController, "NavigationController"),
            )
            for component_class, public_name in incomplete_components:
                component_class.__name__ = public_name
                with self.subTest(component=public_name), self.assertRaisesRegex(
                    AssertionError,
                    "1 component check",
                ), contextlib.redirect_stdout(io.StringIO()):
                    run_component_checks(component_class)
        finally:
            sys.path.remove(course_source)
            sys.path.remove(reference_source)
            for name in tuple(sys.modules):
                if name == "ucsb_xrp_reference" or name.startswith(
                    "ucsb_xrp_reference."
                ):
                    sys.modules.pop(name, None)

    def test_each_challenge_readme_defines_student_and_supplied_responsibilities(self):
        expected_student_files = {
            "challenge_1": ("sensor_model.py", "wheel_speed_controller.py"),
            "challenge_2": (
                "sensor_model.py",
                "wheel_speed_controller.py",
                "differential_drive.py",
                "odometry.py",
            ),
            "challenge_3": (
                "sensor_model.py",
                "wheel_speed_controller.py",
                "differential_drive.py",
                "odometry.py",
                "navigation_controller.py",
            ),
            "challenge_4": (
                "sensor_model.py",
                "wheel_speed_controller.py",
                "differential_drive.py",
                "odometry.py",
                "navigation_controller.py",
                "grid_planner.py",
            ),
            "challenge_5": (
                "sensor_model.py",
                "wheel_speed_controller.py",
                "differential_drive.py",
                "odometry.py",
                "navigation_controller.py",
                "grid_planner.py",
            ),
        }
        expected_task_parameters = {
            "challenge_1": ("TRAVEL_DISTANCE_MM", "TARGET_TIME_S"),
            "challenge_2": (
                "OUTBOUND_DISTANCE_MM",
                "TURN_HEADING_RAD",
                "RETURN_DISTANCE_MM",
                "FINAL_HEADING_RAD",
            ),
            "challenge_3": ("ROUTE",),
            "challenge_4": (
                "ARENA_MAP",
                "INITIAL_POSE",
                "DESTINATION",
                "GRID_RESOLUTION_MM",
                "CLEARANCE_MM",
            ),
            "challenge_5": ("DELIVERY_TASK",),
        }
        required_sections = (
            "## The challenge",
            "## What you implement",
            "## Provided files and tools",
            "## How the program runs",
            "## Complete the challenge",
        )

        for challenge, student_files in expected_student_files.items():
            text = (STARTERS / challenge / "README.md").read_text(encoding="utf-8")
            with self.subTest(challenge=challenge):
                for section in required_sections:
                    self.assertIn(section, text)
                self.assertNotIn("## Program flow", text)
                self.assertRegex(
                    " ".join(text.split()),
                    r"student-owned (?:component|implementation) files",
                    "README must identify the files maintained by students",
                )
                self.assertIn("component_checks.py", text)
                self.assertIn("course_setup.py", text)
                self.assertIn("`robot_config.py`", text)
                for filename in student_files:
                    self.assertIn("`%s`" % filename, text)
                for parameter in expected_task_parameters[challenge]:
                    self.assertIn("`%s`" % parameter, text)
                if challenge in ("challenge_3", "challenge_4", "challenge_5"):
                    self.assertIn("## Project modules", text)
                    self.assertIn(
                        "Test components always checks the student files",
                        text,
                    )
                    for responsibility in (
                        "wheel-speed estimates based on recent encoder samples",
                        "bounded left and right motor commands",
                        "target wheel speeds",
                        "estimated `Pose`",
                        "next `MotionCommand`",
                    ):
                        self.assertIn(responsibility, text)

    def test_student_facing_challenge_text_uses_direct_task_language(self):
        unclear_terms = (
            "bounded course run procedure",
            "bounded motor check",
            "contract",
            "frontier",
            "inverse kinematics",
            "pending",
            "predecessor",
            "recovery copy",
            "recovery-copy",
            "regularized",
            "safety tier",
            "task instance",
        )
        for directory in sorted(path for path in STARTERS.iterdir() if path.is_dir()):
            student_text = "\n".join(
                path.read_text(encoding="utf-8")
                for path in directory.iterdir()
                if path.suffix in (".md", ".py")
            ).lower()
            for term in unclear_terms:
                with self.subTest(challenge=directory.name, term=term):
                    self.assertNotIn(term, student_text)

    def test_challenge_guides_are_concise_and_behavioral(self):
        prescriptive_terms = (
            "breadth-first",
            "depth-first",
            "frontier",
            "predecessor",
            "left wheel speed  =",
            "right wheel speed =",
        )
        hard_coded_geometry = re.compile(
            r"(?:x_mm|y_mm|heading_rad)\s*[=:]\s*-?\d",
            re.IGNORECASE,
        )
        for directory in sorted(path for path in STARTERS.iterdir() if path.is_dir()):
            readme = (directory / "README.md").read_text(encoding="utf-8")
            with self.subTest(challenge=directory.name):
                self.assertIn("`world.json`", readme)
                self.assertIsNone(hard_coded_geometry.search(readme))
                for term in prescriptive_terms:
                    self.assertNotIn(term, readme.lower())

    def test_challenge_progression_text_matches_the_catalog(self):
        catalog = json.loads(
            (ROOT / "vendor/current/project_catalog.json").read_text(
                encoding="utf-8"
            )
        )
        challenges = {
            entry["id"]: entry
            for entry in catalog
            if entry["kind"] == "challenge" and entry["published"]
        }
        for challenge_number in range(2, 6):
            challenge_id = "challenge_%d" % challenge_number
            entry = challenges[challenge_id]
            readme = (STARTERS / challenge_id / "README.md").read_text(
                encoding="utf-8"
            )
            previous_number = challenge_number - 1
            heading = "## Continue from Challenge %d" % previous_number
            self.assertIn(heading, readme)
            start_section = readme.split(heading, 1)[1].split("\n## ", 1)[0]
            normalized = " ".join(start_section.split())
            with self.subTest(challenge=challenge_id):
                self.assertIn("Continue to " + entry["label"], normalized)
                self.assertIn("new project", normalized)
                self.assertIn(
                    "Challenge %d project remains unchanged" % previous_number,
                    normalized,
                )
                self.assertIn("selections", normalized)
                for component in entry["components"]:
                    self.assertIn("`%s`" % component["file"], readme)
                    if not component["carry_forward"]:
                        self.assertIn("`%s`" % component["file"], start_section)
                        self.assertIn("supplied", normalized)

    def test_mapped_route_states_results_without_prescribing_search_algorithm(self):
        readme = (STARTERS / "challenge_4" / "README.md").read_text(
            encoding="utf-8"
        )
        self.assertNotIn("shortest", readme.lower())
        self.assertNotIn("four-neighbor", readme.lower())

        catalog = json.loads(
            (ROOT / "vendor/current/project_catalog.json").read_text(
                encoding="utf-8"
            )
        )
        summary = next(
            entry["summary"] for entry in catalog if entry["id"] == "challenge_4"
        )
        self.assertNotIn("shortest", summary.lower())
        self.assertIn("connected route through free grid cells", summary)

    def test_navigation_settings_are_named_and_show_units(self):
        expected_names = {
            "cruise_speed_mm_s",
            "approach_speed_mm_s",
            "slowdown_distance_mm",
            "turn_rate_rad_s",
            "position_tolerance_mm",
            "heading_tolerance_rad",
            "realign_heading_rad",
        }
        for challenge_number in range(1, 6):
            path = STARTERS / ("challenge_%d" % challenge_number) / "robot_config.py"
            tree = ast.parse(path.read_text(encoding="utf-8"))
            calls = [
                node
                for node in ast.walk(tree)
                if isinstance(node, ast.Call)
                and isinstance(node.func, ast.Name)
                and node.func.id == "NavigationConfig"
            ]
            self.assertEqual(len(calls), 1, path)
            self.assertEqual(calls[0].args, [], path)
            self.assertEqual({item.arg for item in calls[0].keywords}, expected_names)

    def test_turn_task_heading_has_one_project_owned_source(self):
        directory = STARTERS / "challenge_2"
        source = (directory / "challenge.py").read_text(encoding="utf-8")
        tree = ast.parse(source)
        self.assertNotIn("from math import pi", source)
        assignments = {
            node.targets[0].id: node.value
            for node in tree.body
            if isinstance(node, ast.Assign)
            and len(node.targets) == 1
            and isinstance(node.targets[0], ast.Name)
        }
        turn_heading = assignments["TURN_HEADING_RAD"]
        self.assertIsInstance(turn_heading, ast.Attribute)
        self.assertEqual(turn_heading.attr, "heading_rad")

        world = json.loads((directory / "world.json").read_text(encoding="utf-8"))
        turn = next(
            marker
            for marker in world["worlds"][0]["markers"]
            if marker.get("name") == "turn"
        )
        self.assertAlmostEqual(turn["heading_rad"], 3.141592653589793)

    def test_delivery_task_has_the_changeable_feature_in_both_virtual_cases(self):
        directory = STARTERS / "challenge_5"
        catalog = json.loads((directory / "world.json").read_text(encoding="utf-8"))
        course_source = str(ROOT / "vendor" / "current")
        previous_directory = os.getcwd()
        sys.path.insert(0, course_source)
        try:
            for world_id in ("gate-blocked", "gate-open"):
                with self.subTest(world=world_id), tempfile.TemporaryDirectory() as temp:
                    selected_catalog = dict(catalog)
                    selected_catalog["default_world"] = world_id
                    pathlib.Path(temp, "world.json").write_text(
                        json.dumps(selected_catalog),
                        encoding="utf-8",
                    )
                    os.chdir(temp)
                    values = runpy.run_path(
                        str(directory / "challenge.py"),
                        run_name="__main__",
                    )
                    task = values["DELIVERY_TASK"]
                    self.assertEqual(values["WORLD"].id, world_id)
                    self.assertEqual(values["MISSION_MAP_WORLD"].id, "gate-blocked")
                    self.assertIn(
                        task.observed_feature_name,
                        task.arena.feature_names,
                    )
                    self.assertEqual(
                        task.arena.with_feature_blocked(
                            task.observed_feature_name,
                            True,
                        ).blocked_features,
                        (task.observed_feature_name,),
                    )
        finally:
            os.chdir(previous_directory)
            sys.path.remove(course_source)


if __name__ == "__main__":
    unittest.main()
