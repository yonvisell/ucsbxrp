# Challenge 3 · Waypoint Courier

## Task

Navigate the sequence of goals, in order, in minimum time, returning to the starting position and heading at the end. Use camera based gps and wheel travel to estimate the robot's pose, then use that pose to control its motion toward the active goal.

The Waypoints counter confirms arrivals within 50 mm of each goal. At the final goal, the heading must also be within 10° of the starting heading. A successful run reaches the final goal number and stops. Route time is measured automatically from navigation start to the final accepted pose.

Reuse your sensing and differential-drive components from Challenge 2. The new work is to update world position and heading in [localization.py](localization.py), and calculate motion commands in [navigation_controller.py](navigation_controller.py). Implement and test these calculations in Virtual XRP before running the physical robot.

![Four World views showing the robot between successive navigation goals.](course-assets/waypoint-courier-run.svg)

*Figure 1. Successive stages of a completed route in Virtual XRP.*

## 1. Localization

Localization maintains the robot's position and heading in the arena. Camera based gps provides periodic updates of both quantities. Between these updates, estimate the robot's movement from the pair of wheel travel increments.

In [localization.py](localization.py), `update_pose()` calls `predict()` to update the preceding pose using wheel travel. When a new camera based gps pose is available, its position and heading replace this prediction. Otherwise, the wheel-based prediction becomes the new pose.

The `gps_pose` argument contains the new camera based gps pose, adjusted for wheel movement since image capture. Its value is `None` when no new update is available.

```python
def update_pose(self, pose, left_increment_mm, right_increment_mm, gps_pose=None):
    predicted_pose = self.predict(pose, left_increment_mm, right_increment_mm)
    if gps_pose is not None:
        return gps_pose
    return predicted_pose
```

## 2. Estimation of robot position and heading

### World coordinates and robot coordinates

World space has its origin at the arena center. The directions \(\hat{x}\) and \(\hat{y}\) lie along the arena's length and width. The position vector \(\boldsymbol{p}=[x,y]^\top\) locates the midpoint between the driven wheels. The heading \(\theta\) is measured counterclockwise from world \(+x\) to the robot's forward direction.

Robot space has its origin at the wheel midpoint, with \(\hat{x}_r\) pointing forward and \(\hat{y}_r\) pointing left. These directions turn with the robot. The hats denote unit vectors. Use millimeters for distances and radians for angles in your calculations.

![An example path running left to right through two robot poses toward goal 3, with separate world and robot coordinate directions.](course-assets/localization-navigation.svg)

*Figure 2. World and robot coordinates along a schematic example path. At times \(t_1\) and \(t_2\), the robot headings are \(\theta_1\) and \(\theta_2\). The forward and leftward unit directions \(\hat{x}_{r,1},\hat{y}_{r,1}\) and \(\hat{x}_{r,2},\hat{y}_{r,2}\) turn with the robot; \(\hat{x},\hat{y}\) are fixed world directions. The navigation goal has world coordinates \((x_g,y_g)\).*

### Calculate the new position and heading

Complete `Localization.predict()` in [localization.py](localization.py). It receives the starting `pose` and the left and right wheel travel increments, \(d_L\) and \(d_R\), since the preceding encoder measurement. Forward travel is positive. The method returns the updated pose.

1. **Calculate forward travel and heading change.** The mean wheel travel gives the distance \(s\) traveled by the wheel midpoint. The difference turns the robot through \(\Delta\theta\), where \(b\) is the separation between the driven wheels:

   \[
   s=\frac{d_L+d_R}{2},\qquad
   \Delta\theta=\frac{d_R-d_L}{b}.
   \]

   Use the two wheel-travel arguments for \(d_L,d_R\) and `self.config.track_width_mm` for \(b\).

2. **Calculate the displacement in world coordinates.** During a turn, the robot's heading changes from \(\theta\) to \(\theta'=\theta+\Delta\theta\). With approximately constant wheel speeds over the short interval, the heading changes approximately uniformly. Halfway through the interval, the heading is

   \[
   \frac{\theta+\theta'}{2}
   =\frac{\theta+(\theta+\Delta\theta)}{2}
   =\theta+\frac{\Delta\theta}{2}.
   \]

   Approximate the short movement by travel \(s\) along this halfway direction, then project it onto the world axes (Figure 3):

   \[
   \Delta\boldsymbol{p}
   =\begin{bmatrix}\Delta x\\\Delta y\end{bmatrix}
   \approx s\begin{bmatrix}
   \cos(\theta+\Delta\theta/2)\\
   \sin(\theta+\Delta\theta/2)
   \end{bmatrix}.
   \]

   Use `pose.heading_rad` for \(\theta\), with `cos` and `sin` for the two projections.

3. **Return the updated pose.** Add the displacement to the starting world position and the heading change to the starting heading:

   \[
   \boldsymbol{p}'=\boldsymbol{p}+\Delta\boldsymbol{p},\qquad
   \theta'=\theta+\Delta\theta.
   \]

   Add \(\Delta x\) to `pose.x_mm` and \(\Delta y\) to `pose.y_mm`. Return the resulting coordinates and heading in a new `Pose`.

![A turning movement with different initial and final forward directions, its displacement, and projections onto the world axes.](course-assets/pose-increment.svg)

*Figure 3. The robot turns from heading \(\theta\) to \(\theta'\), a change of \(\Delta\theta\). The displacement \(\Delta\boldsymbol{p}=\boldsymbol{p}'-\boldsymbol{p}\) points along \(\theta+\Delta\theta/2\), halfway between these headings. Its world components are \(\Delta x\) and \(\Delta y\). The oblique dashed ray at \(\boldsymbol{p}'\) is parallel to the initial forward direction; it provides the reference for \(\Delta\theta\).*

## 3. Use the estimated pose to navigate toward a goal

The updated position and heading from localization become the `pose` input to the navigation commands. Use them to find the direction of the active goal, calculate a heading error, and request a turn that reduces that error. While driving, repeat this calculation as the robot's position changes.

### Complete the driving command

In [navigation_controller.py](navigation_controller.py), complete `DriveToGoal.command()`. It receives the current `pose`, active `goal`, and navigation settings `config`. Return a `MotionCommand` containing forward speed \(V\) [mm/s] and turn rate \(\omega\) [rad/s]. The turn rate is the change in robot heading per second; positive \(\omega\) turns counterclockwise.

1. **Find the heading toward the active goal.** For robot position \((x,y)\) and goal position \((x_g,y_g)\), calculate

   \[
   \phi=\operatorname{atan2}(y_g-y,\;x_g-x).
   \]

   Use `goal.y_mm - pose.y_mm` and `goal.x_mm - pose.x_mm` as the two `atan2` arguments, in that order. The function uses both coordinate differences to determine the direction.

2. **Calculate the heading error.** Compare the goal direction with the current robot heading:

   \[
   \Delta\phi=\operatorname{wrap}(\phi-\theta).
   \]

   Apply `wrap_angle_rad` to the difference from `pose.heading_rad`. It expresses the turn between \(-\pi\) and \(\pi\): positive error calls for a left turn, and negative error for a right turn.

![Robot heading and heading toward a navigation goal, with their angular difference.](course-assets/navigation-steering.svg)

*Figure 4. The robot heading \(\theta\) and the heading toward the navigation goal, \(\phi\), are shown. The difference between them, \(\Delta\phi\), is the heading error.*

3. **Calculate the turn rate.** Use proportional feedback:

   \[
   \omega=k\Delta\phi.
   \]

   For driving, use `HEADING_GAIN` as \(k\), in \(\mathrm{s}^{-1}\). A larger gain requests a faster turn for the same heading error. Use `clamp(value, lower, upper)` to limit the result between `-config.turn_rate_rad_s` and `config.turn_rate_rad_s`. This is the turn rate to return in your command.

4. **Set forward speed from the remaining distance.** Slow the final approach to allow time for the remaining heading correction. Find the distance with `distance_to_goal(pose, goal)`. Outside `config.slowdown_distance_mm`, request `config.cruise_speed_mm_s`. Within that distance, multiply `config.approach_speed_mm_s` by the remaining distance divided by `config.slowdown_distance_mm`.

5. **Return the motion command.** Return `MotionCommand(forward_speed, turn_rate)` using the speed from step 4 and the turn rate from step 3. Your differential-drive component from Challenge 2 converts these requests into left and right wheel speeds.

### Complete turning and final alignment

The navigation controller selects the active behavior and advances to the next goal when its arrival conditions are met. The driving command above controls travel between goals; the other two commands orient the robot before driving and at the end of the route.

<div class="navigation-behaviors">

| Behavior class | When active | Function |
| --- | --- | --- |
| `TurnToGoal` | Before driving toward a new goal, or when a large heading error interrupts driving. | Turn in place to face the goal. |
| `DriveToGoal` | Once facing the goal. | Drive forward and correct the heading until reaching the goal position. |
| `AlignAtGoal` | At the final goal. | Turn in place to restore the starting heading. |

</div>

- Complete `TurnToGoal.command()` using the same goal direction and heading error as the driving command. Use `TURN_GAIN` for the proportional gain, apply the turn-rate limit, and return zero forward speed with the resulting turn rate.
- Complete `AlignAtGoal.command()` by comparing `goal.heading_rad` with `pose.heading_rad`. Apply `wrap_angle_rad`, `TURN_GAIN`, and the turn-rate limit, then return zero forward speed with the resulting turn rate.

The controller starts driving within 10° of the goal direction. If the error later exceeds `REALIGN_HEADING_RAD` in [settings.py](settings.py), it turns in place before continuing.

The two gains control different motions: `TURN_GAIN` controls changes of heading at a fixed position; `HEADING_GAIN` controls steering while the goal direction changes with the robot's position.

## 4. Test the program, then improve route time

### Test the implementation in Virtual XRP

Use Run code tests to check each completed component. The tests exercise the project classes directly; unfinished methods are reported as Not implemented. In [robot_setup.py](robot_setup.py), enable your reused components by setting `USE_STUDENT_SENSOR_PROCESSOR` and `USE_STUDENT_DIFFERENTIAL_DRIVE` to `True`. Then test the new components in Virtual XRP:

1. Set `USE_STUDENT_LOCALIZATION = True` and `USE_STUDENT_NAVIGATION_CONTROLLER = False` to test your pose update with the reference navigation commands.
2. Set `USE_STUDENT_NAVIGATION_CONTROLLER = True` and run again to test your complete implementation.

Inspect the path in World. Confirm that the Waypoints count advances through the goals and that the robot returns to the start, aligns, and stops.

Use the motion to diagnose your implementation: the robot should turn toward the active goal, drive toward it while correcting its heading, and align with the starting direction at the finish. During driving, inspect Command heading error and Requested turn rate together to check the sign, magnitude and limit of your steering correction.

### Reduce the time on Physical XRP

Copy your physical robot's calibration from Challenge 2 into [settings.py](settings.py), place the wheel midpoint at the start mark facing world \(+x\), and run your tested components with camera based gps. Use the Waypoints count to confirm completion and Route time to measure performance. The program also prints the final route time as `elapsed_s`.

Identify where the robot spends unnecessary time. Adjust speeds and the turn-rate limit in [settings.py](settings.py), or the two gains in [navigation_controller.py](navigation_controller.py), using the observed motion to guide your choice:

| Observed motion | Adjustment to evaluate |
| --- | --- |
| Direct, steady travel between goals, with little heading error. | Increase cruise speed and check that the route still completes. |
| Long turns in place before or after driving. | Increase `TURN_GAIN` if the turn-rate request is below its limit; otherwise evaluate a higher turn-rate limit. |
| While driving, the heading error persists in one direction and the turn-rate request is below its limit. | Increase `HEADING_GAIN` to correct the error more quickly. |
| While driving, the heading error persists and the turn-rate request remains at its limit. | Reduce cruise speed or evaluate a higher turn-rate limit. Increasing the gain alone cannot increase the requested turn rate. |
| Steering repeatedly carries the robot across the direction of the goal. | Reduce `HEADING_GAIN` and compare the path and route time. |

Repeat promising settings to establish that the faster route completes reliably. Use the physical runs to choose your final settings.

## Explain the improvement in your submission

Export the selected runs from Monitor with Include code in ZIP. Record the Waypoints count, Route time, cruise speed, turn-rate limit and two gains for the runs that support your choice.

Plot the robot's path from `estimated_x_mm` and `estimated_y_mm`, with equal axis scales and the navigation goals from [world.json](world.json). To explain a steering change during driving, plot `program_goal_heading_error_rad` and `requested_turn_rate_rad_s` against `acquired_at_s` over the relevant part of the route. The recorded route time is `program_route_time_s`.

Answer these questions in your submission:

1. How does unequal wheel travel change the robot's heading, and why does the world displacement use the direction halfway through that change?
2. How does the updated pose determine the command in `DriveToGoal.command()`? Explain how turning in place and final alignment modify that calculation.
3. Which change improved your physical route time? Use the path or steering plots to explain the improvement and report the completion counts and times that support your final settings.

## Test the pose and navigation calculations

The calculation tests call the classes in your project files, independently of the component selectors in [robot_setup.py](robot_setup.py). They compare returned poses and commands with expected results for known inputs. Resolve a Fail result using the reported inputs and differences. A Not implemented result identifies a method still to complete; a Pass result confirms the tested calculation.

## Project files

<span class="student-file">Implement (green)</span>: student calculations. <span class="config-file">Configure (purple)</span>: settings and selectors. <span class="supplied-file">Supplied (gray)</span>: program and task files.

| File | Work |
| --- | --- |
| `localization.py`, `navigation_controller.py` | Complete the pose update and three motion commands. |
| `settings.py`, `robot_setup.py` | Enter calibration, tune navigation and select components. |
| `sensor_processor.py`, `differential_drive.py` | Reuse your Challenge 2 calculations. |
| `challenge.py`, `world.json` | Define the route and arrival criteria. |
| `main.py`, `route_progress.py`, `live_variables.py` | Run the route, count arrivals and report time. |
| `supplied_settings.py`, `component_checks.py` | Configure target services and test calculations. |

## Appendix A: main.py: controlling the loop

The route is a feedback process: wheel travel and camera based gps update the pose, navigation uses that pose to choose the next motion command, and the resulting movement changes the next pose.

![Pose estimation, navigation, wheel control and robot movement connected in a feedback loop.](course-assets/navigation-feedback-loop.svg)

*Figure 5. Pose \((\boldsymbol{p},\theta)\) and the active goal determine forward speed \(V\) and turn rate \(\omega\). Wheel travel \(d_L,d_R\) and camera based gps provide the next pose update.*

After `robot.start(INITIAL_POSE)`, `main.py` starts navigation and the route clock. Each iteration calls `navigation.update(state.pose)` to obtain a command, then `robot.step(command)` to apply it and obtain the next `RobotState`. That state contains the pose used in the following iteration. The loop updates the waypoint count and route time; completing the route stops the robot.

## Appendix B: State objects and method selection

The controller creates one object for each behavior class and reuses it throughout the route. Each object combines the class's motion command with a decision about which behavior comes next.

In `class DriveToGoal(DriveToGoalState):`, `DriveToGoalState` is the parent class. It provides `execute()`, which decides whether to continue driving or change state. Your `DriveToGoal` class provides `command()`, the calculation you completed in section 3. When the inherited `execute()` calls `self.command(pose, goal, config)`, Python uses the command method defined by that object's class.

The controller advances the active behavior with

```python
self._state = self._state.execute(pose, goal, self)
```

Here, `self` is the controller; the last argument passes it to the active state. The call runs that state's `execute()` method. Returning the same state continues its behavior; returning another state changes behavior. Calling the appropriate method through the active object is polymorphic execution.
