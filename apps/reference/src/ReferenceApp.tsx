import type { ReactNode } from "react";

type Parameter = {
  name: string;
  type: string;
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

const robotConfigFields: Parameter[] = [
  {
    name: "sample_period_ms",
    type: "int",
    units: "ms",
    description: "Time between successive Robot samples; must be at least 1.",
  },
  {
    name: "wheel_diameter_mm",
    type: "float",
    units: "mm",
    description: "Measured wheel diameter; must be positive.",
  },
  {
    name: "encoder_counts_per_revolution",
    type: "float",
    units: "count/rev",
    description: "Encoder counts for one wheel revolution; must be positive.",
  },
  {
    name: "track_width_mm",
    type: "float",
    units: "mm",
    description:
      "Lateral distance between the wheel contact lines; must be positive.",
  },
  {
    name: "left_motor_sign, right_motor_sign",
    type: "int",
    description:
      "+1 or −1, selected so a positive drive command turns that wheel forward.",
  },
  {
    name: "left_encoder_sign, right_encoder_sign",
    type: "int",
    description:
      "+1 or −1, selected so forward wheel motion produces positive travel.",
  },
  {
    name: "left_start_command, right_start_command",
    type: "float",
    description: "Nonnegative command used to overcome motor deadband.",
  },
  {
    name: "left_speed_command_gain, right_speed_command_gain",
    type: "float",
    units: "s/mm",
    description: "Feedforward command per requested wheel speed.",
  },
  {
    name: "wheel_speed_filter_time_constant_ms",
    type: "float",
    units: "ms",
    description:
      "Time constant for the encoder-derived wheel-speed estimate; zero disables smoothing.",
  },
  {
    name: "wheel_speed_kp",
    type: "float",
    units: "s/mm",
    description: "Proportional correction per wheel-speed error.",
  },
  {
    name: "max_drive_command",
    type: "float",
    description: "Final absolute motor-command limit, from 0.0 to 1.0.",
  },
];

export function ReferenceApp() {
  return (
    <div className="reference-app">
      <header className="reference-header">
        <div className="brand" aria-label="UCSBXRP API Reference">
          <span className="brand-mark">UCSB</span>
          <span className="brand-xrp">XRP</span>
          <span aria-hidden="true" className="brand-separator">
            |
          </span>
          <span className="brand-product">API</span>
        </div>
        <nav aria-label="Course applications">
          <a className="tool-link" href="../ide/">
            IDE
          </a>
          <a className="tool-link" href="../monitor/">
            Monitor
          </a>
          <a className="tool-link" href="../guide/">
            Guide
          </a>
        </nav>
      </header>

      <div className="reference-layout">
        <nav className="reference-toc" aria-label="API sections">
          <span>UCSB XRP API</span>
          <a href="#project-loop">Project loop</a>
          <a href="#student-components">Student components</a>
          {components.map(([id, name]) => (
            <a className="toc-child" href={"#" + id} key={id}>
              {name}
            </a>
          ))}
          <a href="#records">Data types</a>
          <a href="#robot">Robot service</a>
          <a href="#live">Live controls and plots</a>
          <a href="#worlds">Project worlds</a>
          <a href="#maps">Maps and routes</a>
          <a href="#configuration">Configuration</a>
          <a href="#missions">Supplied mission services</a>
          <a href="#xrpbot">Low-level XRP access</a>
          <a href="#utilities">Numerical functions</a>
        </nav>

        <main className="reference-content">
          <section className="reference-intro">
            <p className="eyebrow">Student reference</p>
            <h1>UCSB XRP API</h1>
            <p>
              Public Python classes and functions used by UCSBXRP projects.
              Parameter units, return values, errors, and required component
              behavior are stated here. Names beginning with an underscore are
              internal and are not part of the course API.
            </p>
          </section>

          <ReferenceSection id="project-loop" title="Project loop">
            <p>
              <code>main.py</code> selects the task and calls the configured
              services. <code>course_setup.py</code> creates a{" "}
              <code>Robot</code>
              using either supplied or student components. One loop iteration
              proceeds in this order:
            </p>
            <ol className="api-procedure">
              <li>
                <code>DifferentialDrive</code> converts body motion to requested
                wheel speeds.
              </li>
              <li>
                <code>WheelSpeedController</code> compares requested and
                measured wheel speeds and returns a motor command.
              </li>
              <li>
                <code>Robot</code> waits for the next absolute sample time and
                reads the XRP sensors.
              </li>
              <li>
                <code>SensorModel</code> converts encoder counts and time into
                wheel distances, increments, and regularized speeds.
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
              Use millimetres for distance and range, mm/s for linear speed,
              milliseconds for device time, seconds for elapsed calculation
              time, radians for angles, and rad/s for turn rate. Positive
              heading and turn rate are counterclockwise.{" "}
              <code>Robot.step()</code> maintains the configured sample period;
              do not add a sleep call inside the measured loop.
            </p>
          </ReferenceSection>

          <ReferenceSection id="student-components" title="Student components">
            <p>
              Each challenge identifies the components students implement. A
              student class extends the matching base class below, passes the
              project&apos;s component checks, and is selected in{" "}
              <code>course_setup.py</code>. The base classes define the public
              interface; they do not prescribe an internal algorithm.
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
            description="Converts raw encoder, time, range, and USER-button readings into physical measurements. Wheel travel and increments remain exact encoder conversions; wheel speed is regularized to avoid presenting quantized tick-to-tick changes as a physical speed jump."
            state="After reset(), the component keeps the encoder and time origins, the previous sample, total wheel positions, and any state used by its wheel-speed estimator."
            constructor="SensorModel(config: RobotConfig)"
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
                  description:
                    "First hardware sample after the encoders have been reset.",
                },
              ]}
              returns={{
                type: "Measurements",
                description:
                  "A zero-travel measurement at raw.time_ms that preserves range_mm and button_pressed.",
              }}
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
                  description:
                    "Next chronological encoder, time, range, and button sample.",
                },
              ]}
              returns={{
                type: "Measurements",
                description:
                  "Total wheel positions, exact latest increments, regularized wheel speeds, elapsed time, range, and button state.",
              }}
              errors={[
                "RuntimeError if reset() has not been called.",
                "ValueError if device time has not advanced.",
              ]}
              requirements={[
                "Apply the configured encoder signs and counts-per-revolution conversion.",
                "Do not smooth left_increment_mm or right_increment_mm; odometry requires the measured travel increment.",
                "Use wheel_speed_filter_time_constant_ms to regularize the speed estimate.",
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
                  "Median usable range in millimetres, or None when fewer than minimum_usable readings remain.",
              }}
            />
          </ComponentSection>

          <ComponentSection
            id="wheel-speed-controller"
            name="WheelSpeedController"
            file="wheel_speed_controller.py"
            base="WheelSpeedControllerBase"
            description="Converts requested and measured left/right wheel speeds into bounded motor commands. Robot calls it once per sample before writing to the motors."
            state="An implementation may keep controller memory between samples. reset() must return that state to its initial condition before every run."
            constructor="WheelSpeedController(config: RobotConfig)"
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
                    "Regularized wheel speeds reported by SensorModel.",
                },
              ]}
              returns={{
                type: "DriveCommand",
                description:
                  "Left and right commands within ±config.max_drive_command.",
              }}
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
              summary="Calculate the two wheel speeds that produce the requested body motion."
              parameters={[
                {
                  name: "command",
                  type: "MotionCommand",
                  description:
                    "Forward speed v and counterclockwise turn rate ω.",
                },
              ]}
              returns={{
                type: "WheelSpeeds",
                description:
                  "left = v − ωb/2 and right = v + ωb/2, where b is config.track_width_mm.",
              }}
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
                  description:
                    "Known or assigned starting pose in world coordinates.",
                },
              ]}
              returns={{
                type: "Pose",
                description: "The stored starting pose.",
              }}
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
              errors={["RuntimeError if reset() has not been called."]}
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
            description="Generates body-motion commands that visit an ordered sequence of world-coordinate goals. A goal may require position only or position followed by a final heading."
            state="The component keeps the goal sequence, the active goal, and any turn, drive, or alignment mode used by the implementation."
            constructor="NavigationController(config: NavigationConfig)"
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
              summary="Load a nonempty ordered goal sequence and select its first goal."
              parameters={[
                {
                  name: "goals",
                  type: "list | tuple of NavigationGoal",
                  description: "World-coordinate goals in visit order.",
                },
              ]}
              returns={{ type: "None", description: "No value is returned." }}
              errors={[
                "ValueError for an empty sequence.",
                "TypeError if a member is not a NavigationGoal.",
              ]}
            />
            <ApiMethod
              name="update"
              signature="update(pose: Pose) -> MotionCommand"
              summary="Calculate the body-motion request for the active goal."
              parameters={[
                {
                  name: "pose",
                  type: "Pose",
                  description: "Latest odometry estimate.",
                },
              ]}
              returns={{
                type: "MotionCommand",
                description:
                  "Forward speed and turn rate for the next Robot step; STOP_COMMAND after completion.",
              }}
              errors={["RuntimeError if start() has not been called."]}
              requirements={[
                "Visit goals in the supplied order.",
                "For heading_rad=None, complete the goal using position only.",
                "For a numerical heading, reach position and then satisfy the heading tolerance.",
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
            description="Finds a shortest route through free horizontal and vertical neighbors in an occupancy grid. Planning occurs before the robot follows the resulting route."
            state="Search data such as the frontier, visited cells, and predecessors can be local variables inside plan(); no information need be retained after the method returns."
            constructor="GridPlanner()"
          >
            <ApiMethod
              name="plan"
              signature="plan(grid: OccupancyGrid, start: GridCell | None, goal: GridCell | None) -> GridPath | None"
              summary="Find a shortest valid four-neighbor path from start to goal."
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
                  description:
                    "Starting cell; None means the world position was outside the grid.",
                },
                {
                  name: "goal",
                  type: "GridCell | None",
                  description:
                    "Destination cell; None means the world position was outside the grid.",
                },
              ]}
              returns={{
                type: "GridPath | None",
                description:
                  "A shortest path including both endpoints, or None for missing, blocked, or unreachable endpoints.",
              }}
              requirements={[
                "Use only free horizontal or vertical neighbors.",
                "The choice among equally short paths is not specified.",
              ]}
            />
          </ComponentSection>

          <ReferenceSection id="records" title="Data types">
            <p>
              These immutable records validate constructor values and expose
              read-only properties with the same names. Unless noted otherwise,
              numerical inputs must be finite.
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
                  description: "Regularized wheel-speed estimates.",
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
                  units: "rad",
                  description:
                    "Required final heading, or None for a position-only goal.",
                },
              ]}
            />
            <RecordReference
              name="GridCell"
              signature="GridCell(column, row)"
              fields={[
                {
                  name: "column, row",
                  type: "int",
                  description: "Integer occupancy-grid coordinates.",
                },
              ]}
            />
            <RecordReference
              name="GridPath"
              signature="GridPath(cells)"
              fields={[
                {
                  name: "cells",
                  type: "tuple[GridCell, ...]",
                  description:
                    "Nonempty ordered cells; each successive pair must share an edge.",
                },
              ]}
              note="to_goals(grid, final_heading_rad=None) returns a compact tuple of NavigationGoal values at turns and the final cell."
            />
          </ReferenceSection>

          <ReferenceSection id="robot" title="Robot service">
            <p>
              Projects normally call <code>make_robot(ROBOT_CONFIG)</code> from
              <code>course_setup.py</code>. Direct construction is reserved for
              library assembly and tests.
            </p>
            <PropertyTable
              rows={[
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
                  description:
                    "Milliseconds by which the most recent calculation exceeded its sample deadline; zero when it finished on time.",
                },
              ]}
            />
            <ApiMethod
              name="start"
              signature="start(initial_pose: Pose) -> RobotState"
              summary="Reset the encoders and selected components, establish the initial pose, and publish the first state."
              parameters={[
                {
                  name: "initial_pose",
                  type: "Pose",
                  description: "Assigned pose at the start of the run.",
                },
              ]}
              returns={{
                type: "RobotState",
                description: "Zero-travel measurements and the initial pose.",
              }}
              errors={["TypeError if initial_pose is not a Pose."]}
              requirements={[
                "An IDE-managed Run starts immediately; a direct standalone launch waits for the XRP USER button.",
              ]}
            />
            <ApiMethod
              name="step"
              signature="step(command: MotionCommand, read_range: bool = False) -> RobotState"
              summary="Execute one timed control and measurement cycle."
              parameters={[
                {
                  name: "command",
                  type: "MotionCommand",
                  description: "Requested robot-body motion for this sample.",
                },
                {
                  name: "read_range",
                  type: "bool",
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
                "Any component exception is re-raised after Robot attempts to stop the motors.",
              ]}
            />
            <ApiMethod
              name="estimate_range"
              signature="estimate_range(samples, minimum_usable: int) -> float | None"
              summary="Apply the selected SensorModel range estimator."
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
                  description: "Minimum accepted reading count.",
                },
              ]}
              returns={{
                type: "float | None",
                description: "Estimated range or None.",
              }}
            />
            <ApiMethod
              name="stop"
              signature="stop() -> None"
              summary="Command zero drive and publish the stopped command."
              returns={{ type: "None", description: "No value is returned." }}
            />
          </ReferenceSection>

          <ReferenceSection
            id="live"
            title="Live controls, watch values, and plots"
          >
            <p>
              Declare controls once, normally near the top of{" "}
              <code>main.py</code>, then read each returned parameter&apos;s{" "}
              <code>.value</code> in the loop. The Monitor stages edits and{" "}
              <code>Robot.step()</code>
              applies them together at the next sample boundary. A project may
              declare at most 16 controls, 16 watch values, and 16 plot values.
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
                  description: "Unique Python identifier used by the runtime.",
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
                  description: "Optional concise unit shown in the Monitor.",
                },
                {
                  name: "label",
                  type: "str | None",
                  description:
                    "Displayed label; derived from name when omitted.",
                },
              ]}
              returns={{
                type: "LiveParameter",
                description: "Parameter with a numerical .value property.",
              }}
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
                  description: "Displayed label.",
                },
              ]}
              returns={{
                type: "LiveParameter",
                description: "Parameter with a Boolean .value property.",
              }}
            />
            <FunctionReference
              signature="live.choice(name, default, options, label=None) -> LiveParameter"
              description="Create a compact choice among two to six strings."
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
                  description: "Displayed label.",
                },
              ]}
              returns={{
                type: "LiveParameter",
                description: "Parameter whose .value is the selected string.",
              }}
            />
            <FunctionReference
              signature={'live.watch(name, value, unit="", label=None) -> None'}
              description="Publish the latest number, Boolean, or short text value in Live telemetry. Calling it again with the same name updates that row."
              returns={{
                type: "None",
                description:
                  "The value is staged for the next telemetry publication.",
              }}
            />
            <FunctionReference
              signature={'live.plot(name, value, unit="", label=None) -> None'}
              description="Publish a finite numerical value as an optional strip-plot signal. Its unchecked green signal choice appears in Monitor Controls."
              returns={{
                type: "None",
                description:
                  "The value is staged for the next telemetry publication.",
              }}
            />
            <FunctionReference
              signature="live.apply_updates() -> bool"
              description="Apply pending control values. Robot.step() calls this automatically."
              returns={{
                type: "bool",
                description: "True when at least one value changed.",
              }}
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
                  description:
                    "JSON file path; defaults to the current project world.json.",
                },
                {
                  name: "world_id",
                  type: "str | None",
                  description: "Requested id, or None to use default_world.",
                },
              ]}
              returns={{
                type: "ProjectWorld",
                description: "Validated selected world.",
              }}
            />
            <PropertyTable
              rows={[
                {
                  name: "ProjectWorld.id",
                  type: "str",
                  description: "Stable world identifier.",
                },
                {
                  name: "ProjectWorld.label",
                  type: "str",
                  description: "Student-facing selector label.",
                },
                {
                  name: "ProjectWorld.bounds_mm",
                  type: "tuple[float, float, float, float]",
                  description:
                    "Minimum x, minimum y, maximum x, maximum y in millimetres.",
                },
                {
                  name: "ProjectWorld.initial_pose",
                  type: "Pose",
                  description: "Starting pose declared by the world.",
                },
                {
                  name: "ProjectWorld.feature_names",
                  type: "tuple[str, ...]",
                  description:
                    "Named obstacles whose blocked state can change.",
                },
              ]}
            />
            <ApiMethod
              name="arena_map"
              signature="arena_map(blocked_features=()) -> ArenaMap"
              summary="Build map geometry from the world, optionally marking named features as blocked."
              returns={{
                type: "ArenaMap",
                description: "Immutable arena used by occupancy-grid planning.",
              }}
            />
            <ApiMethod
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
                "ValueError if the name is not a waypoint in this world.",
              ]}
            />
            <ApiMethod
              name="waypoints"
              signature="waypoints() -> tuple[NavigationGoal, ...]"
              summary="Read every waypoint marker in file order."
              returns={{
                type: "tuple[NavigationGoal, ...]",
                description: "All declared waypoint goals.",
              }}
            />
          </ReferenceSection>

          <ReferenceSection id="maps" title="Maps and routes">
            <ClassCompact
              name="Rectangle"
              signature="Rectangle(minimum_x_mm, minimum_y_mm, maximum_x_mm, maximum_y_mm)"
              description="Closed axis-aligned bounds in millimetres. Maximum coordinates must exceed minimum coordinates."
              methods="bounds_mm; contains(x_mm, y_mm, margin_mm=0.0) -> bool"
            />
            <ClassCompact
              name="ArenaMap"
              signature="ArenaMap(bounds_mm, obstacles=(), features=None, blocked_features=())"
              description="Immutable arena boundary, fixed rectangular obstacles, and named features whose blocked state may change."
              methods="bounds_mm; obstacles; feature_names; blocked_features; feature_bounds(name); contains(x_mm, y_mm); is_free(x_mm, y_mm, clearance_mm=0.0); with_feature_blocked(name, blocked) -> ArenaMap"
            />
            <ClassCompact
              name="OccupancyGrid"
              signature="OccupancyGrid.from_arena(arena, resolution_mm, clearance_mm=0.0) -> OccupancyGrid"
              description="Uniform free/blocked samples of an ArenaMap. resolution_mm is the cell size; clearance_mm expands boundaries and obstacles for the robot footprint."
              methods="resolution_mm; origin_x_mm; origin_y_mm; column_count; row_count; world_to_cell(x_mm, y_mm) -> GridCell | None; cell_center(cell) -> tuple[float, float]; contains(cell) -> bool; is_blocked(cell) -> bool; neighbors(cell) -> tuple[GridCell, ...]"
            />
          </ReferenceSection>

          <ReferenceSection id="configuration" title="Configuration">
            <h3 className="api-class-title">RobotConfig</h3>
            <code className="class-signature">RobotConfig(...)</code>
            <p>
              Immutable robot geometry, signs, calibration, sample timing,
              wheel-speed estimation, feedback gain, and command limit. Define
              it in <code>robot_config.py</code>. Constructor defaults represent
              an uncalibrated standard XRP and should be measured or selected
              for the project.
            </p>
            <ParameterTable rows={robotConfigFields} />
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
          </ReferenceSection>

          <ReferenceSection id="missions" title="Supplied mission services">
            <ClassCompact
              name="StraightLineController"
              signature="StraightLineController(config: NavigationConfig)"
              description="Challenge 1 service that advances through one nonnegative straight-line distance using measured mean wheel position."
              methods="start(measurements, distance_mm) -> None; update(measurements) -> MotionCommand; is_complete() -> bool"
            />
            <ClassCompact
              name="DeliveryTask"
              signature="DeliveryTask(initial_pose, arena, grid_resolution_mm, clearance_mm, destination, observed_feature_name, range_sample_count, minimum_usable_range_count, blocked_range_threshold_mm, assume_blocked_without_range)"
              description="Immutable Challenge 5 task definition: starting pose, map, grid settings, destination, observed feature, and ultrasonic decision settings."
              methods="Read-only properties use the constructor names."
            />
            <ClassCompact
              name="DeliveryMission"
              signature="DeliveryMission(task: DeliveryTask, navigation: NavigationControllerBase, planner: GridPlannerBase)"
              description="Supplied Challenge 5 sequence: sample the observed feature, update the map, plan a route, and follow its navigation goals."
              methods="run(robot: Robot) -> str; result -> 'delivered' | 'no_path' | None"
            />
          </ReferenceSection>

          <ReferenceSection id="xrpbot" title="Low-level XRP access">
            <p>
              Most projects use <code>Robot</code>. <code>XRPBot</code> is the
              lower-level hardware interface for experiments that intentionally
              need direct sensor or motor access. It applies motor and encoder
              signs, converts ultrasonic centimetres to millimetres, bounds
              motor commands, and attempts to stop after an invalid motor write.
            </p>
            <code className="class-signature">XRPBot(config: RobotConfig)</code>
            <FunctionReference
              signature="read(include_range=False) -> RawSensors"
              description="Read encoders, device time, USER button, and optionally the ultrasonic sensor."
              returns={{
                type: "RawSensors",
                description: "One hardware sample.",
              }}
            />
            <FunctionReference
              signature="reset_encoders() -> None"
              description="Set both hardware encoder positions to zero."
              returns={{ type: "None", description: "No value is returned." }}
            />
            <FunctionReference
              signature="wait_for_button() -> None"
              description="Wait until the USER button is pressed and released."
              returns={{ type: "None", description: "Returns after release." }}
            />
            <FunctionReference
              signature="set_drive(command: DriveCommand) -> None"
              description="Apply bounded normalized left and right motor commands."
              returns={{ type: "None", description: "No value is returned." }}
            />
            <FunctionReference
              signature="stop() -> None"
              description="Command zero to both motors."
              returns={{ type: "None", description: "No value is returned." }}
            />
          </ReferenceSection>

          <ReferenceSection id="utilities" title="Numerical functions">
            <FunctionTable
              rows={[
                [
                  "clamp(value: float, lower: float, upper: float) -> float",
                  "Return value limited to the inclusive interval [lower, upper]. Raises ValueError when lower exceeds upper.",
                ],
                [
                  "elapsed_time_s(later_ms: int, earlier_ms: int) -> float",
                  "Return the wrap-safe MicroPython device-time difference in seconds.",
                ],
                [
                  "wrap_angle_rad(angle_rad: float) -> float",
                  "Return the equivalent finite angle in [−π, π).",
                ],
                [
                  "distance_to_goal(pose: Pose, goal: NavigationGoal) -> float",
                  "Return planar distance from pose to goal in millimetres.",
                ],
                [
                  "bearing_to_goal(pose: Pose, goal: NavigationGoal) -> float",
                  "Return the wrapped world-frame bearing from pose to goal in radians.",
                ],
              ]}
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
      return "Raw sensors to wheel motion, regularized speed, and range";
    case "wheel-speed-controller":
      return "Requested and measured wheel speed to motor command";
    case "differential-drive":
      return "Body forward speed and turn rate to left/right wheel speed";
    case "odometry":
      return "Measured wheel increments to estimated pose";
    case "navigation-controller":
      return "Ordered world goals to body-motion commands";
    default:
      return "Occupancy grid to a shortest free-cell route";
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
  file,
  id,
  name,
  state,
}: {
  base: string;
  children: ReactNode;
  constructor: string;
  description: string;
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
      <p>{description}</p>
      <p>
        <strong>State between calls:</strong> {state}
      </p>
      <h3>Constructor</h3>
      <code className="class-signature">{constructor}</code>
      {children}
    </ReferenceSection>
  );
}

function ApiMethod({
  errors = [],
  name,
  parameters = [],
  requirements = [],
  returns,
  signature,
  summary,
}: {
  errors?: string[];
  name: string;
  parameters?: Parameter[];
  requirements?: string[];
  returns: ReturnValue;
  signature: string;
  summary: string;
}) {
  return (
    <article className="method-reference">
      <h3>{name}()</h3>
      <code className="method-signature">{signature}</code>
      <p>{summary}</p>
      {parameters.length > 0 && (
        <>
          <h4>Parameters</h4>
          <ParameterTable rows={parameters} />
        </>
      )}
      <h4>Return value</h4>
      <p>
        <code>{returns.type}</code> — {returns.description}
      </p>
      {errors.length > 0 && (
        <>
          <h4>Exceptions</h4>
          <ul>
            {errors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      )}
      {requirements.length > 0 && (
        <>
          <h4>Required behavior</h4>
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
  parameters = [],
  returns,
  signature,
}: {
  description: string;
  parameters?: Parameter[];
  returns: ReturnValue;
  signature: string;
}) {
  return (
    <article className="function-reference">
      <code className="method-signature">{signature}</code>
      <p>{description}</p>
      {parameters.length > 0 && <ParameterTable rows={parameters} />}
      <p className="return-line">
        <strong>Returns:</strong> <code>{returns.type}</code> —{" "}
        {returns.description}
      </p>
    </article>
  );
}

function RecordReference({
  fields,
  name,
  note,
  signature,
}: {
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
    </article>
  );
}

function ClassCompact({
  description,
  methods,
  name,
  signature,
}: {
  description: string;
  methods: string;
  name: string;
  signature: string;
}) {
  return (
    <article className="class-compact">
      <h3>{name}</h3>
      <code className="method-signature">{signature}</code>
      <p>{description}</p>
      <p>
        <strong>Public properties and methods:</strong> <code>{methods}</code>
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
        <span role="columnheader">Units</span>
        <span role="columnheader">Description</span>
      </div>
      {rows.map((row) => (
        <div className="parameter-row" key={row.name} role="row">
          <code role="cell">{row.name}</code>
          <span role="cell">{row.type}</span>
          <span role="cell">{row.units ?? "—"}</span>
          <span role="cell">{row.description}</span>
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

function FunctionTable({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="function-table">
      {rows.map(([signature, description]) => (
        <div key={signature}>
          <code>{signature}</code>
          <p>{description}</p>
        </div>
      ))}
    </div>
  );
}
