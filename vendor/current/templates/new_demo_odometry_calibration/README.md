# New Demo · Odometry Calibration

Before Waypoint Courier, compare estimated pose with independently measured
axle-center pose. Use `experiments.py` to choose straight, arc, turn_left,
turn_right or square. Each segment has a separate duration and command; duration
is not a distance or sample count. The program observes zero-command settling
between segments and calls `robot.stop()` in `finally` after normal completion
or a Python exception. The target runtime handles the IDE's **Stop** separately;
forced termination can bypass Python cleanup.

Implement and test the student Odometry file; the earlier sensor, wheel and
drive components have independent selectors in course_setup.py. Run with supplied
components first. `world.json` sets the initial pose and clear area.

1. Predict wheel increments and pose for a straight segment and an in-place turn.
2. Check both turn signs, radians, mm and heading wraparound.
3. Estimate effective track width from total left/right travel and an independent
   measured angle: track = (right travel - left travel) / measured angle.
4. Compare clockwise/counterclockwise and square endpoint errors; preserve raw
   increments when filtering wheel speed. Change one calibration parameter.
5. Save estimated x/y/heading and endpoint measurements. Monitor's labelled
   virtual truth is only comparison evidence, never a student controller input.

A square tests accumulated position and heading error; individual straight and
turn tests help identify its cause. An ideal virtual experiment alone does not
validate a real robot's wheel diameter, track width or slip. Compile, Test
components, then Run; use Program output for exceptions and phase endpoints.
