# Challenge 2.1: Reflectance

Measure the left and right floor sensors on white floor and black tape. **No
programming is required.** The supplied program keeps motor effort at zero and
records continuously until you select **Stop**. Black produces larger readings;
white produces smaller readings.

1. Select your target, then **Compile** and **Run**. Open Monitor; only the left
   and right reflectance plots are selected.
2. Keeping the wheels in contact with the arena floor, move the robot by hand
   so both sensors pass across white floor and black tape. Pause on each surface
   for a few seconds. Repeat to capture the variation in each sensor.
3. Select **Stop**. For each sensor separately, identify the highest reading
   during the white intervals, **W**, and the lowest reading during the black
   intervals, **B**.
4. When **B > W**, choose **T = W + 0.1(B − W)**: white plus 10% of the
   measured white-to-black gap. If the ranges overlap, repeat the measurements.
5. Set Monitor's **Time window** to show the white and black intervals, then
   select **Export plots as PNG** or **Export plots as SVG**.

For Virtual XRP, record separate runs with **World → White floor** and
**World → Black patch**.

**Deliverables**

- Exported left and right reflectance plots.
- Written white and black values, W and B, for each sensor.
