# Recommended course changes · 2026-09-14

- Preserve the two supplied drafts and their older embedded text. Maintain the
  candidate sequence separately from the existing openable course projects.
- Use new_ Robot Curling, Arena Line Circuit, Waypoint Courier, Mapped Route and
  bounded Out-and-Back projects in that order. Keep earlier component files and
  calibration through explicit reuse and independent implementation selectors.
- Begin with short working Python functions, records and one stateful class;
  introduce imports and the sampled loop before students implement components.
- Require feedforward plus proportional wheel-speed control first. Expose an
  editable distance/speed policy for Curling while retaining the supplied option.
  Use line steering for a bounded PID experiment with explicit elapsed time.
- Measure separate wheel responses and define Curling's axle-center scoring
  point, common timing cue, rest condition, minimum time and two-trial rule.
- Calibrate reflectance before tuning line control. Qualify course order before
  counting the finish bar; require explicit line-loss and missing-sensor outcomes.
- Give the line race another preparation meeting by moving frames/odometry
  before the race. Complete straight, arc, turn and square odometry experiments
  before waypoint navigation. Compare estimated pose with independent measurement.
- Keep live IMU fusion and absolute camera localization optional. Teach gyro
  integration and bias conceptually without requiring an unsupported Odometry
  input or promising that a gyro gives absolute heading.
- Define Waypoint's ordered goals, waypoint reference/radius and final pose in
  its world. Require return to start only when it is an explicit final goal.
- Keep Mapped Route primarily a motion-free GridPlanner checkoff, followed by
  short virtual execution. Supply grid conversion and clearance. Assess valid
  paths and failure cases; compare BFS and built-in heapq A* on identical costs.
- Introduce range measurement before final mission integration. Use stationary
  samples at a known observation pose to classify one named map feature, then
  update the map, plan and return. Keep general reactive mapping outside the core.
- Publish success, partial credit and failure rules before each release. Score
  functional correctness, explanation and evidence before speed ranking; keep
  physical judging distinct from odometry and labelled virtual truth.
- Require a short run record: selected components and world, changed parameter,
  predicted effect, relevant plots, observed result and next change. Distinguish
  compiler Problems, Python Program output and connection System log.
