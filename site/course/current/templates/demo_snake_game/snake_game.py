# Finite tail and food rules; no robot or browser dependencies.

from math import cos, sin, sqrt
from ucsb_xrp import NavigationGoal

from snake_food import food_count, food_positions
from snake_config import CONFIG


BODY = CONFIG["body"]
SAMPLE_SPACING_MM = BODY["sample_spacing_mm"]
MAX_TAIL_POINTS = BODY["maximum_tail_points"]
COLLISION_REACH_MM = (BODY["head_diameter_mm"] + BODY["tail_diameter_mm"]) / 2
FOOD_REACH_MM = BODY["head_diameter_mm"] / 2


def distance(first, second):
    dx = first[0] - second[0]
    dy = first[1] - second[1]
    return sqrt(dx * dx + dy * dy)


def distance_to_segment(point, start, end):
    # Project onto the finite segment, including either endpoint when closest.
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    length_squared = dx * dx + dy * dy
    if length_squared == 0:
        return distance(point, start)
    fraction = ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / length_squared
    fraction = max(0.0, min(1.0, fraction))
    closest = (start[0] + fraction * dx, start[1] + fraction * dy)
    return distance(point, closest)


class SnakeGame:
    def __init__(self, world, initial_tail_mm=None):
        bounds = world.bounds_mm
        count = food_count(bounds, CONFIG["food"]["per_square_meter"])
        if world.id == "snake-crossing":
            self.food = world.waypoints()[:count]
        else:
            self.food = tuple(
                NavigationGoal(x, y) for x, y in food_positions(world, count)
            )
        if not self.food:
            raise ValueError("world.json needs food waypoints")
        self.bounds = bounds
        self.score = 0
        self.tail_mm = float(BODY["initial_tail_mm"] if initial_tail_mm is None else initial_tail_mm)
        self.phase = "playing"
        pose = world.initial_pose
        self.head = (pose.x_mm, pose.y_mm)
        self.points = [
            (pose.x_mm - self.tail_mm * cos(pose.heading_rad),
             pose.y_mm - self.tail_mm * sin(pose.heading_rad)),
            self.head,
        ]

    def current_food(self):
        return self.food[self.score] if self.score < len(self.food) else None

    def _trim_tail(self):
        # Retain the requested path length within the configured memory bound.
        while len(self.points) > 1:
            length = distance(self.points[-1], self.head)
            for index in range(1, len(self.points)):
                length += distance(self.points[index - 1], self.points[index])
            if length <= self.tail_mm:
                break
            excess = length - self.tail_mm
            first_length = distance(self.points[0], self.points[1])
            if first_length <= excess:
                self.points.pop(0)
            else:
                fraction = excess / first_length
                first = self.points[0]
                second = self.points[1]
                self.points[0] = (
                    first[0] + fraction * (second[0] - first[0]),
                    first[1] + fraction * (second[1] - first[1]),
                )
                break
        while len(self.points) > MAX_TAIL_POINTS:
            self.points.pop(0)

    def _crosses_tail(self):
        # Exclude the near-head neck before checking older tail segments.
        distance_behind = distance(self.points[-1], self.head)
        for index in range(len(self.points) - 1, 0, -1):
            start = self.points[index - 1]
            end = self.points[index]
            segment_length = distance(start, end)
            if distance_behind >= BODY["neck_clearance_mm"]:
                if distance_to_segment(self.head, start, end) <= COLLISION_REACH_MM:
                    return True
            distance_behind += segment_length
        return False

    def observe(self, pose, growth_mm, range_mm=None):
        # Return True when a pellet is eaten or the game ends.
        if self.phase != "playing":
            return False
        self.head = (pose.x_mm, pose.y_mm)
        if distance(self.points[-1], self.head) >= SAMPLE_SPACING_MM:
            self.points.append(self.head)
        self._trim_tail()
        # Terminal hazards are checked before a food pickup at the same pose.
        if range_mm is not None and range_mm <= BODY["obstacle_stop_mm"]:
            self.phase = "obstacle"
            return True
        if (
            self.head[0] < self.bounds[0] + BODY["wall_margin_mm"]
            or self.head[0] > self.bounds[2] - BODY["wall_margin_mm"]
            or self.head[1] < self.bounds[1] + BODY["wall_margin_mm"]
            or self.head[1] > self.bounds[3] - BODY["wall_margin_mm"]
        ):
            self.phase = "wall"
            return True
        if self._crosses_tail():
            self.phase = "collision"
            return True
        goal = self.current_food()
        if goal is not None and distance(self.head, (goal.x_mm, goal.y_mm)) <= FOOD_REACH_MM:
            self.score += 1
            self.tail_mm += float(growth_mm)
            if self.score == len(self.food):
                self.phase = "complete"
            return True
        return False
