interface CourseDiagramProps {
  alt: string;
  caption: string;
  className?: string;
  source: string;
}

function CourseDiagram({
  alt,
  caption,
  className = "course-diagram",
  source,
}: CourseDiagramProps) {
  return (
    <figure className={className}>
      <img alt={alt} src={source} />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export function ControlCycleFlow() {
  return (
    <CourseDiagram
      alt="Robot control loop: the program passes a MotionCommand to Robot.step. Robot.step calls DifferentialDrive and WheelSpeedController to command the target, then calls SensorModel and Odometry to return a RobotState. The measured wheel speeds inform the next motor command."
      caption="Each Robot.step() call performs one control-loop update. DifferentialDrive and WheelSpeedController convert a MotionCommand into a DriveCommand. SensorModel and Odometry convert encoder, time, range, and button readings into Measurements and Pose. XRPBot connects the same loop to the Virtual or Physical XRP."
      source="../diagrams/control-cycle.svg"
    />
  );
}

export function ProjectStructureFlow() {
  return (
    <CourseDiagram
      alt="Project structure: world.json provides task geometry to challenge.py, which provides named task settings to the program. robot_config.py and component implementation files provide robot settings and selected implementations to course_setup.py, which constructs services for the program."
      caption="Task values reach the program through world.json and challenge.py. Robot configuration and selected component implementations reach it through robot_config.py and course_setup.py."
      className="project-structure-diagram"
      source="../diagrams/project-structure.svg"
    />
  );
}

export function SystemBoundaryFlow() {
  return (
    <CourseDiagram
      alt="The IDE sends a project and Run, Stop, or Reset commands to the selected target. The project calls the UCSB XRP API, which reaches simulated XRPLib or Physical XRP hardware through XRPBot. The Monitor receives project state, output, and telemetry from that target."
      caption="The same Project folder and UCSB XRP API run on either target. Only the device implementation behind XRPBot changes."
      source="../diagrams/system-boundary.svg"
    />
  );
}
