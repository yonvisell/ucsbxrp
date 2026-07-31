#!/usr/bin/env python3
"""Hash and verify the canonical Python course package deterministically."""

import argparse
import hashlib
import json
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = REPOSITORY_ROOT / "vendor" / "current" / "ucsb_xrp"
DEFAULT_RELEASE = REPOSITORY_ROOT / "vendor" / "current" / "release.json"
HASH_ALGORITHM = "sha256-file-manifest-v1"


def source_manifest(source_root):
    """Return a stable text manifest of every Python source file."""
    root = Path(source_root)
    if not root.is_dir():
        raise ValueError("Course source directory does not exist: {}".format(root))
    lines = []
    for path in sorted(root.rglob("*.py"), key=lambda item: item.as_posix()):
        if path.is_symlink():
            raise ValueError("Course source must not contain symlinks: {}".format(path))
        relative = path.relative_to(root.parent).as_posix()
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        lines.append("{}  {}\n".format(digest, relative))
    if not lines:
        raise ValueError("Course source contains no Python files")
    return "".join(lines)


def source_identity(source_root):
    manifest = source_manifest(source_root)
    return {
        "algorithm": HASH_ALGORITHM,
        "file_count": manifest.count("\n"),
        "sha256": hashlib.sha256(manifest.encode("utf-8")).hexdigest(),
        "manifest": manifest,
    }


def verify_release(source_root, release_path):
    identity = source_identity(source_root)
    with Path(release_path).open("r", encoding="utf-8") as handle:
        release = json.load(handle)
    recorded = release["ucsb_xrp"]
    if recorded.get("source_hash_algorithm") != identity["algorithm"]:
        raise ValueError("Course source hash algorithm does not match release.json")
    if recorded.get("source_file_count") != identity["file_count"]:
        raise ValueError("Course source file count does not match release.json")
    if recorded.get("source_sha256") != identity["sha256"]:
        raise ValueError("Course source SHA-256 does not match release.json")
    return identity


def make_parser():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("hash", "verify"))
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--release", type=Path, default=DEFAULT_RELEASE)
    return parser


def main(argv=None):
    args = make_parser().parse_args(argv)
    identity = (
        verify_release(args.source, args.release)
        if args.command == "verify"
        else source_identity(args.source)
    )
    print(
        json.dumps(
            {key: value for key, value in identity.items() if key != "manifest"},
            indent=2,
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
