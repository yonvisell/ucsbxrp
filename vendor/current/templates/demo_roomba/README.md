# Roomba-style obstacle-avoidance demo

The XRP drives forward while sampling the ultrasound sensor. Once a filtered
range estimate is at or below 120 mm, it reverses for 20 ordinary control
samples and then turns in place. A compact seeded generator chooses both the
turn direction and duration, making the sequence repeatable rather than
dependent on a host random-number implementation.

`world.json` provides a bounded virtual room with a broad divider. The
course-arena boundary is also visible to the Virtual XRP range sensor. The
program takes one stopped range sample before motion, uses `Robot.step()` as
its only clock, and ends at either 900 samples or 1900 mm of measured wheel
travel. Ten consecutive samples without a usable range stop the demo instead
of allowing blind forward travel. The `finally` block calls `robot.stop()` for
normal and exceptional exits.

The same project runs on Virtual XRP or Physical XRP. A physical run requires
a supervised, bounded floor area with broad, ultrasound-reflective obstacles;
thin, soft, or strongly angled surfaces may not return a usable echo. Speeds,
reverse duration, turn duration, total samples, and wheel travel are all
limited in `main.py`.
