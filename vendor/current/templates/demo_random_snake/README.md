# Deterministic random-snake demo

The XRP drives a somewhat random distance, turns 90 degrees left or right, and
repeats that pattern twelve times. A compact seeded linear-congruential
generator chooses every distance and direction, so every run with
`RANDOM_SEED = 0x5A17` produces the same path on CPython and MicroPython.

`world.json` places the virtual XRP at the left side of the course arena and
marks the expected finishing neighborhood for the supplied seed and nominal
configuration. The program uses the ordinary `Robot.step()` sample clock; it
does not add sleeps. It stops after twelve segments or earlier at either the
wheel-travel or sample limit, and `finally: robot.stop()` returns both motor
commands to zero on every exit.

The same project runs on Virtual XRP or Physical XRP. For a physical run, use
a clear, level area at least as large as the marked route, place the robot at
the world initial pose facing positive x, and supervise the run. Calibration
and wheel slip can move the physical finish away from the virtual marker, but
the turn, wheel-travel, and sample bounds remain in force.
