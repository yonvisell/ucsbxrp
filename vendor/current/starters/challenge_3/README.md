# Challenge 3: Waypoint Courier

## The challenge

Visit the waypoint markers in their assigned order and finish with the heading
requested by the final marker. Navigation receives the newest odometry `Pose`
at each sample and returns one requested forward speed and turn rate.

[`world.json`](world.json) defines the route. [`challenge.py`](challenge.py)
loads `INITIAL_POSE` and the ordered `ROUTE`. Use these names rather than
copying the current coordinates, order, or headings into another file.

## Reuse work in another challenge

Choose **Start another challenge…** in the IDE. Review the **Preserve**,
**Replace**, and **Add** lists before creating the separate project; they show
how existing component, calibration, helper, and task files will be handled.
The current project remains unchanged.

## What you implement

Implement `NavigationController` in
[`navigation_controller.py`](navigation_controller.py):

- `start(goals)` stores a new ordered route; an empty route is complete.
- `current_goal()` returns the active goal or `None` after completion.
- `is_complete()` reports whether all required positions and headings are
  complete.
- `update(pose)` returns the next `MotionCommand` from the latest odometry pose.

Visit goals in order. Turn toward a destination before driving, use the
configured approach speed near it, return to turning when the heading error is
too large, and align to a requested final heading. Return `STOP_COMMAND` after
the route is complete. Use `NAVIGATION_CONFIG` and the supplied
`distance_to_goal()`, `bearing_to_goal()`, and `wrap_angle_rad()` functions.

The configuration separates the decisions: `position_tolerance_mm` accepts a
goal position, `heading_tolerance_rad` accepts the initial bearing or requested
final heading, `realign_heading_rad` returns a drifting drive to the turn
state, and `slowdown_distance_mm` selects approach rather than cruise speed.
Keep an active-goal index and a small explicit mode such as `turn`, `drive`, or
`align`. Each mode describes motion toward the current goal.

## Project modules

| File | Role |
| --- | --- |
| [`sensor_model.py`](sensor_model.py) | Converts encoder samples to wheel travel and wheel-speed estimates based on recent encoder samples. |
| [`wheel_speed_controller.py`](wheel_speed_controller.py) | Produces motor commands within the configured limits from wheel-speed error. |
| [`differential_drive.py`](differential_drive.py) | Produces target wheel speeds from requested robot motion. |
| [`odometry.py`](odometry.py) | Updates the estimated `Pose` from measured wheel travel. |
| [`navigation_controller.py`](navigation_controller.py) | Selects the next `MotionCommand` from the active route goal and pose. |
| [`robot_config.py`](robot_config.py) | Stores robot calibration and `NAVIGATION_CONFIG`. |
| [`course_setup.py`](course_setup.py) | Selects the supplied class or the class defined in each named component file. |

**Test components always loads the classes from the five component project
files**, regardless of which classes are selected for a complete robot run.

## Provided files and tools

- [`main.py`](main.py) starts the route, passes each new pose to navigation,
  records each assigned waypoint observed in order, and stops the robot on
  completion or error.
- [`component_checks.py`](component_checks.py) calls the required
  `NavigationController` methods and the methods of the other selected classes
  without starting a robot.
- `Robot` executes each `MotionCommand` through the selected wheel, sensing,
  and odometry components.

## How the program runs

```text
ROUTE + estimated Pose -> NavigationController -> MotionCommand
MotionCommand          -> Robot                -> new estimated Pose
```

The cycle repeats until navigation completes the final position and any
requested final heading.

## Check the component

Select **Test components**. Read `USE`, `INPUT`, and `EXPECT` before each
result. The navigation checks cover an empty route, goals ahead and to either
side, ordered goals, approach speed, realignment, angle wrap, and a required
final heading.

- `PASS` means the implemented behavior matched the examples.
- `NOT IMPLEMENTED` means the named method still needs to be written.
- `FAIL` means the method ran but returned an incorrect command or route state.

Fix every unfinished or failing result, repeat **Test components**, and then
set `USE_STUDENT_NAVIGATION_CONTROLLER` to `True` in `course_setup.py`.

## Complete the challenge

1. Run the supplied navigator on the virtual XRP. Identify each waypoint
   approach, the reduced approach speed, and the final heading adjustment.
2. Select the `NavigationController` defined in
   `navigation_controller.py`. Verify waypoint order and zero requested motion
   after completion. The final measured pose must satisfy the assigned final
   position and heading.
3. Select the classes from all five component project files. Compare odometry
   with virtual ground truth to separate pose-estimation error from navigation
   behavior.
4. Record estimated pose, requested forward speed, turn rate, and the driven
   path. Use the assigned values in `ROUTE` for your analysis.
5. On the physical course, record the same program evidence and measure the
   final position and heading independently.
