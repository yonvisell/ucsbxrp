# Lesson 3: a small class keeps related state and behavior together.


class SampleCounter:
    def __init__(self):
        self.count = 0
        self.total = 0.0

    def add(self, value):
        self.count += 1
        self.total += value

    def mean(self):
        return self.total / self.count if self.count else None


counter = SampleCounter()
for value in (2.0, 4.0, 6.0):
    counter.add(value)
print("mean:", counter.mean())
