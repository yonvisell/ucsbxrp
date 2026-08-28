# Challenge 2: Turn and Return

## The challenge

Travel to the turn marker, rotate to the heading assigned to that marker,
return to the marked start region, and recover the initial heading. The robot
must relate body motion to the motion of its two wheels and estimate its world
pose from measured wheel travel.

[`world.json`](world.json) defines the initial pose and turn marker.
[`challenge.py`](challenge.py) derives `INITIAL_POSE`,
`OUTBOUND_DISTANCE_MM`, `TURN_HEADING_RAD`, `RETURN_DISTANCE_MM`, and
`FINAL_HEADING_RAD` from that world. Use these named values rather than copying
the current distances or headings into another file.

## Continue from Challenge 1

Open the completed Challenge 1 project and select **Continue to Challenge 2 ·
Turn and Return…**. The new project carries forward
[`sensor_model.py`](sensor_model.py),
[`wheel_speed_controller.py`](wheel_speed_controller.py), and their component
selections. The new [`differential_drive.py`](differential_drive.py) and
[`odometry.py`](odometry.py) begin with their supplied implementations
selected. The Challenge 1 project remains unchanged.

## What you implement

Implement these two new classes:

- `DifferentialDrive` in `differential_drive.py` converts a requested forward
  speed and counterclockwise turn rate into left and right `WheelSpeeds`. It
  does not need to retain history between samples.
- `Odometry` in `odometry.py` retains the current `Pose`.
  `reset(initial_pose)` establishes the starting world pose, and
  `update(left_increment_mm, right_increment_mm)` advances that pose using
  measured wheel travel.

The student-owned component files in this project are `sensor_model.py`,
`wheel_speed_controller.py`, `differential_drive.py`, and `odometry.py`. The
first two are carried forward from Challenge 1; continue to correct them if new
evidence reveals a problem. Your pair also maintains the measured and tuned
values in [`robot_config.py`](robot_config.py).

Both new classes use `ROBOT_CONFIG.track_width_mm`, the effective distance
between the wheel paths. Equal wheel speeds produce straight motion. For a
counterclockwise in-place turn, the left wheel moves backward and the right
wheel moves forward. Odometry must use measured wheel increments, not requested
speeds or motor commands. Equal increments translate the pose without changing
heading; unequal increments produce the corresponding straight, curved, or
in-place motion.

## Provided files and tools

- [`main.py`](main.py) runs outward travel, the turn, return travel, and final
  heading recovery.
- `challenge.py` and `world.json` define the assigned distances and headings.
- `robot_config.py` contains the effective track width, robot calibration,
  motion settings, and tolerances maintained for this robot.
- [`course_setup.py`](course_setup.py) selects all four components
  independently. Change only the named `USE_STUDENT_*` flags as components pass
  their checks.
- [`component_checks.py`](component_checks.py) runs labeled examples without
  starting either robot.
- `StraightLineController` supplies measured straight travel; `Robot` supplies
  the repeated control and measurement cycle.

**Test components always checks the classes in the student files**, even while
one or more supplied implementations are selected for a complete robot run.

## How the program runs

1. `main.py` starts the robot at `INITIAL_POSE`.
2. `StraightLineController` requests the outbound travel distance.
3. `DifferentialDrive`, the wheel controller, `XRPBot`, and `SensorModel`
   execute each measured sample.
4. `Odometry` updates the retained pose from the newest wheel increments.
5. `main.py` turns toward `TURN_HEADING_RAD`, drives the return distance, and
   turns toward `FINAL_HEADING_RAD` using the current pose.
6. The `finally` block stops both motors on normal completion or error.

## Check each component

Select **Test components**. These software examples use your component files
without moving the virtual or physical robot. Each example prints its input,
the expected observation, and the observed result.

- `PASS` means the example matched.
- `NOT IMPLEMENTED` identifies an unfinished method.
- `FAIL` identifies a differing value or behavior.

For `DifferentialDrive`, inspect straight, moving-turn, and in-place-turn
relationships. For `Odometry`, inspect reset, straight travel, curved travel,
and in-place rotation. Fix every unfinished or failing example, repeat **Test
components**, and then set the matching `USE_STUDENT_*` flag to `True`.

## Complete the challenge

1. Run the supplied new components on the virtual XRP. Identify the four motion
   phases and the estimated pose throughout the run.
2. Select your `DifferentialDrive` and compare each requested body motion with
   its left and right wheel-speed targets.
3. Select your `Odometry` and compare its pose with the virtual ground-truth
   pose. These are separate values: navigation uses the odometry result.
4. Run all selected student components together and inspect final position,
   heading, wheel increments, and requested turn rate.
5. On the physical course, record the estimated final pose and wheel travel,
   then measure final position and heading independently.

After completing this challenge, select **Continue to Challenge 3 · Waypoint
Courier…**. The new project carries forward the four component files and their
selections; the Challenge 2 project remains unchanged.
