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
      alt="Robot control cycle: the program passes a MotionCommand to Robot.step. Robot.step calls the selected motion components and XRPBot to command the target, then calls the selected measurement components and returns a RobotState. Measurements feed the next control update."
      caption="The supplied Robot coordinates each sample. The selected DifferentialDrive and WheelSpeedController convert a motion request into motor effort; SensorModel and Odometry convert target readings into Measurements and Pose. XRPBot provides the same device boundary for the Virtual and Physical XRP."
      source="../diagrams/control-cycle.svg"
    />
  );
}

export function ProjectStructureFlow() {
  return (
    <CourseDiagram
      alt="Project structure: world.json provides task geometry to challenge.py, which provides named task settings to the program. robot_config.py and student component files provide robot settings and selected implementations to course_setup.py, which constructs services for the program."
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
