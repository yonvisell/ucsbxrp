# Challenge 5: Delivery Mission

The XRP begins facing the opening between two fixed walls. Use stationary
ultrasonic range measurements to determine whether that opening is blocked by
the changeable gate. The supplied mission then updates the map, plans a route,
and drives to the delivery point. Two outcomes are correct: complete the
delivery when a route exists, or stop and report that no route exists.

`challenge.py` constructs `DELIVERY_TASK`. Its named fields define the mission
without requiring values to be repeated elsewhere. Distances and range
measurements use millimeters:

- `initial_pose`, `arena`, and `destination` define the world and route
  endpoints;
- `grid_resolution_mm` sets the planning-cell side length, and `clearance_mm`
  sets the required space from boundaries and obstacles;
- `observed_feature_name` identifies the map feature changed by the ultrasonic
  observation;
- `range_sample_count` is the number of stationary measurements requested, and
  `minimum_usable_range_count` is the minimum number required for an estimate;
- `blocked_range_threshold_mm` is the largest estimated range interpreted as a
  blocked gate; and
- `assume_blocked_without_range` sets whether the observed feature is treated
  as blocked when no estimate can be calculated.

Read these fields through `DELIVERY_TASK`. Do not copy their current numerical
values into `sensor_model.py` or another component.

`WORLD` is the virtual case selected in the Monitor. It supplies the virtual
range reading and the displayed start and destination. `MISSION_MAP_WORLD_ID`
selects the one dimensioned map that defines the changeable feature's name and
location. `DeliveryMission` decides whether that feature is open or blocked
from the range estimate. Selecting a virtual case therefore changes the
measurement, not the decision inside the student program.

## Continue from the previous challenge

Open your Challenge 4 project and select **Create Challenge 5 · Delivery
Mission project**. Your new work is to complete `SensorModel.estimate_range(...)` in
the carried-forward `sensor_model.py`. The IDE creates a separate project,
carries forward all six component files from Challenge 4, and keeps whether
each supplied or student version is selected. Challenge 5 provides its own
task, worlds, main program, checks, and configuration. Your Challenge 4 folder
remains unchanged.

## What you implement

| File | Class | What it does |
| --- | --- | --- |
| `sensor_model.py` | `SensorModel` | Add a median range estimate from several ultrasonic readings while retaining the encoder methods completed earlier. |
| `grid_planner.py` | `GridPlanner` | Carried forward from Challenge 4; plans a connected route through free cells on the observed map. |
| `navigation_controller.py` | `NavigationController` | Carried forward from Challenge 4; converts each route goal and current pose into a motion request. |
| `odometry.py` | `Odometry` | Carried forward from Challenge 4; estimates pose from measured wheel travel. |
| `differential_drive.py` | `DifferentialDrive` | Carried forward from Challenge 4; converts robot motion requests into wheel-speed requests. |
| `wheel_speed_controller.py` | `WheelSpeedController` | Carried forward from Challenge 4; converts requested and measured wheel speeds into motor commands. |

### Implement `SensorModel.estimate_range`

`estimate_range(samples, minimum_usable)` receives a sequence of ultrasonic
range readings and the required number of usable readings. Input ranges and a
returned estimate are in millimeters. It returns `None` when no estimate can be
calculated. `minimum_usable` must be an integer of at least one.

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

## Provided files and tools

| File or tool | What it provides |
| --- | --- |
| `world.json` | Open-gate and blocked-gate virtual cases with the same walls, start, and destination. |
| `challenge.py` | The named `DeliveryTask` fields used by every stage of the mission. |
| `main.py` | Constructs `DeliveryMission`, runs it, and prints the mission result and final pose. |
| `robot_config.py` | Robot calibration and waypoint-controller settings. |
| `course_setup.py` | Selects the supplied or student version of each class independently. |
| `component_checks.py` | Runs small input/output examples without starting either robot. Program output describes each example, then reports PASS, NOT IMPLEMENTED, or FAIL. |
| `DeliveryMission` | Keeps the robot stopped while sampling, decides whether the gate is blocked, updates the map, plans and follows the route, and stops the robot before exit. |
| `ArenaMap` and `OccupancyGrid` | Represent the observed arena and the cells available for planning. |
| `GridPath.to_goals(...)` | Keeps cells where the path turns and at the destination, converts their centers to waypoint goals, and applies the requested final heading. |
| `Robot` and `XRPBot` | Supply measured robot state and isolate virtual or physical device access. |

`DeliveryMission.result` is `"delivered"` after successful navigation and
`"no_path"` when the planner cannot connect the start and destination.

## How the program runs

1. The robot remains stopped while it collects repeated ultrasonic readings.
2. Your `SensorModel.estimate_range(...)` returns the median usable range, or
   `None` if too few usable readings were received.
3. The supplied `DeliveryMission` compares a valid estimate with
   `blocked_range_threshold_mm`. If the estimate is `None`, it uses
   `assume_blocked_without_range` to choose the stated fallback.
4. The mission records the observation in `ArenaMap`, builds a new
   `OccupancyGrid`, and asks the selected `GridPlanner` for a route.
5. If no route exists, the mission leaves the robot stopped and reports
   `no_path`. Otherwise it converts the path to waypoint goals and the selected
   `NavigationController` and `Robot` follow them.

Your new work is the range-estimation method in `SensorModel`. The other
student components are carried forward from the earlier challenges.

## Complete the challenge

1. Create Challenge 5 from the completed Challenge 4 project as described above.
   Your carried-forward components keep their Challenge 4 selections.
   Run both virtual worlds and observe the stationary measurements in the
   Monitor's Range plot and the route actually driven in the world view. Program
   output reports the mission result and final pose.
2. Implement `SensorModel.estimate_range`. Select **Test components** and check
   valid odd and even sample counts, invalid values mixed with valid readings,
   too few usable readings, and values far from the other readings.
3. Select the student SensorModel in `course_setup.py` and repeat both virtual
   worlds. Calculate the median from the displayed usable readings, then check
   the gate decision, planned route, and mission result.
4. Select the carried-forward student components one at a time. Repeat both
   worlds after each selection so errors can be associated with range
   measurement, the gate decision, planning, waypoint control, pose
   estimation, or wheel control.
5. Before a physical run, keep the XRP stationary and inspect several raw range
   readings at the intended start pose. Verify their units and the direction in
   which the sensor is aimed.
6. Match the physical gate, walls, start, and destination to the selected world.
   Put the XRP on a stable stand with both wheels clear, select **Run**, verify
   wheel direction, then select **Stop** and verify that both wheels stop. Place
   the XRP at the marked start, run the mission in the cleared arena, and record
   the range estimate, gate decision, path, result, and final pose.

`DeliveryMission` sends a zero-motion command while collecting range samples
and calls `robot.stop()` whether the mission completes, finds no path, or raises
an error.
