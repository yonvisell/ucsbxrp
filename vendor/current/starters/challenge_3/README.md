# Challenge 3: Waypoint Courier

## The challenge

Visit the ordered waypoint markers in `world.json` and finish with the heading
requested by the final marker. At each sample, navigation receives the current
odometry `Pose` and returns one requested forward speed and turn rate.

`challenge.py` loads `INITIAL_POSE` and `ROUTE` from `world.json`. Each
`NavigationGoal` provides world `x_mm` and `y_mm` coordinates and may provide a
final `heading_rad`. Keep waypoint order, coordinates, and headings in the
world file rather than repeating their current values in Python.

## Continue from Challenge 2

Open the completed Challenge 2 project and select **Continue to Challenge 3 ·
Waypoint Courier…**. The new project carries forward `sensor_model.py`,
`wheel_speed_controller.py`, `differential_drive.py`, and `odometry.py`, along
with their component selections. `navigation_controller.py` begins with its
supplied implementation selected. The Challenge 2 project remains unchanged.

Project storage for new projects is configured in IDE **Settings**. Use **Open
project…** to reopen an existing project folder or **New project…** to create an
unrelated project from a template.

## What you implement

Implement `NavigationController` in `navigation_controller.py`. It retains the
ordered route, the active goal, and the progress needed to distinguish travel
from final-heading alignment:

- `start(goals)` starts a new route. An empty route is immediately complete.
- `current_goal()` returns the active goal or `None` after completion.
- `is_complete()` reports whether all positions and requested headings have
  been reached.
- `update(pose)` returns the next `MotionCommand` from the newest odometry
  estimate.

The controller completes goals in order. It turns toward a destination before
driving, reduces speed near the destination, returns to turning if its heading
error becomes too large, and aligns to a requested final heading. It returns a
zero-motion command after the last goal.

Use the named values in `NAVIGATION_CONFIG`. The supplied
`distance_to_goal()`, `bearing_to_goal()`, and `wrap_angle_rad()` functions
apply the course coordinate and angle conventions. The student-owned component
files in this project are `sensor_model.py`, `wheel_speed_controller.py`,
`differential_drive.py`, `odometry.py`, and `navigation_controller.py`. The
measured values in `robot_config.py` also remain your pair's work.

## Provided files and tools

- `main.py` starts the route, passes each new pose to navigation, and stops the
  motors in a `finally` block.
- `challenge.py` and `world.json` define the initial pose and ordered route.
- `course_setup.py` selects the supplied or student implementation of each
  component. Change only the named `USE_STUDENT_*` flags after the matching
  checks pass.
- `component_checks.py` runs labeled route and motion examples without moving
  either robot.
- `Robot` executes each requested `MotionCommand` through the carried-forward
  wheel, sensing, and odometry components.

## How the program runs

1. `main.py` starts `Robot` at `INITIAL_POSE` and starts navigation with
   `ROUTE`.
2. `NavigationController` compares the active goal with the latest estimated
   pose and requests the next motion.
3. `Robot` carries that request through differential drive, wheel control,
   motor output, sensing, and odometry.
4. The next navigation update uses the new odometry pose.
5. Navigation advances to the next goal only after the current position and
   any requested heading are within tolerance.
6. The program stops after the final goal is complete.

## Check the component

Select **Test components**. The checks use your component classes without
starting the virtual or physical robot. Read the labeled input, expected
observation, and observed result for every example.

- `PASS` means the example matched.
- `NOT IMPLEMENTED` identifies an unfinished method.
- `FAIL` identifies a differing value, command, or progress state.

The navigation examples cover an empty route, a goal ahead, a goal to the
side, ordered goals, approach behavior, realignment, and final-heading
completion. Fix every unfinished or failing example, repeat **Test
components**, and then set `USE_STUDENT_NAVIGATION_CONTROLLER` to `True` in
`course_setup.py`.

## Complete the challenge

1. Run the supplied navigator on the virtual XRP. In the world view and
   telemetry, identify each waypoint approach, the reduced approach speed, and
   the final heading adjustment.
2. Select your navigator and confirm that the robot visits the markers in file
   order and returns zero requested motion after completion.
3. Repeat with all carried-forward student components. Compare odometry with
   virtual ground truth to distinguish pose-estimation error from navigation
   behavior.
4. Record estimated pose, requested forward speed and turn rate, and the driven
   path during the run. Use the known waypoint positions in `world.json` when
   calculating distance or heading error for your analysis.
5. On the physical course, record the same program evidence and measure the
   final position and heading independently.

After completing this challenge, select **Continue to Challenge 4 · Mapped
Route…**. The new project carries forward the five component files and their
selections; the Challenge 3 project remains unchanged.
