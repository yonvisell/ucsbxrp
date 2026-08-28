# Tutorial 2: draw with the Virtual XRP

This is the first robot-running tutorial. It uses UCSBXRP records, a small data
object, one directly relevant use of inheritance, a list, and loops to describe
a drawing. The supplied [`main.py`](main.py) converts that description into
sampled virtual-robot motion. Edit only `student_work.py`; use the **Virtual
XRP** target for this tutorial.

The Monitor path acts like a pen that remains on the floor: every virtual
motion is visible. Reset the Virtual XRP before comparing two drawings.

## Work through the exercises

1. Open [`student_work.py`](student_work.py) and complete the
   `DrawingSegment` initializer and `command()` method.
2. Select **Check exercises** and resolve the first reported outcome.
3. Complete `TurnSegment.__init__`, then complete `build_drawing(...)`.
4. Select **Run**. If all three exercises pass, the supplied runner executes the
   drawing in Monitor and stops the robot at the end.

The exercise checks inspect results, not a particular implementation. Do not
edit [`exercise_checks.py`](exercise_checks.py) to make a result pass. Each
check reports `PASS`, `NOT COMPLETED`, or `INCORRECT` and identifies the
exercise involved.

## A complete class and inheritance example

This example describes timed indicator lights, not drawing segments:

```python
class TimedLight:
    def __init__(self, color, duration_s):
        self.color = color
        self.duration_s = duration_s


class WarningLight(TimedLight):
    def __init__(self, duration_s):
        super().__init__("amber", duration_s)


warning = WarningLight(2.0)
print(warning.color, warning.duration_s)  # amber 2.0
```

`WarningLight` inherits both stored fields from `TimedLight`.
`super().__init__(...)` calls the parent initializer with the fixed color and
the duration supplied by the caller.

## Exercise 1: connect a data object to a UCSBXRP record

UCSBXRP passes related values in records with named fields. `Pose` contains
`x_mm`, `y_mm`, and `heading_rad`. `MotionCommand` contains
`forward_speed_mm_s` and `turn_rate_rad_s`. The runner constructs a `Pose` for
the initial robot state. Your `DrawingSegment.command()` method must return a
`MotionCommand` containing the segment's two command values.

A record groups named values so one function can pass them to another. A data
object stores values between method calls and provides operations through its
methods. Neither determines robot timing or touches hardware by itself.

First complete `DrawingSegment.__init__`, then complete `command()`.

`DrawingSegment` represents one constant command held for a whole number of
samples. Its initializer receives:

- `name`: short text identifying the segment;
- `forward_speed_mm_s`: forward speed in millimeters per second;
- `turn_rate_rad_s`: yaw rate in radians per second; and
- `steps`: a positive integer number of control samples.

Store those four values in instance variables with the same names. Reject an
empty name, a nonpositive number of steps, and a segment with both speed and
turn rate equal to zero by raising `ValueError`.

A class defines the data and operations for one kind of object. `__init__`
initializes a new object, and `self` is the particular object receiving the
method call. This class retains values that belong together; it does not run
the robot.

## Exercise 2: specialize a segment through inheritance

`TurnSegment(DrawingSegment)` means that `TurnSegment` inherits the stored
fields, validation, and `command()` method of `DrawingSegment`. Complete its
initializer so that it calls `super().__init__(...)` with zero forward speed,
the supplied positive turn rate, and the supplied sample count. Reject a turn
rate that is zero or negative.

This is the inheritance pattern used later by course component classes: a
small subclass has the methods and stored fields defined by its base class and
adds the course-specific calculation. It is not a reason to create a class for
every function or value.

## Exercise 3: build a square drawing

Complete
`build_drawing(side_speed_mm_s, side_steps, turn_rate_rad_s, turn_steps)` so it
returns a list or tuple with eight segments: four straight `DrawingSegment`
sides alternating with four `TurnSegment` left turns. Use a `for` loop to add
one side and one turn per iteration.

Each side must use the supplied `side_speed_mm_s` and `side_steps`. Each corner
must use the supplied `turn_rate_rad_s` and `turn_steps`. The complete route
contains `4 * (side_steps + turn_steps)` samples. Raise `ValueError` if that
value exceeds 500; the segment initializers already reject nonpositive or
invalid values. The checks call the function with two different sets of named
arguments, so do not replace the parameters with fixed values.

A module is one `.py` file. `main.py` imports your class and function from the
`student_work` module. The runner supplies the square settings by name. Its
turn setting requests approximately 90 degrees at the 20 ms sample period.
The outer loop visits each segment, and the inner loop holds its command for
`segment.steps` sampled updates.

## Inspect the result

Open Monitor before running. The World view should show four straight sides
with four in-place left turns between them. Real motors cannot change speed
instantaneously, so the shape need not have mathematically sharp vertices. The
final motor command must be zero.

The runner uses `Robot.step()` to maintain the sample schedule. Do not add
`sleep_ms()` to `student_work.py`: an extra delay would change the sample
interval used for speed estimation, control, and odometry.

When all three exercises pass and the drawing runs, create **Tutorial 3 · UCSBXRP
robot programs** from the project templates.
