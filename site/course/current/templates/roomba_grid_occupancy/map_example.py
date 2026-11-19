# Follow one square through a short sequence of observations with the Project's occupancy update.

from measured_map import MeasuredMap
from occupancy_map import FREE, OCCUPIED, UNKNOWN
from occupancy_update import update_occupancy


def show_cell_example():
    # Use a separate one-cell map so every run presents the same observations.
    grid = MeasuredMap((0, 0, 50, 50), cell_mm=50)
    cell = (0, 0)
    names = {UNKNOWN: "unknown", FREE: "free", OCCUPIED: "occupied"}
    for events in (("cross", "hit", "cross", "cross"), ("hit", "cross", "cross", "cross")):
        results = []
        for event in events:
            if event == "hit":
                update_occupancy(grid, (), cell)
            else:
                update_occupancy(grid, (cell,), None)
            results.append("{}: {}".format(event, names[grid.state(cell)]))
        print("One-cell example | " + " | ".join(results))
