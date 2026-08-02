# Lesson 7: a finite-state machine makes transitions explicit.

WAITING = "waiting"
MOVING = "moving"
DONE = "done"


def next_state(state, start_pressed=False, goal_reached=False):
    if state == WAITING and start_pressed:
        return MOVING
    if state == MOVING and goal_reached:
        return DONE
    return state


state = WAITING
events = (
    {"start_pressed": True},
    {},
    {"goal_reached": True},
)
for event in events:
    state = next_state(state, **event)
    print("state:", state)
