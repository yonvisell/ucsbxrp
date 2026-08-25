# Lesson 2: store a route in a list and inspect it with a loop.

route = [
    {"name": "first straight", "distance_mm": 250.0},
    {"name": "crossing", "distance_mm": 150.0},
    {"name": "final straight", "distance_mm": 200.0},
]

total_distance_mm = 0.0
for segment in route:
    distance_mm = segment["distance_mm"]
    if distance_mm <= 0.0:
        raise ValueError("every route distance must be positive")
    total_distance_mm += distance_mm
    print(segment["name"], "=", distance_mm, "mm")

assert total_distance_mm == 600.0
print("Lesson 2 complete:", len(route), "segments,", total_distance_mm, "mm")
