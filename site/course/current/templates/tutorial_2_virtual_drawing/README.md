# Tutorial 2: draw from measured motion

Use the **Virtual XRP** to draw four straight sides and four left turns. The
program stops each side when measured mean wheel travel reaches its target and
each corner when estimated heading changes by its target angle. This connects
Tutorial 1's arithmetic to a changing `RobotState`. The supplied drawing is
about 180 mm on each side; actual corners may round because motors respond
and samples arrive at discrete intervals.

Open Monitor beside the IDE. Select **Run** before editing, then read the
three `PASS` lines in Program output and inspect the path and final pose. The
files are already runnable so that each later edit has a visible baseline.

## Project files and first edit

| File | Role |
| --- | --- |
| `student_work.py` | Edit the segment data classes and `build_drawing(...)` to explore a path. |
| `main.py` | Supplied entrypoint; sets target dimensions, runs each segment, and stops the robot. |
| `exercise_checks.py` | Supplied checks for commands, measured completion, and segment order. |
| `course_setup.py`, `robot_config.py` | Supplied robot assembly and settings. |
| `world.json` | Supplied arena and initial pose used by the Virtual XRP. |

Each `.py` file is a Python module. `main.py` imports `build_drawing` from
`student_work.py` and calls it; it does not copy that function's code.

After the baseline, change `SIDE_DISTANCE_MM` in `main.py` from 180 to 120 mm,
**Reset** the Virtual XRP, and Run. Predict the change before looking at the
path: each side should be about 60 mm shorter, so total commanded straight
travel falls by about `4 × 60 = 240 mm`. Restore 180 mm, then make the next
changes in `student_work.py`. This changes the value passed into `build_drawing()`; the segment methods
remain in `student_work.py`.

## 1. Read one measurement calculation

`DrawingSegment("side 1", 140.0, 180.0)` stores a forward speed in mm/s and a
target distance in mm. Its `command()` returns
`MotionCommand(140.0, 0.0)`: forward motion with zero requested turn. A
`MotionCommand` is a named data record; it is not a duration or a raw motor
voltage.

`is_complete(start_state, current_state)` compares two readings:

```python
left_mm = current.left_position_mm - start.left_position_mm
right_mm = current.right_position_mm - start.right_position_mm
travel_mm = (left_mm + right_mm) / 2.0
```

For starting wheel positions `(30, 34)` mm and current positions `(129, 133)`
mm, both wheels advanced 99 mm; a 100 mm side is not yet complete. At
`(131, 135)` mm, both advanced 101 mm and it is complete. Subtracting the
starting readings matters: the robot's wheel positions do not reset at every
side.

`__init__` runs when a segment object is created. Its `self.name`,
`self.forward_speed_mm_s`, and `self.distance_mm` belong to that instance.
`command()` and `is_complete()` read those same fields later. Python type
annotations state expected types but do not enforce them by themselves;
constructor checks reject a missing name or nonpositive speed or distance.

## 2. Read one turning calculation

`TurnSegment("corner 1", 1.5, pi / 2.0)` requests an in-place left turn at 1.5 rad/s.
Its `is_complete(...)` compares the current estimated heading with the heading
at the start of this corner. `pi` is imported from `math`; `pi / 2.0` rad is
90°. At 1.50 rad of heading change,
the corner is short of that target; at 1.60 rad, it has reached it. The code
uses `wrap_angle_rad` so crossing the `−π`/`π` heading boundary does not make
one ordinary quarter-turn look like a full revolution.

The segment classes each store a different physical target. `DrawingSegment`
uses wheel travel in mm; `TurnSegment` uses heading change in rad. Their shared
method names let the short loop in `main.py` run either segment without asking
which kind it received.

## 3. Build and change an ordered path

`build_drawing(side_speed_mm_s, side_distance_mm, turn_rate_rad_s,
turn_angle_rad)` creates a list alternating side, corner, side, corner, and so
on. Read the `for index in range(4)` loop and predict the first and last
segment names. The first item is `side 1`; the eighth is `corner 4`.

Change `build_drawing(...)` to use a shorter distance for sides 2 and 4 while
leaving sides 1 and 3 at the requested distance. For example, half-length
sides make a rectangle. Keep the passed-in `side_distance_mm` as the source of
both lengths so the function still works with another input. The checks will
say the result differs from the expected square sequence; **Run still executes the
current valid drawing** so you can inspect your rectangle. Restore the square
before continuing.

## 4. Compare prediction with the run

1. Reset, Run, and note the three check results, drawn path, and `final_pose`.
2. Make one dimension or sequence change. Predict which sides or corners
   change, in mm or rad, before running again.
3. Reset and Run. Compare the new path with the prediction. Use Program output
   to locate a mismatch in a command value, measured completion rule, or
   segment order.
4. Restore the baseline; Run once more and confirm three `PASS` lines.

The inner loop in `main.py` calls `Robot.step(command)` repeatedly **until the
measured target is reached**. It does not use a duration as the drawing
instruction. `MAXIMUM_SEGMENT_SAMPLES` is a fault stop if measurements or
motion fail to advance; it is not the target for a normal side or corner.
`Robot.step()` already schedules samples, so do not add `sleep()` inside the
loop. The `finally` block calls `robot.stop()` when motion finishes or Python
raises an error. Select **Stop** in the IDE to interrupt a running experiment.

Continue to **Tutorial 3: sampled robot programs** to examine the `RobotState`
returned by each sample and one measured straight run.
