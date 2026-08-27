# Challenge 5: Delivery Mission

## The challenge

Begin at the observation pose, collect repeated forward-range measurements,
decide whether the named map feature is blocked, and plan a delivery route for
the observed condition. The program reports `"delivered"` after successful
navigation or `"no_path"` when no route is available.

`world.json` contains the virtual observation cases, their shared geometry,
and the changeable feature. `challenge.py` loads the selected world and
constructs `DELIVERY_TASK`, which contains all range-decision, map, grid,
start, and destination values. Use the named fields in `DELIVERY_TASK`; do not
copy their current numerical values or obstacle coordinates into another file.

## Continue from Challenge 4

Open the completed Challenge 4 project and select **Continue to Challenge 5 ·
Delivery Mission…**. The new project carries forward all six component files
and their selections. Your new work extends the existing `SensorModel`; the
Challenge 4 project remains unchanged.

Project storage for new projects is configured in IDE **Settings**. Use **Open
project…** to reopen an existing project folder or **New project…** to create an
unrelated project from a template.

## What you implement

Implement `SensorModel.estimate_range(samples, minimum_usable)` in
`sensor_model.py`. The method examines one supplied sequence without changing
the wheel-measurement state:

- discard missing values, Boolean values, and numeric values that are not finite
  and positive;
- return `None` if fewer than `minimum_usable` readings remain; and
- otherwise return the median of the usable distances in millimeters.

A `None` result means that no estimate was available; it does not mean a range
of zero. The student-owned component files in this project are
`sensor_model.py`, `wheel_speed_controller.py`, `differential_drive.py`,
`odometry.py`, `navigation_controller.py`, and `grid_planner.py`. The earlier
methods in `sensor_model.py` and the other five component files remain your
pair's work. Your pair also maintains the measured and tuned values in
`robot_config.py`.

## Provided files and tools

- `DeliveryMission` coordinates stationary observation, selection of one map
  condition, planning, and navigation. It stops the robot on every exit.
- `challenge.py` constructs `DELIVERY_TASK` from the selected project world and
  the current mission settings.
- `world.json` defines the observable cases, destination, and named map
  feature.
- `main.py` runs `DeliveryMission` and prints its result and final pose.
- `course_setup.py` selects each carried-forward component independently.
  Change only the named `USE_STUDENT_*` flags after the matching checks pass.
- `component_checks.py` runs labeled component examples, including range
  estimation, without moving either robot.
- `ArenaMap`, `OccupancyGrid`, and `GridPath.to_goals()` connect the observed
  map condition to planning and navigation.

## How the program runs

1. `DeliveryMission` starts the robot at the task's initial pose and commands
   zero motion while requesting the assigned number of range samples.
2. `SensorModel.estimate_range()` reduces the sample sequence to a distance or
   `None`.
3. The mission uses that result and the task's decision settings to change only
   the named map feature.
4. It builds the occupancy grid and requests a path to the destination.
5. If no path exists, the mission reports `"no_path"` and remains stopped.
6. Otherwise, the carried-forward navigator and robot loop follow the route
   and the mission reports `"delivered"`.
7. The mission stops the motors after completion or error.

## Check the component

Select **Test components**. The checks use your component files without
starting the virtual or physical robot. Each range example describes its input,
the expected estimate or error, and the observed result.

- `PASS` means the result matched the example.
- `NOT IMPLEMENTED` identifies an unfinished method.
- `FAIL` identifies a differing estimate or behavior.

Inspect odd and even medians, mixed unusable readings, insufficient usable
readings, and invalid `minimum_usable` input. Fix every unfinished or failing
example, repeat **Test components**, and then select the student
`SensorModel` in `course_setup.py`.

## Complete the challenge

1. Run each virtual observation case with the supplied estimator. Record the
   stationary range values, driven route, mission result, and final pose.
2. Calculate the expected median of the usable readings and compare it with
   your `SensorModel` result.
3. Select your estimator and repeat every case. Confirm that the selected map
   condition follows the measured range rather than the virtual world's label.
4. Repeat with the other student components selected to distinguish sensing,
   planning, navigation, odometry, and wheel-control results.
5. Before physical motion, inspect stationary range values and sensor
   direction. Run the matched arena from its marked start and record the range
   values, driven route, mission result, and final pose.

Use **Open project…** to return to this project later. Use **New project…** only
when you intend to create a separate project from a course template.
