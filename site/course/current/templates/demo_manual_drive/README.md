# Manual driving

This demonstration lets you steer the XRP with two sliders in **Monitor → Live
controls**. Open the Project in the IDE, choose the **virtual XRP** first, and
press **Compile**, then **Run**. The robot starts stopped. Set **Forward speed** above zero to
drive forward or below zero to reverse. Set **Turn rate** above zero to turn
left or below zero to turn right. The two settings combine to make curves.
Both sliders start at zero on a new run.

To halt during a run, return **both sliders to zero** or press **Stop** in the
IDE. Press Run again to start a fresh, stopped session. The program calls
`robot.stop()` when Stop or a Python error interrupts it. Keyboard arrows are not captured, so the IDE's
editor and other controls keep their normal keyboard behavior.

`live_variables.py` declares the bounded slider settings; `main.py` contains the drive loop. `world.json`
defines the virtual arena and starting pose. `course_setup.py` assembles the
supplied robot components; `robot_config.py` holds the robot settings. The
same project can run on a physical XRP, but use a clear floor area, keep the
robot in view, and have **Stop** ready. This demonstration has no automatic
obstacle avoidance; the front range sensor cannot see behind the robot.
