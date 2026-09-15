import type { ReactNode } from "react";

import apiCatalog from "../../../course_content/api-reference.json";
import projectCatalog from "../../../vendor/current/project_catalog.json";
import { CourseHeader } from "../../shared/CourseHeader";
import { useHashTarget } from "../../shared/useHashTarget";
import { CopyCode } from "../../shared/CopyCode";
import { MarkdownArticle } from "../../shared/MarkdownArticle";
import routerInstructions from "../../../docs/ARCHER_AX21_SETUP.md?raw";
import savedTelemetryInstructions from "../../../docs/TELEMETRY_FORMAT.md?raw";

import {
  ControlCycleFlow,
  ProjectStructureFlow,
  SystemBoundaryFlow,
} from "./CourseFlows";

// Keep the copyable MATLAB example and its source document synchronized.
const telemetrySections = savedTelemetryInstructions.split(
  /```matlab\n([\s\S]*?)```/,
);

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
          <a href="#components">04 Implement and test a class</a>
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
              behavior.
            </p>
            <p>
              Use the latest version of <strong>Google Chrome</strong> on
              Windows or macOS. Chrome is the primary course browser because
              Working folders require browser folder access and XRP setup uses
              USB device access. The latest Microsoft Edge on Windows or macOS
              is the supported alternative. Safari, Firefox, phones, and tablets
              may display these pages, but they do not provide the complete
              project-folder and USB setup workflow.
            </p>
          </section>

          <GuideSection id="virtual-run" number="01" title="First virtual run">
            <ol className="procedure">
              <li>
                Open the <a href="../workspace/?mode=ide">IDE</a> in Chrome. The
                first-project dialog appears automatically. A{" "}
                <strong>Working folder</strong> is the parent folder that will
                contain your named Project folders.
              </li>
              <li>
                In <strong>Create your first Project</strong>, select{" "}
                <strong>Choose folder and create Project</strong>. Chrome asks
                for the parent folder; Documents is a useful choice. The IDE
                creates <code>my_demo_spiral_01</code> automatically. When a
                Working folder is already selected, use{" "}
                <strong>Create Project</strong>. Occupied names advance to the
                next unused number. The Project contains the Expanding spiral
                virtual program. Use
                <strong> Open existing Project</strong> for prior work, or
                <strong> Reconnect existing work</strong> when Chrome needs
                permission again. No USB setup is needed for virtual use.
              </li>
              <li>
                Leave <strong>Virtual XRP</strong> selected. Select{" "}
                <strong>Compile</strong> and resolve any reported error, then
                select <strong>Run</strong>.
              </li>
              <li>
                Select <strong>Monitor</strong> or <strong>Side by side</strong>
                in the workspace header to inspect the world, telemetry, and
                plots. Both views show the same target and Run/Stop state.
              </li>
            </ol>
            <p>
              <strong>Use read-only preview</strong> dismisses this offer
              without creating files. The header&apos;s
              <strong> Create first Project</strong> button brings it back.
              Guide and API open beside the workspace; the IDE, Monitor, and
              Stop remain available while you consult them.
            </p>
            <h3>Suggested first-use path</h3>
            <p>
              Use Tutorials 1–4 as needed for Python, project, and Monitor
              orientation. Their checks run without either robot, and their
              examples run on the Virtual XRP. Complete Tutorial 5 before the
              first Physical XRP run; it identifies the bounded raised-wheel
              check. The full{" "}
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
                <strong>Stop</strong> cancels a pending Run or ends the running
                program. On a physical XRP, the course runtime also commands
                zero motor drive.
              </li>
              <li>
                <strong>Reset</strong> stops the program and clears live values
                from the selected target. It returns the virtual XRP to its
                initial pose. On a physical XRP, the Wi-Fi connection remains
                available for the next Run. The completed Monitor recording and
                notes remain available for export until the next Run or
                <strong> Clear run</strong>.
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
                  the Working folder and opens it. To inspect a ready-to-run
                  challenge, select <strong>complete challenges</strong> on Home
                  first. The revealed demonstrations use the supplied reference
                  classes and intentionally omit student component files and
                  component checks; they do not change the student challenge
                  projects.
                </dd>
              </div>
              <div>
                <dt>Open project…</dt>
                <dd>
                  Open an existing Project folder already inside the Working
                  folder. This does not create or copy files.
                </dd>
              </div>
              <div>
                <dt>Rename project…</dt>
                <dd>
                  Change the saved display name shown in UCSBXRP. The folder on
                  disk keeps its name and all existing run data. To change the
                  folder name itself, close its UCSBXRP windows first, rename it
                  in Finder or File Explorer, then use Open project to select it
                  again.
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
              Wait for the save state to report that files are current. A
              pending operation names its phase and shows elapsed time for
              longer waits. Do not repeat Run while compilation or transfer is
              pending; use Stop to cancel. A failed Stop is not confirmation
              that the Physical XRP stopped.
            </p>
            <p>
              For interrupted saves, folder permission or extra editors, see{" "}
              <a href="#recovery">Recovery and other open windows</a>.
            </p>
            <p>
              To reuse work in a different challenge, select{" "}
              <strong>Continue in another project…</strong>. Choose the target
              and inspect the <strong>Preserve</strong>, <strong>Merge</strong>,
              <strong> Replace</strong>, <strong>Add</strong>, and
              <strong> Leave in the source project</strong> lists before
              creating a separate project. The current project is not changed.
              Use <strong>New project…</strong> instead when you want a clean
              template.
            </p>
            <p>
              New Projects record their supplied template and course release.
              <strong> Settings → Review supplied template</strong> compares
              that template with this release and can create a separate updated
              Project. Edited component files, settings, and other student files
              are preserved; any retained conflicts require manual comparison.
              Older Projects without provenance remain readable.
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
                <p>
                  The five projects prefixed <code>new_challenge_</code> form a
                  revised candidate sequence: Robot curling, Arena line circuit,
                  Waypoint courier, Mapped route, and Out and back. Use the
                  sequence assigned by your instructor. The established
                  challenges remain available with their original identifiers;
                  catalog numbering alone does not prescribe teaching order.
                  Each README identifies the components used in that project.
                </p>
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
              the selected <code>DifferentialDrive</code>,{" "}
              <code>WheelSpeedController</code>, <code>SensorModel</code>, and{" "}
              <code>Odometry</code> classes, and returns the newest measurements
              and odometry pose together in one <code>RobotState</code>.
            </p>
            <ControlCycleFlow />
            <h3>Where project values and selected classes come from</h3>
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
                  obstacles, optional floor tracks, changeable features, and
                  markers.
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
                  the supplied class or the class in each named component
                  project file.
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
                <code>component project files</code>
                <span>
                  Define the classes you implement, such as{" "}
                  <code>sensor_model.py</code> or <code>odometry.py</code>.
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
            <details className="world-schema">
              <summary>Recognized world.json fields</summary>
              <p>
                The root contains <code>default_world</code> and a{" "}
                <code>worlds</code> list. Each world contains <code>id</code>,{" "}
                <code>label</code>, <code>bounds</code> ({" "}
                <code>minimum_x_mm</code>, <code>minimum_y_mm</code>,{" "}
                <code>maximum_x_mm</code>, <code>maximum_y_mm</code>), and may
                contain <code>initial_pose</code> (<code>x_mm</code>,{" "}
                <code>y_mm</code>, <code>heading_rad</code>),{" "}
                <code>obstacles</code>, <code>tracks</code>,{" "}
                <code>markers</code>, and{" "}
                <code>range_sensor.include_arena_boundary</code>.
              </p>
              <ul>
                <li>
                  An obstacle has type <code>wall</code> or <code>block</code>,
                  the four millimeter bounds, and optional <code>label</code>{" "}
                  and <code>feature</code> name.
                </li>
                <li>
                  A floor track has type <code>line</code>,{" "}
                  <code>width_mm</code>, <code>darkness</code> from 0 (light) to
                  1 (dark), optional <code>name</code> and <code>label</code>, a{" "}
                  <code>closed</code> Boolean, and two or more{" "}
                  <code>points</code> with <code>x_mm</code> and{" "}
                  <code>y_mm</code>.
                </li>
                <li>
                  Marker types <code>start_line</code> and{" "}
                  <code>finish_line</code> use <code>x1_mm</code>,{" "}
                  <code>y1_mm</code>, <code>x2_mm</code>, and <code>y2_mm</code>
                  . <code>start_box</code> and <code>finish_box</code> use the
                  four bounds. <code>waypoint</code> uses <code>x_mm</code>,{" "}
                  <code>y_mm</code>, and optional <code>heading_rad</code>;{" "}
                  <code>marker</code> uses <code>x_mm</code> and{" "}
                  <code>y_mm</code>. Every marker may have a <code>name</code>{" "}
                  and <code>label</code>.
                </li>
              </ul>
              <p>
                Coordinates and dimensions are millimeters; headings are
                radians. Geometry must lie inside its world bounds. The Author
                graphic editor covers bounds, pose, obstacles, and markers; use
                Advanced world.json for tracks and other supported fields.
              </p>
            </details>
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
            title="Implement and test a class"
          >
            <h3>Implement the class</h3>
            <details id="python-basics">
              <summary>Python details for MATLAB users</summary>
              <ul>
                <li>
                  Python indexes lists from <code>0</code>.{" "}
                  <code>range(4)</code> gives 0, 1, 2, 3. Use{" "}
                  <code>len(values)</code> for length and{" "}
                  <code>values.append(value)</code> to add one item.
                </li>
                <li>
                  Use <code>**</code> for powers, <code>==</code> for comparison
                  and <code>=</code> for assignment. Indented blocks replace
                  MATLAB's <code>end</code>; use four spaces consistently.
                </li>
                <li>
                  <code>None</code> means unavailable. Test{" "}
                  <code>value is None</code> before arithmetic. A missing range
                  is not zero distance.
                </li>
                <li>
                  <code>self</code> identifies one object inside its methods.
                  Values such as <code>self.previous_time_ms</code> persist
                  between calls; reset them in <code>reset()</code> before a new
                  run.
                </li>
                <li>
                  <code>from module import Name</code> loads a name from another
                  file or library. Do not append <code>.py</code> to an import
                  or run another file just to import its functions.
                </li>
                <li>
                  <code>try</code> begins work that needs cleanup. Its matching{" "}
                  <code>finally</code> runs when that work returns, finishes or
                  raises an exception. A forced worker termination or power loss
                  can prevent Python cleanup; UCSBXRP's Stop mechanism
                  separately ends execution.
                </li>
              </ul>
            </details>
            <p>
              Complete the required methods of the class in its named project
              file, such as <code>SensorModel</code> in{" "}
              <code>sensor_model.py</code>. This is not an IDE command. Read the
              challenge README and the class&apos;s{" "}
              <a href={componentReference}>API entry</a>, then replace each{" "}
              <code>NotImplementedError</code> with method code. Keep the
              supplied class name, method names, arguments, and return types.
              The class may retain the state identified by its API entry; do not
              add target-specific Virtual or Physical XRP code.
            </p>
            <h3>Test the class</h3>
            <p>
              Start with one known input and compare the returned value and
              units. A successful Compile establishes valid syntax, not a
              correct algorithm. A passing component example checks only that
              example; follow it with the experiments in the project README.
            </p>
            <details id="debugging-values">
              <summary>
                Inspect an intermediate value without flooding Program output
              </summary>
              <CopyCode
                code={
                  'from ucsb_xrp import live\n\n# Place these lines in the loop after calculating target_speed_mm_s.\nmeasured_speed_mm_s = state.measurements.left_speed_mm_s\nerror_mm_s = target_speed_mm_s - measured_speed_mm_s\nlive.watch("speed_error_mm_s", error_mm_s, unit="mm/s", label="Speed error")\nlive.plot("speed_error_mm_s", error_mm_s, unit="mm/s", label="Speed error")'
                }
              />
              <p>
                Watch shows the latest value; plot preserves its time history in
                Monitor. Print short milestones such as “planning complete”. For
                an exception, start at the last project file and line in the
                traceback, inspect its inputs, then repeat the smallest failing
                case. Retain the original traceback when asking for help.
              </p>
            </details>
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
                Implement one method in the class&apos;s named project file.
              </li>
              <li>
                Select <strong>Test components</strong> and read every result in
                Program output.
              </li>
              <li>
                Repeat until the methods in that class report PASS for the
                supplied examples. Methods in other project files may still
                report NOT IMPLEMENTED.
              </li>
              <li>
                In <code>course_setup.py</code>, set the corresponding{" "}
                <code>USE_STUDENT_*</code> value to <code>True</code> to select
                the class from that project file.
              </li>
              <li>Run the complete challenge on the Virtual XRP.</li>
            </ol>
            <p>
              PASS applies only to the stated method examples. These checks do
              not establish correct timing, interaction among classes, or
              completion of the challenge. A NOT IMPLEMENTED result does not
              prevent checks of other methods. Run the complete project on the
              Virtual XRP after the method examples pass. Each class&apos;s
              purpose, retained state, arguments, return values, and required
              behavior are in the{" "}
              <a href={componentReference}>class API reference</a>.
            </p>
          </GuideSection>

          <GuideSection
            id="physical-xrp"
            number="05"
            title="Physical XRP setup and networks"
          >
            <p>
              Use <a href="../commission/">Set up or Repair</a> before the XRP
              is used for the first time, and return to it when the course
              software or network settings need to be repaired or updated. Open
              it in the latest Chrome on Windows or macOS; the latest Edge is
              the supported alternative. Connect the XRP by USB-C while the
              setup page verifies the controller, installs or repairs the
              UCSBXRP runtime, configures Wi-Fi, restarts the robot, and
              verifies its network address. After setup, project transfer, Run,
              Stop, Reset, program output, and telemetry use Wi-Fi, not USB.
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
            <details id="class-router">
              <summary>Set up a dedicated course router (Archer AX21)</summary>
              <MarkdownArticle source={routerInstructions} />
            </details>
            <p>
              For an interrupted setup, see{" "}
              <a href="#setup-recovery">Resume incomplete commissioning</a> in
              Troubleshooting.
            </p>
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
            <p>
              Physical transfer accepts at most 48 project files, a 16 KiB
              <code> world.json</code>, and a 128 KiB encoded command. Keep
              projects compact; simplify a world or remove unused project files
              if the IDE reports a transfer limit. Virtual execution does not
              establish that a larger project fits the controller.
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
              started in either app write program output to the IDE terminal;
              connection, transfer, Run, Stop, and Reset events appear in its
              System log.
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
                <dt>Wheel speeds</dt>
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
              <strong>Clear run</strong> clears the displayed completed history
              without resetting the robot. Drag a separator to resize the world,
              telemetry, or plots.
            </p>
            <p>
              A program can add controls with <code>ucsb_xrp.live</code>.{" "}
              <code>live.watch()</code> shows the latest named value;{" "}
              <code>live.plot()</code> adds a named numerical signal to the Plot
              signals list. Each Run automatically creates one run dataset from
              its telemetry and notes, including when only the IDE is open.
              While the program is active, the plots show that run as it
              develops. When it stops or completes, Monitor retains the
              completed run for inspection and export.
            </p>
            <p>
              Automatic archives belong to the Project that supplied the Run,
              even if another window later selects a different Project. Notes
              update that same saved run while it remains among the four saved
              generations. If Monitor cannot verify the destination, or a run
              has rotated out, export the displayed data and notes before
              closing the page. The save message states the actual outcome.
            </p>
            <p>
              After reopening a Project, choose <strong>Open saved run…</strong>
              under <strong>Run data</strong> to inspect one of its four
              retained trials. The world, plots and notes show the selected
              trial;
              <strong> Live telemetry</strong> continues to show the current
              XRP. Opening a saved trial does not run the robot.
            </p>
            <p>
              Virtual data includes physics steps, actuator changes, and course
              state updates. Several observations can share the same simulation
              time and physics sequence number. CSV <code>observation_seq</code>
              preserves their order; <code>physics_step_seq</code> identifies
              the physics step. On the physical XRP, <code>seq</code> identifies
              an acquired sensor sample. Use <code>clock_id</code>,{" "}
              <code>acquisition_seq</code> and <code>acquired_at_s</code> for
              sensor timing; <code>t_s</code> retains the display clock. Do not
              infer duration or sampling rate from the number of CSV rows.
            </p>
            <ol className="procedure">
              <li>
                Run the project. No separate recording action is required.
              </li>
              <li>
                Select <strong>Add note</strong> to mark an observation, or
                right-click a strip plot at the time of interest. Use the notes
                list to review or edit the text. Notes belong to the displayed
                run; their numbered world markers keep the trajectory legible.
              </li>
              <li>
                Export the displayed run as a telemetry-and-notes CSV, export
                the visible plots as SVG or PNG, or export the world animation
                as WebM. Every export uses the same displayed run; animation
                export does not run the robot again.
              </li>
            </ol>
            <details id="telemetry-files">
              <summary>Saved data, timestamps, and MATLAB plotting</summary>
              <MarkdownArticle source={telemetrySections[0] ?? ""} />
              {telemetrySections[1] ? (
                <CopyCode
                  code={telemetrySections[1].trim()}
                  label="Copy MATLAB example"
                />
              ) : null}
              <MarkdownArticle source={telemetrySections[2] ?? ""} />
            </details>
          </GuideSection>

          <GuideSection id="offline-use" number="07" title="Offline use">
            <p>
              Chrome automatically saves a complete copy of the UCSBXRP course
              pages after one online load. The copy belongs to the Chrome
              profile on that computer; it is not stored in the Working folder.
              The Working folder contains Project folders, saved run data, and
              exports.
            </p>
            <h3>Prepare before class</h3>
            <ol className="procedure">
              <li>
                While the computer has internet access, open the UCSBXRP home
                page in the Chrome profile you will use in class. Wait until it
                reports <strong>Ready without internet</strong>.
              </li>
              <li>
                Bookmark that home-page address, then choose a Working folder in
                the IDE. The IDE, Monitor, Guide, API reference, virtual XRP,
                and setup page are already included; they do not need to be
                opened separately. The Working folder also receives an
                operating-system launcher named <code>Open UCSBXRP.html</code>.
              </li>
            </ol>
            <h3>Reopen without internet</h3>
            <ol className="procedure">
              <li>
                Open the same UCSBXRP web address in the same Chrome profile on
                the same computer, normally through the bookmark. The ordinary
                browser tab works after Chrome has been closed and while the
                computer has no internet connection. A search result or a
                different web address still requires internet. You may instead
                double-click
                <code>Open UCSBXRP.html</code> in the Working folder.
              </li>
              <li>
                Reconnect the Working folder if Chrome asks for permission. The
                Project folders remain ordinary folders on the computer.
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
            <p>
              A complete cached release remains usable when the computer is
              connected to Wi-Fi but the internet does not respond. An older
              open workspace keeps its required files during an update. Export
              any retained run or notes, then use <strong>Clear run</strong>
              when you are ready to let Monitor adopt a waiting update. Resolve
              any unsaved-run warning first; clearing the display does not
              release a recovery copy.
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
            <h3 id="recovery">Recovery and other open windows</h3>
            <p>
              Settings lists retained unsaved copies separately from saved
              Project files. Export a recovery copy before clearing browser
              data. An interrupted folder save or externally changed file opens
              a recovery choice; retain the wanted version as a separate Project
              before continuing. A cancelled folder or Project choice leaves the
              current Project selected.
            </p>
            <p>
              <strong>Save pending</strong> can mean another editor is still
              writing. Let it finish and retry. If every editor of that folder
              is closed, use <strong>Review pending writers</strong> in the
              Project chooser or Settings. Confirm only after closing those
              editors; then choose which complete recovery copy to retain.
            </p>
            <p>
              Use one editing window for a Project. Another IDE can show the
              same XRP, but <strong>Use this IDE</strong> explicitly selects
              which source supplies Run. On a Physical XRP, another browser or
              computer can observe status and request Stop. Take control only
              after the XRP is stopped. Switching windows does not transfer
              control automatically. Close extra editors before resolving a save
              conflict; operating-system folder copies with identical Project
              identities require a new saved Project copy before automatic run
              archiving.
            </p>
            <p>
              If the browser asks whether to leave, choose <strong>Stay</strong>{" "}
              to keep the page and its unsaved work open. Attempting to leave
              the window where you started Run cancels its preparation or stops
              its program. Wait for its run data to save, then use{" "}
              <strong>Run</strong> again when ready. Leaving an observing
              Monitor does not stop another window&apos;s program.
            </p>
            <h3>Run data has not saved</h3>
            <p>
              Keep the page open. Wait while saving is in progress; if it fails,
              restore access to the original Project folder and use
              <strong> Retry run save</strong>. In Monitor, the affected trials
              appear under <strong>Controls → Run data</strong>. Use
              <strong> Download retained run</strong> to keep a recovery JSON
              containing that trial&apos;s CSV, output and notes. Verify the
              download before discarding its retained copy. Reset or clearing
              the display does not discard unsaved data.
            </p>
            <p>
              Resolve the warning before starting another Run. If other open
              windows fill Monitor&apos;s four-run recovery limit, a new run is
              explicitly marked as not being recorded. Live telemetry and Stop
              remain available. Recover the retained trials, then start a new
              run; recording does not resume halfway through a run. The IDE
              requires <strong>I saved the recovery file</strong> after a
              recovery download. This confirms your separate copy, not a
              repaired Project archive.
            </p>
            <h3 id="setup-recovery">Resume incomplete commissioning</h3>
            <p>
              If you exit after USB installation but before Wi-Fi verification,
              reopen setup and reconnect the same Working folder. The saved
              setup checkpoint lets you finish the connection check. Follow a
              requested USB repair if installation was interrupted. Leaving the
              page does not undo firmware or files already written.
            </p>
            <ul className="procedure troubleshooting-list">
              <li>
                <strong>Working-folder or USB controls are unavailable:</strong>{" "}
                use the latest Chrome on Windows or macOS. The latest Edge is
                the supported alternative. Reopen the page in that browser
                rather than continuing in Safari, Firefox, a phone, or a tablet.
              </li>
              <li>
                <strong>No project is open:</strong> choose the Working folder
                that contains the named Project folders. Select{" "}
                <strong>Open project…</strong> for an existing folder or{" "}
                <strong>New project…</strong> to create a supplied project; do
                not select an individual Project folder as the Working folder.
              </li>
              <li>
                <strong>Compile reports an error:</strong> open{" "}
                <strong>Problems</strong>, select the reported file and line,
                and read its suggested correction.
                <strong> Compiler output</strong> retains the exact MicroPython
                message. Correct the syntax, import, entry point or project
                structure, then Compile again. A successful Compile does not
                start either XRP; select Run afterward.
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
              <li>
                <strong>When you ask course staff for help:</strong> send the
                <code> UCSBXRP_diagnostic.log</code> file from the Working
                folder and state the last action that failed. The file records
                setup, connection, Compile, Run, Stop, Reset, and save or export
                errors. It does not contain project source files or telemetry
                samples.
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
            <h3>Classes you implement</h3>
            <p>
              The six classes perform sensor interpretation, motor control,
              differential-drive conversion, pose estimation, navigation, and
              route planning. Each link opens the corresponding API entry,
              including its method signatures, arguments, return values,
              retained state, and required behavior.
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
            <h3>Target differences</h3>
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
                  <td>
                    Loaded into the browser&apos;s MicroPython runtime before
                    Run
                  </td>
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
                <tr>
                  <td>Floor reflectance</td>
                  <td>Computed from optional world tracks (0 light, 1 dark)</td>
                  <td>
                    Optional left/right sensors; calibrate for tape, floor,
                    mounting, and ambient light
                  </td>
                </tr>
              </tbody>
            </table>
            <p>
              The <a href="../reference/">UCSB XRP API reference</a> gives the
              complete class, method, argument, return-value, and unit
              definitions.
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
