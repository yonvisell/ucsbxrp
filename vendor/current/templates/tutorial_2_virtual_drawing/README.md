# Tutorial 2: Virtual XRP drawing

Describe a square as a sequence of motion segments, then run it on the Virtual
XRP. The path in Monitor is the drawing. This tutorial introduces Python
modules and classes, then shows the small form of inheritance used by course
components.

Use the **Virtual XRP**. Edit only `student_work.py`. Its comments contain the
required values and one concrete example beside each exercise.

## The files used in this project

- `student_work.py` defines the segment classes and creates the drawing.
- `exercise_checks.py` checks those definitions without starting a robot.
- `main.py` imports your drawing and executes it as sampled robot commands.
- `course_setup.py` assembles the supplied robot components.
- `robot_config.py` contains named robot settings.
- `world.json` defines the space shown in Monitor.

Each `.py` file is a Python module. This statement in `main.py` loads a function
from `student_work.py`:

```python
from student_work import build_drawing
```

## How a class stores related data and behavior

A function performs one calculation. A class describes objects that retain
data and provide related operations. This complete example stores a name and a
distance, then reports whether that distance has been reached:

```python
class DistanceGoal:
    def __init__(self, name: str, target_mm: float) -> None:
        self.name = name
        self.target_mm = target_mm

    def is_reached(self, measured_mm: float) -> bool:
        return measured_mm >= self.target_mm
```

`__init__` runs when an object is created. `self` refers to that particular
object. Values stored as `self.name` and `self.target_mm` remain available to
its other methods.

## Exercise 1: define a motion-segment class

Complete `DrawingSegment.__init__` and `DrawingSegment.command`.

```python
segment = DrawingSegment("side 1", 100.0, 0.0, 35)
command = segment.command()
```

The initializer receives and stores:

- `name: str`, a nonempty label;
- `forward_speed_mm_s: float`;
- `turn_rate_rad_s: float`; and
- `steps: int`, a positive number of control samples.

Raise `ValueError` for an empty name, a nonpositive sample count, or a segment
whose forward speed and turn rate are both zero.

`command()` returns `MotionCommand(self.forward_speed_mm_s,
self.turn_rate_rad_s)`. `MotionCommand` is a UCSBXRP record with named fields. A
record carries data between parts of the program. A `DrawingSegment` also
retains how many samples should use that command.

## Exercise 2: inheritance used for a specialized segment

Complete `TurnSegment.__init__`.

```python
turn = TurnSegment("corner 1", 1.6, 49)
```

`TurnSegment(DrawingSegment)` inherits the stored fields, validation, and
`command()` method. Its initializer rejects a nonpositive turn rate, then calls
the parent initializer:

```python
super().__init__(name, 0.0, turn_rate_rad_s, steps)
```

The course component files use the same relationship: a student class inherits
the public methods and configuration of its supplied base class, then provides
the required calculation. Inheritance is useful here because the specialized
object is still a `DrawingSegment`; it is not required for ordinary helper
functions.

## Exercise 3: build an ordered drawing

Complete `build_drawing(...)`. Return a list or tuple containing eight segments:
four straight sides alternating with four left turns. Use a `for` loop that
adds one side and one corner during each of four iterations.

Use the values passed through the function parameters. The checks use more than
one square size, so fixed numerical replacements are not correct.

## Check and run

1. Open `student_work.py` and complete Exercise 1.
2. Select **Check exercises** and correct any `NOT COMPLETED` or `INCORRECT`
   result.
3. Complete Exercises 2 and 3, checking after each change.
4. Open Monitor, reset the Virtual XRP, and select **Run**.
5. Confirm four sides, four left turns, and a zero final motor command.

`main.py` uses a nested loop: the outer loop visits each segment, and the inner
loop calls `Robot.step(...)` for `segment.steps` samples. `Robot.step()` already
maintains the sample schedule. Do not add `sleep()` or `sleep_ms()`; an extra
delay changes the measurement interval and robot motion.

The virtual motors respond gradually, so corners need not be mathematically
sharp. Reset before comparing two drawings so both begin from the same pose.

Continue with **Tutorial 3: Sampled robot programs** after the drawing runs.
