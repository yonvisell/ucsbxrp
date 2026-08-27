# Lesson 7: a state machine separates sensing, turning, and departure.

from ucsb_xrp import RobotConfig, XRPBot

from tutorial_helpers import drive_for, drive_until_close


APPROACH = "approach"
TURN = "turn"
DEPART = "depart"
DONE = "done"

OBSTACLE_DETECTED = "obstacle_detected"
TIME_LIMIT_REACHED = "time_limit_reached"
MOTION_COMPLETE = "motion_complete"


def next_state(state, event):
    """Return the state reached from one explicit state/event pair."""
    if state == APPROACH and event == OBSTACLE_DETECTED:
        return TURN
    if state == TURN and event == MOTION_COMPLETE:
        return DEPART
    if state == DEPART and event == MOTION_COMPLETE:
        return DONE
    return DONE


bot = XRPBot(RobotConfig(max_drive_command=0.45))
state = APPROACH
try:
    while state != DONE:
        print("state:", state)
        if state == APPROACH:
            range_mm = drive_until_close(
                bot,
                left_command=0.42,
                right_command=0.42,
                stop_range_mm=350.0,
                time_limit_ms=3000,
            )
            # No range means the time limit ended before an obstacle was found.
            if range_mm is None:
                event = TIME_LIMIT_REACHED
            else:
                event = OBSTACLE_DETECTED
            state = next_state(state, event)
        elif state == TURN:
            drive_for(bot, -0.34, 0.34, 650)
            state = next_state(state, MOTION_COMPLETE)
        elif state == DEPART:
            drive_for(bot, 0.34, 0.34, 800)
            state = next_state(state, MOTION_COMPLETE)
finally:
    bot.stop()

print("state:", state)
print("Lesson 7 complete: finite-state route finished")
