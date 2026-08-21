# Challenge 2: Turn and Return

## Objective

Program the XRP to travel 500 mm, turn to a heading of π radians, and travel
500 mm back toward its starting location. The robot must convert a requested
body motion into separate wheel-speed targets and estimate its heading and
position from measured wheel travel.

This challenge adds differential-drive kinematics and odometry to the two
Challenge 1 components. The unchanged project runs with supplied components so
the full motion and telemetry can be inspected before student implementations
are selected.

## Student implementations

| File | Class | Responsibility |
| --- | --- | --- |
| `differential_drive.py` | `DifferentialDrive` | Convert forward speed and yaw rate in a `MotionCommand` into left/right target `WheelSpeeds` using track width. |
| `odometry.py` | `Odometry` | Maintain the planar `Pose`; integrate each pair of measured wheel-distance increments, including curved motion. |
| `sensor_model.py` | `SensorModel` | Continue the tested Challenge 1 wheel-measurement implementation. |
| `wheel_speed_controller.py` | `WheelSpeedController` | Continue the tested Challenge 1 wheel-control implementation. |

The **UCSB XRP API** states the inputs, maintained state, outputs, and method
requirements for all four classes.

## Supplied project files and services

| File or service | Use in this challenge |
| --- | --- |
| `main.py` | Executes outbound travel, a pose-feedback turn, and return travel; stops in `finally`. |
| `challenge.py` | Defines the initial pose, two travel distances, and target heading. |
| `robot_config.py` | Defines robot calibration, navigation speeds, and heading/position tolerances. |
| `course_setup.py` | Selects each supplied or student class independently and assembles `Robot`. |
| `component_checks.py` | Tests the four component classes without starting either robot. |
| `StraightLineController` | Produces the outbound and return forward commands from measured wheel travel. |
| `Robot` and `XRPBot` | Own sample timing, component calls, telemetry, and the hardware boundary. |

## Program flow

```text
main.py: outbound → turn to π → return
        │ MotionCommand
        ▼
DifferentialDrive* ── target WheelSpeeds ── WheelSpeedController*
                                                   │ DriveCommand
                                                   ▼
                                                XRP motors
                                                   │ encoder counts
                                                   ▼
SensorModel* ── wheel increments ── Odometry* ── Pose
      │                                      └─ used by turn loop
      └─ measured WheelSpeeds ── feedback to WheelSpeedController*

* student implementation
```

## Work sequence

1. Copy or continue the tested Challenge 1 implementations in this project.
2. Run the unchanged Challenge 2 project on the virtual XRP and inspect the
   expected path, heading, target/measured wheel speed, and drive command.
3. Implement either `DifferentialDrive` or `Odometry` and select **Test
   components**.
4. Set only its `USE_STUDENT_*` value to `True` in `course_setup.py`, then run
   the complete virtual challenge.
5. Implement and test the other new class. Run all selected student components
   together and inspect the virtual odometry check.
6. Run the same project on the physical XRP and compare final pose estimate,
   wheel travel, and the commanded sequence in recorded telemetry.

The simulator's true pose is shown only as a virtual comparison. Student code
and the physical XRP use the pose produced by `Odometry`.
