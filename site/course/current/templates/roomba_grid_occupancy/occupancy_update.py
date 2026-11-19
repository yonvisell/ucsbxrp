# Classify floor cells from an ultrasound range estimate.

from occupancy_map import FREE, OCCUPIED, UNKNOWN
from settings import CLEAR_PASSES


def update_occupancy(grid, free_cells, hit_cell):
    # Apply one fresh range estimate to the floor map.
    # grid is a MeasuredMap. The supplied geometry converts world coordinates
    # in mm to unitless integer (column, row) indices. They start at zero in
    # the southwest corner and increase east and north, respectively.
    # free_cells is a sequence of (column, row) pairs crossed in order away from
    # the sensor. It excludes the endpoint and can be empty.
    # hit_cell is the (column, row) pair for the estimated surface, or None
    # when the range estimate supplies no interior endpoint.
    # Update states and crossing counts in place. Cells absent from both inputs
    # retain their previous evidence. Return None.

    # For each cell in free_cells, read its previous classification with
    # grid.state(cell). What does a crossing tell you about an UNKNOWN cell?
    # Use grid.set_state(cell, FREE) when the evidence warrants that change.

    # Suppose a later line crosses the orange endpoint cell from Figure 3.
    # For an OCCUPIED cell, grid.count_clear_pass(cell) records one crossing
    # and returns the new count. Use CLEAR_PASSES to decide whether to clear it.
    # A cell that is already FREE keeps that classification.

    # After all crossings, handle the endpoint if one was supplied. The method
    # grid.record_hit(hit_cell) marks it occupied and restarts its count.
    pass
