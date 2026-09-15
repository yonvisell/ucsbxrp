// Source-level exact-MicroPython catalog validation; no server or release build.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { globSync, readFileSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stripTypeScriptTypes } from "node:module";
import { loadMicroPython } from "@micropython/micropython-webassembly-pyscript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vendor = path.join(root, "vendor/current");
const outputPath =
  process.env.COURSE_CATALOG_EVIDENCE ??
  path.join(
    root,
    "outputs/revisions/2026-09-14/evidence/course-catalog-micropython.json",
  );
const dataModule = (source) =>
  "data:text/javascript;base64," + Buffer.from(source).toString("base64");
const transpile = (source) =>
  stripTypeScriptTypes(source, { mode: "transform" });
const worldSource = transpile(
  await readFile(path.join(root, "packages/simulator/src/world.ts"), "utf8"),
);
const simulationSource = transpile(
  await readFile(path.join(root, "packages/simulator/src/index.ts"), "utf8"),
).replaceAll('"./world"', JSON.stringify(dataModule(worldSource)));
const { XrpSimulator, parseWorldCatalog, simulatorConfigForWorld } =
  await import(dataModule(simulationSource));
const { SIMULATED_XRPLIB_FILES } = await import(
  dataModule(
    transpile(
      await readFile(
        path.join(root, "packages/target/src/simulated-python.ts"),
        "utf8",
      ),
    ),
  )
);

// Resolve the production catalog loader's actual glob inputs and complete-view
// transformation in memory. This avoids a second implementation of that policy.
const catalogFile = path.join(root, "packages/target/src/course-project.ts");
let catalogSource = await readFile(catalogFile, "utf8");
catalogSource = catalogSource.replace(
  /import catalogEntries from [^;]+;/,
  "const catalogEntries = " +
    (await readFile(path.join(vendor, "project_catalog.json"), "utf8")) +
    ";",
);
catalogSource = catalogSource.replace(
  /import\.meta\.glob\("([^"]+)",\s*\{[^}]+\}\)/g,
  (_, pattern) => {
    const files = Object.fromEntries(
      [...globSync(pattern, { cwd: path.dirname(catalogFile) })].map((name) => [
        name,
        readFileSync(path.resolve(path.dirname(catalogFile), name), "utf8"),
      ]),
    );
    return JSON.stringify(files);
  },
);
const { COURSE_PROJECT_TEMPLATES } = await import(
  dataModule(transpile(catalogSource))
);

let lines = [];
let simulator;
let stopAtMs = null;
let noRange = false;
let noLine = false;
let publications = 0;
let plotPublications = 0;
let controlValues = [];
let collisionCount = 0;
let firstCollision = null;
let phases = [];
let lastCoursePose = null;
const vm = await loadMicroPython({
  heapsize: 4 * 1024 * 1024,
  stdout: (line) => lines.push(String(line)),
  stderr: (line) => lines.push(String(line)),
});
const ensureDirectory = (name) => {
  try {
    vm.FS.mkdir(name);
  } catch (error) {
    if (!String(error).includes("File exists")) throw error;
  }
};
const put = (name, value) => {
  const parts = name.split("/").filter(Boolean);
  let directory = "";
  for (const part of parts.slice(0, -1)) {
    directory += "/" + part;
    ensureDirectory(directory);
  }
  vm.FS.writeFile(name, value);
};
for (const [name, value] of Object.entries(SIMULATED_XRPLIB_FILES))
  put("/" + name, value);
for (const name of await readdir(path.join(vendor, "ucsb_xrp")))
  if (name.endsWith(".py"))
    put(
      "/ucsb_xrp/" + name,
      await readFile(path.join(vendor, "ucsb_xrp", name), "utf8"),
    );
for (const name of await readdir(
  path.join(vendor, "reference_mpy/ucsb_xrp_reference"),
))
  if (name.endsWith(".mpy"))
    put(
      "/ucsb_xrp_reference/" + name,
      await readFile(
        path.join(vendor, "reference_mpy/ucsb_xrp_reference", name),
      ),
    );
vm.registerJsModule("xrp_sim_bridge", {
  now_ms: () => Math.round(simulator?.state.tMs ?? 0),
  advance_ms: (duration) => {
    let remaining = Number(duration);
    while (remaining > 0) {
      const step = Math.min(20, remaining);
      const state = simulator.step(step);
      if (state.collision) {
        collisionCount += 1;
        firstCollision ??= { tMs: state.tMs, pose: state.pose };
      }
      remaining -= step;
    }
  },
  should_stop: () => stopAtMs !== null && simulator.state.tMs >= stopAtMs,
  set_motor_effort: (side, effort) =>
    simulator.setMotorEffort(String(side), Number(effort)),
  get_encoder_count: (side) =>
    side === "left"
      ? simulator.state.leftEncoderCount
      : simulator.state.rightEncoderCount,
  reset_encoder: () => {},
  is_button_pressed: () => false,
  get_battery_v: () => 6.0,
  get_range_mm: () => (noRange ? null : simulator.state.rangeMm),
  get_reflectance: (side) =>
    noLine
      ? 0
      : side === "left"
        ? simulator.state.leftReflectance
        : simulator.state.rightReflectance,
  get_acceleration_mg: () => simulator.state.accelerationMg,
  get_angular_rate_mdps: () => simulator.state.angularRateMdps,
  get_temperature_c: () => 24,
  publish_runtime_state: (source) => {
    const value = JSON.parse(String(source));
    if (value.plots?.length) plotPublications += 1;
    const phase = value.watches?.find(
      (item) => item.name === "mission_phase",
    )?.value;
    if (phase && phases.at(-1)?.phase !== phase)
      phases.push({
        phase,
        tMs: simulator.state.tMs,
        pose: simulator.state.pose,
        rangeMm: simulator.state.rangeMm,
      });
  },
  publish_course_state: (x, y, heading) => {
    publications += 1;
    lastCoursePose = {
      xMm: Number(x),
      yMm: Number(y),
      headingRad: Number(heading),
    };
  },
  publish_sensor_sample: () => {
    publications += 1;
  },
  register_live_parameter: (_, value) => {
    controlValues.push(Number(value));
    return controlValues.length - 1;
  },
  read_live_parameter: (slot) => controlValues[Number(slot)],
});
vm.runPython(`
import time, xrp_sim_bridge
def simulated_sleep_ms(duration):
    if xrp_sim_bridge.should_stop():
        raise KeyboardInterrupt()
    xrp_sim_bridge.advance_ms(duration)
time.ticks_ms = lambda: int(xrp_sim_bridge.now_ms())
time.ticks_us = lambda: int(xrp_sim_bridge.now_ms() * 1000)
time.sleep_ms = simulated_sleep_ms
time.sleep = lambda seconds: simulated_sleep_ms(int(seconds * 1000))
import gc, json, os, sys
sys.path.insert(0, "/")
import ucsb_xrp.live as course_live
`);

const report = {
  runtime: "@micropython/micropython-webassembly-pyscript 1.28.0-6",
  simulation:
    "current XrpSimulator source; virtual sample clock; no browser/physical transport",
  inventory: [],
  executions: [],
};
for (const template of COURSE_PROJECT_TEMPLATES) {
  const { files } = template.project;
  const bytes = Object.values(files).reduce(
    (sum, content) => sum + Buffer.byteLength(content),
    0,
  );
  assert(Object.keys(files).length <= 48, template.id + " exceeds file count");
  assert(bytes <= 128 * 1024, template.id + " exceeds project bytes");
  for (const [name, source] of Object.entries(files))
    if (name.endsWith(".py")) {
      put("/_compile.py", source);
      vm.runPython(
        `compile(open("/_compile.py").read(), ${JSON.stringify(template.id + "/" + name)}, "exec")`,
      );
    }
  report.inventory.push({
    id: template.id,
    files: Object.keys(files).length,
    bytes,
    compiled: true,
    sha256: createHash("sha256")
      .update(JSON.stringify(Object.entries(files).sort()))
      .digest("hex"),
  });
}

const expected = {
  new_challenge_1_robot_curling: "result=stationary",
  new_challenge_2_arena_line_circuit: "result=complete",
  new_challenge_3_waypoint_courier: "result=complete",
  new_challenge_4_mapped_route: "result=valid_path",
  new_challenge_5_out_and_back: "result=complete",
  new_demo_odometry_calibration: "Odometry experiment complete",
  new_demo_reflectance_calibration: "Reflectance calibration capture complete",
  new_demo_motor_characterization: "Motor characterization complete",
  new_demo_planning_comparison: "Planning comparison complete",
  challenge_9: "result=complete",
  complete_challenge_9: "result=complete",
};
const selected = COURSE_PROJECT_TEMPLATES.filter(
  (item) => process.argv.includes("--all") || expected[item.id],
);
let previousNames = [];
async function execute(template, options = {}) {
  const files = { ...template.project.files };
  const worldCatalog = parseWorldCatalog(files["world.json"]);
  const world = worldCatalog.worlds.find(
    (item) => item.id === (options.worldId ?? worldCatalog.defaultWorldId),
  );
  assert(world, "missing world");
  if (options.worldId) {
    const raw = JSON.parse(files["world.json"]);
    raw.default_world = options.worldId;
    files["world.json"] = JSON.stringify(raw);
  }
  if (options.executeRoute)
    files["main.py"] = files["main.py"].replace(
      "EXECUTE_ROUTE = False",
      "EXECUTE_ROUTE = True",
    );
  if (options.noPath)
    files["course_setup.py"] +=
      "\nclass NoRoutePlanner:\n    def plan(self, grid, start, goal):\n        return None\n\ndef make_grid_planner():\n    return NoRoutePlanner()\n";
  simulator = new XrpSimulator(simulatorConfigForWorld(world));
  simulator.reset(world.initialPose);
  stopAtMs =
    options.stopAtMs ??
    (template.id === "demo_roomba" || template.id === "demo_random_snake"
      ? 3000
      : null);
  noRange = options.noRange ?? false;
  noLine = options.noLine ?? false;
  lines = [];
  publications = 0;
  plotPublications = 0;
  controlValues = [];
  collisionCount = 0;
  firstCollision = null;
  phases = [];
  lastCoursePose = null;
  vm.runPython(`
os.chdir("/")
for name in ${JSON.stringify(previousNames)}:
    sys.modules.pop(name, None)
course_live.clear()
gc.collect()
`);
  for (const name of previousNames) {
    try {
      vm.FS.unlink("/project/" + name + ".py");
    } catch {}
  }
  previousNames = Object.keys(files)
    .filter((name) => name.endsWith(".py"))
    .map((name) => name.slice(0, -3));
  for (const [name, value] of Object.entries(files))
    put("/project/" + name, value);
  vm.runPython(
    'os.chdir("/project")\nif "/project" not in sys.path: sys.path.insert(0, "/project")',
  );
  let error = null;
  const start = performance.now();
  try {
    vm.runPython(
      `exec(compile(open(${JSON.stringify(options.entrypoint ?? template.project.entrypoint)}).read(), ${JSON.stringify(options.entrypoint ?? template.project.entrypoint)}, "exec"), {"__name__": "__main__"})`,
    );
  } catch (caught) {
    error = String(caught);
  }
  const state = simulator.state;
  const item = {
    id: template.id,
    ...options,
    worldId: world.id,
    virtualTimeMs: state.tMs,
    wallTimeMs: performance.now() - start,
    stopped: state.leftEffort === 0 && state.rightEffort === 0,
    publications,
    plotPublications,
    pose: state.pose,
    lastCoursePose,
    collisionCount,
    firstCollision,
    phases,
    output: lines.filter((line) => !line.startsWith("__XRP")).slice(-120),
    error,
  };
  if (options.expected)
    item.expectationMet = item.output.join("\n").includes(options.expected);
  else if (expected[template.id] && !options.entrypoint && !stopAtMs)
    item.expectationMet = item.output
      .join("\n")
      .includes(expected[template.id]);
  const successfulMotion =
    !error &&
    !options.entrypoint &&
    /result=(complete|stationary)/.test(item.output.join("\n"));
  if (successfulMotion) {
    item.collisionFree = collisionCount === 0;
    let destination;
    if (template.id.includes("out_and_back"))
      destination = world.markers.find((marker) => marker.name === "home");
    else if (template.id.includes("robot_curling"))
      destination = world.markers.find((marker) => marker.name === "finish");
    else if (
      template.id.includes("mapped_route") ||
      template.id === "challenge_4" ||
      template.id === "complete_challenge_4"
    )
      destination = world.markers.find(
        (marker) => marker.name === "destination",
      );
    else if (template.id.includes("waypoint_courier"))
      destination = world.markers
        .filter((marker) => marker.type === "waypoint")
        .at(-1);
    if (destination) {
      item.trueEndpointErrorMm = Math.hypot(
        state.pose.xMm - destination.xMm,
        state.pose.yMm - destination.yMm,
      );
      item.trueEndpointWithinTolerance = item.trueEndpointErrorMm <= 20;
    }
  }
  report.executions.push(item);
  console.log(
    template.id,
    options.entrypoint ?? "main",
    world.id,
    error ? "ERROR" : "finished",
    Math.round(state.tMs),
    "ms",
    item.expectationMet === false ? "EXPECTED RESULT MISSING" : "",
  );
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(report, null, 2) + "\n");
}
for (const template of selected) {
  await execute(template);
  if (
    template.id.startsWith("new_challenge_") ||
    template.id === "new_demo_odometry_calibration"
  ) {
    await execute(template, {
      entrypoint: "component_checks.py",
      expected: "NOT IMPLEMENTED",
    });
    await execute(template, { stopAtMs: 500 });
  }
  if (template.id === "new_challenge_4_mapped_route") {
    await execute(template, {
      executeRoute: true,
      expected: "result=complete",
    });
    await execute(template, { executeRoute: true, stopAtMs: 500 });
    for (const world of parseWorldCatalog(
      template.project.files["world.json"],
    ).worlds.slice(1))
      await execute(template, {
        worldId: world.id,
        expected: "result=no_path",
      });
  }
  if (template.id === "new_challenge_5_out_and_back") {
    await execute(template, {
      worldId: "gate-open",
      expected: "result=complete",
    });
    await execute(template, {
      noRange: true,
      expected: "result=unusable_range",
    });
    await execute(template, { noPath: true, expected: "result=no_route" });
  }
  if (template.id === "new_challenge_2_arena_line_circuit")
    await execute(template, { noLine: true, expected: "result=line_lost" });
}
const failures = report.executions.filter(
  (item) =>
    !item.stopped ||
    item.expectationMet === false ||
    item.collisionFree === false ||
    item.trueEndpointWithinTolerance === false ||
    (item.error && !item.error.includes("KeyboardInterrupt")),
);
console.log(
  JSON.stringify({
    compiledProjects: report.inventory.length,
    executions: report.executions.length,
    failures: failures.length,
    outputPath,
  }),
);
if (failures.length) process.exitCode = 1;
