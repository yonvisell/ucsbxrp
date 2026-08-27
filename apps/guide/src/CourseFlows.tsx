interface CourseDiagramProps {
  alt: string;
  caption: string;
  source: string;
}

function CourseDiagram({ alt, caption, source }: CourseDiagramProps) {
  return (
    <figure className="course-diagram">
      <img alt={alt} src={source} />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export function ControlCycleFlow() {
  return (
    <CourseDiagram
      alt="Control cycle: main.py or a supplied mission passes a MotionCommand to Robot.step. Robot calls DifferentialDrive, WheelSpeedController, and XRPBot to command the selected target, then calls SensorModel and Odometry to return one RobotState containing Measurements and Pose. The latest measured wheel speeds feed the next step."
      caption="Robot.step() owns this measured cycle; main.py does not call the lower-level components itself. XRPBot is the device boundary for either target. The dashed arrow shows wheel-speed feedback used in the next step. An asterisk marks a component implemented during the course."
      source="../diagrams/control-cycle.svg"
    />
  );
}

export function SystemBoundaryFlow() {
  return (
    <CourseDiagram
      alt="The IDE sends a project and commands to the selected target. The project calls the UCSB XRP API, which reaches either simulated XRPLib or physical XRP hardware through XRPBot. The Monitor receives state, output, and telemetry from the same target."
      caption="The same project and UCSB XRP API run on either target. Robot sensing, control, odometry, navigation, mapping, and planning remain in the Python project."
      source="../diagrams/system-boundary.svg"
    />
  );
}
