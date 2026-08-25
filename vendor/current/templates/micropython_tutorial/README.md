# Python and MicroPython with the virtual XRP

This tutorial introduces the Python needed for UCSBXRP projects. It assumes no
previous Python experience. The seven lessons form one progression: first
calculate a robot motion, then represent a route, organize behavior, handle an
invalid setting, reuse a module, respond to a range measurement, and assemble
those ideas into a finite-state robot program.

Lessons 1 and 2 run calculations only. Lessons 3 through 7 move the virtual
XRP. Their commands and loops have explicit duration limits. Use the virtual
target for this tutorial; physical experiments begin with the course challenge
projects and the robot configuration measured for your XRP.

## Run a lesson

1. Confirm that the target selector says **Virtual XRP**.
2. Open the lesson file in the Project list.
3. Read the code from top to bottom and predict its output.
4. Select **Make main**. The `main` tag moves to that file.
5. Select **Run**. Run validates all Python files before starting the main file.
6. Read **Program output** and inspect the path in Monitor.
7. Select **Reset** before another robot lesson to return the virtual XRP to the
   start box.

Use **Validate** when you want to compile the whole project without running it.
Validation detects syntax errors, such as a missing parenthesis or incorrect
indentation. An error that occurs while the program is running appears in
Program output with the file and line number.

## Lesson sequence

| File | Python idea | Robot result |
| --- | --- | --- |
| `1_values_and_functions.py` | values, names, expressions, functions, arguments, and return values | calculates a requested average speed |
| `2_collections_and_loops.py` | lists, dictionaries, `for`, `if`, indexing, and accumulation | calculates the length of a route |
| `3_classes.py` | classes, objects, methods, and instance variables | executes a route made from motion-segment objects |
| `4_exceptions.py` | `raise`, `try`, `except`, and `finally` | rejects an invalid duration and leaves motor commands at zero |
| `5_modules.py` | modules, imports, and reusable functions | executes a route using `tutorial_helpers.py` |
| `6_virtual_robot.py` | repeated sensor readings, a threshold, and a time limit | approaches the wall and stops from ultrasound range |
| `7_finite_state_machine.py` | named states and explicit transitions | approaches, turns, departs, and stops |

`world.json` defines the tutorial field displayed by Monitor. The range target
is 620 mm in front of the start pose. Robot programs do not contain a second
copy of that geometry.

## Python essentials used here

### Values, names, and units

A value is data such as `600.0`, `"approach"`, or `True`. Assignment gives a
value a name:

```python
target_distance_mm = 600.0
state = "approach"
obstacle_detected = True
```

The principal built-in types in these lessons are:

- `int`: a whole number, such as `500` milliseconds;
- `float`: a number with a fractional part, such as `150.0` mm/s;
- `str`: text enclosed in quotes;
- `bool`: `True` or `False`;
- `list`: an ordered, changeable sequence enclosed in `[]`;
- `tuple`: an ordered, fixed sequence enclosed in `()`; and
- `dict`: named key-value entries enclosed in `{}`.

Variable names include units where that prevents ambiguity: `_mm`, `_mm_s`,
`_ms`, `_s`, or `_rad`. UCSBXRP distances use millimeters, speeds use
millimeters per second, time calculations use seconds, hardware time uses
integer milliseconds, and angles use radians.

Upper-case names such as `TIME_LIMIT_MS` identify settings intended to remain
constant during one run. Python does not enforce this convention.

### Expressions, decisions, and blocks

An expression produces a value. For example,
`distance_mm / duration_s` produces a speed. Comparisons such as
`duration_s <= 0.0` produce `True` or `False`.

`if`, `for`, `while`, `def`, `class`, `try`, and related statements introduce
an indented block. Four spaces are used for each indentation level. Indentation
is part of Python syntax and also shows which operations belong together.

Use a `for` loop when processing a known sequence. Use a `while` loop when
repetition ends because a measured condition changes. A robot `while` loop
also needs an independent time or iteration limit so a missing sensor event
cannot produce an endless run.

### Functions

A function gives a calculation or operation a name:

```python
def average_speed_mm_s(distance_mm, duration_s):
    if duration_s <= 0.0:
        raise ValueError("duration_s must be positive")
    return distance_mm / duration_s
```

`distance_mm` and `duration_s` are parameters. Values supplied in a call are
arguments. `return` ends the call and sends one result to the caller. Keeping a
function focused on one operation makes it easier to test with known inputs.

### Collections and loops

Lesson 2 represents each route segment with a dictionary and stores the
dictionaries in a list. The `for` loop processes each segment once. A running
total is an accumulator: it begins at zero and adds one value per iteration.

Use a dictionary when short names clarify related values of different kinds.
Use a list or tuple for an ordered sequence. In later course projects, records such as
`Pose` and `MotionCommand` provide fixed field names for values shared across
components.

### Classes and objects

A class defines the data and operations for one kind of object. In Lesson 3,
each `MotionSegment` object retains its name, drive command, and duration.
`__init__` initializes a new object. `self` is the particular object receiving
a method call.

The course uses classes for components whose state must persist between calls,
such as an odometry pose or the active navigation destination. A plain function
is preferable when no related state needs to persist.

### Exceptions and cleanup

An exception reports that an operation cannot produce a valid result.
`ValueError` is appropriate when an argument has the correct general type but
an invalid value. Lesson 4 deliberately supplies one negative duration so the
handling path is visible.

`try/finally` expresses cleanup that must occur whether the protected code
finishes normally or raises an exception. Every program that can command robot
motion ultimately returns the motor command to zero in a `finally` block. An
`except` block handles only an anticipated failure for which the program has a
defined response; unexpected exceptions should remain visible for debugging.

### Modules and imports

Every `.py` file is a module. Lesson 5 imports `drive_for` from
`tutorial_helpers.py`:

```python
from tutorial_helpers import drive_for
```

The helper keeps input checks and motor cleanup in one implementation. A
module should have one clearly stated responsibility and a short public interface.
Course component files follow the same rule: `odometry.py` updates pose, while
`navigation_controller.py` selects motion from pose and destination.

### Sensor feedback and finite-state programs

Lesson 6 repeats the same cycle: read range, compare with a threshold, command
motion, and stop when the threshold or time limit is reached. This is feedback:
the next action depends on a measurement of the current world.

Lesson 7 names four mutually exclusive modes: `APPROACH`, `TURN`, `DEPART`, and
`DONE`. The program performs the behavior for the current state, then assigns
the next state. A finite-state machine makes transitions visible and prevents
several phases from being active at once. Later, `NavigationController` uses
the same general structure for turning toward a destination, driving, and
aligning to a final heading.

## Suggested exercises

Make one change at a time, predict the result, Run, and compare the prediction
with Program output or Monitor.

1. Change `TARGET_TIME_S` in Lesson 1. Update the assertion to the expected
   speed rather than deleting the check.
2. Add a fourth positive segment to Lesson 2 and update the expected total.
3. Change one command or duration in Lesson 3 and describe the resulting path.
4. Change the invalid duration in Lesson 4 to a positive value. Determine which
   output disappears and how many safe segments complete.
5. Add one route tuple in Lesson 5 without changing `tutorial_helpers.py`.
6. Change `STOP_RANGE_MM` in Lesson 6 within 250–400 mm. Predict whether the
   final x position increases or decreases.
7. Add a second turn state to Lesson 7. Give it a distinct name and an explicit
   transition; retain a bounded duration and final `DONE` state.

After each exercise, confirm that the final drive command in Monitor is
`0.00 / 0.00`.

## Debugging method

1. Read the first error line and its file and line number.
2. Inspect names and indentation on that line and the line immediately above.
3. Check that every function receives the expected number of arguments.
4. Print an infrequent milestone while isolating a problem; do not print every
   control sample.
5. Use `assert` with a known result for a calculation.
6. Reset the virtual XRP before comparing two motion experiments.

Course projects additionally provide component checks, live watch values, and
recorded telemetry. These preserve repeatable evidence without filling Program
output with counters or per-sample print statements.

## MicroPython and standard Python

MicroPython implements Python for controllers with limited memory. The
language constructs in this tutorial are ordinary Python and also run in the
course MicroPython 1.28 runtime. Some desktop Python packages are not present
on the XRP. Robot projects use the modules bundled in the course release,
including `ucsb_xrp` and XRPLib, plus a small part of the standard library.

The virtual XRP runs the same project files in MicroPython against simulated
motors, encoders, range sensing, and time. It is not a rewritten JavaScript
version of the student program. The physical target changes the hardware
boundary, not the Python project structure.

## Continue into the course projects

The challenge projects replace timed drive segments with measured components
and the regular `Robot.step(...)` sample loop. Begin with Challenge 1 after the
tutorial. Its README identifies the files students implement, the supplied
services, the component checks, and the program flow.
