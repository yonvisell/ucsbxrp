import type { ReactNode } from "react";

import { AppNavigation } from "../../shared/AppNavigation";
import { useHashTarget } from "../../shared/useHashTarget";
import { ControlCycleFlow, SystemBoundaryFlow } from "./CourseFlows";

const componentReference = "../reference/#student-components";

export function GuideApp() {
  useHashTarget();

  return (
    <div className="guide-app">
      <header className="app-header guide-header">
        <div className="brand" aria-label="UCSBXRP">
          <span className="brand-mark">UCSB</span>
          <span className="brand-xrp">XRP</span>
        </div>
        <AppNavigation active="guide" />
      </header>

      <div className="guide-layout">
        <nav className="guide-toc" aria-label="Guide sections">
          <span>Start</span>
          <a href="#virtual-run">01 First virtual run</a>
          <a href="#projects">02 Project folders and storage</a>
          <span className="toc-group">Develop</span>
          <a href="#project-structure">03 Project files and data flow</a>
          <a href="#components">04 Implement and test components</a>
          <span className="toc-group">Run and measure</span>
          <a href="#physical-xrp">05 Physical XRP connection</a>
          <a href="#monitor">06 Telemetry and export</a>
          <span className="toc-group">Store and troubleshoot</span>
          <a href="#offline-use">07 Using UCSBXRP without internet</a>
          <a href="#github">08 Team version control</a>
          <a href="#shortcuts">09 Keyboard commands</a>
          <a href="#troubleshooting">10 Troubleshooting</a>
          <span className="toc-group">Appendix</span>
          <a href="#technical-overview">A System structure</a>
        </nav>

        <main className="guide-content">
          <section className="guide-intro">
            <h1>Guide</h1>
            <p>
              Create a project, test it on the virtual XRP, run the same files
              on a physical XRP, and record the resulting telemetry. This guide
              also explains project storage, team version control, and common
              errors. Use the <a href="../reference/">API reference</a> for
              Python classes, functions, arguments, return values, and examples.
            </p>
          </section>

          <GuideSection id="virtual-run" number="01" title="First virtual run">
            <ol className="procedure">
              <li>
                Open the <a href="../ide/">IDE</a>. Leave the target set to{" "}
                <strong>Virtual XRP</strong>. The Expanding spiral project is
                ready to run.
              </li>
              <li>
                Select <strong>Run</strong>. Run validates the project when
                needed, then starts it.
              </li>
              <li>
                Open the <a href="../monitor/">Monitor</a> in another tab. The
                same Run/Stop state is available in both apps.
              </li>
            </ol>
            <h3>IDE controls</h3>
            <ul className="action-list">
              <li>
                <strong>Run</strong> checks files that changed, transfers the
                project to the selected target when necessary, and starts the
                project&apos;s main Python file.
              </li>
              <li>
                <strong>Stop</strong> ends the running program. On a physical
                XRP, the course runtime also commands zero motor drive.
              </li>
              <li>
                <strong>Reset</strong> restarts the selected target. It also
                returns the virtual XRP to its initial pose.
              </li>
              <li>
                <strong>Validate</strong> checks every Python file without
                running the project. Run performs this check automatically when
                the files have changed.
              </li>
              <li>
                <strong>Flash project</strong> transfers and verifies a project
                on a physical XRP without starting it.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="projects"
            number="02"
            title="Project folders and storage"
          >
            <p>
              A <strong>course folder</strong> is the parent folder on your
              computer that contains all of your UCSBXRP projects. Each project
              is a named subfolder. The path above the IDE file list shows the
              active project as <code>./ProjectName</code>.
            </p>
            <div className="folder-example" aria-label="Course folder example">
              <code>UCSBXRP/</code>
              <span>├─ SpiralLab/</span>
              <span>├─ Challenge1/</span>
              <span>└─ TeamDelivery/</span>
            </div>
            <p>
              Under <strong>New project</strong>, choose a template and select
              <strong> Create</strong>. The IDE asks for a project name, creates
              that folder, and opens it. <strong>Open project</strong> opens an
              existing project folder. After you grant the IDE access to that
              folder, edits save automatically. Open the <strong>File</strong>{" "}
              menu to rename, duplicate, delete, or make the active Python file
              the main file.
            </p>
            <p>
              At the end of a challenge, <strong>Start next challenge</strong>{" "}
              creates a separate project folder. The IDE lists the student
              component files that will be copied. If the completed project uses
              your version of a component, the new project copies that file and
              continues to use it. A newly introduced component begins with the
              provided version selected until yours is ready. The completed
              project is not changed.
            </p>
            <div
              className="project-catalog"
              aria-label="Available project templates"
            >
              <section>
                <h3>Challenges</h3>
                <ol>
                  <li>
                    <strong>Straight Run</strong> — implement wheel measurement
                    and wheel-speed control.
                  </li>
                  <li>
                    <strong>Turn and Return</strong> — add differential-drive
                    kinematics and odometry.
                  </li>
                  <li>
                    <strong>Waypoint Courier</strong> — add ordered-goal
                    navigation.
                  </li>
                  <li>
                    <strong>Mapped Route</strong> — plan a connected route
                    through the free cells of a map.
                  </li>
                  <li>
                    <strong>Delivery Mission</strong> — estimate range, update a
                    map, plan, and deliver.
                  </li>
                </ol>
              </section>
              <section>
                <h3>Demos</h3>
                <ul>
                  <li>
                    <strong>Expanding spiral</strong> — adjustable speed and
                    winding rate with an obstacle stop.
                  </li>
                  <li>
                    <strong>Obstacle, left, obstacle</strong> — approach, turn
                    90°, and approach again.
                  </li>
                </ul>
                <h3>Tutorial</h3>
                <ul>
                  <li>
                    <strong>MicroPython foundations</strong> — seven short files
                    covering values, functions, collections, classes,
                    exceptions, modules, robot motion, and a program organized
                    into explicit operating states.
                  </li>
                </ul>
              </section>
            </div>
            <div className="callout">
              Before you choose a course folder, edits exist only as a temporary
              browser copy. Choose a course folder before relying on the
              project.
            </div>
          </GuideSection>

          <GuideSection
            id="project-structure"
            number="03"
            title="Project files, units, and data flow"
          >
            <p>
              <code>main.py</code> is the program entry point. It reads the task
              values, obtains the configured components from{" "}
              <code>course_setup.py</code>, sends one <code>MotionCommand</code>{" "}
              per sample, and defines the completion condition.{" "}
              <code>Robot.step()</code> maintains sample timing and performs the
              command and measurement sequence below.
            </p>
            <ControlCycleFlow />
            <div className="project-files-summary">
              <div>
                <code>challenge.py</code>
                <span>Defines task values and stopping conditions.</span>
              </div>
              <div>
                <code>world.json</code>
                <span>
                  Defines arena size, initial pose, obstacles, and markers.
                </span>
              </div>
              <div>
                <code>robot_config.py</code>
                <span>
                  Defines robot geometry, calibration, timing, and controller
                  settings.
                </span>
              </div>
              <div>
                <code>course_setup.py</code>
                <span>
                  Chooses the provided or student version of each component.
                </span>
              </div>
              <div>
                <code>main.py</code>
                <span>
                  Runs the task and always stops the motors when the program
                  exits.
                </span>
              </div>
            </div>
            <p>
              Course distances and linear speeds use <code>mm</code> and{" "}
              <code>mm/s</code>. Headings and turn rates use <code>rad</code>{" "}
              and <code>rad/s</code>. Positive <var>x</var> is the initial
              forward direction, positive <var>y</var> is left, and positive
              heading is counterclockwise.
            </p>
            <div className="timing-guidance">
              <strong>
                Do not add sleep_ms() to a loop that calls Robot.step().
              </strong>
              <p>
                <code>Robot.step()</code> schedules samples from an absolute
                deadline set by <code>RobotConfig.sample_period_ms</code>. It
                applies the requested motion, waits only for the remaining time
                before that deadline, reads the sensors once, updates the
                selected components, and publishes telemetry. An additional{" "}
                <code>sleep_ms()</code> postpones the next command and sensor
                sample. The resulting sample interval no longer matches the
                configured period, which directly changes encoder-based speed
                estimates and feedback-controller behavior. A deliberate delay
                is appropriate only outside the measured control loop, when the
                program is intentionally not commanding and sampling the robot.
              </p>
            </div>
            <p>
              The <a href="../reference/">UCSB XRP API reference</a> defines the
              records, component base classes, supplied services, maps,
              configuration, live values, and numerical functions.
            </p>
          </GuideSection>

          <GuideSection
            id="components"
            number="04"
            title="Implement and test components"
          >
            <p>
              Challenge projects provide one focused file for each component you
              implement. <strong>Validate</strong> checks Python syntax.{" "}
              <strong>Test components</strong> runs{" "}
              <code>component_checks.py</code> in MicroPython without starting
              either robot. Each example supplies known inputs to one student
              method and compares its returned value or retained state with the
              stated result. The checks continue after an unimplemented
              component so completed components can still be evaluated. Students
              use the supplied <code>component_checks.py</code> without editing
              it.
            </p>
            <div className="result-key" aria-label="Component check results">
              <div>
                <strong>PASS</strong>
                <span>The tested behavior matches the stated requirement.</span>
              </div>
              <div>
                <strong>NOT IMPLEMENTED</strong>
                <span>
                  The method still raises <code>NotImplementedError</code>.
                </span>
              </div>
              <div>
                <strong>FAIL</strong>
                <span>The output or state differs from the requirement.</span>
              </div>
            </div>
            <ol className="procedure">
              <li>Implement one component in its named Python file.</li>
              <li>
                Run <strong>Test components</strong> and inspect Program output.
              </li>
              <li>
                In <code>course_setup.py</code>, select that student component
                with its <code>USE_STUDENT_*</code> setting.
              </li>
              <li>Run the complete challenge on the virtual XRP.</li>
            </ol>
            <p>
              A NOT IMPLEMENTED result identifies a method that remains to be
              written; it does not prevent tests of other components. If every
              selected component is NOT IMPLEMENTED, Test components reports
              that no completed implementation was tested. Component checks
              isolate individual calculations; they do not test timing,
              interactions among components, or the full task. Run the complete
              challenge on the virtual XRP after the individual checks pass.
              Component responsibilities and method requirements are in the{" "}
              <a href={componentReference}>student component reference</a>.
            </p>
          </GuideSection>

          <GuideSection
            id="physical-xrp"
            number="05"
            title="Physical XRP connection"
          >
            <p>
              Initial USB setup requires the desktop version of Google Chrome or
              Microsoft Edge on Windows or macOS. These browsers can open a
              serial connection to the XRP directly from the setup page. Safari
              and browsers on phones or tablets do not provide that USB
              connection. Open <a href="../commission/">Set up or repair XRP</a>
              . The same action is available in IDE Settings. USB installs or
              repairs the course software and configures the XRP. After setup,
              the IDE transfers projects and the Monitor receives telemetry over
              the Wi-Fi connection selected in the setup page.
            </p>
            <ol className="procedure">
              <li>
                Connect the XRP by USB-C and select it when the browser asks.
                The device may appear as <strong>XRP Controller</strong>. Leave
                USB connected until setup finishes.
              </li>
              <li>
                Choose the XRP's own <code>UCSB-XRP-…</code> hotspot or an
                existing local Wi-Fi network. For a hotspot, you may enter one
                team member&apos;s last name to label it{" "}
                <code>UCSB-XRP-NAME</code>.
              </li>
              <li>
                If the setup page reports that firmware repair is required,
                follow its displayed BOOT and RESET instructions. Select the
                temporary <code>RP2350</code> drive when prompted.
              </li>
              <li>
                Follow the final Wi-Fi instruction shown on the setup page. The
                page verifies the connection and then opens the IDE in Physical
                XRP mode.
              </li>
            </ol>
            <p>
              In hotspot mode, join the network named by the setup page. In
              existing-Wi-Fi mode, the computer and XRP must be on the same
              local network. Reopen setup from IDE Settings to change the
              network or repair course software.
            </p>
          </GuideSection>

          <GuideSection
            id="monitor"
            number="06"
            title="Telemetry, recording, and export"
          >
            <p>
              The Monitor shows the simulated or measured world, live telemetry,
              controls and watch values created by the running program, signal
              histories, and recording and export controls. The target selected
              in the IDE is also selected in the Monitor. Program output and the
              complete target event log remain in the IDE terminal, including
              when Run is selected in the Monitor.
            </p>
            <dl className="term-list">
              <div>
                <dt>IDE terminal</dt>
                <dd>
                  Program output, Python exceptions, connection events,
                  validation, transfer, Run, Stop, and reset history.
                </dd>
              </div>
              <div>
                <dt>Measured wheel speed</dt>
                <dd>
                  Estimated by <code>SensorModel</code> from recent encoder
                  counts and sample times. The wheel controller and plot use the
                  same estimate.
                </dd>
              </div>
              <div>
                <dt>Odometry check (virtual)</dt>
                <dd>
                  Difference between student odometry and simulator truth.
                  Simulator truth is not available to robot code or a physical
                  XRP.
                </dd>
              </div>
            </dl>
            <p>
              Choose signals and a time window under <strong>Controls</strong>.{" "}
              <strong>Clear plots</strong> starts a new visible history without
              resetting the robot. Drag a separator to resize the world,
              telemetry, or plots.
            </p>
            <p>
              A program can create sliders, toggles, and choices with{" "}
              <code>ucsb_xrp.live</code>. It may publish current intermediate
              values with <code>live.watch()</code>, or a numerical value that
              can be plotted with <code>live.plot()</code>. Each named plot
              value appears as a selectable signal in Monitor Controls. Use
              these functions for current state; use a recording when the full
              time history is required.
            </p>
            <ol className="procedure">
              <li>
                Select <strong>Start recording</strong>, then run or observe the
                robot.
              </li>
              <li>
                Select <strong>Stop recording</strong> when the evidence is
                complete.
              </li>
              <li>
                Export telemetry as CSV, selected plots as SVG or PNG, or a
                recorded world replay as WebM.
              </li>
            </ol>
          </GuideSection>

          <GuideSection
            id="offline-use"
            number="07"
            title="Using UCSBXRP without internet"
          >
            <p>
              Open the course site once while the computer has internet access
              and wait for the green status{" "}
              <strong>Course apps saved in Chrome</strong>. Chrome then has a
              browser-owned copy of the IDE, Monitor, virtual XRP, Guide, API
              reference, and setup page. This copy belongs to the Chrome profile
              that loaded it. Another browser or Chrome profile must complete
              its own first online load.
            </p>
            <p>
              The course application copy and your project files are separate.
              Project files are ordinary files in the course folder you choose;
              the browser-owned application is not copied into that folder. On
              the first load or after a course update, Chrome may refresh the
              page once before Virtual Run becomes available.
            </p>
            <div className="offline-capabilities">
              <section>
                <h3>Available without internet</h3>
                <ul>
                  <li>
                    Close and reopen the IDE, Monitor, Guide, and API reference
                    from the same Chrome profile on that computer.
                  </li>
                  <li>Validate and run projects on the virtual XRP.</li>
                  <li>
                    Read and write project files after granting access to their
                    course folder. If the IDE later reports that folder access
                    is needed, select <strong>Reconnect</strong> and choose the
                    same course folder.
                  </li>
                  <li>
                    Connect to a physical XRP over local Wi-Fi while the
                    computer is joined to its hotspot or the same local network.
                  </li>
                </ul>
              </section>
              <section>
                <h3>Limits</h3>
                <ul>
                  <li>
                    The first complete load and each later course-app update
                    require internet access.
                  </li>
                  <li>
                    GitHub pull, push, and web pages require internet access.
                  </li>
                  <li>
                    A project without a selected project folder has only a
                    temporary browser copy. Export a recording or program output
                    that must be retained outside the current session.
                  </li>
                  <li>
                    Clearing this site&apos;s browser data removes the saved
                    course apps, settings, temporary browser copies, and
                    remembered folder access. It does not remove project files
                    in the course folder; select that folder again to restore
                    access.
                  </li>
                  <li>
                    The saved course apps are not copied into the course folder;
                    project files remain separate.
                  </li>
                </ul>
              </section>
            </div>
            <p>
              Installing the UCSBXRP app is strongly recommended when Chrome
              offers that option in its address bar or menu. Installation adds
              an application launcher and a separate UCSBXRP window; it is not
              required for offline use and does not copy the application into
              the course folder. Whenever UCSBXRP opens with internet access,
              Chrome checks for a newer course release. An available update is
              saved first and applied only after the application can reload
              without interrupting an active run or an unfinished project save.
            </p>
          </GuideSection>

          <GuideSection id="github" number="08" title="Team version control">
            <p>
              Keep one GitHub repository for each course team. Use the
              repository assigned by the course; if none is assigned, one
              teammate creates it and adds the other team members as
              collaborators.
            </p>
            <ol className="procedure">
              <li>
                Install{" "}
                <a
                  href="https://desktop.github.com/download/"
                  rel="noreferrer"
                  target="_blank"
                >
                  GitHub Desktop
                </a>{" "}
                on Windows or macOS and sign in.
              </li>
              <li>
                Clone the team repository to the computer. Use the cloned
                repository as the UCSBXRP course folder so every named project
                subfolder is included in version control.
              </li>
              <li>
                In the IDE, choose or change the course folder and select the
                cloned repository. Create a project from a template, or select
                <strong>Open project</strong> and choose an existing project
                subfolder inside it.
              </li>
              <li>Pull before beginning a work session.</li>
              <li>
                After a working checkpoint, review the changed files, write a
                short message describing the result, commit, and push.
              </li>
              <li>
                Before another teammate continues, they pull the latest commit.
              </li>
            </ol>
            <div className="callout">
              Do not pass a project back and forth as renamed folders or email
              attachments. The team repository is the shared history and current
              source of the project.
            </div>
          </GuideSection>

          <GuideSection id="shortcuts" number="09" title="Keyboard commands">
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>macOS</th>
                  <th>Windows</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Save</td>
                  <td>
                    <kbd>⌘</kbd> <kbd>S</kbd>
                  </td>
                  <td>
                    <kbd>Ctrl</kbd> <kbd>S</kbd>
                  </td>
                </tr>
                <tr>
                  <td>Validate</td>
                  <td>
                    <kbd>⌘</kbd> <kbd>Shift</kbd> <kbd>Enter</kbd>
                  </td>
                  <td>
                    <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>Enter</kbd>
                  </td>
                </tr>
                <tr>
                  <td>Run</td>
                  <td>
                    <kbd>⌘</kbd> <kbd>Enter</kbd>
                  </td>
                  <td>
                    <kbd>Ctrl</kbd> <kbd>Enter</kbd>
                  </td>
                </tr>
                <tr>
                  <td>Settings</td>
                  <td>
                    <kbd>⌘</kbd> <kbd>,</kbd>
                  </td>
                  <td>
                    <kbd>Ctrl</kbd> <kbd>,</kbd>
                  </td>
                </tr>
              </tbody>
            </table>
            <p>
              <kbd>Tab</kbd> indents according to the editor setting.
            </p>
          </GuideSection>

          <GuideSection
            id="troubleshooting"
            number="10"
            title="Troubleshooting"
          >
            <ul className="procedure troubleshooting-list">
              <li>
                <strong>Code does not run:</strong> in the IDE terminal, read
                Program output for a Python exception and System log for
                validation, transfer, connection, and target events.
              </li>
              <li>
                <strong>The physical XRP is unreachable:</strong> confirm that
                the computer is using the robot network chosen during setup. If
                needed, connect USB-C and open{" "}
                <a href="../commission/">Set up or repair XRP</a>.
              </li>
              <li>
                <strong>The course folder is disconnected:</strong> select{" "}
                <strong>Reconnect</strong> and choose the same folder again.
              </li>
              <li>
                <strong>No physical pose appears:</strong> stationary sensors
                can still be valid. Pose appears when the project uses the
                course <code>Robot</code> loop and publishes its odometry
                estimate.
              </li>
              <li>
                <strong>A component check says NOT IMPLEMENTED:</strong> open
                the named student file and implement that method; other
                component work can continue.
              </li>
            </ul>
            <div className="source-links">
              <a
                href="https://www.micropython.org/download/SPARKFUN_XRP_CONTROLLER/"
                rel="noreferrer"
                target="_blank"
              >
                SparkFun XRP Controller firmware ↗
              </a>
              <a
                href="https://open-stem.github.io/XRP_MicroPython/api.html"
                rel="noreferrer"
                target="_blank"
              >
                XRPLib reference ↗
              </a>
            </div>
          </GuideSection>

          <GuideSection
            id="technical-overview"
            number="A"
            title="System structure"
          >
            <p>
              A course project uses one Python interface on both targets. The
              target-specific <code>XRPBot</code> implementation is the boundary
              between course code and either simulated or physical hardware.
              Navigation, odometry, mapping, planning, and mission logic remain
              in the Python project; the browser does not perform them for the
              student program.
            </p>
            <SystemBoundaryFlow />
            <h3>Student components</h3>
            <dl className="component-overview-list">
              <div>
                <dt>
                  <a href="../reference/#sensor-model">SensorModel</a>
                </dt>
                <dd>
                  Converts raw encoder, time, range, and button readings into
                  wheel travel and recent wheel-speed estimates. It keeps the
                  encoder reference and samples needed for speed estimation.
                </dd>
              </div>
              <div>
                <dt>
                  <a href="../reference/#wheel-speed-controller">
                    WheelSpeedController
                  </a>
                </dt>
                <dd>
                  Receives requested wheel speeds from DifferentialDrive and
                  measured wheel-speed estimates from SensorModel. It returns
                  normalized left and right motor commands that act to reduce
                  the difference. The supplied controller uses the current
                  values only; another valid implementation may retain state.
                </dd>
              </div>
              <div>
                <dt>
                  <a href="../reference/#differential-drive">
                    DifferentialDrive
                  </a>
                </dt>
                <dd>
                  Uses the wheel spacing to convert requested forward speed and
                  turn rate into target left and right wheel speeds. It retains
                  no state between calls.
                </dd>
              </div>
              <div>
                <dt>
                  <a href="../reference/#odometry">Odometry</a>
                </dt>
                <dd>
                  Updates the estimated position and heading from the exact
                  wheel travel measured in each sample. It retains the current
                  pose.
                </dd>
              </div>
              <div>
                <dt>
                  <a href="../reference/#navigation-controller">
                    NavigationController
                  </a>
                </dt>
                <dd>
                  Uses the current odometry pose and active goal to request
                  forward and turning motion. It retains the route progress and
                  current operating phase.
                </dd>
              </div>
              <div>
                <dt>
                  <a href="../reference/#grid-planner">GridPlanner</a>
                </dt>
                <dd>
                  Builds a route through adjacent free cells in a project map.
                  The search data can remain local to one planning call.
                </dd>
              </div>
            </dl>
            <h3>Virtual and physical targets</h3>
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
                  <td>MicroPython in the browser</td>
                  <td>MicroPython on the RP2350</td>
                </tr>
                <tr>
                  <td>Hardware calls</td>
                  <td>Simulated XRPLib</td>
                  <td>RP2350 XRPLib</td>
                </tr>
                <tr>
                  <td>Project transfer</td>
                  <td>Browser worker file system</td>
                  <td>Local Wi-Fi service on the XRP</td>
                </tr>
                <tr>
                  <td>Telemetry</td>
                  <td>Simulator and project state</td>
                  <td>Measurements reported by the XRP</td>
                </tr>
                <tr>
                  <td>Ground-truth pose</td>
                  <td>Available for display and evaluation only</td>
                  <td>Not supplied by the robot</td>
                </tr>
              </tbody>
            </table>
            <p>
              The <a href="../reference/">UCSB XRP API reference</a> gives
              method-level details. Instructors can use the{" "}
              <a href="../author/">challenge creation wizard</a> to prepare and
              check a new challenge specification before adding it to the course
              repository.
            </p>
          </GuideSection>
        </main>
      </div>
    </div>
  );
}

function GuideSection({
  children,
  id,
  number,
  title,
}: {
  children: ReactNode;
  id: string;
  number: string;
  title: string;
}) {
  return (
    <section id={id}>
      <div className="section-number">{number}</div>
      <div>
        <h2>{title}</h2>
        {children}
      </div>
    </section>
  );
}
