import ast
import json
from pathlib import Path
import re
import subprocess
import unittest


ROOT = Path(__file__).resolve().parents[2]
CATALOG_PATH = ROOT / "course_content/api-reference.json"


class ApiCatalogIntegrityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
        cls.entries = [
            entry
            for section in cls.catalog["sections"]
            for entry in section["entries"]
        ]
        cls.entries_by_id = {entry["id"]: entry for entry in cls.entries}
        cls.symbol_anchors = {
            symbol: entry["id"]
            for entry in cls.entries
            for symbol in entry["symbols"]
        }

    def _public_names(self, relative_path):
        module = ast.parse((ROOT / relative_path).read_text(encoding="utf-8"))
        for statement in module.body:
            if not isinstance(statement, ast.Assign):
                continue
            if any(
                isinstance(target, ast.Name) and target.id == "__all__"
                for target in statement.targets
            ):
                return list(ast.literal_eval(statement.value))
        self.fail("{} must define __all__".format(relative_path))

    def _class(self, relative_path, name):
        module = ast.parse((ROOT / relative_path).read_text(encoding="utf-8"))
        return next(
            node
            for node in module.body
            if isinstance(node, ast.ClassDef) and node.name == name
        )

    @staticmethod
    def _method_arguments(method):
        return [argument.arg for argument in method.args.args if argument.arg != "self"]

    @staticmethod
    def _catalog_signature_arguments(signature):
        declaration = "def {}:\n    pass\n".format(signature)
        method = ast.parse(declaration).body[0]
        return [argument.arg for argument in method.args.args]

    @staticmethod
    def _catalog_call_arguments(signature):
        opening = signature.index("(")
        declaration = "def documented{}:\n    pass\n".format(signature[opening:])
        method = ast.parse(declaration).body[0]
        return [argument.arg for argument in method.args.args]

    def test_catalog_is_the_exact_public_export_inventory(self):
        actual_modules = {
            "ucsb_xrp": self._public_names("vendor/current/ucsb_xrp/__init__.py"),
            "ucsb_xrp.live": self._public_names("vendor/current/ucsb_xrp/live.py"),
        }
        self.assertEqual(self.catalog["publicModules"], actual_modules)
        for module_name, names in actual_modules.items():
            with self.subTest(module=module_name):
                missing = [name for name in names if name not in self.symbol_anchors]
                self.assertEqual(missing, [])

    def test_catalog_ids_are_unique_and_type_links_resolve(self):
        ids = [section["id"] for section in self.catalog["sections"]]
        ids.extend(entry["id"] for entry in self.entries)
        ids.extend(
            method["id"]
            for entry in self.entries
            for method in entry.get("methods", [])
        )
        self.assertEqual(len(ids), len(set(ids)))

        builtins = {
            "None",
            "bool",
            "float",
            "int",
            "list",
            "sequence",
            "str",
            "tuple",
        }
        unresolved = []
        type_values = []
        for entry in self.entries:
            for value in entry.get("properties", []):
                type_values.append((entry["id"], value["type"]))
            if entry.get("returns"):
                type_values.append((entry["id"], entry["returns"]["type"]))
            for method in entry.get("methods", []):
                for value in method.get("parameters", []):
                    type_values.append((method["id"], value["type"]))
                if method.get("returns"):
                    type_values.append((method["id"], method["returns"]["type"]))

        for owner, type_value in type_values:
            for token in re.findall(r"[A-Za-z_][A-Za-z0-9_]*", type_value):
                if token in builtins or token in self.symbol_anchors:
                    continue
                if token[0].isupper():
                    unresolved.append((owner, token))
        self.assertEqual(unresolved, [])

    def test_student_component_signatures_match_the_base_classes(self):
        component_specs = {
            "sensor-model": "SensorModelBase",
            "wheel-speed-controller": "WheelSpeedControllerBase",
            "differential-drive": "DifferentialDriveBase",
            "odometry": "OdometryBase",
            "navigation-controller": "NavigationControllerBase",
            "grid-planner": "GridPlannerBase",
        }
        for entry_id, base_name in component_specs.items():
            with self.subTest(component=entry_id):
                entry = self.entries_by_id[entry_id]
                self.assertEqual(entry["baseClass"], base_name)
                base = self._class("vendor/current/ucsb_xrp/student_api.py", base_name)
                actual_methods = {
                    node.name: self._method_arguments(node)
                    for node in base.body
                    if isinstance(node, ast.FunctionDef)
                    and not node.name.startswith("_")
                    and not any(
                        isinstance(decorator, ast.Name)
                        and decorator.id == "property"
                        for decorator in node.decorator_list
                    )
                }
                documented_methods = {
                    method["name"]: self._catalog_signature_arguments(
                        method["signature"]
                    )
                    for method in entry["methods"]
                }
                self.assertEqual(documented_methods, actual_methods)

                actual_properties = {
                    node.name
                    for node in base.body
                    if isinstance(node, ast.FunctionDef)
                    and any(
                        isinstance(decorator, ast.Name)
                        and decorator.id == "property"
                        for decorator in node.decorator_list
                    )
                }
                actual_properties.discard("config")
                documented_properties = {
                    value["name"] for value in entry.get("properties", [])
                }
                self.assertEqual(documented_properties, actual_properties)

    def test_configuration_fields_and_effective_defaults_match_code(self):
        robot_config = self._class("vendor/current/ucsb_xrp/config.py", "RobotConfig")
        field_names = ast.literal_eval(
            next(
                statement.value
                for statement in robot_config.body
                if isinstance(statement, ast.Assign)
                and any(
                    isinstance(target, ast.Name) and target.id == "_field_names"
                    for target in statement.targets
                )
            )
        )
        documented = self.entries_by_id["class-robot-config"]["properties"]
        self.assertEqual([value["name"] for value in documented], list(field_names))
        expected_defaults = {
            "sample_period_ms": "20",
            "wheel_diameter_mm": "60.0",
            "encoder_counts_per_revolution": "585.0",
            "track_width_mm": "155.0",
            "left_motor_sign": "1",
            "right_motor_sign": "1",
            "left_encoder_sign": "1",
            "right_encoder_sign": "1",
            "left_start_command": "0.0",
            "right_start_command": "0.0",
            "left_speed_command_gain": "0.0",
            "right_speed_command_gain": "0.0",
            "wheel_speed_filter_time_constant_ms": "80.0",
            "wheel_speed_kp": "0.0",
            "max_drive_command": "1.0",
        }
        self.assertEqual(
            {value["name"]: value["default"] for value in documented},
            expected_defaults,
        )

        navigation_config = self._class(
            "vendor/current/ucsb_xrp/config.py", "NavigationConfig"
        )
        navigation_fields = ast.literal_eval(
            next(
                statement.value
                for statement in navigation_config.body
                if isinstance(statement, ast.Assign)
                and any(
                    isinstance(target, ast.Name) and target.id == "_field_names"
                    for target in statement.targets
                )
            )
        )
        self.assertEqual(
            [
                value["name"]
                for value in self.entries_by_id["class-navigation-config"][
                    "properties"
                ]
            ],
            list(navigation_fields),
        )

    def test_robot_record_and_live_signatures_match_the_implementation(self):
        robot = self._class("vendor/current/ucsb_xrp/robot.py", "Robot")
        actual_robot_methods = {
            node.name: self._method_arguments(node)
            for node in robot.body
            if isinstance(node, ast.FunctionDef)
            and not node.name.startswith("_")
            and not any(
                isinstance(decorator, ast.Name) and decorator.id == "property"
                for decorator in node.decorator_list
            )
        }
        documented_robot_methods = {
            method["name"]: self._catalog_signature_arguments(method["signature"])
            for method in self.entries_by_id["robot"]["methods"]
        }
        self.assertEqual(documented_robot_methods, actual_robot_methods)

        record_entries = {
            "RawSensors": "record-raw-sensors",
            "Measurements": "record-measurements",
            "WheelSpeeds": "record-wheel-speeds",
            "MotionCommand": "record-motion-command",
            "DriveCommand": "record-drive-command",
            "Pose": "record-pose",
            "RobotState": "record-robot-state",
            "NavigationGoal": "record-navigation-goal",
            "GridCell": "record-grid-cell",
            "GridPath": "record-grid-path",
        }
        for class_name, entry_id in record_entries.items():
            with self.subTest(record=class_name):
                record = self._class("vendor/current/ucsb_xrp/records.py", class_name)
                constructor = next(
                    node
                    for node in record.body
                    if isinstance(node, ast.FunctionDef) and node.name == "__init__"
                )
                self.assertEqual(
                    self._catalog_call_arguments(
                        self.entries_by_id[entry_id]["signature"]
                    ),
                    self._method_arguments(constructor),
                )

        live_module = ast.parse(
            (ROOT / "vendor/current/ucsb_xrp/live.py").read_text(encoding="utf-8")
        )
        live_functions = {
            node.name: self._method_arguments(node)
            for node in live_module.body
            if isinstance(node, ast.FunctionDef)
            and node.name in self.catalog["publicModules"]["ucsb_xrp.live"]
        }
        live_entries = {
            symbol: entry
            for entry in self.entries
            for symbol in entry["symbols"]
            if symbol in live_functions
        }
        documented_live_functions = {
            name: self._catalog_signature_arguments(
                entry["signature"].removeprefix("live.")
            )
            for name, entry in live_entries.items()
        }
        self.assertEqual(documented_live_functions, live_functions)

    def test_generated_reference_files_are_current(self):
        subprocess.run(
            ["node", "scripts/render-api-reference.mjs", "--check"],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )

    def test_catalog_contains_the_component_behaviors_used_by_checks(self):
        wheel_text = json.dumps(self.entries_by_id["wheel-speed-controller"])
        odometry_text = json.dumps(self.entries_by_id["odometry"])
        navigation_text = json.dumps(self.entries_by_id["navigation-controller"])
        planner_text = json.dumps(self.entries_by_id["grid-planner"])
        self.assertIn("larger speed error", wheel_text)
        self.assertIn("exact constant-curvature arc", odometry_text)
        self.assertIn("Turn toward a goal before driving", navigation_text)
        self.assertIn("realign", navigation_text)
        self.assertIn("Any route that connects", planner_text)
        self.assertNotIn("minimum-length route is not required", planner_text.lower())


if __name__ == "__main__":
    unittest.main()
