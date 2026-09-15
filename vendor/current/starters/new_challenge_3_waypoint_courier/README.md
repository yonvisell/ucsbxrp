# New Challenge 3 · Waypoint Courier

## Task and setup

Visit the ordered goals in `world.json`, finishing at the final specified pose.
Return to the start only when it is explicitly the final goal. Before navigation,
complete `new_demo_odometry_calibration`: straight, arc, clockwise/counterclockwise
turns and a square, with independently measured endpoint error.

## What you implement

Carry SensorModel, WheelSpeedController and DifferentialDrive forward. Add
`Odometry` and `NavigationController`; keep LineFollower out of this project.
Odometry integrates measured wheel increments; navigation uses its Pose to
turn toward, drive to and, when requested, align at each goal. Work with one
goal before several. Gyro fusion and camera localization are optional later
extensions and are not inputs to the existing Odometry interface.

## Provided files and tools

`challenge.py` obtains the ordered route from `world.json`. `robot_config.py`
names navigation speeds and tolerances. `course_setup.py` provides independent
selectors for all five cumulative components. `main.py` independently observes
goal order and applies a 120 s timeout.

## How the program runs

Each Robot.step returns the next measured state. Navigation requests one body
motion at a time. A controller claiming completion early reports incomplete
route; reaching only the final point does not satisfy preceding goals.

## Complete the challenge

1. Test odometry with known wheel increments and wrapped headings.
2. Compare measured square endpoints before tuning navigation.
3. Verify one goal, turn direction, final heading and then the full route.
4. Record reached-goal count, final estimated pose and endpoint measurement.
5. Physical judging uses ordered passage of the axle-center reference within
   an announced waypoint radius and the announced final-heading tolerance.
   Taped markers make the criterion visible; identical markers do not provide
   automatic identity or full pose correction. Camera evidence is optional.

Score ordered goals and correct stopping first. Compare completion times only
among complete valid routes; report endpoint error and both trial outcomes.


## Implementation selection and reuse

False in `course_setup.py` selects a supplied component; True selects the class
in the named project file. **Test components** always exercises student files,
including those whose Run selector is False. NOT IMPLEMENTED is expected for a
new scaffold. Change one selector only after that class passes its examples.
Passing examples does not establish that the entire challenge is complete.

To continue previous work, select **Continue in another project…** in the IDE and review its
Preserve, Replace and Add choices. Keep the previous component files and robot
calibration; add newly introduced component files. The new project is a separate
folder. Review the selectors before running: opening a different project must
not silently discard earlier work or imply that unfinished classes are selected.

## Evidence and debugging

1. Compile; use Problems/compiler output to find the file and line.
2. Test one student component. Check input units, signs and the stated result.
3. Run with Virtual XRP. Read Program output for the result or traceback; use
   System log for connection, Run, Stop and Reset events.
4. Compare expected and measured signals in Monitor. Save the run and record the
   selected components, settings, world case and one conclusion in run notes.
5. Repeat after changing one parameter. Use Stop immediately if behavior differs
   from the intended bounded experiment. `finally` sends zero effort after normal
   completion or a Python exception. The target runtime handles the IDE's **Stop**
   separately; forced termination can bypass Python cleanup.

Coordinates and distances are mm, speed is mm/s, angles are rad, and turn rate
is rad/s. Positive heading is counterclockwise; positive body y is left.
`Robot.step()` applies effort using the previous measurement, waits until its
next sample, then samples and updates the state. Do not add a delay to its loop.
Estimated pose is not an independent physical measurement. Simulator truth is
available only as a labelled comparison in Monitor, never as controller input.
