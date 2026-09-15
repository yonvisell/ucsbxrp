import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { loadMicroPython } from "@micropython/micropython-webassembly-pyscript";

const root = new URL("../", import.meta.url);
const output = [];
let rawPublications = 0;
let coursePublications = 0;
const runtime = await loadMicroPython({
  heapsize: 2 * 1024 * 1024,
  stdout: (line) => output.push(line),
  stderr: (line) => output.push(line),
});
runtime.registerJsModule("xrp_sim_bridge", {
  publish_sensor_sample(encoded) {
    const timing = JSON.parse(String(encoded)).timing;
    assert.equal(timing.length, 16);
    assert.equal(timing[14], "raw");
    rawPublications += 1;
  },
  publish_course_state(...args) {
    assert.equal(args.length, 13);
    const timing = JSON.parse(String(args[12])).timing;
    assert.equal(timing.length, 16);
    assert.ok(["course", "stop"].includes(timing[14]));
    coursePublications += 1;
  },
});
runtime.FS.mkdir("/ucsb_xrp");
for (const name of await readdir(new URL("vendor/current/ucsb_xrp/", root))) {
  if (name.endsWith(".py")) {
    runtime.FS.writeFile(
      `/ucsb_xrp/${name}`,
      await readFile(new URL(`vendor/current/ucsb_xrp/${name}`, root), "utf8"),
    );
  }
}

const started = performance.now();
function run(source) {
  try {
    runtime.runPython(source);
  } catch (error) {
    console.error(output.join("\n"));
    console.error(String(error));
    process.exit(1);
  }
}
run(`
import gc, heapq, array, collections, json, sys
from ucsb_xrp import _telemetry as t, Measurements, Pose, RawSensors, RobotState

queue = []
heapq.heappush(queue, (2, 0, "second"))
heapq.heappush(queue, (1, 1, "first"))
assert heapq.heappop(queue)[2] == "first"
history = array.array("i", [1, 2, 3])
assert len(history) == 3 and history[1] == 2
assert collections.deque((), 2) is not None

now = 100
t._ticks_ms = lambda: now
t._ticks_diff = lambda a, b: a - b
def publish(raw, dt=0.02):
    state = RobotState(Measurements(raw.time_ms, dt, 0, 0, 0, 0, 0, 0, raw.range_mm, False), Pose(0, 0, 0))
    t.publish_state(state, raw_sensors=raw, sample_period_ms=20, overrun_ms=3)
    return state

t.clear_state()
t.begin_course_samples()
first = RawSensors(100, 10, 11, 120, False)
t.publish_raw_sensors(first, True, {"batteryV": 5.8, "accelerationMg": (1, 2, 3)})
publish(first, 0)
now = 143
second = RawSensors(120, 20, 21, None, False)
t.publish_raw_sensors(second)
state = publish(second)
rows = t.buffered_state_snapshots()
assert rows[1]["timing"][:3] == (120, 20, 2)
assert rows[1]["timing"][10:14] == (43, 20.0, 20, 3)
assert rows[0]["diagnostics"] == rows[1]["diagnostics"]
assert rows[1]["rangeMm"] is None
now = 150
t.publish_state(state, kind="stop")
assert t.state_snapshot()["timing"][2] == 2
assert t.state_snapshot()["timing"][14] == "stop"
t.end_course_samples()
now = 160
t.publish_raw_sensors(RawSensors(160, 30, 31, None, False))
assert t.state_snapshot()["timing"][14] == "raw"
del rows, first, second, state

t.clear_state()
t._ticks_diff = lambda a, b: (a - b + 16) % 32 - 16
now = 29
publish(RawSensors(28, 1, 1, None, False))
now = 6
publish(RawSensors(4, 2, 2, None, False), 0.008)
assert t.state_snapshot()["timing"][:3] == (4, 8, 2)
assert t.state_snapshot()["timing"][10] == 10

t.clear_state()
t._ticks_diff = lambda a, b: a - b
gc.collect()
`);
// This pinned WASM build defers GC until a top-level Python call returns.
// Measure transient growth inside a call and retained memory after that boundary.
run(`
empty_heap = gc.mem_alloc()
for i in range(96):
    now = 1000 + i * 20
    t.publish_raw_sensors(RawSensors(now, i, -i, None, False))
gc.collect()
`);
run(`
full_heap = gc.mem_alloc()
for i in range(96, 1200):
    now = 1000 + i * 20
    t.publish_raw_sensors(RawSensors(now, i, -i, None, False))
in_call_heap = gc.mem_alloc()
gc.collect()
`);
run(`
steady_heap = gc.mem_alloc()
assert len(t.buffered_state_snapshots()) == 96
assert t.state_snapshot()["timing"][:3] == (24980, 23980, 1200)
assert full_heap - empty_heap < 100000
assert steady_heap - full_heap < 4096
print(json.dumps({"micropython": sys.version, "implementation": str(sys.implementation), "bufferRows": 96, "rawReads": 1200, "retainedHeapBytes": full_heap - empty_heap, "retainedHeapGrowthAfterReturnBytes": steady_heap - full_heap, "transientHeapGrowthIn1104ReadsBytes": in_call_heap - full_heap, "gcBoundary": "top-level Python return in this WASM build", "builtinsExercised": ["heapq.heappush", "heapq.heappop", "array.array(i)", "collections.deque", "gc.mem_alloc"]}))
`);
assert.equal(rawPublications, 1201);
assert.equal(coursePublications, 5);
console.log(
  JSON.stringify({
    harness: "scripts/prove-telemetry-timing.mjs",
    package: "@micropython/micropython-webassembly-pyscript@1.28.0-6",
    heapBytes: 2 * 1024 * 1024,
    hardware: false,
    elapsedHostMs: Number((performance.now() - started).toFixed(1)),
    rawPublications,
    coursePublications,
    output,
  }),
);
