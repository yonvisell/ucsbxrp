# Tutorial 3: sampled robot programs

Write one finite Virtual XRP program using the same `Robot.start()`,
`Robot.step()`, and `Robot.stop()` structure used by the course challenges. The
program requests straight motion for a fixed number of samples; it does not
solve a distance-control challenge.

Use the **Virtual XRP**. Edit only `student_work.py`. The function comments in
that file contain the sequence to implement, so this README can remain closed
while you code.

## Project modules

This is a complete UCSBXRP project:

- `main.py` is the entrypoint and calls your functions;
- `student_work.py` contains the two exercises;
- `exercise_checks.py` substitutes a software robot and checks method calls;
- `course_setup.py` assembles the supplied components;
- `robot_config.py` contains robot timing, geometry, calibration, and limits;
- `world.json` defines the world shared by the Virtual XRP and Monitor.

Imports connect these modules. `main.py` does not copy your functions; it loads
them with `from student_work import ...`.

## Exercise 1: read a RobotState record

Complete `mean_wheel_position_mm(state: RobotState) -> float`. Return the
arithmetic mean of the latest left and right wheel positions:

```python
measurements = state.measurements
mean_mm = (
    measurements.left_position_mm + measurements.right_position_mm
) / 2.0
```

`RobotState` groups the newest `Measurements` and odometry `Pose`. Reading its
fields does not acquire another sample. The next `Robot.step(...)` call produces
the next state.

## Exercise 2: run a finite sampled motion

Complete:

```python
def run_robot_program(
    robot: Robot,
    forward_speed_mm_s: float,
    sample_count: int,
) -> RobotState:
```

Before starting the robot:

- raise `ValueError` when `forward_speed_mm_s` is not positive; and
- raise `ValueError` unless `sample_count` is a non-Boolean integer from 20 to
  150, inclusive.

Then implement this sequence:

1. Enter a `try` block.
2. Call `robot.start(Pose(0.0, 0.0, 0.0))` once and retain the returned state.
3. Create `MotionCommand(forward_speed_mm_s, 0.0)`.
4. Use a `for` loop to call `robot.step(command)` exactly `sample_count` times.
   Replace the retained state with each returned state.
5. Return the final state.
6. In a `finally` block, call `robot.stop()`.

The `finally` block runs after normal completion and after an unexpected
`robot.start()` or `robot.step()` exception. It therefore provides one reliable
location for the final stop command. Do not catch those unexpected exceptions;
their messages are needed for diagnosis.

## Robot.step controls the sample time

**Do not call `sleep()`, `sleep_ms()`, or another delay inside a sampled robot
loop.** `Robot.step()` waits for the next absolute sample time, applies the
motion request, reads the XRP, updates wheel measurements and pose, and
publishes telemetry. An added delay changes the measurement interval,
wheel-speed estimate, controller response, odometry, telemetry rate, and total
motion.

## Check and run

1. Complete `mean_wheel_position_mm` and select **Check exercises**.
2. Complete `run_robot_program` and check again. The checker uses a software
   robot; it does not move either XRP.
3. Open Monitor and select **Run** with the Virtual XRP selected.
4. Confirm an approximately straight path, increasing mean wheel position, and
   a zero final drive command.
5. Reset and repeat. A fixed program in the same virtual world should produce a
   comparable trajectory.

`PASS` confirms the required result or call sequence. `NOT COMPLETED` means a
placeholder remains. `INCORRECT` identifies the first differing value or robot
method call.

Continue with **Tutorial 4: Behavior, controls, and telemetry** after this run.
