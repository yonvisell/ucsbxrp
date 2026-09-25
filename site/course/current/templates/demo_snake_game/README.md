# SnakeGame

Select **Compile**, then **Run**. The robot drives between food pellets in the
arena. Each pellet it reaches disappears, adds one point, and lengthens the
snake. Crossing its tail, reaching the arena edge, or detecting a nearby
obstacle ends the game and stops the robot. **Stop** ends the current run;
**Run** starts again with score zero and all food restored.

The green head marks the robot's position. The curved tail shows only the
recent part of its path, with length determined by the food collected. Watch
the score in World and adjust these sliders in Monitor while the game runs:

| Control | Starting value | Range | Effect |
| --- | --- | --- | --- |
| Cruise speed | 500 mm/s | 60–700 mm/s | Requested speed between targets. The motor command stays bounded at 1.0; the XRP may not attain the requested speed. |
| Tail growth per food | 67 mm | 20–300 mm | Length added when the next pellet is collected. |

Change game, control, navigation, calibration, and display settings in
`snake_config.json`. `live_variables.py` creates the two Monitor sliders from
that file. The default 13.5 pellets/m² gives 50 pellets in the virtual arena
and 201 in the larger physical field. `snake_food.py` generates repeatable,
irregular positions from the arena dimensions and the configured seed; the
positions do not need individual entries in `world.json`. Food is collected
only when its center lies inside the displayed head. The head is 55 mm across
and the tail is 50 mm across.

`main.py` uses the supplied navigation controller to drive between positions.
`snake_game.py` tracks food and the tail and detects a crossing.
`robot_config.py` applies the configured calibration and navigation settings.
It requests 80% of the selected cruise speed within 80 mm of each pellet
position. The head follows the robot's estimated position; a pellet is not
collected merely because the robot passed near it.

For a physical run, provide a clear 6096 × 2438 mm area and align the robot with
the displayed starting position and heading. The physical XRP selects this
larger field automatically. Food and the tail exist only in Monitor. Their
positions use wheel-encoder odometry, so slip or a misplaced start can make
the display disagree with the floor path. Begin at a low speed and keep
**Stop** available. The ultrasound sensor may miss obstacles and does not
detect another robot's displayed tail. The narrow displayed body is a game
graphic and does not establish clearance for the physical XRP. The 201-food
tail may use substantially more MicroPython memory than the virtual default;
it has not been qualified on hardware.
