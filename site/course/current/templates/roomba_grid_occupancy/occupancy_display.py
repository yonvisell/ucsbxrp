# Publish the measured grid for the World view and its recording.

import json

_snapshot_number = 0
_part_chars = 448  # Leave room for the header within the XRP's 512-character stdout line.
_first_wide_mask = 1 << 53


def _wire_rows(rows, columns):
    # JavaScript can read the smaller integer masks exactly. Preserve every bit of larger masks.
    if columns <= 53:
        return rows
    return [hex(mask) if mask >= _first_wide_mask else mask for mask in rows]


def publish_grid(grid, elapsed_ms):
    # Send one full snapshot, timed from the initial Robot.start sample.
    global _snapshot_number
    payload = json.dumps({
        "tMs": elapsed_ms, "origin": [grid.bounds[0], grid.bounds[1]], "cell_mm": grid.cell_mm,
        "columns": grid.columns, "rows": _wire_rows(grid.rows, grid.columns),
        "free_rows": _wire_rows(grid.free_rows, grid.columns),
    }, separators=(",", ":"))
    if len("@roomba-grid ") + len(payload) < 512:
        print("@roomba-grid", payload)
        return
    _snapshot_number += 1
    parts = (len(payload) + _part_chars - 1) // _part_chars
    for index in range(parts):
        start = index * _part_chars
        print("@roomba-grid+ {} {}/{}".format(_snapshot_number, index, parts),
              payload[start:start + _part_chars])
