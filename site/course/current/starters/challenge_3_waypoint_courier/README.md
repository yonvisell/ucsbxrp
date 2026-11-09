# Challenge 3 · Waypoint Courier

## Task

Navigate the sequence of goals, in order, in minimum time, returning to the starting position and heading at the end. Use camera based gps and wheel travel to estimate the robot's pose, then use that pose to control its motion toward the active goal.

The Waypoints counter confirms arrivals within 50 mm of each goal. The black goal disks in World show this position tolerance (100 mm diameter). At the final goal, the heading must also be within 10° of the starting heading. A successful run reaches the final goal number and stops. Route time is measured automatically from navigation start through the final stop command.

Reuse your sensing and differential-drive components from Challenge 2. The new work is to update world position and heading in [localization.py](localization.py), and calculate motion commands in [navigation_controller.py](navigation_controller.py). Implement and test these calculations in Virtual XRP before running the physical robot.

![Four World views showing the robot between successive navigation goals.](course-assets/waypoint-courier-run.svg)

*Figure 1. Successive stages of a completed route in Virtual XRP.*

## 1. Localization

Localization maintains the robot's position and heading in the arena. Camera based gps provides periodic updates of both quantities. Between these updates, estimate the robot's movement from the pair of wheel travel increments.

In [localization.py](localization.py), `update_pose(measurements, gps_fix)` calls `predict()` once with the preceding pose and the pair of wheel travel increments. It stores the resulting pose in `self.pose`, which becomes the starting pose for the next update.

When a new camera based gps update arrives, `apply_gps()` adds the wheel-derived displacement since image capture to its position and heading, then assigns the result to `self.pose`. This accounts for movement while the image was processed and transmitted. The short history records wheel-derived displacement; a GPS correction does not count as movement. With no new GPS update, `self.pose` remains the wheel-based prediction. Both methods are visible in the same file.

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

Use the estimated position and heading to steer toward the active navigation goal. In [navigation_controller.py](navigation_controller.py), each behavior's `execute()` method calculates a motion command and selects the behavior for the next update. Complete the two geometry helpers and the motion calculations described below. The controller and transition conditions are already present in that file.

<div class="navigation-behaviors">

| Behavior class | When active | Function |
| --- | --- | --- |
| `TurnToGoal` | At the start of navigation toward a goal. | Turn in place until facing the goal, then begin driving. |
| `DriveToGoal` | After the initial turn. | Drive forward while correcting heading. On reaching the goal position, advance to the next goal or begin final alignment. |
| `AlignAtGoal` | At a goal that requires a final heading. | Finish the turn to that heading, then check position. Advance if within position tolerance; otherwise approach the same goal again. At the last goal, complete the route. |

</div>

### Calculate distance and heading error

The behavior classes use two helpers in [navigation_controller.py](navigation_controller.py):

- Complete `distance_to_goal(pose, goal)` to return the straight-line distance in mm from the robot position to the goal position. Use the differences in their world x and y coordinates.
- Complete `heading_error(pose, goal)` to return the angle through which the robot must turn to face the goal position, using the calculation below.

For robot position \((x,y)\) and goal position \((x_g,y_g)\), the heading toward the goal is

\[
\phi=\operatorname{atan2}(y_g-y,\;x_g-x).
\]

Use the y-coordinate difference as the first `atan2` argument and the x-coordinate difference as the second. The difference between this direction and the robot heading gives the heading error:

\[
\Delta\phi=\operatorname{wrap}(\phi-\theta).
\]

Apply `wrap_angle_rad` to express the error between \(-\pi\) and \(\pi\). Positive error calls for a left turn; negative error calls for a right turn.

![Robot heading and heading toward a navigation goal, with their angular difference.](course-assets/navigation-steering.svg)

*Figure 4. The robot heading \(\theta\) and the heading toward the navigation goal, \(\phi\), are shown. The difference between them, \(\Delta\phi\), is the heading error.*

### Calculate motion in each behavior

Use proportional feedback to turn toward the goal:

\[
\omega=k\Delta\phi.
\]

The steering rate \(\omega\) requests a change in robot heading per second, in rad/s. The gain \(k\), named `K_Heading` in the code, has units of \(\mathrm{s}^{-1}\). A larger gain requests a faster turn for the same error. Each behavior returns a pair: `MotionCommand(forward_speed, steering_rate)` and the state to use next. Positive forward speed moves the robot forward; positive steering rate turns counterclockwise.

Complete the calculations inside these `execute()` methods:

- In `TurnToGoal.execute()`, use the error returned by `heading_error()` to calculate steering rate. Request zero forward speed while turning toward the goal.
- In `DriveToGoal.execute()`, use the same helper and gain to correct heading while requesting `navigation.config.cruise_speed_mm_s`. Recalculate the error on each update as the robot moves. Your differential-drive component from Challenge 2 converts this forward speed and steering rate into left and right wheel speeds.
- In `AlignAtGoal.execute()`, calculate the error between the required `goal.heading_rad` and the current `pose.heading_rad`. Wrap the difference and use the same proportional feedback with zero forward speed. This final orientation can differ from the direction used to approach the goal.

You may refine the driving speed for a large heading error or a close approach, using `navigation.config.slowdown_distance_mm` if useful. You may also use `clamp` to limit steering rate to `±navigation.config.steering_rate_rad_s`.

### Choose the steering filter time constant

A new camera based gps pose can change the heading error abruptly. Choose the time constant of the first-order low-pass filter in `NavigationController.update()` to spread the resulting steering change over successive updates:

\[
\beta=\frac{\Delta t}{T+\Delta t},\qquad
\omega_k=\omega_{k-1}+\beta(\omega_k^{\mathrm{req}}-\omega_{k-1}).
\]

At sample \(k\), \(\omega_k^{\mathrm{req}}\) is the steering rate calculated by the active behavior, \(\omega_{k-1}\) is the preceding filtered command, and \(\omega_k\) is the new filtered command. The sample interval \(\Delta t\) and time constant \(T\) are in seconds. Increasing \(T\) reduces the fraction \(\beta\) of the command change applied at each update, but also delays the response.

Adjust `STEERING_FILTER_TIME_S` in [navigation_controller.py](navigation_controller.py), which sets \(T\). A time constant of zero applies the requested steering rate directly. Use the Steering command plot and the path in World to assess both steering changes after a camera based gps update and the delay in turning toward the goal. Select the time constant using the route times of successfully completed runs.

## 4. Test the program, then improve route time

### Test the implementation in Virtual XRP

Use Run code tests to check each completed component. The tests exercise the project classes directly; unfinished methods are reported as Not implemented. In [robot_setup.py](robot_setup.py), enable your reused components by setting `USE_STUDENT_SENSOR_PROCESSOR` and `USE_STUDENT_DIFFERENTIAL_DRIVE` to `True`. Then test the new components in Virtual XRP:

1. Set `USE_STUDENT_LOCALIZATION = True` and `USE_STUDENT_NAVIGATION_CONTROLLER = False` to test your pose update with the reference navigation controller.
2. Set `USE_STUDENT_NAVIGATION_CONTROLLER = True` and run again to test your complete implementation.

Inspect the path in World. Camera based GPS correction markers show the position after adding wheel travel since image capture. Confirm that the Waypoints count advances through the goals and that the robot returns to the start, aligns, and stops.

Use the motion to diagnose your implementation: the robot should turn toward the active goal, drive toward it while correcting its heading, and align with the starting direction at the finish. During driving, inspect Command heading error and Steering command together to check the direction and magnitude of your steering correction.

### Reduce the time on Physical XRP

Assign your robot's tag once in IDE Settings: choose **Assign camera tag**, place the robot directly under the arena camera, and click **Assign tag**. The assignment is shared by the Projects in your Working folder.

Copy your physical robot's calibration from Challenge 2 into [settings.py](settings.py), place the wheel midpoint at the start mark facing world \(+x\), and run your tested components with camera based gps. Use the Waypoints count to confirm completion and Route time to measure performance. The program also prints the final route time as `elapsed_s`.

Identify where the robot spends unnecessary time. Adjust cruise speed in [settings.py](settings.py) and `K_Heading` in [navigation_controller.py](navigation_controller.py), using the observed motion to guide your choice:

| Observed motion | Adjustment to evaluate |
| --- | --- |
| Direct, steady travel between goals, with little heading error. | Increase cruise speed and check that the route still completes. |
| Long turns in place or persistent heading error while driving. | Increase `K_Heading` to request a faster correction. If you limit steering rate, inspect whether the request has reached that limit. |
| Steering repeatedly carries the robot across the direction of the goal. | Reduce `K_Heading` and compare the path and route time. |
| The robot passes the goal without reaching its position tolerance. | Reduce cruise speed or add approach slowing. |

Repeat promising settings to establish that the faster route completes reliably. Use the physical runs to choose your final settings.

## Explain the improvement in your submission

Export the selected runs from Monitor with Include code in ZIP. Record the Waypoints count, Route time, cruise speed, `K_Heading`, `STEERING_FILTER_TIME_S` and any speed or steering-rate limits used in the runs that support your choice.

Plot the robot's path from `estimated_x_mm` and `estimated_y_mm`, with equal axis scales and the navigation goals from [world.json](world.json). To explain a steering change during driving, plot `program_goal_heading_error_rad` and `requested_steering_rate_rad_s` against `acquired_at_s` over the relevant part of the route. The recorded route time is `program_route_time_s`.

Answer these questions in your submission:

1. How does unequal wheel travel change the robot's heading, and why does the world displacement use the direction halfway through that change?
2. How does the updated pose determine the command in `DriveToGoal.execute()`? Explain how turning in place and final alignment modify that calculation.
3. Which change improved your physical route time? Use the path or steering plots to explain the improvement and report the completion counts and times that support your final settings.

## Test the pose and navigation calculations

The calculation tests call the classes in your project files, independently of the component selectors in [robot_setup.py](robot_setup.py). They compare returned poses and commands with expected results for known inputs. Resolve a Fail result using the reported inputs and differences. A Not implemented result identifies a method still to complete; a Pass result confirms the tested calculation.

## Project files

<span class="student-file">Implement (green)</span>: student calculations. <span class="config-file">Configure (purple)</span>: settings and selectors. <span class="supplied-file">Supplied (gray)</span>: program and task files.

| File | Work |
| --- | --- |
| `localization.py`, `navigation_controller.py` | Complete the pose update, two geometry helpers and steering calculations in three behaviors. |
| `settings.py`, `robot_setup.py` | Enter calibration, tune navigation and select components. |
| `sensor_processor.py`, `differential_drive.py` | Reuse your Challenge 2 calculations. |
| `challenge.py`, `world.json` | Define the route and arrival criteria. |
| `main.py`, `route_progress.py`, `live_variables.py` | Run the route, count arrivals and report time. |
| `supplied_settings.py`, `component_checks.py` | Configure target services and test calculations. |

## Appendix A: main.py: controlling the loop

The route is a feedback process: wheel travel and camera based gps update the pose, navigation uses that pose to choose the next motion command, and the resulting movement changes the next pose.

![Pose estimation, navigation, wheel control and robot movement connected in a feedback loop.](course-assets/navigation-feedback-loop.svg)

*Figure 5. Pose \((\boldsymbol{p},\theta)\) and the active goal determine forward speed \(V\) and steering rate \(\omega\). Wheel travel \(d_L,d_R\) and camera based gps provide the next pose update.*

After `robot.start(INITIAL_POSE)`, `main.py` starts navigation and the route clock. Each iteration calls `navigation.update(state.pose, state.measurements.dt_s)` to obtain a command, then `robot.step(command)` to apply it and obtain the next `RobotState`. That state contains the pose used in the following iteration. The loop updates the waypoint count and route time; completing the route stops the robot.

## Appendix B: State objects and method selection

A behavior class defines how the robot acts and when it changes behavior. For example, `DriveToGoal` defines driving toward a goal; an object created by `DriveToGoal()` represents that active behavior. The controller keeps this object in `current_state`.

Each call to `navigation.update(pose, dt_s)` runs the current object's `execute()` method:

```python
command, self.current_state = self.current_state.execute(pose, self.current_goal(), self)
```

Here, `self` is the controller. Inside a behavior's `execute(pose, goal, navigation)` method, `self` instead refers to that behavior object, and `navigation` refers to the controller passed as the last argument. The method returns both the motion command and the state for the next update. The controller filters the steering rate before returning the command to `main.py`.

For example, a `DriveToGoal` object returns itself while driving. When it reaches a goal that requires alignment, it returns an `AlignAtGoal` object. The next call to `navigation.update()` therefore runs `AlignAtGoal.execute()`. Python selects the method from the object stored in `current_state`; this is polymorphic execution. The controller uses the same call for every behavior, while each behavior keeps its action and transition logic together.

At a completed goal, the behavior calls `navigation.advance_goal()`, which selects `TurnToGoal()` for the next goal or `RouteComplete()` after the last goal. The complete-route behavior returns `STOP_COMMAND`. In `main.py`, the command returned by `navigation.update()` is passed to `robot.step()` to apply the motion and obtain the next pose.
