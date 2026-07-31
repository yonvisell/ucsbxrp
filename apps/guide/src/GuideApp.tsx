export function GuideApp() {
  return (
    <div className="guide-app">
      <header className="guide-header">
        <div className="brand" aria-label="UCSB XRP getting started">
          <span className="brand-mark">UCSB</span>
          <span className="brand-name">XRP Getting Started</span>
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
          <span>ON THIS PAGE</span>
          <a href="#virtual-workflow">Virtual workflow</a>
          <a href="#project-files">Project files</a>
          <a href="#challenge-one">Challenge 1 starter</a>
          <a href="#monitor-recording">Record telemetry</a>
          <a href="#motor-efforts">MotorEfforts</a>
          <a href="#offline-use">Offline use</a>
          <a href="#physical-rp2350">Prepare the RP2350 XRP</a>
          <a href="#shortcuts">Shortcuts</a>
          <a href="#current-boundary">Current boundary</a>
        </nav>

        <main className="guide-content">
          <section className="guide-intro">
            <p className="eyebrow">COURSE TOOLS · STAGE 1</p>
            <h1>From a Python project to a moving XRP</h1>
            <p>
              Begin with the deterministic virtual robot. The physical XRP uses
              the same project, course package, and supplied reference bytecode.
              The production application has passed local offline acceptance.
              Physical controls remain gated on the robot-side supervisory
              service and deployed HTTPS/RM2 network acceptance.
            </p>
          </section>

          <section id="virtual-workflow">
            <div className="section-number">01</div>
            <div>
              <h2>Virtual workflow</h2>
              <ol className="procedure">
                <li>
                  Open the <a href="../ide/">IDE</a>. The starter project is
                  recovered automatically in this browser.
                </li>
                <li>
                  Select <strong>Validate code</strong>. Each Python file is
                  compiled by MicroPython; non-Python project files are kept but
                  are not compiled as Python. Validation causes no robot motion.
                </li>
                <li>
                  Select <strong>Run virtual XRP</strong>. This runs the Python
                  file marked <strong>START</strong> in an isolated MicroPython
                  worker and applies its commands to the deterministic
                  simulator.
                </li>
                <li>
                  Open the <a href="../dashboard/">XRP Monitor</a> to inspect
                  position, wheel speed, encoder counts, normalized motor
                  effort, and program output.
                </li>
                <li>
                  <strong>Stop program</strong> terminates the program and sets
                  both motor efforts to zero. <strong>Reset virtual XRP</strong>{" "}
                  also returns pose, speed, and encoders to zero.
                </li>
              </ol>
            </div>
          </section>

          <section id="project-files">
            <div className="section-number">02</div>
            <div>
              <h2>Project files and working folders</h2>
              <p>
                Browser recovery is continuous, but it is not a substitute for
                files in a course folder. <strong>Open folder</strong> grants
                the IDE read/write access to one local folder.{" "}
                <strong>Save files</strong> writes every project file to that
                folder, creating subfolders when needed.
              </p>
              <p>
                <strong>New file</strong> accepts a project-relative path such
                as <code>student/straight_line_controller.py</code>. Select any
                file in the project list to open it; open files appear as editor
                tabs. <strong>Rename</strong>, <strong>Duplicate</strong>, and{" "}
                <strong>Delete</strong> act on the selected file. Deletion
                requires confirmation and is not applied to a working folder
                until the next save.
              </p>
              <p>
                The file marked <strong>START</strong> runs when you select Run
                virtual XRP. Select another Python file and choose{" "}
                <strong>Use as startup</strong> to change it. Saving writes a
                small hidden <code>.ucsb-xrp-project.json</code> file so the IDE
                restores that choice when the folder is reopened.
              </p>
              <div className="callout">
                Folder access requires a current Chromium browser and either
                localhost or HTTPS. The IDE preserves unrelated files. A
                confirmed project deletion removes only the exact tracked file
                and only when <strong>Save files</strong> is selected.
              </div>
            </div>
          </section>

          <section id="challenge-one">
            <div className="section-number">03</div>
            <div>
              <h2>The five-file Challenge 1 starter</h2>
              <p>
                The recovered default separates task values, robot settings,
                student work, implementation selection, and orchestration. This
                makes each change visible without requiring a large framework:
              </p>
              <ul className="procedure">
                <li>
                  <code>main.py</code> runs the initial Challenge 1 data-flow
                  check and is marked <strong>START</strong>;
                </li>
                <li>
                  <code>robot_config.py</code> holds robot measurements and
                  reusable controller settings;
                </li>
                <li>
                  <code>student_components.py</code> contains the two Challenge
                  1 components students implement;
                </li>
                <li>
                  <code>course_setup.py</code> explicitly selects the supplied
                  or student implementation for each component; and
                </li>
                <li>
                  <code>challenge.py</code> holds the Straight Run task values.
                </li>
              </ul>
              <p>
                The default run reads sensors and exercises the component chain,
                but <code>RobotConfig.max_effort</code> is zero and both motor
                efforts must remain exactly zero. This is a no-motion software
                and data-flow check, not a physical Straight Run. Do not unlock
                it by changing that value alone; physical use waits for the H2
                raised-wheel safety and calibration session.
              </p>
              <p>
                The retained reference source is a provisional implementation,
                not the definition of the only acceptable student design. The
                student release carries reproducibly built ordinary MicroPython{" "}
                <code>.mpy</code> files instead of that private source. The
                exact same two bytecode files import and pass the public
                Challenge 1 contract vector in browser MicroPython WebAssembly
                and on the physical RP2350.
              </p>
            </div>
          </section>

          <section id="monitor-recording">
            <div className="section-number">04</div>
            <div>
              <h2>Record and export telemetry</h2>
              <p>
                In the XRP Monitor's Live values panel, select{" "}
                <strong>Start recording</strong> after telemetry appears.{" "}
                <strong>Stop recording</strong> freezes the current recording;{" "}
                <strong>Export CSV</strong> downloads it; and{" "}
                <strong>Clear recording</strong> discards it.
              </p>
              <p>
                Recording is independent of the visible plots and is bounded at
                30,000 samples. For longer runs, the oldest samples are dropped
                and the interface reports how many were dropped. The CSV gives
                explicit columns for sequence, time, pose, left and right motor
                effort, wheel speeds, encoder counts, and collision state;
                physical units are included in the column names.
              </p>
            </div>
          </section>

          <section id="motor-efforts">
            <div className="section-number">05</div>
            <div>
              <h2>What MotorEfforts means</h2>
              <p>
                <code>MotorEfforts(left, right)</code> is a course API record,
                not a simulator-only device. Its two dimensionless values are
                the requested left and right motor commands. Each magnitude is
                bounded by <code>RobotConfig.max_effort</code>; the ordinary
                normalized range is −1 to +1.
              </p>
              <div className="signal-chain" aria-label="Course control chain">
                <span>MotionCommand</span>
                <b>→</b>
                <span>DifferentialDrive</span>
                <b>→</b>
                <span>WheelSpeeds</span>
                <b>→</b>
                <span>WheelSpeedController</span>
                <b>→</b>
                <span>MotorEfforts</span>
                <b>→</b>
                <span>XRPBot</span>
              </div>
              <p>
                Challenge 1 also uses <code>MotorEfforts</code> directly for
                fixed-effort characterization. <code>XRPBot.set_efforts()</code>{" "}
                is the hardware boundary: it applies configured left/right motor
                signs, then calls XRPLib. Keeping sign correction there prevents
                higher-level course components from depending on wiring
                orientation.
              </p>
            </div>
          </section>

          <section id="offline-use">
            <div className="section-number">06</div>
            <div>
              <h2>Know when the course tools are ready offline</h2>
              <p>
                The IDE and XRP Monitor headers show the course release and
                cache state. A development server displays{" "}
                <strong>cache disabled</strong> by design, so old service-worker
                files cannot hide a code change. This is not an error.
              </p>
              <p>
                A production build first displays{" "}
                <strong>preparing offline</strong>, then{" "}
                <strong>offline ready</strong> after the complete public course
                release is cached. Before changing to the robot network, open
                the production application while online and wait for{" "}
                <strong>offline ready</strong>. The cached release includes the
                IDE, Monitor, guide, workers, MicroPython WebAssembly runtime,
                canonical course package, starter, and reference bytecode. It
                intentionally excludes the private retained reference source.
              </p>
              <div className="callout">
                Local production tests pass after the browser is taken offline:
                the IDE, Monitor, and guide reload, and the default Challenge 1
                no-motion program still validates and runs. Deployment on an
                HTTPS origin, the RM2 network, browser Local Network Access, and
                physical reconnect behavior have not yet been accepted.
              </div>
            </div>
          </section>

          <section id="physical-rp2350">
            <div className="section-number">07</div>
            <div>
              <h2>Verified RP2350 state and safe next steps</h2>
              <p>
                This current SparkFun XRP Controller was first recorded with its
                factory XRP-WPILib 2.1.0 image. It was then intentionally
                flashed with the official board-specific MicroPython 1.28.0
                image and installed with XRPLib 2026.07.1 and the canonical
                development <code>ucsb_xrp</code> package.
              </p>
              <ol className="procedure">
                <li>
                  For a no-motion USB session, disconnect the battery, set the
                  board switch to <strong>off</strong>, connect USB-C, and
                  confirm that the <strong>MOT</strong> LED is off. USB still
                  powers the RP2350 system rail in this state.
                </li>
                <li>
                  Run only the course H1 no-motion probe and require reported
                  VIN to be near zero. If the switch, MOT LED, and VIN evidence
                  disagree, stop and treat the motor rail as energized.
                </li>
                <li>
                  The recorded H1 probe verified the RP2350 identity,
                  MicroPython ABI, installed-file hashes, soft-reset recovery,
                  XRPLib imports, LED command, button input, IMU, rangefinder,
                  encoders, and zero-effort cleanup. It issued no nonzero motor
                  command.
                </li>
                <li>
                  A subsequent H1 artifact run hash-checked all eight canonical
                  source files and both reference <code>.mpy</code> files. The
                  same bytecode passed its public vector in the browser and on
                  the RP2350. The exact five-file starter then ran against
                  physical XRPLib, stayed motion-locked, calculated zero effort
                  for both motors, and stopped in <code>finally</code>.
                </li>
                <li>
                  That H1 run remains <strong>partial</strong>: USB was observed
                  energizing motor-driver VIN while the board switch was on, and
                  the switch-off, MOT-LED-off, near-zero-VIN gate was not
                  confirmed during the recorded run. Battery disconnection alone
                  is not motor-power isolation.
                </li>
                <li>
                  Do not run XRPLib's upstream installation-check program
                  automatically: its procedure progresses to motor motion.
                  Motor-sign and stopping tests belong to a separate H2 session
                  with the wheels raised, explicit authorization, bounded effort
                  and duration, and zero effort before and after.
                </li>
                <li>
                  Physical browser control will follow implementation of the
                  robot supervisory service, correlated command replies, atomic
                  whole-project synchronization, and independent stop
                  supervision. Local production offline readiness has passed;
                  deployed HTTPS, the RM2 network, browser Local Network Access,
                  transport, and reconnect behavior still require acceptance.
                </li>
              </ol>
              <div className="callout">
                USB-C can power the motor-driver rail when the board switch is
                on. The MOT LED reports rail availability, not commanded effort
                or physical stopping; disabling that LED with its jumper does
                not disconnect the rail.
              </div>
              <div className="source-links">
                <a
                  href="https://github.com/Open-STEM/XRP_MicroPython/releases/tag/V2026.07.1"
                  rel="noreferrer"
                  target="_blank"
                >
                  Pinned XRPLib 2026.07.1 release ↗
                </a>
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
                <a
                  href="https://github.com/sparkfun/SparkFun_XRP_Controller/blob/86c4cd7fbc40c49308ec9d28007809906f18eec3/docs/hardware_overview.md#L54-L64"
                  rel="noreferrer"
                  target="_blank"
                >
                  SparkFun controller power documentation ↗
                </a>
              </div>
            </div>
          </section>

          <section id="shortcuts">
            <div className="section-number">08</div>
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
                    <td>Save all project files</td>
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
                    <td>Run virtual XRP</td>
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
                In the editor, <kbd>Tab</kbd> indents by the configured two or
                four spaces. Multi-file navigation uses the tabs above the
                editor.
              </p>
            </div>
          </section>

          <section id="current-boundary">
            <div className="section-number">09</div>
            <div>
              <h2>Current implementation boundary</h2>
              <p>
                The virtual edit–validate–run–monitor–stop–reset path is
                operational. Local project folders, multi-file tabs, browser
                recovery, explicit file saving, rename, duplicate,
                confirmation-based deletion, and startup-file selection are
                available now. The five-file starter, bounded Monitor recording
                with CSV export, visible production cache state, and local
                offline execution are also operational.
              </p>
              <p>
                Physical-target controls remain deliberately absent until the
                robot supervisory service provides capability discovery,
                correlated replies, atomic project transfer, and independent
                stop supervision. The exact RP2350 firmware, XRPLib, course
                package, reference-bytecode parity, five-file no-motion run, and
                USB results are already recorded. The remaining gates are
                service behavior, deployed HTTPS/RM2 networking, browser Local
                Network Access permission, reconnect handling, and physical
                stop/reset behavior. The IDE will not present an untested port
                or network setting as functional.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
