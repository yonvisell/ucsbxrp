# New Demo · Motor Characterization

Measure separate left/right wheel speed responses to a small open-loop effort
sweep. The working experiment uses efforts 0.16, 0.22 and 0.28 for 0.7 s each,
with zero before and after each step. A distinct 450 mm wheel-travel bound stops
unexpected motion. Each interval must be at most 1 s and effort at most 0.3.

Begin virtually. A physical run requires the instructor's approved lane,
power/load conditions and motion procedure. Record those conditions with the
plots. The program starts at zero effort and calls `bot.stop()` in `finally` after
normal completion or a Python exception. The target runtime handles the IDE's
**Stop** separately; forced termination can bypass Python cleanup.

This intentionally uses XRPBot and a supplied SensorModel directly, so wheel
feedback does not obscure the effort/speed relationship. Its explicit sampling
delay belongs to this low-level loop; never copy it into Robot.step loops.
The results are characterization samples, not an automated calibration fit.

Use experiment.py for bounded effort/duration choices. Compare steady portions
and transient response for each wheel, estimate a usable feedforward relation,
then test it under closed-loop control in Curling. Do not fit a single shared
curve if left and right responses differ. Compile, Run, and save effort and
left/right speed plots with notes. world.json supplies the clear virtual lane.
