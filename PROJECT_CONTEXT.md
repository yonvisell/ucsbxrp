# UCSB Mobile Robotics with the XRP

This folder is the working source for a ten-week undergraduate laboratory course, its `ucsb_xrp` MicroPython library, and the browser tools used to program, simulate, and inspect the robot.

## Read first

The current course and public library design is defined by:

1. `v2_01_course_overview_and_schedule.txt`
2. `v2_02_ucsb_xrp_library_user_guide.txt`
3. `v2_03_ucsb_xrp_api_reference.txt`

Read them in that order. Before implementing the software, create
`docs/COURSE_AND_LIBRARY_SUMMARY.md` from these three files. It should give a concise account of the course, the five challenges, and the library as students will encounter it. It should explain what students implement without revealing reference solutions. Keep that summary current when a coordinated change alters the course or public API.

Then read:

4. `SYSTEM_DESIGN.md`
5. `IMPLEMENTATION_PLAN.md`

`AGENTS.md` contains the durable working instructions for Codex.

## Course

Students work in pairs with one XRP kit per pair. They have limited programming experience but are capable junior- and senior-level engineering students. The course uses compact MicroPython programs and concrete robot experiments to introduce sensing, wheel-speed feedback, differential-drive kinematics, odometry, waypoint navigation, range sensing, occupancy grids, and path planning.

The five challenges are:

1. Straight Run
2. Turn and Return
3. Waypoint Courier
4. Mapped Route
5. Delivery Mission

Student work is concentrated in six components with supplied reference implementations:

- `SensorModel`
- `WheelSpeedController`
- `DifferentialDrive`
- `Odometry`
- `NavigationController`
- `GridPlanner`

The supplied services are `XRPBot`, `Robot`, `StraightLineController`,
`ArenaMap`, `OccupancyGrid`, and `DeliveryMission`. Each component can be changed independently from the reference implementation to the student implementation.

## Software being developed

The project comprises four coordinated parts in one repository:

- the `ucsb_xrp` MicroPython package and its reference modules;
- a browser IDE for editing, checking, transferring, and running course projects;
- a browser dashboard for telemetry, plots, recordings, logs, and the world view;
- a virtual XRP that runs actual student MicroPython against simulated hardware.

The browser applications will be published from `yonvisell.github.io` and will cache the application and the current course release for use after the computer joins the XRP wireless network. The course release is stored in the repository's `vendor` folder.

## Principal boundary

`ucsb_xrp` owns the course abstractions and robot behavior. Localization, mapping, navigation, planning, and mission logic belong in this Python package.

The simulator supplies only the virtual hardware and world needed by that code: motor response, encoder readings, range readings, button and payload state, collision geometry, and ground-truth pose. Its deterministic planar model is authoritative. Three.js renders that state and performs useful geometric queries; it does not determine robot motion.

The same student project and `ucsb_xrp` interfaces must run with either target:

```text
physical target: student code -> ucsb_xrp -> XRPBot -> XRPLib -> XRP hardware
virtual target:  student code -> ucsb_xrp -> XRPBot -> simulated XRPLib -> planar simulator
```

The browser-side connection code is separate from the MicroPython
`ucsb_xrp` package.

## Design priorities

- Get a complete, narrow path working early: edit a short MicroPython project, run it on the virtual XRP, see the robot move in the dashboard, and inspect a plotted signal and console output.
- Develop the library, physical target service, simulator, IDE, and dashboard against shared interfaces rather than allowing temporary substitutes to diverge.
- Keep student programs short and readable. Put recurring hardware, control-loop, telemetry, and setup work in supplied code.
- Keep the IDE focused on programming and the dashboard focused on live data and spatial display.
- Prefer a clear, responsive interface over extensive customization.
- Use the attached XRP throughout development to verify hardware assumptions and normal recovery paths.
- Record what was actually tested. Do not treat simulator success as physical-robot validation.

The system is for a supervised teaching laboratory, not a safety-critical or multi-user service. Favor a small maintainable implementation with strong recovery from ordinary failures.
