import ast
from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[2]


class ApiReferenceParityTests(unittest.TestCase):
    def test_every_public_course_symbol_is_named_in_the_student_reference(self):
        package_source = (
            ROOT / "vendor/current/ucsb_xrp/__init__.py"
        ).read_text(encoding="utf-8")
        module = ast.parse(package_source)
        public_names = None
        for statement in module.body:
            if not isinstance(statement, ast.Assign):
                continue
            if any(
                isinstance(target, ast.Name) and target.id == "__all__"
                for target in statement.targets
            ):
                public_names = ast.literal_eval(statement.value)
                break
        self.assertIsNotNone(public_names, "ucsb_xrp must define __all__")

        reference = (
            ROOT / "apps/reference/src/ReferenceApp.tsx"
        ).read_text(encoding="utf-8")
        missing = [
            name
            for name in public_names
            if re.search(
                r"(?<![A-Za-z0-9_])" + re.escape(name) + r"(?![A-Za-z0-9_])",
                reference,
            )
            is None
        ]
        self.assertEqual(
            missing,
            [],
            "Add every public ucsb_xrp name to the student API reference",
        )


if __name__ == "__main__":
    unittest.main()
