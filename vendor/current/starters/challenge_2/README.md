# Challenge 2: Turn and Return

Make the XRP travel to the turn point, rotate to the requested heading, and
travel the same distance again. The new engineering work is to convert the
robot's requested forward speed and turn rate into separate wheel speeds, then
use measured wheel travel to estimate position and heading.

`challenge.py` provides `INITIAL_POSE`, `OUTBOUND_DISTANCE_MM`,
`TURN_HEADING_RAD`, and `RETURN_DISTANCE_MM`. These values come from the start
and turn markers in `world.json`. Distances are in millimeters and heading is
in radians.

`robot_config.py` contains two groups of settings:

- `ROBOT_CONFIG.track_width_mm` is the effective distance between the left and
  right wheel paths used by both turning calculations and odometry;
- `NAVIGATION_CONFIG.cruise_speed_mm_s`,
  `NAVIGATION_CONFIG.approach_speed_mm_s`, and
  `NAVIGATION_CONFIG.slowdown_distance_mm` set the two straight-run speeds and
  where the slower speed begins;
- `NAVIGATION_CONFIG.position_tolerance_mm` sets the remaining distance
  accepted as the end of a straight segment; and
- `NAVIGATION_CONFIG.turn_rate_rad_s` and
  `NAVIGATION_CONFIG.heading_tolerance_rad` set the in-place turn speed and the
  accepted final heading error.

Use these named fields rather than repeating their current numerical values in
your classes.

## Continue from the previous challenge

Open your Challenge 1 project and select **Create Challenge 2 · Turn and
Return project**. The IDE creates a separate project. Your new work is
`differential_drive.py` and `odometry.py`; the new project begins with the
supplied versions selected. The IDE carries forward your Challenge 1
`sensor_model.py` and `wheel_speed_controller.py` files and keeps whether each
student version is selected. Challenge 2 provides its own task, world, main
program, checks, and configuration. Your Challenge 1 folder remains unchanged.

## What you implement

| File | Class | What it does |
| --- | --- | --- |
| `differential_drive.py` | `DifferentialDrive` | Convert requested forward speed and counterclockwise turn rate into requested left and right wheel speeds. |
| `odometry.py` | `Odometry` | Update the estimated world position and heading from each measured pair of wheel increments. |
| `sensor_model.py` | `SensorModel` | Carried forward from Challenge 1; converts raw encoder data into wheel measurements. |
| `wheel_speed_controller.py` | `WheelSpeedController` | Carried forward from Challenge 1; converts requested and measured wheel speeds into motor commands. |

### Implement `DifferentialDrive`

`wheel_speeds(command)` receives a `MotionCommand`. Let
`v = command.forward_speed_mm_s`, `omega = command.turn_rate_rad_s`, and
`b = self.config.track_width_mm`. Return:

```text
left wheel speed  = v - omega * b / 2
right wheel speed = v + omega * b / 2
```

With zero turn rate the wheel speeds are equal. With zero forward speed and
positive turn rate, the left wheel moves backward and the right wheel moves
forward, producing a counterclockwise in-place turn.

### Implement `Odometry`

`reset(initial_pose)` stores and returns the supplied `Pose`. The read-only
`pose` property returns the most recent estimate.

`update(left_increment_mm, right_increment_mm)` performs one pose update:

1. Calculate center travel as the mean of the two wheel increments.
2. Calculate heading change as
   `(right_increment_mm - left_increment_mm) / track_width_mm`.
3. When the heading change is effectively zero, advance the center travel along
   the current heading.
4. Otherwise calculate the motion along its circular arc rather than treating
   it as a straight segment.
5. Store and return a new `Pose`. `Pose` normalizes the heading so equivalent
   angles have one representation.

The inputs are measured wheel travel, not motor commands or requested wheel
speeds. The API page specifies behavior before `reset()` and for invalid
arguments.

## Provided files and tools

| File or tool | What it provides |
| --- | --- |
| `main.py` | Runs a measured straight segment, turns from the current odometry heading, then runs the return segment. |
| `challenge.py` | Derives the named distances and heading from `world.json`. |
| `robot_config.py` | Holds robot calibration, effective track width, straight speeds, and arrival tolerances. |
| `course_setup.py` | Selects each of the four student classes independently. |
| `component_checks.py` | Runs small input/output examples without starting either robot. Program output describes each example, then reports PASS, NOT IMPLEMENTED, or FAIL. |
| `StraightLineController` | Supplies the outbound and return forward commands. |
| `Robot` | Calls the selected drive, wheel-control, measurement, and odometry classes once per sample. |

`world.json` defines the start/finish area and the turn waypoint displayed by
the virtual XRP and Monitor.

## How the program runs

1. `main.py` advances through three phases: travel outward, turn to the return
   heading, and travel back.
2. In each sample, it sends the current `MotionCommand` to your
   `DifferentialDrive`, which returns target wheel speeds.
3. The selected `WheelSpeedController` uses the target and measured wheel
   speeds to command the motors.
4. The target reads the resulting encoder counts. The selected `SensorModel`
   converts them into exact wheel-travel increments.
5. Your `Odometry` applies those increments to its retained `Pose`.
   `main.py` uses the updated pose to decide when to change phase or finish.

Your new work is `DifferentialDrive` and `Odometry`. `SensorModel` and
`WheelSpeedController` are carried forward from Challenge 1.

## Complete the challenge

1. Create Challenge 2 from the completed Challenge 1 project as described above.
   For the first run, use the supplied DifferentialDrive and Odometry. Your
   carried-forward components keep their Challenge 1 selections.
2. Run the supplied virtual project. Observe the outbound segment, turn, return
   segment, and continuously updated pose.
3. Implement `DifferentialDrive`. Select **Test components** and read each
   example before its result. Check equal wheel speeds for straight motion,
   opposite wheel speeds for an in-place turn, and unequal wheel speeds for a
   curve.
4. Select the student DifferentialDrive in `course_setup.py` and repeat the
   complete virtual run with the supplied Odometry.
5. Implement `Odometry`. Check reset, straight travel, an in-place turn, and a
   curved increment before selecting it.
6. Run all selected student classes together. In the Monitor, compare odometry
   with the simulator's exact pose and inspect where their difference begins.
7. On the physical XRP, use a clear marked area. Record the estimated final
   pose, wheel increments, and requested turn rate; separately measure the
   actual final position and heading.

The simulator's exact pose is provided only for comparison. Navigation and the
physical robot use the `Pose` returned by your `Odometry`.
