import type { ReactNode } from "react";

import { AppNavigation } from "../../shared/AppNavigation";
import { useHashTarget } from "../../shared/useHashTarget";

type Parameter = {
  name: string;
  type: string;
  default?: string;
  units?: string;
  description: string;
};

type ReturnValue = {
  type: string;
  description: string;
};

const components = [
  ["sensor-model", "SensorModel"],
  ["wheel-speed-controller", "WheelSpeedController"],
  ["differential-drive", "DifferentialDrive"],
  ["odometry", "Odometry"],
  ["navigation-controller", "NavigationController"],
  ["grid-planner", "GridPlanner"],
] as const;

const projectLoopExample = [
  "from challenge import INITIAL_POSE, TRAVEL_DISTANCE_MM",
  "from course_setup import make_robot",
  "from robot_config import ROBOT_CONFIG, STRAIGHT_CONFIG",
  "from ucsb_xrp import StraightLineController",
  "",
  "robot = make_robot(ROBOT_CONFIG)",
  "straight = StraightLineController(STRAIGHT_CONFIG)",
  "",
  "try:",
  "    state = robot.start(INITIAL_POSE)",
  "    straight.start(state.measurements, TRAVEL_DISTANCE_MM)",
  "",
  "    while not straight.is_complete():",
  "        command = straight.update(state.measurements)",
  "        state = robot.step(command)",
  "finally:",
  "    robot.stop()",
].join("\n");

const componentExamples = {
  sensorModel: [
    "from robot_config import ROBOT_CONFIG",
    "from sensor_model import SensorModel",
    "from ucsb_xrp import RawSensors",
    "",
    "model = SensorModel(ROBOT_CONFIG)",
    "first = RawSensors(0, 0, 0, None, False)",
    "model.reset(first)",
    "measurement = model.update(RawSensors(20, 4, 5, None, False))",
    'print("left increment (mm):", measurement.left_increment_mm)',
    'print("left speed (mm/s):", measurement.left_speed_mm_s)',
  ].join("\n"),
  wheelController: [
    "from robot_config import ROBOT_CONFIG",
    "from wheel_speed_controller import WheelSpeedController",
    "from ucsb_xrp import WheelSpeeds",
    "",
    "controller = WheelSpeedController(ROBOT_CONFIG)",
    "controller.reset()",
    "command = controller.update(",
    "    WheelSpeeds(120.0, 120.0),",
    "    WheelSpeeds(105.0, 112.0),",
    ")",
    'print("normalized commands:", command.left, command.right)',
  ].join("\n"),
  differentialDrive: [
    "from differential_drive import DifferentialDrive",
    "from robot_config import ROBOT_CONFIG",
    "from ucsb_xrp import MotionCommand",
    "",
    "drive = DifferentialDrive(ROBOT_CONFIG)",
    "targets = drive.wheel_speeds(MotionCommand(100.0, 0.5))",
    'print("target wheel speeds (mm/s):")',
    "print(targets.left_mm_s, targets.right_mm_s)",
  ].join("\n"),
  odometry: [
    "from odometry import Odometry",
    "from robot_config import ROBOT_CONFIG",
    "from ucsb_xrp import Pose",
    "",
    "odometry = Odometry(ROBOT_CONFIG)",
    "odometry.reset(Pose(0.0, 0.0, 0.0))",
    "pose = odometry.update(12.0, 14.0)",
    'print("position (mm):", pose.x_mm, pose.y_mm)',
    'print("heading (rad):", pose.heading_rad)',
  ].join("\n"),
  navigation: [
    "from navigation_controller import NavigationController",
    "from robot_config import NAVIGATION_CONFIG",
    "from ucsb_xrp import NavigationGoal, Pose",
    "",
    "navigation = NavigationController(NAVIGATION_CONFIG)",
    "navigation.start((NavigationGoal(600.0, 200.0),))",
    "command = navigation.update(Pose(0.0, 0.0, 0.0))",
    'print("forward speed (mm/s):", command.forward_speed_mm_s)',
    'print("turn rate (rad/s):", command.turn_rate_rad_s)',
  ].join("\n"),
  planner: [
    "from challenge import (",
    "    ARENA_MAP, CLEARANCE_MM, DESTINATION,",
    "    GRID_RESOLUTION_MM, INITIAL_POSE,",
    ")",
    "from grid_planner import GridPlanner",
    "from ucsb_xrp import OccupancyGrid",
    "",
    "grid = OccupancyGrid.from_arena(",
    "    ARENA_MAP, GRID_RESOLUTION_MM, CLEARANCE_MM",
    ")",
    "start = grid.world_to_cell(INITIAL_POSE.x_mm, INITIAL_POSE.y_mm)",
    "goal = grid.world_to_cell(DESTINATION.x_mm, DESTINATION.y_mm)",
    "path = GridPlanner().plan(grid, start, goal)",
    'print("path cells:", None if path is None else path.cells)',
  ].join("\n"),
} as const;

const robotConfigFields: Parameter[] = [
  {
    name: "sample_period_ms",
    type: "int",
    default: "20",
    units: "ms",
    description: "Time between successive Robot samples; must be at least 1.",
  },
  {
    name: "wheel_diameter_mm",
    type: "float",
    default: "60.0",
    units: "mm",
    description: "Measured wheel diameter; must be positive.",
  },
  {
    name: "encoder_counts_per_revolution",
    type: "float",
    default: "585.0",
    units: "count/rev",
    description: "Encoder counts for one wheel revolution; must be positive.",
  },
  {
    name: "track_width_mm",
    type: "float",
    default: "155.0",
    units: "mm",
    description:
      "Lateral distance between the wheel contact lines; must be positive.",
  },
  {
    name: "left_motor_sign, right_motor_sign",
    type: "int",
    default: "1",
    description:
      "+1 or −1, selected so a positive drive command turns that wheel forward.",
  },
  {
    name: "left_encoder_sign, right_encoder_sign",
    type: "int",
    default: "1",
    description:
      "+1 or −1, selected so forward wheel motion produces positive travel.",
  },
  {
    name: "left_start_command, right_start_command",
    type: "float",
    default: "None → 0.0",
    description: "Nonnegative command used to overcome motor deadband.",
  },
  {
    name: "left_speed_command_gain, right_speed_command_gain",
    type: "float",
    default: "None → 0.0",
    units: "s/mm",
    description: "Feedforward command per requested wheel speed.",
  },
  {
    name: "wheel_speed_filter_time_constant_ms",
    type: "float",
    default: "80.0",
    units: "ms",
    description:
      "Time constant for the encoder-derived wheel-speed estimate; zero disables smoothing.",
  },
  {
    name: "wheel_speed_kp",
    type: "float",
    default: "0.0",
    units: "s/mm",
    description: "Proportional correction per wheel-speed error.",
  },
  {
    name: "max_drive_command",
    type: "float",
    default: "None → 1.0",
    description: "Final absolute motor-command limit, from 0.0 to 1.0.",
  },
];

export function ReferenceApp() {
  useHashTarget();

  return (
    <div className="reference-app">
      <header className="app-header reference-header">
        <div className="brand" aria-label="UCSBXRP">
          <span className="brand-mark">UCSB</span>
          <span className="brand-xrp">XRP</span>
        </div>
        <AppNavigation active="reference" />
      </header>

      <div className="reference-layout">
        <nav className="reference-toc" aria-label="API sections">
          <span>Program structure</span>
          <a href="#project-loop">Measured control loop</a>
          <a href="#student-components">Student component interfaces</a>
          {components.map(([id, name]) => (
            <a className="toc-child" href={"#" + id} key={id}>
              {name}
            </a>
          ))}
          <span className="toc-group">Values and services</span>
          <a href="#records">Data types</a>
          <a href="#robot">Robot service</a>
          <a href="#live">Live controls and plots</a>
          <a href="#configuration">Configuration</a>
          <span className="toc-group">World and mission</span>
          <a href="#worlds">Project worlds</a>
          <a href="#maps">Maps and routes</a>
          <a href="#missions">Supplied mission services</a>
          <span className="toc-group">Hardware and mathematics</span>
          <a href="#xrpbot">Low-level XRP access</a>
          <a href="#utilities">Numerical functions</a>
        </nav>

        <main className="reference-content">
          <section className="reference-intro">
            <h1>API reference</h1>
            <p>
              This page defines the UCSBXRP Python interface for course projects
              using <code>ucsb_xrp 0.4.0-dev</code>. Student classes inherit the
              component interfaces in <code>ucsb_xrp.student_api</code>; project
              programs import records, configuration classes, and supplied
              services from <code>ucsb_xrp</code>. Each entry states its
              purpose, arguments, types, units, return value, possible
              exceptions, and an example. Names beginning with an underscore are
              internal. The <a href="../guide/">Guide</a> explains the IDE,
              Monitor, project storage, and robot setup.
            </p>
          </section>

          <ReferenceSection id="project-loop" title="Measured control loop">
            <p>
              <code>main.py</code> selects the task and calls the configured
              services. <code>course_setup.py</code> creates a{" "}
              <code>Robot</code> using either supplied or student components.
              One loop iteration proceeds in this order:
            </p>
            <ol className="api-procedure">
              <li>
                <code>DifferentialDrive</code> converts requested forward speed
                and turn rate to requested wheel speeds.
              </li>
              <li>
                <code>WheelSpeedController</code> compares requested and the
                latest measured wheel speeds and returns a motor command.
              </li>
              <li>
                <code>Robot</code> applies that command, waits until the next
                absolute sample time, and reads the XRP sensors.
              </li>
              <li>
                <code>SensorModel</code> converts encoder counts and time into
                wheel distances, increments, and wheel-speed estimates based on
                recent samples.
              </li>
              <li>
                <code>Odometry</code> updates the estimated pose from the
                measured wheel increments.
              </li>
              <li>
                <code>Robot</code> publishes telemetry and returns the new{" "}
                <code>RobotState</code>.
              </li>
            </ol>
            <p>
              Use millimeters for distance and range, mm/s for linear speed,
              milliseconds for device time, seconds for elapsed calculation
              time, radians for angles, and rad/s for turn rate. Positive
              heading and turn rate are counterclockwise.{" "}
              <code>Robot.step()</code> maintains the configured sample period
              from an absolute sequence of deadlines. It waits only for the time
              remaining before the next deadline, then reads one sensor sample
              and advances the deadline. Do not add <code>sleep_ms()</code>{" "}
              inside this loop: the extra delay changes the actual interval
              between sensor samples, which changes encoder-derived wheel-speed
              estimates and controller behavior. Use a deliberate delay only
              outside the measured control loop.
            </p>
            <CodeExample
              code={projectLoopExample}
              title="Complete straight-run loop"
            />
          </ReferenceSection>

          <ReferenceSection
            id="student-components"
            title="Student-implemented component interfaces"
          >
            <p>
              Each challenge identifies the components to implement. A student
              class inherits the matching base class below and is selected in{" "}
              <code>course_setup.py</code>. The base class defines how{" "}
              <code>Robot</code> or mission code calls the component. It fixes
              the accepted inputs, returned values, and required externally
              visible behavior while leaving the internal calculation to the
              implementation.
            </p>
            <p>
              The component summaries below state the physical quantity passed
              across each boundary. Method tables give argument and return
              types, units, and required behavior. A normalized motor command is
              dimensionless; grid cells use integer row and column indices.
            </p>
            <h3>Component check results</h3>
            <ul>
              <li>
                <strong>PASS</strong> means the example produced the required
                result.
              </li>
              <li>
                <strong>NOT IMPLEMENTED</strong> means the selected method still
                raises <code>NotImplementedError</code>.
              </li>
              <li>
                <strong>FAIL</strong> means the returned value or retained state
                differs from the requirement.
              </li>
            </ul>
            <p>
              A run with failures is unsuccessful. A run in which every selected
              example is NOT IMPLEMENTED is also unsuccessful; partial progress
              may contain both PASS and NOT IMPLEMENTED results.
            </p>
            <div className="component-summary">
              {components.map(([id, name]) => (
                <a href={"#" + id} key={id}>
                  <strong>{name}</strong>
                  <span>{componentSummary(id)}</span>
                </a>
              ))}
            </div>
          </ReferenceSection>

          <ComponentSection
            id="sensor-model"
            name="SensorModel"
            file="sensor_model.py"
            base="SensorModelBase"
            description="Converts raw encoder, time, range, and USER-button readings into physical measurements. Wheel position and increments are unsmoothed signed conversions of encoder-count differences. Wheel speed is estimated from recent samples so individual encoder-count steps are not reported as instantaneous physical speed changes."
            state="After reset(), the component keeps the encoder and time origins, the previous sample, total wheel positions, and any state used by its wheel-speed estimator."
            constructor="SensorModel(config: RobotConfig)"
            example={componentExamples.sensorModel}
          >
            <PropertyTable
              rows={[
                {
                  name: "config",
                  type: "RobotConfig",
                  description:
                    "Read-only robot geometry, signs, sample period, and estimator setting supplied to the constructor.",
                },
              ]}
            />
            <ApiMethod
              name="reset"
              signature="reset(raw: RawSensors) -> Measurements"
              summary="Establish the reference counts and time for a new run."
              parameters={[
                {
                  name: "raw",
                  type: "RawSensors",
                  units: "ms, count, mm",
                  description:
                    "First hardware sample after the encoders have been reset.",
                },
              ]}
              returns={{
                type: "Measurements",
                description:
                  "A zero-travel measurement at raw.time_ms that preserves range_mm and button_pressed.",
              }}
              errors={["TypeError if raw is not a RawSensors value."]}
              requirements={[
                "Set both total wheel positions and both wheel increments to zero.",
                "Set both wheel-speed estimates to zero.",
                "Prepare update() to process the next chronological sample.",
              ]}
            />
            <ApiMethod
              name="update"
              signature="update(raw: RawSensors) -> Measurements"
              summary="Convert the next raw sample into signed wheel motion and speed estimates."
              parameters={[
                {
                  name: "raw",
                  type: "RawSensors",
                  units: "ms, count, mm",
                  description:
                    "Next chronological encoder, time, range, and button sample.",
                },
              ]}
              returns={{
                type: "Measurements",
                description:
                  "Total wheel positions, unsmoothed latest increments, wheel-speed estimates, elapsed time, range, and button state.",
              }}
              errors={[
                "RuntimeError if reset() has not been called.",
                "TypeError if raw is not a RawSensors value.",
              ]}
              requirements={[
                "Apply the configured encoder signs and counts-per-revolution conversion.",
                "Do not smooth left_increment_mm or right_increment_mm; odometry requires the measured travel increment.",
                "Use wheel_speed_filter_time_constant_ms to set the response time of the speed estimate.",
                "When no positive time has elapsed, report dt_s=0 without dividing by zero; positions and increments still reflect the new counts.",
              ]}
            />
            <ApiMethod
              name="estimate_range"
              signature="estimate_range(samples, minimum_usable: int) -> float | None"
              summary="Combine repeated ultrasonic readings while rejecting unusable values."
              parameters={[
                {
                  name: "samples",
                  type: "sequence of float | None",
                  units: "mm",
                  description: "Range readings to combine.",
                },
                {
                  name: "minimum_usable",
                  type: "int",
                  description:
                    "Minimum number of finite, positive readings required.",
                },
              ]}
              returns={{
                type: "float | None",
                description:
                  "Median usable range in millimeters, or None when fewer than minimum_usable readings remain.",
              }}
              errors={[
                "TypeError if minimum_usable is not an integer or samples is not iterable.",
                "ValueError if minimum_usable is less than 1.",
              ]}
            />
          </ComponentSection>

          <ComponentSection
            id="wheel-speed-controller"
            name="WheelSpeedController"
            file="wheel_speed_controller.py"
            base="WheelSpeedControllerBase"
            description="Receives requested left and right wheel speeds from DifferentialDrive and measured wheel-speed estimates from SensorModel. For each wheel, it calculates a normalized motor command intended to reduce the difference between requested and measured speed. Robot calls update() once per sample before writing the command to the motors."
            state="An implementation may keep controller memory between samples. reset() must return that state to its initial condition before every run."
            constructor="WheelSpeedController(config: RobotConfig)"
            example={componentExamples.wheelController}
          >
            <PropertyTable
              rows={[
                {
                  name: "config",
                  type: "RobotConfig",
                  description:
                    "Read-only feedforward calibration, feedback gain, deadband commands, and final command limit.",
                },
              ]}
            />
            <ApiMethod
              name="reset"
              signature="reset() -> None"
              summary="Prepare the controller for a new run."
              returns={{ type: "None", description: "No value is returned." }}
            />
            <ApiMethod
              name="update"
              signature="update(target: WheelSpeeds, measured: WheelSpeeds) -> DriveCommand"
              summary="Calculate the next normalized motor command for both wheels."
              parameters={[
                {
                  name: "target",
                  type: "WheelSpeeds",
                  units: "mm/s",
                  description: "Requested left and right wheel speeds.",
                },
                {
                  name: "measured",
                  type: "WheelSpeeds",
                  units: "mm/s",
                  description:
                    "Wheel-speed estimates reported by SensorModel from recent encoder samples.",
                },
              ]}
              returns={{
                type: "DriveCommand",
                description:
                  "Left and right commands within ±config.max_drive_command.",
              }}
              errors={[
                "TypeError if target or measured is not a WheelSpeeds value.",
              ]}
              requirements={[
                "A zero target for a wheel must produce an exact zero command for that wheel.",
                "Apply the configured command limit after calibration and feedback calculations.",
              ]}
            />
          </ComponentSection>

          <ComponentSection
            id="differential-drive"
            name="DifferentialDrive"
            file="differential_drive.py"
            base="DifferentialDriveBase"
            description="Converts forward speed and turn rate for the robot body into requested left and right wheel speeds."
            state="Each calculation is independent. No value from an earlier call is required."
            constructor="DifferentialDrive(config: RobotConfig)"
            example={componentExamples.differentialDrive}
          >
            <PropertyTable
              rows={[
                {
                  name: "config",
                  type: "RobotConfig",
                  description:
                    "Read-only robot configuration; wheel_speeds() uses track_width_mm.",
                },
              ]}
            />
            <ApiMethod
              name="wheel_speeds"
              signature="wheel_speeds(command: MotionCommand) -> WheelSpeeds"
              summary="Calculate the two wheel speeds for the requested forward speed and turn rate."
              parameters={[
                {
                  name: "command",
                  type: "MotionCommand",
                  units: "mm/s, rad/s",
                  description:
                    "Forward speed v and counterclockwise turn rate ω.",
                },
              ]}
              returns={{
                type: "WheelSpeeds",
                description:
                  "left = v − ωb/2 and right = v + ωb/2, where b is config.track_width_mm.",
              }}
              errors={["TypeError if command is not a MotionCommand value."]}
            />
          </ComponentSection>

          <ComponentSection
            id="odometry"
            name="Odometry"
            file="odometry.py"
            base="OdometryBase"
            description="Estimates the robot pose from measured left and right wheel-distance increments. The virtual robot does not provide simulator ground truth to this component."
            state="After reset(), pose stores the latest estimated x position, y position, and heading."
            constructor="Odometry(config: RobotConfig)"
            example={componentExamples.odometry}
          >
            <PropertyTable
              rows={[
                {
                  name: "config",
                  type: "RobotConfig",
                  description:
                    "Read-only robot configuration; update() uses track_width_mm.",
                },
                {
                  name: "pose",
                  type: "Pose",
                  description:
                    "Latest estimate. Reading it before reset() raises RuntimeError.",
                },
              ]}
            />
            <ApiMethod
              name="reset"
              signature="reset(initial_pose: Pose) -> Pose"
              summary="Set the pose estimate at the beginning of a run."
              parameters={[
                {
                  name: "initial_pose",
                  type: "Pose",
                  units: "mm, rad",
                  description:
                    "Known or assigned starting pose in world coordinates.",
                },
              ]}
              returns={{
                type: "Pose",
                description: "The stored starting pose.",
              }}
              errors={["TypeError if initial_pose is not a Pose value."]}
            />
            <ApiMethod
              name="update"
              signature="update(left_increment_mm: float, right_increment_mm: float) -> Pose"
              summary="Integrate one measured differential-drive motion increment."
              parameters={[
                {
                  name: "left_increment_mm",
                  type: "float",
                  units: "mm",
                  description:
                    "Signed left-wheel travel since the previous sample.",
                },
                {
                  name: "right_increment_mm",
                  type: "float",
                  units: "mm",
                  description:
                    "Signed right-wheel travel since the previous sample.",
                },
              ]}
              returns={{
                type: "Pose",
                description:
                  "Updated world x, y, and wrapped heading estimate.",
              }}
              errors={[
                "RuntimeError if reset() has not been called.",
                "TypeError or ValueError if either increment is not a finite number.",
              ]}
              requirements={[
                "Integrate straight and curved increments without using simulator ground truth.",
                "Wrap heading into [−π, π).",
              ]}
            />
          </ComponentSection>

          <ComponentSection
            id="navigation-controller"
            name="NavigationController"
            file="navigation_controller.py"
            base="NavigationControllerBase"
            description="Generates forward-speed and turn-rate commands that visit an ordered sequence of world-coordinate goals. A goal may require position only or position followed by a final heading."
            state="The component keeps the goal sequence, the active goal, and any turn, drive, or alignment mode used by the implementation."
            constructor="NavigationController(config: NavigationConfig)"
            example={componentExamples.navigation}
          >
            <PropertyTable
              rows={[
                {
                  name: "config",
                  type: "NavigationConfig",
                  description:
                    "Read-only speeds, tolerances, and heading thresholds.",
                },
              ]}
            />
            <ApiMethod
              name="start"
              signature="start(goals: sequence[NavigationGoal]) -> None"
              summary="Load an ordered goal sequence and select its first goal."
              parameters={[
                {
                  name: "goals",
                  type: "list | tuple of NavigationGoal",
                  description: "World-coordinate goals in visit order.",
                },
              ]}
              returns={{ type: "None", description: "No value is returned." }}
              errors={[
                "TypeError if goals is not a list or tuple, or if a member is not a NavigationGoal.",
              ]}
              requirements={[
                "An empty sequence is valid and makes the controller immediately complete.",
              ]}
            />
            <ApiMethod
              name="update"
              signature="update(pose: Pose) -> MotionCommand"
              summary="Calculate the forward-speed and turn-rate request for the active goal."
              parameters={[
                {
                  name: "pose",
                  type: "Pose",
                  units: "mm, rad",
                  description: "Latest odometry estimate.",
                },
              ]}
              returns={{
                type: "MotionCommand",
                description:
                  "Forward speed and turn rate for the next Robot step; STOP_COMMAND after completion.",
              }}
              errors={["TypeError if pose is not a Pose value."]}
              requirements={[
                "Visit goals in the supplied order.",
                "For heading_rad=None, complete the goal using position only.",
                "For a numerical heading, reach position and then satisfy the heading tolerance.",
                "Return STOP_COMMAND after the final goal or for an empty sequence.",
              ]}
            />
            <ApiMethod
              name="current_goal"
              signature="current_goal() -> NavigationGoal | None"
              summary="Return the active goal."
              returns={{
                type: "NavigationGoal | None",
                description:
                  "Current goal, or None after every goal is complete.",
              }}
            />
            <ApiMethod
              name="is_complete"
              signature="is_complete() -> bool"
              summary="Report sequence completion."
              returns={{
                type: "bool",
                description:
                  "True only after every required position and heading has been reached.",
              }}
            />
          </ComponentSection>

          <ComponentSection
            id="grid-planner"
            name="GridPlanner"
            file="grid_planner.py"
            base="GridPlannerBase"
            description="Finds a connected route through free occupancy-grid cells. Consecutive cells in the route share an edge, so each move is horizontal or vertical. Planning finishes before the robot follows the resulting route."
            state="Search data may be local to plan(). A call does not rely on state created by an earlier planning request."
            constructor="GridPlanner()"
            example={componentExamples.planner}
          >
            <ApiMethod
              name="plan"
              signature="plan(grid: OccupancyGrid, start: GridCell | None, goal: GridCell | None) -> GridPath | None"
              summary="Find a valid connected route from the start cell to the goal cell."
              parameters={[
                {
                  name: "grid",
                  type: "OccupancyGrid",
                  description:
                    "Free and blocked cells derived from the active arena.",
                },
                {
                  name: "start",
                  type: "GridCell | None",
                  units: "cell index",
                  description:
                    "Starting cell; None means the world position was outside the grid.",
                },
                {
                  name: "goal",
                  type: "GridCell | None",
                  units: "cell index",
                  description:
                    "Destination cell; None means the world position was outside the grid.",
                },
              ]}
              returns={{
                type: "GridPath | None",
                description:
                  "A valid connected route including both endpoints, or None for missing, blocked, or unreachable endpoints.",
              }}
              errors={[
                "TypeError if grid is not an OccupancyGrid.",
                "TypeError if a non-None endpoint is not a GridCell.",
              ]}
              requirements={[
                "Every cell in the route must be free, and consecutive cells must share an edge.",
                "Return a one-cell path when a free start equals goal.",
                "A minimum-length route is not required; the search algorithm is part of the student implementation.",
              ]}
            />
          </ComponentSection>

          <ReferenceSection id="records" title="Data types">
            <p>
              These value records validate constructor arguments and cannot be
              changed after construction. They expose read-only properties with
              the same names. Unless noted otherwise, numerical inputs must be
              finite.
            </p>
            <RecordReference
              name="RawSensors"
              signature="RawSensors(time_ms, left_encoder_count, right_encoder_count, range_mm, button_pressed)"
              fields={[
                {
                  name: "time_ms",
                  type: "int",
                  units: "ms",
                  description: "Nonnegative device time.",
                },
                {
                  name: "left_encoder_count, right_encoder_count",
                  type: "int",
                  units: "count",
                  description: "Raw signed encoder counts.",
                },
                {
                  name: "range_mm",
                  type: "float | None",
                  units: "mm",
                  description:
                    "Positive ultrasonic range, or None when unavailable or not requested.",
                },
                {
                  name: "button_pressed",
                  type: "bool",
                  description: "Current USER-button state.",
                },
              ]}
            />
            <RecordReference
              name="Measurements"
              signature="Measurements(time_ms, dt_s, left_position_mm, right_position_mm, left_increment_mm, right_increment_mm, left_speed_mm_s, right_speed_mm_s, range_mm, button_pressed)"
              fields={[
                {
                  name: "time_ms",
                  type: "int",
                  units: "ms",
                  description: "Device time for this sample.",
                },
                {
                  name: "dt_s",
                  type: "float",
                  units: "s",
                  description:
                    "Nonnegative elapsed time since the previous sample.",
                },
                {
                  name: "left_position_mm, right_position_mm",
                  type: "float",
                  units: "mm",
                  description: "Signed wheel travel since SensorModel.reset().",
                },
                {
                  name: "left_increment_mm, right_increment_mm",
                  type: "float",
                  units: "mm",
                  description: "Signed wheel travel since the previous sample.",
                },
                {
                  name: "left_speed_mm_s, right_speed_mm_s",
                  type: "float",
                  units: "mm/s",
                  description:
                    "Wheel-speed estimates computed from recent encoder samples.",
                },
                {
                  name: "range_mm",
                  type: "float | None",
                  units: "mm",
                  description: "Usable range or None.",
                },
                {
                  name: "button_pressed",
                  type: "bool",
                  description: "USER-button state.",
                },
                {
                  name: "wheel_speeds",
                  type: "WheelSpeeds",
                  units: "mm/s",
                  description:
                    "Read-only convenience property formed from the two speed fields.",
                },
              ]}
            />
            <RecordReference
              name="WheelSpeeds"
              signature="WheelSpeeds(left_mm_s, right_mm_s)"
              fields={[
                {
                  name: "left_mm_s, right_mm_s",
                  type: "float",
                  units: "mm/s",
                  description:
                    "Signed left and right wheel speeds; positive is forward.",
                },
              ]}
            />
            <RecordReference
              name="DriveCommand"
              signature="DriveCommand(left, right)"
              exceptions="TypeError or ValueError if either command is not finite; ValueError if either magnitude exceeds 1.0."
              fields={[
                {
                  name: "left, right",
                  type: "float",
                  description: "Normalized motor commands in [−1.0, 1.0].",
                },
              ]}
              note="MotorEfforts is a compatibility alias for older projects; new code uses DriveCommand."
            />
            <RecordReference
              name="MotionCommand"
              signature="MotionCommand(forward_speed_mm_s, turn_rate_rad_s)"
              fields={[
                {
                  name: "forward_speed_mm_s",
                  type: "float",
                  units: "mm/s",
                  description: "Requested forward speed of the robot body.",
                },
                {
                  name: "turn_rate_rad_s",
                  type: "float",
                  units: "rad/s",
                  description: "Requested counterclockwise yaw rate.",
                },
              ]}
              note="STOP_COMMAND is the shared MotionCommand(0.0, 0.0)."
            />
            <RecordReference
              name="Pose"
              signature="Pose(x_mm, y_mm, heading_rad)"
              fields={[
                {
                  name: "x_mm, y_mm",
                  type: "float",
                  units: "mm",
                  description: "Position in world coordinates.",
                },
                {
                  name: "heading_rad",
                  type: "float",
                  units: "rad",
                  description: "Heading wrapped to [−π, π).",
                },
              ]}
            />
            <RecordReference
              name="RobotState"
              signature="RobotState(measurements, pose)"
              exceptions="TypeError unless measurements is Measurements and pose is Pose."
              fields={[
                {
                  name: "measurements",
                  type: "Measurements",
                  description: "Latest measured sensor state.",
                },
                {
                  name: "pose",
                  type: "Pose",
                  description: "Latest odometry estimate.",
                },
              ]}
            />
            <RecordReference
              name="NavigationGoal"
              signature="NavigationGoal(x_mm, y_mm, heading_rad=None)"
              fields={[
                {
                  name: "x_mm, y_mm",
                  type: "float",
                  units: "mm",
                  description: "Required world position.",
                },
                {
                  name: "heading_rad",
                  type: "float | None",
                  default: "None",
                  units: "rad",
                  description:
                    "Required final heading, or None for a position-only goal.",
                },
              ]}
            />
            <RecordReference
              name="GridCell"
              signature="GridCell(column, row)"
              exceptions="TypeError unless column and row are integers."
              fields={[
                {
                  name: "column, row",
                  type: "int",
                  description:
                    "Immutable occupancy-grid coordinates. Column increases with world x; row increases with world y. GridCell values may be dictionary keys or set members.",
                },
              ]}
            />
            <RecordReference
              name="GridPath"
              signature="GridPath(cells)"
              exceptions="TypeError unless cells is a list or tuple containing only GridCell values; ValueError for an empty sequence or nonadjacent successive cells."
              fields={[
                {
                  name: "cells",
                  type: "tuple[GridCell, ...]",
                  description:
                    "Nonempty ordered cells; each successive pair must share an edge.",
                },
              ]}
              note="to_goals(grid, final_heading_rad=None) returns NavigationGoal values at direction changes and at the final cell."
            />
            <ApiMethod
              name="GridPath.to_goals"
              signature="to_goals(grid: OccupancyGrid, final_heading_rad: float | None = None) -> tuple[NavigationGoal, ...]"
              summary="Convert a cell path to navigation goals at direction changes and at the destination."
              parameters={[
                {
                  name: "grid",
                  type: "OccupancyGrid",
                  description:
                    "Grid used to convert cell centers to world positions.",
                },
                {
                  name: "final_heading_rad",
                  type: "float | None",
                  default: "None",
                  units: "rad",
                  description:
                    "Optional heading applied only to the destination goal.",
                },
              ]}
              returns={{
                type: "tuple[NavigationGoal, ...]",
                description:
                  "Ordered world-coordinate goals; a one-cell path returns that cell as the destination.",
              }}
              errors={[
                "TypeError if grid is not OccupancyGrid.",
                "TypeError or ValueError if final_heading_rad is not finite.",
                "ValueError if a path cell is outside the grid.",
              ]}
            />
            <CodeExample
              title="Construct course values"
              code={[
                "from ucsb_xrp import (",
                "    MotionCommand, NavigationGoal, Pose, STOP_COMMAND,",
                ")",
                "",
                "initial_pose = Pose(0.0, 0.0, 0.0)",
                "destination = NavigationGoal(1000.0, 400.0, 1.57)",
                "forward = MotionCommand(120.0, 0.0)",
                "stationary = STOP_COMMAND",
              ].join("\n")}
            />
          </ReferenceSection>

          <ReferenceSection id="robot" title="Robot service">
            <p>
              Project code calls <code>make_robot(ROBOT_CONFIG)</code> from{" "}
              <code>course_setup.py</code>. The course library constructs{" "}
              <code>Robot</code> directly when assembling and testing the
              selected components.
            </p>
            <FunctionReference
              signature="make_robot(config: RobotConfig) -> Robot"
              description="Construct XRPBot and the selected SensorModel, WheelSpeedController, DifferentialDrive, and Odometry, then assemble one Robot."
              parameters={[
                {
                  name: "config",
                  type: "RobotConfig",
                  description: "Robot geometry, timing, and control settings.",
                },
              ]}
              returns={{
                type: "Robot",
                description: "Assembled measured-control service.",
              }}
              errors={[
                "TypeError if config is not RobotConfig or a selected component does not implement its required methods.",
              ]}
            />
            <FunctionReference
              signature="make_navigation_controller(config: NavigationConfig) -> NavigationControllerBase"
              description="Construct the supplied or student navigation controller selected in course_setup.py."
              parameters={[
                {
                  name: "config",
                  type: "NavigationConfig",
                  description: "Navigation speeds, thresholds, and tolerances.",
                },
              ]}
              returns={{
                type: "NavigationControllerBase",
                description: "Selected navigation implementation.",
              }}
              errors={[
                "TypeError if config is not NavigationConfig or the selected class does not implement the interface.",
              ]}
            />
            <FunctionReference
              signature="make_grid_planner() -> GridPlannerBase"
              description="Construct the supplied or student grid planner selected in course_setup.py."
              returns={{
                type: "GridPlannerBase",
                description: "Selected planning implementation.",
              }}
            />
            <ClassReference
              name="Robot"
              signature="Robot(config: RobotConfig, bot, sensor_model, wheel_controller, differential_drive, odometry)"
              description="Assemble the hardware boundary and four selected components into one timed measurement and control service."
              state="After start(), Robot keeps the latest RobotState, the next absolute sample deadline, and the most recent timing overrun. stop() changes the commanded motion to zero but leaves the latest measurements and pose available through state."
              constructorParameters={[
                {
                  name: "config",
                  type: "RobotConfig",
                  description: "Geometry, timing, calibration, and limits.",
                },
                {
                  name: "bot",
                  type: "XRPBot-compatible object",
                  description:
                    "Hardware boundary providing read(), reset_encoders(), wait_for_button(), set_drive(), and stop().",
                },
                {
                  name: "sensor_model",
                  type: "SensorModelBase",
                  description:
                    "Selected measurement and range-estimation component.",
                },
                {
                  name: "wheel_controller",
                  type: "WheelSpeedControllerBase",
                  description: "Selected wheel-speed control component.",
                },
                {
                  name: "differential_drive",
                  type: "DifferentialDriveBase",
                  description: "Selected drive-kinematics component.",
                },
                {
                  name: "odometry",
                  type: "OdometryBase",
                  description: "Selected pose-estimation component.",
                },
              ]}
              constructorErrors={[
                "TypeError if config is not RobotConfig or any component lacks a required method.",
              ]}
              properties={[
                {
                  name: "config",
                  type: "RobotConfig",
                  description: "Configuration used by the assembled robot.",
                },
                {
                  name: "state",
                  type: "RobotState",
                  description:
                    "Latest state; raises RuntimeError before start().",
                },
                {
                  name: "last_overrun_ms",
                  type: "int",
                  units: "ms",
                  description:
                    "Milliseconds by which the most recent calculation exceeded its sample deadline; zero when it finished on time.",
                },
              ]}
            >
              <ApiMethod
                nested
                name="start"
                signature="start(initial_pose: Pose) -> RobotState"
                summary="Reset the encoders and selected components, establish the initial pose, and publish the first state."
                parameters={[
                  {
                    name: "initial_pose",
                    type: "Pose",
                    units: "mm, rad",
                    description: "Assigned pose at the start of the run.",
                  },
                ]}
                returns={{
                  type: "RobotState",
                  description: "Zero-travel measurements and the initial pose.",
                }}
                errors={[
                  "TypeError if initial_pose is not a Pose.",
                  "Hardware or component exceptions from button wait, encoder reset, initial read, or component reset.",
                ]}
                requirements={[
                  "An IDE-managed Run starts immediately; a direct standalone launch waits for the XRP USER button.",
                ]}
              />
              <ApiMethod
                nested
                name="step"
                signature="step(command: MotionCommand, read_range: bool = False) -> RobotState"
                summary="Execute one timed control and measurement cycle."
                parameters={[
                  {
                    name: "command",
                    type: "MotionCommand",
                    units: "mm/s, rad/s",
                    description:
                      "Requested forward speed and turn rate for this sample.",
                  },
                  {
                    name: "read_range",
                    type: "bool",
                    default: "False",
                    description:
                      "True to include an ultrasonic reading in this sample.",
                  },
                ]}
                returns={{
                  type: "RobotState",
                  description: "New Measurements and odometry Pose.",
                }}
                errors={[
                  "RuntimeError before start().",
                  "TypeError for invalid argument types.",
                  "Any hardware or component exception is re-raised after Robot attempts to stop the motors.",
                ]}
              />
              <ApiMethod
                nested
                name="estimate_range"
                signature="estimate_range(samples, minimum_usable: int) -> float | None"
                summary="Apply the selected SensorModel range estimator."
                parameters={[
                  {
                    name: "samples",
                    type: "iterable[float | None]",
                    units: "mm",
                    description: "Range readings to combine.",
                  },
                  {
                    name: "minimum_usable",
                    type: "int",
                    description: "Minimum accepted reading count.",
                  },
                ]}
                returns={{
                  type: "float | None",
                  description: "Estimated range or None.",
                }}
                errors={[
                  "Exceptions raised by the selected SensorModel estimate_range() implementation.",
                ]}
              />
              <ApiMethod
                nested
                name="stop"
                signature="stop() -> None"
                summary="Command zero drive and publish the stopped command."
                returns={{ type: "None", description: "No value is returned." }}
                errors={[
                  "A hardware exception if either motor cannot be commanded to zero.",
                ]}
              />
            </ClassReference>
          </ReferenceSection>

          <ReferenceSection
            id="live"
            title="Live controls, watch values, and plots"
          >
            <p>
              Declare controls once near the top of <code>main.py</code>, then
              read each returned parameter&apos;s <code>.value</code> in the
              loop. The Monitor marks edits as pending and{" "}
              <code>Robot.step()</code> applies them together at the next sample
              boundary. A project may declare at most 16 controls, 16 watch
              values, and 16 plot values.
            </p>
            <FunctionReference
              signature={
                'live.number(name, default, minimum, maximum, step, unit="", label=None) -> LiveParameter'
              }
              description="Create a bounded numerical slider. The range need not contain an exact integer number of steps; values are clipped and snapped to the nearest valid step."
              parameters={[
                {
                  name: "name",
                  type: "str",
                  description: "Unique Python identifier used during the run.",
                },
                {
                  name: "default, minimum, maximum, step",
                  type: "float",
                  description:
                    "Finite numerical settings; maximum must exceed minimum and step must be positive.",
                },
                {
                  name: "unit",
                  type: "str",
                  default: '""',
                  description: "Optional concise unit shown in the Monitor.",
                },
                {
                  name: "label",
                  type: "str | None",
                  default: "None",
                  description:
                    "Displayed label; derived from name when omitted.",
                },
              ]}
              returns={{
                type: "LiveParameter",
                description: "Parameter with a numerical .value property.",
              }}
              errors={[
                "TypeError for nonnumeric values or non-string names, labels, and units.",
                "ValueError for an invalid name, range, step, default, or duplicate declaration.",
              ]}
            />
            <FunctionReference
              signature="live.toggle(name, default, label=None) -> LiveParameter"
              description="Create a Boolean switch."
              parameters={[
                {
                  name: "name",
                  type: "str",
                  description: "Unique Python identifier.",
                },
                {
                  name: "default",
                  type: "bool",
                  description: "Initial state.",
                },
                {
                  name: "label",
                  type: "str | None",
                  default: "None",
                  description: "Displayed label.",
                },
              ]}
              returns={{
                type: "LiveParameter",
                description: "Parameter with a Boolean .value property.",
              }}
              errors={[
                "TypeError unless default is bool and text arguments are strings.",
                "ValueError for an invalid or duplicate name.",
              ]}
            />
            <FunctionReference
              signature="live.choice(name, default, options, label=None) -> LiveParameter"
              description="Create a choice among two to six strings."
              parameters={[
                {
                  name: "name",
                  type: "str",
                  description: "Unique Python identifier.",
                },
                {
                  name: "default",
                  type: "str",
                  description: "Initial value, which must occur in options.",
                },
                {
                  name: "options",
                  type: "list | tuple[str]",
                  description: "Two to six unique short strings.",
                },
                {
                  name: "label",
                  type: "str | None",
                  default: "None",
                  description: "Displayed label.",
                },
              ]}
              returns={{
                type: "LiveParameter",
                description: "Parameter whose .value is the selected string.",
              }}
              errors={[
                "TypeError for non-string text arguments.",
                "ValueError unless options contains two to six unique strings and default is one of them.",
              ]}
            />
            <FunctionReference
              signature={'live.watch(name, value, unit="", label=None) -> None'}
              description="Publish the latest number, Boolean, or short text value in Live telemetry. Calling it again with the same name updates that row."
              parameters={[
                {
                  name: "name",
                  type: "str",
                  description: "Stable identifier for this displayed value.",
                },
                {
                  name: "value",
                  type: "float | int | bool | str",
                  description: "Current finite number, Boolean, or text value.",
                },
                {
                  name: "unit",
                  type: "str",
                  default: '""',
                  description: "Optional concise unit.",
                },
                {
                  name: "label",
                  type: "str | None",
                  default: "None",
                  description:
                    "Displayed label; derived from name when omitted.",
                },
              ]}
              returns={{
                type: "None",
                description:
                  "The value is included in the next published live-data update.",
              }}
              errors={[
                "TypeError for an unsupported value or text argument type.",
                "ValueError for an invalid name, nonfinite number, text above 64 characters, or more than 16 watches.",
              ]}
            />
            <FunctionReference
              signature={'live.plot(name, value, unit="", label=None) -> None'}
              description="Publish a finite numerical value as an optional time-history signal. The named signal appears in Monitor Controls."
              parameters={[
                {
                  name: "name",
                  type: "str",
                  description: "Stable identifier for this plotted signal.",
                },
                {
                  name: "value",
                  type: "float | int",
                  description: "Current finite numerical value.",
                },
                {
                  name: "unit",
                  type: "str",
                  default: '""',
                  description: "Optional concise unit.",
                },
                {
                  name: "label",
                  type: "str | None",
                  default: "None",
                  description:
                    "Displayed label; derived from name when omitted.",
                },
              ]}
              returns={{
                type: "None",
                description:
                  "The value is included in the next published live-data update.",
              }}
              errors={[
                "TypeError if value is not numeric or a text argument is not a string.",
                "ValueError for a nonfinite value, invalid name, or more than 16 plots.",
              ]}
            />
            <FunctionReference
              signature="live.apply_updates() -> bool"
              description="Apply pending control values. Robot.start() and Robot.step() call this automatically at sample boundaries."
              returns={{
                type: "bool",
                description: "True when at least one value changed.",
              }}
            />
            <CodeExample
              title="Live parameter and measured signal"
              code={[
                "from ucsb_xrp import live",
                "",
                "CRUISE_SPEED = live.number(",
                '    "cruise_speed_mm_s", 120.0, 60.0, 220.0, 10.0,',
                '    unit="mm/s", label="Cruise speed",',
                ")",
                "",
                "live.plot(",
                '    "wheel_speed_error_mm_s",',
                "    target_mm_s - measured_mm_s,",
                '    unit="mm/s",',
                ")",
              ].join("\n")}
            />
          </ReferenceSection>

          <ReferenceSection id="worlds" title="Project worlds">
            <p>
              Each project includes a <code>world.json</code> file. It defines
              one or more world choices, world bounds, initial pose, rectangular
              obstacles, named changeable features, and visual markers such as
              start lines, start boxes, and waypoints. The IDE transfers this
              file with the project; the Monitor uses the same definition.
            </p>
            <FunctionReference
              signature={
                'load_world(path="world.json", world_id=None) -> ProjectWorld'
              }
              description="Load the default world from a project file, or a specific world by id."
              parameters={[
                {
                  name: "path",
                  type: "str",
                  default: '"world.json"',
                  description:
                    "JSON file path; defaults to the current project world.json.",
                },
                {
                  name: "world_id",
                  type: "str | None",
                  default: "None",
                  description: "Requested id, or None to use default_world.",
                },
              ]}
              returns={{
                type: "ProjectWorld",
                description: "Validated selected world.",
              }}
              errors={[
                "OSError if path cannot be opened.",
                "ValueError or TypeError if the JSON structure or selected world is invalid.",
              ]}
            />
            <ClassReference
              name="ProjectWorld"
              signature="ProjectWorld(item: dict)"
              description="One named world decoded from a world.json catalog. load_world() returns this value to project code."
              constructorParameters={[
                {
                  name: "item",
                  type: "dict",
                  description:
                    "Decoded world object containing id, label, bounds, initial pose, obstacles, and markers.",
                },
              ]}
              constructorErrors={[
                "TypeError if item or a required nested object has the wrong JSON type.",
                "ValueError if an id, label, boundary, obstacle, feature, or initial-pose coordinate is invalid.",
              ]}
              properties={[
                {
                  name: "id",
                  type: "str",
                  description: "Stable world identifier.",
                },
                {
                  name: "label",
                  type: "str",
                  description: "Label shown in the world selector.",
                },
                {
                  name: "bounds_mm",
                  type: "tuple[float, float, float, float]",
                  description:
                    "Minimum x, minimum y, maximum x, maximum y in millimeters.",
                },
                {
                  name: "initial_pose",
                  type: "Pose",
                  description: "Starting pose declared by the world.",
                },
                {
                  name: "feature_names",
                  type: "tuple[str, ...]",
                  description:
                    "Named obstacles whose blocked state can change.",
                },
              ]}
            >
              <ApiMethod
                nested
                name="arena_map"
                signature="arena_map(blocked_features=()) -> ArenaMap"
                summary="Build map geometry from the world, optionally marking named features as blocked."
                parameters={[
                  {
                    name: "blocked_features",
                    type: "iterable[str]",
                    default: "()",
                    description:
                      "Feature names to include as blocked obstacles.",
                  },
                ]}
                returns={{
                  type: "ArenaMap",
                  description:
                    "Arena value used by occupancy-grid planning; the returned map is not modified after construction.",
                }}
                errors={[
                  "ValueError if blocked_features contains an unknown feature name.",
                ]}
              />
              <ApiMethod
                nested
                name="waypoint"
                signature="waypoint(name: str) -> NavigationGoal"
                summary="Read one named waypoint marker."
                parameters={[
                  {
                    name: "name",
                    type: "str",
                    description: "Waypoint marker name.",
                  },
                ]}
                returns={{
                  type: "NavigationGoal",
                  description: "Waypoint position and optional heading.",
                }}
                errors={[
                  "ValueError if the name is not a waypoint in this world or its coordinates are invalid.",
                ]}
              />
              <ApiMethod
                nested
                name="waypoints"
                signature="waypoints() -> tuple[NavigationGoal, ...]"
                summary="Read every waypoint marker in file order."
                returns={{
                  type: "tuple[NavigationGoal, ...]",
                  description: "All declared waypoint goals.",
                }}
                errors={[
                  "TypeError or ValueError if a waypoint marker contains invalid coordinates or a heading.",
                ]}
              />
            </ClassReference>
            <CodeExample
              title="Load the project world and map"
              code={[
                "from ucsb_xrp import load_world",
                "",
                "world = load_world()",
                "start_pose = world.initial_pose",
                'arena = world.arena_map(blocked_features=("gate",))',
                'destination = world.waypoint("delivery")',
              ].join("\n")}
            />
          </ReferenceSection>

          <ReferenceSection id="maps" title="Maps and routes">
            <ClassReference
              name="Rectangle"
              signature="Rectangle(minimum_x_mm: float, minimum_y_mm: float, maximum_x_mm: float, maximum_y_mm: float)"
              description="Closed axis-aligned bounds in millimeters. Maximum coordinates must exceed minimum coordinates."
              constructorParameters={[
                {
                  name: "minimum_x_mm, minimum_y_mm",
                  type: "float",
                  units: "mm",
                  description: "Minimum world x and y coordinates.",
                },
                {
                  name: "maximum_x_mm, maximum_y_mm",
                  type: "float",
                  units: "mm",
                  description:
                    "Maximum world x and y coordinates; each must exceed its corresponding minimum.",
                },
              ]}
              constructorErrors={[
                "TypeError or ValueError if a coordinate is not a finite number.",
                "ValueError if the width or height is not positive.",
              ]}
              properties={[
                {
                  name: "minimum_x_mm, minimum_y_mm",
                  type: "float",
                  units: "mm",
                  description: "Read-only minimum coordinates.",
                },
                {
                  name: "maximum_x_mm, maximum_y_mm",
                  type: "float",
                  units: "mm",
                  description: "Read-only maximum coordinates.",
                },
                {
                  name: "bounds_mm",
                  type: "tuple[float, float, float, float]",
                  units: "mm",
                  description:
                    "Minimum x, minimum y, maximum x, and maximum y.",
                },
              ]}
            >
              <ApiMethod
                nested
                name="contains"
                signature="contains(x_mm: float, y_mm: float, margin_mm: float = 0.0) -> bool"
                summary="Test whether a point lies in the closed rectangle expanded by an optional margin."
                parameters={[
                  {
                    name: "x_mm, y_mm",
                    type: "float",
                    units: "mm",
                    description: "Point in world coordinates.",
                  },
                  {
                    name: "margin_mm",
                    type: "float",
                    default: "0.0",
                    units: "mm",
                    description:
                      "Nonnegative outward expansion applied on all four sides.",
                  },
                ]}
                returns={{
                  type: "bool",
                  description:
                    "True when the expanded rectangle contains the point.",
                }}
                errors={[
                  "TypeError or ValueError if a coordinate or margin is not finite.",
                  "ValueError if margin_mm is negative.",
                ]}
              />
            </ClassReference>
            <ClassReference
              name="ArenaMap"
              signature="ArenaMap(bounds_mm: Rectangle | sequence[float], obstacles=(), features=None, blocked_features=())"
              description="Arena boundary, fixed rectangular obstacles, and named features whose blocked state may change. Methods return a new map rather than modifying this value."
              constructorParameters={[
                {
                  name: "bounds_mm",
                  type: "Rectangle | sequence[float]",
                  units: "mm",
                  description:
                    "Arena boundary as a Rectangle or four-number bounds.",
                },
                {
                  name: "obstacles",
                  type: "sequence[Rectangle | sequence[float]]",
                  default: "()",
                  units: "mm",
                  description: "Fixed blocked rectangles.",
                },
                {
                  name: "features",
                  type: "dict[str, Rectangle | sequence[float]] | None",
                  default: "None",
                  units: "mm",
                  description:
                    "Named rectangles whose blocked state may change.",
                },
                {
                  name: "blocked_features",
                  type: "iterable[str]",
                  default: "()",
                  description: "Feature names initially treated as blocked.",
                },
              ]}
              constructorErrors={[
                "TypeError for an invalid boundary, obstacle collection, feature mapping, or feature name.",
                "ValueError for invalid rectangle dimensions or an unknown blocked feature.",
              ]}
              properties={[
                {
                  name: "bounds_mm",
                  type: "tuple[float, float, float, float]",
                  units: "mm",
                  description: "Arena boundary coordinates.",
                },
                {
                  name: "obstacles",
                  type: "tuple[Rectangle, ...]",
                  description: "Fixed blocked rectangles.",
                },
                {
                  name: "feature_names",
                  type: "tuple[str, ...]",
                  description: "Named features in sorted order.",
                },
                {
                  name: "blocked_features",
                  type: "tuple[str, ...]",
                  description:
                    "Currently blocked feature names in sorted order.",
                },
              ]}
            >
              <ApiMethod
                nested
                name="feature_bounds"
                signature="feature_bounds(name: str) -> tuple[float, float, float, float]"
                summary="Read the boundary of one named feature."
                parameters={[
                  {
                    name: "name",
                    type: "str",
                    description: "Feature name declared in the map.",
                  },
                ]}
                returns={{
                  type: "tuple[float, float, float, float]",
                  description:
                    "Minimum x, minimum y, maximum x, and maximum y in millimeters.",
                }}
                errors={["ValueError if name is not a map feature."]}
              />
              <ApiMethod
                nested
                name="contains"
                signature="contains(x_mm: float, y_mm: float) -> bool"
                summary="Test whether a world point lies within the arena boundary."
                parameters={[
                  {
                    name: "x_mm, y_mm",
                    type: "float",
                    units: "mm",
                    description: "Point in world coordinates.",
                  },
                ]}
                returns={{
                  type: "bool",
                  description:
                    "True when the point is on or inside the arena boundary; obstacles are not considered.",
                }}
                errors={[
                  "TypeError or ValueError if either coordinate is not finite.",
                ]}
              />
              <ApiMethod
                nested
                name="is_free"
                signature="is_free(x_mm: float, y_mm: float, clearance_mm: float = 0.0) -> bool"
                summary="Test arena containment and obstacle clearance for one world point."
                parameters={[
                  {
                    name: "x_mm, y_mm",
                    type: "float",
                    units: "mm",
                    description: "Point in world coordinates.",
                  },
                  {
                    name: "clearance_mm",
                    type: "float",
                    default: "0.0",
                    units: "mm",
                    description:
                      "Nonnegative inward boundary margin and outward obstacle expansion.",
                  },
                ]}
                returns={{
                  type: "bool",
                  description:
                    "True only when the point has the requested clearance from boundaries, fixed obstacles, and blocked features.",
                }}
                errors={[
                  "TypeError or ValueError if a coordinate or clearance is not finite.",
                  "ValueError if clearance_mm is negative.",
                ]}
              />
              <ApiMethod
                nested
                name="with_feature_blocked"
                signature="with_feature_blocked(name: str, blocked: bool) -> ArenaMap"
                summary="Create a map with one feature assigned a new blocked state."
                parameters={[
                  {
                    name: "name",
                    type: "str",
                    description: "Feature to change.",
                  },
                  {
                    name: "blocked",
                    type: "bool",
                    description:
                      "True to block the feature; False to clear it.",
                  },
                ]}
                returns={{
                  type: "ArenaMap",
                  description: "New map; the original map remains unchanged.",
                }}
                errors={[
                  "ValueError if name is not a map feature.",
                  "TypeError if blocked is not bool.",
                ]}
              />
            </ClassReference>
            <ClassReference
              name="OccupancyGrid"
              signature="OccupancyGrid(resolution_mm: float, origin_x_mm: float, origin_y_mm: float, column_count: int, row_count: int, blocked: iterable[bool])"
              description="Uniform free/blocked samples of an ArenaMap. resolution_mm is the cell size; clearance_mm expands boundaries and obstacles for the robot footprint."
              constructorParameters={[
                {
                  name: "resolution_mm",
                  type: "float",
                  units: "mm",
                  description: "Positive square-cell size.",
                },
                {
                  name: "origin_x_mm, origin_y_mm",
                  type: "float",
                  units: "mm",
                  description:
                    "World coordinates at the grid lower-left corner.",
                },
                {
                  name: "column_count, row_count",
                  type: "int",
                  description: "Positive grid dimensions.",
                },
                {
                  name: "blocked",
                  type: "iterable[bool]",
                  description:
                    "Row-major blocked flags; length must equal column_count × row_count.",
                },
              ]}
              constructorErrors={[
                "TypeError or ValueError for a nonfinite or nonpositive resolution or nonfinite origin.",
                "ValueError for a nonpositive row or column count or a blocked-data length mismatch.",
              ]}
              properties={[
                {
                  name: "resolution_mm",
                  type: "float",
                  units: "mm",
                  description: "Square-cell size.",
                },
                {
                  name: "origin_x_mm, origin_y_mm",
                  type: "float",
                  units: "mm",
                  description:
                    "World coordinates at the grid lower-left corner.",
                },
                {
                  name: "column_count, row_count",
                  type: "int",
                  description: "Grid dimensions.",
                },
              ]}
            >
              <ApiMethod
                nested
                name="OccupancyGrid.from_arena"
                signature="from_arena(arena: ArenaMap, resolution_mm: float, clearance_mm: float = 0.0) -> OccupancyGrid"
                summary="Sample an arena at cell centers to construct a planning grid."
                parameters={[
                  {
                    name: "arena",
                    type: "ArenaMap",
                    description: "Map geometry to sample.",
                  },
                  {
                    name: "resolution_mm",
                    type: "float",
                    units: "mm",
                    description: "Positive square-cell size.",
                  },
                  {
                    name: "clearance_mm",
                    type: "float",
                    default: "0.0",
                    units: "mm",
                    description: "Nonnegative boundary and obstacle clearance.",
                  },
                ]}
                returns={{
                  type: "OccupancyGrid",
                  description: "New row-major free/blocked grid.",
                }}
                errors={[
                  "TypeError if arena is not an ArenaMap.",
                  "TypeError or ValueError if resolution or clearance is not finite.",
                  "ValueError if resolution_mm is not positive or clearance_mm is negative.",
                ]}
              />
              <ApiMethod
                nested
                name="world_to_cell"
                signature="world_to_cell(x_mm: float, y_mm: float) -> GridCell | None"
                summary="Convert world coordinates to the containing grid cell."
                parameters={[
                  {
                    name: "x_mm, y_mm",
                    type: "float",
                    units: "mm",
                    description: "Point in world coordinates.",
                  },
                ]}
                returns={{
                  type: "GridCell | None",
                  description:
                    "Containing cell, or None when the point is outside the grid.",
                }}
                errors={[
                  "TypeError or ValueError if either coordinate is not finite.",
                ]}
              />
              <ApiMethod
                nested
                name="cell_center"
                signature="cell_center(cell: GridCell) -> tuple[float, float]"
                summary="Convert one grid cell to its world-coordinate center."
                parameters={[
                  {
                    name: "cell",
                    type: "GridCell",
                    description: "Cell inside this grid.",
                  },
                ]}
                returns={{
                  type: "tuple[float, float]",
                  description: "Center x and y in millimeters.",
                }}
                errors={[
                  "TypeError if cell is not a GridCell.",
                  "ValueError if cell is outside the grid.",
                ]}
              />
              <ApiMethod
                nested
                name="contains"
                signature="contains(cell: GridCell) -> bool"
                summary="Test whether a cell index is inside the grid."
                parameters={[
                  {
                    name: "cell",
                    type: "GridCell",
                    description: "Cell index to test.",
                  },
                ]}
                returns={{
                  type: "bool",
                  description: "True when column and row are within bounds.",
                }}
                errors={["TypeError if cell is not a GridCell."]}
              />
              <ApiMethod
                nested
                name="is_blocked"
                signature="is_blocked(cell: GridCell) -> bool"
                summary="Read the occupancy state of a cell."
                parameters={[
                  {
                    name: "cell",
                    type: "GridCell",
                    description: "Cell index to test.",
                  },
                ]}
                returns={{
                  type: "bool",
                  description:
                    "Stored blocked flag; cells outside the grid are treated as blocked.",
                }}
                errors={["TypeError if cell is not a GridCell."]}
              />
              <ApiMethod
                nested
                name="neighbors"
                signature="neighbors(cell: GridCell) -> tuple[GridCell, ...]"
                summary="List free cells that share an edge with one cell."
                parameters={[
                  {
                    name: "cell",
                    type: "GridCell",
                    description:
                      "Cell whose adjacent free cells are requested.",
                  },
                ]}
                returns={{
                  type: "tuple[GridCell, ...]",
                  description:
                    "Free adjacent cells in right, up, left, down order; off-grid and blocked candidates are omitted.",
                }}
                errors={["TypeError if cell is not a GridCell."]}
              />
            </ClassReference>
            <CodeExample
              title="Create a grid and inspect adjacent cells"
              code={[
                "from ucsb_xrp import ArenaMap, OccupancyGrid, Rectangle",
                "",
                "arena = ArenaMap(",
                "    bounds_mm=Rectangle(0.0, 0.0, 1200.0, 800.0),",
                "    obstacles=(Rectangle(500.0, 200.0, 700.0, 600.0),),",
                ")",
                "grid = OccupancyGrid.from_arena(",
                "    arena, resolution_mm=100.0, clearance_mm=90.0",
                ")",
                "cell = grid.world_to_cell(100.0, 100.0)",
                "adjacent_cells = grid.neighbors(cell)",
              ].join("\n")}
            />
          </ReferenceSection>

          <ReferenceSection id="configuration" title="Configuration">
            <h3 className="api-class-title">RobotConfig</h3>
            <code className="class-signature">
              RobotConfig(sample_period_ms: int = 20, wheel_diameter_mm: float =
              60.0, encoder_counts_per_revolution: float = 585.0,
              track_width_mm: float = 155.0, left_motor_sign: int = 1,
              right_motor_sign: int = 1, left_encoder_sign: int = 1,
              right_encoder_sign: int = 1, left_start_command: float | None =
              None, right_start_command: float | None = None,
              left_speed_command_gain: float | None = None,
              right_speed_command_gain: float | None = None,
              wheel_speed_filter_time_constant_ms: float = 80.0, wheel_speed_kp:
              float = 0.0, max_drive_command: float | None = None, **legacy)
            </code>
            <p>
              Robot geometry, signs, calibration, sample timing, wheel-speed
              estimation, feedback gain, and command limit. Values cannot be
              changed after construction. Define it in{" "}
              <code>robot_config.py</code>. The geometric defaults describe a
              nominal XRP; motor-calibration defaults provide no feedforward
              command or feedback correction. Measure or select project values
              before physical motion.
            </p>
            <ParameterTable rows={robotConfigFields} />
            <p className="exception-line">
              <strong>Raises:</strong> <code>TypeError</code> for invalid
              argument types or unknown names; <code>ValueError</code> for
              nonfinite values, invalid signs, nonpositive geometry, or command
              settings outside their stated limits.
            </p>
            <p>
              The five command-related arguments use <code>None</code> at the
              call boundary so releases before 0.3 can still supply{" "}
              <code>left_start_effort</code>, <code>right_start_effort</code>,{" "}
              <code>left_speed_effort_gain</code>,{" "}
              <code>right_speed_effort_gain</code>, or <code>max_effort</code>.
              The stored values are numerical and use the effective defaults in
              the table. The same five names remain available as read-only
              compatibility properties. Do not supply both the current and old
              name for one value.
            </p>
            <h3 className="api-class-title">NavigationConfig</h3>
            <code className="class-signature">
              NavigationConfig(cruise_speed_mm_s, approach_speed_mm_s,
              slowdown_distance_mm, turn_rate_rad_s, position_tolerance_mm,
              heading_tolerance_rad, realign_heading_rad)
            </code>
            <ParameterTable
              rows={[
                {
                  name: "cruise_speed_mm_s",
                  type: "float",
                  units: "mm/s",
                  description: "Positive normal forward speed.",
                },
                {
                  name: "approach_speed_mm_s",
                  type: "float",
                  units: "mm/s",
                  description:
                    "Positive reduced speed near a goal; no greater than cruise speed.",
                },
                {
                  name: "slowdown_distance_mm",
                  type: "float",
                  units: "mm",
                  description:
                    "Positive distance at which the controller changes to approach speed.",
                },
                {
                  name: "turn_rate_rad_s",
                  type: "float",
                  units: "rad/s",
                  description:
                    "Positive magnitude used for heading corrections.",
                },
                {
                  name: "position_tolerance_mm",
                  type: "float",
                  units: "mm",
                  description:
                    "Nonnegative distance accepted as reaching a goal.",
                },
                {
                  name: "heading_tolerance_rad",
                  type: "float",
                  units: "rad",
                  description:
                    "Nonnegative final-heading error accepted as complete.",
                },
                {
                  name: "realign_heading_rad",
                  type: "float",
                  units: "rad",
                  description:
                    "Heading error that triggers realignment; no smaller than heading_tolerance_rad.",
                },
              ]}
            />
            <p className="exception-line">
              <strong>Raises:</strong> <code>TypeError</code> for invalid
              argument types; <code>ValueError</code> for nonfinite or
              out-of-range values, approach speed above cruise speed, or
              realignment threshold below heading tolerance.
            </p>
            <p>
              All constructor values are available through same-named read-only
              properties.
            </p>
            <CodeExample
              title="Define project configuration"
              code={[
                "from ucsb_xrp import NavigationConfig, RobotConfig",
                "",
                "ROBOT_CONFIG = RobotConfig(",
                "    sample_period_ms=20,",
                "    wheel_diameter_mm=60.0,",
                "    track_width_mm=155.0,",
                "    wheel_speed_filter_time_constant_ms=80.0,",
                ")",
                "NAVIGATION_CONFIG = NavigationConfig(",
                "    cruise_speed_mm_s=140.0,",
                "    approach_speed_mm_s=60.0,",
                "    slowdown_distance_mm=180.0,",
                "    turn_rate_rad_s=0.8,",
                "    position_tolerance_mm=25.0,",
                "    heading_tolerance_rad=0.08,",
                "    realign_heading_rad=0.35,",
                ")",
              ].join("\n")}
            />
          </ReferenceSection>

          <ReferenceSection id="missions" title="Supplied mission services">
            <ClassReference
              name="StraightLineController"
              signature="StraightLineController(config: NavigationConfig)"
              description="Challenge 1 service that advances through one nonnegative straight-line distance using measured mean wheel position."
              state="After start(), the controller keeps the starting mean wheel position, requested distance, and completion state for the current move. Calling start() begins a new move."
              constructorParameters={[
                {
                  name: "config",
                  type: "NavigationConfig",
                  description:
                    "Cruise speed, approach speed, slowdown distance, and position tolerance.",
                },
              ]}
              constructorErrors={[
                "TypeError if config is not a NavigationConfig.",
              ]}
            >
              <ApiMethod
                nested
                name="start"
                signature="start(measurements: Measurements, distance_mm: float) -> None"
                summary="Set the current mean wheel position as the origin for one forward move."
                parameters={[
                  {
                    name: "measurements",
                    type: "Measurements",
                    description: "Measurements at the start of the move.",
                  },
                  {
                    name: "distance_mm",
                    type: "float",
                    units: "mm",
                    description: "Nonnegative requested travel distance.",
                  },
                ]}
                returns={{ type: "None", description: "No value is returned." }}
                errors={[
                  "TypeError if measurements is not a Measurements value.",
                  "TypeError or ValueError if distance_mm is not finite.",
                  "ValueError if distance_mm is negative.",
                ]}
              />
              <ApiMethod
                nested
                name="update"
                signature="update(measurements: Measurements) -> MotionCommand"
                summary="Select cruise, approach, or stop speed from the newest mean wheel position."
                parameters={[
                  {
                    name: "measurements",
                    type: "Measurements",
                    description: "Newest measured wheel positions.",
                  },
                ]}
                returns={{
                  type: "MotionCommand",
                  description:
                    "Straight command with zero turn rate, or STOP_COMMAND once complete.",
                }}
                errors={[
                  "RuntimeError if start() has not been called.",
                  "TypeError if measurements is not a Measurements value.",
                ]}
              />
              <ApiMethod
                nested
                name="is_complete"
                signature="is_complete() -> bool"
                summary="Report whether the requested distance is within position tolerance."
                returns={{
                  type: "bool",
                  description:
                    "True after completion; False before start() or while travel remains.",
                }}
              />
              <CodeExample
                title="Evaluate a straight-line command"
                code={[
                  "from robot_config import STRAIGHT_CONFIG",
                  "from ucsb_xrp import Measurements, StraightLineController",
                  "",
                  "measured = Measurements(",
                  "    0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, None, False",
                  ")",
                  "controller = StraightLineController(STRAIGHT_CONFIG)",
                  "controller.start(measured, distance_mm=500.0)",
                  "command = controller.update(measured)",
                ].join("\n")}
              />
            </ClassReference>
            <ClassReference
              name="DeliveryTask"
              signature="DeliveryTask(initial_pose: Pose, arena: ArenaMap, grid_resolution_mm: float, clearance_mm: float, destination: NavigationGoal, observed_feature_name: str, range_sample_count: int, minimum_usable_range_count: int, blocked_range_threshold_mm: float, assume_blocked_without_range: bool)"
              description="Challenge 5 task values: starting pose, map, grid settings, destination, observed feature, and ultrasonic decision settings. Values cannot be changed after construction."
              constructorParameters={[
                {
                  name: "initial_pose",
                  type: "Pose",
                  description: "Robot pose assigned at mission start.",
                },
                {
                  name: "arena",
                  type: "ArenaMap",
                  description: "Arena with the observed feature declared.",
                },
                {
                  name: "grid_resolution_mm",
                  type: "float",
                  units: "mm",
                  description: "Positive occupancy-grid cell size.",
                },
                {
                  name: "clearance_mm",
                  type: "float",
                  units: "mm",
                  description:
                    "Nonnegative boundary and obstacle clearance used when constructing the grid.",
                },
                {
                  name: "destination",
                  type: "NavigationGoal",
                  description: "Final world-coordinate delivery goal.",
                },
                {
                  name: "observed_feature_name",
                  type: "str",
                  description: "Arena feature classified by range samples.",
                },
                {
                  name: "range_sample_count",
                  type: "int",
                  description: "Positive number of range samples to request.",
                },
                {
                  name: "minimum_usable_range_count",
                  type: "int",
                  description:
                    "Positive required usable count, no greater than range_sample_count.",
                },
                {
                  name: "blocked_range_threshold_mm",
                  type: "float",
                  units: "mm",
                  description:
                    "Positive range at or below which the observed feature is blocked.",
                },
                {
                  name: "assume_blocked_without_range",
                  type: "bool",
                  description:
                    "Blocked state used when the range estimator returns None.",
                },
              ]}
              constructorErrors={[
                "TypeError for invalid Pose, ArenaMap, NavigationGoal, count, or Boolean argument types.",
                "ValueError for nonpositive grid resolution, negative clearance, invalid sample counts, nonpositive range threshold, or an unknown observed feature.",
              ]}
              properties={[
                {
                  name: "initial_pose",
                  type: "Pose",
                  description: "Assigned starting pose.",
                },
                {
                  name: "arena",
                  type: "ArenaMap",
                  description: "Mission arena.",
                },
                {
                  name: "grid_resolution_mm, clearance_mm",
                  type: "float",
                  units: "mm",
                  description: "Planning-grid dimensions.",
                },
                {
                  name: "destination",
                  type: "NavigationGoal",
                  description: "Delivery goal.",
                },
                {
                  name: "observed_feature_name",
                  type: "str",
                  description: "Feature classified from range measurements.",
                },
                {
                  name: "range_sample_count, minimum_usable_range_count",
                  type: "int",
                  description: "Sampling and acceptance counts.",
                },
                {
                  name: "blocked_range_threshold_mm",
                  type: "float",
                  units: "mm",
                  description: "Blocked/free classification threshold.",
                },
                {
                  name: "assume_blocked_without_range",
                  type: "bool",
                  description: "Fallback blocked state.",
                },
              ]}
            />
            <ClassReference
              name="DeliveryMission"
              signature="DeliveryMission(task: DeliveryTask, navigation: NavigationControllerBase, planner: GridPlannerBase)"
              description="Supplied Challenge 5 sequence: sample the observed feature, update the map, plan a route, and follow its navigation goals."
              state="The mission keeps its task, navigation controller, and planner. result is None before and during run(), then becomes delivered or no_path when run() finishes normally."
              constructorParameters={[
                {
                  name: "task",
                  type: "DeliveryTask",
                  description: "Mission geometry, goal, and sampling settings.",
                },
                {
                  name: "navigation",
                  type: "NavigationControllerBase",
                  description:
                    "Object implementing start(), update(), and is_complete().",
                },
                {
                  name: "planner",
                  type: "GridPlannerBase",
                  description: "Object implementing plan().",
                },
              ]}
              constructorErrors={[
                "TypeError if task is not a DeliveryTask.",
                "TypeError if navigation or planner does not implement the required methods.",
              ]}
              properties={[
                {
                  name: "task",
                  type: "DeliveryTask",
                  description: "Task supplied at construction.",
                },
                {
                  name: "result",
                  type: '"delivered" | "no_path" | None',
                  description:
                    "None before or during run(); otherwise the terminal mission result.",
                },
              ]}
            >
              <ApiMethod
                nested
                name="run"
                signature="run(robot: Robot) -> RobotState"
                summary="Sample range, classify the observed feature, plan a grid path, and follow the resulting goals."
                parameters={[
                  {
                    name: "robot",
                    type: "Robot",
                    description:
                      "Started by this method and stopped before the method returns or raises.",
                  },
                ]}
                returns={{
                  type: "RobotState",
                  description:
                    "Latest state at delivery completion or when no path exists; inspect result to distinguish the outcomes.",
                }}
                errors={[
                  "AttributeError if robot does not provide the required Robot methods.",
                  "RuntimeError if navigation exceeds 30,000 Robot steps.",
                  "Hardware, component, planning, and validation exceptions propagate after robot.stop() is attempted.",
                ]}
              />
            </ClassReference>
            <CodeExample
              title="Run the supplied delivery sequence"
              code={[
                "from challenge import DELIVERY_TASK",
                "from course_setup import (",
                "    make_grid_planner,",
                "    make_navigation_controller,",
                "    make_robot,",
                ")",
                "from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG",
                "from ucsb_xrp import DeliveryMission",
                "",
                "mission = DeliveryMission(",
                "    DELIVERY_TASK,",
                "    make_navigation_controller(NAVIGATION_CONFIG),",
                "    make_grid_planner(),",
                ")",
                "final_state = mission.run(make_robot(ROBOT_CONFIG))",
                "print(mission.result, final_state.pose)",
              ].join("\n")}
            />
          </ReferenceSection>

          <ReferenceSection id="xrpbot" title="Low-level XRP access">
            <p>
              Most projects use <code>Robot</code>. <code>XRPBot</code> is the
              lower-level hardware interface for experiments that intentionally
              need direct sensor or motor access. It applies motor signs,
              converts ultrasonic centimeters to millimeters, bounds motor
              commands, and attempts to stop after an invalid command or failed
              motor write. <code>SensorModel</code>, not <code>XRPBot</code>,
              applies encoder signs.
            </p>
            <ClassReference
              name="XRPBot"
              signature="XRPBot(config: RobotConfig)"
              description="Provides the sensor reads and motor commands used by Robot. A project may also use XRPBot directly when it intentionally needs low-level device access."
              state="The object keeps its RobotConfig and references to the XRP motors, encoders, USER button, and ultrasonic sensor. Encoder positions and motor output belong to those devices rather than to a separate software estimate."
              constructorParameters={[
                {
                  name: "config",
                  type: "RobotConfig",
                  description:
                    "Motor signs and final normalized drive-command limit.",
                },
              ]}
              constructorErrors={[
                "TypeError if config is not a RobotConfig.",
                "An import or hardware exception if XRPLib devices cannot be obtained or the initial zero command fails.",
              ]}
              properties={[
                {
                  name: "config",
                  type: "RobotConfig",
                  description: "Configuration supplied at construction.",
                },
              ]}
            >
              <FunctionReference
                signature="read(include_range: bool = False) -> RawSensors"
                description="Read encoders, device time, USER button, and optionally the ultrasonic sensor."
                parameters={[
                  {
                    name: "include_range",
                    type: "bool",
                    default: "False",
                    description:
                      "True to request an ultrasonic reading in this sample.",
                  },
                ]}
                returns={{
                  type: "RawSensors",
                  description: "One hardware sample.",
                }}
                errors={[
                  "TypeError if include_range is not bool.",
                  "Hardware exceptions from an encoder, button, or requested range read.",
                ]}
              />
              <FunctionReference
                signature="reset_encoders() -> None"
                description="Set both hardware encoder positions to zero."
                returns={{ type: "None", description: "No value is returned." }}
                errors={[
                  "A hardware exception if either encoder cannot be reset.",
                ]}
              />
              <FunctionReference
                signature="wait_for_button() -> None"
                description="Wait until the USER button is pressed and released."
                returns={{
                  type: "None",
                  description: "Returns after release.",
                }}
                errors={["A hardware exception if the button cannot be read."]}
              />
              <FunctionReference
                signature="set_drive(command: DriveCommand) -> None"
                description="Apply bounded normalized left and right motor commands."
                parameters={[
                  {
                    name: "command",
                    type: "DriveCommand",
                    description:
                      "Normalized left and right commands before motor-sign conversion.",
                  },
                ]}
                returns={{ type: "None", description: "No value is returned." }}
                errors={[
                  "TypeError if command is not a DriveCommand.",
                  "ValueError for nonfinite command values.",
                  "A hardware exception if either motor write fails; XRPBot attempts to command zero first.",
                ]}
              />
              <FunctionReference
                signature="set_efforts(efforts: MotorEfforts) -> None"
                description="Compatibility alias for set_drive(); new projects use DriveCommand and set_drive()."
                parameters={[
                  {
                    name: "efforts",
                    type: "MotorEfforts",
                    description: "Compatibility name for a DriveCommand value.",
                  },
                ]}
                returns={{ type: "None", description: "No value is returned." }}
                errors={["The same exceptions as set_drive()."]}
              />
              <FunctionReference
                signature="stop() -> None"
                description="Command zero to both motors."
                returns={{ type: "None", description: "No value is returned." }}
                errors={[
                  "A hardware exception if either zero-command write fails.",
                ]}
              />
              <CodeExample
                title="Bounded direct-motor experiment"
                code={[
                  "from time import sleep_ms",
                  "from robot_config import ROBOT_CONFIG",
                  "from ucsb_xrp import DriveCommand, XRPBot",
                  "",
                  "# Raise and secure the robot before this direct motor test.",
                  "bot = XRPBot(ROBOT_CONFIG)",
                  "try:",
                  "    bot.set_drive(DriveCommand(0.20, 0.20))",
                  "    sleep_ms(250)",
                  "    sample = bot.read()",
                  "finally:",
                  "    bot.stop()",
                ].join("\n")}
              />
            </ClassReference>
          </ReferenceSection>

          <ReferenceSection id="utilities" title="Numerical functions">
            <FunctionReference
              signature="clamp(value: float, lower: float, upper: float) -> float"
              description="Limit a numerical value to an inclusive interval."
              parameters={[
                { name: "value", type: "float", description: "Input value." },
                {
                  name: "lower",
                  type: "float",
                  description: "Inclusive lower limit.",
                },
                {
                  name: "upper",
                  type: "float",
                  description: "Inclusive upper limit.",
                },
              ]}
              returns={{
                type: "float",
                description:
                  "lower below the interval, upper above it, or value inside it.",
              }}
              errors={[
                "TypeError or ValueError for nonfinite numerical arguments.",
                "ValueError if lower is greater than upper.",
              ]}
            />
            <FunctionReference
              signature="elapsed_time_s(later_ms: int, earlier_ms: int) -> float"
              description="Calculate a MicroPython wrap-safe device-time difference."
              parameters={[
                {
                  name: "later_ms",
                  type: "int",
                  units: "ms",
                  description: "Later device timestamp.",
                },
                {
                  name: "earlier_ms",
                  type: "int",
                  units: "ms",
                  description: "Earlier device timestamp.",
                },
              ]}
              returns={{
                type: "float",
                description: "Signed elapsed time in seconds.",
              }}
              errors={["TypeError if either timestamp is not an integer."]}
            />
            <FunctionReference
              signature="wrap_angle_rad(angle_rad: float) -> float"
              description="Map an angle to the course heading interval."
              parameters={[
                {
                  name: "angle_rad",
                  type: "float",
                  units: "rad",
                  description: "Finite input angle.",
                },
              ]}
              returns={{
                type: "float",
                description: "Equivalent angle in [−π, π).",
              }}
              errors={[
                "TypeError or ValueError if angle_rad is not a finite number.",
              ]}
            />
            <FunctionReference
              signature="distance_to_goal(pose: Pose, goal: NavigationGoal) -> float"
              description="Calculate planar distance from a pose to a goal position."
              parameters={[
                { name: "pose", type: "Pose", description: "Current pose." },
                {
                  name: "goal",
                  type: "NavigationGoal",
                  description: "Destination position.",
                },
              ]}
              returns={{
                type: "float",
                description: "Nonnegative distance in millimeters.",
              }}
              errors={[
                "AttributeError if pose or goal does not provide x_mm and y_mm.",
                "TypeError or ValueError if a coordinate is not finite.",
              ]}
            />
            <FunctionReference
              signature="bearing_to_goal(pose: Pose, goal: NavigationGoal) -> float"
              description="Calculate the world-coordinate direction from a pose to a goal."
              parameters={[
                { name: "pose", type: "Pose", description: "Current pose." },
                {
                  name: "goal",
                  type: "NavigationGoal",
                  description: "Destination position.",
                },
              ]}
              returns={{
                type: "float",
                description: "Wrapped bearing in radians.",
              }}
              errors={[
                "AttributeError if pose or goal does not provide x_mm and y_mm.",
                "TypeError or ValueError if a coordinate is not finite.",
              ]}
            />
            <CodeExample
              title="Distance and heading error"
              code={[
                "from ucsb_xrp import (",
                "    NavigationGoal, Pose,",
                "    bearing_to_goal, distance_to_goal, wrap_angle_rad,",
                ")",
                "",
                "pose = Pose(100.0, 50.0, 0.2)",
                "goal = NavigationGoal(600.0, 250.0)",
                "distance_mm = distance_to_goal(pose, goal)",
                "heading_error_rad = wrap_angle_rad(",
                "    bearing_to_goal(pose, goal) - pose.heading_rad",
                ")",
              ].join("\n")}
            />
          </ReferenceSection>
        </main>
      </div>
    </div>
  );
}

function componentSummary(id: string) {
  switch (id) {
    case "sensor-model":
      return "Convert encoder counts and sample time to wheel travel (mm) and wheel speed (mm/s); combine range readings (mm).";
    case "wheel-speed-controller":
      return "Compare target and measured wheel speeds (mm/s); return normalized motor commands.";
    case "differential-drive":
      return "Convert body speed (mm/s) and turn rate (rad/s) to left and right wheel-speed targets.";
    case "odometry":
      return "Integrate measured wheel travel (mm) into estimated world position (mm) and heading (rad).";
    case "navigation-controller":
      return "Use ordered world goals and odometry pose to return body speed (mm/s) and turn rate (rad/s).";
    default:
      return "Use a grid and two cell indices to return a connected free-cell path or None.";
  }
}

function ReferenceSection({
  children,
  id,
  title,
}: {
  children: ReactNode;
  id: string;
  title: string;
}) {
  return (
    <section id={id}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function ComponentSection({
  base,
  children,
  constructor,
  description,
  example,
  file,
  id,
  name,
  state,
}: {
  base: string;
  children: ReactNode;
  constructor: string;
  description: string;
  example: string;
  file: string;
  id: string;
  name: string;
  state: string;
}) {
  return (
    <ReferenceSection id={id} title={name}>
      <div className="class-meta">
        <span>
          Student file <code>{file}</code>
        </span>
        <span>
          Base class <code>{base}</code>
        </span>
      </div>
      <h3>Class declaration</h3>
      <code className="class-signature">
        class {name}({base}):
      </code>
      <p>{description}</p>
      <p>
        <strong>State between calls:</strong> {state}
      </p>
      <h3>Constructor</h3>
      <code className="class-signature">{constructor}</code>
      {name === "GridPlanner" ? (
        <p>
          <code>GridPlanner()</code> takes no arguments.
        </p>
      ) : (
        <p className="exception-line">
          <strong>Raises:</strong> <code>TypeError</code> if <code>config</code>{" "}
          is not the required configuration type.
        </p>
      )}
      {children}
      <CodeExample code={example} title={name + " example"} />
    </ReferenceSection>
  );
}

function ClassReference({
  children,
  constructorErrors,
  constructorParameters = [],
  description,
  name,
  properties = [],
  signature,
  state,
}: {
  children?: ReactNode;
  constructorErrors: string[];
  constructorParameters?: Parameter[];
  description: string;
  name: string;
  properties?: Parameter[];
  signature: string;
  state?: string;
}) {
  return (
    <article className="class-reference">
      <h3>{name}</h3>
      <p>{description}</p>
      {state && (
        <p>
          <strong>State between calls:</strong> {state}
        </p>
      )}
      <h4>Constructor</h4>
      <code className="class-signature">{signature}</code>
      {constructorParameters.length > 0 && (
        <ParameterTable rows={constructorParameters} />
      )}
      <p className="exception-line">
        <strong>Raises:</strong> {constructorErrors.join(" ")}
      </p>
      {properties.length > 0 && (
        <>
          <h4>Read-only properties</h4>
          <ParameterTable rows={properties} />
        </>
      )}
      {children}
    </article>
  );
}

function ApiMethod({
  errors = [],
  name,
  nested = false,
  parameters = [],
  requirements = [],
  returns,
  signature,
  summary,
}: {
  errors?: string[];
  name: string;
  nested?: boolean;
  parameters?: Parameter[];
  requirements?: string[];
  returns: ReturnValue;
  signature: string;
  summary: string;
}) {
  const MethodHeading = nested ? "h4" : "h3";
  const DetailHeading = nested ? "h5" : "h4";

  return (
    <article className="method-reference">
      <MethodHeading>{name}()</MethodHeading>
      <code className="method-signature">{signature}</code>
      <p>{summary}</p>
      {parameters.length > 0 && (
        <>
          <DetailHeading>Parameters</DetailHeading>
          <ParameterTable rows={parameters} />
        </>
      )}
      <DetailHeading>Return value</DetailHeading>
      <p>
        <code>{returns.type}</code> — {returns.description}
      </p>
      {errors.length > 0 && (
        <>
          <DetailHeading>Exceptions</DetailHeading>
          <ul>
            {errors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      )}
      {requirements.length > 0 && (
        <>
          <DetailHeading>Behavior</DetailHeading>
          <ul>
            {requirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
}

function FunctionReference({
  description,
  errors = [],
  parameters = [],
  returns,
  signature,
}: {
  description: string;
  errors?: string[];
  parameters?: Parameter[];
  returns: ReturnValue;
  signature: string;
}) {
  return (
    <article className="function-reference">
      <code className="method-signature">{signature}</code>
      <p>{description}</p>
      {parameters.length > 0 && (
        <>
          <h4>Parameters</h4>
          <ParameterTable rows={parameters} />
        </>
      )}
      <p className="return-line">
        <strong>Returns:</strong> <code>{returns.type}</code> —{" "}
        {returns.description}
      </p>
      {errors.length > 0 && (
        <p className="exception-line">
          <strong>Raises:</strong> {errors.join(" ")}
        </p>
      )}
    </article>
  );
}

function RecordReference({
  exceptions = "TypeError for an argument of the wrong type; ValueError for a nonfinite or out-of-range numerical value.",
  fields,
  name,
  note,
  signature,
}: {
  exceptions?: string;
  fields: Parameter[];
  name: string;
  note?: string;
  signature: string;
}) {
  return (
    <article className="record-reference" id={"record-" + name.toLowerCase()}>
      <h3>{name}</h3>
      <code className="method-signature">{signature}</code>
      <ParameterTable rows={fields} />
      {note && <p>{note}</p>}
      <p className="exception-line">
        <strong>Raises:</strong> {exceptions}
      </p>
    </article>
  );
}

function ParameterTable({ rows }: { rows: Parameter[] }) {
  return (
    <div className="parameter-table" role="table">
      <div className="parameter-head" role="row">
        <span role="columnheader">Parameter or property</span>
        <span role="columnheader">Type</span>
        <span role="columnheader">Default</span>
        <span role="columnheader">Units</span>
        <span role="columnheader">Description</span>
      </div>
      {rows.map((row) => (
        <div className="parameter-row" key={row.name} role="row">
          <code data-label="Name" role="cell">
            {row.name}
          </code>
          <span data-label="Type" role="cell">
            {row.type}
          </span>
          <span data-label="Default" role="cell">
            {row.default ?? "—"}
          </span>
          <span data-label="Units" role="cell">
            {row.units ?? "—"}
          </span>
          <span data-label="Description" role="cell">
            {row.description}
          </span>
        </div>
      ))}
    </div>
  );
}

function PropertyTable({ rows }: { rows: Parameter[] }) {
  return (
    <>
      <h3>Properties</h3>
      <ParameterTable rows={rows} />
    </>
  );
}

function CodeExample({ code, title }: { code: string; title: string }) {
  return (
    <section className="code-example" aria-label={title}>
      <h3>{title}</h3>
      <pre>
        <code>{code}</code>
      </pre>
    </section>
  );
}
