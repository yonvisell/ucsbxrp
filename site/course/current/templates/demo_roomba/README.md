# Roomba-style obstacle avoidance

The XRP drives toward an obstacle, reverses briefly, turns, and drives forward
again. **Run** starts the demonstration; press **Stop** when finished.

The initial settings stop the approach at a forward ultrasound distance of
240 mm, reverse for 0.4 s, and choose a rotation
between 70 and 160 degrees.
A fixed random seed repeats the same sequence of turn choices on each run.
Watch the phase, distance and number of turns under **Program watches**.
The **Live controls** sliders adjust forward and reverse speed, obstacle
distance, and turn rate during the run. Their current values appear in Monitor.

## Change the experiment

- **challenge.py** contains the reverse duration, turn-angle range and random seed.
- **world.json** defines the arena, divider and starting pose.
- **main.py** implements the approach → reverse → turn sequence using the
  supplied robot services. **live_variables.py** declares speed, obstacle distance and turn controls, and publishes the watch values;
  **robot_setup.py** contains robot-specific settings.

For a physical run, leave space behind the robot for reversing and use broad,
firm obstacles. A missing ultrasound echo allows the approach to continue;
watch the robot and use **Stop** if necessary. The robot has no rear range sensor.

If a turn does not finish within eight seconds, the program stops and reports
the problem. The `finally` block calls `robot.stop()` when the motion sequence
ends or a Python error interrupts it.
