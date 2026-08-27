# Obstacle-turn demo

This project demonstrates a complete sensor-driven sequence:

1. drive forward until the range sensor reports a nearby obstacle;
2. turn left by 90 degrees using odometry; and
3. drive forward until the next nearby obstacle.

The same files run on the virtual or physical XRP. IDE Run starts immediately
on either target; a copy launched directly outside the course service waits
for USER. The program filters several range samples and gives each motion a
maximum duration. The robot always stops in the `finally` block, including
after an exception.

While it runs, open **Monitor → Live controls** to adjust the limited speeds,
obstacle distance, turn direction, and second approach. Updates take effect
together at a measured sample boundary. The same section shows named internal
values without adding diagnostic `print` statements to the control loop.
