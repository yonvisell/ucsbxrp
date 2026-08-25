#!/usr/bin/env python3
"""Create, check, and publish instructor-authored UCSBXRP challenges."""

import argparse
import json
from pathlib import Path
import re
import shutil


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
CATALOG_RELATIVE_PATH = Path("vendor/current/project_catalog.json")
TODO_MARKER = "AUTHOR_TODO"
README_SECTIONS = (
    "## Objective",
    "## Student implementations",
    "## Supplied project files and services",
    "## Program flow",
    "## Work sequence",
)
SPEC_SCHEMA_VERSION = 1
ALLOWED_OVERRIDE_SUFFIXES = (".json", ".md", ".py", ".txt")
GENERATED_SPEC_FILES = ("README.md", "world.json")


class AuthoringError(ValueError):
    pass


def _catalog_path(root):
    return Path(root) / CATALOG_RELATIVE_PATH


def read_catalog(root):
    with _catalog_path(root).open(encoding="utf-8") as source:
        value = json.load(source)
    if not isinstance(value, list):
        raise AuthoringError("project_catalog.json must contain a list")
    return value


def write_catalog(root, catalog):
    _catalog_path(root).write_text(
        json.dumps(catalog, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def catalog_entry(catalog, project_id):
    for entry in catalog:
        if entry.get("id") == project_id:
            return entry
    raise AuthoringError("unknown project id: " + project_id)


def _challenge_number(project_id):
    match = re.fullmatch(r"challenge_([1-9][0-9]*)", project_id)
    if not match:
        raise AuthoringError("challenge id must have the form challenge_6")
    return int(match.group(1))


def _single_line(value, field):
    if not isinstance(value, str) or not value.strip() or "\n" in value:
        raise AuthoringError(field + " must be one nonempty line")
    return value.strip()


def _paragraph(value, field):
    if not isinstance(value, str) or not value.strip():
        raise AuthoringError(field + " must be nonempty text")
    return value.strip()


def _text_list(value, field):
    if not isinstance(value, list) or not value:
        raise AuthoringError(field + " must contain at least one item")
    return [_paragraph(item, field + " item") for item in value]


def _safe_project_path(value):
    if not isinstance(value, str) or not value.strip():
        raise AuthoringError("file override paths must be nonempty strings")
    if "\\" in value or ":" in value:
        raise AuthoringError("invalid project file override: " + value)
    path = Path(value.strip())
    if (
        path.is_absolute()
        or ".." in path.parts
        or "." in path.parts
        or path.suffix not in ALLOWED_OVERRIDE_SUFFIXES
    ):
        raise AuthoringError("invalid project file override: " + value)
    if path.as_posix() in GENERATED_SPEC_FILES:
        raise AuthoringError(
            path.as_posix() + " is generated from its specification fields"
        )
    return path


def read_spec(path):
    try:
        with Path(path).open(encoding="utf-8") as source:
            value = json.load(source)
    except (OSError, json.JSONDecodeError) as error:
        raise AuthoringError("could not read challenge specification: " + str(error))
    if not isinstance(value, dict):
        raise AuthoringError("challenge specification must contain one object")
    return value


def validate_spec(spec):
    """Return a normalized authoring specification or raise AuthoringError."""
    if not isinstance(spec, dict):
        raise AuthoringError("challenge specification must contain one object")
    if spec.get("schema_version") != SPEC_SCHEMA_VERSION:
        raise AuthoringError(
            "schema_version must be {}".format(SPEC_SCHEMA_VERSION)
        )

    normalized = {
        "schema_version": SPEC_SCHEMA_VERSION,
        "source_id": _single_line(spec.get("source_id"), "source_id"),
        "id": _single_line(spec.get("id"), "id"),
        "title": _single_line(spec.get("title"), "title"),
        "summary": _single_line(spec.get("summary"), "summary"),
        "objective": _paragraph(spec.get("objective"), "objective"),
        "program_flow": _paragraph(spec.get("program_flow"), "program_flow"),
        "evidence": _text_list(spec.get("evidence"), "evidence"),
        "work_sequence": _text_list(spec.get("work_sequence"), "work_sequence"),
    }
    _challenge_number(normalized["id"])

    implementations = spec.get("student_implementations")
    if not isinstance(implementations, list) or not implementations:
        raise AuthoringError(
            "student_implementations must contain at least one component"
        )
    normalized_implementations = []
    for index, item in enumerate(implementations):
        if not isinstance(item, dict):
            raise AuthoringError(
                "student_implementations[{}] must be an object".format(index)
            )
        normalized_implementations.append(
            {
                "file": _single_line(item.get("file"), "component file"),
                "class_name": _single_line(
                    item.get("class_name"), "component class_name"
                ),
                "responsibility": _single_line(
                    item.get("responsibility"), "component responsibility"
                ),
            }
        )
    normalized["student_implementations"] = normalized_implementations

    supplied = spec.get("supplied_files")
    if not isinstance(supplied, list) or not supplied:
        raise AuthoringError("supplied_files must contain at least one item")
    normalized_supplied = []
    for index, item in enumerate(supplied):
        if not isinstance(item, dict):
            raise AuthoringError("supplied_files[{}] must be an object".format(index))
        normalized_supplied.append(
            {
                "name": _single_line(item.get("name"), "supplied file name"),
                "use": _single_line(item.get("use"), "supplied file use"),
            }
        )
    if not any(item["name"] == "world.json" for item in normalized_supplied):
        raise AuthoringError("supplied_files must explain world.json")
    normalized["supplied_files"] = normalized_supplied

    world = spec.get("world")
    world_errors = _world_errors(world, "specification")
    # The copied challenge loader imposes names such as "turn" or
    # "destination". A complete challenge.py override defines its own world
    # inputs, so those source-specific names no longer apply.
    raw_overrides = spec.get("files", {})
    if not (isinstance(raw_overrides, dict) and "challenge.py" in raw_overrides):
        world_errors.extend(_source_world_errors(world, normalized["source_id"]))
    if world_errors:
        raise AuthoringError("\n".join(world_errors))
    normalized["world"] = world

    overrides = raw_overrides
    if not isinstance(overrides, dict):
        raise AuthoringError("files must be an object of path-to-text overrides")
    normalized_overrides = {}
    for unsafe_path, contents in overrides.items():
        path = _safe_project_path(unsafe_path)
        if not isinstance(contents, str):
            raise AuthoringError("file override contents must be text: " + unsafe_path)
        if path.suffix == ".py":
            try:
                compile(contents, str(path), "exec")
            except SyntaxError as error:
                raise AuthoringError(
                    "{}:{}: {}".format(path, error.lineno, error.msg)
                )
        normalized_overrides[path.as_posix()] = contents
    normalized["files"] = normalized_overrides
    return normalized


def _source_world_errors(world, source_id):
    """Check names used directly by the copied challenge.py source."""
    if not isinstance(world, dict) or not isinstance(world.get("worlds"), list):
        return []
    default_id = world.get("default_world")
    selected = next(
        (
            item
            for item in world["worlds"]
            if isinstance(item, dict) and item.get("id") == default_id
        ),
        None,
    )
    if selected is None:
        return []
    markers = selected.get("markers", [])
    if not isinstance(markers, list):
        markers = []
    waypoints = [
        item
        for item in markers
        if isinstance(item, dict) and item.get("type") == "waypoint"
    ]
    waypoint_names = {item.get("name") for item in waypoints}
    required_waypoint = {
        "challenge_1": "finish",
        "challenge_2": "turn",
        "challenge_4": "destination",
        "challenge_5": "destination",
    }.get(source_id)
    errors = []
    if required_waypoint is not None and required_waypoint not in waypoint_names:
        errors.append(
            "specification: {} source requires waypoint {!r}".format(
                source_id, required_waypoint
            )
        )
    if source_id == "challenge_3" and not waypoints:
        errors.append("specification: challenge_3 source requires at least one waypoint")
    if source_id == "challenge_5":
        obstacles = selected.get("obstacles", [])
        features = {
            item.get("feature")
            for item in obstacles
            if isinstance(item, dict) and isinstance(item.get("feature"), str)
        }
        if "center_gate" not in features:
            errors.append(
                "specification: challenge_5 source requires obstacle feature 'center_gate'"
            )
    return errors


def _markdown_cell(value):
    return str(value).replace("|", "\\|").replace("\n", " ")


def render_spec_readme(spec):
    number = _challenge_number(spec["id"])
    lines = [
        "# Challenge {}: {}".format(number, spec["title"]),
        "",
        "## Objective",
        "",
        spec["objective"],
        "",
        "## Student implementations",
        "",
        "| File | Class | Responsibility |",
        "| --- | --- | --- |",
    ]
    for item in spec["student_implementations"]:
        lines.append(
            "| `{}` | `{}` | {} |".format(
                _markdown_cell(item["file"]),
                _markdown_cell(item["class_name"]),
                _markdown_cell(item["responsibility"]),
            )
        )
    lines.extend(
        [
            "",
            "## Supplied project files and services",
            "",
            "| File or service | Use in this challenge |",
            "| --- | --- |",
        ]
    )
    for item in spec["supplied_files"]:
        lines.append(
            "| `{}` | {} |".format(
                _markdown_cell(item["name"]), _markdown_cell(item["use"])
            )
        )
    lines.extend(
        [
            "",
            "## Program flow",
            "",
            "```text",
            spec["program_flow"],
            "```",
            "",
            "## Evidence to collect",
            "",
        ]
    )
    lines.extend("- " + item for item in spec["evidence"])
    lines.extend(["", "## Work sequence", ""])
    lines.extend(
        "{}. {}".format(index, item)
        for index, item in enumerate(spec["work_sequence"], start=1)
    )
    return "\n".join(lines) + "\n"


def create_draft_from_spec(root, spec):
    """Create an unpublished, structurally checked draft from a specification."""
    root = Path(root)
    spec = validate_spec(spec)
    catalog = read_catalog(root)
    project_id = spec["id"]
    if any(entry.get("id") == project_id for entry in catalog):
        raise AuthoringError("project id already exists: " + project_id)
    source = catalog_entry(catalog, spec["source_id"])
    if source.get("kind") != "challenge" or not source.get("published"):
        raise AuthoringError("the source must be a published challenge")

    source_directory = root / "vendor/current" / source["source"]
    relative_target = "starters/" + project_id
    target_directory = root / "vendor/current" / relative_target
    if target_directory.exists():
        raise AuthoringError("target directory already exists: " + str(target_directory))

    shutil.copytree(source_directory, target_directory)
    try:
        (target_directory / "README.md").write_text(
            render_spec_readme(spec), encoding="utf-8"
        )
        (target_directory / "world.json").write_text(
            json.dumps(spec["world"], indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        for relative_path, contents in spec["files"].items():
            path = target_directory / relative_path
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(contents, encoding="utf-8")

        entry = {
            "id": project_id,
            "kind": "challenge",
            "source": relative_target,
            "label": "Challenge {} · {}".format(
                _challenge_number(project_id), spec["title"]
            ),
            "short_label": "{} · {}".format(
                _challenge_number(project_id), spec["title"]
            ),
            "summary": spec["summary"],
            "entrypoint": "main.py",
            "published": False,
        }
        errors = project_errors(root, entry)
        if errors:
            raise AuthoringError("\n".join(errors))
        catalog.append(entry)
        write_catalog(root, catalog)
        return target_directory
    except Exception:
        shutil.rmtree(target_directory, ignore_errors=True)
        raise


def create_draft(root, source_id, project_id, title, summary):
    root = Path(root)
    catalog = read_catalog(root)
    if any(entry.get("id") == project_id for entry in catalog):
        raise AuthoringError("project id already exists: " + project_id)
    number = _challenge_number(project_id)
    source = catalog_entry(catalog, source_id)
    if source.get("kind") != "challenge" or not source.get("published"):
        raise AuthoringError("the source must be a published challenge")
    if not title.strip() or "\n" in title or not summary.strip() or "\n" in summary:
        raise AuthoringError("title and summary must each be one nonempty line")

    source_directory = root / "vendor/current" / source["source"]
    relative_target = "starters/" + project_id
    target_directory = root / "vendor/current" / relative_target
    if target_directory.exists():
        raise AuthoringError("target directory already exists: " + str(target_directory))
    shutil.copytree(source_directory, target_directory)

    readme = target_directory / "README.md"
    lines = readme.read_text(encoding="utf-8").splitlines()
    lines[0] = "# Challenge {}: {}".format(number, title.strip())
    lines.insert(
        2,
        "{}: Rewrite the objective, responsibilities, flow, and work sequence for this challenge.".format(
            TODO_MARKER
        ),
    )
    readme.write_text("\n".join(lines) + "\n", encoding="utf-8")

    for name, instruction in (
        ("challenge.py", "define this challenge's task values"),
        ("main.py", "implement this challenge's mission sequence"),
    ):
        path = target_directory / name
        path.write_text(
            "# {}: {}.\n".format(TODO_MARKER, instruction)
            + path.read_text(encoding="utf-8"),
            encoding="utf-8",
        )

    world_path = target_directory / "world.json"
    world = json.loads(world_path.read_text(encoding="utf-8"))
    world["author_todo"] = (
        TODO_MARKER + ": define the bounds, initial pose, obstacles, and markers."
    )
    world_path.write_text(
        json.dumps(world, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    catalog.append(
        {
            "id": project_id,
            "kind": "challenge",
            "source": relative_target,
            "label": "Challenge {} · {}".format(number, title.strip()),
            "short_label": "{} · {}".format(number, title.strip()),
            "summary": summary.strip(),
            "entrypoint": "main.py",
            "published": False,
        }
    )
    write_catalog(root, catalog)
    return target_directory


def _world_errors(world, prefix):
    errors = []
    if not isinstance(world, dict) or not isinstance(world.get("worlds"), list):
        return [prefix + ": world.json must contain a worlds list"]
    ids = []
    for index, item in enumerate(world["worlds"]):
        name = "{}: worlds[{}]".format(prefix, index)
        if not isinstance(item, dict):
            errors.append(name + " must be an object")
            continue
        ids.append(item.get("id"))
        bounds = item.get("bounds")
        if not isinstance(bounds, dict):
            errors.append(name + " must define bounds")
            continue
        try:
            minimum_x = float(bounds["minimum_x_mm"])
            minimum_y = float(bounds["minimum_y_mm"])
            maximum_x = float(bounds["maximum_x_mm"])
            maximum_y = float(bounds["maximum_y_mm"])
            if maximum_x <= minimum_x or maximum_y <= minimum_y:
                errors.append(name + " bounds must have positive width and height")
        except (KeyError, TypeError, ValueError):
            errors.append(name + " bounds must contain four numbers")
    if not ids:
        errors.append(prefix + ": world.json needs at least one world")
    elif len(set(ids)) != len(ids):
        errors.append(prefix + ": world ids must be unique")
    if world.get("default_world") not in ids:
        errors.append(prefix + ": default_world must name a defined world")
    return errors


def project_errors(root, entry):
    root = Path(root)
    project_id = str(entry.get("id", "unnamed"))
    directory = root / "vendor/current" / str(entry.get("source", ""))
    errors = []
    if not directory.is_dir():
        return [project_id + ": source directory is missing"]
    required = ("README.md", "world.json", str(entry.get("entrypoint", "")))
    if entry.get("kind") == "challenge":
        required += ("challenge.py", "course_setup.py", "component_checks.py")
    for name in required:
        if not name or not (directory / name).is_file():
            errors.append(project_id + ": missing " + (name or "entrypoint"))

    for path in sorted(directory.rglob("*")):
        if not path.is_file() or path.suffix not in (".py", ".md", ".json"):
            continue
        text = path.read_text(encoding="utf-8")
        if TODO_MARKER in text:
            errors.append(project_id + ": unresolved author task in " + path.name)
        if path.suffix == ".py":
            try:
                compile(text, str(path), "exec")
            except SyntaxError as error:
                errors.append(
                    "{}: {}:{}: {}".format(
                        project_id, path.name, error.lineno, error.msg
                    )
                )

    readme = directory / "README.md"
    if readme.is_file() and entry.get("kind") == "challenge":
        text = readme.read_text(encoding="utf-8")
        for section in README_SECTIONS:
            if section not in text:
                errors.append(project_id + ": README is missing " + section)
        if "world.json" not in text:
            errors.append(project_id + ": README does not explain world.json")

    world_path = directory / "world.json"
    if world_path.is_file():
        try:
            world = json.loads(world_path.read_text(encoding="utf-8"))
            errors.extend(_world_errors(world, project_id))
        except json.JSONDecodeError as error:
            errors.append(project_id + ": invalid world.json: " + str(error))
    return errors


def catalog_errors(root, project_id=None, include_drafts=False):
    catalog = read_catalog(root)
    errors = []
    ids = [entry.get("id") for entry in catalog]
    sources = [entry.get("source") for entry in catalog]
    if len(set(ids)) != len(ids):
        errors.append("project catalog ids must be unique")
    if len(set(sources)) != len(sources):
        errors.append("project catalog sources must be unique")
    entries = catalog
    if project_id is not None:
        entries = [catalog_entry(catalog, project_id)]
    elif not include_drafts:
        entries = [entry for entry in catalog if entry.get("published")]
    for entry in entries:
        errors.extend(project_errors(root, entry))
    return errors


def publish(root, project_id):
    catalog = read_catalog(root)
    entry = catalog_entry(catalog, project_id)
    errors = project_errors(root, entry)
    if errors:
        raise AuthoringError("\n".join(errors))
    entry["published"] = True
    write_catalog(root, catalog)


def make_parser():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=REPOSITORY_ROOT)
    commands = parser.add_subparsers(dest="command", required=True)

    create = commands.add_parser("create", help="create an unpublished draft")
    create.add_argument("--spec", type=Path)
    create.add_argument("--from", dest="source_id")
    create.add_argument("--id")
    create.add_argument("--title")
    create.add_argument("--summary")

    check = commands.add_parser("check", help="check published projects or one id")
    check.add_argument("project_id", nargs="?")
    check.add_argument("--include-drafts", action="store_true")

    publish_parser = commands.add_parser(
        "publish", help="validate a draft and add it to the student catalog"
    )
    publish_parser.add_argument("project_id")
    return parser


def main(argv=None):
    args = make_parser().parse_args(argv)
    try:
        if args.command == "create":
            if args.spec is not None:
                if any(
                    value is not None
                    for value in (args.source_id, args.id, args.title, args.summary)
                ):
                    raise AuthoringError(
                        "--spec cannot be combined with --from, --id, --title, or --summary"
                    )
                path = create_draft_from_spec(args.root, read_spec(args.spec))
            else:
                if any(
                    value is None
                    for value in (args.source_id, args.id, args.title, args.summary)
                ):
                    raise AuthoringError(
                        "manual creation requires --from, --id, --title, and --summary"
                    )
                path = create_draft(
                    args.root, args.source_id, args.id, args.title, args.summary
                )
            print("Draft created: " + str(path))
            if args.spec is not None:
                print(
                    "Specification applied and project files checked. "
                    "Run the virtual and component tests before publishing."
                )
            else:
                print("Resolve every AUTHOR_TODO, then run check and publish.")
            return 0
        if args.command == "publish":
            publish(args.root, args.project_id)
            print("Published " + args.project_id)
            return 0
        errors = catalog_errors(args.root, args.project_id, args.include_drafts)
        if errors:
            for error in errors:
                print("ERROR: " + error)
            return 1
        print("Challenge projects are complete and internally consistent.")
        return 0
    except AuthoringError as error:
        print("ERROR: " + str(error))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
