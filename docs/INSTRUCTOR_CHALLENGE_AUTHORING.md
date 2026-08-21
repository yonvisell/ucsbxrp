# Creating a course challenge

The challenge-authoring tool starts from a working challenge, keeps the new
draft out of the student IDE, and publishes it only after its project files pass
the structural checks.

## 1. Create a draft

Choose the existing challenge with the closest program flow. For example:

```sh
python3 scripts/challenge_authoring.py create \
  --from challenge_5 \
  --id challenge_6 \
  --title "Multi-stop delivery" \
  --summary "Plan and execute a delivery route through several ordered stops."
```

This copies the complete source project to
`vendor/current/starters/challenge_6`, adds an unpublished catalog entry, and
marks the decisions that still require instructor judgment with `AUTHOR_TODO`.
The draft does not appear in the student IDE.

## 2. Define the task and evidence

Edit the files in this order:

1. `world.json`: set the millimeter bounds, initial pose, obstacles, start
   marks, and named waypoints. This file drives the simulator and Monitor.
2. `challenge.py`: load the world and define the remaining task parameters.
   Do not copy those numerical values into the README.
3. `main.py`: implement the complete mission with supplied components first.
4. Student component files and `course_setup.py`: expose only the components
   students are expected to implement and retain one independent selector per
   component.
5. `component_checks.py`: select the supplied checks that isolate those
   responsibilities. A check should accept more than one sound algorithm.
6. `README.md`: state the objective, each student implementation, supplied
   files, program flow, and the virtual/physical work sequence.

Run the draft on the virtual XRP with all supplied components before asking
students to implement any component. Then enable each student component
separately and confirm that its check detects a representative defect.

## 3. Check and publish

```sh
python3 scripts/challenge_authoring.py check challenge_6
python3 scripts/challenge_authoring.py publish challenge_6
npm run check:fast
```

`check` rejects unresolved author tasks, missing files or README sections,
Python syntax errors, malformed world bounds, duplicate world IDs, and an
unknown default world. `publish` repeats those checks and then makes the
challenge visible in the IDE catalog. The full project check remains necessary
because it also runs MicroPython, browser, commissioning, and offline-build
validation.
