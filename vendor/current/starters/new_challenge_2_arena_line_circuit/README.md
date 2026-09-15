# New Challenge 2 · Arena Line Circuit

## Task and setup

Follow the dark circuit in `world.json` once in the prescribed direction. Retain
Challenge 1's sensor model, wheel controller and robot calibration. First use
the no-motion reflectance calibration demo to distinguish floor and tape on
each sensor. Virtual sensor geometry is provisional: 55 mm forward, 12 mm left
and right; the world contains an 18 mm line and 50 mm finish bar. Qualify the
actual physical sensor position, tape width and surface before setting thresholds.

## What you implement

Add `DifferentialDrive` and `LineFollower`. DifferentialDrive converts forward
speed v and turn rate w to left/right targets using track width. LineFollower
uses left/right reflectance and measured `dt_s` to return MotionCommand. Start
with proportional steering; then compare derivative and integral terms with
explicit limits. `kp_rad_s`, `ki_rad_s2` and `kd_rad` in `robot_config.py` expose
the PID units. LineFollower is local to this challenge, not a later prerequisite.

## Provided files and tools

`course_setup.py` independently selects SensorModel, WheelSpeedController,
DifferentialDrive and LineFollower. Odometry is supplied for lap qualification.
`lap_progress.py` defines four ordered checkpoints; `main.py` supplies line-loss
handling and the finish detector. Edit `world.json` and the checkpoint geometry
together if the course layout changes.

## How the program runs

Every sample requests reflectance. The steering controller uses local line
signals; estimated pose only qualifies ordered checkpoint progress. A finish
bar counts only after all four checkpoints. Returning across the start bar
immediately cannot count as a lap. Both sensors losing the line commands zero
immediately; 0.4 s without reacquisition reports `line_lost`. Missing reflectance
and a 100 s timeout are distinct stopped results. Reposition only after Stop.

## Complete the challenge

1. Preserve and test the earlier student components; add kinematics tests for
   straight, left/right in-place and combined forward/turn commands.
2. Capture floor/tape readings; distinguish calibration from PID tuning.
3. Implement LineFollower and inspect turn sign, bounds and reset behavior.
4. Complete two qualified laps. Record raw readings, line error, settings and
   checkpoint progress; count every failed trial instead of discarding it.
5. Physical judging independently checks course order, line retention and full
   finish crossing. Rank two clean completions by mean time; publish the same
   start/finish geometry and timing cue for every team. Program odometry alone
   cannot certify the physical course or replace external judging.


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
