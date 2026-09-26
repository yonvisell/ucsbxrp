# Experimental Challenge 9 · Arena Circuit

This is a standalone experimental challenge. It assumes familiarity with the
sampled `Robot` loop, `MotionCommand`, and the supplied wheel/drive components.
It introduces local reflectance feedback and does not depend on the optional
range, mapping, localization-correction, or multi-stop extensions.

## The challenge

Use the left and right reflectance sensors to follow the dark closed circuit for
one continuous lap. Keep the line under the robot; lap time is secondary.

`LineFollower.update(reflectance, dt_s)` must return a `MotionCommand`. The
readings are normalized: 0 is a light floor and 1 is a dark line. A positive
left-minus-right error should turn the robot left. Begin with proportional
control, then use evidence from the plotted error to decide whether derivative
or integral action helps.

`main.py` only assembles the components, recognizes the visible finish bar, and
runs the sampled loop. It contains no stored trajectory or mission step limit.
`LapProgress` accepts a finish crossing only after four ordered checkpoints
from the estimated odometry pose. Reflectance readings steer the robot and
detect the finish bar; they do not by themselves establish a completed lap.
If neither sensor reaches the line-visible threshold, `main.py` requests zero
motion while it waits for the line to reappear.

## What you implement

Implement the challenge-local `LineFollower.update` method. Keep it reactive:
each command uses only the current reflectance pair, the sample interval, and
the controller state needed for P, PD, or PID feedback.

## Provided files and tools

- `line_follower.py` contains the only component to implement.
- `robot_setup.py` holds readable gains, speed, and finish thresholds.
- `component_checks.py` checks centered, line-left, and line-right responses
  without starting either robot.
- `live_variables.py` publishes reflectance, error, checkpoints, and phase in Monitor.
- `world.json` contains the closed virtual track and transverse finish bar.

## How the program runs

```text
left/right reflectance -> LineFollower -> MotionCommand -> Robot
estimated Pose -> LapProgress ordered checkpoints
finish-bar reflectance + checkpoints -> completed lap
```

Missing reflectance reports `reflectance_unavailable`. Loss of both line
signals requests zero motion immediately and reports `line_lost` after 0.4 s.
The run has a 100 s limit. The `component_checks.py` examples load
`LineFollower` from `line_follower.py` independently of its Run selector and
check steering signs, command limits, and reset behavior.

## Complete the challenge

1. Run **Test functions**. An unfinished `LineFollower` reports `NOT IMPLEMENTED`.
2. Implement `LineFollower.update` in `line_follower.py`.
3. Set `USE_STUDENT_LINE_FOLLOWER = True` in `robot_setup.py` and rerun the check.
4. Run virtually and compare left/right reflectance and line error in Monitor.
5. Complete one continuous lap without losing the line. Use lap time only as a
   secondary comparison after reliable retention.

## Virtual and physical setup

`world.json` defines an 18 mm dark centerline and a 50 mm transverse finish
bar, entirely within the standard 3048 mm by 1219.2 mm arena. The simulated
sensors are provisionally 55 mm forward and 12 mm left/right of robot center.

A physical run assumes two downward-facing reflectance sensors mounted ahead of
the axle and a continuous dark tape circuit on a light matte floor. Measure the
light and dark responses, sensor spacing and height, then adjust the thresholds
and controller gains in `robot_setup.py`. The virtual geometry is a useful
starting point, not evidence of physical calibration.

Success is one confirmed return across the finish bar without losing the line.
Immediate back-and-forth crossings do not count as a circuit. Physical lap
judging independently verifies the route because estimated pose is not ground
truth. Change the checkpoints in `lap_progress.py` when changing circuit
geometry in `world.json`. Reposition only after **Stop**.
