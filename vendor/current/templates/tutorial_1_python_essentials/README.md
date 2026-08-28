# Tutorial 1: Python essentials

This project introduces the Python used in UCSBXRP programs. It performs
robot-related calculations but does not move a virtual or physical robot.
Edit only `student_work.py`. The other files run and check your work.

## Work through the exercises

1. Open [`student_work.py`](student_work.py).
2. Complete one function at a time in the order shown.
3. Select **Check exercises** after each change. The checks do not start either
   robot.
4. Read **Program output**. Each exercise reports `PASS`, `NOT COMPLETED`, or
   `INCORRECT` and identifies the result that needs attention.
5. Select **Run** after all three exercises pass. [`main.py`](main.py) repeats
   the same software-only checks as one complete tutorial run.

The unfinished functions raise `NotImplementedError`. This is valid Python and
makes incomplete work explicit. Replace each `raise` statement with your own
implementation; do not change
[`exercise_checks.py`](exercise_checks.py) to make a result pass.

## Exercise 1: calculate average speed

Complete `average_speed_mm_s(distance_mm, duration_s)`. It must:

- return distance divided by duration, in millimeters per second;
- accept integer or decimal inputs; and
- raise `ValueError` when distance is negative or duration is not positive.

Function parameters are names for the inputs supplied by a caller. `return`
sends the calculated result back to that caller. A suffix such as `_mm_s`
states the unit of a value: millimeters per second.

## Exercise 2: total an ordered route

Complete `route_distance_mm(segment_distances_mm)`. The argument is a list or
tuple containing one distance for each route segment. Use a `for` loop and an
accumulator that begins at zero. Raise `ValueError` if any distance is negative.

A list is an ordered, changeable collection written with square brackets. A
tuple is an ordered, fixed collection written with parentheses. A `for` loop
processes each item once. The indented statements below the `for` line form the
loop body; Python uses indentation as part of its syntax.

## Exercise 3: interpret a range measurement

Complete `range_state(range_mm, stop_distance_mm)`. Return exactly:

- `"unavailable"` when `range_mm is None`;
- `"stop"` when a measurement is less than or equal to the stop distance; and
- `"clear"` otherwise.

Raise `ValueError` if the stop distance is not positive. This exercise uses
`if` and `return` to select one result. `None` means that no usable measurement
is available; it is not zero and it should not be compared with a distance.

## Python details used in this project

- Common value types are `int` (whole numbers), `float` (decimal numbers),
  `str` (text), `bool` (`True` or `False`), and `None` (no available value).
- Assignment gives a value a name: `distance_mm = 250.0`.
- An expression such as `distance_mm / duration_s` produces a value.
- Comparisons such as `distance_mm < 0` produce `True` or `False`.
- A function groups one calculation or decision behind a descriptive name.
- `raise ValueError(...)` reports an invalid input. The checks deliberately
  supply invalid values to verify that the function rejects them.
- A line beginning with `#` is a comment for a person reading the program.
  A string immediately inside a function is its documentation string, or
  docstring. Triple-quoted strings should not replace ordinary comments.

Python decimal calculations can have very small rounding differences. When a
calculated decimal is checked, compare it within a stated tolerance rather than
requiring exact equality.

## What the following tutorials add

- Tutorial 2 introduces a class, instance variables, lists of objects, and
  nested loops while the supplied runner draws a path with the Virtual XRP.
- Tutorial 3 introduces the measured `Robot.start()`, `Robot.step()`, and
  `Robot.stop()` program structure.
- Tutorial 4 introduces named behavior states, live parameters, watched values,
  and plot signals driven by measured robot state.

Each tutorial keeps the exercise code in `student_work.py` and checks it with
explicit software inputs before a robot run.

## Debugging method

Read the first reported file and line number. Inspect that line and the line
above it for spelling, parentheses, and indentation. Then run the focused
exercise checks again. An occasional `print(...)` can expose an intermediate
value, but printing every iteration obscures the calculation being inspected.

When all three exercises pass, create **Tutorial 2 · Virtual drawing** from the
project templates.
