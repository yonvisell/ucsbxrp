# Expanding spiral

Run this demonstration to see how forward speed and yaw rate shape a curved
path. The robot drives forward while its yaw rate gradually decreases, so the
spiral expands. Watch the path in **Monitor** and press **Stop** when finished.

During the run, **Forward speed** and **Spiral winding rate** appear under
**Live controls**. Winding rate is expressed in revolutions per metre: a larger
value makes a tighter curve. **Travel** and **Yaw rate** are recorded and can be
selected under **Plot signals**.

## Change the experiment

- **world.json** sets the arena, obstacles, and initial position and heading.
  The default **Arena** is 3048 mm long and 1219.2 mm wide, with its origin at
  the centre. Heading zero points along +x; positive angles turn toward +y.
- **challenge.py** sets expansion distance and the obstacle stopping threshold.
  **live_variables.py** declares speed and winding controls; its 0.7 revolutions/m winding default starts
  with a broad curve; increase winding to compare tighter turns.
- **main.py** contains the spiral calculation and the repeated motion commands.
  **live_variables.py** also publishes travel and yaw rate; **robot_config.py**
  holds the robot dimensions and controller settings.

The **Obstacle ahead** world places a block 1000 mm in front of the starting
position. The spiral curves as it approaches; it is not a straight approach
experiment. Use **Obstacle turn** for that demonstration.

## Run on the physical XRP

Place the robot at the starting pose shown in **world.json**, with room to
move. The program stops when ultrasound reports an obstacle within 400 mm of
the sensor face. A missing echo allows motion to continue, so keep the path in
view and use **Stop** if needed. Broad, firm objects make useful ultrasound
targets.

`try` contains the motion sequence. When it ends normally or a Python error
interrupts it, `finally` runs `robot.stop()` to stop the motors. The IDE also
provides **Stop** during a run.
