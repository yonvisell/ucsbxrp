# Tutorial 1: Python essentials

Run four short, complete functions in `student_work.py`. This project does not
start either robot. It introduces the Python syntax used in the remaining
tutorials: values, functions, decisions, loops, and collections.

Start with **Run** and read the results in **Program output**. Keep these
instructions beside the editable `student_work.py`; the supplied `main.py` is
read-only. Make one temporary expression or branch change in `student_work.py`
and run again. Each Run checks the four functions before printing the examples.

## Reading a function

```python
def average_speed_mm_s(distance_mm: float, duration_s: float) -> float:
    speed_mm_s = distance_mm / duration_s
    return speed_mm_s
```

- `def` begins a function.
- The values inside parentheses are its inputs.
- `return` sends one result back to the caller.
- The annotations after `:` and `->` document expected types. MicroPython does
  not enforce them, so your code must still handle invalid values deliberately.
- A name ending in `_mm`, `_s`, or `_mm_s` states its physical unit.

Indentation defines which statements belong to the function or to an `if` or
`for` block. Use four spaces for each indentation level.

## Example 1: calculate average speed

Read `average_speed_mm_s(distance_mm, duration_s)`, trace the supplied call from
read-only `main.py`, then predict the result for the second input below.

```python
average_speed_mm_s(600.0, 4.0)  # returns 150.0
```

Return distance divided by duration. Reject a negative distance or a duration
that is zero or negative with `raise ValueError(...)`. A visible error is more
useful than a physically meaningless result.

## Example 2: choose from measured conditions

Read `range_state(range_mm, stop_distance_mm)` and predict which branch each
supplied call below selects.

```python
range_state(180.0, 250.0)  # returns "stop"
range_state(None, 250.0)   # returns "unavailable"
```

Use `if`, `elif`, and `else` to return:

- `"unavailable"` when `range_mm is None`;
- `"stop"` when range is at or below the stop distance; and
- `"clear"` otherwise.

`None` means that no usable measurement is available. Check it before making a
numerical comparison. Reject a stop distance that is zero or negative.

## Example 3: total a route with a loop

Read `route_distance_mm(segment_distances_mm)`, then predict the total if another
route segment were added.

```python
route_distance_mm([120.0, 80.0, 50.0])  # returns 250.0
```

A list (`[...]`) and tuple (`(...)`) are ordered collections. Start a total at
`0.0`, use a `for` loop to visit each distance, and add it to the total. Reject
a negative segment. An empty route has a total distance of `0.0`.

## Example 4: return named results

Read `wheel_speed_summary(left_samples_mm_s, right_samples_mm_s)`, then predict
which fields would change if one wheel-speed sample changed.

```python
summary = wheel_speed_summary([100.0, 120.0], [90.0, 110.0])
print(summary["mean_difference_mm_s"])  # 10.0
```

Reject empty inputs or inputs with different lengths. Otherwise return a
dictionary with these four named results:

- `"sample_count"`;
- `"mean_left_mm_s"`;
- `"mean_right_mm_s"`; and
- `"mean_difference_mm_s"`, calculated as left mean minus right mean.

A dictionary groups related values under descriptive keys. This pattern is
used later for telemetry summaries.

## Run and observe

1. Select **Run** and read all four results in **Program output**.
2. Open `student_work.py` beside these instructions and trace one result back
   through its function.
3. Make one small expression or branch change in `student_work.py` and predict
   which check will identify it.
4. Select **Run** again and compare the result with your prediction.
5. Restore the supplied behavior before continuing if a check identifies a
   mismatch.

If Python reports a syntax error, inspect the stated line and the line above
it. Check indentation, parentheses, commas, colons, and spelling. A temporary
`print(...)` can reveal an intermediate value; remove repeated debug prints
after the function works.

## From MATLAB to the project files

| Python form | Meaning in this course |
| --- | --- |
| `samples[0]` | First sample; indices start at zero. |
| `range(4)` | Four values: 0, 1, 2, 3; the endpoint is excluded. |
| `distance_mm ** 2` | Squared value; `^` is not exponentiation. |
| `[1, 2] + [3]` | List concatenation, not vector addition. |
| `value is None` | Missing reading; never substitute a physical zero silently. |
| `if error_mm > tolerance_mm:` | Indentation defines the conditional block. |
| `self.previous_count = count` | Store state for the next call on this object. |
| `from robot_config import ROBOT_CONFIG` | Import a named value from a file. |

`=` assigns; `==` compares. Use `and`, `or` and `not` for scalar conditions.
Two names assigned the same list refer to the same mutable list; use `list(old)`
when an independent copy is intended. Modules replace a shared interactive
workspace: make inputs explicit and keep calibration in its named file. Run
creates fresh program objects; saved project files remain. Avoid NumPy-specific
operations in MicroPython. First change a working function, then one small class;
base classes supply an interface but do not implement its missing method.

## A complete edit–predict–check cycle

The four functions use the same units and missing-value rule that later robot
programs use. Work through this small data set before changing code:

| Expression | Calculation or decision | Expected result |
| --- | --- | --- |
| `average_speed_mm_s(450.0, 3.0)` | 450 mm ÷ 3 s | 150 mm/s |
| `range_state(None, 250.0)` | No usable reading | `"unavailable"` |
| `range_state(250.0, 250.0)` | Equality meets the stop threshold | `"stop"` |
| `route_distance_mm([80.0, 120.0, 50.0])` | Sum three segments | 250 mm |
| `wheel_speed_summary([100.0, 120.0], [90.0, 110.0])` | Mean left 110, mean right 100 | Mean difference 10 mm/s |

For one controlled edit, change `range_state` to use `<` instead of `<=` at
the threshold. Predict that the equality case changes from `"stop"` to
`"clear"`; then Run and locate the second check's `INCORRECT` line. Restore
`<=` and confirm four `PASS` lines. A failed check gives evidence about one
function. It does not mean the Virtual XRP moved: Tutorial 1 never starts a
robot.

For a second edit, change the route example in `main.py` from `[100.0,
150.0]` to `[100.0, 150.0, 25.0]`. Predict the printed total before Run: it
should rise from 250 to 275 mm. This is an experiment with supplied input
data; restore the original list afterward. Notice that the independent
`exercise_checks.py` still tests its own 250 mm example. This separates a
function's rule from one particular input.

If a check fails, read the first `INCORRECT` line and reproduce its specific
input. Inspect intermediate values with one temporary `print(...)`, then
remove it. If a numerical result is wrong, check units and parentheses before
changing the expected result. If a `None` case fails, check the missing-value
branch before doing arithmetic. Never replace a missing range with zero: zero
millimeters would falsely mean an obstacle at the sensor.

Continue with **Tutorial 2: Virtual XRP drawing**. It uses these same units
and comparisons on readings returned by a sampled robot.
