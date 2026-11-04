#!/usr/bin/env python3
"""Pinned stock/GC-sync firmware recipe. Explicit build only; no device operations."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import struct
import subprocess
import sys

HERE = Path(__file__).resolve().parent


class RecipeError(Exception):
    pass


def require(condition, message):
    if not condition:
        raise RecipeError(message)


def digest(path):
    result = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            result.update(block)
    return result.hexdigest()


def load_recipe():
    recipe = json.loads((HERE / "recipe.json").read_text())
    require(recipe["schema_version"] == 1, "Unsupported recipe schema")
    patch = HERE / "gcsync-port.patch"
    require(digest(patch) == recipe["gcsync_patch_sha256"],
            "The recorded GC-sync patch changed; review provenance before building")
    before = re.findall(r"^--- a/(.+)$", patch.read_text(), re.M)
    after = re.findall(r"^\+\+\+ b/(.+)$", patch.read_text(), re.M)
    require(before == after and set(before) == set(recipe["owned_sources"])
            and len(before) == len(recipe["owned_sources"]), "Patch source boundary differs from the recipe")
    return recipe


def command_output(args, cwd=None, env=None):
    return subprocess.check_output([str(arg) for arg in args], cwd=cwd, env=env,
                                   text=True, stderr=subprocess.PIPE).strip()


def git(source, *args):
    return command_output(["git", *args], cwd=source)


def require_clean(source):
    require(not git(source, "status", "--porcelain", "--untracked-files=normal"),
            "Dirty dependency: " + str(source))


def source_variant(source, recipe):
    variants = []
    for name, expected in recipe["owned_sources"].items():
        actual = digest(source / name)
        matches = [variant for variant, value in expected.items() if value == actual]
        require(len(matches) == 1, "Unowned source content: " + name)
        variants.extend(matches)
    require(len(set(variants)) == 1, "Partial GC-sync patch; use a complete recorded source state")
    return variants[0]


def executable(path):
    resolved = shutil.which(str(path))
    require(resolved is not None, "Executable unavailable: " + str(path))
    return Path(resolved).resolve()


def verify_patch(source, recipe):
    variant = source_variant(source, recipe)
    reverse = ["--reverse"] if variant == "gcsync" else []
    git(source, "apply", *reverse, "--check", str(HERE / "gcsync-port.patch"))
    return {"source_variant": variant, "patch_sha256": recipe["gcsync_patch_sha256"],
            "source_hashes": {name: values[variant] for name, values in recipe["owned_sources"].items()},
            "scope": "read-only source hashes and patch applicability"}


def check_inputs(args, recipe):
    source = Path(args.source).resolve()
    require(git(source, "rev-parse", "HEAD") == recipe["micropython_commit"],
            "MicroPython source commit differs from the recipe")
    require(git(source, "show", "-s", "--format=%ct", "HEAD") == str(recipe["source_date_epoch"]),
            "MicroPython source timestamp differs from the recipe")
    changed = set(git(source, "diff", "--name-only").splitlines())
    require(changed <= set(recipe["owned_sources"]), "Unowned tracked MicroPython changes")
    require(not git(source, "diff", "--cached", "--name-only"), "Staged MicroPython changes")
    require(not git(source, "ls-files", "--others", "--exclude-standard"), "Untracked MicroPython source files")
    patch = verify_patch(source, recipe)
    variant = patch["source_variant"]
    for name, expected in recipe["submodules"].items():
        parent_name, child = name.rsplit("/", 1)
        parent = source if parent_name == "lib" else source / parent_name
        gitlink = git(parent, "ls-tree", "HEAD", "--", name if parent_name == "lib" else child).split()
        require(len(gitlink) >= 3 and gitlink[0] == "160000" and gitlink[2] == expected,
                "Changed dependency gitlink: " + name)
        dependency = source / name
        require(git(dependency, "rev-parse", "HEAD") == expected, "Changed dependency HEAD: " + name)
        require_clean(dependency)
    picotool_root = Path(args.picotool_root).resolve()
    picotool = picotool_root / "picotool-src"
    require(git(picotool, "rev-parse", "HEAD") == recipe["picotool_commit"], "Changed Picotool HEAD")
    require_clean(picotool)
    package = picotool_root / "picotool"
    require(digest(package / ("picotool.exe" if os.name == "nt" else "picotool")) == recipe["picotool_binary_sha256"],
            "Picotool binary differs from the reference packaging tool")
    for name, expected in recipe["picotool_config_hashes"].items():
        require(digest(package / name) == expected, "Picotool CONFIG package changed: " + name)
    toolchain = Path(args.toolchain).resolve()
    compiler = executable(toolchain / "bin" / ("arm-none-eabi-gcc.exe" if os.name == "nt" else "arm-none-eabi-gcc"))
    require(command_output([compiler, "--version"]).splitlines()[0] == recipe["compiler_banner"],
            "Compiler banner differs from the reference build")
    cmake = executable(args.cmake)
    require(command_output([cmake, "--version"]).splitlines()[0] == "cmake version " + recipe["cmake_version"],
            "CMake version differs from the reference build")
    if args.toolchain_package:
        require(digest(args.toolchain_package) == recipe["toolchain_package"]["sha256"],
                "Compiler package SHA256 differs from the recorded official package")
    return {"source_variant": variant, "micropython_commit": recipe["micropython_commit"],
            "source_date_epoch": recipe["source_date_epoch"], "submodules": recipe["submodules"],
            "picotool_commit": recipe["picotool_commit"], "compiler": str(compiler), "cmake": str(cmake),
            "picotool_binary_sha256": recipe["picotool_binary_sha256"],
            "patch_sha256": patch["patch_sha256"], "source_hashes": patch["source_hashes"]}


def select_variant(source, wanted, recipe):
    current = source_variant(source, recipe)
    if current != wanted:
        args = ["apply"] + (["--reverse"] if current == "gcsync" else [])
        git(source, *args, "--check", str(HERE / "gcsync-port.patch"))
        git(source, *args, str(HERE / "gcsync-port.patch"))
    require(source_variant(source, recipe) == wanted, "GC-sync patch transition did not match its recorded hashes")


def generated_manifest(dest, variant, recipe):
    frozen = dest / "frozen"
    frozen.mkdir(parents=True)
    identity = recipe["reference_artifacts"][variant]["build_id"]
    (frozen / "ucsb_firmware.py").write_text("build_id = " + repr(identity) + "\n")
    manifest = dest / "manifest.py"
    manifest.write_text('include("$(PORT_DIR)/boards/' + recipe["board"] + '/manifest.py")\n'
                        + "freeze(" + repr(str(frozen)) + ', "ucsb_firmware.py")\n')
    return manifest


def validate_macros(text, variant, recipe):
    macros = dict(re.findall(r"^#define (\S+)(?:[ \t]+(.*))?$", text, re.M))
    expected = recipe["reference_macros"][variant]
    mismatch = [name for name, value in expected.items() if macros.get(name) != value]
    require(not mismatch, "Compiled firmware settings differ: " + ", ".join(mismatch))
    return {"variant": variant, "settings": expected,
            "scope": "recorded compiled macros; native qualification remains external"}


def preprocess_macros(dest, inputs, variant, recipe, source, env):
    flags = (dest / "build/CMakeFiles/firmware.dir/flags.make").read_text()
    command = [inputs["compiler"]]
    for name in ("C_DEFINES", "C_INCLUDES", "C_FLAGS"):
        match = re.search(r"^" + name + r" = (.*)$", flags, re.M)
        require(match is not None, "Missing compiler flags: " + name)
        command += shlex.split(match.group(1))
    command += ["-x", "c", "-E", "-dM", "-"]
    result = subprocess.run(command, cwd=source, env=env, text=True, capture_output=True,
                            input='#include "py/runtime.h"\n#include "py/mphal.h"\n#include "pico/stdlib.h"\n')
    with (dest / "macro-preprocessor.log").open("x") as stream:
        stream.write("$ " + shlex.join(command) + "\n" + result.stdout + result.stderr)
    require(result.returncode == 0, "Macro preprocessing failed; first diagnostics preserved")
    (dest / "compiled-macros.txt").write_text(result.stdout)
    return validate_macros(result.stdout, variant, recipe)


def validate_uf2(image, recipe):
    require(len(image) >= 1024 and len(image) % 512 == 0, "Invalid UF2 length")
    require(hashlib.sha256(image[:512]).hexdigest() == recipe["uf2_ignored_preamble_sha256"],
            "RP2350-E10 ignored preamble differs from the reference")
    count = len(image) // 512 - 1
    addresses = []
    for index in range(count + 1):
        block = image[index * 512:(index + 1) * 512]
        magic1, magic2, flags, address, size, number, total, family = struct.unpack_from("<8I", block)
        require((magic1, magic2) == (0x0A324655, 0x9E5D5157)
                and struct.unpack_from("<I", block, 508)[0] == 0x0AB16F30, "Invalid UF2 magic")
        if index == 0:
            require(flags == 0xA000 and family == 0xE48BFF57 and number == 0 and total == 2 and size == 256
                    and struct.unpack_from("<I", block, 32 + size)[0] == 0x9957E304,
                    "Invalid ignored RP2350-E10 preamble")
            continue
        require(flags == 0x2000 and family == 0xE48BFF59 and number == index - 1
                and total == count and size == 256, "Unexpected program UF2 block")
        require(recipe["firmware_region_start"] <= address < address + size <= recipe["filesystem_start"],
                "UF2 program data crosses the firmware/filesystem boundary")
        require(address == recipe["firmware_region_start"] + (index - 1) * 256,
                "Noncontiguous or unordered UF2 address")
        addresses.append(address)
    require(addresses[0] == recipe["firmware_region_start"], "Unexpected firmware start")
    return {"program_blocks": count, "flash_start": hex(addresses[0]),
            "flash_end_exclusive": hex(addresses[-1] + 256), "filesystem_start": hex(recipe["filesystem_start"])}


def artifact_record(paths, variant, recipe):
    expected = recipe["reference_artifacts"][variant]
    require(expected["build_id"].encode() in Path(paths["bin"]).read_bytes(), "Frozen build marker absent")
    record = {suffix: {"bytes": Path(path).stat().st_size, "sha256": digest(path)} for suffix, path in paths.items()}
    reference_match = all(record[suffix] == expected["artifacts"][suffix] for suffix in ("uf2", "bin"))
    return {"build_id": expected["build_id"], "artifacts": record, "reference_uf2_and_bin_match": reference_match,
            "uf2": validate_uf2(Path(paths["uf2"]).read_bytes(), recipe),
            "qualification": "artifact identity only; " + recipe["candidate_status"]}


def run_logged(output, label, command, source, env):
    print("START " + label, flush=True)
    with (output / (label + ".log")).open("x") as stream:
        stream.write("$ " + shlex.join(str(part) for part in command) + "\n")
        stream.flush()
        result = subprocess.run([str(part) for part in command], cwd=source, env=env,
                                stdout=stream, stderr=subprocess.STDOUT)
    require(result.returncode == 0, label + " failed; the complete first-failure log is retained")
    print("PASS " + label, flush=True)


def save_record(output, record):
    path = output / "build-results.json"
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(record, indent=2) + "\n")
    temporary.replace(path)


def build_images(args, recipe):
    inputs = check_inputs(args, recipe)
    source = Path(args.source).resolve()
    output = Path(args.output).resolve()
    for protected in (source, Path(args.toolchain).resolve(), Path(args.picotool_root).resolve()):
        require(output != protected and protected not in output.parents, "Build output overlaps an input tree")
    require(not output.exists(), "Use a new output directory; existing reference evidence must be preserved")
    make = executable(args.make)
    output.mkdir(parents=True)
    original_variant = inputs["source_variant"]
    env = dict(os.environ)
    env.update(SOURCE_DATE_EPOCH=str(recipe["source_date_epoch"]), MICROPY_GIT_TAG=recipe["micropython_tag"],
               MICROPY_GIT_HASH=recipe["micropython_commit"][:10],
               GIT_ALLOW_PROTOCOL="file", GIT_TERMINAL_PROMPT="0")
    for name in ("PICO_SDK_PATH", "PICO_SDK_FETCH_FROM_GIT", "PICOTOOL_FORCE_FETCH_FROM_GIT",
                 "PICOTOOL_FETCH_FROM_GIT_PATH", "_PICOTOOL_FOUND_THIS_RUN"):
        env.pop(name, None)
    env["PATH"] = str(Path(args.toolchain).resolve() / "bin") + os.pathsep + str(Path(inputs["cmake"]).parent) + os.pathsep + env.get("PATH", "")
    record = {"inputs": inputs, "variants": {}, "source_restored": False,
              "status": "build in progress; no release selection", "recipe_sha256": digest(HERE / "recipe.json"),
              "gcsync_patch_sha256": recipe["gcsync_patch_sha256"],
              "compiler_hook_sha256": digest(HERE / "compiler-compat.cmake"),
              "candidate_status": recipe["candidate_status"]}
    save_record(output, record)
    try:
        run_logged(output, "mpy-cross-build", [make, "-C", source / "mpy-cross", "-j", str(args.jobs)], source, env)
        variants = ("stock", "gcsync") if args.variant == "both" else (args.variant,)
        for variant in variants:
            select_variant(source, variant, recipe)
            check_inputs(args, recipe)
            dest = output / variant
            dest.mkdir()
            manifest = generated_manifest(dest, variant, recipe)
            command = [inputs["cmake"], "-S", source / "ports/rp2", "-B", dest / "build", "-G", "Unix Makefiles",
                       "-DCMAKE_BUILD_TYPE=MinSizeRel", "-DMICROPY_BOARD=" + recipe["board"],
                       "-DCMAKE_PROJECT_firmware_INCLUDE=" + str(HERE / "compiler-compat.cmake"),
                       "-DPICO_TOOLCHAIN_PATH=" + str(Path(args.toolchain).resolve()),
                       "-DMICROPY_FROZEN_MANIFEST=" + str(manifest),
                       "-Dpicotool_DIR=" + str(Path(args.picotool_root).resolve() / "picotool"),
                       "-DPICOTOOL_FORCE_FETCH_FROM_GIT=OFF"]
            run_logged(output, variant + "-configure", command, source, env)
            check_inputs(args, recipe)
            run_logged(output, variant + "-build", [inputs["cmake"], "--build", dest / "build", "--parallel", str(args.jobs)], source, env)
            paths = {}
            for suffix in ("uf2", "bin", "elf", "elf.map"):
                target = dest / ("firmware." + suffix)
                shutil.copy2(dest / "build" / target.name, target)
                paths[suffix] = target
            record["variants"][variant] = artifact_record(paths, variant, recipe)
            record["variants"][variant]["macros"] = preprocess_macros(dest, inputs, variant, recipe, source, env)
            save_record(output, record)
            require(record["variants"][variant]["reference_uf2_and_bin_match"],
                    "Rebuild differs from the preserved reference bytes; it is a new, unqualified artifact")
        record["status"] = "reference UF2/BIN bytes reproduced; physical acceptance still external"
    except BaseException:
        record["status"] = "failed; diagnostics preserved; no release selection"
        raise
    finally:
        select_variant(source, original_variant, recipe)
        record["source_restored"] = True
        save_record(output, record)


def parser():
    result = argparse.ArgumentParser(description=__doc__)
    commands = result.add_subparsers(dest="mode", required=True)
    for mode in ("check-inputs", "build"):
        command = commands.add_parser(mode)
        for option in ("source", "toolchain", "picotool-root"):
            command.add_argument("--" + option, required=True)
        command.add_argument("--cmake", default="cmake")
        command.add_argument("--toolchain-package")
        if mode == "build":
            command.add_argument("--output", required=True)
            command.add_argument("--variant", choices=("stock", "gcsync", "both"), default="gcsync")
            command.add_argument("--make", default="make")
            command.add_argument("--jobs", type=int, default=6)
    verify = commands.add_parser("verify-artifacts")
    verify.add_argument("--variant", choices=("stock", "gcsync"), required=True)
    verify.add_argument("--uf2", required=True)
    verify.add_argument("--bin", required=True)
    apply = commands.add_parser("verify-patch")
    apply.add_argument("--source", required=True)
    macros = commands.add_parser("verify-macros")
    macros.add_argument("--variant", choices=("stock", "gcsync"), required=True)
    macros.add_argument("--macros", required=True)
    return result


def main(argv=None):
    args = parser().parse_args(argv)
    try:
        recipe = load_recipe()
        if args.mode == "check-inputs":
            print(json.dumps(check_inputs(args, recipe), indent=2))
        elif args.mode == "verify-artifacts":
            record = artifact_record({"uf2": args.uf2, "bin": args.bin}, args.variant, recipe)
            print(json.dumps(record, indent=2))
            require(record["reference_uf2_and_bin_match"], "Artifact differs from the preserved reference bytes")
        elif args.mode == "verify-patch":
            print(json.dumps(verify_patch(Path(args.source).resolve(), recipe), indent=2))
        elif args.mode == "verify-macros":
            print(json.dumps(validate_macros(Path(args.macros).read_text(), args.variant, recipe), indent=2))
        else:
            require(args.jobs > 0, "--jobs must be positive")
            build_images(args, recipe)
    except (RecipeError, OSError, subprocess.CalledProcessError, KeyError, ValueError) as error:
        print("Firmware recipe failed: " + str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
