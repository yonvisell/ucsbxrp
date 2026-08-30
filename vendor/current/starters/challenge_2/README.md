# Challenge 2: Turn and Return

## The challenge

Drive to the turn marker, rotate to its assigned heading, return to the marked
start region, and recover the initial heading. Compare the final pose estimated
from wheel travel with the robot's measured position and heading.

[`world.json`](world.json) defines the initial pose and turn marker.
[`challenge.py`](challenge.py) derives `INITIAL_POSE`,
`OUTBOUND_DISTANCE_MM`, `TURN_HEADING_RAD`, `RETURN_DISTANCE_MM`, and
`FINAL_HEADING_RAD`. It also names `MAX_STRAIGHT_TIME_S` and `MAX_TURN_TIME_S`,
which stop a phase that makes no progress. Use these names; do not repeat the
current distances or headings elsewhere.

## Reuse work in another challenge

Choose **Start another challenge…** in the IDE. Review the **Preserve**,
**Replace**, and **Add** lists before creating the separate project; they show
exactly which files will carry forward and which task files come from the
selected challenge. This project remains unchanged.

## What you implement

Implement two new classes:

- [`differential_drive.py`](differential_drive.py):
  `DifferentialDrive.wheel_speeds()` converts requested forward speed and
  counterclockwise turn rate into left and right wheel-speed targets. It uses
  `self.config.track_width_mm` and does not need history from earlier calls.
- [`odometry.py`](odometry.py): `Odometry.reset()` stores the initial world
  `Pose`; `Odometry.update()` advances it from measured left and right wheel
  increments; `pose` returns the latest estimate. Use measured wheel travel,
  not requested speeds, motor commands, or simulator ground truth.

If turn-and-return results expose a measurement or control problem, revise
`sensor_model.py` or `wheel_speed_controller.py` as needed. Keep the effective
track width and other robot-specific values in
[`robot_config.py`](robot_config.py).

## Project modules

| File | Role |
| --- | --- |
| [`sensor_model.py`](sensor_model.py) | Measures wheel travel and speed from encoder samples. |
| [`wheel_speed_controller.py`](wheel_speed_controller.py) | Converts wheel-speed error to limited motor commands. |
| [`differential_drive.py`](differential_drive.py) | Converts robot motion to two wheel-speed targets. |
| [`odometry.py`](odometry.py) | Estimates world position and heading from wheel travel. |
| [`robot_config.py`](robot_config.py) | Stores measured geometry, calibration, gains, and motion settings. |
| [`course_setup.py`](course_setup.py) | Selects the supplied class or the class defined in each named component file. |
| [`component_checks.py`](component_checks.py) | Calls the required methods of `SensorModel`, `WheelSpeedController`, `DifferentialDrive`, and `Odometry` without starting a robot. |

## Provided files and tools

- [`main.py`](main.py) runs outward travel, turnaround, return travel, and final
  heading recovery.
- `StraightLineController` controls each measured straight segment.
- `Robot` carries body-motion requests through wheel control, sensing, and
  odometry at each sample.

## How the program runs

```text
requested forward speed and turn rate
                 -> DifferentialDrive -> wheel-speed targets
                 -> wheel control     -> motor commands
encoder readings -> SensorModel       -> wheel increments
wheel increments -> Odometry          -> estimated Pose
```

`main.py` names each phase in Program output and uses the estimated pose to end
each turn. A phase that exceeds its visible time limit reports which motion did
not complete. Its `finally` block stops both motors on completion or error.

## Check each component

Select **Test components**. The checks load all four classes from their named
project files and do not move either robot. Read each class's `USE`,
`INPUT`, and `EXPECT` lines before its result:

- `PASS` means the implemented behavior matched the examples.
- `NOT IMPLEMENTED` means the named method still needs to be written.
- `FAIL` means the method ran but returned an incorrect value or behavior.

The new checks cover straight, curved, and in-place wheel relationships, plus
odometry reset, translation, rotation, and curved travel. Fix every unfinished
or failing result, repeat **Test components**, and then set the matching
`USE_STUDENT_*` flag to `True`.

## Complete the challenge

1. Run the supplied `DifferentialDrive` and `Odometry` on the virtual XRP and
   identify the outward, turnaround, return, and final-alignment phases.
2. Select the `DifferentialDrive` defined in `differential_drive.py`; compare
   each body-motion request with its two wheel-speed targets.
3. Select the `Odometry` defined in `odometry.py`; compare its pose with
   virtual ground truth. The program uses odometry, not ground truth.
4. Run the classes from all four component project files together and inspect
   final pose, wheel increments, requested turn rate, and the reported return
   position and heading errors.
5. On the physical course, record the estimated final pose and wheel travel,
   then measure final position and heading independently.
