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
    create.add_argument("--from", dest="source_id", required=True)
    create.add_argument("--id", required=True)
    create.add_argument("--title", required=True)
    create.add_argument("--summary", required=True)

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
            path = create_draft(
                args.root, args.source_id, args.id, args.title, args.summary
            )
            print("Draft created: " + str(path))
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
