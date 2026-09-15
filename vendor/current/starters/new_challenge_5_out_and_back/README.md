# New Challenge 5 · Out-and-Back

## Task and setup

Follow a known lower outbound corridor to the observation pose, stop, observe
one uncertain named gate, update the map and plan the return home. The two
`world.json` cases place or remove the gate while preserving one mission map.
The observation pose faces the gate; geometry and sensor offset support the
550 mm decision threshold. A known far reflector behind home gives a valid
long reading when the gate is open; a timeout must never be interpreted as open.
Validate both physical observation distances and beam coverage first.

## What you implement

Carry the six core components forward. Complete SensorModel.estimate_range:
discard unusable readings and return the median only with enough valid samples.
Experiment with the short `mission_policy.py` classification rule. Explain why
missing evidence must not imply a clear route. No general occupancy mapping or
reactive obstacle-localization algorithm is required.

## Provided files and tools

`mission_steps.py` supplies bounded route following and path validation.
`main.py` exposes outbound, settling, observe, plan_return and return phases.
`challenge.py` names the route, gate, grid clearance, sample counts and bounds.
The selected virtual case supplies sensor measurements, not the classification
answer. The planner always receives a map updated from measured evidence.

## How the program runs

The robot takes the known outbound corridor, confirms low measured wheel speed
for 0.3 s, then collects seven stationary range readings. At least four usable
samples are required. It remains stopped while constructing the updated grid
and return path. A blocked gate changes the route; an open gate allows the
central return. Both legs have independent 120 s bounds.

`unusable_range`, `no_route`, `invalid_path`, `failed_stationary_check`, timeout
and failed-arrival outcomes are explicit. They stop without pretending the
mission completed. Planning cannot replace observation, and reaching home does
not prove every required outbound waypoint was reached.

## Complete the challenge

1. Recheck prior components and range filtering without motion.
2. Predict the classification and return route for each supplied world case.
3. Run both cases; record stationary samples, median, gate decision, route
   length, phase changes, return time and final pose.
4. Explain unusable-range and no-route behavior; use component fixtures for
   these cases before any physical trial.
5. Physical scoring requires correct outbound traversal, stationary observation,
   a valid collision-free return and arrival in the announced home tolerance.
   Rank successful return times measured from the first return command to the
   declared arrival condition. Publish total time separately; do not mix it
   with return time. Award partial credit for the last verified mission phase.


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
