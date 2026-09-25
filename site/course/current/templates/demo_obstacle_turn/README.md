# Obstacle turn

Run a three-part motion sequence:

1. Drive toward an obstacle until ultrasound reports 400 mm from the sensor.
2. Rotate left through 90 degrees, using the estimated heading.
3. Drive toward the second obstacle and stop.

The default **World** contains two broad obstacles for this sequence. During
a run, **Live controls** lets you change the speed, obstacle distance, rotation
rate, turn direction and whether to make the second approach. **Program
watches** shows the current phase, distance and heading error.

## Change the experiment

**challenge.py** defines the rotation-failure limit; **live_variables.py** declares the live controls.
**world.json** defines the arena, obstacles and starting pose. **main.py**
contains the approach and rotation functions. **robot_config.py** holds robot
geometry and controller settings. **live_variables.py** also publishes range,
phase, and heading-error watches.

For a physical run, arrange broad, firm obstacles as shown in the world and
leave room for the robot to stop. A missing echo allows the approach to
continue; press **Stop** if the path is no longer clear or no obstacle is found.
A rotation that takes more than eight seconds stops with an error.

The `finally` block calls `robot.stop()` when the sequence ends or a Python
error interrupts it.
