export function GuideApp() {
  return (
    <div className="guide-app">
      <header className="guide-header">
        <div className="brand" aria-label="UCSB XRP course guide">
          <span className="brand-mark">UCSB</span>
          <span className="brand-name">XRP Course Guide</span>
        </div>
        <nav aria-label="Course applications">
          <a className="tool-link" href="../ide/">
            Open IDE
          </a>
          <a className="tool-link" href="../commission/">
            Set up / repair XRP
          </a>
          <a className="tool-link" href="../monitor/">
            Open XRP Monitor
          </a>
        </nav>
      </header>

      <div className="guide-layout">
        <nav className="guide-toc" aria-label="On this page">
          <span>On this page</span>
          <a href="#first-run">First virtual run</a>
          <a href="#projects">Projects and workspace</a>
          <a href="#physical-xrp">Physical XRP</a>
          <a href="#monitor">Monitor and data</a>
          <a href="#course-api">How the course code fits</a>
          <a href="#version-control">Version control</a>
          <a href="#shortcuts">Shortcuts</a>
          <a href="#troubleshooting">Recovery</a>
        </nav>

        <main className="guide-content">
          <section className="guide-intro">
            <p className="eyebrow">UCSB Mobile Robotics</p>
            <h1>Write once. Run virtually or on the XRP.</h1>
            <p>
              The IDE, course library, reference components, telemetry, and
              Monitor use one project format and one target selector. Start in
              simulation, then choose the physical robot without rewriting the
              program.
            </p>
          </section>

          <section id="first-run">
            <div className="section-number">01</div>
            <div>
              <h2>First virtual run</h2>
              <ol className="procedure">
                <li>
                  Open the <a href="../ide/">IDE</a> and leave the target set to{" "}
                  <strong>Virtual XRP</strong>. The Expanding spiral project is
                  already open.
                </li>
                <li>
                  Select <strong>Run</strong>. Run performs any required
                  validation before starting and reports a problem instead of
                  running invalid code.
                </li>
                <li>
                  Open the <a href="../monitor/">XRP Monitor</a> in another tab
                  to watch the robot, signals, and program output. Run and Stop
                  work from either app.
                </li>
              </ol>
              <p>
                Use <strong>Stop</strong> to end the program and{" "}
                <strong>Reset</strong> to return the virtual XRP to its starting
                state. <strong>Validate</strong> is an optional code-only check;
                you do not need to select it before Run.
              </p>
            </div>
          </section>

          <section id="projects">
            <div className="section-number">02</div>
            <div>
              <h2>Projects and workspace</h2>
              <p>
                Choose one <strong>workspace</strong>: the parent folder that
                will hold all of your XRP work. Each project gets its own named
                subfolder containing Python files, project settings, run output,
                and telemetry. The folder path above the file list identifies
                the active project.
              </p>
              <p>
                <strong>New project from template</strong> asks for a project
                name, creates its subfolder, and opens it. Use{" "}
                <strong>Open project</strong> for a folder that already exists.
                Changes are saved to the active project;{" "}
                <strong>Duplicate</strong> copies a file, and{" "}
                <strong>Make main</strong> selects the file that Run starts.
              </p>
              <p>
                The templates include demonstrations, MicroPython lessons, and
                the five course challenges. In a challenge,{" "}
                <code>challenge.py</code> contains task values,{" "}
                <code>robot_config.py</code> contains robot settings, and{" "}
                <code>course_setup.py</code> selects supplied or student
                components. Start with the supplied components, implement one
                student component at a time, use{" "}
                <strong>Test components</strong> for the hardware-free
                PASS/PENDING/FAIL checks, and exercise each change on the
                virtual XRP before selecting the physical target.
              </p>
              <div className="callout">
                If no workspace is connected, the IDE keeps a recovery copy in
                Chrome. Connect a workspace to keep ordinary files you can open
                from Finder or File Explorer. The course app itself is stored
                separately from your project files.
              </div>
            </div>
          </section>

          <section id="physical-xrp">
            <div className="section-number">03</div>
            <div>
              <h2>Physical XRP</h2>
              <p>
                Open <a href="../commission/">Set up or repair XRP</a> in
                current desktop Chrome or Edge. The same action is available in
                IDE Settings. The wizard checks the connected controller,
                installs or repairs the course software, and configures the
                robot's Wi-Fi connection.
              </p>
              <ol className="procedure">
                <li>
                  Connect the XRP by USB-C and select it when the device chooser
                  opens. Leave USB connected until the wizard finishes.
                </li>
                <li>
                  Choose the XRP's own hotspot or an existing local Wi-Fi
                  network. A new robot defaults to a device-specific{" "}
                  <code>UCSB-XRP-…</code> hotspot.
                </li>
                <li>
                  If the wizard requests firmware repair, put the XRP in its
                  firmware mode and select the temporary <code>RP2350</code>
                  drive. The wizard continues after the controller restarts.
                </li>
                <li>
                  Follow the displayed Wi-Fi instruction. When the connection
                  check passes, the wizard opens the IDE with{" "}
                  <strong>Physical XRP</strong> selected.
                </li>
              </ol>
              <p>
                Leave USB connected if convenient. Setup and repair use USB;
                ordinary project transfer, Run, and telemetry use the selected
                Wi-Fi connection.
              </p>
              <div className="command-guide" aria-label="IDE command guide">
                <div>
                  <strong>Validate</strong>
                  <span>
                    Optional: check every Python file without transferring or
                    running it.
                  </span>
                </div>
                <div>
                  <strong>Flash project</strong>
                  <span>
                    Optional: transfer and verify the current project without
                    starting it.
                  </span>
                </div>
                <div>
                  <strong>Run</strong>
                  <span>
                    Perform any required validation and transfer, then start the
                    project on the selected XRP.
                  </span>
                </div>
                <div>
                  <strong>Stop</strong>
                  <span>
                    End the active program and return drive commands to zero.
                  </span>
                </div>
                <div>
                  <strong>Reset</strong>
                  <span>
                    Restart the selected target and clear its run state.
                  </span>
                </div>
              </div>
              <p>
                In hotspot mode, join the network shown by the wizard; its
                initial password is <code>ucsb-xrp</code>. In Existing Wi-Fi
                mode, the computer and XRP must be on the same local network.
                Reopen the wizard from IDE Settings whenever the network or
                course software needs repair.
              </p>
            </div>
          </section>

          <section id="monitor">
            <div className="section-number">04</div>
            <div>
              <h2>Monitor motion, sensors, and program output</h2>
              <p>
                The Monitor shares the IDE target selection. It displays pose
                when available, motion commands, wheel speed, encoder counts,
                range, USER button, supply voltage, and IMU data. Use{" "}
                <strong>Program output</strong> for text and Python errors from
                the project; use <strong>System log</strong> for validation,
                transfer, connection, and target events.
              </p>
              <p>
                Choose the signals and time window in <strong>Controls</strong>.
                Every selected plot keeps the same height; additional plots
                scroll. Drag a separator to change the space given to the world,
                telemetry, plots, or output.
              </p>
              <p>
                Controls declared with <code>ucsb_xrp.live</code> appear under{" "}
                <strong>Live controls</strong> while the program runs. Values
                published with <code>live.watch()</code> appear below{" "}
                <strong>Live telemetry</strong>. These are useful for tuning a
                parameter or watching a mode without adding repeated print
                statements.
              </p>
              <ol className="procedure">
                <li>
                  Select <strong>Start recording</strong> before or during a
                  run, then select <strong>Stop recording</strong>. Recording
                  and robot Run/Stop are independent.
                </li>
                <li>
                  Right-click a signal plot at the time you want to mark, type a
                  short note, and press Enter. Notes can be shown or hidden
                  together.
                </li>
                <li>
                  Under <strong>Export</strong>, save unit-labeled telemetry as
                  CSV, the selected plots as SVG or PNG, or the world replay as
                  WebM video. <strong>Export world replay after Stop</strong>{" "}
                  performs the video export automatically when a recording ends.
                </li>
              </ol>
              <p>
                A world video is rendered from recorded telemetry; it is not a
                screen recording and does not rerun the simulation. If a project
                folder is connected, exports are written there. Otherwise the
                Monitor asks where to save them. Completed runs also keep
                rotating recovery copies of output, run information, and
                telemetry in <code>UCSB_XRP_Autosaves</code>.
              </p>
            </div>
          </section>

          <section id="course-api">
            <div className="section-number">05</div>
            <div>
              <h2>How the course code fits</h2>
              <p>
                <code>main.py</code> is mission control: it chooses the task,
                assembles the selected components, runs the measured robot loop,
                and decides when to stop. The arrows below show which object
                produces the next one.
              </p>
              <div
                className="api-map"
                id="code-flow"
                aria-label="Course project and robot data flow"
              >
                <div className="flow-group">
                  <strong>Project assembly</strong>
                  <div className="flow-line">
                    <span>
                      <code>challenge.py</code> + <code>robot_config.py</code>
                    </span>
                    <b aria-hidden="true">→</b>
                    <code>main.py</code>
                    <b aria-hidden="true">→</b>
                    <code>course_setup.py</code>
                    <b aria-hidden="true">→</b>
                    <span className="flow-node">Robot loop</span>
                  </div>
                </div>
                <div className="flow-group">
                  <strong>Motion and actuation</strong>
                  <div className="flow-line">
                    <code>MotionCommand</code>
                    <b aria-hidden="true">→</b>
                    <a href="#student-component-files">
                      <code>DifferentialDrive*</code>
                    </a>
                    <b aria-hidden="true">→</b>
                    <code>WheelSpeeds</code>
                    <b aria-hidden="true">→</b>
                    <a href="#student-component-files">
                      <code>WheelSpeedController*</code>
                    </a>
                    <b aria-hidden="true">→</b>
                    <code>DriveCommand</code>
                    <b aria-hidden="true">→</b>
                    <code>XRPBot</code>
                  </div>
                </div>
                <div className="flow-group">
                  <strong>Measurement and pose estimate</strong>
                  <div className="flow-line">
                    <code>XRPBot</code>
                    <b aria-hidden="true">→</b>
                    <code>RawSensors</code>
                    <b aria-hidden="true">→</b>
                    <a href="#student-component-files">
                      <code>SensorModel*</code>
                    </a>
                    <b aria-hidden="true">→</b>
                    <code>Measurements</code>
                    <b aria-hidden="true">→</b>
                    <a href="#student-component-files">
                      <code>Odometry*</code>
                    </a>
                    <b aria-hidden="true">→</b>
                    <code>Pose</code>
                  </div>
                </div>
                <div className="flow-group">
                  <strong>Planning and navigation</strong>
                  <div className="flow-line">
                    <a href="#student-component-files">
                      <code>GridPlanner*</code>
                    </a>
                    <b aria-hidden="true">→</b>
                    <span className="flow-node">goals</span>
                    <b aria-hidden="true">→</b>
                    <a href="#student-component-files">
                      <code>NavigationController*</code>
                    </a>
                    <b aria-hidden="true">→</b>
                    <code>MotionCommand</code>
                  </div>
                </div>
              </div>
              <p id="student-component-files">
                <strong>* Student implementation.</strong> The corresponding
                files are <code>sensor_model.py</code>,{" "}
                <code>wheel_speed_controller.py</code>,{" "}
                <code>differential_drive.py</code>, <code>odometry.py</code>,{" "}
                <code>navigation_controller.py</code>, and{" "}
                <code>grid_planner.py</code>. Each file contains one focused
                component and its named public methods.
              </p>
              <p>
                The course supplies <code>XRPBot</code>, the measured Robot
                loop, starter implementations, maps, and mission sequence. Your
                component should depend on the data objects shown next to it,
                rather than reaching around the loop to control hardware
                directly.
              </p>
              <p>
                Distances are millimeters, linear speeds are millimeters per
                second, and angles are radians. <code>MotionCommand</code>
                requests body speed and yaw rate;{" "}
                <code>DriveCommand(left, right)</code> is the resulting
                normalized motor input from −1 to +1. <code>Robot</code> keeps
                the sample clock, so challenge loops do not add sleep calls.
              </p>
            </div>
          </section>

          <section id="version-control">
            <div className="section-number">06</div>
            <div>
              <h2>Version control</h2>
              <p>
                Use the same project folder for the IDE and Git. The simplest
                Windows and macOS workflow is to clone the assigned repository
                with{" "}
                <a
                  href="https://docs.github.com/en/desktop/overview/getting-started-with-github-desktop"
                  rel="noreferrer"
                  target="_blank"
                >
                  GitHub Desktop
                </a>
                , then open that project folder in the UCSBXRP IDE.
              </p>
              <ol className="procedure">
                <li>Make and test a small, coherent change in the IDE.</li>
                <li>Review the changed files in GitHub Desktop.</li>
                <li>Write a short commit message, commit, and push.</li>
              </ol>
              <p>
                The IDE saves ordinary files in the project folder. It does not
                store GitHub credentials or perform Git operations.
              </p>
            </div>
          </section>

          <section id="shortcuts">
            <div className="section-number">07</div>
            <div>
              <h2>Keyboard shortcuts</h2>
              <table>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>macOS</th>
                    <th>Windows/Linux</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Save all files</td>
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
                    <td>Run selected target</td>
                    <td>
                      <kbd>⌘</kbd> <kbd>Enter</kbd>
                    </td>
                    <td>
                      <kbd>Ctrl</kbd> <kbd>Enter</kbd>
                    </td>
                  </tr>
                  <tr>
                    <td>Open or close settings</td>
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
                <kbd>Tab</kbd> indents by the configured two or four spaces;
                file tabs switch among open project files.
              </p>
            </div>
          </section>

          <section id="troubleshooting">
            <div className="section-number">08</div>
            <div>
              <h2>Recovery and troubleshooting</h2>
              <ul className="procedure">
                <li>
                  <strong>Physical XRP is unreachable:</strong> confirm both
                  devices are using the network mode selected in IDE Settings.
                  In hotspot mode, join its <code>UCSB-XRP-…</code> network. If
                  that fails, connect USB-C and open{" "}
                  <a href="../commission/">Set up or repair XRP</a>.
                </li>
                <li>
                  <strong>Code does not run:</strong> open Program output for
                  Python errors from the project and <strong>System log</strong>
                  for validation, transfer, connection, and target events.
                </li>
                <li>
                  <strong>Workspace is disconnected:</strong> select{" "}
                  <strong>Reconnect</strong> and choose the same workspace. The
                  recovery copy in Chrome remains available while the folder is
                  disconnected.
                </li>
                <li>
                  <strong>Working without internet:</strong> open the course
                  site once while online and wait until the header confirms that
                  the IDE and Monitor are saved in Chrome. The apps, virtual
                  XRP, Guide, and course release can then reopen without
                  internet; physical XRP use still requires its local Wi-Fi
                  connection. Project files remain in the workspace you
                  selected. Closing Chrome does not remove the saved app, but
                  clearing the course site's data does.
                </li>
                <li>
                  <strong>No physical world pose:</strong> live sensor data can
                  still be valid. A physical pose appears when the project uses
                  the course <code>Robot</code> loop and publishes its odometry
                  estimate.
                </li>
              </ul>
              <div className="source-links">
                <a
                  href="https://www.micropython.org/download/SPARKFUN_XRP_CONTROLLER/"
                  rel="noreferrer"
                  target="_blank"
                >
                  Official SparkFun XRP Controller firmware ↗
                </a>
                <a
                  href="https://open-stem.github.io/XRP_MicroPython/api.html"
                  rel="noreferrer"
                  target="_blank"
                >
                  XRPLib API reference ↗
                </a>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
