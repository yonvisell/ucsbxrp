"""Motion-free search comparison on the selected map."""
from search import astar, bfs
from ucsb_xrp import OccupancyGrid, load_world

world = load_world()
grid = OccupancyGrid.from_arena(world.arena_map(), 100.0, 95.0)
start = grid.world_to_cell(world.initial_pose.x_mm, world.initial_pose.y_mm)
finish = world.waypoint("destination")
goal = grid.world_to_cell(finish.x_mm, finish.y_mm)
for name, search in (("BFS", bfs), ("A*", astar)):
    path, expanded = search(grid, start, goal)
    print(name, "path_edges:", None if path is None else len(path.cells) - 1, "expanded:", expanded)
print("Planning comparison complete. Compare search effort; both use the same path-cost model.")
