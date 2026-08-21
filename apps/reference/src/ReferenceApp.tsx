import type { ReactNode } from "react";

type ComponentEntry = {
  id: string;
  title: string;
  base: string;
  file: string;
  owns: string;
  receives: string;
  state: string;
  returns: string;
  usedBy: string;
  methods: Array<{ signature: string; detail: string }>;
};

const components: ComponentEntry[] = [
  {
    id: "sensor-model",
    title: "SensorModel",
    base: "SensorModelBase",
    file: "sensor_model.py",
    owns: "Conversion of raw encoder counts into signed wheel travel, wheel increments, and regularized wheel-speed estimates; robust combination of ultrasound samples.",
    receives:
      "RawSensors records from XRPBot and RobotConfig geometry, encoder signs, and wheel-speed filter setting.",
    state:
      "Encoder origins, previous counts and time, and the current left/right wheel-speed estimates. reset() establishes all state for a new run.",
    returns:
      "Measurements containing exact wheel travel and increments, regularized speed estimates, range, and USER-button state.",
    usedBy:
      "Robot calls it after each hardware read. WheelSpeedController uses Measurements.wheel_speeds; Odometry uses the wheel increments; main.py may use wheel travel, range, and button state.",
    methods: [
      {
        signature: "reset(raw: RawSensors) -> Measurements",
        detail:
          "Establish encoder and time origins. Return zero wheel travel and speed while preserving the current time, range, and button state.",
      },
      {
        signature: "update(raw: RawSensors) -> Measurements",
        detail:
          "After reset(), convert the next raw sample into total wheel positions, latest wheel increments, and time-aware regularized wheel speeds.",
      },
      {
        signature:
          "estimate_range(samples, minimum_usable: int) -> float | None",
        detail:
          "Reject missing, nonfinite, and nonpositive samples. Return the median when enough usable samples remain; otherwise return None.",
      },
    ],
  },
  {
    id: "wheel-speed-controller",
    title: "WheelSpeedController",
    base: "WheelSpeedControllerBase",
    file: "wheel_speed_controller.py",
    owns: "Conversion of requested and measured wheel speed into bounded left/right motor commands.",
    receives:
      "Target WheelSpeeds from DifferentialDrive, measured WheelSpeeds from SensorModel, and calibration/controller values from RobotConfig.",
    state:
      "Any controller memory chosen by the implementation, such as integral or filtered error. The supplied proportional controller requires no persistent error state.",
    returns:
      "DriveCommand values in the normalized interval −1 to +1. A zero target produces an exact zero command for that wheel.",
    usedBy:
      "Robot calls update() before every sample and passes the result to XRPBot. The Monitor plots target and measured speeds and the resulting drive command.",
    methods: [
      {
        signature: "reset() -> None",
        detail: "Clear controller state before a run.",
      },
      {
        signature:
          "update(target: WheelSpeeds, measured: WheelSpeeds) -> DriveCommand",
        detail:
          "Calculate a bounded command from the requested and measured speed of each wheel.",
      },
    ],
  },
  {
    id: "differential-drive",
    title: "DifferentialDrive",
    base: "DifferentialDriveBase",
    file: "differential_drive.py",
    owns: "Inverse kinematics from body forward speed and yaw rate to left/right wheel-speed targets.",
    receives: "MotionCommand and RobotConfig.track_width_mm.",
    state:
      "No time history is required; each calculation depends on its input command and robot geometry.",
    returns: "Target WheelSpeeds in millimetres per second.",
    usedBy:
      "Robot calls it first in each step. WheelSpeedController consumes its output.",
    methods: [
      {
        signature: "wheel_speeds(command: MotionCommand) -> WheelSpeeds",
        detail:
          "Apply the course sign convention and differential-drive inverse kinematics.",
      },
    ],
  },
  {
    id: "odometry",
    title: "Odometry",
    base: "OdometryBase",
    file: "odometry.py",
    owns: "Integration of measured left/right wheel-distance increments into the robot's planar pose estimate.",
    receives:
      "An initial Pose, wheel-distance increments from SensorModel, and RobotConfig.track_width_mm.",
    state: "The latest estimated Pose. reset() establishes it for a new run.",
    returns: "The updated Pose after each differential-drive motion increment.",
    usedBy:
      "Robot publishes the pose in RobotState. NavigationController and main.py use it; the Monitor shows it as odometry. Simulator ground truth is not an input.",
    methods: [
      {
        signature: "reset(initial_pose: Pose) -> Pose",
        detail: "Set and return the pose at the beginning of a run.",
      },
      {
        signature:
          "update(left_increment_mm: float, right_increment_mm: float) -> Pose",
        detail:
          "Integrate one straight or curved differential-drive increment and return the new pose.",
      },
      {
        signature: "pose: Pose",
        detail: "Latest pose; available after reset().",
      },
    ],
  },
  {
    id: "navigation-controller",
    title: "NavigationController",
    base: "NavigationControllerBase",
    file: "navigation_controller.py",
    owns: "Progress through an ordered sequence of world-frame position and optional heading goals.",
    receives:
      "NavigationGoal values, the latest odometry Pose, and NavigationConfig speeds and tolerances.",
    state:
      "The ordered goals, active goal index, and any implementation mode such as turn, drive, or final alignment.",
    returns:
      "A body MotionCommand for the next Robot step, or STOP_COMMAND when complete.",
    usedBy:
      "main.py or DeliveryMission calls update(); Robot receives the returned MotionCommand.",
    methods: [
      {
        signature: "start(goals) -> None",
        detail:
          "Store an ordered tuple or list of NavigationGoal values and begin at the first goal.",
      },
      {
        signature: "update(pose: Pose) -> MotionCommand",
        detail:
          "Return the next bounded body-motion request from the latest pose.",
      },
      {
        signature: "current_goal() -> NavigationGoal | None",
        detail: "Return the active goal, or None after completion.",
      },
      {
        signature: "is_complete() -> bool",
        detail:
          "Report whether all required positions and final headings have been reached.",
      },
    ],
  },
  {
    id: "grid-planner",
    title: "GridPlanner",
    base: "GridPlannerBase",
    file: "grid_planner.py",
    owns: "Shortest-path search through free four-neighbor occupancy-grid cells.",
    receives: "OccupancyGrid plus start and goal GridCell values.",
    state:
      "Search-local frontier, visited, and predecessor data. Persistent state between plan() calls is not required.",
    returns:
      "A shortest GridPath including both endpoints, or None for missing, blocked, or unreachable endpoints.",
    usedBy:
      "DeliveryMission or main.py converts the path into NavigationGoal values for NavigationController.",
    methods: [
      {
        signature:
          "plan(grid: OccupancyGrid, start: GridCell, goal: GridCell) -> GridPath | None",
        detail:
          "Find a shortest valid four-neighbor route. The API does not prescribe the frontier structure or tie-breaking rule.",
      },
    ],
  },
];

const flowDiagram = [
  "main.py: task and stop condition",
  "   │ MotionCommand",
  "   ▼",
  "DifferentialDrive → WheelSpeedController → XRP motors",
  "                                           │",
  "   Pose ← Odometry ← Measurements ← SensorModel ← encoders / range",
  "   │",
  "   └──────────── next task or navigation command ────────────┘",
].join("\n");

const liveExample = [
  "from ucsb_xrp import live",
  "",
  "SPEED = live.number(",
  '    "forward_speed_mm_s", 100.0,',
  "    minimum=50.0, maximum=200.0, step=10.0,",
  '    unit="mm/s", label="Forward speed",',
  ")",
  'ENABLED = live.toggle("enabled", True, label="Controller enabled")',
  "MODE = live.choice(",
  '    "mode", "normal", options=("normal", "careful"),',
  '    label="Drive mode",',
  ")",
  "",
  'live.watch("speed_error", 12.5, unit="mm/s", label="Speed error")',
].join("\n");

const robotConfigExample = [
  "RobotConfig(",
  "    sample_period_ms=20,",
  "    wheel_diameter_mm=60.0,",
  "    encoder_counts_per_revolution=585.0,",
  "    track_width_mm=155.0,",
  "    left_motor_sign=1, right_motor_sign=1,",
  "    left_encoder_sign=1, right_encoder_sign=1,",
  "    left_start_command=0.0, right_start_command=0.0,",
  "    left_speed_command_gain=0.0,",
  "    right_speed_command_gain=0.0,",
  "    wheel_speed_filter_time_constant_ms=80.0,",
  "    wheel_speed_kp=0.0,",
  "    max_drive_command=1.0,",
  ")",
].join("\n");

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
          <a href="#working-loop">Working loop</a>
          <a href="#student-components">Student components</a>
          {components.map((component) => (
            <a
              className="toc-child"
              href={"#" + component.id}
              key={component.id}
            >
              {component.title}
            </a>
          ))}
          <a href="#records">Data values</a>
          <a href="#robot">Robot service</a>
          <a href="#live">Live controls</a>
          <a href="#maps">Maps and missions</a>
          <a href="#configuration">Configuration</a>
          <a href="#xrpbot">Low-level XRP</a>
          <a href="#utilities">Numerical helpers</a>
        </nav>

        <main className="reference-content">
          <section className="reference-intro">
            <p className="eyebrow">Student reference</p>
            <h1>UCSB XRP API</h1>
            <p>
              Public Python classes, methods, responsibilities, state, and units
              for course projects. The supplied component implementations are
              readable examples; their internal algorithms are not required
              unless a challenge states otherwise.
            </p>
          </section>

          <ReferenceSection id="working-loop" title="The measured working loop">
            <p>
              <code>main.py</code> is mission control. It obtains configured
              components from <code>course_setup.py</code>, calls{" "}
              <code>robot.start()</code>, sends one <code>MotionCommand</code>{" "}
              through <code>robot.step()</code> per sample, and always calls{" "}
              <code>robot.stop()</code> in <code>finally</code>.{" "}
              <code>Robot.step()</code> maintains the sample period; do not add{" "}
              <code>sleep_ms()</code> inside that loop.
            </p>
            <pre className="flow-code" aria-label="Course control flow">
              {flowDiagram}
            </pre>
            <p>
              Distances and wheel travel use millimetres; speed uses mm/s;
              device time uses integer milliseconds; elapsed calculation time
              uses seconds; angles use radians; yaw rate uses rad/s. Positive
              heading and yaw are counterclockwise.
            </p>
          </ReferenceSection>

          <ReferenceSection
            id="student-components"
            title="Components students implement"
          >
            <p>
              Each challenge initially uses supplied components. Implement one
              named student file, run <strong>Test components</strong>, then
              select it with the corresponding <code>USE_STUDENT_*</code>{" "}
              setting in <code>course_setup.py</code>.
            </p>
            <div
              className="responsibility-table"
              role="table"
              aria-label="Component responsibility summary"
            >
              <div className="responsibility-head" role="row">
                <span role="columnheader">Component</span>
                <span role="columnheader">Owns</span>
                <span role="columnheader">Primary output</span>
              </div>
              {components.map((component) => (
                <a
                  className="responsibility-row"
                  href={"#" + component.id}
                  key={component.id}
                  role="row"
                >
                  <strong role="cell">{component.title}</strong>
                  <span role="cell">{component.owns}</span>
                  <span role="cell">{component.returns}</span>
                </a>
              ))}
            </div>
          </ReferenceSection>

          {components.map((component) => (
            <ComponentReference component={component} key={component.id} />
          ))}

          <ReferenceSection
            id="records"
            title="Data values passed between components"
          >
            <p>
              These immutable records validate constructor inputs and expose
              same-named read-only properties.
            </p>
            <ApiTable
              rows={[
                [
                  "RawSensors(time_ms, left_encoder_count, right_encoder_count, range_mm, button_pressed)",
                  "Hardware sample. range_mm is None when no usable range was requested or returned.",
                ],
                [
                  "Measurements(time_ms, dt_s, left_position_mm, right_position_mm, left_increment_mm, right_increment_mm, left_speed_mm_s, right_speed_mm_s, range_mm, button_pressed)",
                  "SensorModel output. .wheel_speeds returns the two regularized speed estimates as WheelSpeeds.",
                ],
                [
                  "WheelSpeeds(left_mm_s, right_mm_s)",
                  "Named left/right wheel speeds.",
                ],
                [
                  "MotionCommand(forward_speed_mm_s, turn_rate_rad_s)",
                  "Requested robot-body forward speed and yaw rate.",
                ],
                [
                  "DriveCommand(left, right)",
                  "Normalized motor command; each value is within −1 to +1.",
                ],
                [
                  "Pose(x_mm, y_mm, heading_rad)",
                  "Planar position and wrapped heading in [−π, π).",
                ],
                [
                  "RobotState(measurements, pose)",
                  "Latest measured state returned by Robot.start() and Robot.step().",
                ],
                [
                  "NavigationGoal(x_mm, y_mm, heading_rad=None)",
                  "World goal. None means position only; a numerical heading must also be reached.",
                ],
                ["GridCell(column, row)", "Integer occupancy-grid coordinate."],
                [
                  "GridPath(cells)",
                  "Tuple of adjacent GridCell values. .to_goals(grid, final_heading_rad=None) creates compact navigation goals.",
                ],
                ["STOP_COMMAND", "Shared MotionCommand(0.0, 0.0)."],
              ]}
            />
          </ReferenceSection>

          <ReferenceSection
            id="robot"
            title="Robot and supplied motion services"
          >
            <p>
              Projects normally call <code>make_robot(ROBOT_CONFIG)</code>{" "}
              rather than constructing <code>Robot</code> directly.
            </p>
            <Signature signature="robot.start(initial_pose: Pose) -> RobotState">
              Reset encoders and components, establish the initial pose, and
              publish the first state. An IDE-managed run starts immediately; a
              direct standalone run waits for USER.
            </Signature>
            <Signature signature="robot.step(command: MotionCommand, read_range=False) -> RobotState">
              Run one command, wheel-control, timed sensor-read, measurement,
              odometry, telemetry, and live-update cycle. A component exception
              causes a motor-stop attempt before it is re-raised.
            </Signature>
            <Signature signature="robot.estimate_range(samples, minimum_usable) -> float | None">
              Use the selected SensorModel range estimator.
            </Signature>
            <Signature signature="robot.stop() -> None">
              Stop both motors and publish a zero drive command.
            </Signature>
            <Signature signature="robot.state / robot.config / robot.last_overrun_ms">
              Latest RobotState, immutable RobotConfig, and most recent sample
              deadline overrun.
            </Signature>
            <h3>StraightLineController</h3>
            <p>
              The supplied Challenge 1 service owns progress through one
              nonnegative straight-line distance.{" "}
              <code>start(measurements, distance_mm)</code> establishes the
              wheel-position origin; <code>update(measurements)</code> returns
              the next MotionCommand; <code>is_complete()</code> reports
              completion.
            </p>
          </ReferenceSection>

          <ReferenceSection id="live" title="Live controls and watch values">
            <p>
              Declare controls once, normally near the top of{" "}
              <code>main.py</code>, and read each parameter&apos;s{" "}
              <code>.value</code> in the loop. Robot applies pending changes
              together at a sample boundary.
            </p>
            <pre className="code-example">{liveExample}</pre>
            <ApiTable
              rows={[
                [
                  'live.number(name, default, minimum, maximum, step, unit="", label=None)',
                  "Bounded numeric slider; returns a parameter whose .value is a float.",
                ],
                [
                  "live.toggle(name, default, label=None)",
                  "Boolean toggle parameter.",
                ],
                [
                  "live.choice(name, default, options, label=None)",
                  "Two to six string choices.",
                ],
                [
                  'live.watch(name, value, unit="", label=None)',
                  "Publish the latest number, Boolean, or short string without printing every sample.",
                ],
                [
                  "live.apply_updates() -> bool",
                  "Apply pending parameter values. Robot.step() calls this automatically.",
                ],
              ]}
            />
            <p>
              Names must be unique Python identifiers. A project may declare up
              to 16 parameters and 16 watch values. Use occasional{" "}
              <code>print()</code> for milestones and explanations, not sampled
              measurement logging.
            </p>
          </ReferenceSection>

          <ReferenceSection
            id="maps"
            title="Maps, paths, and delivery missions"
          >
            <ApiTable
              rows={[
                [
                  "Rectangle(minimum_x_mm, minimum_y_mm, maximum_x_mm, maximum_y_mm)",
                  ".contains(x_mm, y_mm, margin_mm=0.0) and .bounds_mm.",
                ],
                [
                  "ArenaMap(bounds_mm, obstacles=(), features=None, blocked_features=())",
                  ".contains(), .is_free(), .feature_bounds(), and .with_feature_blocked() return or query immutable map geometry.",
                ],
                [
                  "OccupancyGrid.from_arena(arena, resolution_mm, clearance_mm=0.0)",
                  "Create a four-neighbor grid. .world_to_cell(), .cell_center(), .is_blocked(), and .neighbors() connect world geometry to planning.",
                ],
                [
                  "DeliveryTask(...)",
                  "Immutable Challenge 5 mission data: initial pose, arena, grid settings, destination, observed feature, and range-decision settings.",
                ],
                [
                  "DeliveryMission(task, navigation, planner)",
                  ".run(robot) performs observation, map update, planning, and navigation; .result is delivered, no_path, or None before completion.",
                ],
              ]}
            />
          </ReferenceSection>

          <ReferenceSection id="configuration" title="Configuration records">
            <h3>RobotConfig</h3>
            <p>
              Owns the physical geometry, motor/encoder signs, feedforward
              calibration, wheel-speed estimator setting, feedback gain, sample
              period, and final command bound. Construct it in{" "}
              <code>robot_config.py</code>; it is immutable.
            </p>
            <pre className="code-example">{robotConfigExample}</pre>
            <h3>NavigationConfig</h3>
            <p>
              <code>
                NavigationConfig(cruise_speed_mm_s, approach_speed_mm_s,
                slowdown_distance_mm, turn_rate_rad_s, position_tolerance_mm,
                heading_tolerance_rad, realign_heading_rad)
              </code>{" "}
              owns navigation speeds, thresholds, and tolerances. Approach speed
              cannot exceed cruise speed; realignment error cannot be smaller
              than heading tolerance.
            </p>
          </ReferenceSection>

          <ReferenceSection id="xrpbot" title="Low-level XRP access">
            <p>
              Most projects use <code>Robot</code>. <code>XRPBot(config)</code>{" "}
              is the deliberate low-level boundary for hardware experiments. It
              alone imports XRPLib, converts range centimetres to millimetres,
              applies motor signs and final command bounds, and stops after a
              failed motor write.
            </p>
            <ApiTable
              rows={[
                [
                  "read(include_range=False) -> RawSensors",
                  "Read encoders, time, USER button, and optionally ultrasound range.",
                ],
                [
                  "reset_encoders() -> None",
                  "Set both hardware encoder positions to zero.",
                ],
                [
                  "wait_for_button() -> None",
                  "Wait for USER in a standalone run.",
                ],
                [
                  "set_drive(command: DriveCommand) -> None",
                  "Apply a normalized, bounded left/right command.",
                ],
                ["stop() -> None", "Command zero to both motors."],
              ]}
            />
          </ReferenceSection>

          <ReferenceSection
            id="utilities"
            title="Numerical helpers and compatibility"
          >
            <ApiTable
              rows={[
                [
                  "clamp(value, lower, upper)",
                  "Limit a finite number to an inclusive interval.",
                ],
                [
                  "elapsed_time_s(later_ms, earlier_ms)",
                  "Wrap-safe device-time difference in seconds.",
                ],
                ["wrap_angle_rad(angle_rad)", "Equivalent angle in [−π, π)."],
                [
                  "distance_to_goal(pose, goal)",
                  "Planar distance in millimetres.",
                ],
                [
                  "bearing_to_goal(pose, goal)",
                  "Wrapped world-frame bearing in radians.",
                ],
              ]}
            />
            <p>
              <code>MotorEfforts</code>, <code>XRPBot.set_efforts()</code>, and
              old RobotConfig names ending in <code>_effort</code> are retained
              only for older projects. Use <code>DriveCommand</code>,{" "}
              <code>set_drive()</code>, and the current configuration names in
              new work. Names beginning with <code>_</code> are implementation
              details.
            </p>
          </ReferenceSection>
        </main>
      </div>
    </div>
  );
}

function ComponentReference({ component }: { component: ComponentEntry }) {
  return (
    <ReferenceSection id={component.id} title={component.title}>
      <p className="component-identity">
        <code>{component.file}</code> extends <code>{component.base}</code>
      </p>
      <dl className="component-details">
        <div>
          <dt>Owns</dt>
          <dd>{component.owns}</dd>
        </div>
        <div>
          <dt>Receives</dt>
          <dd>{component.receives}</dd>
        </div>
        <div>
          <dt>Maintains</dt>
          <dd>{component.state}</dd>
        </div>
        <div>
          <dt>Provides</dt>
          <dd>{component.returns}</dd>
        </div>
        <div>
          <dt>Used by</dt>
          <dd>{component.usedBy}</dd>
        </div>
      </dl>
      <div className="signature-list">
        {component.methods.map((method) => (
          <Signature key={method.signature} signature={method.signature}>
            {method.detail}
          </Signature>
        ))}
      </div>
    </ReferenceSection>
  );
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

function Signature({
  children,
  signature,
}: {
  children: ReactNode;
  signature: string;
}) {
  return (
    <div className="signature">
      <code>{signature}</code>
      <p>{children}</p>
    </div>
  );
}

function ApiTable({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="api-table">
      {rows.map(([name, detail]) => (
        <div key={name}>
          <code>{name}</code>
          <p>{detail}</p>
        </div>
      ))}
    </div>
  );
}
