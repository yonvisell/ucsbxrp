# Challenge 3: Waypoint Courier

## Objective

Program the XRP to visit three ordered world-coordinate goals. The first two
goals require position; the final goal also requires a heading of π radians.
The navigation controller must use the current odometry pose to decide when to
turn, drive, slow, advance to the next goal, align the final heading, and stop.

This challenge adds world-goal navigation to the four components developed in
Challenges 1 and 2. With all selection flags `False`, supplied components run
the complete route for inspection.

## Student implementations

| File | Class | Responsibility |
| --- | --- | --- |
| `navigation_controller.py` | `NavigationController` | Maintain the ordered goals and active goal; return the next `MotionCommand` from the latest `Pose`; report the active goal and completion state. |
| `sensor_model.py` | `SensorModel` | Continue the tested encoder measurement implementation. |
| `wheel_speed_controller.py` | `WheelSpeedController` | Continue the tested wheel-control implementation. |
| `differential_drive.py` | `DifferentialDrive` | Continue the tested inverse-kinematics implementation. |
| `odometry.py` | `Odometry` | Continue the tested pose-estimation implementation. |

The required goal semantics, state, method results, units, and tolerances are
documented under `NavigationController` in the **UCSB XRP API**.

## Supplied project files and services

| File or service | Use in this challenge |
| --- | --- |
| `main.py` | Starts the route, passes each new pose to navigation, sends the returned command to `Robot`, and stops in `finally`. |
| `challenge.py` | Defines the initial pose and ordered `NavigationGoal` values. |
| `robot_config.py` | Defines robot calibration plus cruise, approach, turn, and tolerance values. |
| `course_setup.py` | Selects every component independently and constructs the robot and navigator. |
| `component_checks.py` | Tests isolated component behavior without starting either robot. |
| `Robot` and `XRPBot` | Own the measured wheel-control loop, target interface, and hardware access. |

## Program flow

```text
challenge.py ROUTE
        │
        ▼
NavigationController* ◀────────────── Pose
        │ MotionCommand                 ▲
        ▼                               │
      Robot ── actuation components ── XRP
        ▲                               │
        └── SensorModel* → Odometry* ───┘

NavigationController state:
ordered goals + active goal + navigation mode + completion

* student implementation
```

## Work sequence

1. Continue the tested component files from Challenge 2.
2. Run the supplied route on the virtual XRP. Inspect each goal, pose, motion
   command, path segment, and final heading.
3. Implement `NavigationController`, then select **Test components**.
4. Set `USE_STUDENT_NAVIGATION_CONTROLLER = True` in `course_setup.py` and run
   the complete virtual route.
5. Select prior student components one at a time and repeat the route. Use the
   virtual odometry check and final pose to separate navigation errors from
   pose-estimation errors.
6. Run the complete selected implementation on the physical XRP and record the
   route, pose estimate, wheel speeds, and program output.

A goal whose `heading_rad` is `None` is complete at its position tolerance. A
goal with a numerical heading is complete only after both its position and
heading requirements are satisfied. After the final goal, `update()` returns
`STOP_COMMAND`.
