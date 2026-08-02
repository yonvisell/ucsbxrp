# Lesson 4: report expected failures and always perform cleanup.


def positive_gain(value):
    if value <= 0.0:
        raise ValueError("gain must be positive")
    return value


resource_open = False
try:
    resource_open = True
    gain = positive_gain(0.8)
    print("gain:", gain)
except ValueError as error:
    print("invalid setting:", error)
finally:
    resource_open = False
    print("resource closed:", not resource_open)
