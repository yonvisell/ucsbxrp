# Challenge 3: Waypoint Courier

## Objective

Make the XRP visit the waypoints in `world.json` in their listed order. At each
sample, your navigation class receives the current odometry `Pose` and returns
the requested forward speed and turn rate. Some waypoints require only a
position; the final waypoint may also require a heading.

`challenge.py` loads `INITIAL_POSE` and the ordered `ROUTE`. Each
`NavigationGoal` in `ROUTE` contains `x_mm`, `y_mm`, and either a heading in
radians or `None`.

`NAVIGATION_CONFIG` in `robot_config.py` names the values your class must use:

- `cruise_speed_mm_s` and `approach_speed_mm_s` are forward speeds;
- `slowdown_distance_mm` determines when approach speed begins;
- `turn_rate_rad_s` is the magnitude of a left or right turn request;
- `position_tolerance_mm` and `heading_tolerance_rad` define arrival; and
- `realign_heading_rad` determines when heading error during travel is large
  enough to stop and turn again.

Read these fields from `self.config`. Do not copy their current numerical values
into `navigation_controller.py`.

## Start this challenge

Open your Challenge 2 project and select **Start Challenge 3 · Waypoint
Courier**. The IDE creates a separate project and copies `sensor_model.py`,
`wheel_speed_controller.py`, `differential_drive.py`, and `odometry.py`. It
retains `USE_STUDENT_SENSOR_MODEL`, `USE_STUDENT_WHEEL_SPEED_CONTROLLER`,
`USE_STUDENT_DIFFERENTIAL_DRIVE`, and `USE_STUDENT_ODOMETRY` from Challenge 2.
Challenge 3 supplies a new `navigation_controller.py`; its
`USE_STUDENT_NAVIGATION_CONTROLLER` flag begins as `False`. The task, world,
main program, checks, and configuration come from Challenge 3, and the Challenge
2 folder remains unchanged.

## Student implementations

| File | Class | Responsibility |
| --- | --- | --- |
| `navigation_controller.py` | `NavigationController` | Store an ordered route, identify the active goal, and calculate the next `MotionCommand` from the latest `Pose`. |
| `sensor_model.py` | `SensorModel` | Use the checked wheel-measurement implementation from Challenge 1. |
| `wheel_speed_controller.py` | `WheelSpeedController` | Use the checked wheel-speed controller from Challenge 1. |
| `differential_drive.py` | `DifferentialDrive` | Use the checked wheel-speed conversion from Challenge 2. |
| `odometry.py` | `Odometry` | Use the checked pose estimator from Challenge 2. |

### Implement `NavigationController`

The class needs to retain the route, the index of the active goal, and enough
state to distinguish turning, driving, and final-heading alignment.

`start(goals)` accepts a list or tuple of `NavigationGoal` values. Store a
private copy and select the first goal. An empty route is valid and is already
complete.

`update(pose)` returns one `MotionCommand`:

1. If there is no active goal, return `STOP_COMMAND`.
2. Use `distance_to_goal()` and `bearing_to_goal()` to calculate position and
   direction errors. Use `wrap_angle_rad()` for heading differences.
3. Turn in place until the goal direction is within
   `heading_tolerance_rad`.
4. Drive toward the goal. Use cruise speed when far away and approach speed
   within `slowdown_distance_mm`. A bounded turn-rate correction may be applied
   while driving.
5. If the heading error reaches `realign_heading_rad`, stop forward travel and
   turn again.
6. When position error is within `position_tolerance_mm`, either advance to the
   next goal or, when `heading_rad` is not `None`, turn in place until the final
   heading is within tolerance.

`current_goal()` returns the active `NavigationGoal` or `None`.
`is_complete()` returns `True` only after the last position and any required
final heading are complete. The API page gives the argument checks and return
types.

## Supplied project files and services

| File or service | Use in this challenge |
| --- | --- |
| `main.py` | Starts navigation, passes each new odometry pose to `update()`, sends the returned command to `Robot`, and always stops the motors. |
| `challenge.py` | Loads the ordered `ROUTE` and `INITIAL_POSE` from `world.json`. |
| `robot_config.py` | Holds robot calibration and all navigation speeds, distances, and angular tolerances. |
| `course_setup.py` | Selects supplied or student classes and constructs the robot and navigator. |
| `component_checks.py` | Checks empty-route, forward-goal, and final-heading behavior without motor motion. |
| `Robot` | Executes each command through the measured wheel-control and odometry loop. |

`world.json` is the single source for waypoint order, coordinates, and optional
headings. Edit the world rather than copying waypoint coordinates into code.

## Program flow

```text
ordered ROUTE
     |
     v
NavigationController* <---------------- current Pose
     |                                      ^
     | requested forward speed + turn rate  |
     v                                      |
   Robot -> wheel control -> motors -> encoders -> Odometry*

NavigationController retains:
active goal + turn/drive/align state + completion

* student implementation
```

## Work sequence

1. Start Challenge 3 from the completed Challenge 2 project as described above.
   Use the supplied NavigationController for the first run; carried components
   retain their prior selections.
2. Run the supplied route on the virtual XRP. Identify each waypoint in the
   world view and observe the turn, drive, approach, and final-alignment phases.
3. Implement `NavigationController.start()`, `current_goal()`, and
   `is_complete()` first. Select **Test components** and verify that an empty
   route completes and a nonempty route exposes its first goal.
4. Implement `update()` for one position-only goal, then add ordered goals and
   a required final heading. Run the software checks after each part.
5. Set only `USE_STUDENT_NAVIGATION_CONTROLLER = True` and run the virtual
   route. Confirm that goals are visited in order and the final command is zero.
6. Select prior student classes one at a time. Compare the odometry path with
   the simulator's exact path to distinguish pose error from navigation logic.
7. Run the complete selected implementation on the physical XRP in a clear
   marked area. Record the goal sequence, estimated pose, requested motion, and
   final measured position and heading.
