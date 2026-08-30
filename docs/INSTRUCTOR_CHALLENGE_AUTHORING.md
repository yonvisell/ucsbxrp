# Creating and publishing a UCSBXRP challenge

The [challenge creation wizard](../author/) produces a complete unpublished
project from a checked JSON specification. Select **Open draft in IDE** to
inspect, compile, run, and revise that project immediately. The project is a
browser draft until you save it to a Project folder in the IDE.

The same downloaded specification is the source for repository integration.
The repository tool copies the closest working challenge, generates the same
README and world, checks the project structure, and registers an unpublished
catalog entry. A draft does not appear in the student project list until an
instructor runs the separate publish command.

This workflow separates three decisions:

1. **Teaching design:** the robot task, student implementation boundary, and
   evidence students must collect.
2. **Executable project:** the Python files and `world.json` that implement the
   complete task with supplied components.
3. **Publication:** the explicit catalog change that makes a checked project
   available to students.

The [UCSBXRP instructor overview](../overview/) describes the runtime,
component boundaries, project structure, browser applications, and release
process used by the generated project.

## 1. Design the challenge in the wizard

### Select a proven program structure

Choose the published challenge whose mission flow is closest to the new task:

- Challenge 1 for measured straight travel;
- Challenge 2 for explicit straight and turn segments;
- Challenge 3 for ordered world-coordinate goals;
- Challenge 4 for a route through a known map; or
- Challenge 5 for stationary observation followed by planning and navigation;
- Challenge 6 for range-constrained forward motion;
- Challenge 7 for stationary known-wall pose correction;
- Challenge 8 for multi-stop route ordering; or
- Challenge 9 for local two-sensor line following.

The selected challenge supplies working Python, component selectors,
configuration, and component checks. It is a structural baseline, not a claim
that the new learning objective is equivalent to the existing challenge.
Select **Load this challenge's example world** when changing the structural
baseline; this replaces the world editor with geometry that satisfies the
names used by the copied `challenge.py`. Edit that geometry for the new task.

Use an ID of the form `challenge_N`. The ID is the stable folder and catalog
identifier. The title and summary are student-facing text.

### Define student work and evidence

The objective should state what the robot must do, which component or method
students implement, which condition they vary or compare, and what measured
result supports their conclusion.

Select only the components assessed in the new challenge. A retained component
may still be used by the project without being listed as new student work.
Describe each selected responsibility in terms of inputs, required result, and
state the implementation must maintain. Do not prescribe one algorithm unless
the algorithm itself is the learning objective. **Add another component**
supports a new file and class when a challenge introduces a responsibility not
covered by the existing six course components. For a genuinely new component,
give its `USE_STUDENT_...` selection flag and use the `files` overrides to
supply that Python module and coordinate its factory or selection in
`course_setup.py` plus its hardware-free examples in `component_checks.py`.
The specification is the source for the class, file, and selection flag; the
repository check verifies those declarations against the generated source.

Evidence items should name observable quantities and units. Suitable evidence
includes a saved path, final pose, wheel-speed plot, range samples, planned grid
path, program output, or a comparison between two controlled trials. Avoid
criteria that can be met only by a particular internal implementation.

### Define the supplied project

List every supplied file or service that students need to understand. Include
`world.json` and explain the purpose of its geometry. Write the program
sequence as short steps in execution order. Name the important data passed
between parts, but do not simulate a diagram with arrows or aligned text.

Refer to task settings by their Python names, such as `GRID_RESOLUTION_MM` or
`DELIVERY_TASK.range_sample_count`. Do not repeat the current numerical value
in the README unless that number is itself a fixed assignment requirement.
Keeping adjustable values in `challenge.py`, `robot_config.py`, or `world.json`
prevents the instructions from becoming inconsistent when an instructor tunes
the task.

`world.json` is the sole source for world bounds, initial pose, obstacles,
optional floor tracks, and markers. Distances use millimeters and headings use radians. The simulator and
Monitor read the same file that Python accesses through `load_world()`.

Use the visual world editor for ordinary changes. Select a world, then add or
move items on the measured grid. Selecting an item exposes its dimensions,
name, and label. Rectangle and line handles change size; the initial-pose
heading handle changes orientation. Grid snap is 25 mm by default and can be
set to 10, 50, or 100 mm, or turned off. The item list sets waypoint route
order. A world may be added, duplicated, deleted, or selected as the catalog
default; the final world cannot be deleted.

The editor does not move or crop geometry to make it fit. An item outside the
arena is an error. An initial XRP footprint that overlaps an obstacle is a
warning because the measured robot and course setup still determine whether
the starting arrangement is usable. **Advanced world.json** exposes the same
data for exact editing and optional extension fields. Graphic edits retain
fields that this release does not interpret. If the JSON is incomplete or
invalid, its text remains unchanged and the graphic editor stays unavailable
until the JSON is corrected.

Every world uses the fixed 3048 × 1219.2 mm course arena: x = -1524 to 1524 mm
and y = -609.6 to 609.6 mm. The visual editor shows these bounds read-only, and
the Advanced editor and publication command reject a different arena size.
Every initial pose, obstacle, and marker must lie within the course arena.
Obstacles are axis-aligned `block` or `wall`
rectangles. `start_line`, `start_box`, `finish_line`, and `finish_box` identify
visible task regions. `marker` adds a general labeled point. These five marker
types do not become navigation goals. A `waypoint` is both visible and available
to project Python through `ProjectWorld.waypoint()` and
`ProjectWorld.waypoints()`; it may add `heading_rad` when arrival orientation is
part of the task. Waypoints retain their file order. Marker names and
conditional obstacle `feature` names must be unique within a world.
By default, those same arena walls also reflect the virtual ultrasonic sensor.
For a controlled localization case in which only explicit obstacle faces are
range references, set `range_sensor.include_arena_boundary` to `false`. This
does not remove or resize the arena collision boundary.
The exact supported shapes are ordinary JSON. Instructors normally create them
with the visual editor; this reference is useful for review and extension:

```json
{
  "bounds": {
    "minimum_x_mm": -1524,
    "minimum_y_mm": -609.6,
    "maximum_x_mm": 1524,
    "maximum_y_mm": 609.6
  },
  "initial_pose": { "x_mm": -1200, "y_mm": -400, "heading_rad": 0 },
  "range_sensor": { "include_arena_boundary": true },
  "obstacles": [
    { "type": "wall", "minimum_x_mm": -500, "minimum_y_mm": -609.6, "maximum_x_mm": -450, "maximum_y_mm": 0 },
    { "type": "block", "feature": "gate", "minimum_x_mm": 100, "minimum_y_mm": -100, "maximum_x_mm": 200, "maximum_y_mm": 100 }
  ],
  "tracks": [
    {
      "type": "line",
      "name": "test_loop",
      "label": "Test loop",
      "width_mm": 18,
      "darkness": 1,
      "closed": true,
      "points": [
        { "x_mm": -500, "y_mm": -250 },
        { "x_mm": 500, "y_mm": -250 },
        { "x_mm": 500, "y_mm": 250 },
        { "x_mm": -500, "y_mm": 250 }
      ]
    }
  ],
  "markers": [
    { "type": "start_line", "x1_mm": -1100, "y1_mm": -450, "x2_mm": -1100, "y2_mm": -250 },
    { "type": "start_box", "minimum_x_mm": -1250, "minimum_y_mm": -500, "maximum_x_mm": -1050, "maximum_y_mm": -300 },
    { "type": "waypoint", "name": "turn", "label": "Turn", "x_mm": 400, "y_mm": 300, "heading_rad": 1.57 },
    { "type": "marker", "name": "inspect", "label": "Inspect", "x_mm": 800, "y_mm": 200 },
    { "type": "finish_line", "x1_mm": 1200, "y1_mm": -100, "x2_mm": 1200, "y2_mm": 100 },
    { "type": "finish_box", "label": "Finish", "minimum_x_mm": 1120, "minimum_y_mm": -150, "maximum_x_mm": 1320, "maximum_y_mm": 150 }
  ]
}
```

Each track is a polyline drawn on the floor and sampled by the virtual
reflectance sensors. `type` is `"line"`; `points` contains at least two
world-coordinate points; `width_mm` is positive; `darkness` is from 0 (light)
to 1 (dark); and `closed` joins the final point to the first. Tracks currently
use **Advanced world.json** rather than the graphic editor.

The optional `files` object maps project-relative names to complete replacement
text. Leave it empty to retain the copied working source. Use it when a new
mission needs a different `main.py`, task values, or component checks. The tool
rejects absolute paths, parent-directory paths, unsupported file types, and
Python syntax errors.

### Check the specification

The wizard checks required teaching fields, component descriptions, unique
world and geometry names, arena containment, the default world, and
file-override paths. Select **Open draft in IDE** after these checks pass. The
IDE receives the complete copied project, generated README, edited world, and
file overrides; it can therefore check the project structure, compile every
Python file, and run virtually before any repository files are changed.

The repository command additionally verifies that every
declared student file exists, defines the class named in the catalog metadata,
and has the corresponding selector in `course_setup.py`. README layout and
wording do not define project behavior. Download the JSON only after the page
reports that the specification is complete. Keep it with the generated project;
it is the concise source for future review or regeneration. Use **Open saved
specification** to resume editing a downloaded specification.

## 2. Open and test the unpublished project

Select **Open draft in IDE**. A new IDE tab opens the generated project without
replacing a remembered project folder. The draft contains:

- all files from the selected starting challenge;
- the README generated from the assignment fields;
- the exact `world.json` shown in the visual editor; and
- every complete file override in the specification.

Select **Compile**, then **Run** with the Virtual XRP. Use the Monitor to check
the world, robot behavior, telemetry, program output, and requested evidence.
If you want to retain the project outside the browser, select **Save to
folder…** in the IDE and give the project a new folder name inside the Working
folder. Editing the IDE draft does not modify the authoring specification; make
the same deliberate change in the wizard before downloading the final JSON.

## 3. Create the repository draft for publication

Move the downloaded specification into the repository, then run the command
shown by the wizard. For the included example:

```sh
python3 scripts/challenge_authoring.py create \
  --spec docs/examples/waypoint_slalom.challenge.json
```

The command validates the specification again, copies the selected challenge,
generates `README.md` and `world.json`, applies complete file overrides,
compiles every Python file, checks the project structure, and adds an
unpublished catalog entry with the component and selection metadata used by the
student template system. If any operation fails, the incomplete target folder
is removed and the catalog remains unchanged.

## 4. Validate the task and component boundary

Run:

```sh
python3 scripts/challenge_authoring.py check challenge_6
npm run check:fast
```

Then perform the functional review:

1. Run the complete challenge on the virtual XRP with all supplied components.
   Confirm that the task completes and the Monitor world matches `world.json`.
2. Confirm that each requested evidence item can be saved or read from the
   current Monitor and program output.
3. Select each assessed student component independently. Verify its documented
   inputs, result, state, and units with `component_checks.py`.
4. Insert one representative defect at a time and confirm that the relevant
   component check fails for the intended reason. Restore the working source
   after each trial.
5. Run the complete student component set on the virtual XRP. Confirm that the
   assignment permits more than one sound implementation.
6. For a physical challenge, run the supplied task on the physical XRP and
   record the release, project revision, calibration, and observed result.

The structural tool cannot establish reachable geometry, adequate controller
tolerances, meaningful evidence, physical repeatability, or the fairness of an
assessment boundary. Those require functional instructor review.

## 5. Publish

```sh
python3 scripts/challenge_authoring.py publish challenge_6
npm run check
```

`publish` repeats the project checks before changing the catalog entry. The
production build then includes the challenge in the student template list and
offline package. Commit the specification, generated project, catalog change,
tests, and documentation together.

## Complete working example: Waypoint Slalom

This variation retains the complete Challenge 3 mission structure and changes
only the route, assignment, and student-facing completion text. Students
implement `NavigationController`, execute the same alternating route at two
speeds, and compare path and pose evidence. It is not part of the current
five-challenge sequence.

The complete checked specification is
[`docs/examples/waypoint_slalom.challenge.json`](examples/waypoint_slalom.challenge.json):

```json
{
  "schema_version": 1,
  "source_id": "challenge_3",
  "id": "challenge_6",
  "title": "Waypoint Slalom",
  "summary": "Compare route accuracy at two speeds on an alternating waypoint course.",
  "objective": "Program the XRP to follow an alternating five-waypoint route, finish at the marked endpoint with heading zero, and compare route tracking at two cruise speeds. Students use the same NavigationController interface for both trials and explain the observed relationship between speed, turning, and final pose error.",
  "student_implementations": [
    {
      "file": "navigation_controller.py",
      "class_name": "NavigationController",
      "selection_flag": "USE_STUDENT_NAVIGATION_CONTROLLER",
      "responsibility": "Advance through the ordered goals and compute a bounded MotionCommand from the current Pose and active goal."
    }
  ],
  "supplied_files": [
    {
      "name": "main.py",
      "use": "Runs the route using the selected components and reports the final odometry pose."
    },
    {
      "name": "world.json",
      "use": "Defines the measured route, initial pose, waypoint order, and final heading used by the simulator and Monitor."
    },
    {
      "name": "challenge.py",
      "use": "Loads INITIAL_POSE and ROUTE from world.json without duplicating route coordinates."
    },
    {
      "name": "robot_config.py",
      "use": "Defines cruise_speed_mm_s and the navigation tolerances; the instructor assigns two values for separate trials."
    },
    {
      "name": "Robot",
      "use": "Runs the measured control loop and returns wheel measurements and the estimated pose."
    }
  ],
  "program_flow": "challenge.py loads the initial pose and ordered goals from world.json.\nmain.py passes the route to NavigationController and starts Robot.\nOn each sample, NavigationController uses the current Pose to return a MotionCommand.\nRobot converts the command to wheel targets, applies motor commands, reads encoders, and returns the next measured Pose.\nThe loop stops after NavigationController completes the final goal and heading.",
  "evidence": [
    "A Monitor path export for one route at each cruise speed, with the same world and starting pose.",
    "The final x, y, and heading estimate for each trial, reported in millimeters and radians.",
    "A short comparison that identifies where the higher-speed route departs most from the waypoint path."
  ],
  "work_sequence": [
    "Run the supplied route on the virtual XRP and identify the active waypoint, pose, and command at each turn.",
    "Implement NavigationController and run Test components before selecting it in course_setup.py.",
    "Run the complete route at the nominal cruise speed and export the path and final pose.",
    "Increase only cruise_speed_mm_s, repeat the route, and export the same evidence.",
    "Compare the two paths and explain the effect of speed using the measured pose and wheel-speed plots.",
    "Repeat the two trials on the physical XRP without changing the route geometry."
  ],
  "world": {
    "default_world": "waypoint-slalom",
    "worlds": [
      {
        "id": "waypoint-slalom",
        "label": "Waypoint slalom",
        "bounds": {
          "minimum_x_mm": -1524,
          "minimum_y_mm": -609.6,
          "maximum_x_mm": 1524,
          "maximum_y_mm": 609.6
        },
        "initial_pose": { "x_mm": 0, "y_mm": 0, "heading_rad": 0 },
        "obstacles": [],
        "markers": [
          { "type": "start_box", "minimum_x_mm": -80, "minimum_y_mm": -80, "maximum_x_mm": 80, "maximum_y_mm": 80, "label": "Start" },
          { "type": "waypoint", "name": "gate_1", "x_mm": 250, "y_mm": 180, "label": "1" },
          { "type": "waypoint", "name": "gate_2", "x_mm": 500, "y_mm": -180, "label": "2" },
          { "type": "waypoint", "name": "gate_3", "x_mm": 750, "y_mm": 180, "label": "3" },
          { "type": "waypoint", "name": "gate_4", "x_mm": 1000, "y_mm": -180, "label": "4" },
          { "type": "waypoint", "name": "finish", "x_mm": 1250, "y_mm": 0, "heading_rad": 0, "label": "Finish" }
        ]
      }
    ]
  },
  "files": {
    "main.py": "\"\"\"Waypoint Slalom: follow the alternating waypoint route.\"\"\"\n\nfrom challenge import INITIAL_POSE, ROUTE\nfrom course_setup import make_navigation_controller, make_robot\nfrom robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG\n\n\nrobot = make_robot(ROBOT_CONFIG)\nnavigation = make_navigation_controller(NAVIGATION_CONFIG)\ntry:\n    state = robot.start(INITIAL_POSE)\n    navigation.start(ROUTE)\n    while not navigation.is_complete():\n        state = robot.step(navigation.update(state.pose))\n    print(\"Waypoint Slalom complete\")\n    print(\"final_pose:\", state.pose)\nfinally:\n    robot.stop()\n"
  }
}
```

The generated source inherits `challenge.py` and applies the complete
`main.py` override from the specification:

```python
# challenge.py
from ucsb_xrp import load_world

WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
ROUTE = WORLD.waypoints()
```

```python
# main.py
"""Waypoint Slalom: follow the alternating waypoint route."""

from challenge import INITIAL_POSE, ROUTE
from course_setup import make_navigation_controller, make_robot
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG

robot = make_robot(ROBOT_CONFIG)
navigation = make_navigation_controller(NAVIGATION_CONFIG)
try:
    state = robot.start(INITIAL_POSE)
    navigation.start(ROUTE)
    while not navigation.is_complete():
        state = robot.step(navigation.update(state.pose))
    print("Waypoint Slalom complete")
    print("final_pose:", state.pose)
finally:
    robot.stop()
```

## Command-line creation without the wizard

The earlier scaffold remains available for a deliberately open-ended draft:

```sh
python3 scripts/challenge_authoring.py create \
  --from challenge_5 \
  --id challenge_6 \
  --title "Multi-stop delivery" \
  --summary "Plan and execute a delivery route through several ordered stops."
```

This inserts `AUTHOR_TODO` markers in `README.md`, `challenge.py`, `main.py`,
and `world.json`. The project cannot be published until every marker is
resolved.
