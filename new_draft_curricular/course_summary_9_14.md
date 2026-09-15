**ME 179L REVAMP: MOBILE ROBOTICS WITH THE XRP**

Students begin by assembling an XRP robot and finding out how its two motors and encoders behave. They then make it drive a measured straight distance, turn and return, travel through world-coordinate destinations, plan around a known obstacle, and complete a delivery after observing whether part of the route is blocked.

The course is organized around five robot challenges. A short lecture and one or more focused experiments provide the material needed for each challenge. Students work in pairs, with one XRP kit per pair. Tuesday and Thursday meetings combine lecture, programming, measurement, and robot runs. The laboratory is available between meetings.

The course assumes one previous programming course. It does not assume previous Python or robotics experience. Python classes are introduced through concrete robot components whose inputs and outputs can be inspected directly.

**COURSE CONTENT**  
Python

* classes, objects, methods, and instance variables;  
* modules and imports;  
* typed records with meaningful field names; and  
* tests using known inputs before a class is used on the robot.

Mobile robotics

* Motor drive: PWM, effort, torque–speed curve, stall, effort limits  
* Encoders: quadrature counting; counts \+ time → wheel position and speed  
* PID and feedforward control  
* differential-drive steering;  
* planar pose and odometry;  
* Waypoint navigation through world-coordinate destinations;  
* forward range sensing;  
* dimensioned arena maps and sampled occupancy grids; and  
* grid-based path planning with and without obstacles.  
* Reactive navigation

**TECHNICAL THREAD**

* encoder counts and time become wheel position, increment, and speed;  
* a requested robot motion becomes left and right wheel-speed targets;  
* wheel-speed error changes motor effort (PID);  
* left and right wheel travel update planar position and heading;  
* position and heading determine how the robot approaches a destination;  
* a dimensioned map becomes an occupancy grid at a chosen resolution;  
* graph search connects the start cell to the destination cell; and  
* reactive planning is used to adapt a planned path based on an unexpectedly filled cell.

**CHALLENGE 1: ROBOT CURLING *(Wheel-speed measurement and control)***

**Task:** The robot must travel from standstill at a starting line and come to a complete stop as close as possible to a target point, but no faster than MIN\_TIME seconds after “go”. The target point is a small taped point surrounded by concentric taped circles. DISTANCES tbd.  

**Challenge implementations:** 

* Each robot starts at rest behind a starting line.   
* At the beginning of the challenge, students will be given the MIN\_TIME details.   
* How will students know when to start their robot?  
  * Option 1: We say “go” and they press “start” on their robot  
  * Option 2: Break beam sensor starts counting once robot crosses the threshold.  
* Time will be measured with a manual stopwatch that we press once we say “go,” and stop once the vehicle appears to come to a complete stop.  
* Each group will have two trials *(more if time permits)*.

**Challenge scoring:** 

* Tiers. Spec system?

**Student code developed for this module:**

* SensorModel: The wheel-measurement portion converts encoder counts and timestamps into left and right wheel position, wheel travel during the latest sample, and wheel speed.  
* WheelSpeedController: Converts requested and measured left and right wheel speeds into left and right motor efforts, combining a feedforward estimate from the effort–speed characterization with feedback on speed error.

The implementations must account for:

* encoder scale and direction;  
* elapsed time between samples;  
* unequal left and right motor response;  
* the motor effort required to start each loaded wheel moving;  
* the difference between raised-wheel and floor measurements;  
* the feedforward relationship between effort and wheel speed;  
* zero requested speed; and  
* the allowed motor-effort range.

*StraightLineController is supplied. It reduces the requested speed near the box and stops the robot at the specified travel distance. The challenge therefore concentrates on measurement and wheel-speed control.*

**Submission deliverables:** 

* Preliminary lab work:  
  - [ ] Single effort-speed characterization curve for SensorModel; short description of how they collected this data.  
        * Include deadband zone and linear zone  
  - [ ] Tuning journal for WheelSpeedController; short description of how they collected this data, what components their controller architecture consists of, and why.   
* Challenge data:   
  - [ ] Velocity vs. time vs. effort plot  
* Challenge score

**CHALLENGE 2: ARENA LINE RACE *(Differential drive, line following)***

**Task:** The robot follows a taped line around the inner perimeter of the arena and completes a lap as quickly as possible. Inner curves are marked in the corners of the track that represent inner boundaries the robot must pass outside of, in order for the run to count. 

**Challenge implementations:** 

* The robot must begin the challenge at rest at a fixed starting position, on top of the perimeter tape line (but potentially not centered).  
* Students will be given a verbal “go” command, and then be allowed to start their robots and begin the task.   
* Time will be measured with a manual stopwatch that we press once we say “go,” and stop once the vehicle has entirely passed through the starting line after completing a lap.   
* Each group will have two attempts to complete this.  
* The track can be set up beforehand, and students are allowed to practice in the arena during preceding days. 

**Scoring:** 

* Best clean lap time that does not cut corners. 

**New student code:**

* DifferentialDrive: Converts a requested forward speed and turn rate into left and right wheel speeds.  
* LineFollower (one-time challenge code): Converts the reflectance measurement from SensorModel and computes a line-position error; then uses PID to calculate a desired turn rate; gets sent as a MotionCommand (a requested forward speed and a turn rate).

The implementations must account for:

* the wheel-speed difference required for a turn;  
* the effective distance between the wheels;  
* left-turn and right-turn signs;  
* the analog reflectance signal and its normalization;  
* filtering and occasional dropped reflectance readings;  
* reduced forward speed on curves versus straights (the speed–stability tradeoff); and  
* the allowed forward-speed and turn-rate ranges.

**Submission deliverables:** 

* Preliminary lab work:  
  - [ ] Effective track width calculations (data and calculations)  
* Challenge data:   
  - [ ] Time vs. position plot   
  - [ ] Time vs. left/right effort plot  
* Challenge score

**CHALLENGE 3: WAYPOINT COURIER *(Odometry and navigation)***

**Task:** The robot starts at a known pose, visits an ordered sequence of world-coordinate destinations, and reaches the final destination with a specified heading. The estimated and measured final pose are compared.

**Challenge implementations:** 

* At the beginning of the challenge, students receive a list of 3-5 ordered waypoints (X, Y) for use during the day. The format of this list will have been shared with them previously. They will then paste this into the challenge-specific file.   
* Waypoints will be marked with tape on the table.  
* The robot must begin the challenge at rest at a fixed starting pose, which will be marked as a taped square. This starting location will also be communicated to students.   
* At the beginning of the run, the robot will be affixed with an AprilTag, which will allow the camera to track its current position.   
* Time will be measured with a manual stopwatch that we press once we say “go,” and stop once the vehicle has returned to the starting position after passing through each of the waypoints.   
* We will determine visually whether the robot “passed through” each of the waypoints. Waypoints will be considered “passed through” if the robot entirely covers the waypoint tape area.     
* Each group will have two attempts to complete this.

**Scoring:** 

* Fastest successful time. 

**New student code:**

* Odometry: Uses left and right wheel travel to update the robot's estimated x position, y position, and heading.  
* NavigationController: Stores the route, selects the current destination, and converts the current Pose into a MotionCommand. Its internal state — a finite state machine — distinguishes turning toward a destination, driving toward it, and aligning to a requested final heading.

The implementation must account for:

* distance and bearing to the current destination;  
* shortest-direction heading error;  
* separate position and heading tolerances;  
* a useful turn-rate magnitude at small heading errors;  
* reduced speed near a destination;  
* transition to the next destination; and  
* a stopped command after the route is complete.

Odometry (developed and checked against hand measurement in the preceding out-and-back lab) supplies the Pose that the NavigationController consumes. The challenge concentrates on navigation.

**Submission deliverables:** 

* Preliminary lab work:  
  - [ ] Odometry module evaluation?  
* Challenge data:   
  - [ ] Time vs. position plot   
* Challenge score

**CHALLENGE 4: MAPPED ROUTE *(Path planning)***

**Task:** The robot is given an occupancy grid (a known map of the arena with marked obstacles), and travels from a specified start pose to a destination while avoiding the obstacles. *The core requirement is a software check-off (whether GridPlanner produces a correct, collision-free path on the given map), which can be verified on a laptop without needing the arena or a scheduled heat. Students who would like to implement the route on the robot in the arena are welcome to.* 

**Challenge implementations:** 

* At the beginning of the challenge, students receive an occupancy grid and coordinates for a required starting and ending pose.   
* Obstacles will be placed in the arena in corresponding locations.   
* The robot must begin the challenge at rest at a fixed starting pose, which will be marked as a taped square.   
* At the beginning of the run, the robot will be affixed with an AprilTag, which will allow the camera to track its current position.   
* A successful run will avoid collisions with obstacles.   

**Scoring:** 

* TBD

**New student code:**

* GridPlanner: Finds a path through free neighboring cells from a start cell to a destination cell.

The implementation must account for:

* conversion of the world start and destination to grid cells;  
* blocked or out-of-map endpoints;  
* a search frontier and a record of visited cells;  
* one predecessor for each discovered cell;  
* reconstruction of the path in start-to-destination order;  
* adjacent free cells in the returned path; and  
* the result when no path exists.

**Submission deliverables:** 

* Preliminary lab work:  
* Challenge data:   
* Challenge score

**CHALLENGE 5: OUT-AND-BACK *(Reactive navigation and deliberative planning)***

**Task:** The robot must travel from a starting position to a goal position and back to its starting position. On the day of the final challenge, surprise obstacles are placed in the arena that the robot must sense and react to. Ideally, the robot then plans the fastest route through the now-known obstacles and returns to the start as quickly as possible. Ranking is by return time, with distance-based partial credit.

**Challenge implementations:** 

* At the beginning of the challenge, students receive an occupancy grid and coordinates for a required starting and ending pose.   
* Obstacles will be placed in the arena in corresponding locations.   
* The robot must begin the challenge at rest at a fixed starting pose, which will be marked as a taped square.   
* At the beginning of the run, the robot will be affixed with an AprilTag, which will allow the camera to track its current position.   
* Time will be measured with a manual stopwatch that we press once we say “go,” and stop once the vehicle has returned to the starting position after passing through each of the waypoints.   
* A successful run will avoid collisions with obstacles.   
* We will determine visually whether the robot reached the end goal.       
* Each group will have two attempts to complete this.

**Scoring:** 

* Based on fastest time. 

**New student code:**

* ReactiveNavigator: Converts live forward-range readings and the goal direction into a MotionCommand that steers the robot around obstacles while making progress toward the destination.

The implementations must account for:

* detecting an obstacle within a stopping distance;  
* steering around it while maintaining progress toward the goal;  
* marking discovered obstacles into the occupancy grid using the current Pose;  
* planning the return route over the updated grid with GridPlanner;  
* sequencing the mission: reactive outbound, turnaround, plan, deliberative return;  
* the possibility that the planned return meets an unrecorded obstacle; and  
* reuse of the navigation, planning, and robot-control components from earlier challenges.

A supplied OutAndBackMission skeleton sequences the mission and calls the student ReactiveNavigator, GridPlanner, and NavigationController; students complete its state transitions. The challenge concentrates on the contrast between reactive and deliberative navigation. See the architecture-fit memo for the component and mission-orchestration details.

**Submission deliverables:** 

* Preliminary lab work:  
* Challenge data:   
* Challenge score

**PREVIOUS VERSION**  
**—----------------------------------------------------------------------------------------------------------------------------**  
**THE FIVE CHALLENGES**

The challenges do not require five independent physical setups. Straight Run uses an open lane. Turn and Return and Waypoint Courier use the same open floor area with different marked coordinates. Mapped Route and Delivery Mission use the same supplied dimensioned map and shared arena; the delivery adds one observed map condition. The software develops in the same way. Each challenge keeps the student implementations from the preceding challenge and adds a small number of new methods or classes.

Distances use millimeters, linear speeds use millimeters per second, and angles use radians. These conventions are used consistently in the library, student components, task files, and robot data.

**CHALLENGE 1: STRAIGHT RUN (Measurement and wheel speed control)**

**Task**: The robot travels along an open straight course and stops at a specified distance. After producing a repeatable run, students increase the requested speed while retaining a controlled stop. For the challenge run, the robot must finish as close as possible to a specified target time T without finishing sooner.

**New student code:**

SensorModel: The wheel-measurement portion converts encoder counts and timestamps into left and right wheel position, wheel travel during the latest sample, and wheel speed.

WheelSpeedController: Converts requested and measured left and right wheel speeds into motor efforts.

The implementations must account for:

* encoder scale and direction;  
* elapsed time between samples;  
* unequal left and right motor response;  
* the motor effort required to start each loaded wheel moving; (how are they doing this?)  
* the difference between raised-wheel and floor measurements;  
* zero requested speed; and  
* the allowed motor-effort range.

StraightLineController is supplied. It reduces the requested speed near the destination and stops the robot at the specified travel distance. The challenge therefore concentrates on measurement and wheel-speed control.

**Evaluated skills:**

**CHALLENGE 2: TURN AND RETURN (Differential drive; maybe sensors)**

**Task**: The robot travels to a designated turnaround point, turns through 180 degrees, returns to a marked region around its starting position, then turns to its original heading. The estimated final position and heading are compared with the measured result.

**New student code**

DifferentialDrive: Converts requested forward speed and turn rate into left and right wheel speeds.

Odometry: Uses left and right wheel travel to update the robot's estimated x position, y position, and heading.

The implementations must account for:

* the wheel-speed difference required for a turn;  
* the effective distance between the wheels;  
* left-turn and right-turn signs;  
* simultaneous translation and rotation;  
* heading wraparound; and  
* accumulated error caused by wheel scale, track-width calibration, and slip.

**Evaluated skills:**

**CHALLENGE 3: WAYPOINT COURIER**

**Task**: The robot starts at a known pose, visits an ordered sequence of world-coordinate destinations, and reaches the final destination with a specified heading.

**New student code**

NavigationController: Stores the route, selects the current destination, and converts the current Pose into a MotionCommand. Its internal state distinguishes turning toward a destination, driving toward it, and aligning to a requested final heading.

The implementation must account for:

* distance and bearing to the current destination;  
* shortest-direction heading error;  
* separate position and heading tolerances;  
* a useful turn-rate magnitude at small heading errors;  
* reduced speed near a destination;  
* transition to the next destination; and  
* a stopped command after the route is complete.

**Evaluated skills:**

**CHALLENGE 4: MAPPED ROUTE (Path planning)**

**Task**: The robot travels from a specified start pose to a destination while avoiding known obstacles. The course supplies a dimensioned ArenaMap. OccupancyGrid samples that map at a selected grid resolution. Students plan through the free cells, convert the grid path to world-coordinate destinations, and use the NavigationController completed in Challenge 3\.

**New student code**

GridPlanner: Finds a path through free neighboring cells from a start cell to a destination cell.

The implementation must account for:

* conversion of the world start and destination to grid cells;  
* blocked or out-of-map endpoints;  
* a search frontier and a record of visited cells;  
* one predecessor for each discovered cell;  
* reconstruction of the path in start-to-destination order;  
* adjacent free cells in the returned path; and  
* the result when no path exists.

Breadth-first search is sufficient for the core challenge. Dijkstra's algorithm or A\* can use the same GridPlanner interface.

**Evaluated skills:**

**CHALLENGE 5: DELIVERY MISSION**

**Task**: The robot begins at a known observation pose, obtains several forward-range readings while stationary, and determines whether a named feature in the dimensioned map is blocked. It then constructs the corresponding occupancy grid, plans a route, and completes the delivery.

**New student code**

SensorModel.estimate\_range(): Reduces a short sequence of range samples to one usable distance estimate or reports that the available samples are insufficient.

The range implementation and final integration must account for:

* variation among repeated readings;  
* missing readings;  
* the minimum number of usable samples;  
* the measured distinction between the relevant open and blocked conditions;  
* changing only the named map feature associated with the observation;  
* the possibility that no route exists; and  
* reuse of the navigation and robot-control components from earlier challenges.

No new motion or mission class is introduced. DeliveryMission is supplied and uses the student SensorModel, GridPlanner, and NavigationController.

**Evaluated skills:**

**THE CODE STUDENTS DEVELOP**

Six components have a reference implementation and a student implementation:

* SensorModel;  
* WheelSpeedController;  
* DifferentialDrive;  
* Odometry;  
* NavigationController; and  
* GridPlanner.

Both implementations have the same public methods. A student implementation inherits a supplied base class that fixes the method names, arguments, and return values. course\_setup.py selects "reference" or "student" independently for each component.

The supplied library services are XRPBot, Robot, StraightLineController, ArenaMap, OccupancyGrid, and DeliveryMission.

The principal run-time sequence is:

MotionCommand  
    \-\> DifferentialDrive  
    \-\> WheelSpeeds  
    \-\> WheelSpeedController  
    \-\> MotorEfforts  
    \-\> XRPBot

XRPBot  
    \-\> RawSensors  
    \-\> SensorModel  
    \-\> Measurements  
    \-\> Odometry  
    \-\> Pose

NavigationController uses the current Pose to produce a MotionCommand. GridPlanner produces a GridPath that can be converted to NavigationGoal values.

**PROJECT FILES**

main.py: Imports the current task, constructs the required objects, and runs the standard control loop.

robot\_config.py: Contains measured robot dimensions, encoder scale, motor calibration, sample period, and reusable controller settings.

student\_components.py: Contains the six student component implementations.

course\_setup.py: Contains the hooks to the binary reference implementations and the implementation selection settings for each module.

challenge.py: contains the current experiment or task values: requested motor effort and duration, initial pose, destinations, dimensioned map, grid resolution, and range-decision settings. Task values do not appear as numerical literals in main.py.

**TEN-WEEK SCHEDULE**

**WEEK 0: INTRO**  
Thursday

* Demonstration of the five robot challenges.  
* Mobile-robot tasks: motion, position, sensing, mapping, and planning.  
* *Python review: values, functions, conditionals, loops, and lists.*  
* *Pose represented as a record with named fields.*

**WEEK 1: PYTHON OBJECTS AND THE XRP**

Tuesday

* Assemble the XRP robot.  
* Connect the robot to the course IDE.  
* Run the supplied motor, encoder, button, and range tests.

Thursday

* Introduce classes, objects, methods, and instance variables.  
* Read RawSensors through XRPBot.

Practical result: Each pair has an assembled robot that passes the integrated tests and a Python program that reads its encoders.

**WEEK 1.5-3: STRAIGHT LINE MOTION**

* speed, load, and encoder counts.  
* Fixed-effort measurements with the wheels raised.  
* Comparison of the left and right motors.  
* Convert counts and time to wheel travel and wheel speed.  
* Implement the wheel-measurement portion of SensorModel.  
* Test SensorModel with a recorded RawSensors sequence.

Practical result: SensorModel reports left and right wheel position, increment, and speed in  
physical units.

* Open-loop motor response and closed-loop wheel-speed control.  
* Starting effort, speed estimate, speed error, and effort limits.  
* Implement and test WheelSpeedController.

* Use StraightLineController with the student SensorModel and WheelSpeedController.  
* Compare requested and measured wheel speeds.  
* Complete Challenge 1: Straight Run.

Practical result: The robot travels a requested straight distance with repeatable speed and stop  
position.

**WEEK 4: STEER WITH TWO WHEELS**

Tuesday

* Forward speed, turn rate, and individual wheel speed.  
* Implement DifferentialDrive.  
* Test straight, curved, and in-place commands.

Thursday

* Wheel travel during a turn.  
* Measure repeated turns.  
* Refine the effective track-width value used by the robot model.

Practical result: DifferentialDrive produces consistent left and right wheel-speed requests for  
straight and turning motion.

**WEEK 5: ESTIMATE POSITION**

Tuesday

* Robot coordinates, world coordinates, Pose, and heading wraparound.  
* Implement Odometry with known left and right wheel increments.  
* Test straight, curved, and in-place motion sequences.

Thursday

* Use live wheel increments to update Pose.  
* Compare estimated and measured final position and heading.  
* Complete Challenge 2: Turn and Return.

Practical result: RobotState contains a continuously updated odometry estimate.

**WEEK 6: TRAVEL THROUGH COORDINATES**

Tuesday

* Distance and bearing from Pose to NavigationGoal.  
* Navigation states: turn, drive, and final heading.  
* Implement NavigationController for one destination.

Thursday

* Extend NavigationController to an ordered route.  
* Tune travel speed, approach speed, and arrival tolerances.  
* Complete Challenge 3: Waypoint Courier.

Practical result: NavigationController converts a route and successive Pose values into  
MotionCommand values.

**WEEK 7: RANGE SENSING AND DIMENSIONED MAPS**

Tuesday

* Ultrasonic range measurement and surface-dependent variation.  
* Collect repeated readings at the observation pose used by the final mission.  
* Implement and test SensorModel.estimate\_range().

Thursday

* ArenaMap as a dimensioned description in millimeters.  
* Grid resolution and sampling an ArenaMap into OccupancyGrid.  
* Convert world coordinates to cells and cell centers to world coordinates.  
* Compare coarse and fine grid representations of the same map.

Practical result: Students can produce a range estimate from repeated samples and relate the  
supplied dimensioned map to grid cells.

**WEEK 8: PLAN A GRID PATH**

Tuesday

* Grid cells as graph vertices.  
* Free neighboring cells, a search frontier, visited cells, and predecessor records.  
* Begin GridPlanner with small software-only maps.

Thursday

* Complete path reconstruction.  
* Test open maps, maps with obstacles, blocked endpoints, and maps with no  
* route.  
* Convert a GridPath to NavigationGoal values.

Practical result: GridPlanner returns a valid path or None.

**WEEK 9: EXECUTE THE PLANNED ROUTE**

Tuesday

* Combine ArenaMap, OccupancyGrid, GridPlanner, and NavigationController.  
* Execute short planned routes.  
* Compare the grid path, estimated Pose, and physical robot path.

Thursday

* Complete Challenge 4: Mapped Route.  
* Introduce the supplied DeliveryMission sequence.  
* Test its range decision and planning stages with recorded data.

Practical result: The robot executes a route produced from the supplied dimensioned map.

**WEEK 10: COMPLETE THE DELIVERY**

Tuesday

* Integrate the stationary range observation with the named map feature.  
* Rehearse each expected map condition.  
* Complete full delivery runs.

Thursday

* Complete Challenge 5: Delivery Mission.  
* Compare planned routes, estimated trajectories, and physical final positions.  
* Identify the measurements and model parameters that most influenced each result.

Practical result: The robot observes the relevant map condition, plans through the resulting  
occupancy grid, and completes the delivery.

**WORKED SOLUTION: CHALLENGE 4, MAPPED ROUTE**

This solution places the search algorithm in GridPlanner. main.py constructs the supplied map and controllers, asks the planner for a path, and runs the existing NavigationController. All positions and grid settings come from challenge.py.

student\_components.py

    from ucsb\_xrp import GridPath  
    from ucsb\_xrp.student\_api import GridPlannerBase

    class GridPlanner(GridPlannerBase):  
        def plan(self, grid, start, goal):  
            if start is None or goal is None:  
                return None

            if grid.is\_blocked(start) or grid.is\_blocked(goal):  
                return None

            frontier \= \[start\]  
            next\_index \= 0  
            previous \= {start: None}

            while next\_index \< len(frontier):  
                current \= frontier\[next\_index\]  
                next\_index \+= 1

                if current \== goal:  
                    break

                for neighbor in grid.neighbors(current):  
                    if neighbor not in previous:  
                        previous\[neighbor\] \= current  
                        frontier.append(neighbor)

            if goal not in previous:  
                return None

            cells \= \[\]  
            current \= goal

            while current is not None:  
                cells.append(current)  
                current \= previous\[current\]

            cells.reverse()  
            return GridPath(tuple(cells))

main.py

    from challenge import (  
        ARENA\_MAP,  
        CLEARANCE\_MM,  
        DESTINATION,  
        GRID\_RESOLUTION\_MM,  
        INITIAL\_POSE,  
    )  
    from course\_setup import (  
        make\_grid\_planner,  
        make\_navigation\_controller,  
        make\_robot,  
    )  
    from robot\_config import NAVIGATION\_CONFIG, ROBOT\_CONFIG  
    from ucsb\_xrp import OccupancyGrid

    grid \= OccupancyGrid.from\_arena(  
        arena=ARENA\_MAP,  
        resolution\_mm=GRID\_RESOLUTION\_MM,  
        clearance\_mm=CLEARANCE\_MM,  
    )

    start \= grid.world\_to\_cell(  
        INITIAL\_POSE.x\_mm,  
        INITIAL\_POSE.y\_mm,  
    )  
    goal \= grid.world\_to\_cell(  
        DESTINATION.x\_mm,  
        DESTINATION.y\_mm,  
    )

    planner \= make\_grid\_planner()  
    path \= planner.plan(grid, start, goal)

    if path is None:  
        print("No route to the destination")  
    else:  
        navigation \= make\_navigation\_controller(NAVIGATION\_CONFIG)  
        navigation.start(  
            path.to\_goals(  
                grid=grid,  
                final\_heading\_rad=DESTINATION.heading\_rad,  
            )  
        )

        robot \= make\_robot(ROBOT\_CONFIG)

        try:  
            state \= robot.start(INITIAL\_POSE)

            while not navigation.is\_complete():  
                command \= navigation.update(state.pose)  
                state \= robot.step(command)  
        finally:  
            robot.stop()

Changing GridPlanner from "reference" to "student" in course\_setup.py changes the planner used by main.py without changing the task, map, navigation, or robot code.

