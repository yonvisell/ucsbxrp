# Hardware-free checks call student classes directly, regardless of Run selectors.
from line_follower import LineFollower
from ucsb_xrp.component_checks import run_component_checks


def check_line_follower():
    run_component_checks(line_follower=LineFollower)


check_line_follower()
