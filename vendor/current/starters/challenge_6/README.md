# Challenge 6: Range-Constrained Stopping

## The challenge

Approach the stationary wall and stop without crossing the marked exclusion
line. Use measured forward speed and filtered forward range to reduce the
requested speed as the available stopping distance decreases. Missing range
must produce a stopped command.

The ultrasonic measurement is the distance from the sensor origin to the
nearest reflecting surface along its forward cone. The virtual sensor origin
is 70 mm forward of the axle-center pose. `STOP_MARGIN_MM` and
`ABSOLUTE_CONTACT_GUARD_RANGE_MM` are therefore sensor-to-wall clearances, not
axle-center distances. The one-dimensional stopping model assumes a stationary
wall, an approximately cardinal straight approach, and a conservative lower
bound on braking deceleration; measure those quantities again before physical
use.

[`world.json`](world.json) defines the initial pose, wall, and stop markings in
three virtual cases. [`challenge.py`](challenge.py) defines the nominal speed,
stopping model, range window, and bounded run limits. Use those names rather
than copying their current values.

## Continue from Challenge 5

Open the completed Challenge 5 project and select **Continue to Challenge 6 ·
Range-Constrained Stopping…**. The new project carries forward all six earlier
component files and their selections. [`range_safety_controller.py`](range_safety_controller.py)
begins with the supplied `RangeSafetyController` selected. The Challenge 5
project remains unchanged.

## What you implement

Implement `RangeSafetyController.update()` in
[`range_safety_controller.py`](range_safety_controller.py). It receives:

- nominal requested forward speed in mm/s;
- measured forward speed in mm/s; and
- filtered forward range in mm, or `None`.

Return a nonnegative safe forward speed no greater than either the nominal
request or the configured speed limit. Return zero when no range estimate is
available or when the remaining range does not support continued motion.

One suitable stopping envelope is

`margin + speed * response_time + speed**2 / (2 * minimum_deceleration)`.

The required behavior, not this particular formula, defines the component.
`RangeSafetyControllerBase` validates and stores the four constructor settings
and states these requirements; your class implements only `update()`.

## Provided files and tools

- [`main.py`](main.py) collects stationary range samples before motion, runs a
  bounded sampled approach, sends stopped commands while the drivetrain
  settles, and always stops the motors in `finally`. Its visible
  `RangeMissionLimits` stops invalid output, caps excessive speed, stops at an
  explicit near-contact guard, and limits steps, elapsed time, and wheel
  travel. It deliberately does **not** implement a second stopping envelope or
  convert missing range into a successful stop: those are the student's task.
  Monitor shows the student output, the command actually applied, and its
  source on every sample; Program output names the condition that ended the
  run. The contact guard prevents continued wall loading but lies inside the
  scored exclusion margin, so an incorrect controller still fails visibly.
- `Robot`, the six earlier supplied components, and
  `SensorModel.estimate_range()` provide measurement and motion services.
- [`component_checks.py`](component_checks.py) tests the same range at different
  measured speeds, several response times, decelerations and margins, command
  bounds, and missing range without moving either robot.
- [`world.json`](world.json) provides **Near wall**, **Far wall**, and
  **No usable range** cases. The near and far cases request 120 mm/s and
  100 mm/s respectively, so a fixed range threshold does not solve both.

## How the program runs

```text
range samples -> range estimate
requested speed + measured speed + range estimate
              -> RangeSafetyController -> safe forward speed
              -> Robot -> new Measurements and Pose
```

## Complete the challenge

1. Select **Test components** and make every RangeSafetyController case pass.
2. Run the supplied controller in all three virtual worlds. The no-range case
   must remain stopped.
3. Select your controller and compare range, measured speed, safe speed, final
   range, and final pose.
4. Before physical motion, verify stationary range and motor direction. Use
   the explicit motion gate and the assigned bounded speeds and distances.
   Confirm the sensor origin, usable cone, wall face, stopping deceleration,
   and end-to-end response time; the virtual values are reference assumptions,
   not a physical calibration.
5. Report clearance and repeatability before elapsed time.
