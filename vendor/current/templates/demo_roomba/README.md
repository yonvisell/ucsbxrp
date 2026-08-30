# Roomba-style obstacle-avoidance demo

The XRP drives forward while sampling the ultrasound sensor. Once a filtered
range estimate is at or below 250 mm, it reverses for 20 ordinary control
samples and then turns in place. A compact seeded generator chooses both the
turn direction and duration, making the sequence repeatable rather than
dependent on a host random-number implementation.

`world.json` provides a bounded virtual room with a broad divider. The
course-arena boundary is also visible to the Virtual XRP range sensor. The
program takes one stopped range sample before motion and uses `Robot.step()` as
its only clock. The 150 mm/s forward request is paired with the 250 mm obstacle
threshold; reverse motion is 120 mm/s and the in-place turn request is
1.4 rad/s. Ten consecutive samples without a usable range stop the demo instead
of allowing blind forward travel.

Use the ordinary **Stop** control to end a successful wandering run. The visible
90000-sample and 190000 mm wheel-travel guards are finite failure backstops,
approximately one hundred times the former short-run limits; they are not the
expected terminator. The `finally` block calls `robot.stop()` for normal,
stopped, and exceptional exits.

The same project runs on Virtual XRP or Physical XRP. A physical run requires
a supervised, bounded floor area with broad, ultrasound-reflective obstacles;
thin, soft, or strongly angled surfaces may not return a usable echo. Speeds,
reverse duration, turn duration, sample guard, and wheel-travel guard are all
visible in `main.py`.
