# New Demo · Reflectance Calibration

The 10 s capture commands zero motion throughout. It requests both reflectance
sensors, plots raw readings and calibrated contrast, and reports missing sensors.
The default virtual world starts on the finish bar; a constant high reading is
expected there. Move the virtual initial pose in world.json between separate
runs to compare floor and tape. Do not expect a stationary virtual robot to scan.

For an approved physical no-motion lab, place the sensor footprint over floor
and tape in separate stopped captures. Record each side's stable light and dark
values in calibration.py. Contrast is (raw - light) / (dark - light), clipped
to [0, 1]; insufficient contrast raises a useful error instead of dividing by
nearly zero. Virtual defaults 0 and 1 are not physical calibration measurements.

Compare raw sensor asymmetry, repeatability and contrast before PID tuning.
Transfer chosen thresholds to the line-circuit settings; retain original raw
evidence. No student component is required for this supplied measurement demo.
Compile and Run; inspect plots and the final sample count in Program output.
