# Challenge 5: Delivery Mission

## Objective

Begin at the observation pose, use repeated forward-range measurements to decide
whether the named gate is blocked, update the map, and deliver when a route
exists. Two outcomes are valid: `"delivered"` after navigation or
`"no_path"` while the robot remains stopped.

`world.json` contains two virtual cases with a shared start, destination, and
observable map feature. The selected case determines the simulated physical
condition and therefore the range readings. `DeliveryMission` is not given that
condition: it must infer whether the named feature is blocked from those
readings. `challenge.py` loads the world and observation settings into
`DELIVERY_TASK`. Do not duplicate wall, feature, start, or destination
coordinates in Python.

## Continue from the previous challenge

Open Challenge 4 and select **Create Challenge 5 · Delivery Mission project**.
The IDE creates a separate project, carries forward all six component files,
and keeps whether each student version is selected. Your new work is the
previously deferred range method in `sensor_model.py`. The Challenge 4 folder
remains unchanged.

## What you implement

Your new work is `SensorModel.estimate_range(samples, minimum_usable)`.
`SensorModel.reset()` and `update()`, plus `wheel_speed_controller.py`,
`differential_drive.py`, `odometry.py`, `navigation_controller.py`, and
`grid_planner.py`, are carried forward.

| Method or class | Responsibility, state, and use |
| --- | --- |
| `SensorModel.estimate_range` | Examines one supplied sequence without changing wheel-measurement state. It returns the median of the positive finite numeric readings when at least `minimum_usable` remain; otherwise it returns `None`. Boolean, missing, nonfinite, zero, and negative values are unusable. |
| `DeliveryMission` | Supplied coordinator. It keeps the robot stopped while sampling, applies the range result to one named map feature, requests a plan, follows it when available, and stops on every exit. |
| Carried-forward components | Measure wheel motion, control wheels, relate body and wheel motion, estimate pose, navigate goals, and plan the observed map. |

`DELIVERY_TASK` owns `grid_resolution_mm`, `clearance_mm`,
`observed_feature_name`, `range_sample_count`,
`minimum_usable_range_count`, `blocked_range_threshold_mm`, and
`assume_blocked_without_range`, as well as the initial pose, arena, and
destination. Use these named values. `None` means no estimate was available;
it does not mean a range of zero.

## Provided files and tools

| File or service | Role |
| --- | --- |
| `world.json` | Open and blocked virtual cases with shared geometry and named gate. |
| `challenge.py` | Constructs `DELIVERY_TASK` from the selected world and mission settings. |
| `main.py` | Runs `DeliveryMission` and prints its result and final pose. |
| `robot_config.py` | Robot calibration and navigation settings. |
| `course_setup.py` | Selects each carried-forward component independently. |
| `component_checks.py` | Labels mixed range inputs, expected medians or `None`, and observed results. |
| `ArenaMap`, `OccupancyGrid`, and `GridPath.to_goals(...)` | Represent the observed world and connect planning to navigation. |
| `Robot` and `XRPBot` | Supply measured state and isolate virtual or physical hardware. |

## How the program runs

The robot remains stopped while range samples are collected. Your estimator
returns a median or `None`. The supplied mission compares an estimate with
`blocked_range_threshold_mm`, or uses `assume_blocked_without_range` when no
estimate exists. It changes only `observed_feature_name`, builds the occupancy
grid, and requests a path. No path produces `"no_path"`; otherwise the
carried-forward navigation and robot loop complete the delivery.

## Complete the challenge

1. Run both virtual worlds with the supplied estimator. Observe the stationary
   range samples, selected map condition, route, mission result, and final pose.
2. Implement and check `estimate_range`. Confirm odd and even medians, mixed
   invalid readings, insufficient usable readings, and invalid
   `minimum_usable`.
3. Select the student `SensorModel` and repeat both worlds. Calculate the
   expected median from the usable readings and compare it with the gate
   decision and mission result.
4. Repeat with carried-forward student components to distinguish observation,
   planning, navigation, pose, and wheel-control results.
5. Before physical motion, inspect stationary range values and sensor direction.
   Then verify wheel direction with the wheels clear and Stop before running the
   matched arena from its marked start.

`DeliveryMission` commands zero motion during observation and calls
`robot.stop()` whether it delivers, finds no path, or raises an error.
