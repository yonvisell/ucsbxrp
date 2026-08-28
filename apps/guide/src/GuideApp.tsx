import type { ReactNode } from "react";

import apiCatalog from "../../../course_content/api-reference.json";
import projectCatalog from "../../../vendor/current/project_catalog.json";
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
const publishedProjects = projectCatalog.filter((project) => project.published);

export function GuideApp() {
  useHashTarget();

  return (
    <div className="guide-app">
      <CourseHeader active="guide" className="guide-header" />

      <div className="guide-layout">
        <nav className="guide-toc" aria-label="Guide sections">
          <a href="#virtual-run">01 First virtual run</a>
          <a href="#projects">02 Projects and files</a>
          <a href="#project-structure">03 Python project structure</a>
          <a href="#components">04 Implement and test a component</a>
          <a href="#physical-xrp">05 Physical XRP setup and networks</a>
          <a href="#monitor">06 Inspect and export run data</a>
          <a href="#offline-use">07 Offline use</a>
          <a href="#github">08 Team version control</a>
          <a href="#shortcuts">09 Keyboard commands</a>
          <a href="#troubleshooting">10 Troubleshooting</a>
          <a href="#technical-overview">A Virtual and physical targets</a>
        </nav>

        <main className="guide-content">
          <section className="guide-intro">
            <h1>Guide</h1>
            <p>
              Use the IDE to create or open a Project folder, implement and test
              Python components, then run the same project on the Virtual XRP or
              a commissioned Physical XRP. Use the Monitor to inspect and export
              run data. The <a href="../reference/">API reference</a> gives the
              required classes, methods, arguments, return values, units, and
              examples.
            </p>
            <p>
              Use the current desktop version of <strong>Google Chrome</strong>{" "}
              on Windows or macOS. Chrome is the primary course browser because
              Working folders require browser folder access and XRP setup uses
              USB device access. Current desktop Microsoft Edge is the supported
              Chromium alternative. Safari, Firefox, phones, and tablets may
              display these pages, but they do not provide the complete
              project-folder and USB setup workflow.
            </p>
          </section>

          <GuideSection id="virtual-run" number="01" title="First virtual run">
            <ol className="procedure">
              <li>
                Open the <a href="../ide/">IDE</a> in Chrome. When prompted,
                choose a <strong>Working folder</strong>: the parent folder that
                will contain all of your named Project folders.
              </li>
              <li>
                If the Working folder is empty, the IDE creates and opens an
                Expanding Spiral demo. Otherwise, select{" "}
                <strong>New project…</strong> to create a project or{" "}
                <strong>Open project…</strong> to open an existing Project
                folder.
              </li>
              <li>
                Leave <strong>Virtual XRP</strong> selected. Select{" "}
                <strong>Compile</strong> and resolve any reported error, then
                select <strong>Run</strong>.
              </li>
              <li>
                Open the <a href="../monitor/">Monitor</a> in another tab to
                inspect the world, telemetry, and plots. IDE and Monitor show
                the same selected target and Run/Stop state.
              </li>
            </ol>
            <h3>Course sequence</h3>
            <p>
              Complete Tutorials 1–5 in order before Challenge 1. Tutorial
              checks run without either robot. Run Tutorials 2–5 on the Virtual
              XRP after their checks pass. Tutorial 5 identifies the bounded
              motor test to perform on a commissioned Physical XRP. The full{" "}
              <a href="#project-lists">tutorial, challenge, and demo lists</a>{" "}
              are below.
            </p>
            <h3>IDE controls</h3>
            <ul className="action-list">
              <li>
                <strong>Compile</strong> checks the project structure and
                compiles every Python file with MicroPython. It does not start
                either XRP. Use it before the first Run and after resolving a
                syntax or import error.
              </li>
              <li>
                <strong>Run</strong> compiles changed files when necessary,
                sends the project to the selected target, and starts its entry
                point, normally <code>main.py</code>.
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
                On a physical XRP, <strong>Run</strong> sends the current
                project over the selected Wi-Fi connection. It does not install
                the course software; use <strong>Set up or Repair</strong> for
                that USB operation.
              </li>
            </ul>
          </GuideSection>

          <GuideSection id="projects" number="02" title="Projects and files">
            <p>
              The <strong>Working folder</strong> is one parent folder on your
              computer. Each project is one named{" "}
              <strong>Project folder</strong> directly inside it. Choose the
              Working folder when Chrome asks for folder access; do not choose
              one individual Project folder. The IDE shows the Working folder
              and open Project folder above the file list.
            </p>
            <div className="folder-example" aria-label="Working folder example">
              <code>UCSBXRP/</code>
              <span>├─ SpiralLab/</span>
              <span>├─ Challenge1/</span>
              <span>└─ TeamDelivery/</span>
            </div>
            <dl className="term-list project-actions">
              <div>
                <dt>New project…</dt>
                <dd>
                  Choose a supplied challenge, tutorial, or demo and give the
                  new project a name. The IDE creates a new Project folder in
                  the Working folder and opens it.
                </dd>
              </div>
              <div>
                <dt>Open project…</dt>
                <dd>
                  Open an existing Project folder already inside the Working
                  folder. This does not create or copy files.
                </dd>
              </div>
            </dl>
            <p>
              Edits save automatically to the open Project folder. The
              selected-file menu can rename, duplicate, or delete a file, or
              make a Python file the program entry point. If Chrome loses
              permission after a restart, select <strong>Reconnect</strong> and
              choose the same Working folder; the files remain on the computer.
            </p>
            <p>
              When you are ready to continue, select the visible{" "}
              <strong>Continue to Challenge…</strong> action. The IDE creates a
              separate project for the next challenge, copies the component
              implementation files used in the current project, and preserves
              which implementations are selected. New component files begin with
              the supplied implementation selected. The current project is not
              changed.
            </p>
            <div
              className="project-catalog"
              id="project-lists"
              aria-label="Available project templates"
            >
              <section>
                <h3>Challenges</h3>
                <ol>
                  {publishedProjects
                    .filter((project) => project.kind === "challenge")
                    .map((project) => (
                      <li key={project.id}>
                        <strong>{project.label}</strong> — {project.summary}
                      </li>
                    ))}
                </ol>
              </section>
              <section>
                <h3>Tutorials</h3>
                <ol>
                  {publishedProjects
                    .filter((project) => project.kind === "tutorial")
                    .map((project) => (
                      <li key={project.id}>
                        <strong>{project.label}</strong> — {project.summary}
                      </li>
                    ))}
                </ol>
              </section>
              <section>
                <h3>Demos</h3>
                <ul>
                  {publishedProjects
                    .filter((project) => project.kind === "demo")
                    .map((project) => (
                      <li key={project.id}>
                        <strong>{project.label}</strong> — {project.summary}
                      </li>
                    ))}
                </ul>
              </section>
            </div>
            <div className="callout">
              The IDE and Monitor use the selected Working folder for Project
              folders, run data, exports, and the saved Physical XRP connection.
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
                  the supplied or Project implementation of each component.
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
                <code>component implementation files</code>
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
            <h3>Implement components</h3>
            <p>
              Implementing a component means completing the required methods in
              its named Python file, such as <code>sensor_model.py</code>. This
              is not an IDE command. Read the challenge README and the
              component&apos;s <a href={componentReference}>API entry</a>, then
              replace each <code>NotImplementedError</code> with your
              implementation. Keep the supplied class name, method names,
              arguments, and return types. A component may retain the state
              identified by its API entry; do not add target-specific Virtual or
              Physical XRP code.
            </p>
            <h3>Test the component</h3>
            <p>
              <strong>Compile</strong> checks the project structure and compiles
              each Python file without starting a target.{" "}
              <strong>Test components</strong> runs the supplied{" "}
              <code>component_checks.py</code>, which calls each required method
              with small stated examples. It does not start or move either XRP.
              Do not edit the checks; use their expected and observed values to
              revise the method named in the result.
            </p>
            <div className="result-key" aria-label="Component check results">
              <div>
                <strong>PASS</strong>
                <span>The stated example produced the expected result.</span>
              </div>
              <div>
                <strong>NOT IMPLEMENTED</strong>
                <span>
                  The named method is not yet implemented and still raises{" "}
                  <code>NotImplementedError</code>.
                </span>
              </div>
              <div>
                <strong>FAIL</strong>
                <span>
                  The method ran, but its output or retained state differed from
                  the stated expected result.
                </span>
              </div>
            </div>
            <ol className="procedure">
              <li>
                Implement one method in the component&apos;s named Python file.
              </li>
              <li>
                Select <strong>Test components</strong> and read every result in
                Program output.
              </li>
              <li>
                Repeat until that component reports PASS for its supplied
                examples. Other components may still report NOT IMPLEMENTED.
              </li>
              <li>
                In <code>course_setup.py</code>, select your implementation of
                the component with its named <code>USE_STUDENT_*</code> setting.
              </li>
              <li>Run the complete challenge on the Virtual XRP.</li>
            </ol>
            <p>
              PASS applies only to the stated component examples. Component
              checks do not establish correct timing, interaction among
              components, or completion of the challenge. A NOT IMPLEMENTED
              result does not prevent checks of other methods. Run the complete
              project on the Virtual XRP after the component examples pass.
              Component roles, retained state, arguments, return values, and
              requirements are in the{" "}
              <a href={componentReference}>component API reference</a>.
            </p>
          </GuideSection>

          <GuideSection
            id="physical-xrp"
            number="05"
            title="Physical XRP setup and networks"
          >
            <p>
              Commission each robot once with{" "}
              <a href="../commission/">Set up or Repair</a> in desktop Chrome on
              Windows or macOS; desktop Edge is the supported alternative.
              Connect the XRP by USB-C while the setup page verifies the
              controller, installs or repairs the UCSBXRP runtime, configures
              Wi-Fi, restarts the robot, and verifies its network address. After
              setup, project transfer, Run, Stop, Reset, program output, and
              telemetry use Wi-Fi, not USB.
            </p>
            <ol className="procedure">
              <li>
                Connect the XRP by USB-C and select it when the browser asks.
                The device may appear as <strong>XRP Controller</strong>. Leave
                USB connected until setup finishes.
              </li>
              <li>
                Choose either <strong>Robot hotspot</strong> or{" "}
                <strong>Existing Wi-Fi</strong>. The differences are stated
                below.
              </li>
              <li>
                If the wizard reports that controller firmware is missing,
                follow its displayed BOOT and RESET instructions and select the
                temporary <code>RP2350</code> drive when prompted. Otherwise, do
                not press BOOT or RESET during setup.
              </li>
              <li>
                Follow the final Wi-Fi instruction shown on the setup page. The
                page verifies the robot identity, network mode, and address,
                then saves that connection for the IDE and Monitor. Select{" "}
                <strong>Open IDE</strong> only after setup reports completion.
              </li>
            </ol>
            <h3>Robot hotspot and station mode</h3>
            <table className="network-modes">
              <thead>
                <tr>
                  <th>Setup choice</th>
                  <th>Computer connection</th>
                  <th>Internet and local access</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Robot hotspot</td>
                  <td>
                    Join the <code>UCSB-XRP-…</code> network named by setup. The
                    XRP creates this network.
                  </td>
                  <td>
                    The computer normally loses internet access but can reach
                    that XRP locally. Load UCSBXRP online before switching, or
                    reopen its saved offline copy.
                  </td>
                </tr>
                <tr>
                  <td>Existing Wi-Fi (station mode)</td>
                  <td>
                    The XRP joins a local network. Keep the computer on that
                    same network.
                  </td>
                  <td>
                    Internet may remain available. Networks that isolate devices
                    from one another cannot carry Run or telemetry; setup must
                    successfully verify the XRP address.
                  </td>
                </tr>
              </tbody>
            </table>
            <p>
              Leave USB connected until setup finishes, but do not expect the
              IDE to run a project over the USB cable. Reopen setup from IDE
              Settings to repair the course runtime or change networks. Setup
              verifies and saves a new address; do not substitute an example
              address from another robot.
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
                  Difference between the Project&apos;s odometry estimate and
                  simulator truth. Simulator truth is not available to robot
                  code or a physical XRP.
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

          <GuideSection id="offline-use" number="07" title="Offline use">
            <p>
              UCSBXRP is a progressive web app (PWA): Chrome can save the course
              applications for later use without internet. Chrome stores this
              application copy in the browser profile, not in the Working
              folder. The Working folder contains your Project folders, run
              data, and exports.
            </p>
            <h3>Save the course applications</h3>
            <ol className="procedure">
              <li>
                While the computer has internet access, open the UCSBXRP home
                page in the Chrome profile you will use in class. Wait until the
                page reports <strong>Course apps available offline</strong>.
              </li>
              <li>
                Open the IDE and Monitor once to verify that both load, then
                choose the Working folder in the IDE. Project files remain
                ordinary files in that folder.
              </li>
              <li>
                Optionally use Chrome&apos;s install action. Installation adds
                an operating-system launcher and a separate app window. It does
                not add a file to the Working folder, and it is not required for
                offline operation.
              </li>
            </ol>
            <h3>Reopen without internet</h3>
            <ol className="procedure">
              <li>
                If installed, open <strong>UCSBXRP</strong> from the operating
                system&apos;s app launcher. It is a Chrome application, not a
                file in the Working folder.
              </li>
              <li>
                If not installed, use a bookmark or browser history to revisit
                the same UCSBXRP web address in the same Chrome profile on the
                same computer. A search result or a different address still
                requires internet.
              </li>
              <li>
                Reconnect the Working folder if Chrome asks for permission. The
                Project folders were not moved or copied by the PWA.
              </li>
            </ol>
            <div className="offline-capabilities">
              <section>
                <h3>Available without internet</h3>
                <ul>
                  <li>
                    Reopen the home page, IDE, Monitor, Guide, API reference,
                    and setup page from the saved Chrome profile.
                  </li>
                  <li>Compile and run projects on the virtual XRP.</li>
                  <li>
                    Read and write project files after granting access to their
                    Working folder. If the IDE later reports that folder access
                    is needed, select <strong>Reconnect</strong> and choose that
                    folder again.
                  </li>
                  <li>
                    Run a Physical XRP over local Wi-Fi while the computer is
                    joined to its hotspot or the same station network. Internet
                    is not required for this local connection.
                  </li>
                </ul>
              </section>
              <section>
                <h3>Limits</h3>
                <ul>
                  <li>
                    Each computer and each Chrome or Edge profile needs its own
                    first online load. The first load and each course update
                    require internet access.
                  </li>
                  <li>
                    GitHub pull, push, web searches, and external documentation
                    require internet access. A robot hotspot does not provide
                    it.
                  </li>
                  <li>
                    The IDE and Monitor require access to the selected Working
                    folder for project editing, execution, run archives, and
                    exports.
                  </li>
                  <li>
                    Clearing this site&apos;s browser data removes the saved
                    course apps and remembered folder access. It does not remove
                    any Project folder, run data, export, or saved robot setting
                    in the Working folder. Select that folder again after the
                    course applications have been saved online again.
                  </li>
                </ul>
              </section>
            </div>
            <h3>Updates</h3>
            <p>
              When UCSBXRP opens with internet access, Chrome checks for a newer
              course release. <strong>Course update ready</strong> means the new
              application files are already saved. The page waits for a run,
              file save, setup action, or export to finish before reopening. An
              application update does not replace Project folders. After a page
              reopens, reconnect the Working folder if requested and wait for
              the selected XRP to report ready before running.
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
                <strong>Working-folder or USB controls are unavailable:</strong>{" "}
                use current desktop Chrome on Windows or macOS. Current desktop
                Edge is the supported alternative. Reopen the page in that
                browser rather than continuing in Safari, Firefox, a phone, or a
                tablet.
              </li>
              <li>
                <strong>No project is open:</strong> choose the Working folder
                that contains the named Project folders. Select{" "}
                <strong>Open project…</strong> for an existing folder or{" "}
                <strong>New project…</strong> to create a supplied project; do
                not select an individual Project folder as the Working folder.
              </li>
              <li>
                <strong>Compile reports an error:</strong> read System log for
                the file and line, correct the syntax, import, entry point, or
                project-structure error, then Compile again. A successful
                Compile does not start either XRP; select Run afterward.
              </li>
              <li>
                <strong>Run starts but the program fails:</strong> read Program
                output for the Python exception and traceback. System log
                separately reports preparation, connection, transfer, Run, Stop,
                and Reset events.
              </li>
              <li>
                <strong>The Virtual XRP is preparing:</strong> wait for Chrome
                to prepare the runtime and complete its one automatic page
                refresh. Run becomes available when the status reports ready.
              </li>
              <li>
                <strong>The physical XRP is unreachable:</strong> confirm that
                Physical XRP is selected. For a Robot hotspot, join the exact{" "}
                <code>UCSB-XRP-…</code> network shown by setup. For station
                mode, put the computer on the same local network and verify that
                the network permits devices to reach one another. USB-C does not
                carry Run or telemetry. If the saved network is wrong, connect
                USB-C and open <a href="../commission/">Set up or Repair</a>.
              </li>
              <li>
                <strong>The Working folder is disconnected:</strong> select{" "}
                <strong>Reconnect</strong> and choose the same parent folder.
                This restores permission; it does not recover files from a
                different folder.
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
                the named component file and implement that method. NOT
                IMPLEMENTED is distinct from FAIL, and it does not prevent
                checks of other methods.
              </li>
              <li>
                <strong>UCSBXRP does not reopen offline:</strong> use the same
                address and Chrome profile that previously reported Course apps
                available offline. A new profile, another browser, cleared site
                data, or a different address requires another online load.
              </li>
            </ul>
            <div className="source-links">
              <a href="../reference/">UCSB XRP API reference</a>
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
            title="Virtual and physical targets"
          >
            <p>
              <strong>Virtual XRP</strong> runs the project against simulated
              motors and sensors in Chrome. <strong>Physical XRP</strong> sends
              the same Project folder to MicroPython on the RP2350 and uses the
              robot&apos;s motors and sensors. Both targets import the same UCSB
              XRP API. <code>XRPBot</code> connects that API to simulated XRPLib
              or physical XRPLib; sensing, control, odometry, navigation,
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
