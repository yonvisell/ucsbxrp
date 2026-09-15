# New Challenge 4 · Mapped Route

## Task and setup

Plan through the selected supplied map from start to destination. `world.json`
contains normal, shifted and unreachable cases. The default entrypoint is
motion-free: `EXECUTE_ROUTE=False` avoids creating either robot.

## What you implement

Add `GridPlanner.plan(grid, start, goal)` to the five prior student components.
Return a valid GridPath or None. For this equal-cost four-neighbor grid, BFS is
a useful baseline. An optional heapq A* comparison measures expanded cells;
both algorithms use the same edge costs. Do not require a particular tied path.

## Provided files and tools

`challenge.py` supplies map construction, 100 mm cells and 150 mm clearance.
Grid conversion already accounts for clearance; do not inflate twice.
`main.py` checks every path cell, endpoints and adjacency, rejects more than
1024 cells and prints the path. The planning-comparison demo runs without motors.

## How the program runs

The default prints `valid_path`, `no_path` or `invalid_path` and finishes.
After the checkoff, set `EXECUTE_ROUTE=True` for short virtual execution using
the chosen navigation components. Execution verifies final position/heading,
has a 120 s limit with motor cleanup in `finally`. Physical execution is optional.

## Complete the challenge

1. Draw the graph and predict a path before running the supplied comparison.
2. Implement frontier, visited/predecessor state and path reconstruction.
3. Check blocked/out-of-bounds endpoints, same start/goal and no-route cases.
4. Save the grid case, path, length, result and expanded-cell comparison.
5. Complete one short virtual execution after the motion-free checkoff.

Score valid paths and correct failure handling first. Award the announced
optimal-path criterion separately from implementation readability and evidence;
use search effort only as an extension comparison, not physical travel time.


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
