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
          <a className="tool-link" href="../dashboard/">
            Open XRP Monitor
          </a>
        </nav>
      </header>

      <div className="guide-layout">
        <nav className="guide-toc" aria-label="On this page">
          <span>On this page</span>
          <a href="#first-run">First virtual run</a>
          <a href="#projects">Projects and starters</a>
          <a href="#version-control">Version control</a>
          <a href="#physical-xrp">Physical XRP</a>
          <a href="#monitor">Monitor and data</a>
          <a href="#course-api">Course API</a>
          <a href="#shortcuts">Shortcuts</a>
          <a href="#troubleshooting">Troubleshooting</a>
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
                  <strong>Virtual XRP</strong>.
                </li>
                <li>
                  Choose a project template, then select <strong>Create</strong>
                  .
                </li>
                <li>
                  Select <strong>Validate</strong> when you want a code check
                  without starting the program. <strong>Run</strong> also
                  validates automatically and stops if the check fails.
                </li>
                <li>
                  Open the <a href="../dashboard/">XRP Monitor</a> in another
                  tab and select <strong>Run</strong> in either app.
                </li>
              </ol>
              <p>
                Program output, wheel motion, encoders, range, IMU values, and
                pose come from the same deterministic simulation.{" "}
                <strong>Stop</strong> and <strong>Reset</strong> are available
                in both apps. After an IDE run, the Monitor can run that same
                project directly; a fresh virtual Monitor starts with the
                Expanding spiral demo.
              </p>
            </div>
          </section>

          <section id="projects">
            <div className="section-number">02</div>
            <div>
              <h2>Projects, files, and templates</h2>
              <p>
                A browser backup preserves edits continuously. Select{" "}
                <strong>Save</strong> to choose a normal local working folder;
                after that, edits save there automatically. Use{" "}
                <strong>Open folder</strong> to resume another project. The IDE
                supports nested files, multiple editor tabs, rename, duplicate,
                delete, and selection of the main Python file.
              </p>
              <p>
                Five starters cover Straight Run, Turn and Return, Waypoint
                Courier, Mapped Route, and Delivery Mission. Each starter runs
                with supplied components before student implementations are
                selected. Component selection stays explicit in{" "}
                <code>course_setup.py</code>; task values stay in{" "}
                <code>challenge.py</code>.
              </p>
              <p>
                The same template menu includes sensor-driven obstacle-turn and
                expanding-spiral demos, plus a seven-lesson MicroPython
                foundations project. Templates are not a special project type:
                after loading, every file is editable and can be saved as a
                normal local folder. Tutorial lessons can be made runnable with{" "}
                <strong>Make main</strong>.
              </p>
              <p>
                Later starters retain every component introduced so far. Bring
                completed methods forward, then change one named{" "}
                <code>USE_STUDENT_*</code> switch only after that component's
                software tests pass.
              </p>
              <div className="callout">
                Loading a starter creates a fresh browser-recovered project. The
                four previous folder states are kept as readable JSON in{" "}
                <code>UCSB_XRP_Autosaves</code>. If Chrome cannot restore folder
                permission after a restart, select <strong>Reconnect</strong>;
                the browser backup remains available meanwhile.
              </div>
            </div>
          </section>

          <section id="version-control">
            <div className="section-number">03</div>
            <div>
              <h2>Version control</h2>
              <p>
                Use the same project folder for the IDE and Git. The simplest
                course workflow is to clone the assigned repository once with{" "}
                <a
                  href="https://docs.github.com/en/desktop/overview/getting-started-with-github-desktop"
                  rel="noreferrer"
                  target="_blank"
                >
                  GitHub Desktop
                </a>
                , open that folder in the UCSBXRP IDE, and use GitHub Desktop to
                review, commit, and push changes. GitHub Desktop is available
                for current Windows and macOS and does not require command-line
                Git.
              </p>
              <ol className="procedure">
                <li>Clone the course repository into a normal local folder.</li>
                <li>
                  In the IDE, select <strong>Open folder</strong> and choose the
                  cloned project folder.
                </li>
                <li>
                  Work normally; the IDE autosaves source files into that folder
                  after the first write permission.
                </li>
                <li>
                  In GitHub Desktop, review the changed files, write a short
                  commit message, commit, and push.
                </li>
              </ol>
              <p>
                A browser-only fallback is to upload project files through
                GitHub at defined checkpoints, but it does not continuously
                synchronize the local folder. The UCSBXRP site never asks for or
                stores a GitHub password or access token. A future one-click
                repository connection would require a course-managed GitHub App
                and server-side token exchange; embedding credentials in a
                static course page would not be appropriate.
              </p>
            </div>
          </section>

          <section id="physical-xrp">
            <div className="section-number">04</div>
            <div>
              <h2>Physical XRP</h2>
              <h3>Set up or repair the robot</h3>
              <p>
                Open <a href="../commission/">Set up or repair XRP</a> in
                current desktop Chrome or Edge. The same action is available in
                IDE Settings. It checks the robot, installs only missing or
                changed course files, verifies every installed file, repairs the
                exact course firmware when needed, and restarts the XRP.
              </p>
              <ol className="procedure">
                <li>
                  Choose a working folder for one project, setup logs, run data,
                  and automatic copies, or choose it later in the IDE. Chrome
                  stores the web application separately.
                </li>
                <li>
                  Connect the XRP by USB-C, select it in the browser device
                  picker, and keep USB connected while the wizard checks the
                  controller. Then choose the robot network. A new robot
                  defaults to its own device-specific hotspot; a repair keeps
                  the current network unless you change it.
                </li>
                <li>
                  If firmware repair is needed, follow the one additional prompt
                  to select the temporary <code>RP2350</code> firmware drive.
                  The wizard verifies the controller again after it restarts.
                </li>
                <li>
                  For hotspot mode, join the displayed <code>UCSB-XRP-…</code>
                  Wi-Fi network with password <code>ucsb-xrp</code>. The wizard
                  verifies the robot service and opens the IDE with{" "}
                  <strong>Physical XRP</strong> selected.
                </li>
              </ol>
              <p>
                The optional folder step writes and reads a small test file. The
                latest events remain available under <strong>Setup log</strong>{" "}
                and in <code>UCSB_XRP_Autosaves/xrp-setup-latest.txt</code>;
                Wi-Fi passwords are not logged.{" "}
                <strong>Verify robot connection</strong> appears only after USB
                installation and reset. Existing-Wi-Fi mode can verify
                immediately while the computer stays online; hotspot mode
                requires joining the displayed network. Allow Chrome's
                local-network request. On macOS, also enable Chrome under System
                Settings → Privacy &amp; Security → Local Network if it is
                disabled.
              </p>
              <p>
                The XRP keeps the last complete project if a transfer is
                interrupted. USB can remain connected; normal programming and
                telemetry use Wi-Fi.
              </p>
              <div className="command-guide" aria-label="IDE command guide">
                <div>
                  <strong>Validate</strong>
                  <span>
                    Compile every Python file with course MicroPython. Nothing
                    is written to the robot and the program does not run.
                  </span>
                </div>
                <div>
                  <strong>Flash project</strong>
                  <span>
                    Write and verify the complete project on the physical XRP.
                    The previous complete project remains available if transfer
                    is interrupted.
                  </span>
                </div>
                <div>
                  <strong>Run</strong>
                  <span>
                    Validate the current files, flash only when a physical
                    project changed, then start its main file. On a virtual XRP,
                    run the same files in simulation.
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
              <h3>Existing local Wi-Fi</h3>
              <p>
                Select <strong>Existing Wi-Fi</strong> in the wizard to place
                the XRP on the same local network as the computer. The password
                is sent to the XRP over USB and is not retained by the web app.
                The router does not need internet after the web release is
                local. If that network is unavailable at boot, the XRP exposes
                its recoverable hotspot until the next reset. IDE Settings can
                reopen setup later to change or repair the profile.
              </p>
              <div className="callout">
                Browser security keeps the relevant platform choices explicit:
                an optional working folder, the USB device, the temporary
                firmware drive when repair needs it, and local-network access.
                No instructor account or command line is required for normal
                student setup.
              </div>
              <p>
                Instructors retaining a scripted fleet workflow can use{" "}
                <code>scripts/provision_xrp.py</code>; it consumes the same
                exact release file list as the browser wizard.
              </p>
            </div>
          </section>

          <section id="monitor">
            <div className="section-number">05</div>
            <div>
              <h2>Monitor motion, sensors, and program output</h2>
              <p>
                The Monitor shares the IDE target selection. It displays pose
                when available, wheel speed, drive command, encoder counts,
                range, USER button, supply voltage, IMU data, and the program
                log. Physical projects using <code>Robot</code> publish their
                estimated pose automatically; raw-sensor programs still show
                their live sensors without inventing a pose. The world view uses
                the production XRP footprint and a bounded millimeter grid with
                labeled x and y values. Before a pose is published, it remains
                visible with a clearly labeled XRP preview centered at the
                origin.
              </p>
              <p>
                Use the collapsible sidebar to choose signal histories and
                control recordings. The virtual scene is selected directly in
                the world view. Plots can show wheel speed, drive command,
                range, acceleration, and yaw rate over a 2–30 second window.
                Every selected plot retains the same height; additional plots
                scroll rather than compressing their y axes. Unlabeled midpoint
                grid lines make time intervals easier to read. Drag the
                separators to give the world, values, plots, or output more
                room; the arrow keys adjust a focused separator.
              </p>
              <p>
                A program can declare bounded controls with{" "}
                <code>ucsb_xrp.live</code>. They appear in{" "}
                <strong>Live controls</strong> as thin sliders, checkboxes, or
                radio choices, and take effect together at the next measured
                sample boundary. Named <code>live.watch()</code> values expose
                modes, estimates, and error terms below{" "}
                <strong>Live values</strong> in the right panel, without
                periodic diagnostic printing. Use telemetry recording for
                complete histories.
              </p>
              <p>
                Recording uses a rolling 30,000-sample buffer. The Monitor shows
                the observed sample rate and the corresponding time capacity;
                the buffer holds 10 minutes even at 50 Hz and about 30 minutes
                at the usual physical 16–17 Hz. Start and stop recording
                independently of a run, then export a CSV with units in the
                column names. IMU exports use m/s² and rad/s; course distances
                may remain in millimetres. If the buffer fills, the oldest
                samples are replaced and the dropped count is shown.
              </p>
              <p>
                Once a project or data folder is connected, every monitored run
                automatically saves its program output, metadata, and
                unit-labeled telemetry CSV. Four aligned generations rotate
                newest to oldest in <code>UCSB_XRP_Autosaves</code>. Manual CSV
                exports remain separate and are never rotated.
              </p>
            </div>
          </section>

          <section id="course-api">
            <div className="section-number">06</div>
            <div>
              <h2>Course API</h2>
              <div className="api-map" aria-label="Course software structure">
                <div className="api-main">
                  <strong>main.py</strong>
                  <span>
                    Mission control: choose the task, assemble components, run
                    the measured loop, and decide when to stop.
                  </span>
                </div>
                <div className="api-branches">
                  <div>
                    <strong>Plan and decide</strong>
                    <span>
                      DeliveryMission · GridPlanner · NavigationController
                    </span>
                  </div>
                  <div>
                    <strong>Measure and estimate</strong>
                    <span>Sensors · SensorModel · Odometry</span>
                  </div>
                </div>
                <div className="api-cycle">
                  <span>MotionCommand</span>
                  <b>→</b>
                  <span>DifferentialDrive</span>
                  <b>→</b>
                  <span>WheelSpeedController</span>
                  <b>→</b>
                  <span>DriveCommand</span>
                  <b>→</b>
                  <span>XRPBot / virtual plant</span>
                </div>
              </div>
              <p>
                Students own <code>SensorModel</code>,{" "}
                <code>WheelSpeedController</code>,{" "}
                <code>DifferentialDrive</code>, <code>Odometry</code>,{" "}
                <code>NavigationController</code>, and <code>GridPlanner</code>.
                Each appears in its own literally named Python file. The course
                supplies the hardware adapter, measured loop, straight
                controller, dimensioned maps, occupancy grids, and final mission
                sequence.
              </p>
              <p>
                Distances are millimeters, linear speeds are millimeters per
                second, angles are radians, and{" "}
                <code>DriveCommand(left, right)</code> uses the normalized range
                −1 to +1. <code>MotionCommand</code> requests body speed and yaw
                rate; <code>DriveCommand</code> is the resulting two-wheel motor
                input. <code>RobotConfig.max_drive_command</code> is an ordinary
                output limit, not a separate operating mode. <code>Robot</code>
                keeps the sample clock, so challenge loops do not call sleep.
                The readable reference source is a starting design and may be
                improved; public behavior and units define interoperability.
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
              <h2>Fast troubleshooting</h2>
              <ul className="procedure">
                <li>
                  <strong>Physical XRP is unreachable:</strong> confirm both
                  devices are using the network mode selected in IDE Settings.
                  In hotspot mode, join the printed <code>UCSB-XRP-…</code>
                  network. Otherwise connect USB-C and open{" "}
                  <a href="../commission/">Set up or repair XRP</a>; it keeps a
                  working network by default and can replace the profile when
                  selected.
                </li>
                <li>
                  <strong>Code validates but does not run:</strong> open Details
                  in the IDE; syntax and runtime exceptions include the file and
                  line reported by MicroPython.
                </li>
                <li>
                  <strong>No physical world pose:</strong> sensor telemetry is
                  still valid. The centered XRP is a labeled preview until the
                  project uses the supplied <code>Robot</code> loop and
                  publishes a pose.
                </li>
                <li>
                  <strong>Offline use:</strong> open the production course site
                  while online and wait for{" "}
                  <strong>Works without internet</strong> before changing
                  networks. Whenever the site is opened online, it checks for a
                  newer complete release, saves that release, and reloads once;
                  an interrupted update leaves the prior complete copy usable.
                  Development servers instead show{" "}
                  <strong>Development build</strong> and do not save an offline
                  browser copy.
                </li>
              </ul>
              <div className="callout">
                The physical RP2350, Wi-Fi service, sensor telemetry, project
                validation, transfer, execution, stop, reset, and reconnect path
                have been exercised. A short raised-wheel check also confirmed
                independent left/right motor response, positive encoder signs,
                paired motion, and a settled zero state. Floor calibration and
                motion-induced sensor comparisons remain.
              </div>
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
