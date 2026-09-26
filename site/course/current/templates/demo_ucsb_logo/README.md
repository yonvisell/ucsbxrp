# UCSB waypoint route

The XRP traces the block letters **UCSB** by following a sequence of positions
in the arena. **Run** starts the route; the robot stops after reaching all 28
waypoints. Press **Stop** to end the run earlier.

**world.json** contains the route and starting pose. The initial position is at
the upper-left of the U, facing down its first stroke. Labels mark the start of
each letter in **Monitor**. Watch the estimated path and the **travel** value
as the robot moves.

## Change the experiment

Edit the waypoint positions in **world.json** to change the drawing. The route
is loaded in marker order. **robot_setup.py** contains navigation speeds and
tolerances; **challenge.py** loads the named route. **main.py** passes
the route to the supplied navigation class and repeatedly applies its commands.

For a physical run, mark the starting position and heading in a clear arena.
The program follows its estimated position and does not sense obstacles.
Compare the physical path with the estimated path to see the effect of wheel
slip and robot dimensions.

The `finally` block calls `robot.stop()` when the route ends or a Python error
interrupts it.
