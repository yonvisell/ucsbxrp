import type { ReactNode } from "react";

const componentReference = "../reference/#student-components";

export function GuideApp() {
  return (
    <div className="guide-app">
      <header className="guide-header">
        <div className="brand" aria-label="UCSBXRP Guide">
          <span className="brand-mark">UCSB</span>
          <span className="brand-xrp">XRP</span>
          <span aria-hidden="true" className="brand-separator">
            |
          </span>
          <span className="brand-product">Guide</span>
        </div>
        <nav aria-label="Course applications">
          <a className="tool-link" href="../ide/">
            IDE
          </a>
          <a className="tool-link" href="../monitor/">
            Monitor
          </a>
          <a className="tool-link" href="../reference/">
            UCSB XRP API
          </a>
          <a className="tool-link" href="../commission/">
            Set up XRP
          </a>
        </nav>
      </header>

      <div className="guide-layout">
        <nav className="guide-toc" aria-label="Guide sections">
          <span>Guide</span>
          <a href="#virtual-run">Virtual XRP</a>
          <a href="#projects">Projects and course folders</a>
          <a href="#components">Component tests</a>
          <a href="#physical-xrp">Physical XRP setup</a>
          <a href="#monitor">Monitor</a>
          <a href="#project-structure">Project files and control flow</a>
          <a href="#offline-use">Offline use</a>
          <a href="#github">GitHub version control</a>
          <a href="#shortcuts">Keyboard shortcuts</a>
          <a href="#troubleshooting">Troubleshooting</a>
        </nav>

        <main className="guide-content">
          <section className="guide-intro">
            <p className="eyebrow">Student guide</p>
            <h1>Using the UCSBXRP course tools</h1>
            <p>
              Begin with the virtual XRP, save the project in a course folder,
              test each component you implement, and then run the same project
              on a physical XRP. Use the{" "}
              <a href="../reference/">UCSB XRP API reference</a> for Python
              classes, method requirements, state, return values, and units.
            </p>
          </section>

          <GuideSection
            id="virtual-run"
            number="01"
            title="Virtual XRP: run a project"
          >
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
            <p>
              <strong>Stop</strong> ends the program. <strong>Reset</strong>{" "}
              returns the virtual robot to its starting state.{" "}
              <strong>Validate</strong> checks Python files without running the
              project; it is optional because Run validates when needed.
            </p>
          </GuideSection>

          <GuideSection
            id="projects"
            number="02"
            title="Projects and course folders"
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
              <strong>New project from template</strong> asks for a project
              name, creates that folder, and opens it.{" "}
              <strong>Open project</strong> opens an existing project folder.
              After you grant the IDE access to that folder, edits save
              automatically. <strong>Duplicate file</strong> creates a copy;{" "}
              <strong>Make main</strong> chooses the file Run starts.
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
                    <strong>Mapped Route</strong> — add shortest-path grid
                    planning.
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
                    exceptions, modules, robot motion, and a finite-state
                    machine.
                  </li>
                </ul>
              </section>
            </div>
            <div className="callout">
              Before you choose a course folder, Chrome keeps a recovery copy in
              this site&apos;s browser data. That copy is not a normal file on
              your computer and is removed if the site&apos;s browser data is
              cleared. Choose a course folder before relying on the project.
            </div>
          </GuideSection>

          <GuideSection id="components" number="03" title="Component tests">
            <p>
              Challenge projects provide one focused file for each component you
              implement. <strong>Validate</strong> checks Python syntax.{" "}
              <strong>Test components</strong> runs{" "}
              <code>component_checks.py</code> in MicroPython without starting
              either robot.
            </p>
            <div className="result-key" aria-label="Component check results">
              <div>
                <strong>PASS</strong>
                <span>The tested behavior matches the stated requirement.</span>
              </div>
              <div>
                <strong>PENDING</strong>
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
              A PENDING result identifies a method that remains to be written;
              it does not prevent tests of other components. Each check examines
              a stated behavior, but the complete challenge must also be tested.
              Component responsibilities and method requirements are in the{" "}
              <a href={componentReference}>student component reference</a>.
            </p>
          </GuideSection>

          <GuideSection
            id="physical-xrp"
            number="04"
            title="Physical XRP setup"
          >
            <p>
              Open <a href="../commission/">Set up or repair XRP</a> in current
              desktop Chrome or Edge. The same action is available in IDE
              Settings. The wizard uses USB-C to identify the RP2350 controller,
              install or repair the required files, verify them, configure
              Wi-Fi, and reset the XRP. IDE Run and Monitor telemetry then use
              the selected Wi-Fi connection.
            </p>
            <ol className="procedure">
              <li>
                Connect the XRP by USB-C, then select it in the browser's device
                chooser. Leave USB connected until setup finishes.
              </li>
              <li>
                Choose the XRP's own <code>UCSB-XRP-…</code> hotspot or an
                existing local Wi-Fi network.
              </li>
              <li>
                If firmware repair is requested, put the controller in firmware
                mode and choose the temporary <code>RP2350</code> drive.
              </li>
              <li>
                Follow the displayed network instruction. After the connection
                check, the wizard opens the IDE in Physical XRP mode.
              </li>
            </ol>
            <div className="command-guide" aria-label="IDE target commands">
              <Command name="Validate">
                Check every Python file without running it.
              </Command>
              <Command name="Flash project">
                Transfer and verify without starting.
              </Command>
              <Command name="Run">
                Validate and transfer when needed, then start.
              </Command>
              <Command name="Stop">
                End the program and command zero drive.
              </Command>
              <Command name="Reset">Restart the selected target.</Command>
            </div>
            <p>
              In hotspot mode, join the network named by the wizard. In
              existing-Wi-Fi mode, the computer and XRP must be on the same
              local network. Reopen setup from IDE Settings to change the
              network or repair course software.
            </p>
          </GuideSection>

          <GuideSection
            id="monitor"
            number="05"
            title="Monitor: telemetry, controls, and output"
          >
            <p>
              The Monitor shows the simulated or measured world, live telemetry,
              controls and watch values created by the running program, signal
              histories, Program output, and the System log. The target selected
              in the IDE is also selected in the Monitor.
            </p>
            <dl className="term-list">
              <div>
                <dt>Program output</dt>
                <dd>Text printed by the project and Python exceptions.</dd>
              </div>
              <div>
                <dt>System log</dt>
                <dd>
                  Connection, validation, transfer, Run, Stop, and reset events.
                </dd>
              </div>
              <div>
                <dt>Measured wheel speed</dt>
                <dd>
                  Calculated and regularized by <code>SensorModel</code> from
                  encoder counts and sample time. The wheel controller and plot
                  use the same value.
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
              telemetry, plots, or output.
            </p>
            <p>
              A program can create sliders, toggles, and choices with{" "}
              <code>ucsb_xrp.live</code>. It may publish current intermediate
              values with <code>live.watch()</code>. These appear in Live
              controls and Watch values without repeated print statements.
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
            id="project-structure"
            number="06"
            title="Project files and control flow"
          >
            <p>
              <code>main.py</code> is mission control: it selects the task,
              obtains the configured components from{" "}
              <code>course_setup.py</code>, sends one body-motion command per
              sample, and decides when to stop. <code>Robot.step()</code> owns
              sample timing and performs the command/measurement loop below.
            </p>
            <figure className="feedback-figure">
              <div className="mission-node">
                <strong>Mission</strong>
                <code>main.py</code>
                <span>selects the task and stop condition</span>
              </div>
              <div className="flow-arrow mission-command" aria-hidden="true">
                ↓ MotionCommand
              </div>
              <div className="actuation-path" aria-label="Actuation path">
                <a href="../reference/#differential-drive">
                  <strong>DifferentialDrive*</strong>
                  <span>body motion → target wheel speeds</span>
                </a>
                <b>→</b>
                <a href="../reference/#wheel-speed-controller">
                  <strong>WheelSpeedController*</strong>
                  <span>target + measured speed → drive command</span>
                </a>
                <b>→</b>
                <div>
                  <strong>XRP</strong>
                  <span>motors, encoders, range sensor</span>
                </div>
              </div>
              <div className="flow-arrow sensor-sample" aria-hidden="true">
                ↓ RawSensors
              </div>
              <div className="measurement-path" aria-label="Measurement path">
                <a href="../reference/#sensor-model">
                  <strong>SensorModel*</strong>
                  <span>counts + time → distance and measured speed</span>
                </a>
                <div className="measurement-branches">
                  <span>measured wheel speed ↖ WheelSpeedController</span>
                  <span>distance increments ↓</span>
                </div>
                <a href="../reference/#odometry">
                  <strong>Odometry*</strong>
                  <span>wheel increments → Pose</span>
                </a>
              </div>
              <div className="flow-arrow pose-return" aria-hidden="true">
                Pose returns to mission/navigation ↑
              </div>
              <figcaption>
                * Student-implemented component.{" "}
                <a href="../reference/#grid-planner">
                  <code>GridPlanner</code>
                </a>{" "}
                creates a route before NavigationController follows its goals.
              </figcaption>
            </figure>
            <div className="project-files-summary">
              <div>
                <code>challenge.py</code>
                <span>Task values, goals, and map.</span>
              </div>
              <div>
                <code>robot_config.py</code>
                <span>Geometry, calibration, and gains.</span>
              </div>
              <div>
                <code>course_setup.py</code>
                <span>Select and assemble components.</span>
              </div>
              <div>
                <code>main.py</code>
                <span>Run the mission and stop cleanly.</span>
              </div>
            </div>
            <p>
              Distances are millimeters, speeds are millimeters per second,
              angles are radians, and yaw rates are radians per second. Do not
              add <code>sleep_ms()</code> inside a <code>Robot.step()</code>{" "}
              loop.
            </p>
            <p>
              See the <a href="../reference/">UCSB XRP API reference</a> for
              records, component base classes, supplied services, maps,
              configuration, live values, and numerical helpers.
            </p>
          </GuideSection>

          <GuideSection id="offline-use" number="07" title="Offline use">
            <p>
              First open the course site while the computer has internet access.
              Wait until the IDE or Monitor reports{" "}
              <strong>saved in Chrome</strong>. Chrome has then stored the
              application files, virtual XRP, Guide, API reference, and XRP
              setup files for this site.
            </p>
            <div className="offline-capabilities">
              <section>
                <h3>Available after one complete online load</h3>
                <ul>
                  <li>
                    Close and reopen the IDE, Monitor, Guide, and API reference
                    in the same Chrome profile.
                  </li>
                  <li>Validate and run projects on the virtual XRP.</li>
                  <li>
                    Read and write project files after granting access to their
                    course folder.
                  </li>
                  <li>
                    Connect to a physical XRP while the computer is joined to
                    its hotspot or local network.
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
                    Clearing this site&apos;s browser data removes Chrome&apos;s
                    saved app and browser recovery copy.
                  </li>
                  <li>
                    The saved app is not copied into the course folder; native
                    project files remain separate.
                  </li>
                </ul>
              </section>
            </div>
            <p>
              <strong>Install course tools</strong> on the landing page is
              optional. It adds a launcher and a separate app window, but uses
              the same Chrome storage and has the same offline limits. When the
              site is opened with internet access, Chrome checks for a newer
              course-app version.
            </p>
          </GuideSection>

          <GuideSection id="github" number="08" title="GitHub version control">
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

          <GuideSection id="shortcuts" number="09" title="Keyboard shortcuts">
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
                <strong>Code does not run:</strong> read Program output for a
                Python exception and System log for validation, transfer, and
                target events.
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
                <strong>A component check says PENDING:</strong> open the named
                student file and implement that method; other component work can
                continue.
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

function Command({ children, name }: { children: ReactNode; name: string }) {
  return (
    <div>
      <strong>{name}</strong>
      <span>{children}</span>
    </div>
  );
}
