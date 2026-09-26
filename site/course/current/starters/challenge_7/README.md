# Challenge 7: Wall-Range Pose Correction

## The challenge

At the localization station, collect one stationary range estimate while
facing the known x wall and one while facing the known y wall. Use those two
scalar observations to correct x and y in the odometry pose, then navigate to
the destination. Heading remains the odometry heading.

Here a wall coordinate denotes its near planar face in the world frame. Range
starts at the forward ultrasonic sensor origin, modeled 70 mm ahead of the
axle-center pose. `facing_positive_x` and `facing_positive_y` identify which
wall normal was deliberately selected; the scalar range does not infer that
identity. Supplied mission code accepts a sample only when both absolute wheel
speeds are at most 5 mm/s and the odometry heading lies within 0.10 rad
(approximately 5.7 degrees) of the independently commanded cardinal heading.

The virtual task deliberately initializes odometry with a translated position
error while the robot begins at the marked physical pose. [`world.json`](world.json)
defines the walls, start, scan marker, and destination. [`challenge.py`](challenge.py)
defines the odometry initial pose, wall coordinates, sensor offset, scan
headings, wall sides, observation settings, and terminal tolerances.

## Reuse work in another challenge

Choose **Reuse code in a new project…** in the IDE. Review **Preserve**,
**Merge robot calibration** (if shown), **Replace for the new task**, **Add**,
and **Leave in the source project** (if shown) before creating the separate
Project. The current Project remains unchanged.

## What you implement

Implement `PoseCorrector` in [`pose_corrector.py`](pose_corrector.py):

- `reset(raw_pose)` clears prior corrections;
- `observe_x(...)` uses a range to a known x-normal wall to correct x only;
- `observe_y(...)` uses a range to a known y-normal wall to correct y only; and
- `corrected_pose(raw_pose)` applies the retained translation while preserving
  the raw heading.

Wall identity, scan direction, and sensor offset are supplied. A wall-range
sample does not identify a landmark, estimate heading, or determine a complete
pose by itself.
`PoseCorrectorBase` validates the sensor offset and states the four required
methods; your class retains only the translation state. Import the base from
`ucsb_xrp.student_api` as shown in the starter.

## Provided files and tools

- [`main.py`](main.py) commands and verifies the known x and y cardinal
  headings, requires each wheel independently to settle, rejects observations
  outside the stated heading tolerance, applies the two corrections, navigates
  using corrected poses, verifies the corrected terminal position and raw
  odometry heading, and calls `robot.stop()` in `finally` after normal completion
  or a Python exception. The target runtime handles the IDE's **Stop** separately;
  forced termination can bypass Python cleanup.
- The robot components and `NavigationController` are selected independently
  in `robot_setup.py`.
- [`component_checks.py`](component_checks.py) varies sensor offsets, wall
  coordinates and wall sides, exercises sequential x/y corrections and reset,
  verifies retained translation and heading, and rejects invalid range.
- [`world.json`](world.json) provides a complete localization station and a
  missing-y-reference failure case. The failure case stops before destination
  motion. Both cases retain the full course arena. Their explicit
  `range_sensor.include_arena_boundary: false` setting makes only the drawn
  known-wall obstacles ultrasonic references; the arena edge remains a
  collision boundary but cannot masquerade as the deliberately removed y wall.

## How the program runs

```text
raw odometry Pose + known-wall range -> PoseCorrector -> corrected Pose
corrected Pose + destination         -> NavigationController -> Robot motion
```

## Complete the challenge

1. Pass the PoseCorrector component checks without moving either robot.
2. Run the supplied corrector in **Localization station** and compare raw and
   corrected poses before navigation. Program output reports the corrected
   residual and both terminal poses.
3. Confirm that **Missing y reference** reports an unavailable observation and
   stops.
4. Select your corrector and repeat the complete virtual route.
5. For an odometry-only comparison, temporarily change the
   `navigation.update(corrected)` call in `main.py` to
   `navigation.update(state.pose)`. Repeat the virtual case, compare terminal
   residuals, then restore `navigation.update(corrected)` before further runs.
6. Before a physical run, measure the ultrasonic origin and wall coordinates,
   verify both stationary ranges and cardinal alignments, and keep **Stop**
   available. The virtual wall faces and sensor offset are reference
   assumptions, not a physical calibration.
