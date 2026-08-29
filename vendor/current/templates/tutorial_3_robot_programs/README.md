# Tutorial 3: sampled robot programs

Run and modify one finite Virtual XRP program using the same `Robot.start()`,
`Robot.step()`, and `Robot.stop()` structure used by the course challenges. The
program requests straight motion for a fixed number of samples; it does not
solve a distance-control challenge.

Use the **Virtual XRP**. Open Monitor and select **Run** first. The supplied
program travels approximately 300 mm in the course arena, prints its final pose,
and stops. Then edit only `student_work.py`.

## Project modules

This is a complete UCSBXRP project:

- `main.py` is the entrypoint and calls your functions;
- `student_work.py` contains the two runnable examples;
- `exercise_checks.py` substitutes a software robot and checks method calls;
- `course_setup.py` assembles the supplied components;
- `robot_config.py` contains robot timing, geometry, calibration, and limits;
- `world.json` defines the world shared by the Virtual XRP and Monitor.

Imports connect these modules. `main.py` does not copy your functions; it loads
them with `from student_work import ...`.

## Walkthrough 1: read a RobotState record

`mean_wheel_position_mm(state: RobotState) -> float` returns the
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

## Walkthrough 2: run a finite sampled motion

Read and trace:

```python
def run_robot_program(
    robot: Robot,
    forward_speed_mm_s: float,
    sample_count: int,
) -> RobotState:
```

Before starting the robot:

- raise `ValueError` when `forward_speed_mm_s` is not positive; and
- raise `ValueError` unless `sample_count` is a positive integer.

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
loop.** `Robot.step()` already waits for the next scheduled sample. It then
applies the command, reads the XRP, updates measurements and pose, and publishes
telemetry. An added delay makes the sample interval wrong and changes both the
measured response and total motion.

## Check and run

1. Open Monitor and select **Run** with the Virtual XRP selected.
2. Confirm an approximately 300 mm straight path, increasing mean wheel
   position, printed final pose, and a zero final drive command.
3. Change `FORWARD_SPEED_MM_S` or `SAMPLE_COUNT` in `main.py`, predict the new
   distance, then select **Check examples**, reset, and rerun.
4. Restore the supplied value and repeat once. The same program in the same
   virtual world should produce a comparable trajectory.

`PASS` confirms the required result or call sequence. If an experiment breaks
the example, the first differing value or robot method call is identified.

Continue with **Tutorial 4: Behavior, controls, and telemetry** after this run.
