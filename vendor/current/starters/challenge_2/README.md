# Challenge 2: Turn and Return

## Objective

Travel to the turn marker, rotate to the heading assigned to that marker,
return to the marked start region, and recover the initial heading. The robot
must relate body motion to two wheel speeds and relate measured wheel travel to
a world pose.

`world.json` owns the start pose and turn marker. `challenge.py` derives
`INITIAL_POSE`, `OUTBOUND_DISTANCE_MM`, `TURN_HEADING_RAD`,
`RETURN_DISTANCE_MM`, and `FINAL_HEADING_RAD` from that world. Do not repeat the
marker coordinates, distance, or heading elsewhere.

## Continue from the previous challenge

Open Challenge 1 and select **Create Challenge 2 · Turn and Return project**.
The IDE creates a separate project, carries forward `sensor_model.py` and
`wheel_speed_controller.py`, and keeps whether each student version is
selected. The new `differential_drive.py` and `odometry.py` begin with their
supplied versions selected. The Challenge 1 folder remains unchanged.

## What you implement

Your new work is `DifferentialDrive` and `Odometry`. The sensing and
wheel-speed controller are carried forward.

| Class | Responsibility, state, and use |
| --- | --- |
| `DifferentialDrive` in `differential_drive.py` | Converts a `MotionCommand`—forward speed and counterclockwise turn rate—into left and right `WheelSpeeds`. It needs no run history. `Robot` uses its result as the wheel-controller target. |
| `Odometry` in `odometry.py` | Retains the latest `Pose`. `reset(initial_pose)` establishes the world pose; each `update(left_increment_mm, right_increment_mm)` advances it from measured wheel travel and returns the new estimate. Navigation uses this pose in later challenges. |
| `SensorModel` in `sensor_model.py` | Carried forward from Challenge 1; supplies signed wheel increments and speeds. |
| `WheelSpeedController` in `wheel_speed_controller.py` | Carried forward from Challenge 1; turns wheel targets and measurements into motor commands. |

`ROBOT_CONFIG.track_width_mm` is the effective distance between the wheel paths
used by both classes. Straight body motion produces equal wheel targets; a
counterclockwise in-place turn produces a backward left target and forward
right target. Equal measured wheel increments translate the pose without
changing heading; unequal increments change heading and follow the corresponding
planar arc. Inputs to odometry are measured increments, not requested speeds or
motor commands.

The task also uses `cruise_speed_mm_s`, `approach_speed_mm_s`,
`slowdown_distance_mm`, `position_tolerance_mm`, `turn_rate_rad_s`, and
`heading_tolerance_rad` from `NAVIGATION_CONFIG`. Use the named configuration
fields rather than their current numeric values.

## Provided files and tools

| File or service | Role |
| --- | --- |
| `world.json` | Start/finish region and turn marker. |
| `challenge.py` | Loads the task distances and headings from the world. |
| `main.py` | Runs outward travel, the return turn, return travel, and final heading recovery. |
| `robot_config.py` | Effective track width, robot calibration, motion speeds, and tolerances. |
| `course_setup.py` | Selects all four components independently. |
| `component_checks.py` | Compares labeled inputs, expected observations, and results without moving a robot. |
| `StraightLineController` and `Robot` | Supply measured straight travel and the repeated control/measurement cycle. |

## How the program runs

`main.py` alternates measured straight travel with heading changes. On every
sample, `DifferentialDrive` provides wheel targets, the carried-forward wheel
controller drives the motors, `SensorModel` reports wheel increments, and
`Odometry` updates the retained pose. The current pose determines when each
phase is complete.

## Complete the challenge

1. Run the supplied new components on the virtual XRP and observe all four
   phases and the changing pose.
2. Implement and check `DifferentialDrive`. Verify straight, in-place-turn, and
   moving-turn relationships before selecting it.
3. Implement and check `Odometry`. Verify reset, straight travel, in-place
   rotation, and curved travel before selecting it.
4. Run all selected student classes together. Compare estimated pose with the
   simulator's ground-truth pose; they are distinct measurements.
5. On the physical course, record wheel increments, estimated final pose, and
   requested turn rate, then separately measure final position and heading.

The virtual ground-truth pose is for comparison only. Navigation and the
physical XRP use the `Pose` returned by the selected `Odometry`.
