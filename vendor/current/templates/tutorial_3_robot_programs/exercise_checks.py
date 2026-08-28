# Software checks for the Tutorial 3 RobotState calculation and sampled run.

from ucsb_xrp import Measurements, MotionCommand, Pose, RobotState

from student_work import mean_wheel_position_mm, run_robot_program


class _RecordingRobot:
    # Record Robot method calls without constructing or moving a robot.

    def __init__(self, fail_at_step=None, fail_on_start=False):
        self.start_poses = []
        self.step_calls = []
        self.stop_count = 0
        self.state = None
        self.fail_at_step = fail_at_step
        self.fail_on_start = fail_on_start

    def start(self, initial_pose):
        self.start_poses.append(initial_pose)
        if self.fail_on_start:
            raise RuntimeError("injected robot.start failure")
        self.state = _state_for_step(0)
        return self.state

    def step(self, command, read_range=False):
        self.step_calls.append((command, read_range))
        if len(self.step_calls) == self.fail_at_step:
            raise RuntimeError("injected robot.step failure")
        self.state = _state_for_step(len(self.step_calls))
        return self.state

    def stop(self):
        self.stop_count += 1


def _state_for_step(step):
    left_mm = float(step) * 2.0
    right_mm = float(step) * 2.4
    measurements = Measurements(
        step * 20,
        0.02 if step else 0.0,
        left_mm,
        right_mm,
        2.0 if step else 0.0,
        2.4 if step else 0.0,
        100.0 if step else 0.0,
        120.0 if step else 0.0,
        None,
        False,
    )
    return RobotState(measurements, Pose(left_mm, 0.0, 0.0))


def _close(actual, expected, tolerance=0.000001):
    if abs(actual - expected) > tolerance:
        raise AssertionError("expected {}, received {}".format(expected, actual))


def _expect_value_error(function, *arguments):
    try:
        function(*arguments)
    except ValueError:
        return
    raise AssertionError("invalid speed or sample count should raise ValueError")


def _check_mean_wheel_position():
    state = _state_for_step(5)
    result = mean_wheel_position_mm(state)
    if result is None:
        raise NotImplementedError("mean_wheel_position_mm returned no result")
    _close(result, 11.0)


def _check_robot_program():
    robot = _RecordingRobot()
    result = run_robot_program(robot, 80.0, 30)
    if len(robot.start_poses) != 1:
        raise AssertionError("call robot.start(...) exactly once")
    if robot.start_poses[0] != Pose(0.0, 0.0, 0.0):
        raise AssertionError("start with Pose(0.0, 0.0, 0.0)")
    if len(robot.step_calls) != 30:
        raise AssertionError(
            "sample_count=30 requires exactly 30 robot.step calls; received {}".format(
                len(robot.step_calls)
            )
        )
    for index, call in enumerate(robot.step_calls):
        command = call[0]
        if not isinstance(command, MotionCommand):
            raise AssertionError(
                "step {} did not receive a MotionCommand".format(index + 1)
            )
        if (command.forward_speed_mm_s, command.turn_rate_rad_s) != (80.0, 0.0):
            raise AssertionError(
                "step {} should request 80.0 mm/s straight motion".format(
                    index + 1
                )
            )
    if result is not robot.state:
        raise AssertionError("return the RobotState from the final robot.step call")
    if robot.stop_count != 1:
        raise AssertionError("call robot.stop() exactly once from finally")

    for speed_mm_s, count in ((0.0, 30), (-1.0, 30), (80.0, 19), (80.0, 151), (80.0, True)):
        invalid_robot = _RecordingRobot()
        _expect_value_error(run_robot_program, invalid_robot, speed_mm_s, count)
        if invalid_robot.start_poses or invalid_robot.stop_count:
            raise AssertionError("validate inputs before starting the robot")

    failing_robot = _RecordingRobot(fail_at_step=3)
    try:
        run_robot_program(failing_robot, 80.0, 30)
    except RuntimeError as error:
        if str(error) != "injected robot.step failure":
            raise
    else:
        raise AssertionError("do not suppress an unexpected robot.step error")
    if failing_robot.stop_count != 1:
        raise AssertionError("call robot.stop() from finally if robot.step raises")

    failing_start_robot = _RecordingRobot(fail_on_start=True)
    try:
        run_robot_program(failing_start_robot, 80.0, 30)
    except RuntimeError as error:
        if str(error) != "injected robot.start failure":
            raise
    else:
        raise AssertionError("do not suppress an unexpected robot.start error")
    if failing_start_robot.stop_count != 1:
        raise AssertionError("call robot.stop() from finally if robot.start raises")


def run_exercise_checks():
    checks = (
        ("1 · mean wheel position", _check_mean_wheel_position),
        ("2 · sampled robot program", _check_robot_program),
    )
    passed = 0
    incomplete = 0
    incorrect = 0
    for label, check in checks:
        try:
            check()
        except NotImplementedError as error:
            incomplete += 1
            print("NOT COMPLETED · {} · {}".format(label, error))
        except Exception as error:
            incorrect += 1
            print("INCORRECT · {} · {}".format(label, error))
        else:
            passed += 1
            print("PASS · " + label)
    print(
        "Tutorial 3: {} passed · {} not completed · {} incorrect".format(
            passed, incomplete, incorrect
        )
    )
    return incorrect == 0 and incomplete == 0


if __name__ == "__main__":
    run_exercise_checks()
