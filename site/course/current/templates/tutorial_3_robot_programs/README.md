# Tutorial 3: a measured robot program

This Virtual XRP project runs one straight segment and ends it when measured
wheel travel reaches 300 mm. Tutorial 2 used two kinds of segment; here you
trace the exact `Robot.start()` → `Robot.step()` → `Robot.stop()` data path that
appears in later challenges. The speed is a request in mm/s. Distance, not
elapsed time or a fixed sample count, decides normal completion.

Open the IDE and Monitor side by side. **Run the supplied project once before
editing.** Program output reports two `PASS` checks, the final mean wheel
position, and the final estimated pose. Monitor shows the path from the start
line. The runnable example uses supplied robot components; it does not
implement the Challenge 1 sensor or stopping controllers.

## Find the data in the project

| File | Role |
| --- | --- |
| `student_work.py` | The measured-position calculation and straight program to read and edit. |
| `main.py` | Supplied entrypoint with the 120 mm/s request and 300 mm target. |
| `exercise_checks.py` | Supplied software robot that checks returned data and stop behavior without motors. |
| `course_setup.py`, `robot_config.py` | Supplied robot assembly and settings. |
| `world.json` | Supplied arena and start pose shared by the Virtual XRP and Monitor. |

Read `main.py` first. `from student_work import ...` loads the functions from
the neighboring module. `main.py` creates the robot; it does not copy their
code. The start pose comes from `world.json`, so resetting the Virtual XRP
before each comparison gives both runs the same starting geometry.

## 1. Calculate one RobotState value

A call to `Robot.step(command)` returns a `RobotState`. Its
`state.measurements` contains the new wheel positions, and `state.pose`
contains the estimated arena position and heading. Reading either field does
not take a second sample.

`mean_wheel_position_mm(state)` computes the axle-midpoint wheel travel:

```python
mean_mm = (left_position_mm + right_position_mm) / 2.0
```

If left and right positions are 10 and 12 mm, the mean is 11 mm. If the start
sample was already at 40 mm and a later sample is at 90 mm, this segment has
advanced **50 mm**, not 90 mm. The program stores the start mean and subtracts
it from every later mean. Predict the result for starts `(20, 24)` and current
`(70, 76)` mm: start mean 22 mm, current mean 73 mm, travel 51 mm.

`RobotState` and `Measurements` are named records. Their fields state units;
a tuple such as `state[2]` would hide whether the number is a wheel position,
speed, or time. Python annotations describe the expected record type but do
not validate every method call automatically.

## 2. Trace the sampled loop

`run_robot_program(robot, forward_speed_mm_s, target_distance_mm)` performs
these operations in order:

1. Validate positive speed and target distance **before** starting motors.
2. Call `robot.start(load_world().initial_pose)` once and retain its state.
3. Save the starting mean wheel position and create
   `MotionCommand(forward_speed_mm_s, 0.0)` for straight motion.
4. Compare the latest measured travel with the distance target. If it is
   short, call `robot.step(command)` and compare the new state again.
5. Return the state that first meets or exceeds the target. `finally` calls
   `robot.stop()` on completion and on a Python error.

The last step can exceed the target slightly because the robot moves between
samples. In the software check, left and right positions advance 2.0 and
2.4 mm per sample. Their mean advances 2.2 mm, so a 30 mm target is first met
after 14 samples (`14 × 2.2 = 30.8 mm`). The target, not the number 14,
controls the loop. `MAXIMUM_SAMPLES` is only a fault stop if the sensor reports
no progress; it is not a maneuver duration.

## 3. Make one controlled comparison

1. With the Virtual XRP reset, Run at the supplied 120 mm/s and 300 mm target.
   Record the printed final mean position and compare the path with the
   300 mm start-line scale.
2. In supplied `main.py`, temporarily set `TARGET_DISTANCE_MM = 180.0`.
   Predict a roughly 120 mm shorter straight path. Reset and Run. The
   software checks still use their own small 30 mm example.
3. Restore 300 mm. In `student_work.py`, change the return expression in
   `mean_wheel_position_mm` so it uses only the left wheel. Run and read the
   first `INCORRECT` check. The straight run can still proceed, but its
   completion estimate has changed. Restore the mean and confirm two `PASS`
   checks on the next Run.

The supplied check substitutes a recording robot, so it verifies that
`start()` is called once, that commands request straight motion, that a
measured target ends the loop, and that `stop()` executes after completion or
an exception. An invalid speed or distance must fail before `start()`.

`Robot.step()` schedules the sample and publishes telemetry. Do not add
`sleep()` inside this loop. The target runtime handles the IDE's **Stop**;
forced termination can bypass Python `finally`, so the runtime also releases
motor effort. Use a physical XRP only after its separate setup and safety
instructions; this tutorial's worked comparison is virtual evidence.

Continue to **Tutorial 4: behavior, controls, and telemetry** to make the next
command depend on range and heading measurements.
