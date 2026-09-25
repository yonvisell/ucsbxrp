# Challenge 3 · Waypoint Courier

## Task

Drive through three destinations in order and finish facing the indicated
direction. Estimate position and heading from wheel travel, then use that
estimate to navigate. Compare where the robot believes it stopped with where
it actually stopped.

![Starting pose, three destinations in visit order, and final heading.](course-assets/waypoint-courier.svg)

*Figure. The blue S dot and arrow indicate the starting axle pose and +x
heading. Numbered orange dots show the three destinations in visit order; the
left-pointing arrow at goal 3 shows its required final heading. No measured or
planned trajectory is drawn. Coordinates come from `world.json` in millimeters.*

## 1. Odometry

Odometry estimates motion from wheel travel. Derive the change in robot
position and heading from the distance traveled by each wheel. Check the
calculation for straight travel, rotation in place, and a curved path.
Then implement the repeated updates that accumulate these changes from a
known starting position and heading.

Use the midpoint between the driven wheels as the position reference. Define
positive heading counterclockwise from the world +x direction. Each update
must use the signed wheel travel since the previous update.

## 2. Waypoint navigation

Develop a controller that uses the estimated position and heading to reach
each destination. Decide when to turn, how fast to move, and when to advance
to the next destination. At the last destination, reach the requested heading
before stopping. Test the controller's decisions when far from a destination,
when close to it, and when at the final position but facing the wrong direction.

Run the route on the Virtual XRP. Compare the trajectory and estimated heading
with the marked destinations. If the robot overshoots or repeatedly changes
direction near a destination, revise the approach and repeat the route.

## 3. Position and heading measurements

Run the physical route twice from the same starting pose. Observe the order
of visits, any missed destination or contact, and the final orientation.
Measure final position and heading on the floor and compare them with the
values reported in Program output.

Compare the same point on the robot in both measurements. If you measure the
front center, measure its distance ahead of the drive-axle midpoint and use
the measured final heading to convert to axle position. Record how precisely
you can read the floor marks. Use observations along the route to identify
where an error first becomes apparent.

## Your report

Submit one report per pair, with both names, robot identification, and trial
settings. Distinguish virtual and physical results.

1. **Odometry:** give your update equations and calculations for straight,
   rotating, and curved motion. Explain how you use the starting pose and
   wheel increments.
2. **Navigation:** explain how your controller reaches a position, advances
   to the next destination, and achieves the final heading. Show the route
   and estimated heading for a virtual run. Where did the approach need revision?
3. **Physical results:** tabulate the requested, estimated, and measured final
   position and heading for both runs. Include visit order and any missed
   destination. Did the estimated final position agree with the destination while the floor
   measurement did not, or did both miss the destination? What does that
   distinction suggest about odometry and navigation error?

## Project files

<strong class="student-file">Blue *</strong>: code to implement.
<strong class="config-file">Amber †</strong>: settings to adjust.
<span class="supplied-file">Gray S</span>: code provided or completed in an earlier challenge.
`main.py` is supplied and normally unchanged; a controlled experiment may still edit it.

After checking each class you implement, set its matching `USE_STUDENT_*` flag
to `True` in `course_setup.py` before **Run**. `False` runs the
supplied implementation; enable and check new classes one at a time.

<div class="project-file-table">

| File | What it does |
| --- | --- |
| <span class="supplied-file"><code>main.py</code> S</span> | Runs navigation and reports the independently counted arrivals and final pose. |
| <span class="supplied-file"><code>route_progress.py</code> S</span> | Checks estimated-pose arrival at the ordered goals using the current navigation tolerances. |
| <strong class="student-file"><code>odometry.py</code> *</strong> | Accumulates wheel increments to estimate position and heading. |
| <strong class="student-file"><code>navigation_controller.py</code> *</strong> | Uses estimated pose to reach an ordered set of destinations. |
| <span class="supplied-file"><code>sensor_model.py</code> S</span> | Converts encoder readings into wheel travel and speed; also contains range estimation. |
| <span class="supplied-file"><code>wheel_speed_controller.py</code> S</span> | Calculates left and right motor commands from wheel-speed targets and measurements. |
| <span class="supplied-file"><code>differential_drive.py</code> S</span> | Converts forward speed and turn rate into left and right wheel-speed targets. |
| <strong class="config-file"><code>robot_config.py</code> †</strong> | Holds robot calibration and controller settings. |
| <strong class="config-file"><code>challenge.py</code> †</strong> | Loads the course geometry and holds named trial settings. |
| <strong class="config-file"><code>course_setup.py</code> †</strong> | Creates the robot using the selected component implementations. |
| <strong class="config-file"><code>live_variables.py</code> †</strong> | Declares Monitor controls and their starting values; publishes goal progress and estimated heading. |
| <span class="supplied-file"><code>component_checks.py</code> S</span> | Runs input/output examples for the component methods without driving. |
| <strong class="config-file"><code>world.json</code> †</strong> | Defines arena geometry, start pose, tracks, obstacles, and named markers shared by the robot and Monitor. |

</div>

## Parameters and functions

Reuse the completed components from the preceding challenge. The method templates and API specify inputs and outputs. The Guide explains
how to select your implementations and run a different project file.

### Parameters

| Setting | Source and units | Effect |
| --- | --- | --- |
| `track_width_mm` | `robot_config.py`; mm | Converts unequal wheel travel to heading change. |
| Cruise speed | Live control declared in `live_variables.py`; mm/s | Normal forward request, from 80 to 220 mm/s. |
| `approach_speed_mm_s` | `robot_config.py`; mm/s | Near-goal forward request, 80% of the selected cruise speed. |
| `slowdown_distance_mm` | `robot_config.py`; mm | Distance at which the lower approach speed begins; initially 120 mm. |
| Turn rate | Live control declared in `live_variables.py`; rad/s | Requested rotation rate, from 0.4 to 1.6 rad/s. |
| `position_tolerance_mm`, `heading_tolerance_rad` | `robot_config.py`; mm and rad | Estimated errors accepted at each goal. |
| `realign_heading_rad` | `robot_config.py`; rad | Heading error above which forward travel pauses for turning. |

The two live controls take effect after the next robot sample. Change one at a
time and record the values used. Other settings remain in `robot_config.py`.

### Functions and methods

| Function or method | Input | Return or effect |
| --- | --- | --- |
| `Odometry.reset(initial_pose)` | Known `Pose` in mm and rad | Stores and returns the starting `Pose`. |
| `Odometry.update(left_increment_mm, right_increment_mm)` | Measured wheel increments in mm | Updated estimated `Pose`. |
| `Odometry.pose` | Property read after reset | Latest estimated `Pose`. |
| `NavigationController.start(goals)` | Ordered `NavigationGoal` values | Resets navigation to the first goal. |
| `NavigationController.set_config(config)` | Complete `NavigationConfig` | Inherited method replaces motion settings without restarting the active goal. |
| `NavigationController.update(pose)` | Current estimated `Pose` | Next `MotionCommand` in mm/s and rad/s. |
| `NavigationController.current_goal()` | None | Active goal, or `None` after completion. |
| `NavigationController.is_complete()` | None | Boolean after all positions and required headings are reached. |
| `count_reached_goals(pose, route, reached_count, config)` | Estimated pose, ordered goals, previous count, current navigation settings | Updated count of goals observed in order. |
