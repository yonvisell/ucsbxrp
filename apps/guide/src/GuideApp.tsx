import type { ReactNode } from "react";

import apiCatalog from "../../../course_content/api-reference.json";
import { CourseHeader } from "../../shared/CourseHeader";
import { useHashTarget } from "../../shared/useHashTarget";
import {
  ControlCycleFlow,
  ProjectStructureFlow,
  SystemBoundaryFlow,
} from "./CourseFlows";

const componentReference = "../reference/#components";
const componentEntries =
  apiCatalog.sections.find((section) => section.id === "components")?.entries ??
  [];

export function GuideApp() {
  useHashTarget();

  return (
    <div className="guide-app">
      <CourseHeader active="guide" className="guide-header" />

      <div className="guide-layout">
        <nav className="guide-toc" aria-label="Guide sections">
          <span>Start</span>
          <a href="#virtual-run">01 First virtual run</a>
          <a href="#projects">02 Projects and files</a>
          <span className="toc-group">Develop</span>
          <a href="#project-structure">03 Python project structure</a>
          <a href="#components">04 Implement and test a component</a>
          <span className="toc-group">Run and measure</span>
          <a href="#physical-xrp">05 Connect a physical XRP</a>
          <a href="#monitor">06 Inspect and export run data</a>
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
            <p>
              Use a current version of Google Chrome or Microsoft Edge on a
              Windows or macOS computer for project folders and USB robot setup.
              Other modern browsers can read the documentation and may run the
              virtual XRP, but they do not support every course task.
            </p>
          </section>

          <GuideSection id="virtual-run" number="01" title="First virtual run">
            <ol className="procedure">
              <li>
                Open the <a href="../ide/">IDE</a>. If prompted, choose the
                Working folder where your team will keep its projects. Leave the
                target set to <strong>Virtual XRP</strong>. A new empty Working
                folder receives the Expanding spiral project.
              </li>
              <li>
                Select <strong>Run</strong>. Run compiles the project when
                needed, then starts it.
              </li>
              <li>
                Open the <a href="../monitor/">Monitor</a> in another tab. The
                same Run/Stop state is available in both apps.
              </li>
            </ol>
            <h3>Prepare for Challenge 1</h3>
            <p>
              After the demo, complete the five tutorials in order. Each
              tutorial edits only <code>student_work.py</code> and introduces
              one programming skill used in the challenges:
            </p>
            <ol className="tutorial-path">
              <li>
                <strong>Python essentials</strong> — write and check functions,
                conditions, collections, loops, and errors without moving either
                robot.
              </li>
              <li>
                <strong>Virtual XRP drawing</strong> — define typed objects and
                a command sequence, then use the virtual robot to draw the
                result.
              </li>
              <li>
                <strong>Sampled robot programs</strong> — read a{" "}
                <code>RobotState</code>, calculate mean wheel position, and
                write a finite <code>Robot.start()</code>, <code>step()</code>,
                and <code>stop()</code> sequence.
              </li>
              <li>
                <strong>Behavior, controls, and telemetry</strong> — use
                measured state to choose motion and publish live controls,
                watched values, and plot signals in Monitor.
              </li>
              <li>
                <strong>Physical XRP deployment</strong> — rehearse with the
                Virtual XRP, then deploy a stationary measurement program to a
                commissioned physical XRP.
              </li>
            </ol>
            <p>
              Create Challenge 1 after Tutorial 5. Tutorial checks do not move
              either robot. Run Tutorials 2–5 on the Virtual XRP after their
              checks pass; Tutorial 5 then gives the exact steps for its
              physical zero-motion run.
            </p>
            <h3>IDE controls</h3>
            <ul className="action-list">
              <li>
                <strong>Run</strong> checks the project structure, compiles
                changed Python files, sends the complete project to the selected
                target when necessary, and starts the project&apos;s main Python
                file.
              </li>
              <li>
                <strong>Stop</strong> ends the running program. On a physical
                XRP, the course runtime also commands zero motor drive.
              </li>
              <li>
                <strong>Reset</strong> stops the program and clears live values
                from the selected target. It returns the virtual XRP to its
                initial pose. On a physical XRP, the Wi-Fi connection remains
                available for the next Run.
              </li>
              <li>
                <strong>Compile</strong> checks the project structure and
                compiles every Python file with MicroPython without running the
                virtual or physical XRP. Run performs this automatically when
                the files have changed.
              </li>
              <li>
                On a physical XRP, <strong>Run</strong> sends the current
                project over the selected Wi-Fi connection. It does not install
                the course software; use <strong>Set up or Repair</strong> for
                that USB operation.
              </li>
            </ul>
          </GuideSection>

          <GuideSection id="projects" number="02" title="Projects and files">
            <p>
              The <strong>Working folder</strong> is the parent folder on your
              computer. Each <strong>Current project</strong> is stored in one
              named <strong>Project folder</strong> inside it. The path above
              the IDE file list shows the open project as{" "}
              <code>./ProjectName</code>.
            </p>
            <div className="folder-example" aria-label="Working folder example">
              <code>UCSBXRP/</code>
              <span>├─ SpiralLab/</span>
              <span>├─ Challenge1/</span>
              <span>└─ TeamDelivery/</span>
            </div>
            <p>
              Select <strong>New project…</strong>, choose a challenge, demo, or
              tutorial, and enter the project name. The IDE creates its folder
              inside the Working folder and opens it. Select{" "}
              <strong>Open project…</strong> to choose another project already
              in that Working folder. Edits save automatically. The
              selected-file menu can rename, duplicate, or delete a file, or
              make a Python file the program entry point.
            </p>
            <p>
              When you are ready to continue, select the visible{" "}
              <strong>Continue to Challenge…</strong> action. The IDE creates a
              separate project for the next challenge, copies the student
              component files used in the current project, and preserves which
              student implementations are selected. New component files begin
              with the supplied implementation selected. The current project is
              not changed.
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
                    <strong>Turn and Return</strong> — calculate individual
                    wheel speeds and estimate position and heading from wheel
                    travel.
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
                <h3>Tutorials</h3>
                <ul>
                  <li>
                    <strong>1. Python essentials</strong> — practice values,
                    functions, conditions, collections, loops, and errors
                    without moving either robot.
                  </li>
                  <li>
                    <strong>2. Virtual XRP drawing</strong> — use a class,
                    lists, and loops to draw a route in the World view.
                  </li>
                  <li>
                    <strong>3. Sampled robot programs</strong> — calculate mean
                    wheel position from <code>RobotState</code>, then use the
                    sampled <code>start()</code>, <code>step()</code>, and{" "}
                    <code>stop()</code> sequence.
                  </li>
                  <li>
                    <strong>4. Behavior, controls, and telemetry</strong> —
                    implement a state-based behavior and expose live controls,
                    watched values, and plot signals.
                  </li>
                  <li>
                    <strong>5. Physical XRP deployment</strong> — rehearse on
                    the Virtual XRP, then deploy a stationary measurement
                    program to a commissioned physical XRP.
                  </li>
                </ul>
              </section>
            </div>
            <div className="callout">
              The IDE and Monitor use the selected Working folder for project
              files, run data, exports, and the robot connection setting.
            </div>
          </GuideSection>

          <GuideSection
            id="project-structure"
            number="03"
            title="Python project structure"
          >
            <p>
              <code>main.py</code> is the program entry point. Depending on the
              project, it runs a timed robot loop directly, calls a supplied
              runner or mission, or runs software-only checks. In a robot loop,
              <code>main.py</code> or the supplied mission passes one{" "}
              <code>MotionCommand</code> at a time to <code>Robot.step()</code>.{" "}
              <code>Robot</code> keeps samples at the configured interval, calls
              the selected components, and returns the newest measurements and
              odometry pose together in one <code>RobotState</code>.
            </p>
            <ControlCycleFlow />
            <h3>Where project values and implementations come from</h3>
            <ProjectStructureFlow />
            <div className="project-files-summary">
              <div>
                <code>challenge.py</code>
                <span>
                  Reads task geometry from <code>world.json</code> and defines
                  the other named settings used by the program.
                </span>
              </div>
              <div>
                <code>world.json</code>
                <span>
                  Defines one or more named worlds: arena size, initial pose,
                  obstacles, changeable features, and markers.
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
                  Constructs supplied services. In challenges, it also chooses
                  the supplied or student version of each component.
                </span>
              </div>
              <div>
                <code>main.py</code>
                <span>
                  Starts the project. It may run a loop, call a supplied mission
                  or runner, or perform software-only work.
                </span>
              </div>
              <div>
                <code>README.md</code>
                <span>
                  Describes the project, the work to complete, and how to check
                  the result.
                </span>
              </div>
              <div>
                <code>student component files</code>
                <span>
                  Contain the course components you implement, such as
                  <code> sensor_model.py</code> or <code>odometry.py</code>.
                </span>
              </div>
              <div>
                <code>component_checks.py</code> or{" "}
                <code>exercise_checks.py</code>
                <span>
                  Runs supplied examples that report which required behaviors
                  are complete and which still need work.
                </span>
              </div>
            </div>
            <div className="callout">
              A project may contain several named virtual cases. With the
              Virtual XRP selected, the Monitor world selector chooses the case
              used by the simulator and by <code>load_world()</code> for that
              run without changing the saved <code>world.json</code>. On a
              physical XRP, sensor readings and obstacles come from the actual
              arena; changing the displayed world does not change the physical
              surroundings.
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
                <code>Robot.step()</code> already waits as needed to maintain{" "}
                <code>RobotConfig.sample_period_ms</code>. Adding{" "}
                <code>sleep_ms()</code> in the same loop inserts a second delay,
                so sensor samples arrive later than the configured interval.
                That changes encoder-based wheel-speed estimates and
                wheel-control behavior. Use <code>sleep_ms()</code> only outside
                a loop that calls <code>Robot.step()</code>.
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
            title="Implement and test a component"
          >
            <h3>Implement a component</h3>
            <p>
              A challenge provides one named Python file for each component you
              implement. Read the challenge README for the task and the named
              component section in the{" "}
              <a href={componentReference}>API reference</a> for its inputs,
              return values, retained information, and required behavior. The
              starter class already inherits the correct base class. Replace
              each <code>NotImplementedError</code> with your calculation; do
              not rename the class or its public methods.
            </p>
            <h3>Test the component</h3>
            <p>
              <strong>Compile</strong> checks the project structure and compiles
              each Python file without running it.{" "}
              <strong>Test components</strong> then calls the student methods
              with stated example inputs. These checks do not move the virtual
              or physical XRP. Read the expected result shown for a failed
              example, revise the named method, and run the checks again. Do not
              edit the supplied <code>component_checks.py</code>.
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
              Component purposes, retained state, arguments, return values, and
              method requirements are in the{" "}
              <a href={componentReference}>student component reference</a>.
            </p>
          </GuideSection>

          <GuideSection
            id="physical-xrp"
            number="05"
            title="Connect a physical XRP"
          >
            <p>
              Open <a href="../commission/">Set up or Repair</a> in Chrome or
              Edge on Windows or macOS. Connect the XRP by USB-C. The wizard
              verifies the controller, installs or repairs the UCSBXRP software,
              configures Wi-Fi, restarts the robot, and checks that the browser
              can reach it. After setup, project transfer, Run, Stop, program
              output, and telemetry use that Wi-Fi connection. USB-C is needed
              again only for setup, repair, or a network change.
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
                If the wizard reports that controller firmware is missing,
                follow its displayed BOOT and RESET instructions and select the
                temporary <code>RP2350</code> drive when prompted. Otherwise, do
                not press BOOT or RESET during setup.
              </li>
              <li>
                Follow the final Wi-Fi instruction shown on the setup page. The
                page verifies robot identity and current state, then displays a
                completion message. Select <strong>Open IDE</strong> when ready.
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
            title="Inspect and export run data"
          >
            <p>
              The Monitor shows the world view, live telemetry, program-defined
              controls and values, signal plots, and export tools. IDE and
              Monitor use the same selected target and Run/Stop state. Runs
              started in either app write program output and target events to
              the IDE terminal.
            </p>
            <dl className="term-list">
              <div>
                <dt>IDE output panel</dt>
                <dd>
                  Program output and Python exceptions appear under Program
                  output. Compilation, project preparation, connection, Run,
                  Stop, and reset events appear under System log.
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
              A program can add controls with <code>ucsb_xrp.live</code>.{" "}
              <code>live.watch()</code> shows the latest named value;{" "}
              <code>live.plot()</code> adds a named numerical signal to the Plot
              signals list. Each Run automatically creates one run dataset from
              its telemetry and notes. While the program is active, the plots
              show that run as it develops. When it stops or completes, Monitor
              retains the completed run for inspection and export.
            </p>
            <ol className="procedure">
              <li>
                Run the project. No separate recording action is required.
              </li>
              <li>
                If useful, right-click a strip plot and add a short note at the
                selected time. Notes belong to the displayed run.
              </li>
              <li>
                Export the displayed run as a telemetry-and-notes CSV, export
                the visible plots as SVG or PNG, or export the world animation
                as WebM. Every export uses the same displayed run; animation
                export does not run the robot again.
              </li>
            </ol>
          </GuideSection>

          <GuideSection
            id="offline-use"
            number="07"
            title="Using UCSBXRP without internet"
          >
            <p>
              UCSBXRP is a progressive web app (PWA): after one complete online
              load, Chrome keeps the course application files in its own browser
              storage. This stored copy is separate from the Working folder,
              which contains project source, recordings, and exports.
            </p>
            <h3>First online load</h3>
            <ol className="procedure">
              <li>
                Open the UCSBXRP home page while the computer has internet
                access, then open the IDE and Monitor once. Chrome saves the
                course application files automatically.
              </li>
              <li>
                Choose a Working folder in the IDE. Project files are ordinary
                files in that folder; Chrome does not store the course app
                there.
              </li>
              <li>
                If Chrome offers <strong>Install UCSBXRP app</strong>, install
                it. This adds a launcher and separate app window, but it is not
                required for offline use.
              </li>
            </ol>
            <h3>Opening UCSBXRP without internet</h3>
            <p>
              Reopen the installed UCSBXRP app, or revisit the same UCSBXRP
              address from the same Chrome profile. Chrome can load the saved
              IDE, Monitor, virtual XRP, Guide, API reference, and setup page.
              Another browser or Chrome profile must complete its own first
              online load.
            </p>
            <div className="offline-capabilities">
              <section>
                <h3>Available without internet</h3>
                <ul>
                  <li>
                    Close and reopen the IDE, Monitor, Guide, and API reference
                    from the same Chrome profile on that computer.
                  </li>
                  <li>Compile and run projects on the virtual XRP.</li>
                  <li>
                    Read and write project files after granting access to their
                    Working folder. If the IDE later reports that folder access
                    is needed, select <strong>Reconnect</strong> and choose that
                    folder again.
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
                    The IDE and Monitor require access to the selected Working
                    folder for project editing, execution, run archives, and
                    exports.
                  </li>
                  <li>
                    Clearing this site&apos;s browser data removes the saved
                    course apps and remembered folder access. It does not remove
                    project files or <code>.ucsbxrp.json</code> in the Working
                    folder; select that folder again to restore access.
                  </li>
                </ul>
              </section>
            </div>
            <h3>Updates</h3>
            <p>
              When UCSBXRP opens with internet access, Chrome checks for a newer
              course release. <strong>Course update ready</strong> means the new
              application files are already saved. The page waits for a run,
              file save, setup action, or export to finish before reopening.
              Application updates do not replace projects in the Working folder.
              After a page reopens, wait for the selected XRP to report ready
              before running.
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
                repository as the UCSBXRP Working folder so every named project
                folder is included in version control.
              </li>
              <li>
                In IDE <strong>Settings</strong>, choose or change the Working
                folder and select the cloned repository. Select{" "}
                <strong>New project…</strong> to create a project from a
                template, or <strong>Open project…</strong> to choose an
                existing project subfolder.
              </li>
              <li>Pull before beginning a work session.</li>
              <li>
                After the code runs correctly or a meaningful change is
                complete, review the changed files, commit with a message
                describing the result, and push.
              </li>
              <li>
                Before another teammate edits the project, they pull the latest
                commit.
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
                  <td>Compile</td>
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
                compilation, transfer, connection, and target events.
              </li>
              <li>
                <strong>The physical XRP is unreachable:</strong> confirm that
                the computer is using the robot network chosen during setup. If
                needed, connect USB-C and open{" "}
                <a href="../commission/">Set up or repair XRP</a>.
              </li>
              <li>
                <strong>The Working folder is disconnected:</strong> select{" "}
                <strong>Reconnect</strong> and choose the same folder again.
              </li>
              <li>
                <strong>No physical pose appears:</strong> confirm that the
                project uses the course <code>Robot</code> loop and that its
                odometry component returns a <code>Pose</code>. A physical XRP
                has no independent ground-truth position; the Monitor can show
                only the pose published by the running project.
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
              The same project imports the same UCSB XRP API on both targets.
              <code>XRPBot</code> connects that API either to simulated XRPLib
              devices or to the RP2350 hardware. Sensing, odometry, navigation,
              mapping, planning, and mission decisions remain in the Python
              project.
            </p>
            <SystemBoundaryFlow />
            <h3>Components you implement</h3>
            <p>
              The components form a sequence from sensor interpretation through
              motor control, pose estimation, navigation, and route planning.
              The links below use the same descriptions as the definitive API
              catalog; each API entry gives the full signatures and required
              behavior.
            </p>
            <dl className="component-overview-list">
              {componentEntries.map((component) => (
                <div key={component.id}>
                  <dt>
                    <a href={`../reference/#${component.id}`}>
                      {component.name}
                    </a>
                  </dt>
                  <dd>{component.purpose}</dd>
                </div>
              ))}
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
                  <td>Project preparation</td>
                  <td>Prepared in the virtual-run worker</td>
                  <td>Sent to the controller over Wi-Fi before Run</td>
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
              The <a href="../reference/">UCSB XRP API reference</a> gives the
              complete method definitions and examples.
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
