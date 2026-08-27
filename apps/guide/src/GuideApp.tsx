import type { ReactNode } from "react";

import { AppNavigation } from "../../shared/AppNavigation";
import { FlowDiagram, type DiagramEdge, type DiagramNode } from "./FlowDiagram";

const componentReference = "../reference/#student-components";

const controlLoopNodes = [
  {
    id: "program",
    column: 1,
    row: 0,
    label: "main.py",
    details: ["task sequence and completion"],
    kind: "program",
  },
  {
    id: "drive-model",
    column: 0,
    row: 1,
    label: "DifferentialDrive*",
    details: ["robot motion → wheel targets"],
    href: "../reference/#differential-drive",
    kind: "student",
  },
  {
    id: "wheel-control",
    column: 1,
    row: 1,
    label: "WheelSpeedController*",
    details: ["target + measured speed → drive"],
    href: "../reference/#wheel-speed-controller",
    kind: "student",
  },
  {
    id: "xrp",
    column: 2,
    row: 1,
    label: "XRP target",
    details: ["motors, encoders, range sensor"],
    kind: "target",
  },
  {
    id: "odometry",
    column: 0,
    row: 2,
    label: "Odometry*",
    details: ["wheel travel → pose"],
    href: "../reference/#odometry",
    kind: "student",
  },
  {
    id: "sensor-model",
    column: 2,
    row: 2,
    label: "SensorModel*",
    details: ["counts + time → measurements"],
    href: "../reference/#sensor-model",
    kind: "student",
  },
] satisfies readonly DiagramNode[];

const controlLoopEdges = [
  {
    from: "program",
    to: "drive-model",
    label: "MotionCommand",
    fromSide: "bottom",
    toSide: "top",
    labelAt: { column: 0.48, row: 0.5 },
  },
  {
    from: "drive-model",
    to: "wheel-control",
    label: "target wheel speeds",
  },
  {
    from: "wheel-control",
    to: "xrp",
    label: "drive command",
  },
  {
    from: "xrp",
    to: "sensor-model",
    label: "RawSensors",
    fromSide: "bottom",
    toSide: "top",
    labelAt: { column: 2, row: 1.5 },
  },
  {
    from: "sensor-model",
    to: "wheel-control",
    label: "measured speeds",
    fromSide: "left",
    toSide: "bottom",
    via: [{ column: 1.55, row: 2 }],
    labelAt: { column: 1.55, row: 1.72 },
  },
  {
    from: "sensor-model",
    to: "odometry",
    label: "wheel increments",
  },
  {
    from: "odometry",
    to: "program",
    label: "Pose",
    fromSide: "left",
    toSide: "left",
    via: [
      { column: -0.45, row: 2 },
      { column: -0.45, row: 0 },
    ],
    labelAt: { column: -0.45, row: 1 },
  },
] satisfies readonly DiagramEdge[];

const systemNodes = [
  {
    id: "project",
    column: 0,
    row: 0,
    label: "Student project",
    details: ["main.py and project modules"],
    kind: "program",
  },
  {
    id: "api",
    column: 1,
    row: 0,
    label: "UCSB XRP API",
    details: ["shared records and services"],
    href: "../reference/",
    kind: "service",
  },
  {
    id: "adapter",
    column: 2,
    row: 0,
    label: "XRPBot",
    details: ["one hardware boundary"],
    href: "../reference/#xrpbot",
    kind: "service",
  },
  {
    id: "virtual",
    column: 1.5,
    row: 1,
    label: "Virtual XRP",
    details: ["MicroPython + simulated XRPLib"],
    kind: "target",
  },
  {
    id: "physical",
    column: 2.5,
    row: 1,
    label: "Physical XRP",
    details: ["MicroPython + RP2350 XRPLib"],
    kind: "target",
  },
  {
    id: "monitor",
    column: 0,
    row: 1,
    label: "IDE and Monitor",
    details: ["edit, run, telemetry, exports"],
    kind: "service",
  },
] satisfies readonly DiagramNode[];

const systemEdges = [
  { from: "project", to: "api", label: "calls" },
  { from: "api", to: "adapter", label: "uses" },
  {
    from: "adapter",
    to: "virtual",
    label: "same project",
    fromSide: "bottom",
    toSide: "top",
    labelAt: { column: 1.75, row: 0.53 },
  },
  {
    from: "adapter",
    to: "physical",
    label: "same project",
    fromSide: "bottom",
    toSide: "top",
    labelAt: { column: 2.48, row: 0.53 },
  },
  { from: "monitor", to: "virtual", label: "control and telemetry" },
  {
    from: "monitor",
    to: "physical",
    label: "control and telemetry",
    via: [{ column: 1.1, row: 1.35 }],
    labelAt: { column: 1.1, row: 1.35 },
  },
] satisfies readonly DiagramEdge[];

export function GuideApp() {
  return (
    <div className="guide-app">
      <header className="app-header guide-header">
        <div className="brand" aria-label="UCSBXRP Guide">
          <span className="brand-mark">UCSB</span>
          <span className="brand-xrp">XRP</span>
          <span aria-hidden="true" className="brand-separator">
            |
          </span>
          <span className="brand-product">Guide</span>
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
          <a href="#offline-use">07 Offline application and storage</a>
          <a href="#github">08 Team version control</a>
          <a href="#shortcuts">09 Keyboard commands</a>
          <a href="#troubleshooting">10 Troubleshooting</a>
          <span className="toc-group">Appendix</span>
          <a href="#technical-overview">A System overview</a>
        </nav>

        <main className="guide-content">
          <section className="guide-intro">
            <h1>UCSBXRP guide</h1>
            <p>
              Use this guide to create a project, test it on the virtual XRP,
              run the same project on a physical XRP, and record the results. It
              also explains project storage, version control, and common errors.
              The <a href="../reference/">UCSB XRP API reference</a> documents
              the classes and functions available to project code.
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
              At the end of a challenge, <strong>Start next challenge</strong>
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
            <FlowDiagram
              caption="Arrows show the values passed during one sampled control cycle. An asterisk marks a student-implemented component; select its name to open the matching API entry."
              columns={3}
              description="The program sends a motion command through differential-drive conversion and wheel-speed control to the XRP. Raw sensor data returns through the sensor model to wheel control and odometry; odometry returns the estimated pose to the program."
              edges={controlLoopEdges}
              nodes={controlLoopNodes}
              rows={3}
              title="UCSBXRP measurement and control cycle"
            />
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
              <strong>Let Robot.step() control the sample timing.</strong>
              <p>
                Do not add <code>sleep_ms()</code> inside a loop that repeatedly
                calls <code>Robot.step()</code>. Each call applies the requested
                motion, waits until the next scheduled sensor sample, reads the
                sensors once, updates the selected components, and publishes
                telemetry. An additional sleep delays the following control
                update, reduces the actual sample rate, and can make speed
                estimation and feedback control inconsistent with the configured
                sample period. Use a delay only outside this measured control
                loop, when the program intentionally is not controlling or
                measuring the robot.
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
              either robot. It runs the provided examples for the component
              classes listed in that file. Students normally do not edit{" "}
              <code>component_checks.py</code>.
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
              that no completed work was tested. Each check examines one stated
              behavior, and the complete challenge must also be run. Component
              responsibilities and method requirements are in the{" "}
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
                The choice is normally named <strong>XRP Controller</strong>.
                Leave USB connected until setup finishes.
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
            title="Offline application and storage"
          >
            <p>
              First open the course site while the computer has internet access.
              Wait until it reports <strong>Course apps saved in Chrome</strong>
              . Saving starts automatically. Chrome has then stored the IDE,
              Monitor, virtual XRP, Guide, API reference, and setup page as data
              for this site in that browser. The course folder remains the
              separate location for project files that you create or edit.
            </p>
            <p>
              On the first load or after an update, Chrome may refresh the page
              once automatically. Virtual Run becomes available after that
              refresh.
            </p>
            <div className="offline-capabilities">
              <section>
                <h3>Available after one complete online load</h3>
                <ul>
                  <li>
                    Close and reopen the IDE, Monitor, Guide, and API reference
                    in the same browser on that computer.
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
                    The first complete load and later course-app updates require
                    internet access.
                  </li>
                  <li>
                    GitHub pull, push, and web pages require internet access.
                  </li>
                  <li>
                    A project without a selected folder has only a temporary
                    browser copy. Recordings and program output that are not
                    saved or exported last only for the current session.
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
              Installing the UCSBXRP app window is strongly recommended when
              Chrome offers that option in its address bar or browser menu. The
              installation adds an application launcher and opens UCSBXRP in a
              separate window. It does not copy the app into the course folder,
              and it does not replace the automatic offline storage described
              above. When UCSBXRP is opened with internet access, Chrome checks
              for an updated course release and reloads once if the application
              changed.
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
                Clone the team repository into your UCSBXRP course folder. In
                the IDE, choose <strong>Open project</strong> and select the
                cloned folder.
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
            title="How UCSBXRP fits together"
          >
            <p>
              A course project uses one Python interface on both targets. The
              target-specific <code>XRPBot</code> implementation is the boundary
              between course code and either simulated or physical hardware.
              Navigation, odometry, mapping, planning, and mission logic remain
              in the Python project; the browser does not perform them for the
              student program.
            </p>
            <FlowDiagram
              caption="The same project and UCSB XRP API are used on both targets. The IDE and Monitor coordinate the selected project, target state, commands, output, and telemetry."
              columns={3.5}
              description="A student project calls the UCSB XRP API and XRPBot hardware boundary. XRPBot runs against either the virtual XRP or the physical XRP. The IDE and Monitor control and observe both targets."
              edges={systemEdges}
              nodes={systemNodes}
              rows={2}
              title="UCSBXRP system boundary"
            />
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
                  Compares requested wheel speed with the latest measured
                  estimate and returns left and right motor commands. The
                  provided proportional controller requires no history.
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
                  Finds a connected route through free cells in a project map.
                  It does not need to retain state between planning calls.
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
