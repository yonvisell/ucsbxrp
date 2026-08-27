import { CourseHeader } from "../../shared/CourseHeader";

const sections = [
  ["scope", "System scope"],
  ["course", "Challenge sequence"],
  ["architecture", "Runtime architecture"],
  ["components", "Course components"],
  ["project", "Project structure"],
  ["apps", "Browser applications"],
  ["targets", "Virtual and physical targets"],
  ["data", "Data and timing"],
  ["authoring", "Challenge authoring"],
  ["release", "Release and validation"],
] as const;

function CodeFlow({ children }: { children: string }) {
  return <pre className="overview-flow">{children}</pre>;
}
export function OverviewApp() {
  return (
    <div className="overview-app">
      <CourseHeader />
      <div className="overview-layout">
        <aside className="overview-nav">
          <p>Contents</p>
          <nav aria-label="Overview contents">
            {sections.map(([id, label]) => (
              <a key={id} href={`#${id}`}>
                {label}
              </a>
            ))}
          </nav>
          <a className="overview-author-link" href="../author/">
            Create or revise a challenge
          </a>
        </aside>

        <main className="overview-content">
          <header>
            <h1>UCSBXRP technical overview</h1>
            <p className="overview-lead">
              UCSBXRP comprises the course library, browser IDE, simulator,
              telemetry Monitor, setup service, and project release used for the
              XRP laboratory sequence. This reference describes the major
              components, public interfaces, and maintenance requirements for
              instructors maintaining course material.
            </p>
          </header>

          <section id="scope">
            <h2>System scope</h2>
            <p>
              One MicroPython project runs without source changes against either
              the virtual XRP or the physical RP2350 XRP. The browser
              applications edit and transfer projects, host the virtual target,
              display telemetry, and commission the physical robot. Robot
              behavior and course algorithms remain in Python; browser code does
              not implement navigation, odometry, mapping, or planning on behalf
              of student code.
            </p>
            <CodeFlow>{`student project -> ucsb_xrp course interfaces -> target-specific XRPBot
                                             |-> simulated XRPLib and planar plant
                                             +-> physical XRPLib and XRP hardware`}</CodeFlow>
            <p>
              The simulator supplies motor response, encoder counts, range
              readings, button state, collision geometry, and ground-truth pose.
              Ground truth is used for virtual evaluation and rendering; it is
              not substituted for student odometry.
            </p>
          </section>

          <section id="course">
            <h2>Challenge sequence</h2>
            <table>
              <thead>
                <tr>
                  <th>Challenge</th>
                  <th>Robot task</th>
                  <th>New student implementation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1 · Straight Run</td>
                  <td>
                    Measure wheel motion, regulate speed, and stop at a
                    distance.
                  </td>
                  <td>
                    <code>SensorModel</code>, <code>WheelSpeedController</code>
                  </td>
                </tr>
                <tr>
                  <td>2 · Turn and Return</td>
                  <td>
                    Travel out, turn 180°, return, and compare estimated pose.
                  </td>
                  <td>
                    <code>DifferentialDrive</code>, <code>Odometry</code>
                  </td>
                </tr>
                <tr>
                  <td>3 · Waypoint Courier</td>
                  <td>
                    Visit ordered world-coordinate goals and finish at a
                    heading.
                  </td>
                  <td>
                    <code>NavigationController</code>
                  </td>
                </tr>
                <tr>
                  <td>4 · Mapped Route</td>
                  <td>
                    Plan through a known occupancy grid and execute the route.
                  </td>
                  <td>
                    <code>GridPlanner</code>
                  </td>
                </tr>
                <tr>
                  <td>5 · Delivery Mission</td>
                  <td>
                    Estimate range, select a map condition, plan, and deliver.
                  </td>
                  <td>
                    <code>SensorModel.estimate_range()</code> and integration
                  </td>
                </tr>
              </tbody>
            </table>
            <p>
              Each challenge retains the components developed previously. A
              Boolean selector in <code>course_setup.py</code> chooses the
              supplied or student implementation of each component
              independently, permitting isolated testing and staged integration.
            </p>
          </section>

          <section id="architecture">
            <h2>Runtime architecture</h2>
            <h3>Measurement and control loop</h3>
            <CodeFlow>{`XRPBot.read() -> RawSensors -> SensorModel -> Measurements
                                                |-> Odometry -> Pose

MotionCommand -> DifferentialDrive -> WheelSpeeds
                                      |
Measurements.wheel_speeds ------------+
                                      v
                          WheelSpeedController -> DriveCommand -> XRPBot`}</CodeFlow>
            <p>
              <code>Robot.start()</code> initializes the selected components and
              first state. Each <code>Robot.step(command)</code> waits for an
              absolute sample deadline, reads the target once, updates
              measurement and pose, computes the next drive command, and returns
              one <code>RobotState</code>. Motion programs place{" "}
              <code>Robot.stop()</code> in a <code>finally</code> block.
            </p>
            <h3>Navigation and planning</h3>
            <CodeFlow>{`ArenaMap -> OccupancyGrid -> GridPlanner -> GridPath -> NavigationGoal[]
                                                               |
Pose -----------------------------> NavigationController ------+
                                      |
                                      +-> MotionCommand -> Robot.step()`}</CodeFlow>
          </section>

          <section id="components">
            <h2>Course components and supplied services</h2>
            <table>
              <thead>
                <tr>
                  <th>Part</th>
                  <th>Function</th>
                  <th>State maintained</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>SensorModel</code>
                  </td>
                  <td>
                    Convert raw timestamps, encoders, range, and button data to
                    course units.
                  </td>
                  <td>
                    Encoder origins, previous sample, and short speed-estimation
                    history.
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>WheelSpeedController</code>
                  </td>
                  <td>
                    Map target and measured wheel speeds to bounded drive
                    commands.
                  </td>
                  <td>
                    Only the controller state required by the selected
                    implementation.
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>DifferentialDrive</code>
                  </td>
                  <td>
                    Map forward speed and turn rate to left and right wheel
                    speeds.
                  </td>
                  <td>No route or pose state.</td>
                </tr>
                <tr>
                  <td>
                    <code>Odometry</code>
                  </td>
                  <td>Integrate measured wheel travel into planar pose.</td>
                  <td>Current x, y, and heading estimate.</td>
                </tr>
                <tr>
                  <td>
                    <code>NavigationController</code>
                  </td>
                  <td>
                    Convert the active world-coordinate goal and current pose to
                    a command.
                  </td>
                  <td>
                    Ordered goals, active goal, navigation mode, and completion.
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>GridPlanner</code>
                  </td>
                  <td>Return a connected path through free grid cells.</td>
                  <td>Search state local to one planning call.</td>
                </tr>
              </tbody>
            </table>
            <p>
              Supplied services are <code>XRPBot</code>, <code>Robot</code>,{" "}
              <code>StraightLineController</code>, <code>ArenaMap</code>,{" "}
              <code>OccupancyGrid</code>, and <code>DeliveryMission</code>.
              Their public behavior is defined by the API reference. Reference
              implementations are replaceable course source. Public interfaces
              and stated challenge requirements, rather than private
              implementation choices, define required behavior.
            </p>
          </section>

          <section id="project">
            <h2>Project structure</h2>
            <table>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Contents</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>README.md</code>
                  </td>
                  <td>
                    Task, student responsibilities, supplied parts, program
                    flow, evidence, and work sequence.
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>main.py</code>
                  </td>
                  <td>
                    Mission-level construction and sequencing; the configured
                    entrypoint.
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>challenge.py</code>
                  </td>
                  <td>
                    Task values loaded from the project world plus non-geometric
                    task parameters.
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>world.json</code>
                  </td>
                  <td>
                    Millimeter bounds, initial pose, obstacles, start markings,
                    and named waypoints.
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>robot_config.py</code>
                  </td>
                  <td>
                    Robot calibration, sample timing, controller settings, and
                    navigation tolerances.
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>course_setup.py</code>
                  </td>
                  <td>
                    Independent reference/student selectors and construction
                    functions.
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>component_checks.py</code>
                  </td>
                  <td>
                    Software checks that isolate student component behavior
                    without moving a robot. Results are PASS, NOT IMPLEMENTED,
                    or FAIL. A run is unsuccessful if any check fails or if
                    every selected check is not implemented.
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>*_controller.py</code> and component files
                  </td>
                  <td>
                    Student implementations with the public component
                    interfaces.
                  </td>
                </tr>
              </tbody>
            </table>
            <p>
              Geometric values have one source: <code>world.json</code>. Python
              loads them through <code>load_world()</code>; the Monitor uses the
              same file. This prevents the displayed world, simulator geometry,
              and assignment values from drifting apart.
            </p>
          </section>

          <section id="apps">
            <h2>Browser applications</h2>
            <dl>
              <dt>IDE</dt>
              <dd>
                Edits project files, validates MicroPython, runs component
                checks, transfers projects, starts and stops either target, and
                records detailed execution state.
              </dd>
              <dt>Monitor</dt>
              <dd>
                Shares the current target and project lifecycle, displays the
                world and telemetry, changes declared live parameters, records
                data, and exports plots, annotations, and replay video.
              </dd>
              <dt>Setup and repair</dt>
              <dd>
                Uses Web Serial to identify an RP2350 XRP, install or repair the
                course runtime, retain or replace network configuration, reset
                the robot, and verify the installed release.
              </dd>
              <dt>Guide and API reference</dt>
              <dd>
                Provide student operating guidance and precise Python interface
                documentation. The present page and challenge authoring tool are
                instructor-facing.
              </dd>
            </dl>
            <p>
              The IDE and Monitor coordinate through a shared browser worker. A
              Run request validates when needed; either application can start or
              stop the current project. The worker retains validation, transfer,
              connection, run, stop, error, and program-output events; the IDE
              terminal presents that shared history without replacing earlier
              entries.
            </p>
          </section>

          <section id="targets">
            <h2>Virtual and physical targets</h2>
            <table>
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Virtual XRP</th>
                  <th>Physical XRP</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Python runtime</td>
                  <td>MicroPython WebAssembly worker</td>
                  <td>MicroPython on RP2350</td>
                </tr>
                <tr>
                  <td>Hardware boundary</td>
                  <td>Simulated XRPLib calls</td>
                  <td>XRPLib device calls</td>
                </tr>
                <tr>
                  <td>Project transfer</td>
                  <td>Worker file system</td>
                  <td>Wi-Fi course service</td>
                </tr>
                <tr>
                  <td>Telemetry</td>
                  <td>Shared worker state</td>
                  <td>HTTP service on XRP</td>
                </tr>
                <tr>
                  <td>Ground truth</td>
                  <td>Available to simulator evaluation</td>
                  <td>Not supplied by the XRP</td>
                </tr>
              </tbody>
            </table>
            <p>
              USB-C is used for initial installation and repair. Normal physical
              project transfer, control, and telemetry use Wi-Fi. The XRP may
              host its own access point or join a local 2.4 GHz network; the
              browser connects to the configured XRP address in either mode.
            </p>
          </section>

          <section id="data">
            <h2>Data, units, and timing</h2>
            <ul>
              <li>
                Distance, pose, wheel travel, and world geometry: millimeters.
              </li>
              <li>Linear and wheel speed: millimeters per second.</li>
              <li>Heading: radians; turn rate: radians per second.</li>
              <li>Hardware time: wrap-safe integer milliseconds.</li>
              <li>
                Drive commands: dimensionless values bounded by robot
                configuration.
              </li>
            </ul>
            <p>
              Programs may declare bounded numeric, Boolean, or enumerated live
              parameters through <code>ucsb_xrp.live</code>. Pending changes are
              applied together at a sample boundary. <code>live.watch()</code>{" "}
              publishes named values and <code>live.plot()</code> adds a
              student-defined plot signal; neither requires students to
              implement transport code.
            </p>
            <p>
              Virtual telemetry distinguishes commanded values, measured
              encoder-based values, student odometry, and simulator truth.
              Physical telemetry omits simulator truth. Instructors should
              preserve the source of each signal when adding plots or evaluation
              measures.
            </p>
          </section>

          <section id="authoring">
            <h2>Challenge authoring</h2>
            <p>
              The <a href="../author/">challenge specification editor</a> checks
              and downloads a machine-readable JSON specification: the closest
              existing program structure, catalog identity, objective, assessed
              component files, classes and selection flags, supplied files,
              evidence, work sequence, world, and optional complete file
              overrides. The browser does not create repository files or publish
              a challenge.
            </p>
            <p>
              Its visual world editor changes the same <code>world.json</code>
              source used by the simulator, Monitor, and project Python. It
              supports multiple named worlds, arena bounds, initial pose, walls,
              blocks, start and finish regions, waypoints, and general visual
              markers. Advanced JSON remains available for extension fields;
              graphic edits retain fields they do not interpret.
            </p>
            <ol>
              <li>Check and download the specification JSON in the browser.</li>
              <li>
                Run <code>challenge_authoring.py create --spec ...</code>. The
                command copies a published challenge, generates the README and
                world, applies file overrides, records template metadata, and
                checks the draft.
              </li>
              <li>
                Review the files, run the virtual task, exercise component fault
                checks, and run the course tests.
              </li>
              <li>
                Run <code>challenge_authoring.py publish challenge_N</code> only
                after that functional review passes.
              </li>
            </ol>
            <p>
              The create command makes an unpublished repository draft and
              checks its structure, component metadata, paths, Python syntax,
              world data, and required README sections. README wording does not
              define the component boundary. The instructor then reviews the
              generated files, runs the supplied implementation, enables each
              assessed student component independently, and verifies that
              representative defects fail the intended component check.
              Publication is a separate command after those checks pass.
            </p>
          </section>

          <section id="release">
            <h2>Release, offline operation, and validation</h2>
            <p>
              <code>vendor/current</code> is the versioned course release. It
              contains the student library, compiled reference modules, firmware
              and service bundle, project catalog, challenges, demos, tutorial,
              and release metadata. A production build generates
              content-addressed browser assets, a commissioning manifest with
              hashes, and an offline manifest.
            </p>
            <p>
              After one complete online load, Chrome can reopen the cached
              applications, simulator, documentation, and course release without
              internet. Project files remain ordinary files in the selected
              Working folder; they are not embedded in the cached application.
              Clearing site data removes the cached application and any unsaved
              project data held by the site, not files in that folder.
            </p>
            <h3>Release checks</h3>
            <ol>
              <li>
                Python unit and challenge tests, including authoring checks.
              </li>
              <li>MicroPython source/bytecode behavior parity.</li>
              <li>TypeScript unit tests and production build.</li>
              <li>Offline-manifest completeness and reload tests.</li>
              <li>
                Chrome workflows for editing, virtual execution, Monitor data,
                recording, and commissioning.
              </li>
              <li>
                Physical installation, transfer, Run, Stop, and telemetry for
                hardware-affecting releases.
              </li>
            </ol>
            <p>
              Record whether each result came from the simulator, browser, or
              physical XRP. A virtual result does not establish physical timing,
              networking, sensor, or motor behavior.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
