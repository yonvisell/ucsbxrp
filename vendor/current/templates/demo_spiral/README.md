# Expanding spiral demo

The XRP drives forward while its turn rate gradually decreases, producing an
outward spiral. The forward range sensor is checked every control sample; the
robot stops when an obstacle is within 260 mm. A bounded travel limit also
stops the program if no obstacle is detected.

Open **Monitor → Live controls** while the program runs to adjust exactly two
parameters:

- **Forward speed** changes how quickly the XRP travels along the spiral.
- **Spiral winding rate** changes how tightly the spiral winds.

The program also publishes **Spiral travel** and **Spiral yaw rate**. They
appear as unchecked green choices under **Monitor → Controls → Signals**.
Select **Obstacle ahead** in the Monitor's World control to exercise the
ultrasound stop; **Open field** exercises the travel limit.

The same project runs on the virtual or physical XRP. IDE Run starts it
immediately on either target; a copy launched directly outside the course
service waits for USER. Motor output always returns to zero through the
`finally` block.
