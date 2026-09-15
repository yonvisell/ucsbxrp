# UCSB waypoint-logo demo

The XRP traces block letters **UCSB** across the standard course arena. The
ordered `waypoint` markers in `world.json` are loaded as `NavigationGoal`
values and passed to the supplied `NavigationController`; the program does not
encode a separate private path. The initial pose is the top-left of the U,
facing downward along its first stroke. Only the four letter-start waypoints
are labeled, keeping the Monitor world legible while retaining every corner as
an inspectable waypoint.

The route remains inside x = -1200...1120 mm and y = -300...300 mm, within the
3048 x 1219.2 mm course arena. The supplied controller requests 150 mm/s on
long strokes and 1.3 rad/s for heading corrections. `Robot.step()` supplies the
only timing. Completing all 28 waypoints is the intended natural finish; 8000
samples and 13000 mm of measured wheel travel are protective failure guards.
`finally: robot.stop()` requests zero motor commands after normal completion
or a Python exception. The target runtime handles the IDE's **Stop** separately;
forced termination can bypass Python cleanup.

The same project runs on Virtual XRP or Physical XRP. For a physical run, mark
the world initial pose accurately in a clear course-sized area and supervise
the complete route. The supplied navigation controller corrects pose error but
does not avoid unmodeled obstacles; odometry calibration and wheel slip set the
physical lettering accuracy.
