"""Load the dimensioned world that belongs to a course project."""

try:
    import json
except ImportError:  # pragma: no cover - older MicroPython name
    import ujson as json
import sys

from .maps import ArenaMap
from .records import NavigationGoal, Pose


def _number(value, name):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise TypeError("{} must be a number".format(name))
    return float(value)


def _bounds(item, name):
    try:
        bounds = (
            _number(item["minimum_x_mm"], name + ".minimum_x_mm"),
            _number(item["minimum_y_mm"], name + ".minimum_y_mm"),
            _number(item["maximum_x_mm"], name + ".maximum_x_mm"),
            _number(item["maximum_y_mm"], name + ".maximum_y_mm"),
        )
    except (KeyError, TypeError):
        raise ValueError("{} must define four millimeter bounds".format(name))
    if bounds[2] <= bounds[0] or bounds[3] <= bounds[1]:
        raise ValueError("{} must have positive width and height".format(name))
    return bounds


class ProjectWorld:
    """One named world loaded from the project's ``world.json`` file."""

    __slots__ = (
        "_id",
        "_label",
        "_bounds_mm",
        "_initial_pose",
        "_obstacles",
        "_features",
        "_markers",
    )

    def __init__(self, item):
        if not isinstance(item, dict):
            raise TypeError("a world must be a JSON object")
        self._id = item.get("id")
        self._label = item.get("label")
        if not isinstance(self._id, str) or not self._id:
            raise ValueError("a world must have an id")
        if not isinstance(self._label, str) or not self._label:
            raise ValueError("a world must have a label")
        self._bounds_mm = _bounds(item.get("bounds"), "bounds")

        pose = item.get("initial_pose", {})
        if not isinstance(pose, dict):
            raise TypeError("initial_pose must be a JSON object")
        self._initial_pose = Pose(
            _number(pose.get("x_mm", 0.0), "initial_pose.x_mm"),
            _number(pose.get("y_mm", 0.0), "initial_pose.y_mm"),
            _number(pose.get("heading_rad", 0.0), "initial_pose.heading_rad"),
        )

        obstacles = []
        features = {}
        for index, obstacle in enumerate(item.get("obstacles", ())):
            if not isinstance(obstacle, dict):
                raise TypeError("obstacles[{}] must be a JSON object".format(index))
            rectangle = _bounds(obstacle, "obstacles[{}]".format(index))
            feature = obstacle.get("feature")
            if feature is None:
                obstacles.append(rectangle)
            elif isinstance(feature, str) and feature:
                features[feature] = rectangle
            else:
                raise ValueError("an obstacle feature must have a nonempty name")
        self._obstacles = tuple(obstacles)
        self._features = features

        markers = item.get("markers", ())
        if not isinstance(markers, (tuple, list)):
            raise TypeError("markers must be a list")
        self._markers = tuple(markers)

    @property
    def id(self):
        return self._id

    @property
    def label(self):
        return self._label

    @property
    def bounds_mm(self):
        return self._bounds_mm

    @property
    def initial_pose(self):
        return self._initial_pose

    @property
    def feature_names(self):
        return tuple(sorted(self._features.keys()))

    def arena_map(self, blocked_features=()):
        """Return an ``ArenaMap`` using this world's bounds and obstacles."""

        return ArenaMap(
            self.bounds_mm,
            obstacles=self._obstacles,
            features=self._features,
            blocked_features=blocked_features,
        )

    def waypoint(self, name):
        """Return the named waypoint marker as a ``NavigationGoal``."""

        for marker in self._markers:
            if marker.get("type") == "waypoint" and marker.get("name") == name:
                heading = marker.get("heading_rad")
                return NavigationGoal(
                    _number(marker.get("x_mm"), name + ".x_mm"),
                    _number(marker.get("y_mm"), name + ".y_mm"),
                    None if heading is None else _number(heading, name + ".heading_rad"),
                )
        raise ValueError("world '{}' has no waypoint '{}'".format(self.id, name))

    def waypoints(self):
        """Return all waypoint markers in their file order."""

        values = []
        for marker in self._markers:
            if marker.get("type") != "waypoint":
                continue
            heading = marker.get("heading_rad")
            values.append(
                NavigationGoal(
                    _number(marker.get("x_mm"), "waypoint.x_mm"),
                    _number(marker.get("y_mm"), "waypoint.y_mm"),
                    None
                    if heading is None
                    else _number(heading, "waypoint.heading_rad"),
                )
            )
        return tuple(values)


def load_world(path="world.json", world_id=None):
    """Read ``path`` and return its default world or the requested world."""

    source = None
    try:
        source = open(path, "r")
    except OSError as first_error:
        if path.startswith("/"):
            raise first_error
        for root in sys.path:
            if not root:
                continue
            try:
                source = open(root.rstrip("/") + "/" + path, "r")
                break
            except OSError:
                pass
        if source is None:
            raise first_error
    try:
        catalog = json.loads(source.read())
    finally:
        source.close()
    if not isinstance(catalog, dict) or not isinstance(catalog.get("worlds"), list):
        raise ValueError("world.json must contain a worlds list")
    selected_id = catalog.get("default_world") if world_id is None else world_id
    for item in catalog["worlds"]:
        if isinstance(item, dict) and item.get("id") == selected_id:
            return ProjectWorld(item)
    raise ValueError("world.json has no world '{}'".format(selected_id))
