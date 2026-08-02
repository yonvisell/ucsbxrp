# Challenge 1 library slice

## Usable result

The Challenge 1 starter is a complete Straight Run program. It reads encoders,
estimates wheel motion, requests closed-loop wheel speed, slows near the target
distance, stops in `finally`, and prints its measured result. The same five
project files run with simulated XRPLib in browser MicroPython or real XRPLib
on the RP2350.

- `main.py` contains the readable run sequence.
- `challenge.py` contains the task distance and speed.
- `robot_config.py` contains geometry and controller calibration.
- `student_components.py` contains the two student implementations.
- `course_setup.py` independently selects supplied or student components with
  explicit Boolean flags.

`SensorModel` converts timestamped encoder counts to wheel positions,
increments, and speeds. `WheelSpeedController` converts requested and measured
`WheelSpeeds` to bounded `MotorEfforts`, with an exact zero command for a zero
target. `StraightLineController` uses mean measured travel, slows near the
destination, and stops within the specified position tolerance.

## Reference artifacts

Reference source under `vendor/current/reference_source/` is retained build
input and may be improved. The official MicroPython 1.28 cross-compiler emits
the ordinary bytecode under `vendor/current/reference_mpy/`. The build is
deterministic and release metadata records source/artifact hashes and compiler
identity. The exact artifacts pass the same public contract vectors in browser
MicroPython and RP2350 MicroPython.

Verify them with:

```sh
.venv/bin/python scripts/reference_bytecode.py verify
npm run test:micropython
```

## Physical status

The package, reference bytecode, and starter import and compile on the attached
RP2350. Stationary sensors, project transfer, execution lifecycle, output,
telemetry, stop/reset, and reconnect are covered by the physical service probe.
A short raised-wheel motor check independently exercises the left motor, right
motor, both encoders, and zero cleanup. Full Straight Run accuracy remains a
floor-calibration activity because it depends on wheel/surface response and
effective robot geometry.
