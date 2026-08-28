# Tutorial 2: draw with the Virtual XRP

This project uses a class, a list, and loops to describe a drawing. The
supplied [`main.py`](main.py) converts that description into sampled
virtual-robot motion. Edit only `student_work.py`; use the **Virtual XRP** target
for this tutorial.

The Monitor path acts like a pen that remains on the floor: every virtual
motion is visible. Reset the Virtual XRP before comparing two drawings.

## Work through the exercises

1. Open [`student_work.py`](student_work.py) and complete
   `DrawingSegment.__init__`.
2. Select **Check exercises** and resolve the first reported outcome.
3. Complete `build_drawing()` and run the checks again.
4. Select **Run**. If both exercises pass, the supplied runner executes the
   drawing in Monitor and stops the robot at the end.

The exercise checks inspect results, not a particular implementation. Do not
edit [`exercise_checks.py`](exercise_checks.py) to make a result pass. Each
check reports `PASS`, `NOT COMPLETED`, or `INCORRECT` and identifies the
exercise involved.

## Exercise 1: represent one segment with a class

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

## Exercise 2: build a square route

Complete `build_drawing()` so it returns a list or tuple with eight segments:
four straight sides alternating with four left turns. Use a `for` loop to add
one side and one turn per iteration.

Each side must have positive forward speed and zero turn rate. Each corner must
have zero forward speed and positive turn rate. Use positive, bounded step
counts; the complete route may contain at most 500 samples. The checks allow
different speeds and sizes, so long as the returned route describes this
structure.

A module is one `.py` file. `main.py` imports your class and function from the
`student_work` module. The runner then uses nested loops: the outer loop visits
each segment, and the inner loop holds its command for `segment.steps` sampled
updates.

## Inspect the result

Open Monitor before running. The World view should show four straight sides
with four in-place left turns between them. Real motors cannot change speed
instantaneously, so the shape need not have mathematically sharp vertices. The
final motor command must be zero.

The runner uses `Robot.step()` to maintain the sample schedule. Do not add
`sleep_ms()` to `student_work.py`: an extra delay would change the sample
interval used for speed estimation, control, and odometry.

When both exercises pass and the drawing runs, create **Tutorial 3 · UCSBXRP
robot programs** from the project templates.
