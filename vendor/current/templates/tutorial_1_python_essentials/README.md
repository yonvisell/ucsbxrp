# Tutorial 1: Python essentials

Complete four short functions in `student_work.py`. This project does not start
either robot. It introduces the Python syntax used in the remaining tutorials:
values, functions, decisions, loops, and collections.

Edit only `student_work.py`. Keep the instructions beside the code while you
work. Select **Check exercises** after each change; the result appears in
**Program output** with one example and a suggested next step.

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

## Exercise 1: calculate average speed

Complete `average_speed_mm_s(distance_mm, duration_s)`.

```python
average_speed_mm_s(600.0, 4.0)  # returns 150.0
```

Return distance divided by duration. Reject a negative distance or a duration
that is zero or negative with `raise ValueError(...)`. A visible error is more
useful than a physically meaningless result.

## Exercise 2: choose from measured conditions

Complete `range_state(range_mm, stop_distance_mm)`.

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

## Exercise 3: total a route with a loop

Complete `route_distance_mm(segment_distances_mm)`.

```python
route_distance_mm([120.0, 80.0, 50.0])  # returns 250.0
```

A list (`[...]`) and tuple (`(...)`) are ordered collections. Start a total at
`0.0`, use a `for` loop to visit each distance, and add it to the total. Reject
a negative segment. An empty route has a total distance of `0.0`.

## Exercise 4: return named results

Complete `wheel_speed_summary(left_samples_mm_s, right_samples_mm_s)`.

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

1. Complete one function in `student_work.py`.
2. Select **Check exercises**.
3. Read its example in **Program output**. `NOT COMPLETED` identifies a
   placeholder; `INCORRECT` shows the first mismatch.
4. Repeat until all four exercises pass.
5. Select **Run** to print example results from your completed functions.

If Python reports a syntax error, inspect the stated line and the line above
it. Check indentation, parentheses, commas, colons, and spelling. A temporary
`print(...)` can reveal an intermediate value; remove repeated debug prints
after the function works.

Continue with **Tutorial 2: Virtual XRP drawing**.
