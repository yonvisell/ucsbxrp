# Challenge 3: Waypoint Courier

## Objective

Visit the ordered waypoint markers in `world.json` and finish with the heading
requested by the final marker. At each sample, navigation receives the current
odometry `Pose` and returns one requested forward speed and turn rate.

`challenge.py` loads `INITIAL_POSE` and `ROUTE` from `world.json`. Each
`NavigationGoal` contains world `x_mm` and `y_mm`, plus an optional
`heading_rad`. Keep waypoint order, coordinates, and headings in the world
file rather than repeating them in Python.

## Continue from the previous challenge

Open Challenge 2 and select **Create Challenge 3 · Waypoint Courier project**.
The IDE creates a separate project and carries forward `sensor_model.py`,
`wheel_speed_controller.py`, `differential_drive.py`, and `odometry.py`,
and keeps whether each student version is selected. The new
`navigation_controller.py` begins with the supplied version selected. The
Challenge 2 folder remains unchanged.

## What you implement

Your new work is `NavigationController`; the other four components are carried
forward.

| Class | Responsibility, state, and use |
| --- | --- |
| `NavigationController` in `navigation_controller.py` | Retains a private ordered route, the active goal, and the progress needed to distinguish travel from final-heading alignment. `start(goals)` begins a route, `current_goal()` and `is_complete()` report progress, and `update(pose)` returns the next `MotionCommand`. |
| `SensorModel` in `sensor_model.py` | Carried forward; converts encoder readings into wheel measurements. |
| `WheelSpeedController` in `wheel_speed_controller.py` | Carried forward; produces bounded motor commands. |
| `DifferentialDrive` in `differential_drive.py` | Carried forward; converts body motion into wheel targets. |
| `Odometry` in `odometry.py` | Carried forward; supplies the pose used by navigation. |

An empty route is complete and returns a stopped command. For a nonempty route,
the active goal remains current until its position and any requested heading are
within tolerance; goals are completed in order. The controller turns toward a
goal when needed, requests forward motion when aligned, slows near the goal, and
returns to turning if heading error grows. It returns zero motion after the
final goal.

Use `cruise_speed_mm_s`, `approach_speed_mm_s`,
`slowdown_distance_mm`, `turn_rate_rad_s`, `position_tolerance_mm`,
`heading_tolerance_rad`, and `realign_heading_rad` from
`NAVIGATION_CONFIG`. The utilities `distance_to_goal()`,
`bearing_to_goal()`, and `wrap_angle_rad()` define the course coordinate and
angle conventions without fixing how you organize the class.

## Provided files and tools

| File or service | Role |
| --- | --- |
| `world.json` | Ordered waypoint positions, optional headings, and initial pose. |
| `challenge.py` | Loads `INITIAL_POSE` and `ROUTE` from the world. |
| `main.py` | Starts the route, passes each new pose to navigation, and stops the motors in `finally`. |
| `robot_config.py` | Navigation speeds, distances, angular tolerances, and robot calibration. |
| `course_setup.py` | Selects components and constructs the robot and navigator. |
| `component_checks.py` | States route inputs, expected motion/progress, and observed results without moving a robot. |
| `Robot` | Executes each requested motion through the measured wheel and odometry loop. |

## How the program runs

The controller compares the active goal with the latest estimated pose and
requests motion. `Robot` carries that request through the drive, wheel-control,
and sensing components. `Odometry` updates the pose from measured wheel travel,
and the next navigation update uses that pose. Navigation advances the route and
reports completion after the final position and optional heading are satisfied.

## Complete the challenge

1. Run the supplied navigator on the virtual XRP and identify the ordered goals,
   approach behavior, and final heading adjustment.
2. Implement route start and progress reporting, then the motion behavior.
   **Test components** checks empty, forward, side, ordered, near-goal, and
   final-heading cases.
3. Select the student navigator and confirm that the virtual XRP visits the
   world markers in order and ends with zero requested motion.
4. Repeat with carried-forward student components. Compare odometry with virtual
   ground truth to separate pose error from navigation behavior.
5. On the physical course, record goal progression, estimated pose, requested
   motion, and separately measured final position and heading.
