# Lesson 1: values, names, units, and functions.

distance_mm = 600.0
travel_time_s = 4.0


def average_speed_mm_s(distance, duration):
    if duration <= 0.0:
        raise ValueError("duration must be positive")
    return distance / duration


speed_mm_s = average_speed_mm_s(distance_mm, travel_time_s)
print("average speed:", speed_mm_s, "mm/s")
