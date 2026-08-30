# Expanding spiral demo

The XRP drives forward while its turn rate gradually decreases, producing an
outward spiral. The forward range sensor is checked every control sample; the
robot stops when an obstacle is closer than `OBSTACLE_STOP_MM` in `main.py`.
In the open world, use the ordinary **Stop** control when you have observed the
trajectory. `MAX_TRAVEL_MM = 350000` and `MAXIMUM_SAMPLES = 180000` remain
visible finite failure guards, not short-run terminators.

Open **Monitor → Live controls** while the program runs to adjust exactly two
parameters:

- **Forward speed** changes how quickly the XRP travels along the spiral.
- **Spiral winding rate** changes how tightly the spiral winds. Its 0.5–1.0
  turns/m range is coupled to the 90–110 mm/s speed range so the outer wheel
  target remains within the configured drive envelope at every allowed setting.

The program also publishes **Spiral travel** and **Spiral yaw rate**. They
appear as unchecked green choices under **Monitor → Controls → Plot signals**.
Select **Obstacle ahead** in the Monitor's World control to exercise the
ultrasound stop; **Course arena** is the continuous observation case and is
normally ended with **Stop**.

The same project runs on the virtual or physical XRP. IDE Run starts it
immediately on either target; a copy launched directly outside the course
service waits for USER. Motor output always returns to zero through the
`finally` block.
