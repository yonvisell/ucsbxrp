# Challenge 5: Delivery Mission

## The challenge

Begin at the observation pose, collect repeated forward-range readings, decide
whether the named map feature is blocked, and deliver by an available route.
The program reports `"delivered"` only after validating the planned path and
measuring the destination within the navigation tolerances. It reports
`"no_path"`, `"invalid_path"`, or `"destination_not_reached"` otherwise.

[`world.json`](world.json) defines the virtual observation cases, common map,
start, destination, and changeable feature. [`challenge.py`](challenge.py)
constructs `DELIVERY_TASK`, which supplies the range-sample requirements,
decision threshold, missing-range behavior, grid settings, geometry, initial
pose, and destination. Use these names; do not repeat their current numerical
values or obstacle coordinates elsewhere.

The virtual gate opening is 300 mm wide. The task clearance includes the
simulator's 85 mm XRP collision radius and a 10 mm planning margin. Before a
physical run, measure the assembled robot footprint and verify that the course
gate and route provide at least the assigned clearance.

## Reuse work in another challenge

Choose **Start another challenge…** in the IDE. Review the **Preserve**,
**Replace**, and **Add** lists before creating the separate project; they show
how existing component, calibration, helper, and task files will be handled.
The current project remains unchanged.

## What you implement

Implement `SensorModel.estimate_range(samples, minimum_usable)` in
[`sensor_model.py`](sensor_model.py). For the supplied sequence:

- ignore missing values, Booleans, and numeric values that are not finite and
  positive;
- return `None` when fewer than `minimum_usable` readings remain; and
- otherwise return the median usable distance in millimeters.

This method must not change the wheel-measurement state. `None` means that no
estimate was available; it does not represent zero distance.

## Project modules

| File | Role |
| --- | --- |
| [`sensor_model.py`](sensor_model.py) | Converts encoder samples to wheel travel and wheel-speed estimates based on recent encoder samples; now also combines range readings. |
| [`wheel_speed_controller.py`](wheel_speed_controller.py) | Produces motor commands within the configured limits from wheel-speed error. |
| [`differential_drive.py`](differential_drive.py) | Produces target wheel speeds from requested robot motion. |
| [`odometry.py`](odometry.py) | Updates the estimated `Pose` from measured wheel travel. |
| [`navigation_controller.py`](navigation_controller.py) | Selects the next `MotionCommand` from the active route goal and pose. |
| [`grid_planner.py`](grid_planner.py) | Connects the requested start and goal through free grid cells. |
| [`robot_config.py`](robot_config.py) | Stores robot calibration and navigation settings. |
| [`course_setup.py`](course_setup.py) | Selects the supplied class or the class defined in each named component file. |

**Test components always loads the classes from the six component project
files**, regardless of which classes are selected for a complete robot run.

## Provided files and tools

- `DeliveryMission` keeps the robot stopped during observation, evaluates the
  named feature, builds the selected grid, validates the returned path,
  navigates to the exact destination, checks the measured terminal position
  and heading, retains its evidence, and stops on every exit.
- [`main.py`](main.py) constructs the mission services, runs the mission, and
  prints one result summary.
- [`component_checks.py`](component_checks.py) calls
  `SensorModel.estimate_range()` and the required methods of the other selected
  classes without starting a robot.
- `ArenaMap`, `OccupancyGrid`, and `GridPath.to_goals()` connect the observed
  map condition to planning and navigation.

## How the program runs

```text
stationary range samples -> SensorModel.estimate_range()
                         -> open/blocked named feature
                         -> OccupancyGrid -> GridPlanner -> route or no_path
route                    -> NavigationController -> delivery motion
```

The observed distance, not the virtual case label, determines the selected map
condition. Use the IDE's visible **Stop** control to interrupt a run that does
not converge.

## Check the component

Select **Test components**. The checks do not start either robot. Read `USE`,
`INPUT`, and `EXPECT` before each result. Range checks include odd and even
medians, mixed unusable readings, too few usable readings, and invalid
`minimum_usable` input.

- `PASS` means the implemented behavior matched the examples.
- `NOT IMPLEMENTED` means the named method still needs to be written.
- `FAIL` means the method ran but returned an incorrect estimate or error.

Fix every unfinished or failing result, repeat **Test components**, and then
select the `SensorModel` defined in `sensor_model.py` in `course_setup.py`.

## Complete the challenge

1. Run each virtual observation case with the supplied estimator. Record the
   stationary range readings, selected route, mission result, and final pose.
2. Calculate the median of the usable readings and compare it with the reported
   estimate.
3. Select the `SensorModel` defined in `sensor_model.py` and repeat every
   case. Verify that range determines the map condition.
4. Select the classes from all six component project files to distinguish
   sensing, planning, navigation, odometry, and wheel-control results.
5. Before physical motion, inspect stationary range values and sensor
   direction. Then run the matched arena from its marked start and record the
   readings, selected route, result, and final pose.
