# Tutorial 1: Python essentials

Run four short, complete functions in `student_work.py`. This project does not
start either robot. It introduces the Python syntax used in the remaining
tutorials: values, functions, decisions, loops, and collections.

Start with **Run**. Program output immediately shows concrete results. Then keep
the instructions beside `student_work.py`, change one value or branch, and use
**Check examples** after each edit. You are modifying working code, not filling
an empty scaffold.

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

Read `average_speed_mm_s(distance_mm, duration_s)`, then try another input in
`main.py`.

```python
average_speed_mm_s(600.0, 4.0)  # returns 150.0
```

Return distance divided by duration. Reject a negative distance or a duration
that is zero or negative with `raise ValueError(...)`. A visible error is more
useful than a physically meaningless result.

## Example 2: choose from measured conditions

Read `range_state(range_mm, stop_distance_mm)`, then change the range printed by
`main.py` so that a different branch runs.

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

Read `route_distance_mm(segment_distances_mm)`, then add a route segment.

```python
route_distance_mm([120.0, 80.0, 50.0])  # returns 250.0
```

A list (`[...]`) and tuple (`(...)`) are ordered collections. Start a total at
`0.0`, use a `for` loop to visit each distance, and add it to the total. Reject
a negative segment. An empty route has a total distance of `0.0`.

## Example 4: return named results

Read `wheel_speed_summary(left_samples_mm_s, right_samples_mm_s)`, then change
one wheel-speed sample and predict which fields will change.

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

## Check and run

1. Select **Run** and read all four results in **Program output**.
2. Open `student_work.py` beside these instructions and trace one result back
   through its function.
3. Make one small change suggested above and predict the new result.
4. Select **Check examples**, then **Run** again.
5. Restore the supplied behavior before continuing if a check identifies a
   mismatch.

If Python reports a syntax error, inspect the stated line and the line above
it. Check indentation, parentheses, commas, colons, and spelling. A temporary
`print(...)` can reveal an intermediate value; remove repeated debug prints
after the function works.

Continue with **Tutorial 2: Virtual XRP drawing**.
