#!/usr/bin/env python3
"""Build deterministic MicroPython bytecode from retained reference source.

The compiler is supplied explicitly so a course release cannot silently use a
different host tool. Each module is compiled twice with the same embedded,
repository-relative source name; differing bytes fail the build.
"""

import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = REPOSITORY_ROOT / "vendor" / "current" / "reference_source"
DEFAULT_OUTPUT = REPOSITORY_ROOT / "vendor" / "current" / "reference_mpy"
COMPILER_TAG = "v1.28.0"
COMPILER_COMMIT = "e0e9fbb17ed6fd06bb76e266ae554784c9c80804"
EXPECTED_VERSION = "MicroPython v1.28.0"
EXPECTED_MPY = "mpy-cross emitting mpy v6.3"
RECORDED_VERSION = "MicroPython v1.28.0; mpy-cross emitting mpy v6.3"
PORTABLE_ABI = 774


class BytecodeBuildError(RuntimeError):
    """The reference artifact could not be built or verified."""


def file_sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def compiler_version(compiler):
    result = subprocess.run(
        [str(compiler), "--version"],
        check=True,
        capture_output=True,
        text=True,
    )
    version = result.stdout.strip()
    if EXPECTED_VERSION not in version or EXPECTED_MPY not in version:
        raise BytecodeBuildError(
            "Expected the MicroPython 1.28.0 mpy v6.3 compiler; observed: {}".format(
                version or "no version output"
            )
        )
    # mpy-cross includes its host build date in this output. The immutable
    # source commit and normalized format identity are stable release inputs;
    # the host build date is not.
    return RECORDED_VERSION


def source_files(source_root):
    root = Path(source_root)
    files = sorted(root.rglob("*.py"), key=lambda path: path.as_posix())
    if not files:
        raise BytecodeBuildError("Reference source contains no Python modules")
    for path in files:
        if path.is_symlink():
            raise BytecodeBuildError(
                "Reference source must not contain symlinks: {}".format(path)
            )
    return files


def compile_tree(compiler, source_root, output_root):
    source_root = Path(source_root).resolve()
    output_root = Path(output_root)
    artifacts = []
    for source in source_files(source_root):
        relative_source = source.relative_to(source_root)
        relative_artifact = relative_source.with_suffix(".mpy")
        artifact = output_root / relative_artifact
        artifact.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [
                str(Path(compiler).resolve()),
                "-s",
                relative_source.as_posix(),
                "-o",
                str(artifact.resolve()),
                relative_source.as_posix(),
            ],
            cwd=source_root,
            check=True,
        )
        artifacts.append((relative_source, relative_artifact))
    return artifacts


def artifact_manifest(source_root, artifact_root, compiler_output):
    source_root = Path(source_root)
    artifact_root = Path(artifact_root)
    expected_paths = {
        source.relative_to(source_root).with_suffix(".mpy")
        for source in source_files(source_root)
    }
    generated_paths = {
        path.relative_to(artifact_root)
        for path in artifact_root.rglob("*")
        if path.is_file() or path.is_symlink()
    }
    unexpected_paths = generated_paths - expected_paths
    missing_paths = expected_paths - generated_paths
    if unexpected_paths or missing_paths:
        details = []
        if unexpected_paths:
            details.append(
                "unexpected: {}".format(
                    ", ".join(
                        sorted(path.as_posix() for path in unexpected_paths)
                    )
                )
            )
        if missing_paths:
            details.append(
                "missing: {}".format(
                    ", ".join(sorted(path.as_posix() for path in missing_paths))
                )
            )
        raise BytecodeBuildError(
            "Reference artifact tree is not exact ({})".format("; ".join(details))
        )

    artifacts = []
    for source in source_files(source_root):
        relative_source = source.relative_to(source_root)
        relative_artifact = relative_source.with_suffix(".mpy")
        artifact = artifact_root / relative_artifact
        if not artifact.is_file():
            raise BytecodeBuildError(
                "Reference artifact is missing: {}".format(relative_artifact)
            )
        if artifact.is_symlink():
            raise BytecodeBuildError(
                "Reference artifacts must not be symlinks: {}".format(
                    relative_artifact
                )
            )
        artifacts.append(
            {
                "path": (
                    Path("reference_mpy") / relative_artifact
                ).as_posix(),
                "source": (
                    Path("reference_source") / relative_source
                ).as_posix(),
                "source_sha256": file_sha256(source),
                "byte_size": artifact.stat().st_size,
                "sha256": file_sha256(artifact),
            }
        )
    return {
        "schema_version": 1,
        "compiler": {
            "repository": "micropython/micropython",
            "tag": COMPILER_TAG,
            "commit": COMPILER_COMMIT,
            "version_output": compiler_output,
            "portable_abi": PORTABLE_ABI,
        },
        "artifacts": artifacts,
    }


def build(compiler, source_root, output_root):
    compiler_output = compiler_version(compiler)
    output_root = Path(output_root)
    with tempfile.TemporaryDirectory(prefix="ucsb-xrp-reference-a-") as first_dir:
        with tempfile.TemporaryDirectory(prefix="ucsb-xrp-reference-b-") as second_dir:
            first = Path(first_dir)
            second = Path(second_dir)
            first_files = compile_tree(compiler, source_root, first)
            second_files = compile_tree(compiler, source_root, second)
            if first_files != second_files:
                raise BytecodeBuildError("Repeated builds produced different file sets")

            expected = {artifact for _, artifact in first_files}
            existing = (
                {
                    path.relative_to(output_root)
                    for path in output_root.rglob("*.mpy")
                }
                if output_root.is_dir()
                else set()
            )
            stale = existing - expected
            if stale:
                raise BytecodeBuildError(
                    "Remove stale generated artifacts explicitly: {}".format(
                        ", ".join(sorted(path.as_posix() for path in stale))
                    )
                )

            for _, relative in first_files:
                first_bytes = (first / relative).read_bytes()
                second_bytes = (second / relative).read_bytes()
                if first_bytes != second_bytes:
                    raise BytecodeBuildError(
                        "Repeated builds differ for {}".format(relative)
                    )
                destination = output_root / relative
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(first / relative, destination)

    return artifact_manifest(source_root, output_root, compiler_output)


def verify(source_root, output_root, release_path):
    with Path(release_path).open("r", encoding="utf-8") as handle:
        release = json.load(handle)
    recorded = release["ucsb_xrp"]["reference_artifacts"]
    actual = artifact_manifest(
        source_root,
        output_root,
        release["ucsb_xrp"]["reference_compiler"]["version_output"],
    )
    if recorded != actual["artifacts"]:
        raise BytecodeBuildError(
            "Reference source or bytecode does not match release.json"
        )
    if release["ucsb_xrp"]["reference_compiler"] != actual["compiler"]:
        raise BytecodeBuildError(
            "Reference compiler identity does not match release.json"
        )
    return actual


def make_parser():
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    build_parser = subparsers.add_parser("build")
    build_parser.add_argument("--mpy-cross", type=Path, required=True)
    build_parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    build_parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)

    verify_parser = subparsers.add_parser("verify")
    verify_parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    verify_parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    verify_parser.add_argument(
        "--release",
        type=Path,
        default=REPOSITORY_ROOT / "vendor" / "current" / "release.json",
    )
    return parser


def main(argv=None):
    args = make_parser().parse_args(argv)
    if args.command == "build":
        manifest = build(args.mpy_cross, args.source, args.output)
    else:
        manifest = verify(args.source, args.output, args.release)
    print(json.dumps(manifest, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
