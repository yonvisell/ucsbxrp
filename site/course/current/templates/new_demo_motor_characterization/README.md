# Demonstration · Motor Characterization

Measure how each wheel's speed changes with motor effort, without wheel-speed
feedback. Use the results to choose separate left and right feedforward settings
for Robot Curling.

Begin with the Virtual XRP. For physical measurements, use the lane and motion
procedure arranged by the instructor. Record the robot, battery condition, and
whether the wheels are raised or driving on the floor; the load affects the
result.

## Run the experiment

Open `experiment.py` to inspect the effort levels and intervals. The supplied
program applies efforts 0.16, 0.22, and 0.28, each for 0.7 s, with zero effort
between steps. It limits effort to 0.3, each interval to 1 s, and wheel travel
to 1500 mm over the whole experiment. Compile, Run, and save the effort and
left/right wheel-speed plots.

These short timed inputs measure the motor's response. In the challenges,
measured distance, sensor readings, and pose determine when to turn or stop.
This demonstration uses `XRPBot` directly and controls its own sampling;
`Robot.step()` already handles sampling in the challenge programs.

## Interpret the measurements

Plot each wheel's speed against effort using portions where speed is approximately constant.
Identify the effort needed to start moving and the range where the relation is
approximately linear. If a step is still accelerating at its end, record that
fact instead of treating its final speed as a steady value.

Estimate a relation `effort = offset + gain * speed_mm_s` for each wheel. Enter
its offset and gain as `left_start_command` and `left_speed_command_gain` in
`robot_config.py`, and use the corresponding `right_` fields for the right
wheel. Verify these values in the closed-loop Curling run. Keep the plots,
measurement conditions, and fitted values for the preliminary lab-work section
of the pair's Challenge 1 report.
