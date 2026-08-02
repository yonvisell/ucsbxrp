# Validation strategy

Validation is organized around student-visible contracts and realistic failure
modes. The harness is intentionally small: each behavior is proved at the
lowest useful layer, then a few complete workflows confirm that the layers work
together.

## Checks

| Check | What it establishes |
| --- | --- |
| Python contracts | records, units, numerical components, maps, planners, missions, starters, examples, and release contents |
| MicroPython parity | the canonical package and exact supplied `.mpy` files import and produce the same public results in browser and RP2350 MicroPython |
| TypeScript/unit | target protocol, OSC, project storage, recording, simulator physics/sensors, bounded buffers, and recovery transitions |
| Browser workflows | IDE, Monitor, shared target, project operations, diagnostics, offline loading, accessibility, and responsive behavior in stable Chrome |
| Physical integration | USB setup, LAN discovery, versions, synchronization, execution, logs, telemetry, reconnect, reset, and stationary sensors |
| Raised-wheel motion | short motor pulses, encoder sign/response, zero cleanup, and stopping behavior |
| Floor trials | calibrated trajectories and motion-induced sensor behavior on the final course surface |

The ordinary repository check is:

```sh
npm run check
```

Hardware commands are separate because CI has no robot attached, not because
students need a formal acceptance process.

## Numerical and course contracts

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

## Target protocol contracts

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
- cancellation of unfinished physical discovery and ordered shared-worker
  disconnect, so rapid React remounts cannot leave a hidden poller;
- dimensioned world/XRP views, ruler scaling, SI sensor labels, blocked-gate
  replanning, selectable scrolling signal plots, and the collapsible Monitor
  controls;
- bounded recordings and deterministic export;
- root and deployment-subpath offline reloads; and
- desktop and narrow layouts, semantic control names, keyboard-contained
  dialogs, reduced-motion/forced-color fallbacks, and measured contrast.

Tests assert roles, labels, state, and behavior. Screenshot comparisons are
reserved for stable layout structure; dynamic editor canvases and plots are
inspected interactively rather than frozen pixel-for-pixel.

## Physical XRP checks in the current pass

The attached robot is exercised through USB and `Pink`. The useful evidence is
concise:

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
