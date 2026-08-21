# Challenge 1: Straight Run

## Objective

Program the XRP to travel 1000 mm in a straight line using measured wheel
motion. The target time is 8 s. The challenge separates two tasks: converting
encoder readings into usable wheel measurements, and using measured wheel speed
to command the motors. A supplied straight-line service decides when to slow
and stop from wheel travel.

The complete project runs with supplied components before student work is
selected. This provides a working behavior for inspecting the program flow and
telemetry.

## Student implementations

| File | Class | Responsibility |
| --- | --- | --- |
| `sensor_model.py` | `SensorModel` | Establish encoder/time origins; convert signed counts into exact wheel positions and increments; maintain regularized wheel-speed estimates. Range estimation is completed in Challenge 5. |
| `wheel_speed_controller.py` | `WheelSpeedController` | Convert target and measured wheel speeds into a bounded `DriveCommand`; command exactly zero when a wheel target is zero. |

The method signatures, inputs, state, outputs, and units are documented in the
**UCSB XRP API**. The supplied implementation is an example, not a prescribed
internal algorithm.

## Supplied project files and services

| File or service | Use in this challenge |
| --- | --- |
| `main.py` | Starts the robot, runs `StraightLineController`, reports completion, and stops the robot in `finally`. |
| `challenge.py` | Defines the initial pose, travel distance, and target time. |
| `robot_config.py` | Defines robot geometry/calibration and straight-line speeds and tolerances. |
| `course_setup.py` | Selects supplied or student components and assembles `Robot`. |
| `component_checks.py` | Tests each component in MicroPython without starting either robot. |
| `Robot` and `XRPBot` | Own the measured sample loop and the XRPLib hardware boundary. |
| `StraightLineController` | Produces forward motion commands from measured mean wheel travel. |
| Supplied `DifferentialDrive` and `Odometry` | Convert body motion to wheel targets and wheel increments to pose; students implement these in Challenge 2. |

## Program flow

```text
main.py
  └─ StraightLineController ── MotionCommand
                                │
                                ▼
     supplied DifferentialDrive ── target WheelSpeeds
                                │
                                ▼
     WheelSpeedController* ── DriveCommand ── XRP motors
                ▲                                  │
                │ measured WheelSpeeds             ▼
                └──────── SensorModel* ◀──── encoder counts + time
                              │
                              └─ wheel increments ── supplied Odometry

* student implementation
```

## Work sequence

1. Run the unchanged project on the virtual XRP and inspect wheel speed, target
   speed, drive command, wheel travel, and Program output.
2. Implement one student class.
3. Select **Test components**. A passing check confirms the stated isolated
   behavior; it does not replace the complete challenge run.
4. Set only that class's `USE_STUDENT_*` value to `True` in `course_setup.py`.
5. Run the complete challenge on the virtual XRP and compare target and
   measured wheel speed.
6. Repeat for the other class, then test the combined student implementation.
7. After virtual testing, run the same project on the physical XRP and use
   recorded telemetry to evaluate travel distance and time.

IDE Run begins immediately. A project launched directly on the XRP outside the
course service waits for the USER button. In both cases, `finally` returns the
motor command to zero.
