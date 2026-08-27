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
      alt="Control cycle: main.py sends a motion command through DifferentialDrive and WheelSpeedController to the XRP target. SensorModel converts raw sensor readings into wheel travel and measured wheel speeds. Odometry returns position and heading to main.py, while measured wheel speeds feed the next controller calculation."
      caption="Values passed during one sample. An asterisk marks a component implemented during the course. The dashed arrow is wheel-speed feedback used in the next sample."
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
