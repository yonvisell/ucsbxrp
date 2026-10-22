# Challenge 2.2: Circular Driving

Implement `DifferentialDrive.wheel_speeds(command)` in **differential_drive.py**.
Drive constant-speed circles and compare their measured diameter with the request.
Diameter means the path of the **midpoint between the drive wheels**, not a wheel's path.

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 230" width="100%" style="max-width:580px;height:auto" role="img" aria-label="Circular axle-midpoint path, diameter D, and a counterclockwise start tangent">
  <rect width="580" height="230" rx="12" fill="#f5f7fa"/>
  <circle cx="140" cy="110" r="82" fill="none" stroke="#245e98" stroke-width="3"/>
  <line x1="58" y1="110" x2="222" y2="110" stroke="#273646" stroke-width="2"/>
  <path d="M65 106 L58 110 L65 114 M215 106 L222 110 L215 114" fill="none" stroke="#273646" stroke-width="2"/>
  <text x="140" y="101" text-anchor="middle" fill="#182b40" font-family="sans-serif" font-size="17">diameter D</text>
  <path d="M212 148 L216 137 L224 146" fill="none" stroke="#245e98" stroke-width="3"/>
  <circle cx="140" cy="192" r="5" fill="#182b40"/>
  <path d="M147 192 H238 L229 187 M238 192 L229 197" fill="none" stroke="#182b40" stroke-width="2"/>
  <text x="270" y="75" fill="#182b40" font-family="sans-serif" font-size="17">Counterclockwise: turn rate &gt; 0</text>
  <text x="270" y="107" fill="#182b40" font-family="sans-serif" font-size="17">Right wheel travels farther</text>
  <text x="270" y="184" fill="#182b40" font-family="sans-serif" font-size="17">Start: axle midpoint</text>
  <text x="270" y="207" fill="#182b40" font-family="sans-serif" font-size="17">Arrow: initial forward motion</text>
</svg>

1. Copy your tested **sensor_processor.py** into this Project. In **robot_setup.py**,
   copy your physical wheel dimensions and feedforward values into
   `PHYSICAL_ROBOT_CONFIG`: `wheel_diameter_mm`, `track_width_mm`,
   `left_start_command`, `right_start_command`, `left_speed_command_gain`, and
   `right_speed_command_gain`. `VIRTUAL_ROBOT_CONFIG` is supplied separately.
2. In `DifferentialDrive.wheel_speeds(command)`, use the forward speed,
   `command.forward_speed_mm_s` [mm/s], turn rate, `command.turn_rate_rad_s`
   [rad/s], and wheel separation, `self.config.track_width_mm` [mm], to calculate
   left and right speeds. Return `WheelSpeeds(left_mm_s, right_mm_s)`.
   Their average must equal the forward speed; their difference must produce
   the requested turn. For a left turn, which wheel must be faster? Are you
   using radians and the distance from the axle midpoint to each wheel?
3. Select **Run code tests**. After both classes pass, set
   `USE_STUDENT_SENSOR_PROCESSOR = True` and `USE_STUDENT_DIFFERENTIAL_DRIVE = True`
   in **robot_setup.py**. `False` selects a supplied comparison implementation.
4. In **challenge.py**, set `CIRCLE_DIAMETER_MM` to **200, 300, then 400 mm**:
   approximately 1/6, 1/4, and 1/3 of the 1219.2 mm arena width. For each diameter,
   test `CLOCKWISE = False` and `True`. Keep `FORWARD_SPEED_MM_S = 100.0` for all six
   trials, or record the common speed you choose. **Compile**, then **Run** each trial.
5. Observe the path. Mark the axle midpoint's two opposite extreme positions on
   the floor and measure their separation. The supplied program stops after the
   encoders report one circumference; record if the path does not close.
   Physical measurements determine the actual diameter; the odometry trace is an estimate.
   In Virtual XRP, use the maximum minus minimum of `ground_truth_x_mm` or
   `ground_truth_y_mm` in the CSV to measure the path span.
6. Select Monitor's **Wheel speeds** plot and a **Time window** covering the trial
   (30 s covers the default runs). Use **Export plots as SVG** and
   **Export run data as CSV** for each run. Compare measured
   `left_wheel_speed_mm_s` and `right_wheel_speed_mm_s` with
   `target_left_wheel_speed_mm_s` and `target_right_wheel_speed_mm_s` in the CSV.
   If the diameter is wrong, do the wheel targets have the expected ordering and
   ratio, or do the measured speeds fail to follow them?

**Deliverables:** your **differential_drive.py**, six plot/CSV exports, and a table
of requested diameter, direction, speed, measured diameter, and any drift or failure to close.
