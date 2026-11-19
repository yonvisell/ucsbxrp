# Classify floor cells from an ultrasound range estimate.

from occupancy_map import FREE, OCCUPIED, UNKNOWN
from settings import CLEAR_PASSES


def update_occupancy(grid, crossed_cells, hit_cell):
    # Update grid (the persistent MeasuredMap) from one range estimate.
    # crossed_cells contains the cell addresses the beam passed through, nearest
    # first. It can be empty. hit_cell is the estimated surface cell, or None.
    # Modify classifications and crossing counts in place. Return None.

    # For each crossed cell, use grid.state(cell) to read its classification.
    # A first crossing can mark an UNKNOWN cell FREE with grid.set_state.
    # For an OCCUPIED cell, use the count returned by grid.count_clear_pass(cell)
    # and the threshold CLEAR_PASSES. An already FREE cell needs no change.

    # If hit_cell is present, grid.record_hit(hit_cell) marks it OCCUPIED
    # and restarts its crossing count, even if crossed_cells is empty.
    pass
