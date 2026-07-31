# Validation plan

This harness is risk-based and contract-oriented. It should prove student-visible
behavior and safety invariants without freezing incidental implementation
choices, exact log prose, CSS geometry, private state, or one valid algorithmic
tie-break.

## Test layers

| Layer | Proves | Ordinary trigger |
| --- | --- | --- |
| Fast | formatting, TypeScript, OSC, simulator, target state, project helpers, pure Python contracts | `npm run check:fast` |
| MicroPython | canonical `ucsb_xrp` imports and contracts; source/`.mpy` parity in WebAssembly | `npm run test:micropython` |
| Browser | separate IDE, Monitor, recovery, diagnostics, target-safety, responsive, accessibility, and offline workflows | `npm run test:browser` |
| USB H0/H1 | controller identity, firmware/runtime, filesystem, versions, imports, reset/recovery, non-motion peripherals, and zero-effort cleanup | explicit hardware command |
| Wireless | discovery, permission, transfer transaction, replies, telemetry, reconnect, exception/watchdog recovery | explicit hardware command |
| Motion H2/H3 | bounded raised-wheel motion, signs, encoders, stop/failure; then floor calibration and challenges | explicit motion gate |
| Release | immutable bundle hashes, clean install, offline apps, bytecode artifacts, representative recordings, written acceptance | `npm run test:release` |

The current repository implements only part of the Fast, MicroPython, and
Browser rows. Command names above are the target interface and should be added
only when their corresponding checks exist.

## Acceptance matrix

| Product boundary | Required evidence before it is called complete |
| --- | --- |
| `ucsb_xrp` | public contract tests on CPython and MicroPython; exact course package used by both targets; invalid configuration and numerical boundaries covered |
| Reference modules | source contracts pass; exact `.mpy` artifacts built reproducibly; compiler compatibility and hashes recorded; imports and contract vectors pass in WebAssembly and RP2350 |
| Virtual XRP | deterministic physics and sensors; canonical package runs; watchdog/fail-to-zero behavior; reset and cross-tab ownership; no student algorithm hidden in simulator |
| Device service | version/capability discovery; correlated replies and timeouts; atomic project transaction; independent supervision; exception, partial transfer, reconnect, and reset recovery |
| IDE | durable recovery; complete project operations; import-aware structured diagnostics; target-specific Validate/Transfer/Run/Stop/Reset; accessible responsive behavior; offline-ready release |
| XRP Monitor | dynamic channels and units; no-data/stale/paused states; bounded storage; throttled rendering; recording/replay/export independent of visible panels |
| USB hardware | machine-readable H0/H1 evidence with board identity hash, exact firmware/library/course versions, commands, observations, and limitations |
| Powered motors | separate H2/H3 evidence; explicit human gate; hard time limit; zero before/after; signs, stopping, failure, and disconnect verified physically |
| Wi-Fi/browser | warm offline cache; explicit network permission; deployed HTTPS origin; round trip, transfer, run/stop/reset, telemetry, reconnect, and denied-permission recovery |

## Library and numerical tests

- Use immutable JSON/vector fixtures where the same inputs should run through
  reference source, student exemplars, WebAssembly, and physical MicroPython.
- Inject monotonic clocks. Test timestamp wrap, zero/nonpositive elapsed time,
  and sample overruns explicitly.
- Derive tolerances from encoder quantization, fixed-step integration, and
  sensor resolution. Do not use an unexplained global epsilon.
- For differential drive, include analytic straight, in-place, and curved
  trajectories plus inverse sign cases.
- For planning, assert free adjacent cells, correct endpoints, and minimum path
  length. Do not require one tie-dependent shortest path.
- For navigation, assert state transitions, bounds, termination, and accepted
  tolerances. Do not inspect controller private variables.
- Compare virtual and physical traces by stated qualitative features and
  justified envelopes. Do not tune the simulator to reproduce one floor run.

## Protocol, OSC, and target tests

- Every command has an identifier, correlated reply, bounded timeout, and
  explicit error outcome. A transmission alone never passes a test.
- Test target capability/version mismatch, duplicate/idempotent commands,
  truncated or malformed frames, oversized payloads, and reconnect.
- OSC coverage includes signed int32 limits, float32 special-value policy,
  Unicode, embedded-NUL rejection, every padding length, truncated padding,
  invalid type tags/arguments, and a declared trailing-byte policy.
- Cross-check shared OSC vectors against an independent or MicroPython codec.
- Fault-inject at storage, worker, and transport boundaries instead of mocking
  internal classes.
- Expired run ownership, page crash, exception, reset, disconnect, and watchdog
  timeout must independently converge to zero commanded effort.

## Browser tests

Keep browser workflows independent so an early folder/settings failure does not
mask target safety or monitor behavior. Maintain one cross-tab production smoke,
then separate tests for:

- validation and source-linked syntax/import/runtime diagnostics;
- recovery reload, dirty replacement, Save/Save As, ZIP fallback, and partial
  write failure;
- virtual run, normal completion, exception, non-yielding program, Stop, Reset,
  owner loss, and fail-to-zero;
- monitor no-data/stale/paused states, bounded buffers, recording/replay, and
  deterministic exports;
- offline reload of IDE, Monitor, guide, worker, WASM, and current course bundle;
- desktop, course-laptop, and narrow-drawer keyboard/accessibility passes.

Assert semantic outcomes and state, not exact runtime patch wording or fixed
pixel positions. A few masked structural screenshots are appropriate; exclude
Monaco canvases and live charts from brittle visual snapshots.

## Hardware safety tiers

### H0 — discovery, read-only

- Enumerate USB interfaces and mounted volumes.
- Classify the runtime before opening serial as a REPL.
- Record firmware/status evidence without credentials or public unique names.
- Make no filesystem or device-state change.

### H1 — non-motion USB acceptance

- Verify/install a manifest-pinned runtime and library only after preserving the
  baseline and verifying image hash and board identity.
- Exercise REPL, imports, filesystem, soft/hard reset recovery, LED, USER button,
  IMU, range, and manual encoder changes where available.
- Permit zero effort only. The RP2350 board can supply motor-driver VIN from
  USB-C when its power switch is on, so a disconnected battery is not an
  unpowered-motor guarantee. XRPLib's `are_motors_powered()` threshold is
  diagnostic evidence, not a motion authorization gate.
- Require the board switch off, human confirmation that the MOT LED is off,
  and near-zero reported VIN. Fail closed if these disagree; USB must continue
  to provide the REPL through the independent system-power path.
- A software zero command is not evidence of physical stopping.

### H2 — motors powered, wheels raised

- Require explicit `--allow-motion` plus a fresh human confirmation that wheels
  are clear and the robot is supported.
- Begin with an acknowledged zero command; use low bounded effort and a hard
  duration; finish in `finally` with zero and independently reset on timeout.
- Verify left/right signs, encoder signs, stop, exception, disconnect, and
  watchdog behavior before calibration.

### H3 — floor operation

- Calibrate start effort, speed/effort response, wheel diameter, and effective
  track width with provenance and repeated trials.
- Run challenge acceptance only after H2 passes on the same release.

Motion tests are never part of an ordinary check or CI command.

## Hardware evidence record

Each run writes a machine-readable record containing:

- schema and harness version;
- timestamp and safety tier;
- hashed controller identity and observed USB model/VID/PID;
- exact firmware asset name, upstream immutable identity, byte size, SHA-256,
  MicroPython version and `_mpy` value;
- XRPLib and course release identifiers and hashes;
- battery connection assertion, observed VIN/motor-rail evidence, and required
  human confirmations;
- requested operations, target replies, measurements, pass/fail/deferred state,
  and limitations.

Raw logs may accompany the record. Do not commit passwords, unique SSIDs, or
unredacted device serial numbers.

## Harness discipline

- Keep the dependency set small. Strict TypeScript and Prettier are sufficient
  until a concrete lint defect class justifies another tool.
- Do not impose a global coverage percentage. Require focused cases at safety,
  parsing, numerical, and recovery boundaries.
- Record test-data provenance. Captured physical telemetry is a replay fixture,
  not universal ground truth.
- A skipped hardware capability is `deferred` with a reason, never silently
  passed or reported as failed when a capability is intentionally deferred.
