"""Private cooperative stop signal used by the physical XRP service."""


class ProgramStopped(BaseException):
    """End a managed student program without reporting a program error."""


_stop_requested = False


def request_stop():
    global _stop_requested
    _stop_requested = True


def clear_stop():
    global _stop_requested
    _stop_requested = False


def check_stop():
    if _stop_requested:
        raise ProgramStopped()
