# Challenge 3: Waypoint Courier

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

## Continue from the previous challenge

Open your Challenge 2 project and select **Create Challenge 3 · Waypoint
Courier project**. The IDE creates a separate project. Your new work is
`navigation_controller.py`; the new project begins with the supplied
NavigationController selected. The IDE carries forward your SensorModel,
WheelSpeedController, DifferentialDrive, and Odometry files and keeps whether
each student version is selected. Challenge 3 provides its own task, world,
main program, checks, and configuration. Your Challenge 2 folder remains
unchanged.

## What you implement

| File | Class | What it does |
| --- | --- | --- |
| `navigation_controller.py` | `NavigationController` | Store an ordered route, identify the current destination, and calculate the next `MotionCommand` from the latest `Pose`. |
| `sensor_model.py` | `SensorModel` | Carried forward from Challenge 2; converts raw encoder data into wheel measurements. |
| `wheel_speed_controller.py` | `WheelSpeedController` | Carried forward from Challenge 2; converts requested and measured wheel speeds into motor commands. |
| `differential_drive.py` | `DifferentialDrive` | Carried forward from Challenge 2; converts robot motion requests into wheel-speed requests. |
| `odometry.py` | `Odometry` | Carried forward from Challenge 2; estimates pose from measured wheel travel. |

### Implement `NavigationController`

The class retains the route, the index of the current destination, and any
state needed to distinguish turning toward the destination, driving toward it,
and aligning to a requested final heading.

`start(goals)` accepts a list or tuple of `NavigationGoal` values. Store a
private copy and select the first goal. An empty route is valid and is already
complete.

`update(pose)` returns one `MotionCommand`:

1. If there is no current destination, return `STOP_COMMAND`.
2. Use `distance_to_goal()` and `bearing_to_goal()` to calculate position and
   direction errors. Use `wrap_angle_rad()` for heading differences.
3. Turn in place until the goal direction is within
   `heading_tolerance_rad`.
4. Drive toward the goal. Use cruise speed when far away and approach speed
   within `slowdown_distance_mm`. You may apply a limited turn correction while
   driving.
5. If the heading error reaches `realign_heading_rad`, stop forward travel and
   turn again.
6. When position error is within `position_tolerance_mm`, either advance to the
   next goal or, when `heading_rad` is not `None`, turn in place until the final
   heading is within tolerance.

`current_goal()` returns the current `NavigationGoal` or `None`.
`is_complete()` returns `True` only after the last position and any required
final heading are complete. The API page gives the argument checks and return
types.

## Provided files and tools

| File or tool | What it provides |
| --- | --- |
| `main.py` | Starts navigation, passes each new odometry pose to `update()`, sends the returned command to `Robot`, and always stops the motors. |
| `challenge.py` | Loads the ordered `ROUTE` and `INITIAL_POSE` from `world.json`. |
| `robot_config.py` | Holds robot calibration and all navigation speeds, distances, and angular tolerances. |
| `course_setup.py` | Selects supplied or student classes and constructs the robot and navigator. |
| `component_checks.py` | Runs small input/output examples without starting either robot. Program output describes each example, then reports PASS, NOT IMPLEMENTED, or FAIL. |
| `Robot` | Executes each command through the measured wheel-control and odometry loop. |

`world.json` is the single source for waypoint order, coordinates, and optional
headings. Edit the world rather than copying waypoint coordinates into code.

## How the program runs

1. `main.py` gives the ordered `ROUTE` to your `NavigationController`.
2. For each sample, the controller compares the current odometry `Pose` with
   the active goal and requests forward speed and turn rate.
3. `Robot` passes that request through the selected drive and wheel-control
   components, applies the motor commands, and reads the encoders.
4. The selected `SensorModel` and `Odometry` update the pose. The next call to
   the navigation controller uses that pose, closing the navigation loop.
5. The controller advances to the next goal when the active goal is reached and
   reports completion after the final position and heading are reached.

Your new work is `NavigationController`. The sensing, wheel-control, drive, and
odometry classes are carried forward from Challenges 1 and 2.

## Complete the challenge

1. Create Challenge 3 from the completed Challenge 2 project as described above.
   Use the supplied NavigationController for the first run. Your
   carried-forward components keep their prior selections.
2. Run the supplied route on the virtual XRP. Identify each waypoint in the
   world view and observe the turn, drive, approach, and final heading
   adjustment.
3. Implement `NavigationController.start()`, `current_goal()`, and
   `is_complete()` first. Select **Test components** and verify that an empty
   route completes and a nonempty route returns its first goal.
4. Implement `update()` for one position-only goal, then add ordered goals and
   a required final heading. Select **Test components** after each part.
5. Select the student NavigationController in `course_setup.py` and run the
   virtual route. Confirm that goals are visited in order and the final command
   is zero.
6. Select the carried-forward student classes one at a time. Compare the
   odometry path with the simulator's ground-truth path to distinguish pose
   error from navigation logic.
7. After USB setup/repair has installed the course runtime, select the physical
   XRP over its configured Wi-Fi network. Run prepares this project in temporary
   controller RAM. In a clear marked area, record the goal sequence, estimated
   pose, requested motion, and final measured position and heading.
