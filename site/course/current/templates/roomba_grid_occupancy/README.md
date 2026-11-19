# Exercise · Reactive Driving and Mapping

The XRP drives into an arena whose outer walls it knows. The positions of the posts and boxes inside are initially unknown. Its forward sensor emits a pulse of sound and uses the time until an echo returns to obtain an **ultrasound range estimate**, the distance in millimeters from the sensor to a reflecting surface. As the robot turns to pass a post, its next range estimate may reach all the way to the far wall. The post can still be close to one side of the chassis. How could the robot take it into account on its next move?

**Your in-class task is to implement the entire `update_occupancy` function in [occupancy_update.py](occupancy_update.py).** The supplied program drives the robot and locates each range estimate on the floor. Your function updates the map the robot consults before it moves again.

The robot divides the floor into a grid of fixed squares so that successive observations of the same place can be combined, even when they were made from different positions and headings. **Occupancy** is the classification the map assigns to each square, or *cell*. A cell begins *unknown*. An estimate that places a reflecting surface in the cell gives evidence that it is *occupied*. A line from the sensor that passes through the cell on its way to a more distant surface gives evidence that it is *free*. Both classifications can change as the robot collects more evidence.

## What the range estimate locates

In Waypoint Courier you estimated the position of the axle midpoint and the robot’s heading from wheel travel. Here that position and heading, together called the *pose*, let you locate a surface in the arena. Figure 1 follows one range estimate obtained as the XRP turned near a box. The sensor sits 70 mm in front of the axle and faces along the robot’s forward axis. At the instant shown it obtained a range estimate of 198 mm. In this top view the possible reflecting points lie on an arc within 7.5° on either side of the sensor axis. The range estimate alone cannot distinguish their directions. The program uses the point directly ahead as its estimate of the surface position.

![The XRP, its forward sensor and the arc of possible reflecting points for one 198 mm range estimate.](figures/echo-geometry.svg)

*Figure 1. Follow the centerline from the axle to the sensor and then from the sensor to the arc. Only the second distance is the range estimate. At 198 mm the possible positions span about 52 mm across the cone, roughly one grid cell. Selecting the midpoint of the arc can place the surface in a neighboring cell.*

Write \(S\) for the sensor position and \(E\) for the estimated surface position, both in millimeters in the arena. If the axle is at \((x,y)\) and the heading is \(\theta\), then \(\mathbf{u}=(\cos\theta,\sin\theta)\) points along the centerline. Heading is measured in radians, counterclockwise from the arena’s positive \(x\) axis. For a range estimate \(r\), the supplied geometry computes

\[
S=(x,y)+70\,\mathbf{u}, \qquad E=S+r\,\mathbf{u}.
\]

The calculation uses the pose when the estimate was obtained. In Figure 1 the chassis points about 55° clockwise from the positive \(x\) axis, so the line from sensor to surface runs east and south.

## From the projected line to map cells

Trace the centerline in Figure 2 from the sensor toward the estimated surface. Each numbered square is one cell the beam crosses on the way. The dot at the end lies in a separate cell where the surface may be.

![The same beam traced from the sensor across five numbered cells to a separate endpoint cell.](figures/beam-crossings.svg)

*Figure 2. Follow cells 1 through 5 in order. Even the short passage through the corner of cell 2 counts as a crossing. The dot beyond cell 5 marks the estimated endpoint.*

The supplied `beam_cells` method traces this line for you. When `update_occupancy(grid, crossed_cells, hit_cell)` is called, `grid` holds the evidence from previous observations. Each cell address is a `(column, row)` pair that you can pass directly to the grid methods. For the beam in Figure 2, the arguments are

```python
crossed_cells = [(8, 7), (8, 6), (9, 6),
                 (9, 5), (10, 5)]
hit_cell = (10, 4)
```

All five entries in `crossed_cells` give evidence of free space, including the last one. The estimated surface is in `hit_cell`. Figure 3 shows how that distinction changes the map.

![Changes to the stored map along the same projected line, with four previously free cells, one newly free cell and one newly occupied endpoint.](figures/beam-update.svg)

*Figure 3. The first four crossed cells were already free. The fifth changes from unknown to free (light blue), and the endpoint changes from unknown to occupied (orange). The cell beyond the endpoint stays unknown (white).*

A line can cross cells without identifying a surface inside the arena. For example, the known wall may account for the range estimate. In that case `hit_cell` is `None` and the crossed cells still provide evidence of free space.

## Implementing the map update

Open [occupancy_update.py](occupancy_update.py) and replace `pass` with the body of `update_occupancy`. Update the existing `grid` in place and return `None`. The update has two parts.

1. **Process `crossed_cells`.** For each `cell`, read its classification with `grid.state(cell)`. An `UNKNOWN` cell becomes `FREE` on its first crossing. Use `grid.set_state(cell, FREE)` to make that change. A `FREE` cell needs no update. For an `OCCUPIED` cell, one crossing could simply pass through an empty corner beside a post. Call `grid.count_clear_pass(cell)` once for that crossing. When the returned count reaches `CLEAR_PASSES` (three by default), change the cell to `FREE`.
2. **Process `hit_cell`.** If the range estimate supplies an endpoint, call `grid.record_hit(hit_cell)`. This marks the cell `OCCUPIED` and restarts its crossing count. Handle the endpoint even if `crossed_cells` is empty. If `hit_cell` is `None`, the update is complete after the crossings.

## Where your function runs

[main.py](main.py) asks the robot for a range estimate on each 40 ms control step and obtains its pose from wheel travel. The ranging service needs at least 70 ms between acquisitions. With these defaults Virtual XRP makes a new attempt every other step, giving a new range estimate every **80 ms (12.5 Hz)** when a surface returns an echo. Between acquisitions it holds the previous result. A held result must never count as another crossing.

![The two paths from a robot step to the next motion, through the map update and directly from the latest pose and range estimate.](figures/mapping-loop.svg)

*Figure 4. A control step can produce a driving command even when there is no new map evidence. When there is new evidence, your function updates the stored map before the robot chooses its next motion.*

In [measured_map.py](measured_map.py), `grid.observe` uses the acquisition number to skip a held result. For a fresh estimate it obtains `crossed_cells` and `hit_cell` from `beam_cells`, checks whether a known wall explains the endpoint, and calls `update_occupancy` if either input contains evidence. Monitor’s **World** view shows the resulting map.

The robot normally drives forward. It steers through short arcs to look to either side and backs away and turns when forward travel is blocked. These turns let the fixed sensor observe places off the original line of travel. Before advancing, the controller checks both the latest range estimate and the space the whole chassis would sweep, using the occupied cells and the known walls.

## Seeing the result in Virtual XRP

Select **Virtual XRP** and **Side by side**. In Monitor’s **World**, use **Course arena** with **Posts and boxes**, leave **Show obstacles** unchecked and keep the default driving settings. With the unfinished starter the robot can already drive and turn, while both cell counts stay at zero.

1. **Follow one cell.** Suppose a line first crosses an unknown cell, an estimate then ends in it, and the next two lines cross it. Now suppose a second estimate ends there, followed by three crossings. Predict when the cell will become free again. Select **Compile**, open **Program output** and select **Run**. The two **One-cell example** lines apply this exact sequence to a separate cell using your function. Read the lines together. After the second hit the final three crossings should give *occupied, occupied, free*.
2. **Follow the drive.** Let the robot approach the post, turn away and begin its next approach. Select **Stop** when **blocked by a mapped surface** appears in **Program output**. Drag **World time** to the left and use **Right Arrow** to find the first update. On this first approach, before the turn illustrated in Figures 1–3, nine light-blue free cells lead to one orange occupied cell. You can now move forward through the recording to see how the map affected the next approach (Figure 5).

![Two World views of a square first marked occupied during a turn and later intersecting the chassis footprint on the next advance.](figures/turning-map.svg)

*Figure 5. The corner marks identify the same square in both views. During the turn a 226 mm range estimate placed a surface there. On the next approach the range estimate was 615 mm, but the square still intersected the dashed outline of the chassis’s next 60 mm of travel.*

In the run in Figure 5, one line crossed the marked square after it had been hit. Was that enough evidence to clear it? Compare the range estimate at the **blocked by a mapped surface** message in your run with the 200 mm immediate reaction distance. Find the occupied cell beside the chassis in the second view. Could the robot have decided to retreat there using its current range estimate alone?
