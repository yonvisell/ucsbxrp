# Tutorial 2: Virtual XRP drawing

Run a supplied square described as a sequence of motion segments. The path in
Monitor is the drawing. Then change one dimension and rerun it. This tutorial
introduces Python modules and classes through working code, including the small
form of inheritance used by course components.

Use the **Virtual XRP**. Open Monitor and select **Run** before editing; the
approximately 200 mm square should be visible in the course arena. Edit
only `student_work.py` after observing that baseline.

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

## Walkthrough 1: a motion-segment class

Read `DrawingSegment.__init__` and `DrawingSegment.command`.

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

## Walkthrough 2: inheritance used for a specialized segment

Read `TurnSegment.__init__`, which specializes the supplied working class.

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

## Experiment: build an ordered drawing

`build_drawing(...)` returns eight segments: four straight sides alternating
with four left turns. After the baseline run, edit `build_drawing(...)` in
`student_work.py`: change one pair of side lengths for a rectangle, or change
the constructed sequence for a three-sided path. Make one change at a time so
the result is legible. `main.py` remains supplied and read-only.

Use the values passed through the function parameters. The checks use more than
one square size, so fixed numerical replacements are not correct.

## Check and run

1. Open Monitor, reset the Virtual XRP, and select **Run**.
2. Confirm four visible sides, four left turns, and a zero final motor command.
3. Read `build_drawing(...)` and predict the order of segment names.
4. Change one side or the segment sequence in `student_work.py`, reset, and
   rerun. The current valid drawing runs even when it intentionally differs
   from the checked eight-segment square.
5. Compare the new path with your prediction. Each **Run** first reports how
   the current definitions differ from the baseline contract; restore the
   square before continuing.

`main.py` uses a nested loop: the outer loop visits each segment, and the inner
loop calls `Robot.step(...)` for `segment.steps` samples. `Robot.step()` already
maintains the sample schedule. Do not add `sleep()` or `sleep_ms()`; an extra
delay changes the measurement interval and robot motion.

The virtual motors respond gradually, so corners need not be mathematically
sharp. Reset before comparing two drawings so both begin from the same pose.

Continue with **Tutorial 3: Sampled robot programs** after the drawing runs.
