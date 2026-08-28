# Call-sequence check for the Tutorial 3 sampled robot program.

from ucsb_xrp import Measurements, MotionCommand, Pose, RobotState

from student_work import run_robot_program


class _RecordingRobot:
    # Record course-interface calls without constructing or moving a robot.

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
    distance_mm = float(step) * 2.0
    measurements = Measurements(
        step * 20,
        0.02 if step else 0.0,
        distance_mm,
        distance_mm,
        2.0 if step else 0.0,
        2.0 if step else 0.0,
        100.0 if step else 0.0,
        100.0 if step else 0.0,
        None,
        False,
    )
    return RobotState(measurements, Pose(distance_mm, 0.0, 0.0))


def _check_robot_program():
    robot = _RecordingRobot()
    result = run_robot_program(robot)
    if len(robot.start_poses) != 1:
        raise AssertionError("call robot.start(...) exactly once")
    if robot.start_poses[0] != Pose(0.0, 0.0, 0.0):
        raise AssertionError("start with Pose(0.0, 0.0, 0.0)")
    if len(robot.step_calls) < 20 or len(robot.step_calls) > 150:
        raise AssertionError(
            "expected 20 to 150 robot.step calls, received {}".format(
                len(robot.step_calls)
            )
        )
    for index, call in enumerate(robot.step_calls):
        command = call[0]
        if not isinstance(command, MotionCommand):
            raise AssertionError("step {} did not receive a MotionCommand".format(index + 1))
        if command.forward_speed_mm_s <= 0.0 or command.turn_rate_rad_s != 0.0:
            raise AssertionError("step {} should request straight forward motion".format(index + 1))
    if result is not robot.state:
        raise AssertionError("return the RobotState from the final robot.step call")
    if robot.stop_count != 1:
        raise AssertionError("call robot.stop() exactly once from finally")

    failing_robot = _RecordingRobot(fail_at_step=3)
    try:
        run_robot_program(failing_robot)
    except RuntimeError as error:
        if str(error) != "injected robot.step failure":
            raise
    else:
        raise AssertionError("do not suppress an unexpected robot.step error")
    if failing_robot.stop_count != 1:
        raise AssertionError("call robot.stop() from finally if robot.step raises")

    failing_start_robot = _RecordingRobot(fail_on_start=True)
    try:
        run_robot_program(failing_start_robot)
    except RuntimeError as error:
        if str(error) != "injected robot.start failure":
            raise
    else:
        raise AssertionError("do not suppress an unexpected robot.start error")
    if failing_start_robot.stop_count != 1:
        raise AssertionError("call robot.stop() from finally if robot.start raises")


def run_exercise_checks():
    # Run the sampled-program exercise and print one clear outcome.
    try:
        _check_robot_program()
    except NotImplementedError as error:
        print("NOT COMPLETED · sampled robot program · " + str(error))
        print("Tutorial 3: 0 passed · 1 not completed · 0 incorrect")
        return False
    except Exception as error:
        print("INCORRECT · sampled robot program · " + str(error))
        print("Tutorial 3: 0 passed · 0 not completed · 1 incorrect")
        return False
    print("PASS · sampled robot program")
    print("Tutorial 3: 1 passed · 0 not completed · 0 incorrect")
    return True


if __name__ == "__main__":
    run_exercise_checks()
