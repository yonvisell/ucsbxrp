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
          <a href="#physical-xrp">Use a physical XRP</a>
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
                  Choose a project template, then select <strong>Load</strong>.
                </li>
                <li>
                  Select <strong>Validate code</strong>. Every Python file is
                  compiled by the same MicroPython version used by the course.
                </li>
                <li>
                  Open the <a href="../dashboard/">XRP Monitor</a> in another
                  tab and select <strong>Run</strong> in the IDE.
                </li>
              </ol>
              <p>
                Program output, wheel motion, encoders, range, IMU values, and
                pose come from the same deterministic simulation.{" "}
                <strong>Stop</strong> and <strong>Reset</strong> are available
                in both apps. After an IDE run, the Monitor can run that same
                project directly.
              </p>
            </div>
          </section>

          <section id="projects">
            <div className="section-number">02</div>
            <div>
              <h2>Projects, files, and templates</h2>
              <p>
                Browser recovery preserves edits continuously. Select{" "}
                <strong>Save now</strong> to choose a normal local project
                folder; after that, edits save there automatically. Use{" "}
                <strong>Open folder</strong> to resume another project. The IDE
                supports nested files, multiple editor tabs, rename, copy,
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
                browser recovery remains available meanwhile.
              </div>
            </div>
          </section>

          <section id="physical-xrp">
            <div className="section-number">03</div>
            <div>
              <h2>Use a physical RP2350 XRP</h2>
              <h3>Instructor setup, once per robot</h3>
              <p>
                While online, first open the production IDE and Monitor and wait
                for <strong>Saved for offline use</strong>. The complete web
                application then runs locally without returning to its web host.
                Connect the flashed XRP by USB and run:
              </p>
              <pre>
                <code>.venv/bin/python scripts/provision_xrp.py</code>
              </pre>
              <p>
                This installs and read-verifies the course release, then creates
                a device-specific network such as <code>UCSB-XRP-9EDE</code> at{" "}
                <code>192.168.42.1</code>. Its course password is{" "}
                <code>ucsb-xrp</code>. The printed network name distinguishes
                nearby robots.
              </p>

              <h3>Normal student workflow</h3>
              <ol className="procedure">
                <li>
                  Join the <code>UCSB-XRP-…</code> network printed during USB
                  setup. Internet access is not needed after the applications
                  have been saved locally.
                </li>
                <li>
                  In IDE Settings, select <strong>Physical XRP</strong> and{" "}
                  <strong>Robot hotspot</strong>.
                </li>
                <li>
                  The status identifies the robot network, fixed address, and
                  installed course release.
                </li>
                <li>
                  Use <strong>Validate code</strong>,{" "}
                  <strong>Flash project</strong>, and <strong>Run</strong>. Run
                  automatically flashes changed files, so the separate flash
                  step is optional during ordinary work.
                </li>
              </ol>
              <p>
                The XRP keeps the last complete project if a transfer is
                interrupted. Stop and reset reconnect automatically after the
                controller restarts. USB can remain connected; browser traffic
                uses Wi-Fi.
              </p>
              <h3>Existing local Wi-Fi</h3>
              <p>
                For an instructor-managed private router or another ordinary
                network, provision with{" "}
                <code>scripts/provision_xrp.py --mode station --ssid NAME</code>
                . The router does not need internet after the web applications
                are local. USB setup reads the matching credential from the
                local details file without printing it. Select{" "}
                <strong>Existing Wi-Fi</strong> in IDE Settings and enter the
                reported address. If that network is unavailable at boot, the
                XRP exposes its own recoverable hotspot until the next reset.
              </p>
            </div>
          </section>

          <section id="monitor">
            <div className="section-number">04</div>
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
                Recording stores up to 30,000 telemetry samples. Start and stop
                recording independently of a run, then export a CSV with units
                in the column names. IMU exports use m/s² and rad/s; course
                distances may remain in millimetres. If the limit is reached,
                the oldest samples are replaced and the dropped count is shown.
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
            <div className="section-number">05</div>
            <div>
              <h2>A small course API with visible ownership</h2>
              <div className="signal-chain" aria-label="Course control chain">
                <span>MotionCommand</span>
                <b>→</b>
                <span>DifferentialDrive</span>
                <b>→</b>
                <span>WheelSpeeds</span>
                <b>→</b>
                <span>WheelSpeedController</span>
                <b>→</b>
                <span>DriveCommand</span>
                <b>→</b>
                <span>XRPBot</span>
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
            <div className="section-number">06</div>
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
                    <td>Validate code</td>
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
            <div className="section-number">07</div>
            <div>
              <h2>Fast troubleshooting</h2>
              <ul className="procedure">
                <li>
                  <strong>Physical XRP is unreachable:</strong> confirm both
                  devices are using the network mode selected in IDE Settings.
                  In hotspot mode, join the printed <code>UCSB-XRP-…</code>
                  network. In existing-Wi-Fi mode, rerun{" "}
                  <code>scripts/provision_xrp.py --mode station</code> over USB
                  to repair the installation and report the current address.
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
                  <strong>Saved for offline use</strong> before changing
                  networks. Development servers instead show{" "}
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
