# New Challenge 1 · Robot Curling

## Task and setup

Stop the marked axle-center reference at the `finish` waypoint in `world.json`,
starting from its initial pose. The default straight lane is 1000 mm long. A
physical instructor must mark the same reference point on the robot and floor.
Use a clear lane, measured calibration and an instructor-approved motion setup.

The lane can be translated or rotated. Set the initial heading to point along
the straight lane toward `finish`; the distance policy does not steer toward
an off-axis waypoint. `challenge.py` rejects a finish behind the robot or more
than 1 mm to either side of that heading before constructing the robot. The
reported estimated axle error is the planar distance to the actual `finish`
waypoint, independent of the lane's orientation.

## What you implement

Implement `SensorModel` and `WheelSpeedController`. First convert encoder
increments and elapsed time into distances and speeds; then characterize left
and right motors and implement bounded feedforward plus proportional feedback.
Keep wheel measurement, wheel-speed control and distance control separate.

The short `distance_policy.py` is working, editable code. It reduces requested
speed with remaining travel and never reverses after overshoot. Change its
cruise speed, approach gain or stop tolerance and explain the effect. Set
`USE_SUPPLIED_DISTANCE_POLICY=True` in `main.py` to compare the supplied
StraightLineController without changing wheel components. Integral/derivative
wheel control is optional; the current wheel update API does not supply dt.

## Provided files and tools

`course_setup.py` assembles selected components. `robot_config.py` holds robot
calibration and supplied distance-controller settings. `challenge.py` reads the
finish from `world.json` and defines the time and stationary-completion settings.
`main.py` applies the distance policy and checks rest.
The motor characterization demo provides a separate effort/speed experiment.

## How the program runs

Program time starts at `robot.start()`. The policy commands forward motion until
its distance condition; zero speed then remains latched. Stationary completion
requires both measured wheel speeds below 5 mm/s for 0.3 s. Elapsed time includes
that observation. A 30 s timeout and separate wheel-travel limit bound the run.
`stationary`, `timeout` and `travel_limit` are distinct results.

## Complete the challenge

1. Characterize each wheel; report surface, load and power conditions.
2. Test each component and enable its selector separately.
3. Compare the editable and supplied distance policies using measured plots.
4. Complete two recorded trials without changing calibration between them.
5. For physical scoring, measure radial axle-center error after rest and record
   heading. Publish the same start cue, minimum time, rest criterion and trial
   aggregation rule before competition. The default program minimum is 8 s;
   early stationary completion is reported and is not repaired by waiting.

Successful completion requires stationary result, minimum-time compliance and
the assigned accuracy tolerance. Report both trial errors and use their mean
for accuracy comparison; require two qualifying trials before time tie-breaking.
Virtual estimated error and program time support debugging, not physical judging.


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
