# Challenge 5: Delivery Mission

## Objective

Complete the observation and delivery task defined by `DELIVERY_TASK` in
`challenge.py`. The XRP takes the specified stationary ultrasound readings,
combines the usable values, updates the named feature in its map, plans a route
to the destination, and follows that route. If no valid path exists, it reports
the result without attempting the delivery.

This challenge integrates sensing, map update, planning, navigation, odometry,
wheel control, and hardware access. The complete sequence runs with supplied
components before student implementations are selected.

## Student implementations

| File | Class | Responsibility in this challenge |
| --- | --- | --- |
| `sensor_model.py` | `SensorModel` | Complete `estimate_range(samples, minimum_usable)`: reject unusable values and return a robust estimate only when enough samples remain. Retain the tested wheel-measurement methods. |
| `grid_planner.py` | `GridPlanner` | Plan through the grid created from the observed map. |
| `navigation_controller.py` | `NavigationController` | Follow the planned goal sequence and satisfy the destination heading. |
| `odometry.py` | `Odometry` | Maintain the pose supplied to navigation. |
| `differential_drive.py` | `DifferentialDrive` | Convert each navigation command to wheel-speed targets. |
| `wheel_speed_controller.py` | `WheelSpeedController` | Convert target/measured speeds to bounded motor commands. |

The **UCSB XRP API** documents each class separately. The mission tests their
integration; it does not change the responsibility of any component.

## Supplied project files and services

| File or service | Use in this challenge |
| --- | --- |
| `world.json` | Defines the two visible gate conditions, shared arena, initial pose, named gate, and destination used by the simulator and Monitor. |
| `challenge.py` | Loads the world and defines the remaining `DeliveryTask` settings: planning grid, range sample count, and gate decision threshold. |
| `main.py` | Constructs `DeliveryMission`, runs it, and reports the mission result and final pose. |
| `robot_config.py` | Defines robot calibration and navigation values. |
| `course_setup.py` | Selects each supplied or student component independently. |
| `component_checks.py` | Tests range estimation, planning, and prior components without starting either robot. |
| `DeliveryMission` | Runs the observation → map update → planning → navigation sequence and always stops the robot. |
| `ArenaMap`, `OccupancyGrid`, and `GridPath` | Represent the observed world, planning grid, and route. |
| `Robot` and `XRPBot` | Run the measured loop and isolate direct hardware access. |

## Program flow

```text
stationary ultrasound samples
            │
            ▼
SensorModel*.estimate_range()
            │ estimate or None
            ▼
DeliveryMission updates named gate in ArenaMap
            │
            ▼
OccupancyGrid → GridPlanner* → GridPath or None
                                  │
                                  ▼
                         NavigationGoal sequence
                                  │
                                  ▼
                 NavigationController* ⇄ Robot → XRP

* student implementation
```

## Work sequence

1. Continue all tested component files from Challenge 4.
2. Run both virtual world cases: an open gate and a blocked gate. Inspect range
   samples, the resulting map state, planned route, mission result, and final
   pose.
3. Implement `SensorModel.estimate_range()` and select **Test components**.
   Test missing values, invalid values, too few usable samples, odd sample
   counts, and even sample counts.
4. Set `USE_STUDENT_SENSOR_MODEL = True` and run both virtual cases again.
5. Select each remaining student component. Repeat the mission after each
   change so a sensing, planning, navigation, odometry, or wheel-control error
   can be localized.
6. Run and record the complete selected implementation on the physical XRP in
   a matching arena. Compare the observed gate decision, route, final pose,
   range values, and Program output.

`range_mm=None` means that no usable range was returned; it is not a measured
distance of zero. `assume_blocked_without_range=True` makes a missing estimate
choose the conservative blocked-gate map for this task.
