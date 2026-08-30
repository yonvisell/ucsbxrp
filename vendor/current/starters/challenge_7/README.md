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
heading, and bounded run settings.

## Continue from Challenge 6

Open the completed Challenge 6 project and select **Continue to Challenge 7 ·
Wall-Range Pose Correction…**. The new project carries forward all seven
earlier component files and their selections. [`pose_corrector.py`](pose_corrector.py)
begins with the supplied `PoseCorrector` selected. The Challenge 6 project
remains unchanged.

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
methods; your class retains only the translation state.

## Provided files and tools

- [`main.py`](main.py) commands and verifies the known x and y cardinal
  headings, requires each wheel independently to settle, rejects observations
  outside the stated heading tolerance, applies the two corrections, navigates
  using corrected poses, and always stops in `finally`.
- The six earlier robot components and `NavigationController` are supplied by
  default. `RangeSafetyController` is carried forward from Challenge 6.
- [`component_checks.py`](component_checks.py) varies sensor offsets, wall
  coordinates and wall sides, exercises sequential x/y corrections and reset,
  verifies retained translation and heading, and rejects invalid range.
- [`world.json`](world.json) provides a complete localization station and a
  missing-y-reference failure case. The failure case stops before destination
  motion.

## How the program runs

```text
raw odometry Pose + known-wall range -> PoseCorrector -> corrected Pose
corrected Pose + destination         -> NavigationController -> Robot motion
```

## Complete the challenge

1. Pass the PoseCorrector component checks without moving either robot.
2. Run the supplied corrector in **Localization station** and compare raw and
   corrected poses before navigation. Program output reports both raw-odometry
   and corrected-pose residuals at the destination.
3. Confirm that **Missing y reference** reports an unavailable observation and
   stops.
4. Select your corrector and repeat the complete virtual route.
5. As an odometry-only comparison, temporarily feed `state.pose` rather than
   `corrected` to `navigation.update()`, repeat the virtual case, and compare
   its terminal residual with the supplied corrected-pose result.
6. Before a physical run, measure the ultrasonic origin and wall coordinates,
   verify both stationary ranges and cardinal alignments, and use the explicit
   bounded motion gate. The virtual wall faces and sensor offset are reference
   assumptions, not a physical calibration.
