import{r as e}from"./rolldown-runtime-hePW80VL.js";import{n as t,t as n}from"./jsx-runtime-DE3RlOCf.js";import{n as r}from"./AppNavigation-CaNnLyDk.js";import{t as i}from"./CourseHeader-LYvQYZ9z.js";import{D as a,T as o,c as s,d as c,i as l,l as u,s as d,u as f}from"./src-CQjIay3j.js";import{a as p}from"./instructor-access-DzM_BWIN.js";import{t as m}from"./InstructorAccessGate-HkzJkcZz.js";import{a as h,i as g,o as _}from"./offline-shell-2BZ3rP7Q.js";import"./theme-B9pVOUM5.js";import{a as v,n as y,r as b}from"./shared-challenge-package-BbMs89by.js";import{n as x}from"./class-wifi-profile-DbSkES5i.js";var S=e(t(),1),C=r(),w=`[
  {
    "id": "challenge_1",
    "group": "archived",
    "kind": "challenge",
    "source": "starters/challenge_1",
    "label": "Challenge 1 \\u00b7 Straight Run",
    "short_label": "1 \\u00b7 Straight Run",
    "summary": "Measure wheel motion and stop at the assigned distance and time.",
    "entrypoint": "main.py",
    "components": [
      {
        "name": "SensorModel",
        "file": "sensor_model.py",
        "selection_flag": "USE_STUDENT_SENSOR_MODEL"
      },
      {
        "name": "WheelSpeedController",
        "file": "wheel_speed_controller.py",
        "selection_flag": "USE_STUDENT_WHEEL_SPEED_CONTROLLER"
      }
    ],
    "published": true
  },
  {
    "id": "challenge_2",
    "group": "archived",
    "kind": "challenge",
    "source": "starters/challenge_2",
    "label": "Challenge 2 \\u00b7 Turn and Return",
    "short_label": "2 \\u00b7 Turn and Return",
    "summary": "Turn, return to the start, and estimate position and heading.",
    "entrypoint": "main.py",
    "components": [
      {
        "name": "SensorModel",
        "file": "sensor_model.py",
        "selection_flag": "USE_STUDENT_SENSOR_MODEL"
      },
      {
        "name": "WheelSpeedController",
        "file": "wheel_speed_controller.py",
        "selection_flag": "USE_STUDENT_WHEEL_SPEED_CONTROLLER"
      },
      {
        "name": "DifferentialDrive",
        "file": "differential_drive.py",
        "selection_flag": "USE_STUDENT_DIFFERENTIAL_DRIVE"
      },
      {
        "name": "Odometry",
        "file": "odometry.py",
        "selection_flag": "USE_STUDENT_ODOMETRY"
      }
    ],
    "published": true
  },
  {
    "id": "challenge_3",
    "group": "archived",
    "kind": "challenge",
    "source": "starters/challenge_3",
    "label": "Challenge 3 \\u00b7 Waypoint Courier",
    "short_label": "3 \\u00b7 Waypoint Courier",
    "summary": "Visit the assigned map positions in order and finish at the requested heading.",
    "entrypoint": "main.py",
    "components": [
      {
        "name": "SensorModel",
        "file": "sensor_model.py",
        "selection_flag": "USE_STUDENT_SENSOR_MODEL"
      },
      {
        "name": "WheelSpeedController",
        "file": "wheel_speed_controller.py",
        "selection_flag": "USE_STUDENT_WHEEL_SPEED_CONTROLLER"
      },
      {
        "name": "DifferentialDrive",
        "file": "differential_drive.py",
        "selection_flag": "USE_STUDENT_DIFFERENTIAL_DRIVE"
      },
      {
        "name": "Odometry",
        "file": "odometry.py",
        "selection_flag": "USE_STUDENT_ODOMETRY"
      },
      {
        "name": "NavigationController",
        "file": "navigation_controller.py",
        "selection_flag": "USE_STUDENT_NAVIGATION_CONTROLLER"
      }
    ],
    "published": true
  },
  {
    "id": "challenge_4",
    "group": "archived",
    "kind": "challenge",
    "source": "starters/challenge_4",
    "label": "Challenge 4 \\u00b7 Mapped Route",
    "short_label": "4 \\u00b7 Mapped Route",
    "summary": "Plan and follow a route around known obstacles.",
    "entrypoint": "main.py",
    "components": [
      {
        "name": "SensorModel",
        "file": "sensor_model.py",
        "selection_flag": "USE_STUDENT_SENSOR_MODEL"
      },
      {
        "name": "WheelSpeedController",
        "file": "wheel_speed_controller.py",
        "selection_flag": "USE_STUDENT_WHEEL_SPEED_CONTROLLER"
      },
      {
        "name": "DifferentialDrive",
        "file": "differential_drive.py",
        "selection_flag": "USE_STUDENT_DIFFERENTIAL_DRIVE"
      },
      {
        "name": "Odometry",
        "file": "odometry.py",
        "selection_flag": "USE_STUDENT_ODOMETRY"
      },
      {
        "name": "NavigationController",
        "file": "navigation_controller.py",
        "selection_flag": "USE_STUDENT_NAVIGATION_CONTROLLER"
      },
      {
        "name": "GridPlanner",
        "file": "grid_planner.py",
        "selection_flag": "USE_STUDENT_GRID_PLANNER"
      }
    ],
    "published": true
  },
  {
    "id": "challenge_5",
    "group": "archived",
    "kind": "challenge",
    "source": "starters/challenge_5",
    "label": "Challenge 5 \\u00b7 Delivery Mission",
    "short_label": "5 \\u00b7 Delivery Mission",
    "summary": "Use range measurements to choose an available route and deliver.",
    "entrypoint": "main.py",
    "components": [
      {
        "name": "SensorModel",
        "file": "sensor_model.py",
        "selection_flag": "USE_STUDENT_SENSOR_MODEL"
      },
      {
        "name": "WheelSpeedController",
        "file": "wheel_speed_controller.py",
        "selection_flag": "USE_STUDENT_WHEEL_SPEED_CONTROLLER"
      },
      {
        "name": "DifferentialDrive",
        "file": "differential_drive.py",
        "selection_flag": "USE_STUDENT_DIFFERENTIAL_DRIVE"
      },
      {
        "name": "Odometry",
        "file": "odometry.py",
        "selection_flag": "USE_STUDENT_ODOMETRY"
      },
      {
        "name": "NavigationController",
        "file": "navigation_controller.py",
        "selection_flag": "USE_STUDENT_NAVIGATION_CONTROLLER"
      },
      {
        "name": "GridPlanner",
        "file": "grid_planner.py",
        "selection_flag": "USE_STUDENT_GRID_PLANNER"
      }
    ],
    "published": true
  },
  {
    "id": "challenge_6",
    "group": "archived",
    "kind": "challenge",
    "source": "starters/challenge_6",
    "label": "Challenge 6 \\u00b7 Range-Constrained Stopping",
    "short_label": "6 \\u00b7 Range-Constrained Stopping",
    "summary": "Use measured speed and ultrasound range to stop with a defined clearance margin.",
    "entrypoint": "main.py",
    "components": [
      {
        "name": "SensorModel",
        "file": "sensor_model.py",
        "selection_flag": "USE_STUDENT_SENSOR_MODEL"
      },
      {
        "name": "WheelSpeedController",
        "file": "wheel_speed_controller.py",
        "selection_flag": "USE_STUDENT_WHEEL_SPEED_CONTROLLER"
      },
      {
        "name": "DifferentialDrive",
        "file": "differential_drive.py",
        "selection_flag": "USE_STUDENT_DIFFERENTIAL_DRIVE"
      },
      {
        "name": "Odometry",
        "file": "odometry.py",
        "selection_flag": "USE_STUDENT_ODOMETRY"
      },
      {
        "name": "NavigationController",
        "file": "navigation_controller.py",
        "selection_flag": "USE_STUDENT_NAVIGATION_CONTROLLER"
      },
      {
        "name": "GridPlanner",
        "file": "grid_planner.py",
        "selection_flag": "USE_STUDENT_GRID_PLANNER"
      },
      {
        "name": "RangeSafetyController",
        "file": "range_safety_controller.py",
        "selection_flag": "USE_STUDENT_RANGE_SAFETY_CONTROLLER"
      }
    ],
    "published": true
  },
  {
    "id": "challenge_7",
    "group": "archived",
    "kind": "challenge",
    "source": "starters/challenge_7",
    "label": "Challenge 7 \\u00b7 Wall-Range Pose Correction",
    "short_label": "7 \\u00b7 Wall-Range Pose Correction",
    "summary": "Correct odometry position from stationary observations of two known walls.",
    "entrypoint": "main.py",
    "components": [
      {
        "name": "SensorModel",
        "file": "sensor_model.py",
        "selection_flag": "USE_STUDENT_SENSOR_MODEL"
      },
      {
        "name": "WheelSpeedController",
        "file": "wheel_speed_controller.py",
        "selection_flag": "USE_STUDENT_WHEEL_SPEED_CONTROLLER"
      },
      {
        "name": "DifferentialDrive",
        "file": "differential_drive.py",
        "selection_flag": "USE_STUDENT_DIFFERENTIAL_DRIVE"
      },
      {
        "name": "Odometry",
        "file": "odometry.py",
        "selection_flag": "USE_STUDENT_ODOMETRY"
      },
      {
        "name": "NavigationController",
        "file": "navigation_controller.py",
        "selection_flag": "USE_STUDENT_NAVIGATION_CONTROLLER"
      },
      {
        "name": "GridPlanner",
        "file": "grid_planner.py",
        "selection_flag": "USE_STUDENT_GRID_PLANNER"
      },
      {
        "name": "RangeSafetyController",
        "file": "range_safety_controller.py",
        "selection_flag": "USE_STUDENT_RANGE_SAFETY_CONTROLLER"
      },
      {
        "name": "PoseCorrector",
        "file": "pose_corrector.py",
        "selection_flag": "USE_STUDENT_POSE_CORRECTOR"
      }
    ],
    "published": true
  },
  {
    "id": "challenge_8",
    "group": "archived",
    "kind": "challenge",
    "source": "starters/challenge_8",
    "label": "Challenge 8 \\u00b7 Multi-Stop Route Planning",
    "short_label": "8 \\u00b7 Multi-Stop Route Planning",
    "summary": "Choose and execute the least-cost order for three required service stops.",
    "entrypoint": "main.py",
    "components": [
      {
        "name": "SensorModel",
        "file": "sensor_model.py",
        "selection_flag": "USE_STUDENT_SENSOR_MODEL"
      },
      {
        "name": "WheelSpeedController",
        "file": "wheel_speed_controller.py",
        "selection_flag": "USE_STUDENT_WHEEL_SPEED_CONTROLLER"
      },
      {
        "name": "DifferentialDrive",
        "file": "differential_drive.py",
        "selection_flag": "USE_STUDENT_DIFFERENTIAL_DRIVE"
      },
      {
        "name": "Odometry",
        "file": "odometry.py",
        "selection_flag": "USE_STUDENT_ODOMETRY"
      },
      {
        "name": "NavigationController",
        "file": "navigation_controller.py",
        "selection_flag": "USE_STUDENT_NAVIGATION_CONTROLLER"
      },
      {
        "name": "GridPlanner",
        "file": "grid_planner.py",
        "selection_flag": "USE_STUDENT_GRID_PLANNER"
      },
      {
        "name": "RangeSafetyController",
        "file": "range_safety_controller.py",
        "selection_flag": "USE_STUDENT_RANGE_SAFETY_CONTROLLER"
      },
      {
        "name": "PoseCorrector",
        "file": "pose_corrector.py",
        "selection_flag": "USE_STUDENT_POSE_CORRECTOR"
      },
      {
        "name": "VisitOrderPlanner",
        "file": "visit_order_planner.py",
        "selection_flag": "USE_STUDENT_VISIT_ORDER_PLANNER"
      }
    ],
    "published": true
  },
  {
    "id": "challenge_9",
    "group": "archived",
    "kind": "challenge",
    "source": "starters/challenge_9",
    "label": "Experimental Challenge 9 \\u00b7 Arena Circuit",
    "short_label": "Experimental 9 \\u00b7 Arena Circuit",
    "summary": "Follow a visible closed circuit using local left/right reflectance feedback.",
    "entrypoint": "main.py",
    "components": [
      {
        "name": "LineFollower",
        "file": "line_follower.py",
        "selection_flag": "USE_STUDENT_LINE_FOLLOWER"
      }
    ],
    "published": true
  },
  {
    "id": "demo_obstacle_turn",
    "group": "demonstrations",
    "kind": "demo",
    "source": "templates/demo_obstacle_turn",
    "label": "Demo \\u00b7 Obstacle, Left, Obstacle",
    "short_label": "Obstacle, left, obstacle",
    "summary": "Drive to a nearby obstacle, turn left 90 degrees, then drive to the next obstacle.",
    "entrypoint": "main.py",
    "published": true
  },
  {
    "id": "demo_spiral",
    "group": "demonstrations",
    "kind": "demo",
    "source": "templates/demo_spiral",
    "label": "Demo \\u00b7 Expanding Spiral",
    "short_label": "Expanding spiral",
    "summary": "Drive an expanding spiral and stop when the forward range sensor detects a nearby obstacle.",
    "entrypoint": "main.py",
    "published": true
  },
  {
    "id": "demo_random_snake",
    "group": "archived",
    "kind": "demo",
    "source": "templates/demo_random_snake",
    "label": "Demo \\u00b7 Random Snake",
    "short_label": "Random snake",
    "summary": "Drive random-length straight segments separated by reproducible 90-degree left or right turns.",
    "entrypoint": "main.py",
    "published": true
  },
  {
    "id": "demo_snake_game",
    "group": "demonstrations",
    "kind": "demo",
    "source": "templates/demo_snake_game",
    "label": "Demo \\u00b7 SnakeGame",
    "short_label": "SnakeGame",
    "summary": "Drive through food waypoints; each pellet lengthens a finite tail, and crossing that tail ends the game.",
    "entrypoint": "main.py",
    "published": true
  },
  {
    "id": "demo_roomba",
    "group": "demonstrations",
    "kind": "demo",
    "source": "templates/demo_roomba",
    "label": "Demo \\u00b7 Roomba-Style Avoidance",
    "short_label": "Roomba-style avoidance",
    "summary": "Drive until ultrasound detects a nearby obstacle, reverse briefly, turn randomly, and repeat.",
    "entrypoint": "main.py",
    "published": true
  },
  {
    "id": "demo_manual_drive",
    "group": "demonstrations",
    "kind": "demo",
    "source": "templates/demo_manual_drive",
    "label": "Demo \\u00b7 Manual Driving",
    "short_label": "Manual driving",
    "summary": "Steer the XRP with bounded speed and turn sliders in Monitor; Run starts stopped.",
    "entrypoint": "main.py",
    "published": true
  },
  {
    "id": "demo_ucsb_logo",
    "group": "demonstrations",
    "kind": "demo",
    "source": "templates/demo_ucsb_logo",
    "label": "Demo \\u00b7 Draw UCSB",
    "short_label": "Draw UCSB",
    "summary": "Use ordered waypoints to trace block-letter UCSB across the course arena.",
    "entrypoint": "main.py",
    "published": true
  },
  {
    "id": "micropython_tutorial",
    "group": "tutorials",
    "kind": "tutorial",
    "source": "templates/tutorial_1_python_essentials",
    "label": "Tutorial 1 \\u00b7 Python Essentials",
    "short_label": "Tutorial 1 \\u00b7 Python essentials",
    "summary": "Practice Python values, typed functions, conditions, loops, and collections with immediate examples.",
    "entrypoint": "main.py",
    "published": true
  },
  {
    "id": "tutorial_virtual_drawing",
    "group": "tutorials",
    "kind": "tutorial",
    "source": "templates/tutorial_2_virtual_drawing",
    "label": "Tutorial 2 \\u00b7 Virtual XRP Drawing",
    "short_label": "Tutorial 2 \\u00b7 Virtual XRP drawing",
    "summary": "Use modules, records, classes, inheritance, and loops to draw a path with the Virtual XRP.",
    "entrypoint": "main.py",
    "published": true
  },
  {
    "id": "tutorial_robot_programs",
    "group": "tutorials",
    "kind": "tutorial",
    "source": "templates/tutorial_3_robot_programs",
    "label": "Tutorial 3 \\u00b7 Sampled Robot Programs",
    "short_label": "Tutorial 3 \\u00b7 Sampled robot programs",
    "summary": "Read RobotState records and write a finite sampled robot program without an added delay.",
    "entrypoint": "main.py",
    "published": true
  },
  {
    "id": "tutorial_behavior_telemetry",
    "group": "tutorials",
    "kind": "tutorial",
    "source": "templates/tutorial_4_behavior_telemetry",
    "label": "Tutorial 4 \\u00b7 Behavior, Controls, and Telemetry",
    "short_label": "Tutorial 4 \\u00b7 Behavior, controls, and telemetry",
    "summary": "Combine a measured finite-state behavior with live controls, watch values, and plot signals.",
    "entrypoint": "main.py",
    "published": true
  },
  {
    "id": "tutorial_physical_preflight",
    "group": "tutorials",
    "kind": "tutorial",
    "source": "templates/tutorial_5_physical_preflight",
    "label": "Tutorial 5 \\u00b7 Physical XRP Deployment",
    "short_label": "Tutorial 5 \\u00b7 Physical XRP deployment",
    "summary": "Rehearse virtually, then verify sensors, motors, encoders, telemetry, and stopping on a physical XRP.",
    "entrypoint": "main.py",
    "published": true
  },
  {
    "id": "new_challenge_1_robot_curling",
    "group": "newest-challenges",
    "kind": "challenge",
    "source": "starters/new_challenge_1_robot_curling",
    "label": "1 \\u00b7 Robot Curling",
    "short_label": "1 \\u00b7 Robot Curling",
    "summary": "Travel 1000 mm and stop close to the target as quickly as possible. Develop sensing, wheel-speed feedback, and stopping control.",
    "entrypoint": "main.py",
    "components": [
      {
        "name": "SensorModel",
        "file": "sensor_model.py",
        "selection_flag": "USE_STUDENT_SENSOR_MODEL"
      },
      {
        "name": "WheelSpeedController",
        "file": "wheel_speed_controller.py",
        "selection_flag": "USE_STUDENT_WHEEL_SPEED_CONTROLLER"
      }
    ],
    "published": true
  },
  {
    "id": "new_challenge_2_arena_line_circuit",
    "group": "newest-challenges",
    "kind": "challenge",
    "source": "starters/new_challenge_2_arena_line_circuit",
    "label": "2 \\u00b7 Arena Line Circuit",
    "short_label": "2 \\u00b7 Arena Line Circuit",
    "summary": "Use floor sensors to follow the arena line counterclockwise for one lap.",
    "entrypoint": "main.py",
    "components": [
      {
        "name": "SensorModel",
        "file": "sensor_model.py",
        "selection_flag": "USE_STUDENT_SENSOR_MODEL"
      },
      {
        "name": "WheelSpeedController",
        "file": "wheel_speed_controller.py",
        "selection_flag": "USE_STUDENT_WHEEL_SPEED_CONTROLLER"
      },
      {
        "name": "DifferentialDrive",
        "file": "differential_drive.py",
        "selection_flag": "USE_STUDENT_DIFFERENTIAL_DRIVE"
      },
      {
        "name": "LineFollower",
        "file": "line_follower.py",
        "selection_flag": "USE_STUDENT_LINE_FOLLOWER"
      }
    ],
    "published": true
  },
  {
    "id": "new_challenge_3_waypoint_courier",
    "group": "newest-challenges",
    "kind": "challenge",
    "source": "starters/new_challenge_3_waypoint_courier",
    "label": "3 \\u00b7 Waypoint Courier",
    "short_label": "3 \\u00b7 Waypoint Courier",
    "summary": "Estimate position from wheel travel and visit the marked waypoints in order.",
    "entrypoint": "main.py",
    "components": [
      {
        "name": "SensorModel",
        "file": "sensor_model.py",
        "selection_flag": "USE_STUDENT_SENSOR_MODEL"
      },
      {
        "name": "WheelSpeedController",
        "file": "wheel_speed_controller.py",
        "selection_flag": "USE_STUDENT_WHEEL_SPEED_CONTROLLER"
      },
      {
        "name": "DifferentialDrive",
        "file": "differential_drive.py",
        "selection_flag": "USE_STUDENT_DIFFERENTIAL_DRIVE"
      },
      {
        "name": "Odometry",
        "file": "odometry.py",
        "selection_flag": "USE_STUDENT_ODOMETRY"
      },
      {
        "name": "NavigationController",
        "file": "navigation_controller.py",
        "selection_flag": "USE_STUDENT_NAVIGATION_CONTROLLER"
      }
    ],
    "published": true
  },
  {
    "id": "new_challenge_4_mapped_route",
    "group": "newest-challenges",
    "kind": "challenge",
    "source": "starters/new_challenge_4_mapped_route",
    "label": "4 \\u00b7 Mapped Route",
    "short_label": "4 \\u00b7 Mapped Route",
    "summary": "Find a grid route around mapped obstacles and check its cells before driving.",
    "entrypoint": "main.py",
    "components": [
      {
        "name": "SensorModel",
        "file": "sensor_model.py",
        "selection_flag": "USE_STUDENT_SENSOR_MODEL"
      },
      {
        "name": "WheelSpeedController",
        "file": "wheel_speed_controller.py",
        "selection_flag": "USE_STUDENT_WHEEL_SPEED_CONTROLLER"
      },
      {
        "name": "DifferentialDrive",
        "file": "differential_drive.py",
        "selection_flag": "USE_STUDENT_DIFFERENTIAL_DRIVE"
      },
      {
        "name": "Odometry",
        "file": "odometry.py",
        "selection_flag": "USE_STUDENT_ODOMETRY"
      },
      {
        "name": "NavigationController",
        "file": "navigation_controller.py",
        "selection_flag": "USE_STUDENT_NAVIGATION_CONTROLLER"
      },
      {
        "name": "GridPlanner",
        "file": "grid_planner.py",
        "selection_flag": "USE_STUDENT_GRID_PLANNER"
      }
    ],
    "published": true
  },
  {
    "id": "new_challenge_5_out_and_back",
    "group": "newest-challenges",
    "kind": "challenge",
    "source": "starters/new_challenge_5_out_and_back",
    "label": "5 \\u00b7 Out-and-Back",
    "short_label": "5 \\u00b7 Out-and-Back",
    "summary": "Visit outbound waypoints, measure gate range while stopped, and plan a route home.",
    "entrypoint": "main.py",
    "components": [
      {
        "name": "SensorModel",
        "file": "sensor_model.py",
        "selection_flag": "USE_STUDENT_SENSOR_MODEL"
      },
      {
        "name": "WheelSpeedController",
        "file": "wheel_speed_controller.py",
        "selection_flag": "USE_STUDENT_WHEEL_SPEED_CONTROLLER"
      },
      {
        "name": "DifferentialDrive",
        "file": "differential_drive.py",
        "selection_flag": "USE_STUDENT_DIFFERENTIAL_DRIVE"
      },
      {
        "name": "Odometry",
        "file": "odometry.py",
        "selection_flag": "USE_STUDENT_ODOMETRY"
      },
      {
        "name": "NavigationController",
        "file": "navigation_controller.py",
        "selection_flag": "USE_STUDENT_NAVIGATION_CONTROLLER"
      },
      {
        "name": "GridPlanner",
        "file": "grid_planner.py",
        "selection_flag": "USE_STUDENT_GRID_PLANNER"
      }
    ],
    "published": true
  },
  {
    "id": "new_demo_odometry_calibration",
    "group": "demonstrations",
    "kind": "demo",
    "source": "templates/new_demo_odometry_calibration",
    "label": "Odometry Calibration",
    "short_label": "Odometry Calibration",
    "summary": "Compare estimated and measured pose through bounded straight, arc, turn and square experiments.",
    "entrypoint": "main.py",
    "published": false,
    "components": [
      {
        "name": "SensorModel",
        "file": "sensor_model.py",
        "selection_flag": "USE_STUDENT_SENSOR_MODEL"
      },
      {
        "name": "WheelSpeedController",
        "file": "wheel_speed_controller.py",
        "selection_flag": "USE_STUDENT_WHEEL_SPEED_CONTROLLER"
      },
      {
        "name": "DifferentialDrive",
        "file": "differential_drive.py",
        "selection_flag": "USE_STUDENT_DIFFERENTIAL_DRIVE"
      },
      {
        "name": "Odometry",
        "file": "odometry.py",
        "selection_flag": "USE_STUDENT_ODOMETRY"
      }
    ]
  },
  {
    "id": "new_demo_reflectance_calibration",
    "group": "demonstrations",
    "kind": "demo",
    "source": "templates/new_demo_reflectance_calibration",
    "label": "Reflectance Calibration",
    "short_label": "Reflectance Calibration",
    "summary": "Record two reflectance sensors without motor motion and check floor/tape contrast.",
    "entrypoint": "main.py",
    "published": false
  },
  {
    "id": "new_demo_motor_characterization",
    "group": "demonstrations",
    "kind": "demo",
    "source": "templates/new_demo_motor_characterization",
    "label": "Motor Characterization",
    "short_label": "Motor Characterization",
    "summary": "Measure separate left/right speed responses to bounded open-loop effort steps.",
    "entrypoint": "main.py",
    "published": true
  },
  {
    "id": "new_demo_planning_comparison",
    "group": "demonstrations",
    "kind": "demo",
    "source": "templates/new_demo_planning_comparison",
    "label": "BFS and A* Comparison",
    "short_label": "BFS and A* Comparison",
    "summary": "Compare BFS and heapq A* path cost and expanded cells without starting the robot.",
    "entrypoint": "main.py",
    "published": false
  },
  {
    "id": "complete_new_challenge_1_robot_curling",
    "group": "newest-challenges",
    "kind": "complete-challenge",
    "source": "starters/new_challenge_1_robot_curling",
    "label": "Complete 1 \\u00b7 Robot Curling",
    "short_label": "Complete 1 \\u00b7 Robot Curling",
    "summary": "Completed implementation of Robot Curling.",
    "entrypoint": "main.py",
    "solution_stage": 1,
    "published": true
  },
  {
    "id": "complete_new_challenge_2_arena_line_circuit",
    "group": "newest-challenges",
    "kind": "complete-challenge",
    "source": "starters/new_challenge_2_arena_line_circuit",
    "label": "Complete 2 \\u00b7 Arena Line Circuit",
    "short_label": "Complete 2 \\u00b7 Arena Line Circuit",
    "summary": "Completed implementation of Arena Line Circuit.",
    "entrypoint": "main.py",
    "solution_stage": 2,
    "published": true
  },
  {
    "id": "complete_new_challenge_3_waypoint_courier",
    "group": "newest-challenges",
    "kind": "complete-challenge",
    "source": "starters/new_challenge_3_waypoint_courier",
    "label": "Complete 3 \\u00b7 Waypoint Courier",
    "short_label": "Complete 3 \\u00b7 Waypoint Courier",
    "summary": "Completed implementation of Waypoint Courier.",
    "entrypoint": "main.py",
    "solution_stage": 3,
    "published": true
  },
  {
    "id": "complete_new_challenge_4_mapped_route",
    "group": "newest-challenges",
    "kind": "complete-challenge",
    "source": "starters/new_challenge_4_mapped_route",
    "label": "Complete 4 \\u00b7 Mapped Route",
    "short_label": "Complete 4 \\u00b7 Mapped Route",
    "summary": "Completed implementation of Mapped Route.",
    "entrypoint": "main.py",
    "solution_stage": 4,
    "published": true
  },
  {
    "id": "complete_new_challenge_5_out_and_back",
    "group": "newest-challenges",
    "kind": "complete-challenge",
    "source": "starters/new_challenge_5_out_and_back",
    "label": "Complete 5 \\u00b7 Out-and-Back",
    "short_label": "Complete 5 \\u00b7 Out-and-Back",
    "summary": "Completed implementation of Out-and-Back.",
    "entrypoint": "main.py",
    "solution_stage": 5,
    "published": true
  }
]
`,T=`x = -1524 to 1524 mm and y = -609.6 to 609.6 mm`;function E(e){let t=e.worlds.findIndex(e=>e.bounds.minimumXmm!==o.minimumXmm||e.bounds.minimumYmm!==o.minimumYmm||e.bounds.maximumXmm!==o.maximumXmm||e.bounds.maximumYmm!==o.maximumYmm);return t<0?null:`worlds[${t}].bounds must match the fixed course arena (${T})`}function D(e){return`minimumXmm`in e?{minimum_x_mm:e.minimumXmm,minimum_y_mm:e.minimumYmm,maximum_x_mm:e.maximumXmm,maximum_y_mm:e.maximumYmm}:null}function O(e){return e.type===`start_line`||e.type===`finish_line`?{x1_mm:e.x1Mm,y1_mm:e.y1Mm,x2_mm:e.x2Mm,y2_mm:e.y2Mm}:e.type===`start_box`||e.type===`finish_box`?D(e)??{}:{x_mm:e.xMm,y_mm:e.yMm,...e.type===`waypoint`&&e.headingRad!==void 0?{heading_rad:e.headingRad}:{}}}function k(e,t){return t.kind===`bounds`?{minimum_x_mm:e.bounds.minimumXmm,minimum_y_mm:e.bounds.minimumYmm,maximum_x_mm:e.bounds.maximumXmm,maximum_y_mm:e.bounds.maximumYmm}:t.kind===`initial_pose`?{x_mm:e.initialPose.xMm,y_mm:e.initialPose.yMm,heading_rad:e.initialPose.headingRad}:t.kind===`obstacle`?D(e.obstacles[t.index])??{}:O(e.markers[t.index])}function A(e,t){let n=e.label??(`name`in e?e.name:void 0);return`${e.type.replaceAll(`_`,` `)}${n?` · ${n}`:` ${t+1}`}`}var j=110,M=90;function N(e,t){if(typeof e!=`object`||!e||Array.isArray(e))throw Error(`${t} must be an object`);return e}function P(e,t){if(!Array.isArray(e))throw Error(`${t} must be a list`);return e}function F(e){return structuredClone(e)}function ee(e){return`${JSON.stringify(e,null,2)}\n`}function I(e){let t=a(e),n=E(t);if(n)throw Error(n);return{raw:N(JSON.parse(e),`world.json`),catalog:t}}function L(e,t){let{raw:n}=I(e),r=F(n);t(r);let i=ee(r);return I(i),i}function R(e){try{return N(JSON.parse(e),`world.json`)}catch{return null}}function z(e){return typeof e==`number`&&Number.isFinite(e)?String(Number.isInteger(e)?e:Number(e.toFixed(3))):`?`}function te(e,t,n){let r=typeof e?.type==`string`?e.type.replaceAll(`_`,` `):t===`markers`?`marker`:`obstacle`,i=typeof e?.label==`string`&&e.label.trim()?e.label.trim():typeof e?.name==`string`&&e.name.trim()?e.name.trim():``,a=r.charAt(0).toUpperCase()+r.slice(1);return i?`${a} “${i}”`:`${a} ${n+1}`}function B(e,t,n){let r=t instanceof Error?t.message:String(t),i=R(e)??(n===void 0?null:R(n)),a=r.match(/^worlds\[(\d+)]\.(markers|obstacles)\[(\d+)] must be inside the world bounds$/);if(a){let e=Number(a[1]),t=a[2],n=Number(a[3]),o=(Array.isArray(i?.worlds)?i.worlds:[])[e],s=o&&typeof o==`object`&&!Array.isArray(o)?o:null,c=(Array.isArray(s?.[t])?s[t]:[])[n],l=c&&typeof c==`object`&&!Array.isArray(c)?c:null,u=s?.bounds,d=u&&typeof u==`object`&&!Array.isArray(u)?u:null,f=typeof s?.label==`string`&&s.label.trim()?` in world “${s.label.trim()}”`:``;return{summary:`${te(l,t,n)} is outside the arena${f}.`,guidance:`Keep the entire item within x = ${z(d?.minimum_x_mm)} to ${z(d?.maximum_x_mm)} mm and y = ${z(d?.minimum_y_mm)} to ${z(d?.maximum_y_mm)} mm.`,technical:r}}let o=r.match(/^worlds\[(\d+)]\.initial_pose must be inside the bounds$/);if(o){let e=Number(o[1]),t=(Array.isArray(i?.worlds)?i.worlds:[])[e],n=(t&&typeof t==`object`&&!Array.isArray(t)?t:null)?.bounds,a=n&&typeof n==`object`&&!Array.isArray(n)?n:null;return{summary:`The initial XRP pose is outside the arena.`,guidance:`Place its center within x = ${z(a?.minimum_x_mm)} to ${z(a?.maximum_x_mm)} mm and y = ${z(a?.minimum_y_mm)} to ${z(a?.maximum_y_mm)} mm.`,technical:r}}return r.startsWith(`world.json is not valid JSON:`)?{summary:`Advanced world.json contains incomplete or invalid JSON.`,guidance:`Correct the JSON text, or restore the last valid world configuration.`,technical:r}:/worlds\[\d+]\.bounds must have positive width and height/.test(r)?{summary:`The arena bounds do not form a positive rectangle.`,guidance:`Each maximum coordinate must be greater than its corresponding minimum coordinate.`,technical:r}:r.includes(`bounds must match the fixed course arena`)?{summary:`Every challenge world uses the fixed course arena.`,guidance:`Restore the bounds to ${T}; place task geometry inside that arena instead of resizing it.`,technical:r}:{summary:`The world configuration cannot be used by the graphic editor.`,guidance:`Correct the affected world value, or restore the last valid world configuration.`,technical:r}}function V(e){return P(e.worlds,`worlds`).map((e,t)=>N(e,`worlds[${t}]`))}function H(e,t){let n=V(e).find(e=>e.id===t);if(!n)throw Error(`Unknown world '${t}'`);return n}function U(e,t){let n=new Set(V(e).map(e=>String(e.id)));if(!n.has(t))return t;let r=2;for(;n.has(`${t}-${r}`);)r+=1;return`${t}-${r}`}function ne(e){return{x:(e.bounds.minimumXmm+e.bounds.maximumXmm)/2,y:(e.bounds.minimumYmm+e.bounds.maximumYmm)/2}}function re(e,t){let n=ne(e),r=e.bounds.maximumXmm-e.bounds.minimumXmm,i=e.bounds.maximumYmm-e.bounds.minimumYmm,a=Math.min(100,r/4),o=Math.min(50,i/4),s=Math.min(125,i/4),c=Math.min(100,r/4),l=Math.min(100,i/4);return t===`wall`||t===`block`?{type:t,minimum_x_mm:n.x-a,minimum_y_mm:n.y-o,maximum_x_mm:n.x+a,maximum_y_mm:n.y+o,label:t===`wall`?`Wall`:`Block`}:t===`start_line`||t===`finish_line`?{type:t,x1_mm:n.x,y1_mm:n.y-s,x2_mm:n.x,y2_mm:n.y+s,label:t===`start_line`?`Start`:`Finish`}:t===`start_box`||t===`finish_box`?{type:t,minimum_x_mm:n.x-c,minimum_y_mm:n.y-l,maximum_x_mm:n.x+c,maximum_y_mm:n.y+l,label:t===`start_box`?`Start`:`Finish`}:t===`waypoint`?{type:t,name:`waypoint`,x_mm:n.x,y_mm:n.y,label:`Waypoint`}:{type:`marker`,name:`marker`,x_mm:n.x,y_mm:n.y,label:`Marker`}}function ie(e,t){let n=new Set(e.flatMap(e=>{let t=N(e,`item`);return typeof t.name==`string`?[t.name]:[]}));if(!n.has(t))return t;let r=2;for(;n.has(`${t}_${r}`);)r+=1;return`${t}_${r}`}function ae(e){let t=`world`;return{source:L(e,e=>{let n=P(e.worlds,`worlds`);t=U(e,`world`),n.push({id:t,label:`New world`,bounds:{minimum_x_mm:o.minimumXmm,minimum_y_mm:o.minimumYmm,maximum_x_mm:o.maximumXmm,maximum_y_mm:o.maximumYmm},initial_pose:{x_mm:0,y_mm:0,heading_rad:0},obstacles:[],markers:[]})}),worldId:t}}function oe(e,t){let n=t;return{source:L(e,e=>{let r=P(e.worlds,`worlds`),i=r.findIndex(e=>N(e,`world`).id===t);if(i<0)throw Error(`Unknown world '${t}'`);let a=N(r[i],`world`);n=U(e,`${t}-copy`);let o=F(a);o.id=n,o.label=`${String(a.label)} copy`,r.splice(i+1,0,o)}),worldId:n}}function se(e,t){let n=t;return{source:L(e,e=>{let r=P(e.worlds,`worlds`);if(r.length<=1)throw Error(`The last world cannot be deleted`);let i=r.findIndex(e=>N(e,`world`).id===t);if(i<0)throw Error(`Unknown world '${t}'`);r.splice(i,1);let a=N(r[Math.min(i,r.length-1)],`world`);n=String(a.id),e.default_world===t&&(e.default_world=n)}),worldId:n}}function ce(e,t){return L(e,e=>{H(e,t),e.default_world=t})}function le(e,t,n,r){let i=t;return{source:L(e,e=>{let a=H(e,t);a[n]=r,n===`id`&&(i=r,e.default_world===t&&(e.default_world=r))}),worldId:i}}function ue(e,t,n,r,i){return de(e,t,n,{[r]:i})}function de(e,t,n,r){return L(e,e=>{let i=H(e,t),a;if(n.kind===`bounds`)throw Error(`Course arena bounds are fixed`);if(n.kind===`initial_pose`)a=N(i.initial_pose,`initial_pose`);else{let e=n.kind===`obstacle`?`obstacles`:`markers`;a=N(P(i[e],e)[n.index],`${e}[${n.index}]`)}Object.assign(a,r)})}function fe(e,t,n,r,i){return L(e,e=>{let a=H(e,t),o=n.kind===`obstacle`?`obstacles`:`markers`,s=N(P(a[o],o)[n.index],`${o}[${n.index}]`);i.trim()?s[r]=i:delete s[r]})}function pe(e,t,n){let{catalog:r}=I(e),i=r.worlds.find(e=>e.id===t);if(!i)throw Error(`Unknown world '${t}'`);let a={kind:`initial_pose`};return{source:L(e,e=>{let r=H(e,t),o=n===`wall`||n===`block`?`obstacles`:`markers`,s=P(r[o],o),c=re(i,n);typeof c.name==`string`&&(c.name=ie(s,c.name)),s.push(c),a={kind:o===`obstacles`?`obstacle`:`marker`,index:s.length-1}}),selection:a}}function me(e,t,n){return L(e,e=>{let r=H(e,t),i=n.kind===`obstacle`?`obstacles`:`markers`;P(r[i],i).splice(n.index,1)})}function he(e,t,n,r){let i=n;return{source:L(e,e=>{let a=P(H(e,t).markers,`markers`);if(N(a[n],`markers[${n}]`).type!==`waypoint`)return;let o=n+r;for(;o>=0&&o<a.length;){if(N(a[o],`markers[${o}]`).type===`waypoint`){[a[n],a[o]]=[a[o],a[n]],i=o;return}o+=r}}),markerIndex:i}}function ge(e,t){return t<=0?e:Math.round(e/t)*t}function _e(e){let t=Math.cos(e.initialPose.headingRad),n=Math.sin(e.initialPose.headingRad),r=[[-110,-90],[j,-90],[j,M],[-110,M]].map(([r=0,i=0])=>({x:e.initialPose.xMm+r*t-i*n,y:e.initialPose.yMm+r*n+i*t})),i=e.obstacles.find(e=>{let t=[{x:e.minimumXmm,y:e.minimumYmm},{x:e.maximumXmm,y:e.minimumYmm},{x:e.maximumXmm,y:e.maximumYmm},{x:e.minimumXmm,y:e.maximumYmm}];return[{x:1,y:0},{x:0,y:1},...r.map((e,t)=>{let n=r[(t+1)%r.length],i={x:n.x-e.x,y:n.y-e.y};return{x:-i.y,y:i.x}})].every(e=>{let n=r.map(t=>t.x*e.x+t.y*e.y),i=t.map(t=>t.x*e.x+t.y*e.y);return Math.max(...n)>=Math.min(...i)&&Math.max(...i)>=Math.min(...n)})});return i?[{code:`initial-footprint-collision`,message:`The initial XRP footprint overlaps ${i.label??`a ${i.type}`}.`}]:[]}async function ve(e){if(x(e.name))throw Error(`The class Wi-Fi file belongs in the Working folder. Choose a challenge specification instead.`);let t=await e.text();try{return JSON.parse(t)}catch{throw Error(`The selected file is not a valid JSON challenge specification.`)}}var ye=new Map(JSON.parse(w).filter(e=>e.kind===`challenge`).map(e=>[e.id,new Map((e.components??[]).map(e=>[e.file,e]))]));function W(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}function be(e,t){return typeof e==`string`&&e.trim()&&!e.includes(`
`)?null:`${t} must be one nonempty line.`}function G(e){return e.split(`
`).map(e=>e.trim()).filter(Boolean)}function xe(e){return G(e).map(e=>{let t=e.indexOf(`|`);return t<0?{name:e,use:``}:{name:e.slice(0,t).trim(),use:e.slice(t+1).trim()}})}function Se(e){return e.map(e=>`${e.name} | ${e.use}`).join(`
`)}function K(e){if(!W(e))return[`The specification must be a JSON object.`];let t=[];e.schema_version!==1&&t.push(`Schema version must be 1.`);for(let[n,r]of[[`source_id`,`Starting challenge`],[`id`,`Challenge ID`],[`title`,`Title`],[`summary`,`Catalog summary`]]){let i=be(e[n],r);i&&t.push(i)}typeof e.id==`string`&&!/^challenge_[1-9][0-9]*$/.test(e.id)&&t.push(`Challenge ID must have the form challenge_6.`);for(let[n,r]of[[`objective`,`Objective`],[`program_flow`,`Program sequence`]])(typeof e[n]!=`string`||!e[n].trim())&&t.push(`${r} is required.`);for(let[n,r]of[[`evidence`,`Evidence`],[`work_sequence`,`Work sequence`]])(!Array.isArray(e[n])||e[n].length===0||e[n].some(e=>typeof e!=`string`||!e.trim()))&&t.push(`${r} must contain at least one nonempty item.`);if(!Array.isArray(e.student_implementations)||e.student_implementations.length===0)t.push(`Select at least one student implementation.`);else{let n=new Set;e.student_implementations.forEach((r,i)=>{if(!W(r)||[`file`,`class_name`,`selection_flag`,`responsibility`].some(e=>typeof r[e]!=`string`||!r[e].trim())){t.push(`Student implementation ${i+1} is incomplete.`);return}/^(?!\.)(?!.*(?:^|\/)\.\.?(?:\/|$))[A-Za-z0-9_/-]+\.py$/.test(r.file)||t.push(`Student implementation ${i+1} needs a safe project-relative Python file.`),/^[A-Za-z_][A-Za-z0-9_]*$/.test(r.class_name)||t.push(`Student implementation ${i+1} needs a valid Python class name.`),/^USE_STUDENT_[A-Z][A-Z0-9_]*$/.test(r.selection_flag)||t.push(`Student implementation ${i+1} needs a selection flag such as USE_STUDENT_LOCALIZER.`);let a=r.file,o=r.class_name,s=typeof e.source_id==`string`?ye.get(e.source_id)?.get(a):void 0,c=W(e.files)?e.files[a]:void 0;!s&&typeof c!=`string`&&t.push(`Student implementation ${i+1} needs a complete ${a} project-file override.`),s&&s.name!==o&&t.push(`${a} defines ${s.name} in the starting challenge, not ${o}.`),s&&s.selection_flag!==r.selection_flag&&t.push(`${o} must retain selection flag ${s.selection_flag}.`),typeof c==`string`&&/^[A-Za-z_][A-Za-z0-9_]*$/.test(o)&&!RegExp(`(^|\\n)\\s*class\\s+${o}\\b`).test(c)&&t.push(`The ${a} override must define class ${o}.`);let l=`${r.file}\0${r.class_name}`;n.has(l)&&t.push(`Student implementation ${i+1} duplicates an earlier file and class.`),n.add(l)})}if(!Array.isArray(e.supplied_files)||e.supplied_files.length===0)t.push(`Describe the supplied project files and services.`);else{let n=e.supplied_files,r=new Set;n.forEach((e,n)=>{if(!W(e)||typeof e.name!=`string`||!e.name.trim()||typeof e.use!=`string`||!e.use.trim()){t.push(`Supplied item ${n+1} needs a name and use.`);return}let i=e.name.trim();r.has(i)&&t.push(`Supplied item ${n+1} duplicates ${i}.`),r.add(i)}),n.some(e=>W(e)&&e.name===`world.json`)||t.push(`The supplied items must explain world.json.`)}let n=null;if(!W(e.world))t.push(`World JSON must contain one object.`);else try{n=a(JSON.stringify(e.world))}catch(e){t.push(`World JSON: ${e instanceof Error?e.message:String(e)}`)}if(n!==null){let r=E(n);r&&t.push(`World JSON: ${r}`);let i=n.worlds.find(e=>e.id===n?.defaultWorldId);if(i){let n=new Set(i.markers.flatMap(e=>e.type===`waypoint`&&e.name?[e.name]:[])),r=W(e.files)&&typeof e.files[`challenge.py`]==`string`,a=typeof e.source_id==`string`?{challenge_1:`finish`,challenge_2:`turn`,challenge_4:`destination`,challenge_5:`destination`}[e.source_id]:void 0;if(!r&&a&&!n.has(a)&&t.push(`${e.source_id} source requires a waypoint named ${a}.`),!r&&e.source_id===`challenge_2`){let e=i.markers.find(e=>e.type===`waypoint`&&e.name===`turn`);e?.type===`waypoint`&&e.headingRad===void 0&&t.push(`challenge_2 source requires the turn waypoint to define heading_rad.`)}!r&&e.source_id===`challenge_3`&&n.size===0&&t.push(`challenge_3 source requires at least one waypoint.`),!r&&e.source_id===`challenge_5`&&!i.obstacles.some(e=>e.feature===`center_gate`)&&t.push(`challenge_5 source requires an obstacle feature named center_gate.`)}}if(e.files!==void 0)if(!W(e.files))t.push(`Project file overrides must be a path-to-text object.`);else for(let[n,r]of Object.entries(e.files)){if(x(n)){t.push(`Class Wi-Fi credentials cannot be included in challenge files.`);continue}if(n===`README.md`||n===`world.json`){t.push(`${n} is generated from its specification fields.`);continue}(n.startsWith(`/`)||n.includes(`\\`)||n.includes(`:`)||n.split(`/`).some(e=>e===`.`||e===`..`)||!/\.(json|md|py|txt)$/.test(n)||typeof r!=`string`)&&t.push(`Project file override ${n} is invalid.`)}return t}function Ce(e){return`${e.id||`challenge`}.challenge.json`}function we(e){return`python3 scripts/challenge_authoring.py create --spec ${e}`}function q(e){return e.replaceAll(`|`,`\\|`).replaceAll(`
`,` `)}function Te(e){return[`# Challenge ${e.id.split(`_`).at(-1)??e.id}: ${e.title}`,``,`## Goal`,``,e.objective.trim(),``,`## Files supplied for this task`,``,`| File or service | What it provides |`,`| --- | --- |`,...e.supplied_files.map(e=>`| \`${q(e.name)}\` | ${q(e.use)} |`),``,`## Classes you implement`,``,"| Project file | Class | Run selector in `course_setup.py` | Required work |",`| --- | --- | --- | --- |`,...e.student_implementations.map(e=>`| \`${q(e.file)}\` | \`${q(e.class_name)}\` | \`${q(e.selection_flag)}\` | ${q(e.responsibility)} |`),``,"**Test functions** calls your methods with example inputs and compares their results with expected values. In `course_setup.py`, set the `USE_STUDENT_*` entry for each class you have implemented to `True` to use it when you run the robot.",``,`## Program sequence`,``,...G(e.program_flow).map((e,t)=>`${t+1}. ${e}`),``,`## Check and run`,``,...e.work_sequence.map((e,t)=>`${t+1}. ${e}`),``,`## Evidence to record`,``,...e.evidence.map(e=>`- ${e}`),``].join(`
`)+`
`}function Ee(e){let t=K(e);if(t.length>0)throw Error(t[0]);let n=l(e.source_id).project;return{name:`${e.id.split(`_`).at(-1)??e.id} · ${e.title}`,entrypoint:n.entrypoint,files:{...n.files,...e.files??{},"README.md":Te(e),"world.json":`${JSON.stringify(e.world,null,2)}\n`}}}function De(e,t){let n=new Set(t),r=e.files??{};if(n.size!==t.length||[...n].some(e=>!(e in r)))throw Error(`Select only listed project file overrides for sharing.`);let i={...e,files:Object.fromEntries(Object.entries(r).filter(([e])=>n.has(e)))},a=K(i);if(a.length)throw Error(a[0]);let o=Ee(i),s={format:`ucsb-xrp-shared-challenge`,schema_version:1,specification:i,project:{...o,name:o.name??e.title},included_overrides:[...n]};if(y(s),new TextEncoder().encode(JSON.stringify(s)).byteLength>5242880)throw Error(`The student activity package exceeds the 5 MB import limit.`);return s}function Oe(e){return JSON.stringify(e)}function ke(e,t,n){return!n&&e===t}var J=n(),Ae=800,je=520;function Y(e){return e.kind===`obstacle`||e.kind===`marker`?`${e.kind}-${e.index}`:e.kind}function Me(e){let t=e.bounds.maximumXmm-e.bounds.minimumXmm,n=e.bounds.maximumYmm-e.bounds.minimumYmm,r=Math.min(716/t,436/n),i=t*r,a=n*r,o=(Ae-i)/2,s=(je-a)/2;return{x:t=>o+(t-e.bounds.minimumXmm)*r,y:t=>s+(e.bounds.maximumYmm-t)*r,worldX:t=>e.bounds.minimumXmm+(t-o)/r,worldY:t=>e.bounds.maximumYmm-(t-s)/r,width:i,height:a}}function Ne(e){let t=Math.max(e.bounds.maximumXmm-e.bounds.minimumXmm,e.bounds.maximumYmm-e.bounds.minimumYmm);return t<=1500?100:t<=3e3?250:t<=6e3?500:1e3}function Pe(e,t,n){let r=[];for(let i=Math.ceil(e/n)*n;i<=t;i+=n)r.push(i);return r}function Fe(e,t){let n=Math.cos(e.initialPose.headingRad),r=Math.sin(e.initialPose.headingRad);return[[-110,-90],[110,-90],[110,90],[-110,90]].map(([i=0,a=0])=>{let o=e.initialPose.xMm+i*n-a*r,s=e.initialPose.yMm+i*r+a*n;return`${t.x(o)},${t.y(s)}`}).join(` `)}function Ie({source:e,world:t,selection:n,snap:r,onChange:i,onError:a,onSelectionChange:o}){let s=(0,S.useRef)(null),c=(0,S.useRef)(null),l=Me(t);function u(e){try{i(e()),a(``)}catch(e){a(e instanceof Error?e.message:String(e))}}function d(e){let t=s.current?.getScreenCTM();if(!t)return null;let n=new DOMPoint(e.clientX,e.clientY).matrixTransform(t.inverse());return{x:l.worldX(n.x),y:l.worldY(n.y)}}function f(n,r,i){let a=s.current,u=a?.getScreenCTM();if(!a||!u)return;let d=new DOMPoint(n.clientX,n.clientY).matrixTransform(u.inverse());c.current={source:e,selection:r,handle:i,startX:l.worldX(d.x),startY:l.worldY(d.y),values:k(t,r)},o(r),a.setPointerCapture(n.pointerId),n.preventDefault(),n.stopPropagation()}function p(e){let n=c.current,i=d(e);if(!n||!i)return;let a=i.x-n.startX,o=i.y-n.startY,s=e=>ge(e,r),l={},f=n.values;if(n.handle===`heading`)l.heading_rad=Math.atan2(i.y-(f.y_mm??0),i.x-(f.x_mm??0));else if(n.handle===`line-1`||n.handle===`line-2`){let e=n.handle===`line-1`?`1`:`2`;l[`x${e}_mm`]=s(i.x),l[`y${e}_mm`]=s(i.y)}else if(n.handle.startsWith(`rect-`)){let e=n.handle.includes(`min-min`)||n.handle.includes(`min-max`)?`minimum_x_mm`:`maximum_x_mm`,t=n.handle.includes(`min-min`)||n.handle.includes(`max-min`)?`minimum_y_mm`:`maximum_y_mm`,r=s(i.x),a=s(i.y);(e===`minimum_x_mm`&&r<(f.maximum_x_mm??1/0)||e===`maximum_x_mm`&&r>(f.minimum_x_mm??-1/0))&&(l[e]=r),(t===`minimum_y_mm`&&a<(f.maximum_y_mm??1/0)||t===`maximum_y_mm`&&a>(f.minimum_y_mm??-1/0))&&(l[t]=a)}else n.selection.kind===`initial_pose`||n.selection.kind===`marker`&&`x_mm`in f?(l.x_mm=s((f.x_mm??0)+a),l.y_mm=s((f.y_mm??0)+o)):`x1_mm`in f?(l.x1_mm=s((f.x1_mm??0)+a),l.y1_mm=s((f.y1_mm??0)+o),l.x2_mm=s((f.x2_mm??0)+a),l.y2_mm=s((f.y2_mm??0)+o)):(l.minimum_x_mm=s((f.minimum_x_mm??0)+a),l.minimum_y_mm=s((f.minimum_y_mm??0)+o),l.maximum_x_mm=s((f.maximum_x_mm??0)+a),l.maximum_y_mm=s((f.maximum_y_mm??0)+o));u(()=>de(n.source,t.id,n.selection,l))}function m(e){c.current&&e.currentTarget.hasPointerCapture(e.pointerId)&&e.currentTarget.releasePointerCapture(e.pointerId),c.current=null}function h(e,t,r){let i=Y(n)===Y(t),a=l.x(e.minimumXmm),o=l.x(e.maximumXmm),s=l.y(e.maximumYmm),c=l.y(e.minimumYmm),u=[[`rect-min-min`,a,c],[`rect-min-max`,a,s],[`rect-max-min`,o,c],[`rect-max-max`,o,s]];return(0,J.jsxs)(`g`,{children:[(0,J.jsx)(`rect`,{"aria-label":A(e,`index`in t?t.index:0),className:`${r}${i?` is-selected`:``}`,height:c-s,width:o-a,x:a,y:s,onPointerDown:e=>f(e,t,`move`)}),i&&u.map(([n,r,i])=>(0,J.jsx)(`circle`,{"aria-label":`Resize ${e.type}`,className:`world-editor-handle`,cx:r,cy:i,r:6,onPointerDown:e=>f(e,t,n)},n))]},Y(t))}function g(e,r){let i={kind:`marker`,index:r},a=Y(n)===Y(i);if(e.type===`start_box`||e.type===`finish_box`)return h(e,i,`world-${e.type}`);if(e.type===`start_line`||e.type===`finish_line`)return(0,J.jsxs)(`g`,{children:[(0,J.jsx)(`line`,{"aria-label":A(e,r),className:`world-${e.type}${a?` is-selected`:``}`,x1:l.x(e.x1Mm),x2:l.x(e.x2Mm),y1:l.y(e.y1Mm),y2:l.y(e.y2Mm),onPointerDown:e=>f(e,i,`move`)}),a&&(0,J.jsxs)(J.Fragment,{children:[(0,J.jsx)(`circle`,{"aria-label":`Move ${e.type} first endpoint`,className:`world-editor-handle`,cx:l.x(e.x1Mm),cy:l.y(e.y1Mm),r:6,onPointerDown:e=>f(e,i,`line-1`)}),(0,J.jsx)(`circle`,{"aria-label":`Move ${e.type} second endpoint`,className:`world-editor-handle`,cx:l.x(e.x2Mm),cy:l.y(e.y2Mm),r:6,onPointerDown:e=>f(e,i,`line-2`)})]})]},`marker-${r}`);let o=l.x(e.xMm),s=l.y(e.yMm),c=t.markers.slice(0,r+1).filter(e=>e.type===`waypoint`).length;return(0,J.jsxs)(`g`,{"aria-label":A(e,r),className:`world-point world-${e.type}${a?` is-selected`:``}`,onPointerDown:e=>f(e,i,`move`),children:[e.type===`waypoint`?(0,J.jsx)(`circle`,{cx:o,cy:s,r:10}):(0,J.jsx)(`path`,{d:`M ${o} ${s-10} L ${o+10} ${s} L ${o} ${s+10} L ${o-10} ${s} Z`}),(0,J.jsx)(`text`,{x:o+13,y:s-10,children:e.type===`waypoint`?c:e.label??e.name??`Marker`})]},`marker-${r}`)}let _=Ne(t),v=_e(t),y=t.initialPose.xMm+Math.cos(t.initialPose.headingRad)*180,b=t.initialPose.yMm+Math.sin(t.initialPose.headingRad)*180;return(0,J.jsxs)(`div`,{className:`world-editor-canvas-panel`,children:[(0,J.jsxs)(`svg`,{"aria-label":`Graphic editor for ${t.label}`,className:`world-editor-canvas`,onPointerDown:()=>o({kind:`bounds`}),onPointerMove:p,onPointerUp:m,onPointerCancel:m,preserveAspectRatio:`xMidYMid meet`,ref:s,role:`img`,viewBox:`0 0 ${Ae} ${je}`,children:[(0,J.jsx)(`defs`,{children:(0,J.jsx)(`clipPath`,{id:`world-bounds-${t.id}`,children:(0,J.jsx)(`rect`,{height:l.height,width:l.width,x:l.x(t.bounds.minimumXmm),y:l.y(t.bounds.maximumYmm)})})}),(0,J.jsx)(`rect`,{className:`world-arena`,height:l.height,width:l.width,x:l.x(t.bounds.minimumXmm),y:l.y(t.bounds.maximumYmm)}),(0,J.jsxs)(`g`,{clipPath:`url(#world-bounds-${t.id})`,children:[Pe(t.bounds.minimumXmm,t.bounds.maximumXmm,_).map(e=>(0,J.jsx)(`line`,{className:e===0?`world-grid-axis`:`world-grid-line`,x1:l.x(e),x2:l.x(e),y1:l.y(t.bounds.minimumYmm),y2:l.y(t.bounds.maximumYmm)},`x-${e}`)),Pe(t.bounds.minimumYmm,t.bounds.maximumYmm,_).map(e=>(0,J.jsx)(`line`,{className:e===0?`world-grid-axis`:`world-grid-line`,x1:l.x(t.bounds.minimumXmm),x2:l.x(t.bounds.maximumXmm),y1:l.y(e),y2:l.y(e)},`y-${e}`)),(0,J.jsxs)(`g`,{"aria-label":`Initial XRP pose`,className:`world-initial-pose${n.kind===`initial_pose`?` is-selected`:``}`,onPointerDown:e=>f(e,{kind:`initial_pose`},`move`),children:[(0,J.jsx)(`polygon`,{points:Fe(t,l)}),(0,J.jsx)(`line`,{x1:l.x(t.initialPose.xMm),x2:l.x(y),y1:l.y(t.initialPose.yMm),y2:l.y(b)})]}),t.obstacles.map((e,t)=>h(e,{kind:`obstacle`,index:t},`world-obstacle world-${e.type}`)),t.markers.map(g),n.kind===`initial_pose`&&(0,J.jsx)(`circle`,{"aria-label":`Move initial XRP pose`,className:`world-editor-heading-handle`,cx:l.x(t.initialPose.xMm),cy:l.y(t.initialPose.yMm),r:7,onPointerDown:e=>f(e,{kind:`initial_pose`},`move`)}),(0,J.jsx)(`circle`,{"aria-label":`Set initial XRP heading`,className:`world-editor-heading-handle`,cx:l.x(y),cy:l.y(b),r:7,onPointerDown:e=>f(e,{kind:`initial_pose`},`heading`)})]})]}),(0,J.jsx)(`div`,{className:`world-editor-canvas-note`,children:`Drag items to move them. Selected rectangles and lines show resize handles. Dimensions are millimeters.`}),v.map(e=>(0,J.jsxs)(`div`,{className:`world-editor-warning`,children:[`Warning: `,e.message]},e.code))]})}function Le({label:e,value:t,onChange:n,disabled:r=!1}){return(0,J.jsxs)(`label`,{children:[e,(0,J.jsx)(`input`,{inputMode:`decimal`,type:`number`,disabled:r,value:Number.isFinite(t)?t:``,onChange:e=>{let t=e.currentTarget.valueAsNumber;Number.isFinite(t)&&n(t)}})]})}function Re({source:e,world:t,selection:n,onChange:r,onError:i,onSelectionChange:a}){let[o,s]=(0,S.useState)(`wall`),c=n.kind===`obstacle`?t.obstacles[n.index]:n.kind===`marker`?t.markers[n.index]:null,l=k(t,n);function u(e){try{e(),i(``)}catch(e){i(e instanceof Error?e.message:String(e))}}function d(i,a){u(()=>r(ue(e,t.id,n,i,a)))}return(0,J.jsxs)(`aside`,{className:`world-editor-inspector`,children:[(0,J.jsxs)(`div`,{className:`world-editor-add-row`,children:[(0,J.jsxs)(`select`,{"aria-label":`World item type`,value:o,onChange:e=>s(e.target.value),children:[(0,J.jsx)(`option`,{value:`wall`,children:`Wall`}),(0,J.jsx)(`option`,{value:`block`,children:`Block`}),(0,J.jsx)(`option`,{value:`start_line`,children:`Start line`}),(0,J.jsx)(`option`,{value:`finish_line`,children:`Finish line`}),(0,J.jsx)(`option`,{value:`start_box`,children:`Start box`}),(0,J.jsx)(`option`,{value:`finish_box`,children:`Finish box`}),(0,J.jsx)(`option`,{value:`waypoint`,children:`Waypoint`}),(0,J.jsx)(`option`,{value:`marker`,children:`Visual marker`})]}),(0,J.jsx)(`button`,{type:`button`,onClick:()=>u(()=>{let n=pe(e,t.id,o);r(n.source),a(n.selection)}),children:`Add item`})]}),(0,J.jsxs)(`div`,{className:`world-editor-object-list`,"aria-label":`World items`,children:[(0,J.jsx)(`button`,{className:n.kind===`bounds`?`is-selected`:``,type:`button`,onClick:()=>a({kind:`bounds`}),children:`Course arena (fixed)`}),(0,J.jsx)(`button`,{className:n.kind===`initial_pose`?`is-selected`:``,type:`button`,onClick:()=>a({kind:`initial_pose`}),children:`Initial XRP pose`}),t.obstacles.map((e,t)=>(0,J.jsx)(`button`,{className:n.kind===`obstacle`&&n.index===t?`is-selected`:``,type:`button`,onClick:()=>a({kind:`obstacle`,index:t}),children:A(e,t)},`obstacle-list-${t}`)),t.markers.map((e,t)=>(0,J.jsx)(`button`,{className:n.kind===`marker`&&n.index===t?`is-selected`:``,type:`button`,onClick:()=>a({kind:`marker`,index:t}),children:A(e,t)},`marker-list-${t}`))]}),(0,J.jsxs)(`div`,{className:`world-editor-properties`,children:[(0,J.jsx)(`h3`,{children:n.kind===`bounds`?`Course arena (fixed)`:n.kind===`initial_pose`?`Initial XRP pose`:c?A(c,`index`in n?n.index:0):`Item`}),c&&(n.kind===`obstacle`||n.kind===`marker`)&&(0,J.jsxs)(`div`,{className:`world-editor-text-properties`,children:[(0,J.jsxs)(`label`,{children:[n.kind===`obstacle`?`Feature name`:`Name`,(0,J.jsx)(`input`,{value:n.kind===`obstacle`?c.feature??``:`name`in c?c.name??``:``,onChange:i=>u(()=>r(fe(e,t.id,n,n.kind===`obstacle`?`feature`:`name`,i.target.value)))})]}),(0,J.jsxs)(`label`,{children:[`Label`,(0,J.jsx)(`input`,{value:c.label??``,onChange:i=>u(()=>r(fe(e,t.id,n,`label`,i.target.value)))})]})]}),(0,J.jsx)(`div`,{className:`world-editor-number-grid`,children:Object.entries(l).map(([e,t])=>(0,J.jsx)(Le,{label:e.replaceAll(`_`,` `),value:t,disabled:n.kind===`bounds`,onChange:t=>d(e,t)},e))}),n.kind===`bounds`&&(0,J.jsx)(`p`,{children:`All projects use the 3048 × 1219.2 mm course arena. Position the scenario geometry and initial pose within these fixed bounds.`}),n.kind===`marker`&&t.markers[n.index]?.type===`waypoint`&&(0,J.jsxs)(`div`,{className:`world-editor-reorder`,children:[(0,J.jsx)(`span`,{children:`Route order`}),(0,J.jsx)(`button`,{type:`button`,onClick:()=>u(()=>{let i=he(e,t.id,n.index,-1);r(i.source),a({kind:`marker`,index:i.markerIndex})}),children:`Earlier`}),(0,J.jsx)(`button`,{type:`button`,onClick:()=>u(()=>{let i=he(e,t.id,n.index,1);r(i.source),a({kind:`marker`,index:i.markerIndex})}),children:`Later`})]}),(n.kind===`obstacle`||n.kind===`marker`)&&(0,J.jsx)(`button`,{className:`world-editor-delete-item`,type:`button`,onClick:()=>u(()=>{r(me(e,t.id,n)),a({kind:`initial_pose`})}),children:`Delete selected item`})]})]})}function ze({title:e,diagnostic:t,actions:n}){return(0,J.jsxs)(`div`,{className:`world-editor-invalid`,role:`alert`,children:[(0,J.jsx)(`strong`,{children:e}),(0,J.jsx)(`p`,{children:t.summary}),(0,J.jsx)(`p`,{children:t.guidance}),n,(0,J.jsxs)(`details`,{children:[(0,J.jsx)(`summary`,{children:`Technical details`}),(0,J.jsx)(`code`,{children:t.technical})]})]})}function Be({source:e,onChange:t}){let n=(0,S.useMemo)(()=>{try{return{document:I(e),error:``}}catch(e){return{document:null,error:e instanceof Error?e.message:String(e)}}},[e]),[r,i]=(0,S.useState)(``),[a,o]=(0,S.useState)({kind:`initial_pose`}),[s,c]=(0,S.useState)(25),[l,u]=(0,S.useState)(``),[d,f]=(0,S.useState)(null),[p,m]=(0,S.useState)(()=>{try{return{source:e,document:I(e)}}catch{return null}}),h=(0,S.useRef)(null),g=(0,S.useRef)(null),_=n.document?{source:e,document:n.document}:p,v=_?.document.catalog??null,y=_?.source??e,b=!!n.error,x=v?.worlds.find(e=>e.id===r)??v?.worlds[0]??null,C=x?.id??``;(0,S.useEffect)(()=>{n.document&&m({source:e,document:n.document})},[n.document,e]),(0,S.useEffect)(()=>{f(null),u(``)},[e]),(0,S.useEffect)(()=>{v&&(v.worlds.some(e=>e.id===r)||(i(v.defaultWorldId),o({kind:`initial_pose`})))},[v,r]),(0,S.useEffect)(()=>{x&&(a.kind===`obstacle`&&a.index>=x.obstacles.length||a.kind===`marker`&&a.index>=x.markers.length)&&o({kind:`initial_pose`})},[a,x]);function w(e){try{e(),u(``),f(null)}catch(e){u(``),f(B(y,e))}}function T(e){u(``),f(e?B(y,e):null)}function E(){h.current&&(h.current.open=!0),g.current?.focus()}let D=n.error?B(e,n.error,p?.source):null;return(0,J.jsxs)(`div`,{className:`world-editor`,children:[(0,J.jsxs)(`div`,{className:`world-editor-world-row`,children:[(0,J.jsxs)(`label`,{children:[`World`,(0,J.jsx)(`select`,{"aria-label":`World to edit`,disabled:!v,value:C,onChange:e=>{i(e.target.value),o({kind:`initial_pose`})},children:v?.worlds.map(e=>(0,J.jsxs)(`option`,{value:e.id,children:[e.label,e.id===v.defaultWorldId?` · default`:``]},e.id))})]}),(0,J.jsxs)(`div`,{className:`world-editor-world-actions`,children:[(0,J.jsx)(`button`,{type:`button`,disabled:!v||b,onClick:()=>w(()=>{let e=ae(y);t(e.source),i(e.worldId),o({kind:`initial_pose`})}),children:`Add world`}),(0,J.jsx)(`button`,{type:`button`,disabled:!x||b,onClick:()=>w(()=>{let e=oe(y,C);t(e.source),i(e.worldId),o({kind:`initial_pose`})}),children:`Duplicate`}),(0,J.jsx)(`button`,{type:`button`,disabled:!x||b||v?.worlds.length===1,onClick:()=>w(()=>{let e=se(y,C);t(e.source),i(e.worldId),o({kind:`initial_pose`})}),children:`Delete`}),(0,J.jsx)(`button`,{type:`button`,disabled:!x||b||v?.defaultWorldId===C,onClick:()=>w(()=>t(ce(y,C))),children:`Make default`})]})]}),x&&(0,J.jsxs)(`div`,{className:`world-editor-identity`,children:[(0,J.jsxs)(`label`,{children:[`World ID`,(0,J.jsx)(`input`,{disabled:b,pattern:`[a-z][a-z0-9_-]*`,value:x.id,onChange:e=>{let n=e.target.value;if(/^[a-z][a-z0-9_-]*$/.test(n)){if(v?.worlds.some(e=>e.id===n&&e.id!==C)){u(`World ID '${n}' is already in use.`);return}w(()=>{let e=le(y,C,`id`,n);t(e.source),i(e.worldId)})}}})]}),(0,J.jsxs)(`label`,{children:[`Display name`,(0,J.jsx)(`input`,{disabled:b,value:x.label,onChange:e=>{let n=e.target.value;n.trim()&&w(()=>{t(le(y,C,`label`,n).source)})}})]}),(0,J.jsxs)(`label`,{className:`world-editor-snap`,children:[`Snap`,(0,J.jsxs)(`select`,{"aria-label":`Grid snap`,value:s,onChange:e=>c(Number(e.target.value)),children:[(0,J.jsx)(`option`,{value:0,children:`Off`}),(0,J.jsx)(`option`,{value:10,children:`10 mm`}),(0,J.jsx)(`option`,{value:25,children:`25 mm`}),(0,J.jsx)(`option`,{value:50,children:`50 mm`}),(0,J.jsx)(`option`,{value:100,children:`100 mm`})]})]})]}),D&&(0,J.jsx)(ze,{title:`World JSON needs attention.`,diagnostic:D,actions:(0,J.jsxs)(`div`,{className:`world-editor-invalid-actions`,children:[p&&(0,J.jsx)(`button`,{type:`button`,onClick:()=>t(p.source),children:`Restore last valid world configuration`}),(0,J.jsx)(`button`,{type:`button`,onClick:E,children:`Review Advanced world.json`})]})}),d&&!D&&(0,J.jsx)(ze,{title:`That edit was not applied.`,diagnostic:d}),x&&(0,J.jsxs)(`fieldset`,{className:`world-editor-layout${b?` is-read-only`:``}`,disabled:b,children:[(0,J.jsx)(Ie,{source:y,world:x,selection:a,snap:s,onChange:t,onError:T,onSelectionChange:o}),(0,J.jsx)(Re,{source:y,world:x,selection:a,onChange:t,onError:T,onSelectionChange:o})]}),l&&(0,J.jsx)(`p`,{className:`world-editor-message`,role:`status`,children:l}),(0,J.jsxs)(`details`,{className:`world-editor-json`,ref:h,children:[(0,J.jsx)(`summary`,{children:`Advanced world.json`}),(0,J.jsx)(`p`,{children:`The graphic editor and this JSON edit the same project data. Use JSON for additional fields; unknown fields are retained by graphic edits.`}),(0,J.jsx)(`textarea`,{"aria-label":`World configuration JSON`,className:`code-input large-code-input`,rows:18,spellCheck:!1,value:e,onChange:e=>t(e.target.value),ref:g})]})]})}function X(){return JSON.parse(p(`_tools/examples/waypoint_slalom.challenge.json`))}var Ve=Object.assign({"../../../vendor/current/starters/new_challenge_1_robot_curling/world.json":c,"../../../vendor/current/starters/new_challenge_2_arena_line_circuit/world.json":f,"../../../vendor/current/starters/new_challenge_3_waypoint_courier/world.json":u,"../../../vendor/current/starters/new_challenge_4_mapped_route/world.json":s,"../../../vendor/current/starters/new_challenge_5_out_and_back/world.json":d}),He=new Set(Object.keys(Ve).flatMap(e=>{let t=e.match(/\/starters\/(new_challenge_[1-5]_[a-z_]+)\/world\.json$/);return t?.[1]?[t[1]]:[]})),Ue=JSON.parse(w).filter(e=>e.kind===`challenge`&&e.group===`newest-challenges`&&e.published===!0&&He.has(e.id)).map(e=>[e.id,e.label]),We=[{file:`sensor_model.py`,class_name:`SensorModel`,selection_flag:`USE_STUDENT_SENSOR_MODEL`,responsibility:`Convert timestamped encoder and range readings into measurements in course units.`},{file:`wheel_speed_controller.py`,class_name:`WheelSpeedController`,selection_flag:`USE_STUDENT_WHEEL_SPEED_CONTROLLER`,responsibility:`Convert target and measured wheel speeds into bounded left and right drive commands.`},{file:`differential_drive.py`,class_name:`DifferentialDrive`,selection_flag:`USE_STUDENT_DIFFERENTIAL_DRIVE`,responsibility:`Convert requested forward speed and turn rate into left and right wheel speeds.`},{file:`odometry.py`,class_name:`Odometry`,selection_flag:`USE_STUDENT_ODOMETRY`,responsibility:`Update the estimated planar pose from measured left and right wheel travel.`},{file:`navigation_controller.py`,class_name:`NavigationController`,selection_flag:`USE_STUDENT_NAVIGATION_CONTROLLER`,responsibility:`Advance through ordered goals and compute a bounded command from the current pose.`},{file:`line_follower.py`,class_name:`LineFollower`,selection_flag:`USE_STUDENT_LINE_FOLLOWER`,responsibility:`Use calibrated reflectance readings to follow the arena line.`},{file:`grid_planner.py`,class_name:`GridPlanner`,selection_flag:`USE_STUDENT_GRID_PLANNER`,responsibility:`Find a connected free-cell path from the requested start cell to the destination cell.`}];function Z(){return{...X(),source_id:`new_challenge_3_waypoint_courier`,world:Q(`new_challenge_3_waypoint_courier`)??X().world,files:{}}}function Q(e){let t=Object.entries(Ve).find(([t])=>t.includes(`/starters/${e}/world.json`));return t?JSON.parse(t[1]):null}function Ge(){return{schema_version:1,source_id:`new_challenge_1_robot_curling`,id:`challenge_6`,title:``,summary:``,objective:``,student_implementations:[],supplied_files:[],program_flow:``,evidence:[],work_sequence:[],world:Q(`new_challenge_1_robot_curling`)??X().world,files:{}}}function $({children:e}){return(0,J.jsx)(`span`,{className:`field-help`,children:e})}function Ke(){let[e,t]=(0,S.useState)(Z),[n,r]=(0,S.useState)(()=>JSON.stringify(Z().world,null,2)),[a,o]=(0,S.useState)(()=>JSON.stringify(Z().files??{},null,2)),[s,c]=(0,S.useState)([]),[l,u]=(0,S.useState)(()=>X().evidence.join(`
`)),[d,f]=(0,S.useState)(()=>X().work_sequence.join(`
`)),[p,m]=(0,S.useState)(()=>Se(X().supplied_files)),[g,y]=(0,S.useState)(``),x=(0,S.useMemo)(()=>Oe({spec:e,worldSource:n,filesSource:a,evidenceSource:l,sequenceSource:d,suppliedSource:p}),[l,a,d,e,p,n]),C=(0,S.useRef)(x),w=(0,S.useRef)(x),T=(0,S.useRef)(!1),E=(0,S.useRef)(null),D=(0,S.useMemo)(()=>{let t=[],r={},i={};try{r=JSON.parse(n)}catch(e){t.push(`World JSON: ${e.message}`)}try{i=JSON.parse(a)}catch(e){t.push(`Project file overrides: ${e.message}`)}let o={...e,supplied_files:xe(p),evidence:G(l),work_sequence:G(d),world:r,files:i};return{spec:o,errors:[...t,...K(o)]}},[l,a,d,e,p,n]),O=Ce(D.spec),k=we(O),A=Object.keys(D.spec.files??{}).length,j=D.errors.filter(e=>!e.startsWith(`World JSON:`)),M=j.length!==D.errors.length;w.current=x,(0,S.useEffect)(()=>h(()=>ke(w.current,C.current,T.current)),[]),(0,S.useEffect)(()=>{ke(x,C.current,T.current)&&_()},[x]),(0,S.useEffect)(()=>{let e=E.current;if(!e)return;let t=()=>{T.current=!1,_()};return e.addEventListener(`cancel`,t),()=>e.removeEventListener(`cancel`,t)},[]);function N(e,n=!1){let i=JSON.stringify(e.world,null,2),a=JSON.stringify(e.files??{},null,2),s=e.evidence.join(`
`),l=e.work_sequence.join(`
`),d=Se(e.supplied_files);t(e),c([]),r(i),o(a),u(s),f(l),m(d),y(``),C.current=n?Oe({spec:e,worldSource:i,filesSource:a,evidenceSource:s,sequenceSource:l,suppliedSource:d}):``}async function P(e){if(e)try{let t=await ve(e),n=K(t);if(n.length>0){y(`Specification not opened: ${n[0]}`);return}N(t),y(`${e.name} opened.`)}catch(e){y(`Specification not opened: ${e.message}`)}}function F(e,n){t(t=>({...t,[e]:n}))}function ee(){let t=Q(e.source_id);if(!t){y(`No example world is available for ${e.source_id}.`);return}r(JSON.stringify(t,null,2)),y(`Loaded the ${e.source_id} example world.`)}function I(t,n){let r=e.student_implementations.filter(e=>e.class_name!==t.class_name);F(`student_implementations`,n?[...r,t]:r)}function L(t,n){F(`student_implementations`,e.student_implementations.map(e=>e.class_name===t?{...e,responsibility:n}:e))}function R(t,n,r){F(`student_implementations`,e.student_implementations.map((e,i)=>i===t?{...e,[n]:r}:e))}function z(){F(`student_implementations`,[...e.student_implementations,{file:``,class_name:``,selection_flag:``,responsibility:``}])}function te(t){F(`student_implementations`,e.student_implementations.filter((e,n)=>n!==t))}function B(){if(D.errors.length>0){y(`Correct the listed items before downloading the specification.`);return}let e=new Blob([JSON.stringify(D.spec,null,2)+`
`],{type:`application/json`}),t=URL.createObjectURL(e),n=document.createElement(`a`);n.href=t,n.download=O,n.click(),URL.revokeObjectURL(t),C.current=w.current,y(`${O} downloaded. No repository files were changed.`),_()}function V(){try{let e=De(D.spec,s),t=`${D.spec.id}.ucsb-challenge.json`,n=new Blob([JSON.stringify(e,null,2)+`
`],{type:`application/json`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=t,i.click(),URL.revokeObjectURL(r),y(`${t} downloaded. Give this file to students to import as a new Project.`)}catch(e){y(`Student activity not downloaded: ${e instanceof Error?e.message:String(e)}`)}}async function H(){try{await navigator.clipboard.writeText(k),y(`Repository creation command copied.`)}catch{y(`Copy was unavailable. Select the displayed command instead.`)}}function U(){if(D.errors.length>0){y(`Correct the listed items before opening the project draft.`);return}try{let e=Ee(D.spec),t=v({...e,name:e.name??D.spec.title}),n=new URL(`../ide/`,window.location.href);n.searchParams.set(b,t);let r=window.open(n,`_blank`);if(!r){y(`The browser blocked the IDE tab. Allow this site to open a tab, then select Open draft in IDE again.`);return}r.opener=null,y(`The unpublished project opened in the IDE. Save it to a Project folder before retaining or revising it.`)}catch(e){y(`The project draft could not be opened: ${e instanceof Error?e.message:String(e)}`)}}let ne=new Set(e.student_implementations.map(e=>e.class_name)),re=new Set(We.map(e=>e.class_name)),ie=e.student_implementations.map((e,t)=>({component:e,index:t})).filter(({component:e})=>!re.has(e.class_name));return(0,J.jsxs)(`div`,{className:`author-app`,children:[(0,J.jsx)(i,{}),(0,J.jsxs)(`main`,{className:`author-shell`,children:[(0,J.jsx)(`header`,{className:`author-intro`,children:(0,J.jsxs)(`div`,{children:[(0,J.jsx)(`h1`,{children:`Challenge creation`}),(0,J.jsx)(`p`,{children:`Define a challenge and its world, then open the complete unpublished project in the IDE for testing. Download the checked specification when you are ready to retain or publish it. This page does not modify the repository or student catalog.`})]})}),(0,J.jsxs)(`div`,{className:`author-actions`,"aria-label":`Specification examples`,children:[(0,J.jsxs)(`label`,{className:`file-open-button`,children:[`Open saved specification`,(0,J.jsx)(`input`,{accept:`application/json,.json`,type:`file`,onClick:()=>{T.current=!0},onChange:e=>{let t=e.target.files?.[0];e.target.value=``,P(t).finally(()=>{T.current=!1,_()})},ref:E})]}),(0,J.jsx)(`button`,{type:`button`,onClick:()=>N(Z(),!0),children:`Load working slalom example`}),(0,J.jsx)(`button`,{type:`button`,onClick:()=>N(Ge()),children:`Start a new specification`})]}),(0,J.jsxs)(`section`,{className:`author-section`,"aria-labelledby":`structure-heading`,children:[(0,J.jsx)(`div`,{className:`section-number`,children:`1`}),(0,J.jsxs)(`div`,{children:[(0,J.jsx)(`h2`,{id:`structure-heading`,children:`Select an existing program structure`}),(0,J.jsx)(`p`,{children:`Choose the published challenge whose control flow is closest to the new task. The later repository command copies that complete project; it does not combine unrelated challenge implementations.`}),(0,J.jsxs)(`div`,{className:`field-grid`,children:[(0,J.jsxs)(`label`,{children:[`Starting challenge`,(0,J.jsx)(`select`,{value:e.source_id,onChange:e=>F(`source_id`,e.target.value),children:Ue.map(([e,t])=>(0,J.jsx)(`option`,{value:e,children:t},e))}),(0,J.jsx)($,{children:`Determines the copied files and default mission flow.`}),(0,J.jsx)(`button`,{className:`inline-field-button`,type:`button`,onClick:ee,children:`Load this challenge's example world`})]}),(0,J.jsxs)(`label`,{children:[`Challenge ID`,(0,J.jsx)(`input`,{value:e.id,onChange:e=>F(`id`,e.target.value),placeholder:`challenge_6`}),(0,J.jsx)($,{children:`Stable catalog and folder name; use challenge_N.`})]}),(0,J.jsxs)(`label`,{children:[`Student-facing title`,(0,J.jsx)(`input`,{value:e.title,onChange:e=>F(`title`,e.target.value)})]}),(0,J.jsxs)(`label`,{children:[`Catalog summary`,(0,J.jsx)(`input`,{value:e.summary,onChange:e=>F(`summary`,e.target.value)}),(0,J.jsx)($,{children:`One sentence describing the observable task.`})]})]})]})]}),(0,J.jsxs)(`section`,{className:`author-section`,"aria-labelledby":`learning-heading`,children:[(0,J.jsx)(`div`,{className:`section-number`,children:`2`}),(0,J.jsxs)(`div`,{children:[(0,J.jsx)(`h2`,{id:`learning-heading`,children:`Define student work and evidence`}),(0,J.jsxs)(`label`,{children:[`Objective`,(0,J.jsx)(`textarea`,{rows:4,value:e.objective,onChange:e=>F(`objective`,e.target.value)}),(0,J.jsx)($,{children:`State what the robot does, what students implement, and the comparison or conclusion supported by measured evidence.`})]}),(0,J.jsxs)(`fieldset`,{children:[(0,J.jsx)(`legend`,{children:`Student implementations`}),(0,J.jsx)(`p`,{className:`field-help`,children:`Select only components whose implementation is assessed in this challenge. Edit the responsibility to make the boundary explicit.`}),(0,J.jsxs)(`div`,{className:`component-list`,children:[We.map(t=>{let n=ne.has(t.class_name),r=e.student_implementations.find(e=>e.class_name===t.class_name);return(0,J.jsxs)(`div`,{className:`component-row`,children:[(0,J.jsxs)(`label`,{className:`component-choice`,children:[(0,J.jsx)(`input`,{checked:n,type:`checkbox`,onChange:e=>I(t,e.target.checked)}),(0,J.jsx)(`code`,{children:t.class_name})]}),(0,J.jsx)(`textarea`,{"aria-label":`${t.class_name} responsibility`,disabled:!n,rows:2,value:r?.responsibility??t.responsibility,onChange:e=>L(t.class_name,e.target.value)})]},t.class_name)}),ie.map(({component:e,index:t},n)=>(0,J.jsxs)(`div`,{className:`additional-component-row`,children:[(0,J.jsxs)(`label`,{children:[`File`,(0,J.jsx)(`input`,{"aria-label":`Additional component ${n+1} file`,placeholder:`localizer.py`,value:e.file,onChange:e=>R(t,`file`,e.target.value)})]}),(0,J.jsxs)(`label`,{children:[`Class`,(0,J.jsx)(`input`,{"aria-label":`Additional component ${n+1} class`,placeholder:`Localizer`,value:e.class_name,onChange:e=>R(t,`class_name`,e.target.value)})]}),(0,J.jsxs)(`label`,{children:[`Selection flag`,(0,J.jsx)(`input`,{"aria-label":`Additional component ${n+1} selection flag`,placeholder:`USE_STUDENT_LOCALIZER`,value:e.selection_flag,onChange:e=>R(t,`selection_flag`,e.target.value)})]}),(0,J.jsxs)(`label`,{children:[`Responsibility`,(0,J.jsx)(`textarea`,{"aria-label":`Additional component ${n+1} responsibility`,placeholder:`State the inputs, required result, and retained state.`,rows:2,value:e.responsibility,onChange:e=>R(t,`responsibility`,e.target.value)})]}),(0,J.jsx)(`button`,{"aria-label":`Remove additional component ${n+1}`,type:`button`,onClick:()=>te(t),children:`Remove`})]},`additional-${t}`)),(0,J.jsx)(`button`,{className:`add-component-button`,type:`button`,onClick:z,children:`Add another component`}),(0,J.jsx)($,{children:`A new component also needs complete file overrides for its module, course_setup.py integration, and hardware-free examples in component_checks.py.`})]})]}),(0,J.jsxs)(`div`,{className:`field-grid text-grid`,children:[(0,J.jsxs)(`label`,{children:[`Required evidence — one item per line`,(0,J.jsx)(`textarea`,{rows:6,value:l,onChange:e=>u(e.target.value)})]}),(0,J.jsxs)(`label`,{children:[`Student work sequence — one step per line`,(0,J.jsx)(`textarea`,{rows:6,value:d,onChange:e=>f(e.target.value)})]})]})]})]}),(0,J.jsxs)(`section`,{className:`author-section`,"aria-labelledby":`project-heading`,children:[(0,J.jsx)(`div`,{className:`section-number`,children:`3`}),(0,J.jsxs)(`div`,{children:[(0,J.jsx)(`h2`,{id:`project-heading`,children:`Define the supplied project`}),(0,J.jsxs)(`div`,{className:`field-grid text-grid`,children:[(0,J.jsxs)(`label`,{children:[`Supplied files and services — name | use`,(0,J.jsx)(`textarea`,{rows:8,value:p,onChange:e=>m(e.target.value)}),(0,J.jsx)($,{children:`Include world.json once and describe each supplied item objectively.`})]}),(0,J.jsxs)(`label`,{children:[`Program sequence — one step per line`,(0,J.jsx)(`textarea`,{rows:8,value:e.program_flow,onChange:e=>F(`program_flow`,e.target.value)}),(0,J.jsx)($,{children:`State the execution order in short sentences and name the data passed between important parts.`})]})]}),(0,J.jsxs)(`div`,{className:`world-editor-field`,children:[(0,J.jsx)(`h3`,{children:`World configuration`}),(0,J.jsx)(`p`,{className:`field-help`,children:`Arrange the measured arena, initial XRP pose, obstacles, and markers. Waypoints enter the route in the order shown. Geometry outside the arena is reported rather than moved automatically.`}),(0,J.jsx)(Be,{source:n,onChange:r})]}),(0,J.jsxs)(`details`,{children:[(0,J.jsxs)(`summary`,{children:[`Project-file overrides · `,A||`none`,A===1?` file`:A>1?` files`:``]}),(0,J.jsxs)(`p`,{children:[`Leave this as `,(0,J.jsx)(`code`,{children:`{}`}),` to retain the copied student starter code. To change the mission structure, map project-relative file names to complete text. Python files are syntax-checked before draft creation.`]}),(0,J.jsx)(`textarea`,{"aria-label":`Project file overrides as JSON`,className:`code-input large-code-input`,rows:14,spellCheck:!1,value:a,onChange:e=>o(e.target.value)})]})]})]}),(0,J.jsxs)(`section`,{className:`author-section`,"aria-labelledby":`review-heading`,children:[(0,J.jsx)(`div`,{className:`section-number`,children:`4`}),(0,J.jsxs)(`div`,{children:[(0,J.jsx)(`h2`,{id:`review-heading`,children:`Review and open the project`}),(0,J.jsx)(`div`,{className:D.errors.length===0?`review-ok`:`review-errors`,role:`status`,children:D.errors.length===0?(0,J.jsx)(`p`,{children:`Specification checks pass. Open the unpublished project in the IDE to compile and run the actual files.`}):(0,J.jsxs)(J.Fragment,{children:[j.length>0&&(0,J.jsxs)(J.Fragment,{children:[(0,J.jsxs)(`p`,{children:[j.length,` item(s) require attention:`]}),(0,J.jsx)(`ul`,{children:j.map(e=>(0,J.jsx)(`li`,{children:e},e))})]}),M&&(0,J.jsx)(`p`,{children:`Resolve the world configuration issue shown in Section 3.`})]})}),(0,J.jsxs)(`div`,{className:`draft-row`,children:[(0,J.jsx)(`button`,{className:`primary-button`,disabled:D.errors.length>0,title:D.errors.length>0?`Resolve the listed specification errors before opening the project`:`Build this unpublished project and open it in a new IDE tab`,type:`button`,onClick:U,children:`Open draft in IDE`}),(0,J.jsx)(`span`,{className:`field-help`,children:`The IDE receives the copied starting project, generated README, edited world, and any complete file overrides shown above.`})]}),(0,J.jsxs)(`div`,{className:`shared-challenge-export`,children:[(0,J.jsx)(`h3`,{children:`Share a student activity`}),(0,J.jsx)(`p`,{className:`field-help`,children:`Downloads one portable file containing this specification, world, README, and every required student starter file. Complete project file overrides are excluded unless you select them below. Review each selected file for instructor solutions before distributing it.`}),Object.keys(D.spec.files??{}).sort().map(e=>(0,J.jsxs)(`label`,{className:`shared-override-choice`,children:[(0,J.jsx)(`input`,{checked:s.includes(e),onChange:t=>c(n=>t.target.checked?[...n,e]:n.filter(t=>t!==e)),type:`checkbox`}),`Include complete override `,(0,J.jsx)(`code`,{children:e})]},e)),(0,J.jsx)(`button`,{disabled:D.errors.length>0,type:`button`,onClick:V,children:`Download student activity package`})]}),(0,J.jsxs)(`div`,{className:`create-row`,children:[(0,J.jsx)(`button`,{disabled:D.errors.length>0,title:D.errors.length>0?`Resolve the listed specification errors before downloading`:`Download this checked challenge specification`,type:`button`,onClick:B,children:`Download checked specification`}),(0,J.jsx)(`button`,{type:`button`,onClick:H,children:`Copy repository command`}),(0,J.jsx)(`code`,{children:k})]}),(0,J.jsxs)(`nav`,{"aria-label":`Challenge authoring references`,className:`author-reference-links`,children:[(0,J.jsx)(`a`,{href:`../instructor/#authoring-instructions`,children:`Authoring instructions`}),(0,J.jsx)(`a`,{href:`../overview/#authoring`,children:`Technical overview`})]}),(0,J.jsx)(`p`,{className:`field-help`,children:`After downloading the JSON, an instructor may run this command from the UCSBXRP repository. It creates an unpublished project and runs repository checks. Review and test that project before using the separate publication command described in Authoring instructions.`}),(0,J.jsx)(`p`,{"aria-live":`polite`,className:`author-message`,children:g})]})]})]})]})}g(),(0,C.createRoot)(document.getElementById(`root`)).render((0,J.jsx)(S.StrictMode,{children:(0,J.jsx)(m,{children:(0,J.jsx)(Ke,{})})}));