# UCSB-XRP examples

These small examples make units and component boundaries visible.

| Example | Hardware | Purpose |
| --- | --- | --- |
| `records_and_units.py` | None | Named records and course units |
| `challenge_1_components.py` | None | Sensor and wheel-controller data flow |
| `no_motion_sensor_read.py` | XRP with XRPLib | Live encoders, button, and range with a zero drive command |

`no_motion_sensor_read.py` explicitly sends a zero drive command and calls `stop()` in
`finally`. It checks the sensor path without relying on a special configuration
mode.

The generated reference bytecode is tested in browser MicroPython and on the
RP2350. The retained source is readable course material and can be improved as
the course develops.
