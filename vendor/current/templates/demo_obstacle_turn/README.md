# Obstacle-turn demo

This project demonstrates a complete sensor-driven sequence:

1. drive forward until the range sensor reports a nearby obstacle;
2. turn left by 90 degrees using odometry; and
3. drive forward until the next nearby obstacle.

The same files run on the virtual or physical XRP. In the virtual scene, Run
starts immediately. On the physical XRP, press and release USER when prompted.
The program filters several range samples and bounds each motion. The robot
always stops in the `finally` block, including after an exception.
