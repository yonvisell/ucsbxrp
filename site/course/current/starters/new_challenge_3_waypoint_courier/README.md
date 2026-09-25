# Challenge 3 · Waypoint Courier

## Task

Visit the three destinations in order and finish facing the indicated direction. Use measured wheel travel to estimate the robot's axle-midpoint position and heading, then navigate from that estimate. Compare the reported final pose with an independent floor measurement.

![Starting pose, three destinations in visit order, and final heading.](course-assets/waypoint-courier.svg)

*Figure. The blue S dot and arrow indicate the starting axle pose and +x heading. Numbered orange dots show the three destinations in visit order; the left-pointing arrow at goal 3 shows its required final heading. No measured or planned trajectory is drawn. Coordinates come from `world.json` in millimeters.*

## 1. Implement and measure odometry

1. **Initialize pose.** Establish the estimate at a known starting pose. In `odometry.py`, implement `Odometry.reset(initial_pose)` to store and return that `Pose`. Make the `pose` property return the latest estimate. Position is the drive-axle midpoint in world millimeters; heading is positive counterclockwise from +x, in radians.
2. **Integrate wheel travel.** Convert each measured wheel increment into a change in pose. Implement `Odometry.update(left_increment_mm, right_increment_mm)` using signed travel since the previous sample and `self.config.track_width_mm`. Return and retain the new `Pose`. Unequal travel follows the wheel paths' exact constant-curvature arc; wrap heading to `[-π, π)`.
3. **Check known motions.** Run **Test functions** (`component_checks.py`) without driving. For its straight, in-place turn, and arc inputs, record the wheel increments, predicted change in pose, and returned `Pose`. Compare the direction, units, and heading wrap. A square is an optional additional accumulation check; the route run below supplies the independent floor-pose comparison.

## 2. Implement and test ordered navigation

1. **Track goals.** Retain which destination is active across samples. In `navigation_controller.py`, implement `NavigationController.start(goals)` to save the ordered sequence and reset progress. Make `current_goal()` report the active goal or `None`, and `is_complete()` report whether every required position and heading has been reached. An empty route is complete immediately.
2. **Choose motion.** Turn pose error into the next motion request. Implement `update(pose)` to return a `MotionCommand` from the estimated `Pose`. Decide how to turn toward, approach, and accept each goal. `heading_rad=None` requires position only; the last goal also requires heading. Use `NavigationConfig` tolerances and motion settings. Return `STOP_COMMAND` after completion.
3. **Check and select.** Use **Test functions** to examine distant, near, and wrong-final-heading poses. In `course_setup.py`, set `USE_STUDENT_ODOMETRY` and `USE_STUDENT_NAVIGATION_CONTROLLER` to `True` after their checks pass. Reuse your completed sensing, wheel-speed control, and differential-drive files from Arena Line Circuit, along with the measured robot settings. Set their matching flags to `True`; `False` selects the supplied versions.

## 3. Run and measure the courier route

1. **Set motion controls.** The **Cruise speed** (mm/s) and **Turn rate** (rad/s) Monitor controls in `live_variables.py` start at 150 mm/s and 0.8 rad/s. `apply_navigation_controls()` in `robot_config.py` applies changed values to the active controller after the next robot sample; approach speed follows cruise speed at 80%. Slider endpoints are configured control limits, not activity targets. Record values used; adjust other navigation settings in `robot_config.py` when measurements support a change.
2. **Check the virtual route.** Inspect the start and ordered goals in `world.json`; `challenge.py` loads them as `INITIAL_POSE` and `ROUTE`. Run `main.py` on the Virtual XRP. Use the route trace, estimated heading, `goals_reached`, and Program output to locate overshoot, missed goals, or repeated turns. Revise the controller and repeat as needed before physical trials.
3. **Measure the physical result.** Run from the marked starting axle pose. Record visit order, missed destinations or contact, and final orientation. Measure final axle-midpoint position and heading on the floor, including reading precision, and compare them with `final_pose` in Program output. If using a front-center mark, measure its axle offset and account for heading. Repeat as needed to assess consistency.

## Your report

Submit one report per pair with both names, robot identification, selected components, world, and trial settings. Label virtual results separately from physical measurements.

1. **Preliminary lab work:** give the odometry model, straight/turn/arc input-output checks, navigation checks, and reasoning behind calibration and controller choices. Include a square check if performed.
2. **Challenge data:** show the route trace and estimated heading, and tabulate requested, estimated, and measured final position and heading for physical runs. Include visit order and relevant settings.
3. **Challenge performance:** state which goals and final-heading requirement were reached, and quantify final position and heading errors using the axle midpoint.
4. **Reflection:** use the preliminary and route data to distinguish pose-estimation error from controller behavior. Identify one supported improvement and the measurement that would test it.

## Project files

<strong class="student-file">Blue *</strong>: code to implement. <strong class="config-file">Amber †</strong>: settings to adjust. <span class="supplied-file">Gray S</span>: code provided or completed in an earlier challenge. `main.py` is supplied; controlled experiments may edit it.

<div class="project-file-table">

| File | What it does |
| --- | --- |
| <span class="supplied-file"><code>main.py</code> S</span> | Runs navigation and reports independently counted arrivals and final pose. |
| <span class="supplied-file"><code>route_progress.py</code> S</span> | Checks estimated-pose arrival at ordered goals using current tolerances. |
| <strong class="student-file"><code>odometry.py</code> *</strong> | Accumulates wheel increments to estimate position and heading. |
| <strong class="student-file"><code>navigation_controller.py</code> *</strong> | Uses estimated pose to reach ordered destinations. |
| <span class="supplied-file"><code>sensor_model.py</code> S</span> | Converts encoder readings into wheel travel and speed; also contains range estimation. |
| <span class="supplied-file"><code>wheel_speed_controller.py</code> S</span> | Calculates motor commands from wheel-speed targets and measurements. |
| <span class="supplied-file"><code>differential_drive.py</code> S</span> | Converts forward speed and turn rate into wheel-speed targets. |
| <strong class="config-file"><code>robot_config.py</code> †</strong> | Holds robot calibration and navigation settings. |
| <strong class="config-file"><code>challenge.py</code> †</strong> | Loads the start pose and ordered goals. |
| <strong class="config-file"><code>course_setup.py</code> †</strong> | Selects component implementations. |
| <strong class="config-file"><code>live_variables.py</code> †</strong> | Declares Monitor controls and publishes progress and estimated heading. |
| <span class="supplied-file"><code>component_checks.py</code> S</span> | Runs component input/output examples without driving. |
| <strong class="config-file"><code>world.json</code> †</strong> | Defines arena geometry, start pose, and markers shared by the robot and Monitor. |

</div>

## Parameters and functions

These are the settings and interfaces used above; see the API reference for full type and error behavior.

### Parameters

| Setting | Source and units | Effect |
| --- | --- | --- |
| `track_width_mm` | `robot_config.py`; mm | Effective wheel spacing used to convert unequal wheel travel into heading change. |
| Cruise speed, turn rate | Monitor controls in `live_variables.py`; mm/s, rad/s | Live forward and turning requests, applied by `robot_config.py` after the next sample. |
| `approach_speed_mm_s`, `slowdown_distance_mm` | `robot_config.py`; mm/s, mm | Near-goal speed and distance at which slowing starts; this starter sets approach speed to 80% of cruise speed. |
| `position_tolerance_mm`, `heading_tolerance_rad` | `robot_config.py`; mm, rad | Estimated position and heading errors accepted at a goal. |
| `realign_heading_rad` | `robot_config.py`; rad | Heading error above which forward travel pauses for turning. |

### Functions and methods

| Function or method | Input | Return or effect |
| --- | --- | --- |
| `Odometry.reset(initial_pose)` | Known `Pose` in mm and rad | Stores and returns starting `Pose`. |
| `Odometry.update(left_increment_mm, right_increment_mm)` | Signed wheel increments in mm | Updated estimated `Pose`. |
| `Odometry.pose` | Property read after reset | Latest estimated `Pose`. |
| `NavigationController.start(goals)` | Ordered `NavigationGoal` values | Starts at first goal; an empty route is complete. |
| `NavigationController.set_config(config)` | Complete `NavigationConfig` | Inherited method changes settings without restarting the route. |
| `NavigationController.update(pose)` | Estimated `Pose` | Next `MotionCommand` in mm/s and rad/s. |
| `NavigationController.current_goal()` | None | Active goal or `None`. |
| `NavigationController.is_complete()` | None | Boolean route-completion status. |
| `count_reached_goals(pose, route, reached_count, config)` | Estimated pose, ordered goals, previous count, current settings | Updated independently observed arrival count. |
