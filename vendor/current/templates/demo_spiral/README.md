# Expanding spiral demo

The XRP drives forward while its turn rate gradually decreases, producing an
outward spiral. The forward range sensor is checked every control sample; the
robot stops when an obstacle is closer than `OBSTACLE_STOP_MM` in `main.py`.
In the open world, use the ordinary **Stop** control when you have observed the
trajectory. `MAX_TRAVEL_MM = 350000` and `MAXIMUM_SAMPLES = 180000` remain
finite backup limits. They stop at the maximum distance or maximum number of
control updates, respectively. Use **Stop** after observing a useful segment;
the virtual runtime may stop a long run earlier when its memory threshold is reached.

Open **Monitor → Live controls** while the program runs to adjust exactly two
parameters:

- **Forward speed** changes how quickly the XRP travels along the spiral.
- **Spiral winding rate** changes how tightly the spiral winds. Its 0.5–1.0
  revolutions/m range is coupled to the 90–110 mm/s speed range so the outer wheel
  target remains within the configured drive envelope at every allowed setting.

The program also publishes **Travel** and **Yaw rate**. They
appear as green choices under **Monitor → Controls → Plot signals**. Uncheck a
signal to hide its plot; it remains in the saved data.
Select **Obstacle ahead** in the Monitor's World control to exercise the
ultrasound stop; **Course arena** is the continuous observation case and is
normally ended with **Stop**.

The same project runs on the virtual or physical XRP. IDE Run starts it
immediately on either target; a copy launched directly outside the course
service waits for USER. The `finally` block stops the motors when the motion
function returns or exits through a Python exception. The IDE's **Stop** also
requests zero motor output directly, including when it must terminate the virtual runtime.
