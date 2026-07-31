export function GuideApp() {
  return (
    <div className="guide-app">
      <header className="guide-header">
        <div className="brand" aria-label="UCSB XRP getting started">
          <span className="brand-mark">UCSB</span>
          <span className="brand-name">XRP Getting Started</span>
        </div>
        <nav aria-label="Course applications">
          <a className="tool-link" href="/ide/">
            Open IDE
          </a>
          <a className="tool-link" href="/dashboard/">
            Open XRP Monitor
          </a>
        </nav>
      </header>

      <div className="guide-layout">
        <nav className="guide-toc" aria-label="On this page">
          <span>ON THIS PAGE</span>
          <a href="#virtual-workflow">Virtual workflow</a>
          <a href="#project-files">Project files</a>
          <a href="#motor-efforts">MotorEfforts</a>
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
              the same project and course package. Physical controls will be
              enabled after the robot-side supervisory service and the offline
              Wi-Fi workflow meet their acceptance tests.
            </p>
          </section>

          <section id="virtual-workflow">
            <div className="section-number">01</div>
            <div>
              <h2>Virtual workflow</h2>
              <ol className="procedure">
                <li>
                  Open the <a href="/ide/">IDE</a>. The starter project is
                  recovered automatically in this browser.
                </li>
                <li>
                  Select <strong>Validate code</strong>. Each Python file is
                  compiled by MicroPython; non-Python project files are kept but
                  are not compiled as Python. Validation causes no robot motion.
                </li>
                <li>
                  Select <strong>Run virtual XRP</strong>. This runs{" "}
                  <code>main.py</code> in an isolated MicroPython worker and
                  applies its commands to the deterministic simulator.
                </li>
                <li>
                  Open the <a href="/dashboard/">XRP Monitor</a> to inspect
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
                tabs. The current entry point is <code>main.py</code>.
              </p>
              <div className="callout">
                Folder access requires a current Chromium browser and either
                localhost or HTTPS. The IDE preserves unrelated files and does
                not delete files from a selected folder.
              </div>
            </div>
          </section>

          <section id="motor-efforts">
            <div className="section-number">03</div>
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

          <section id="physical-rp2350">
            <div className="section-number">04</div>
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
                  supervision. Offline readiness is tested before changing the
                  computer to the RM2 network and testing browser Local Network
                  Access.
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
            <div className="section-number">05</div>
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
            <div className="section-number">06</div>
            <div>
              <h2>Current implementation boundary</h2>
              <p>
                The virtual edit–validate–run–monitor–stop–reset path is
                operational. Local project folders, multi-file tabs, browser
                recovery, and explicit file saving are available now.
              </p>
              <p>
                Physical-target controls remain deliberately absent until the
                robot supervisory service provides capability discovery,
                correlated replies, atomic project transfer, and independent
                stop supervision. The exact RP2350 firmware, XRPLib, course
                package, and USB no-motion results are already recorded; the
                remaining gates are service behavior, offline readiness, RM2
                networking, browser permission, and physical stop/reset
                behavior. The IDE will not present an untested port or network
                setting as functional.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
