# Lesson 7: a state machine separates sensing, turning, and departure.

from ucsb_xrp import RobotConfig, XRPBot

from tutorial_helpers import drive_for, drive_until_close


APPROACH = "approach"
TURN = "turn"
DEPART = "depart"
DONE = "done"


def next_state(state, obstacle_detected=True):
    if state == APPROACH:
        return TURN if obstacle_detected else DONE
    if state == TURN:
        return DEPART
    if state == DEPART:
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
            state = next_state(state, obstacle_detected=range_mm is not None)
        elif state == TURN:
            drive_for(bot, -0.34, 0.34, 650)
            state = next_state(state)
        elif state == DEPART:
            drive_for(bot, 0.34, 0.34, 800)
            state = next_state(state)
finally:
    bot.stop()

print("state:", state)
print("Lesson 7 complete: finite-state route finished")
