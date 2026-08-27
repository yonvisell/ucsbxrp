#!/usr/bin/env python3
"""Create, check, and publish instructor-authored UCSBXRP challenges."""

import argparse
import ast
import json
from math import isfinite
import os
from pathlib import Path
import re
import shutil
import tempfile


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
CATALOG_RELATIVE_PATH = Path("vendor/current/project_catalog.json")
TODO_MARKER = "AUTHOR_TODO"
README_SECTIONS = (
    "## What you implement",
    "## Provided files and tools",
    "## How the program runs",
    "## Complete the challenge",
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
    catalog_path = _catalog_path(root)
    temporary_path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=catalog_path.parent,
            prefix="." + catalog_path.name + ".",
            suffix=".tmp",
            delete=False,
        ) as temporary:
            temporary_path = Path(temporary.name)
            temporary.write(
                json.dumps(catalog, indent=2, ensure_ascii=False) + "\n"
            )
            temporary.flush()
            os.fsync(temporary.fileno())
        os.replace(temporary_path, catalog_path)
    finally:
        if temporary_path is not None and temporary_path.exists():
            temporary_path.unlink()


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


def _safe_component_path(value):
    value = _single_line(value, "component file")
    if "\\" in value or ":" in value:
        raise AuthoringError("invalid student component file: " + value)
    path = Path(value)
    if (
        path.is_absolute()
        or "." in path.parts
        or ".." in path.parts
        or path.suffix != ".py"
    ):
        raise AuthoringError("invalid student component file: " + value)
    return path.as_posix()


def _python_class_name(value):
    value = _single_line(value, "component class_name")
    if re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", value) is None:
        raise AuthoringError("component class_name must be a Python identifier")
    return value


def _selection_flag(value):
    value = _single_line(value, "component selection_flag")
    if re.fullmatch(r"USE_STUDENT_[A-Z][A-Z0-9_]*", value) is None:
        raise AuthoringError(
            "component selection_flag must have the form USE_STUDENT_COMPONENT_NAME"
        )
    return value


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
    implementation_keys = set()
    for index, item in enumerate(implementations):
        if not isinstance(item, dict):
            raise AuthoringError(
                "student_implementations[{}] must be an object".format(index)
            )
        normalized_item = {
            "file": _safe_component_path(item.get("file")),
            "class_name": _python_class_name(item.get("class_name")),
            "selection_flag": _selection_flag(item.get("selection_flag")),
            "responsibility": _single_line(
                item.get("responsibility"), "component responsibility"
            ),
        }
        key = (normalized_item["file"], normalized_item["class_name"])
        if key in implementation_keys:
            raise AuthoringError(
                "student_implementations contains a duplicate file and class"
            )
        implementation_keys.add(key)
        normalized_implementations.append(normalized_item)
    normalized["student_implementations"] = normalized_implementations

    supplied = spec.get("supplied_files")
    if not isinstance(supplied, list) or not supplied:
        raise AuthoringError("supplied_files must contain at least one item")
    normalized_supplied = []
    supplied_names = set()
    for index, item in enumerate(supplied):
        if not isinstance(item, dict):
            raise AuthoringError("supplied_files[{}] must be an object".format(index))
        normalized_item = {
            "name": _single_line(item.get("name"), "supplied file name"),
            "use": _single_line(item.get("use"), "supplied file use"),
        }
        if normalized_item["name"] in supplied_names:
            raise AuthoringError(
                "supplied_files contains duplicate item: " + normalized_item["name"]
            )
        supplied_names.add(normalized_item["name"])
        normalized_supplied.append(normalized_item)
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
    if source_id == "challenge_2" and "turn" in waypoint_names:
        turn = next(item for item in waypoints if item.get("name") == "turn")
        if not _valid_number(turn.get("heading_rad")):
            errors.append(
                "specification: challenge_2 source requires the 'turn' waypoint to define heading_rad"
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
        spec["objective"],
        "",
        "## What you implement",
        "",
        "| File | Class | What it does |",
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
            "## Provided files and tools",
            "",
            "| File or tool | What it provides |",
            "| --- | --- |",
        ]
    )
    for item in spec["supplied_files"]:
        lines.append(
            "| `{}` | {} |".format(
                _markdown_cell(item["name"]), _markdown_cell(item["use"])
            )
        )
    lines.extend(["", "## How the program runs", ""])
    lines.extend(
        "{}. {}".format(index, item)
        for index, item in enumerate(
            (
                line.strip()
                for line in spec["program_flow"].splitlines()
                if line.strip()
            ),
            start=1,
        )
    )
    lines.extend(["", "## Evidence to collect", ""])
    lines.extend("- " + item for item in spec["evidence"])
    lines.extend(["", "## Complete the challenge", ""])
    lines.extend(
        "{}. {}".format(index, item)
        for index, item in enumerate(spec["work_sequence"], start=1)
    )
    return "\n".join(lines) + "\n"


def _catalog_components(entry, project_id):
    """Return normalized component metadata and human-readable catalog errors."""
    raw_components = entry.get("components")
    if not isinstance(raw_components, list) or not raw_components:
        return [], [project_id + ": challenge catalog has no component metadata"]

    components = []
    errors = []
    files = set()
    class_names = set()
    selection_flags = set()
    for index, item in enumerate(raw_components):
        prefix = "{}: catalog component {}".format(project_id, index + 1)
        if not isinstance(item, dict):
            errors.append(prefix + " must be an object")
            continue
        try:
            component = {
                "name": _python_class_name(item.get("name")),
                "file": _safe_component_path(item.get("file")),
                "selection_flag": _selection_flag(item.get("selection_flag")),
                "carry_forward": item.get("carry_forward"),
            }
        except AuthoringError as error:
            errors.append(prefix + ": " + str(error))
            continue
        if not isinstance(component["carry_forward"], bool):
            errors.append(prefix + ": carry_forward must be true or false")
            continue
        for value, seen, label in (
            (component["file"], files, "file"),
            (component["name"], class_names, "class"),
            (component["selection_flag"], selection_flags, "selection flag"),
        ):
            if value in seen:
                errors.append(prefix + " repeats " + label + " " + value)
            seen.add(value)
        components.append(component)
    return components, errors


def _draft_components(source, spec):
    """Merge copied-project metadata with components introduced by the spec."""
    source_id = str(source.get("id", "source challenge"))
    components, errors = _catalog_components(source, source_id)
    if errors:
        raise AuthoringError("\n".join(errors))

    by_file = {item["file"]: item for item in components}
    for declared in spec["student_implementations"]:
        inherited = by_file.get(declared["file"])
        if inherited is not None:
            if inherited["name"] != declared["class_name"]:
                raise AuthoringError(
                    "{} declares class {}, but {} defines that component as {}".format(
                        declared["file"],
                        declared["class_name"],
                        source_id,
                        inherited["name"],
                    )
                )
            if inherited["selection_flag"] != declared["selection_flag"]:
                raise AuthoringError(
                    "{} must retain selection flag {} from {}".format(
                        declared["class_name"],
                        inherited["selection_flag"],
                        source_id,
                    )
                )
            continue
        component = {
            "name": declared["class_name"],
            "file": declared["file"],
            "selection_flag": declared["selection_flag"],
            "carry_forward": False,
        }
        components.append(component)
        by_file[component["file"]] = component
    return components


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
            "components": _draft_components(source, spec),
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

    source_components, component_errors = _catalog_components(source, source_id)
    if component_errors:
        shutil.rmtree(target_directory, ignore_errors=True)
        raise AuthoringError("\n".join(component_errors))
    catalog.append(
        {
            "id": project_id,
            "kind": "challenge",
            "source": relative_target,
            "label": "Challenge {} · {}".format(number, title.strip()),
            "short_label": "{} · {}".format(number, title.strip()),
            "summary": summary.strip(),
            "entrypoint": "main.py",
            "components": source_components,
            "published": False,
        }
    )
    write_catalog(root, catalog)
    return target_directory


_WORLD_IDENTIFIER = re.compile(r"[a-z][a-z0-9_-]*\Z")


def _valid_number(value):
    return (
        not isinstance(value, bool)
        and isinstance(value, (int, float))
        and isfinite(value)
    )


def _rectangle_values(value, name, errors):
    if not isinstance(value, dict):
        errors.append(name + " must be an object")
        return None
    keys = (
        "minimum_x_mm",
        "minimum_y_mm",
        "maximum_x_mm",
        "maximum_y_mm",
    )
    if any(not _valid_number(value.get(key)) for key in keys):
        errors.append(name + " must contain four finite millimeter bounds")
        return None
    result = tuple(float(value[key]) for key in keys)
    if result[2] <= result[0] or result[3] <= result[1]:
        errors.append(name + " must have positive width and height")
        return None
    return result


def _inside_rectangle(outer, inner):
    return (
        inner[0] >= outer[0]
        and inner[1] >= outer[1]
        and inner[2] <= outer[2]
        and inner[3] <= outer[3]
    )


def _inside_point(bounds, x_mm, y_mm):
    return (
        x_mm >= bounds[0]
        and x_mm <= bounds[2]
        and y_mm >= bounds[1]
        and y_mm <= bounds[3]
    )


def _identifier_error(value, name, maximum=32):
    if (
        not isinstance(value, str)
        or not value
        or len(value) > maximum
        or _WORLD_IDENTIFIER.fullmatch(value) is None
    ):
        return (
            name
            + " must use 1 to {} lower-case letters, digits, underscores, or hyphens".format(
                maximum
            )
        )
    return None


def _optional_label_error(value, name):
    if value is None:
        return None
    if not isinstance(value, str) or not value.strip() or len(value) > 48:
        return name + " must contain 1 to 48 characters"
    return None


def _world_errors(world, prefix):
    """Return errors for the exact project world schema used by the browser."""
    errors = []
    if not isinstance(world, dict) or not isinstance(world.get("worlds"), list):
        return [prefix + ": world.json must contain a worlds list"]
    worlds = world["worlds"]
    if not worlds:
        errors.append(prefix + ": world.json needs at least one world")
    if len(worlds) > 8:
        errors.append(prefix + ": world.json may contain at most 8 worlds")

    ids = []
    for index, item in enumerate(worlds):
        name = "{}: worlds[{}]".format(prefix, index)
        if not isinstance(item, dict):
            errors.append(name + " must be an object")
            continue

        world_id = item.get("id")
        identifier_error = _identifier_error(world_id, name + ".id")
        if identifier_error:
            errors.append(identifier_error)
        else:
            ids.append(world_id)
        label = item.get("label")
        if not isinstance(label, str) or not label.strip() or len(label) > 64:
            errors.append(name + ".label must contain 1 to 64 characters")

        bounds = _rectangle_values(item.get("bounds"), name + ".bounds", errors)
        if bounds is None:
            continue

        pose = item.get(
            "initial_pose", {"x_mm": 0, "y_mm": 0, "heading_rad": 0}
        )
        if not isinstance(pose, dict):
            errors.append(name + ".initial_pose must be an object")
        elif any(
            not _valid_number(pose.get(key))
            for key in ("x_mm", "y_mm", "heading_rad")
        ):
            errors.append(
                name + ".initial_pose must define finite x_mm, y_mm, and heading_rad"
            )
        elif not _inside_point(
            bounds, float(pose["x_mm"]), float(pose["y_mm"])
        ):
            errors.append(name + ".initial_pose must be inside the arena walls")

        obstacles = item.get("obstacles", [])
        if not isinstance(obstacles, list) or len(obstacles) > 32:
            errors.append(name + ".obstacles must be a list with at most 32 items")
            obstacles = []
        feature_names = []
        for obstacle_index, obstacle in enumerate(obstacles):
            obstacle_name = "{}.obstacles[{}]".format(name, obstacle_index)
            if not isinstance(obstacle, dict):
                errors.append(obstacle_name + " must be an object")
                continue
            if obstacle.get("type") not in ("block", "wall"):
                errors.append(obstacle_name + ".type must be block or wall")
            obstacle_bounds = _rectangle_values(obstacle, obstacle_name, errors)
            if obstacle_bounds is not None and not _inside_rectangle(
                bounds, obstacle_bounds
            ):
                errors.append(obstacle_name + " must be inside the arena walls")
            label_error = _optional_label_error(
                obstacle.get("label"), obstacle_name + ".label"
            )
            if label_error:
                errors.append(label_error)
            feature = obstacle.get("feature")
            if feature is not None:
                feature_error = _identifier_error(
                    feature, obstacle_name + ".feature"
                )
                if feature_error:
                    errors.append(feature_error)
                else:
                    feature_names.append(feature)
        if len(set(feature_names)) != len(feature_names):
            errors.append(name + " obstacle feature names must be unique")

        markers = item.get("markers", [])
        if not isinstance(markers, list) or len(markers) > 32:
            errors.append(name + ".markers must be a list with at most 32 items")
            markers = []
        marker_names = []
        for marker_index, marker in enumerate(markers):
            marker_name = "{}.markers[{}]".format(name, marker_index)
            if not isinstance(marker, dict):
                errors.append(marker_name + " must be an object")
                continue
            marker_type = marker.get("type")
            if marker_type not in ("start_line", "start_box", "waypoint"):
                errors.append(marker_name + ".type is not a supported marker")
                continue
            label_error = _optional_label_error(
                marker.get("label"), marker_name + ".label"
            )
            if label_error:
                errors.append(label_error)
            marker_identifier = marker.get("name")
            if marker_identifier is not None:
                marker_error = _identifier_error(
                    marker_identifier, marker_name + ".name"
                )
                if marker_error:
                    errors.append(marker_error)
                else:
                    marker_names.append(marker_identifier)

            if marker_type == "start_box":
                marker_bounds = _rectangle_values(marker, marker_name, errors)
                if marker_bounds is not None and not _inside_rectangle(
                    bounds, marker_bounds
                ):
                    errors.append(marker_name + " must be inside the arena walls")
            elif marker_type == "start_line":
                coordinates = (
                    marker.get("x1_mm"),
                    marker.get("y1_mm"),
                    marker.get("x2_mm"),
                    marker.get("y2_mm"),
                )
                if any(not _valid_number(value) for value in coordinates):
                    errors.append(marker_name + " must define two finite endpoints")
                else:
                    x1_mm, y1_mm, x2_mm, y2_mm = map(float, coordinates)
                    if x1_mm == x2_mm and y1_mm == y2_mm:
                        errors.append(marker_name + " must have two different endpoints")
                    if not _inside_point(
                        bounds, x1_mm, y1_mm
                    ) or not _inside_point(bounds, x2_mm, y2_mm):
                        errors.append(marker_name + " must be inside the arena walls")
            else:
                x_mm = marker.get("x_mm")
                y_mm = marker.get("y_mm")
                if not _valid_number(x_mm) or not _valid_number(y_mm):
                    errors.append(marker_name + " must define finite x_mm and y_mm")
                elif not _inside_point(bounds, float(x_mm), float(y_mm)):
                    errors.append(marker_name + " must be inside the arena walls")
                heading = marker.get("heading_rad")
                if heading is not None and not _valid_number(heading):
                    errors.append(marker_name + ".heading_rad must be a finite number")
        if len(set(marker_names)) != len(marker_names):
            errors.append(name + " marker names must be unique")

    if len(set(ids)) != len(ids):
        errors.append(prefix + ": world ids must be unique")
    default_world = world.get("default_world")
    default_error = _identifier_error(default_world, prefix + ": default_world")
    if default_error:
        errors.append(default_error)
    elif default_world not in ids:
        errors.append(prefix + ": default_world must name a defined world")
    return errors


def _student_implementation_errors(directory, entry, project_id):
    """Verify the catalog's student-template metadata against project source."""
    errors = []
    components, metadata_errors = _catalog_components(entry, project_id)
    errors.extend(metadata_errors)
    course_setup = directory / "course_setup.py"
    course_setup_text = (
        course_setup.read_text(encoding="utf-8") if course_setup.is_file() else ""
    )
    for component in components:
        relative_path = component["file"]
        class_name = component["name"]
        path = directory / relative_path
        if not path.is_file():
            errors.append(project_id + ": missing student file " + relative_path)
            continue
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"), str(path))
        except SyntaxError:
            # The ordinary Python compilation error below is more precise.
            continue
        if not any(
            isinstance(node, ast.ClassDef) and node.name == class_name
            for node in tree.body
        ):
            errors.append(
                "{}: {} does not define class {}".format(
                    project_id, relative_path, class_name
                )
            )
        if re.search(
            r"^{}\s*=\s*(?:True|False)\s*$".format(
                re.escape(component["selection_flag"])
            ),
            course_setup_text,
            flags=re.MULTILINE,
        ) is None:
            errors.append(
                "{}: course_setup.py does not define {}".format(
                    project_id, component["selection_flag"]
                )
            )
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
    if entry.get("kind") == "challenge":
        errors.extend(_student_implementation_errors(directory, entry, project_id))

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
