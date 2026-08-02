# MicroPython foundations

These short lessons use the Python subset available in course MicroPython
1.28. Read them in order. Each file is complete and can be selected as the
project's startup file; use **Set startup**, then **Run** on the virtual XRP.

1. `1_values_and_functions.py` — values, names, units, and functions
2. `2_collections_and_loops.py` — lists, dictionaries, and iteration
3. `3_classes.py` — small objects with explicit state
4. `4_exceptions.py` — failures and reliable cleanup
5. `5_modules.py` — importing reusable code from another file
6. `6_virtual_robot.py` — a bounded open-loop virtual-XRP drawing motion
7. `7_finite_state_machine.py` — readable state transitions

The robot lesson uses `try/finally` so drive command returns to zero even if
the program is interrupted. Course challenge code later uses the measured
`Robot.step(...)` loop for sensor feedback and regular sampling.
