# Challenge 4: Mapped Route

## Objective

Plan and execute a collision-free route through the arena defined in
`world.json`. `challenge.py` loads `ARENA_MAP`, `INITIAL_POSE`, and
`DESTINATION` from that world; `GRID_RESOLUTION_MM` and `CLEARANCE_MM` define
how it becomes a planning grid. These named values define the current task
instance. The planner must find a shortest four-neighbor path through free occupancy-grid
cells. The navigation controller then follows a compact set of world-coordinate
goals derived from that path.

This challenge adds grid planning to all previously implemented components.
With all selection flags `False`, supplied components plan and run the complete
route so map, grid, path, goals, and robot telemetry can be inspected.

## Student implementations

| File | Class | Responsibility |
| --- | --- | --- |
| `grid_planner.py` | `GridPlanner` | Return a shortest free four-neighbor `GridPath` from start to goal, including both endpoints; return `None` when either endpoint is invalid or no route exists. |
| `sensor_model.py` | `SensorModel` | Continue the tested wheel-measurement implementation. |
| `wheel_speed_controller.py` | `WheelSpeedController` | Continue the tested wheel-control implementation. |
| `differential_drive.py` | `DifferentialDrive` | Continue the tested body-motion to wheel-speed implementation. |
| `odometry.py` | `Odometry` | Continue the tested pose-estimation implementation. |
| `navigation_controller.py` | `NavigationController` | Continue the tested ordered-goal navigation implementation. |

The planner requirement does not prescribe a frontier data structure or a
tie-breaking rule. See `GridPlanner`, `OccupancyGrid`, and `GridPath` in the
**UCSB XRP API**.

## Supplied project files and services

| File or service | Use in this challenge |
| --- | --- |
| `world.json` | Defines the arena bounds, obstacle, initial pose, and destination marker used by the simulator and Monitor. |
| `challenge.py` | Loads the world geometry and defines the grid resolution and clearance. |
| `main.py` | Builds the occupancy grid, requests a path, converts it to navigation goals, runs the route, and reports no-path or completion. |
| `robot_config.py` | Defines robot calibration and navigation values. |
| `course_setup.py` | Selects each supplied or student component independently. |
| `component_checks.py` | Tests planning and prior component behavior without starting either robot. |
| `ArenaMap` and `OccupancyGrid` | Represent dimensioned geometry and convert it into free or blocked cells. |
| `GridPath.to_goals()` | Removes unnecessary intermediate straight cells and returns navigation goals at turns and the destination. |
| `Robot`, `XRPBot`, and supplied mission services | Execute the selected path through the measured robot loop. |

## Program flow

```text
ArenaMap + resolution + clearance
                │
                ▼
         OccupancyGrid
                │ start cell + goal cell
                ▼
          GridPlanner*
                │ GridPath or None
                ▼
       GridPath.to_goals()
                │ NavigationGoal sequence
                ▼
 NavigationController* ⇄ Robot + Odometry* → XRP

* student implementation
```

## Work sequence

1. Continue the tested component files from Challenge 3.
2. Run the supplied project on the virtual XRP. Inspect the map, grid scale,
   planned route, goal sequence, and final pose.
3. Implement `GridPlanner` and select **Test components**. Include tests for a
   direct path, a required detour, blocked endpoints, and no path.
4. Set `USE_STUDENT_GRID_PLANNER = True` in `course_setup.py`, then run the
   complete virtual challenge.
5. Select all prior student components and repeat. A valid grid path does not
   by itself prove that navigation and odometry execute it correctly.
6. Run the complete selected project on the physical XRP after the map and
   starting pose correspond to the physical arena.

Planning occurs before motor control begins. If `plan()` returns `None`, the
project reports that no route exists and does not construct or run the robot.
