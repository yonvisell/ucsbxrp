# Validation strategy

Validation is organized around student-visible behavior, required interfaces,
and realistic failure modes. The harness is intentionally small: each behavior
is proved at the lowest useful layer, then a few complete workflows confirm
that the layers work together.

## Checks

| Check | What it establishes |
| --- | --- |
| Python API behavior | records, units, numerical components, maps, planners, missions, starters, examples, and release contents |
| MicroPython parity | the canonical package and exact supplied `.mpy` files import and produce the same public results in browser and RP2350 MicroPython |
| TypeScript/unit | target protocol, OSC, project storage, recording, simulator physics/sensors, bounded buffers, and recovery transitions |
| Browser workflows | commissioning wizard, IDE, Monitor, shared target, project operations, diagnostics, offline loading, accessibility, and responsive behavior in stable Chrome |
| Physical integration | Web Serial/REPL commissioning, firmware recovery, LAN discovery, versions, synchronization, execution, logs, telemetry, reconnect, reset, and stationary sensors |
| Raised-wheel motion | short motor pulses, encoder sign/response, zero cleanup, and stopping behavior |
| Floor trials | calibrated trajectories and motion-induced sensor behavior on the final course surface |

The ordinary repository check is:

```sh
npm run check
```

Hardware commands are separate because CI has no robot attached, not because
students need a formal acceptance process.

## Numerical and course behavior

- Reuse immutable input/output vectors across supplied source, student
  exemplars, WebAssembly MicroPython, and physical MicroPython.
- Inject clocks. Cover timestamp wrap, nonpositive elapsed time, and loop
  overruns explicitly.
- Derive tolerances from encoder quantization, fixed-step integration, and
  sensor resolution; do not use an unexplained global epsilon.
- Cover straight, in-place, and curved differential-drive trajectories,
  including sign inversions.
- For navigation, test state transitions, limits, termination, and accepted
  tolerances through the public interface.
- For planning, verify free adjacent cells, endpoints, validity, and minimum
  path length without requiring one arbitrary tie break.
- Treat captured physical telemetry as a replay fixture, not universal ground
  truth.

## Target protocol behavior

Both targets run the same conformance cases:

- discover identity, versions, capabilities, and current state;
- correlate every request and reply, including timeouts and structured errors;
- synchronize a whole project transactionally so an interrupted upload keeps
  the preceding runnable project;
- validate, run, stop, and reset as separate operations;
- reconnect without inventing a successful state, retain reconnecting through
  intentional reboots, and restart log cursors when the boot identifier changes;
- reject malformed, duplicate, incompatible, and oversized input cleanly;
- preserve typed channel names, units, timestamps, sequence numbers, logs, and
  events; and
- end a run after exception, reset, connection loss, or lease expiry.

Protocol tests fault-inject at transport, storage, and runtime boundaries. They
avoid mocking private implementation details.

## Browser workflows

Keep browser tests independent so one failed dialog does not hide unrelated
target or Monitor defects. Cover:

- folder open/save, file create/rename/duplicate/delete, startup selection,
  browser recovery, tabs, and keyboard commands;
- MicroPython syntax results and visible runtime output;
- virtual discovery, synchronize, run, stop, reset, owner loss, and all five
  cumulative course starters;
- physical request correlation, timeouts, unavailable-device messages, and the
  same browser fetch receiver used by stable Chrome;
- commissioning controller/version rejection, raw-paste flow control and raw
  fallback, watchdog feeding, changed-only transfer, complete remote hashing,
  import verification, repeated repair, firmware integrity, network profile,
  reset, service proof, project-folder write/read verification, visible and
  saved handoff failures, and project-folder/physical-target handoff;
- cancellation of unfinished physical discovery and ordered shared-worker
  disconnect, so rapid React remounts cannot leave a hidden poller;
- dimensioned world/XRP views, ruler scaling, SI sensor labels, blocked-gate
  replanning, selectable scrolling signal plots, and the collapsible Monitor
  controls;
- bounded recordings and deterministic export;
- root and deployment-subpath offline reloads, complete third-party notices,
  and the HTTPS document-to-local-device permission handoff; and
- desktop and narrow layouts, semantic control names, keyboard-contained
  dialogs, reduced-motion/forced-color fallbacks, and measured contrast.

Tests assert roles, labels, state, and behavior. Screenshot comparisons are
reserved for stable layout structure; dynamic editor canvases and plots are
inspected interactively rather than frozen pixel-for-pixel.

## Physical XRP checks when hardware is attached

An attached robot is exercised through USB and whichever local robot network is
selected. The useful evidence is concise:

- detected board and runtime versions;
- installed course/service release hashes;
- assigned LAN address and service discovery reply;
- project synchronization and file inventory;
- check, start, stop, reset, reconnect, logs, and telemetry;
- USER button, IMU, range, encoder, and power readings;
- short, bounded, raised-wheel motor pulses with encoder count deltas and zero
  cleanup, without reinitializing RP2350 PIO encoders from the program core;
  and
- the exact behaviors that remain untested because they require floor motion.

Credentials, device serial numbers, and unique identifiers are not committed.
Historical detailed captures remain under `docs/hardware/`; ordinary users do
not reproduce them.

The dev.7 file-repair path has now passed on the attached XRP: first comparison,
no-change repetition, deliberate changed-file repair, verified temporary-file
activation by direct rename, complete destination readback, runtime imports,
and reset. The remaining browser-specific pass starts from the public Pages
origin and crosses the native project-folder chooser into Web Serial, hotspot
Local Network Access, automatic IDE selection, and one ordinary Wi-Fi project
flash. UF2 volume recovery should be exercised only on a controller whose
runtime is actually incompatible, rather than rewriting a correct robot for a
formal check.

## Harness discipline

- Test public behavior and genuine boundaries, not implementation shape.
- Keep dependencies few and pinned; add a tool only when it catches a concrete
  class of defects.
- Do not impose a global coverage percentage.
- Keep timeouts short enough to expose hangs and long enough for the measured
  RP2350 path.
- Record skipped physical behavior plainly; never translate “not exercised”
  into pass or failure.
- A stage finishes only after the focused checks and one representative
  end-to-end workflow pass.
