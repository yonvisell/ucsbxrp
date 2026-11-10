var e=[{release_id:`2026.11-dev.102`,date:`2026-11-10`,migration_markdown:`# Migration instructions for this release 2026.11-dev.102

1. Open your existing **Challenge 3 - Waypoint Courier** project.
2. Select **Migrate Challenge 3** below the Project name when that button appears.

The migration preserves your original files in an **original-** folder in your Working folder. Files needing manual transfer are identified in the result.

Projects that already use the current template need no migration. To install the physical XRP recording fix, run **Robot Setup**.

<details>
<summary>Manual instructions for older Projects</summary>

The automatic migration supports Projects from dev89 and dev91–94. For older Projects, use these instructions with your instructor.

Create a new **Challenge 3 - Waypoint Courier** project.

**For whichever of the code you have completed, copy as follows into the new project:**

1. Your sensor_processor.py in full
2. Your differential_drive.py in full

**Into navigation_controller.py:**

3. Your distance_to_goal() and heading_error()
4. Your steering-gain constant (K_Heading)
5. Your steering-rate code in TurnToGoal.execute().
6. Your steering-rate calculation in DriveToGoal.execute().
7. Your steering-rate calculation in AlignAtGoal.execute().

You must perform "Robot Setup" with this release.

</details>
`,changes:[`Project migration, opening and file operations remain available while Virtual XRP downloads. Run still waits for Virtual XRP to be ready.`,`Physical Challenge 3 shows a bold AprilTag registration reminder in Program output and in the start-position dialog when camera based GPS is enabled and the selected robot has no saved tag assignment. Run remains available.`,`Physical XRP retains the final page of recorded samples when a program ends during a telemetry request. Run Robot Setup to install this recording fix. Project files do not need migration for this fix.`]},{release_id:`2026.11-dev.101`,date:`2026-11-10`,migration_markdown:`# Migration instructions for this release 2026.11-dev.101

1. Open your existing **Challenge 3 - Waypoint Courier** project.
2. Select **Migrate Challenge 3** below the Project name when that button appears.

The migration preserves your original files in an **original-** folder in your Working folder. Files needing manual transfer are identified in the result.

Projects that already use the current template need no migration. For physical XRP, complete **Robot Setup** if the app requests it.

<details>
<summary>Manual instructions for older Projects</summary>

The automatic migration supports Projects from dev89 and dev91–94. For older Projects, use these instructions with your instructor.

Create a new **Challenge 3 - Waypoint Courier** project.

**For whichever of the code you have completed, copy as follows into the new project:**

1. Your sensor_processor.py in full
2. Your differential_drive.py in full

**Into navigation_controller.py:**

3. Your distance_to_goal() and heading_error()
4. Your steering-gain constant (K_Heading)
5. Your steering-rate code in TurnToGoal.execute().
6. Your steering-rate calculation in DriveToGoal.execute().
7. Your steering-rate calculation in AlignAtGoal.execute().

You must perform "Robot Setup" with this release.

</details>
`,changes:[`Challenge 3 Projects from the supported November releases can migrate directly in the browser. The action appears below the selected Project name only when applicable.`,`Migration preserves student calculations, independent gains and calibration; backs up all original Project files; and retains the existing Project and Git repository paths. Unfinished code does not need to compile.`,`Current Projects need no migration. This browser update does not require another Robot Setup on units already running compatible software.`]},{release_id:`2026.11-dev.100`,date:`2026-11-09`,migration_markdown:`# Migration instructions for this release 2026.11-dev.100

Create a new **Challenge 3 - Waypoint Courier** project.

**For whichever of the code you have completed, copy as follows into the new project:**

1. Your sensor_processor.py in full
2. Your differential_drive.py in full

**Into navigation_controller.py:**

3. Your distance_to_goal() and heading_error()
4. Your steering-gain constant (K_Heading)
5. Your steering-rate code in TurnToGoal.execute().
6. Your steering-rate calculation in DriveToGoal.execute().
7. Your steering-rate calculation in AlignAtGoal.execute().

You must perform "Robot Setup" with this release.
`,changes:[`Physical XRP reads each Python module into memory before importing it. This reduces filesystem activity during startup and addresses intermittent import failures in files that compiled successfully. Syntax errors still report normally.`,`Robot Setup installs the updated robot runtime. Challenge 3 project files and migration steps are unchanged.`]},{release_id:`2026.11-dev.99`,date:`2026-11-09`,migration_markdown:`# Migration instructions for this release 2026.11-dev.99

Create a new **Challenge 3 - Waypoint Courier** project.

**For whichever of the code you have completed, copy as follows into the new project:**

1. Your sensor_processor.py in full
2. Your differential_drive.py in full

**Into navigation_controller.py:**

3. Your distance_to_goal() and heading_error()
4. Your steering-gain constant (K_Heading)
5. Your steering-rate code in TurnToGoal.execute().
6. Your steering-rate calculation in DriveToGoal.execute().
7. Your steering-rate calculation in AlignAtGoal.execute().

You must perform "Robot Setup" with this release.
`,changes:[`Important Release Notes is available after UCSBXRP API in the top menu. The button is green until opened for the current release, then gray. Its read status is retained when the app is reopened.`,`The release-notes page presents the current migration instructions first, followed by release details in date order, newest first. Earlier entries will remain available as new releases are added.`,`In the workspace, Important Release Notes opens alongside the IDE or Monitor. The notes are also available offline after the app update has finished downloading.`,`Physical XRP requires Robot Setup for this release. The course library accepts both turn_rate_rad_s and steering_rate_rad_s in MotionCommand and NavigationConfig, so older rate names remain usable.`]},{release_id:`2026.11-dev.98`,date:`2026-11-09`,changes:[`MotionCommand and NavigationConfig accept the earlier turn_rate_rad_s name as well as steering_rate_rad_s. Existing positional calls are unchanged.`,`Physical robots using the earlier name need this course-library update once per robot. New Challenge 3 projects continue using the current navigation and localization templates.`]},{release_id:`2026.11-dev.97`,date:`2026-11-09`,changes:[`World displays GPS correction points at the pose used by navigation, accounting for movement since image capture. Raw camera coordinates remain in saved recordings.`,`Navigation goals appear as solid black disks 100 mm across. The final heading is completed before checking whether a position correction is needed, and route time continues until the robot stops.`,`The steering filter supports a zero time constant. Earlier dev95 or newer robot software remains compatible; Robot Setup installs the revised reference navigation controller.`]},{release_id:`2026.11-dev.96`,date:`2026-11-08`,changes:[`Monitor draws the pose-estimate path correctly in Virtual XRP and saved runs. Ground truth and Pose estimate labels distinguish the two paths; camera based GPS uses round markers.`,`Steering command is available as an optional strip plot. Virtual GPS and driving disturbance settings no longer impose arbitrary upper limits.`,`Program errors stay in Program output and code diagnostics rather than appearing in the workspace header. The Challenge 3 steering-filter task explains how to select its time constant.`]}];export{e as t};