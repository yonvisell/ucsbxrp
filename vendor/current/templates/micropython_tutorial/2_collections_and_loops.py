# Lesson 2: lists, dictionaries, and iteration.

range_samples_mm = [420.0, 405.0, 398.0, 390.0]
summary = {
    "count": len(range_samples_mm),
    "nearest_mm": min(range_samples_mm),
}

total_mm = 0.0
for sample_mm in range_samples_mm:
    total_mm += sample_mm

summary["mean_mm"] = total_mm / summary["count"]
print("range summary:", summary)
