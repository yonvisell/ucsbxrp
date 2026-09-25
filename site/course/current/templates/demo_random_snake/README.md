# Random-snake route

The XRP drives a short straight segment, rotates 90 degrees left or right,
and repeats this sequence twelve times. **Run** starts the route; the robot
stops after the twelfth segment and rotation. Press **Stop** to end it earlier.

The random seed makes the chosen distances and directions repeat on each run.
Watch **phase**, **segment** and **travel** under **Program watches**. Travel is
estimated motion of the midpoint between the wheels; rotating in place adds
no forward travel.
Use the **Forward speed** and **Turn rate** live sliders to compare two runs;
keep the random seed fixed so the requested segment sequence is comparable.

## Change the experiment

- **challenge.py** sets the random seed, number of segments, and distance range.
- **world.json** sets the arena and initial position and heading. Its finish
  marker shows the expected region for the supplied settings.
- **main.py** runs the sequence; **live_variables.py** declares speed and turn controls and publishes the watches;
  **robot_config.py** holds robot dimensions and controller settings.

On the physical XRP, place the robot at the configured starting pose in a
clear arena. Wheel slip and robot dimensions affect where the route finishes.
This demonstration does not sense obstacles.

A straight segment stops with an error if it takes more than 30 seconds; a
rotation has eight seconds. These limits help identify a robot that is not
moving as requested. The `finally` block calls `robot.stop()` when the route
ends or a Python error interrupts it.
