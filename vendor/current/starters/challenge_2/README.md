# Challenge 2: Turn and Return

## Objective

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

## Student implementations

| File | Class | Responsibility |
| --- | --- | --- |
| `differential_drive.py` | `DifferentialDrive` | Convert requested forward speed and counterclockwise turn rate into requested left and right wheel speeds. |
| `odometry.py` | `Odometry` | Update the estimated world position and heading from each measured pair of wheel increments. |
| `sensor_model.py` | `SensorModel` | Use the wheel-measurement work completed in Challenge 1. |
| `wheel_speed_controller.py` | `WheelSpeedController` | Use the wheel-speed control work completed in Challenge 1. |

### Implement `DifferentialDrive`

`wheel_speeds(command)` receives a `MotionCommand`. Let
`v = command.forward_speed_mm_s`, `omega = command.turn_rate_rad_s`, and
`b = self.config.track_width_mm`. Return:

```text
left wheel speed  = v - omega * b / 2
right wheel speed = v + omega * b / 2
```

The returned values are in mm/s. With zero turn rate the wheel speeds are equal.
With zero forward speed and positive turn rate, the left wheel moves backward
and the right wheel moves forward, producing a counterclockwise in-place turn.

### Implement `Odometry`

`reset(initial_pose)` stores and returns the supplied `Pose`. The read-only
`pose` property returns the most recent estimate.

`update(left_increment_mm, right_increment_mm)` performs one planar
differential-drive update:

1. Calculate center travel as the mean of the two wheel increments.
2. Calculate heading change as
   `(right_increment_mm - left_increment_mm) / track_width_mm`.
3. For a negligible heading change, advance center travel along the current
   heading.
4. For a curved increment, integrate the circular arc rather than treating it
   as a straight segment.
5. Store and return a new `Pose`. `Pose` wraps the resulting heading to the
   course interval.

The inputs are measured travel in millimeters, not motor commands or requested
wheel speeds. The API page specifies behavior before `reset()` and for invalid
arguments.

## Supplied project files and services

| File or service | Use in this challenge |
| --- | --- |
| `main.py` | Runs a measured straight segment, turns from the current odometry heading, then runs the return segment. |
| `challenge.py` | Derives the named distances and heading from `world.json`. |
| `robot_config.py` | Holds robot calibration, effective track width, straight speeds, and arrival tolerances. |
| `course_setup.py` | Selects each of the four student classes independently. |
| `component_checks.py` | Checks straight, curved, and in-place kinematics and odometry without motor motion. |
| `StraightLineController` | Supplies the outbound and return forward commands. |
| `Robot` | Calls the selected drive, wheel-control, measurement, and odometry classes once per sample. |

`world.json` defines the start/finish area and the turn waypoint displayed by
the virtual XRP and Monitor.

## Program flow

```text
main.py: travel out -> turn to heading -> travel back
                         |
                         v
MotionCommand -> DifferentialDrive* -> requested wheel speeds
                                           |
                                           v
                                  WheelSpeedController*
                                           |
                                           v
                                         motors
                                           |
                                           v
encoder counts -> SensorModel* -> wheel increments -> Odometry* -> Pose

* student implementation
```

## Work sequence

1. Bring your checked `SensorModel` and `WheelSpeedController` work into this
   project. Leave all four `USE_STUDENT_*` flags `False` for the first run.
2. Run the supplied virtual project. Observe the outbound segment, turn, return
   segment, and continuously updated pose.
3. Implement `DifferentialDrive`. Select **Test components** and check equal
   wheel speeds for straight motion, opposite wheel speeds for an in-place
   turn, and unequal wheel speeds for a curve.
4. Select only the student DifferentialDrive in `course_setup.py` and repeat
   the complete virtual run.
5. Implement `Odometry`. Check reset, straight travel, an in-place turn, and a
   curved increment before selecting it.
6. Run all selected student classes together. In the Monitor, compare odometry
   with the simulator's exact pose and inspect where their difference begins.
7. On the physical XRP, use a clear marked area. Record the estimated final
   pose, wheel increments, and requested turn rate; separately measure the
   actual final position and heading.

The simulator's exact pose is provided only for comparison. Navigation and the
physical robot use the `Pose` returned by your `Odometry`.
