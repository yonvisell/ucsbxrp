# Tutorial 3: UCSBXRP robot programs

This project introduces the sampled program structure used by the course
challenges. Edit only `student_work.py`. Complete and test the program with the
**Virtual XRP** before considering a physical run.

## The UCSBXRP project structure

This tutorial is a complete project rather than one standalone Python file:

- `README.md` states the task and checkable result;
- `student_work.py` contains the one exercise you edit;
- `exercise_checks.py` checks that exercise with a software robot;
- `main.py` is the entrypoint that constructs and runs the project;
- `robot_config.py` contains named robot settings and units;
- `course_setup.py` assembles the supplied course components; and
- `world.json` gives the Virtual XRP and Monitor one shared world.

Python files are modules. `import` statements connect them by name. Keeping
task flow, robot settings, checks, and world geometry in their stated files
makes later projects readable without copying those responsibilities into one
large script.

## The program structure

[`main.py`](main.py) constructs the robot from the supplied course components,
then calls your `run_robot_program(robot)` function. Your function is
responsible for one complete run:

1. `robot.start(Pose(...))` initializes measurements, odometry, and the sample
   schedule and returns the first `RobotState`.
2. Each `robot.step(MotionCommand(...))` applies a motion request, waits until
   the next scheduled sample, reads the XRP, updates the course components, and
   returns the next `RobotState`.
3. `robot.stop()` sets the final motor command to zero.

Place `robot.start(...)` and the sampled loop inside `try`, then call
`robot.stop()` in `finally` so the stop occurs after normal completion and
after an unexpected start or step error.

## Exercise: write one bounded sampled program

Complete `run_robot_program(robot)` in
[`student_work.py`](student_work.py). It must:

- call `robot.start(Pose(0.0, 0.0, 0.0))` exactly once;
- call `robot.step(...)` between 20 and 150 times;
- supply a `MotionCommand` with positive forward speed and zero turn rate on
  every step;
- retain the state returned by each step and return the final state; and
- call `robot.stop()` from a `finally` block.

Use a `for` loop because this exercise has a known maximum number of samples.
The supplied check substitutes a small software robot that records the calls
and deliberately raises one `robot.step()` error to confirm that `finally`
still calls `robot.stop()`. It does not move the virtual or physical XRP.

The constructor `MotionCommand(forward_speed_mm_s, turn_rate_rad_s)` expresses
robot motion rather than raw motor power. Positive forward speed is in
millimeters per second. Positive turn rate is a left yaw rate in radians per
second; this exercise requires zero turn rate.

## Reading a returned robot state

This complete example answers a different question from the exercise: whether
the mean wheel position has reached a requested distance.

```python
def reached_distance(state, target_mm):
    measurements = state.measurements
    mean_position_mm = (
        measurements.left_position_mm + measurements.right_position_mm
    ) / 2.0
    return mean_position_mm >= target_mm
```

`RobotState` groups the latest measurements and pose. Reading it does not take
another sample; the next `robot.step(...)` call produces the next state.

## Do not add another delay

**Do not call `sleep()`, `sleep_ms()`, or another delay inside the sampled
loop.** `Robot.step()` already waits until the next absolute sample time. An
additional delay changes the time between encoder readings, so it changes the
wheel-speed estimate, controller response, odometry update, telemetry rate,
and total motion. The virtual and physical targets use the same scheduling
rule.

## Test and inspect

1. Select **Check exercises**. The action tests the robot call sequence without
   starting a robot.
2. Resolve any `NOT COMPLETED` or `INCORRECT` outcome.
3. Open Monitor and select **Run** with the Virtual XRP selected.
4. Confirm a nearly straight path, increasing wheel distance, and a final
   motor command of zero.
5. Reset the Virtual XRP and repeat the run. Comparable programs should produce
   comparable trajectories from the same initial pose.

`main.py` runs the same exercise check before it constructs the robot. Your
`run_robot_program()` function owns the final `robot.stop()` call, including
when `robot.step()` raises an unexpected error.

`RobotState.pose` is the current odometry estimate. `RobotState.measurements`
contains the current sample time, wheel positions and speeds, wheel increments,
optional range, and USER-button state. Later projects use these fields to make
decisions; this exercise only retains and returns the latest state.

When the exercise passes and runs, create **Tutorial 4 · Behavior and
telemetry** from the project templates.
