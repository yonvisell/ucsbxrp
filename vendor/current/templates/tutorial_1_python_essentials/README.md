# Tutorial 1: Python essentials

Complete five short calculations in `student_work.py`. This tutorial does not
start the Virtual XRP or a physical XRP. Its purpose is to establish the Python
syntax used in every later robot project.

Edit only `student_work.py`. The examples and instructions are repeated as
short comments beside the functions so you can work without keeping this file
open. `exercise_checks.py` supplies known inputs and reports a separate result
for each exercise. `main.py` only runs those checks; it does not contain a robot
demo.

## Type annotations

The function headers state the expected input and result types:

```python
def average_speed_mm_s(distance_mm: float, duration_s: float) -> float:
    return distance_mm / duration_s
```

The annotations after `:` describe the inputs. The annotation after `->`
describes the returned value. They improve code completion and make units and
data flow easier to inspect, but Python does not automatically reject a wrong
value. A function still checks invalid inputs explicitly when required.

Use the same style in later course code. Include units in names such as
`distance_mm`, `duration_s`, and `speed_mm_s`.

## Exercise 1: expressions, decisions, and functions

Complete `average_speed_mm_s(distance_mm, duration_s)`.

```python
speed_mm_s = average_speed_mm_s(600.0, 4.0)  # 150.0
```

Return distance divided by duration. Raise `ValueError` when distance is
negative or duration is zero or negative. A function receives values through
its parameters and sends one result back with `return`.

## Exercise 2: lists, tuples, and loops

Complete `route_distance_mm(segment_distances_mm)`.

```python
total_mm = route_distance_mm([120.0, 80.0, 50.0])  # 250.0
```

A list (`[...]`) and a tuple (`(...)`) are ordered collections. Use a `for`
loop to visit every segment and add it to an accumulator that begins at `0.0`.
Raise `ValueError` if any segment distance is negative. An empty route has a
total distance of `0.0`.

## Exercise 3: optional measurements

Complete `range_state(range_mm, stop_distance_mm)`.

```python
state = range_state(180.0, 250.0)  # "stop"
state = range_state(None, 250.0)   # "unavailable"
```

Return exactly:

- `"unavailable"` when `range_mm is None`;
- `"stop"` when the range is less than or equal to the stop distance; and
- `"clear"` otherwise.

Raise `ValueError` when the stop distance is not positive. `None` means that no
usable measurement is available; it is not a distance of zero.

## Exercise 4: dictionaries and paired data

Complete `wheel_speed_summary(left_samples_mm_s, right_samples_mm_s)`.

```python
summary = wheel_speed_summary([100.0, 120.0], [90.0, 110.0])
print(summary["mean_difference_mm_s"])  # 10.0
```

Reject empty inputs or inputs with different lengths by raising `ValueError`.
Otherwise return a dictionary with exactly these keys:

- `"sample_count"`;
- `"mean_left_mm_s"`;
- `"mean_right_mm_s"`; and
- `"mean_difference_mm_s"`, calculated as left mean minus right mean.

Use accumulators inside a loop. A dictionary groups values by descriptive keys;
square brackets retrieve a value from one key.

## Exercise 5: expected exceptions

Complete `parse_stop_distance_mm(text_value, fallback_mm)`.

```python
distance_mm = parse_stop_distance_mm("275.5", 240.0)  # 275.5
distance_mm = parse_stop_distance_mm("unknown", 240.0)  # 240.0
```

Convert the input with `float(text_value)`. If that conversion raises
`TypeError` or `ValueError`, return the positive fallback. Also return the
fallback when the converted value is zero or negative. Otherwise return the
converted positive distance.

Place only the conversion inside `try`. Catch only the two expected exception
types. An unrelated error should remain visible so it can be diagnosed.

## Check your work

1. Complete one function in `student_work.py`.
2. Select **Check exercises**.
3. Read **Program output**:
   - `PASS` means the examples for that function produced the required result;
   - `NOT COMPLETED` means its placeholder still remains; and
   - `INCORRECT` describes the first result or exception that differed.
4. Repeat until all five functions pass, then select **Run** once to run the
   complete software-only tutorial.

If Python reports a syntax error, inspect the stated line and the line directly
above it. Check indentation, parentheses, commas, colons, and spelling. Use a
temporary `print(...)` when one intermediate value is unclear; remove repeated
debug prints after the function works.

Continue with **Tutorial 2: Virtual XRP drawing** after all five exercises pass.
