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
      alt="Control cycle: main.py or a supplied mission passes a MotionCommand to Robot.step. Robot calls DifferentialDrive, WheelSpeedController, and XRPBot to command the selected target, then calls SensorModel and Odometry to return one RobotState containing Measurements and Pose. The latest measured wheel speeds feed the next step."
      caption="Robot.step() runs this measured cycle; main.py does not call the lower-level components itself. XRPBot is the device boundary for either target. The dashed arrow shows wheel-speed feedback used in the next step. An asterisk marks a component implemented during the course."
      source="../diagrams/control-cycle.svg"
    />
  );
}

export function ProjectStructureFlow() {
  return (
    <CourseDiagram
      alt="Project structure: world.json is loaded through load_world into challenge.py. challenge.py supplies task values to main.py or a supplied mission. robot_config.py and the student component files supply configuration and implementations to course_setup.py. course_setup.py constructs the selected services used by main.py or the supplied mission."
      caption="Task geometry and task settings reach the program through world.json and challenge.py. Robot settings and selected component implementations reach it through robot_config.py and course_setup.py."
      className="project-structure-diagram"
      source="../diagrams/project-structure.svg?diagram=project-structure-v1"
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
