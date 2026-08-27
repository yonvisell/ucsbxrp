# Challenge 5: Delivery Mission

## Objective

Use stationary ultrasonic measurements to determine whether the named gate is
blocked, update the map, plan a route, and drive to the delivery point. The
mission must also handle two legitimate outcomes: complete the delivery when a
route exists, or stop and report that no route exists.

`challenge.py` constructs `DELIVERY_TASK`. Its named fields define the
experiment without requiring values to be repeated elsewhere:

- `initial_pose`, `arena`, and `destination` define the world and route
  endpoints;
- `grid_resolution_mm` is the planning-cell side length in millimeters, and
  `clearance_mm` is the required clearance from boundaries and obstacles;
- `observed_feature_name` identifies the map feature changed by the ultrasonic
  observation;
- `range_sample_count` is the number of stationary measurements requested, and
  `minimum_usable_range_count` is the minimum number required for an estimate;
- `blocked_range_threshold_mm` is the largest estimated range, in millimeters,
  interpreted as a blocked gate; and
- `assume_blocked_without_range` determines the map state when no estimate can
  be calculated.

Read these fields through `DELIVERY_TASK`. Do not copy their current numerical
values into `sensor_model.py` or another component.

## Student implementations

| File | Class | Responsibility |
| --- | --- | --- |
| `sensor_model.py` | `SensorModel` | Add a reliable estimate from several ultrasonic samples while retaining the checked encoder methods from Challenge 1. |
| `grid_planner.py` | `GridPlanner` | Use the checked shortest-route planner from Challenge 4 on the observed map. |
| `navigation_controller.py` | `NavigationController` | Use the checked waypoint controller from Challenge 3. |
| `odometry.py` | `Odometry` | Use the checked pose estimator from Challenge 2. |
| `differential_drive.py` | `DifferentialDrive` | Use the checked wheel-speed conversion from Challenge 2. |
| `wheel_speed_controller.py` | `WheelSpeedController` | Use the checked wheel-speed controller from Challenge 1. |

### Implement `SensorModel.estimate_range`

`estimate_range(samples, minimum_usable)` receives a sequence of ultrasonic
range readings in millimeters and the required number of usable readings. It
returns a range in millimeters or `None`.

1. Examine each value in `samples`.
2. Keep it only when it is an `int` or `float`, is not a Boolean value, is
   finite, and is greater than zero.
3. Return `None` if fewer than `minimum_usable` values remain.
4. Sort the remaining values.
5. For an odd number of values, return the middle value. For an even number,
   return the mean of the two middle values.

This median calculation rejects isolated unusually small or large readings
without assigning a distance to missing or invalid data. `None` means that no
range estimate was available; it does not mean zero distance.

## Supplied project files and services

| File or class | What it supplies |
| --- | --- |
| `world.json` | Open-gate and blocked-gate virtual cases with the same walls, start, and destination. |
| `challenge.py` | The named `DeliveryTask` fields used by every stage of the mission. |
| `main.py` | Constructs `DeliveryMission`, runs it, and prints the mission result and final pose. |
| `robot_config.py` | Robot calibration and waypoint-controller settings. |
| `course_setup.py` | Selects the supplied or student version of each class independently. |
| `component_checks.py` | Runs range, planning, and earlier component examples without starting a robot. |
| `DeliveryMission` | Stops the robot for sampling, evaluates the gate, updates the map, plans, follows the route, and stops the robot at exit. |
| `ArenaMap` and `OccupancyGrid` | Represent the observed arena and the cells available for planning. |
| `GridPath.to_goals(...)` | Converts the planned cells to waypoint goals and applies the requested final heading. |
| `Robot` and `XRPBot` | Supply measured robot state and isolate virtual or physical device access. |

`DeliveryMission.result` is `"delivered"` after successful navigation and
`"no_path"` when the planner cannot connect the start and destination.

## Program flow

```text
stationary range samples
          │
          ▼
SensorModel*.estimate_range()
    ├── estimate ──► compare with blocked_range_threshold_mm
    └── None ──────► use assume_blocked_without_range
                          │
                          ▼
             update observed feature in ArenaMap
                          │
                          ▼
                 OccupancyGrid ──► GridPlanner*
                                      ├── no path ──► stop; report "no_path"
                                      │
                                      └── path ──► waypoint goals
                                                       │
                                                       ▼
                                                NavigationController*
                                                       │
                                                       ▼
                                                Robot ──► XRP

* student implementation
```

## Work sequence

1. Keep all `USE_STUDENT_...` flags `False`. Run both virtual worlds and observe
   the stationary measurements in the Monitor's Range plot and the route
   actually driven in the world view. Program output reports the mission result
   and final pose.
2. Implement `SensorModel.estimate_range`. Select **Test components** and check
   valid odd and even sample counts, invalid values mixed with valid readings,
   too few usable readings, and values far from the other readings.
3. Set `USE_STUDENT_SENSOR_MODEL = True` in `course_setup.py` and repeat both
   virtual worlds. Calculate the median from the displayed usable readings and
   use the robot's route and result to check the expected open- or blocked-gate
   interpretation.
4. Select the earlier student components one at a time. Repeat both worlds
   after each selection so errors can be associated with measurement, map
   interpretation, planning, waypoint control, pose estimation, or wheel
   control.
5. Before a physical run, keep the XRP stationary and inspect several raw range
   readings at the intended start pose. Verify their units and the direction in
   which the sensor is aimed.
6. Match the physical gate, walls, start, and destination to the selected world.
   Then use the bounded course run procedure and record the range estimate,
   gate decision, path, result, and final pose.

`DeliveryMission` sends a zero-motion command while collecting range samples
and calls `robot.stop()` whether the mission completes, finds no path, or raises
an error.
