"""Host-only checks for artifact identity and build ownership; no compilation."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import tempfile
import unittest
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("firmware_recipe", HERE / "build.py")
recipe_tool = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(recipe_tool)


class FirmwareRecipeTests(unittest.TestCase):
    def temporary(self):
        context = tempfile.TemporaryDirectory(dir=HERE)
        self.addCleanup(context.cleanup)
        return Path(context.name)

    def uf2(self, addresses=(0x10000000, 0x10000100)):
        recipe = recipe_tool.load_recipe()
        preamble = struct.pack("<8I", 0x0A324655, 0x9E5D5157, 0xA000, 0x10FFFF00,
                               256, 0, 2, 0xE48BFF57)
        preamble += b"\xef" * 256 + struct.pack("<I", 0x9957E304) + bytes(216)
        preamble += struct.pack("<I", 0x0AB16F30)
        self.assertEqual(hashlib.sha256(preamble).hexdigest(), recipe["uf2_ignored_preamble_sha256"])
        blocks = [preamble]
        for index, address in enumerate(addresses):
            block = struct.pack("<8I", 0x0A324655, 0x9E5D5157, 0x2000, address,
                                256, index, len(addresses), 0xE48BFF59)
            blocks.append(block + bytes(476) + struct.pack("<I", 0x0AB16F30))
        return b"".join(blocks)

    def test_pinned_patch_and_literal_identities(self):
        recipe = recipe_tool.load_recipe()
        self.assertEqual(recipe["source_date_epoch"], 1787579045)
        self.assertEqual(recipe["reference_artifacts"]["gcsync"]["build_id"],
                         "ucsbxrp-rp2350-1.29.0-gcsync-20260930.1")
        self.assertEqual(recipe["reference_artifacts"]["stock"]["build_id"],
                         "ucsbxrp-rp2350-1.29.0-control-20260930.1")
        self.assertEqual(len(recipe["owned_sources"]), 12)

    def test_rejects_partial_or_unknown_source_content(self):
        source = self.temporary()
        hashes = {v: hashlib.sha256(v.encode()).hexdigest() for v in ("stock", "gcsync")}
        recipe = {"owned_sources": {name: hashes for name in ("one.c", "two.c")}}
        for name in recipe["owned_sources"]:
            (source / name).write_text("stock")
        self.assertEqual(recipe_tool.source_variant(source, recipe), "stock")
        (source / "one.c").write_text("gcsync")
        with self.assertRaisesRegex(recipe_tool.RecipeError, "Partial GC-sync patch"):
            recipe_tool.source_variant(source, recipe)
        (source / "one.c").write_text("an additional edit")
        with self.assertRaisesRegex(recipe_tool.RecipeError, "Unowned source content"):
            recipe_tool.source_variant(source, recipe)

    def test_manifest_extends_upstream_without_replacing_it(self):
        recipe = recipe_tool.load_recipe()
        dest = self.temporary()
        manifest = recipe_tool.generated_manifest(dest, "gcsync", recipe).read_text().splitlines()
        self.assertEqual(manifest[0], 'include("$(PORT_DIR)/boards/SPARKFUN_XRP_CONTROLLER/manifest.py")')
        self.assertEqual((dest / "frozen/ucsb_firmware.py").read_text(),
                         "build_id = 'ucsbxrp-rp2350-1.29.0-gcsync-20260930.1'\n")
        self.assertIn('"ucsb_firmware.py"', manifest[1])

    def test_uf2_structure_and_filesystem_boundary(self):
        recipe = recipe_tool.load_recipe()
        record = recipe_tool.validate_uf2(self.uf2(), recipe)
        self.assertEqual(record["flash_end_exclusive"], "0x10000200")
        with self.assertRaisesRegex(recipe_tool.RecipeError, "filesystem boundary"):
            recipe_tool.validate_uf2(self.uf2((0x10000000, recipe["filesystem_start"])), recipe)
        damaged = bytearray(self.uf2())
        struct.pack_into("<I", damaged, 512 + 20, 7)
        with self.assertRaisesRegex(recipe_tool.RecipeError, "program UF2 block"):
            recipe_tool.validate_uf2(damaged, recipe)
        with self.assertRaisesRegex(recipe_tool.RecipeError, "Noncontiguous"):
            recipe_tool.validate_uf2(self.uf2((0x10000000, 0x10000200)), recipe)

    def test_patch_boundary_cannot_omit_a_native_source_file(self):
        folder = self.temporary()
        recipe = recipe_tool.load_recipe()
        recipe["owned_sources"].pop("py/gc.c")
        (folder / "recipe.json").write_text(json.dumps(recipe))
        (folder / "gcsync-port.patch").write_bytes((HERE / "gcsync-port.patch").read_bytes())
        with patch.object(recipe_tool, "HERE", folder):
            with self.assertRaisesRegex(recipe_tool.RecipeError, "Patch source boundary"):
                recipe_tool.load_recipe()

    def test_compiled_configuration_rejects_gil_clock_yield_and_gc_drift(self):
        recipe = recipe_tool.load_recipe()
        macros = recipe["reference_macros"]["gcsync"]

        def dump(values):
            return "\n".join("#define " + name + " " + value for name, value in values.items())

        self.assertEqual(recipe_tool.validate_macros(dump(macros), "gcsync", recipe)["settings"], macros)
        mutations = {"MICROPY_PY_THREAD_GIL": "(1)", "SYS_CLK_HZ": "_u(200000000)",
                     "MICROPY_THREAD_YIELD()": "", "MICROPY_RP2_GCSYNC": "(0)",
                     "MICROPY_VM_HOOK_LOOP": "", "MICROPY_HW_FLASH_STORAGE_BYTES": "0"}
        for name, value in mutations.items():
            with self.subTest(name=name):
                changed = dict(macros, **{name: value})
                with self.assertRaisesRegex(recipe_tool.RecipeError, name.replace("(", r"\(").replace(")", r"\)")):
                    recipe_tool.validate_macros(dump(changed), "gcsync", recipe)
        missing = dict(macros)
        missing.pop("MICROPY_THREAD_YIELD()")
        with self.assertRaisesRegex(recipe_tool.RecipeError, "MICROPY_THREAD_YIELD"):
            recipe_tool.validate_macros(dump(missing), "gcsync", recipe)

    def test_matching_marker_does_not_qualify_different_image_bytes(self):
        root = self.temporary()
        recipe = recipe_tool.load_recipe()
        (root / "firmware.uf2").write_bytes(self.uf2())
        (root / "firmware.bin").write_bytes(recipe["reference_artifacts"]["gcsync"]["build_id"].encode())
        result = recipe_tool.artifact_record({"uf2": root / "firmware.uf2", "bin": root / "firmware.bin"}, "gcsync", recipe)
        self.assertFalse(result["reference_uf2_and_bin_match"])

    def arguments(self, root, output):
        return argparse.Namespace(source=str(root / "source"), toolchain=str(root / "compiler"),
                                  picotool_root=str(root / "picotool"), output=str(output),
                                  make="make", variant="stock", jobs=2)

    def test_existing_output_evidence_is_preserved(self):
        root = self.temporary()
        output = root / "existing"
        output.mkdir()
        evidence = output / "first-failure.log"
        evidence.write_text("preserved failure")
        with patch.object(recipe_tool, "check_inputs", return_value={"source_variant": "gcsync", "cmake": "cmake"}):
            with self.assertRaisesRegex(recipe_tool.RecipeError, "new output directory"):
                recipe_tool.build_images(self.arguments(root, output), recipe_tool.load_recipe())
        self.assertEqual(evidence.read_text(), "preserved failure")

    def test_configure_failure_restores_initial_source_selection(self):
        root = self.temporary()
        output = root / "new-output"
        inputs = {"source_variant": "gcsync", "cmake": "cmake"}

        def fail_configure(output, label, command, source, env):
            if label == "stock-configure":
                raise recipe_tool.RecipeError("controlled configure failure")

        with patch.object(recipe_tool, "check_inputs", return_value=inputs), \
                patch.object(recipe_tool, "executable", return_value=Path("make")), \
                patch.object(recipe_tool, "run_logged", side_effect=fail_configure), \
                patch.object(recipe_tool, "select_variant") as select:
            with self.assertRaisesRegex(recipe_tool.RecipeError, "controlled configure failure"):
                recipe_tool.build_images(self.arguments(root, output), recipe_tool.load_recipe())
        self.assertEqual([call.args[1] for call in select.call_args_list], ["stock", "gcsync"])
        result = json.loads((output / "build-results.json").read_text())
        self.assertTrue(result["source_restored"])
        self.assertIn("failed", result["status"])


if __name__ == "__main__":
    unittest.main()
