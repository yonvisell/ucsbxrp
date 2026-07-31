# Minimal UCSB-XRP examples

These examples exercise only the reviewed, provisional package surface. They
are intentionally small so that the units and hardware boundary remain clear.

| Example | Hardware | Motion status |
| --- | --- | --- |
| `records_and_units.py` | None | Cannot command hardware |
| `challenge_1_components.py` | None | Cannot command hardware |
| `no_motion_sensor_read.py` | XRP with XRPLib | Motion-locked; reads sensors and writes zero effort only |

`no_motion_sensor_read.py` constructs the default `RobotConfig()`, whose
`max_effort` is zero, verifies that the configuration is motion-locked, and
calls `stop()` in `finally`. It does not make an energized motor rail safe:
before an H1 USB check, set the board switch off, confirm that the MOT LED is
off, and require near-zero reported VIN.

No physical-motion example is provided before raised-wheel H2 acceptance and
per-robot calibration. Do not enable motion by changing `max_effort` in these
examples. Motor tests require a separate explicit motion gate, bounded effort
and duration, and zero-effort cleanup.

`challenge_1_components.py` uses recorded sensor inputs. It demonstrates the
supplied Challenge 1 component contracts without importing XRPLib or writing to
a motor. The generated reference bytecode has passed the same behavior vector
in browser MicroPython and on the RP2350; the retained implementation remains
open to course-driven improvement.
