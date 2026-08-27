import type { ReactNode } from "react";

interface FlowStepProps {
  children: ReactNode;
  detail: string;
  output?: string;
  tone?: "program" | "student" | "service" | "target";
}

function FlowStep({
  children,
  detail,
  output,
  tone = "service",
}: FlowStepProps) {
  return (
    <li className="course-flow-step">
      <div className={`course-flow-node ${tone}`}>
        <strong>{children}</strong>
        <span>{detail}</span>
      </div>
      {output && (
        <div className="course-flow-connector">
          <span>{output}</span>
          <b aria-hidden="true" className="course-flow-arrow-wide">
            →
          </b>
          <b aria-hidden="true" className="course-flow-arrow-narrow">
            ↓
          </b>
        </div>
      )}
    </li>
  );
}

function FlowLane({ children, label }: { children: ReactNode; label: string }) {
  return (
    <section className="course-flow-lane">
      <h3>{label}</h3>
      <ol className="course-flow-chain">{children}</ol>
    </section>
  );
}

export function ControlCycleFlow() {
  return (
    <figure className="course-flow" aria-labelledby="control-cycle-caption">
      <FlowLane label="Command path">
        <FlowStep
          detail="selects the task and requests robot motion"
          output="MotionCommand"
          tone="program"
        >
          main.py
        </FlowStep>
        <FlowStep
          detail="converts robot motion to target wheel speeds"
          output="target wheel speeds"
          tone="student"
        >
          DifferentialDrive*
        </FlowStep>
        <FlowStep
          detail="compares target speeds with the latest measured speeds"
          output="DriveCommand"
          tone="student"
        >
          WheelSpeedController*
        </FlowStep>
        <FlowStep
          detail="applies the command until the next sample time"
          tone="target"
        >
          XRP target
        </FlowStep>
      </FlowLane>

      <FlowLane label="Measurement and pose path">
        <FlowStep
          detail="reads encoders, time, range, and button"
          output="RawSensors"
          tone="target"
        >
          XRP target
        </FlowStep>
        <FlowStep
          detail="calculates wheel travel and measured wheel speed"
          output="Measurements"
          tone="student"
        >
          SensorModel*
        </FlowStep>
        <FlowStep
          detail="updates the estimated position and heading"
          output="Pose"
          tone="student"
        >
          Odometry*
        </FlowStep>
        <FlowStep detail="uses the returned RobotState" tone="program">
          main.py
        </FlowStep>
      </FlowLane>

      <p className="course-flow-feedback">
        <strong>Wheel-speed feedback:</strong> SensorModel also returns the
        measured wheel speeds used by WheelSpeedController during the next
        command calculation.
      </p>
      <figcaption id="control-cycle-caption">
        Values passed during one sampled control cycle. An asterisk marks one of
        the six components students implement during the course; each project
        initially selects its supplied version.
      </figcaption>
    </figure>
  );
}

export function SystemBoundaryFlow() {
  return (
    <figure className="course-flow" aria-labelledby="system-boundary-caption">
      <FlowLane label="Project execution">
        <FlowStep
          detail="main.py and project modules"
          output="calls"
          tone="program"
        >
          Student project
        </FlowStep>
        <FlowStep
          detail="shared records, components, and services"
          output="device operations"
        >
          UCSB XRP API
        </FlowStep>
        <FlowStep detail="the single XRPLib boundary" output="runs against">
          XRPBot
        </FlowStep>
        <li className="course-flow-step course-flow-targets">
          <div className="course-flow-node target">
            <strong>Virtual XRP</strong>
            <span>simulated XRPLib and planar robot model</span>
          </div>
          <span className="course-flow-choice">or</span>
          <div className="course-flow-node target">
            <strong>Physical XRP</strong>
            <span>XRPLib and RP2350 robot hardware</span>
          </div>
        </li>
      </FlowLane>

      <p className="course-flow-feedback">
        <strong>Browser tools:</strong> the IDE sends the selected project and
        Run, Stop, and Reset commands to one target. The Monitor reads that same
        target&apos;s state, output, and telemetry.
      </p>
      <figcaption id="system-boundary-caption">
        The same project and UCSB XRP API run on either target; the browser does
        not replace sensing, odometry, navigation, mapping, or planning code.
      </figcaption>
    </figure>
  );
}
