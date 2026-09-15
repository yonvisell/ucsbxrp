# Saved telemetry and time

Each Run records telemetry independently of which signals are displayed, including when only the IDE is open. When a run finishes and its archive is saved successfully, the Project's `UCSB_XRP_Autosaves` folder contains matching `telemetry-1.csv`, `run-1.json`, and `run-1.txt` files. Generation 1 is the newest; generations 2–4 are earlier runs. Copy files that you need to keep before later runs rotate the archive. The Monitor's CSV download contains the same telemetry columns and attached notes.

Recording is bounded by observation count, not by a guaranteed duration. `recording_dropped_observations` in the CSV and `telemetry.knownDroppedObservations` in the JSON report known sequence gaps and retained-history eviction. A zero count does not prove that the browser observed every device event. Wait for the run's saved confirmation before closing its windows. A browser or computer crash before saving can still lose the active recording.

If the IDE reports **Run not saved**, keep the page open and use **Retry run save** after restoring folder access. Alternatively, **Download unsaved run data** preserves metadata, CSV and output in one recovery JSON file. Confirm **I saved the recovery file** only after verifying that download; merely starting or canceling it does not clear the warning. **Recovery file confirmed** means you kept that separate copy, not that the Project archive was repaired.

Monitor also retains failed saves under **Controls → Run data**, with **Retry run save** and **Download retained run** for each affected trial. A recovery download contains the complete run, including its CSV, output and notes, in JSON. Verify the downloaded file before deliberately discarding that retained copy. Changing Projects, clearing the display or Reset does not discard it. Wait for saving to finish or resolve the recovery message before the next Run. If other windows fill Monitor's four-run recovery limit, it labels a subsequent run as **not being recorded**; Stop and live telemetry remain available. Recover the retained runs, then start a new run to collect a complete recording.

To inspect a saved trial after reopening the browser, open its Project, then choose **Monitor → Controls → Run data → Open saved run…**. Choose one of the four retained trials and select **Open trial**. The saved world, plots and notes describe that trial; the separate **Live telemetry** panel still describes the current XRP. Opening a trial does not command the robot. **Return to current XRP** closes the saved view. You can edit notes or export the reopened trial, and the original numeric archive remains intact.

## Choose the correct clock

For sensor analysis, use `acquired_at_s` together with `clock_id` and `acquisition_seq`. These fields describe the sensor record delivered to the Python program. Time starts at the first encoder acquisition in that clock scope. It does not start when the browser's Run button is clicked. Physical clock IDs include device boot and service run identity; virtual clock IDs identify the Python worker execution.

`raw_device_time_ms` preserves the original MicroPython `ticks_ms()` value. This counter wraps and has an arbitrary origin. Do not subtract raw tick values in MATLAB. `acquired_at_s` is the corresponding elapsed time, unwrapped in the runtime with `ticks_diff()`. Unwrapping requires successive clock observations to remain less than half the tick period apart; an arbitrarily long suspended run cannot establish elapsed time from wrapping ticks alone. [MicroPython time reference](https://docs.micropython.org/en/v1.28.0/library/time.html)

The legacy `t_s` column remains available for old files and display reconstruction. In virtual mode it is simulation physics time. On a physical run it represents course publication intervals translated to the service's Run-preparation epoch; stationary physical polling uses service uptime. It is not a common acquisition clock. `course_published_at_s` is the older virtual publication clock. `published_at_s` uses the new acquisition clock and describes publication after a raw or course sample was acquired. Network delay and browser receipt do not replace any of these source times.

Several observations may have the same `t_s` and the same acquisition identity: physics, drive-command, course-state, and Stop events can occur separately. `observation_seq` preserves virtual event order; `physics_step_seq` identifies integration steps. Select unique `(clock_id, acquisition_seq)` pairs when analyzing sensor samples. Keep all observations when reconstructing commands, plots, or notes. A Python `Robot.stop()` publication has `sample_kind=stop`. A browser or runtime interruption has `observation_kind=stop` and retains the preceding acquisition/publication metadata; it does not invent another source timestamp.

## Fields and units

CSV schema 4 appends timing fields to the earlier telemetry columns. Read columns by name; program-defined `program_*` columns vary between programs. Old files and older compatible robot services leave new timing unavailable. Empty cells mean unavailable, not zero. CSV values retain the available numerical precision; quotes, commas, and line breaks in notes are escaped as ordinary CSV.

| Fields | Meaning |
| --- | --- |
| `csv_schema_version`, `timing_schema_version` | CSV layout version and acquisition metadata version; timing version is empty on legacy observations. |
| `clock_id`, `clock_basis` | Source clock scope and its `first-acquisition` origin. Never subtract times from different clock IDs. |
| `sample_kind` | `raw` for direct `XRPBot.read()`, `course` for `Robot` publication, or `stop`. |
| `acquired_at_s`, `acquisition_seq` | Elapsed seconds and identity of the raw read. The timestamp is taken immediately before the sequential encoder reads. |
| `acquired_left_encoder_count`, `acquired_right_encoder_count`, `acquired_range_mm` | Exact raw values delivered to Python, distinct from any later virtual physics state in the same observation. Counts are signed integers; range is millimetres. |
| `sample_dt_s`, `sample_period_s`, `overrun_s` | `Measurements.dt_s`, the configured `Robot` period, and measured pre-wait deadline overrun. Actual spacing can differ. Direct raw reads have no SensorModel interval or configured Robot period. Overrun is not total cycle execution time. |
| `range_acquired_at_s`, `range_seq`, `range_sampled` | Latest range-read identity and a completion-time upper bound: the encoder timestamp follows that sequential range read. `range_sampled=1` with empty acquired range means no usable result. A retained sequence is not a new range measurement. |
| `diagnostics_acquired_at_s`, `diagnostics_seq` | Completion time and identity of the sequential battery/IMU group. Diagnostics may run less often than encoders; retained values keep their earlier identity. Failed channels remain empty for that group. |
| `x_mm`, `y_mm`, `heading_rad` | Legacy displayed pose. Check `pose_available`. |
| `estimated_*`, `ground_truth_*` | Odometry estimate and virtual ground truth, kept distinct. Check each availability flag; physical ground truth is unavailable. Virtual truth belongs to the physics time in `t_s`, not necessarily to `acquired_at_s`. |
| `acceleration_*_m_s2`, `angular_rate_*_rad_s` | SI acceleration and angular rate. Temperature is Celsius and battery voltage is volts. |
| `note` | Notes attached to the exact retained observation, including observations sharing a timestamp. |

The paired JSON includes release/project/world information, browser run lifecycle dates, timing descriptions, configured periods, retention/loss counts, annotations, and `outputTimeline`. Output `timestampMs` is a browser wall-clock date in milliseconds, where available. `targetTimeMs` belongs to the separately named `targetClockId`; it is not automatically synchronized with the browser, acquisition clock, or a future camera clock. `run-1.txt` is the human-readable console transcript. Neither console receipt time nor the browser's `startedAt`/`finishedAt` dates are sensor acquisition times.

Keep a program signal's unit constant during a run. If it changes, the exporter adds a companion column ending in `__unit` (with a numeric suffix if needed) containing each row's actual unit; a blank unit beside a numeric value means unitless. The JSON's `programPlots` maps each signal to its exact `csvColumn` and optional `unitColumn`, avoiding collisions between similar names. Monitor identifies a unit change and plots only values matching the displayed unit. Other values remain in the recording and export, without conversion or relabelling. Older archives cannot recover unit changes that their exporter did not record.

## MATLAB: load and plot acquired encoder data

Use this example for a CSV with the new acquisition fields. It selects one clock, removes repeated observations of the same raw read, and plots recorded times directly. It does not assume 50 Hz, interpolate missing data, or turn empty numeric cells into zero. `readtable` handles quoted multiline notes. [MathWorks table import](https://www.mathworks.com/help/matlab/ref/readtable.html), [numeric import types](https://www.mathworks.com/help/matlab/ref/matlab.io.text.delimitedtextimportoptions.setvartype.html)

```matlab
project = uigetdir(pwd, 'Select the XRP Project folder');
if isequal(project, 0), return; end
folder = fullfile(project, 'UCSB_XRP_Autosaves');
csvFile = fullfile(folder, 'telemetry-1.csv');
opts = detectImportOptions(csvFile, 'VariableNamingRule', 'preserve');
required = {'clock_id', 'acquisition_seq', 'acquired_at_s', ...
    'acquired_left_encoder_count', 'acquired_right_encoder_count'};
assert(all(ismember(required, opts.VariableNames)), ...
    'This older file has no acquisition clock; inspect its t_s metadata.');
opts = setvartype(opts, 'clock_id', 'string');
opts = setvartype(opts, required(2:end), 'double');
T = readtable(csvFile, opts);
valid = ~ismissing(T.clock_id) & isfinite(T.acquisition_seq) & ...
    isfinite(T.acquired_at_s);
S = T(valid, :);
assert(~isempty(S), 'No acquisition-timed sensor records were retained.');
S = S(S.clock_id == S.clock_id(1), :);  % Analyze one clock at a time.
[~, first] = unique(S.acquisition_seq, 'stable');
S = S(first, :);
plot(S.acquired_at_s, S.acquired_left_encoder_count, '.', ...
     S.acquired_at_s, S.acquired_right_encoder_count, '.');
xlabel('Time from first encoder acquisition (s)');
ylabel('Encoder count');
legend('Left', 'Right'); grid on;
M = jsondecode(fileread(fullfile(folder, 'run-1.json')));
disp(M.telemetry.knownDroppedObservations);
```

Use `diff(S.acquired_at_s)` to inspect actual sampling intervals. Select valid `range_seq` or `diagnostics_seq` values separately for those streams and use their own timestamps. Do not align separate clocks by subtracting their numerical values. Older CSV files remain readable with `readtable`; their `t_s` values retain the legacy meaning above and cannot recover missing acquisition times.

## Future virtual GNSS timing contract

The arena-camera design is a future extension; this revision does not install or connect a camera system. Its existing fix identity is `(sourceId, bootId, seq)`, with tracker-monotonic `captureTimeMs`. Preserve these original fields and source epoch in any recorded GNSS stream, together with a distinct target receipt time and clock identity. Record a new fix once; repeated use of a held fix must retain its identity and age. An invalid, stale, or missing fix is not a zero-valued position.

The camera capture clock and XRP receipt clock are independent. Receipt age supports a local freshness limit but does not establish end-to-end capture age or clock synchronization. Explicit clock calibration would be required for that comparison. A future GNSS file or additive columns must keep fix validity, restart/loss information, capture and receipt clocks, and the acquired sample's selected fix identity. Odometry and virtual truth remain separate. Resampling to encoder times must be an explicit analysis choice, with a stated interpolation/hold rule and age limit. The local instructor planning document is `arena_cam/SHARED_DESIGN.md`.

## Validation boundary

The timing implementation is exercised with source-level fault injection, browser-target tests, and the pinned WebAssembly MicroPython runtime. Physical timestamp latency, clock behavior across actual hardware pauses, heap use, and USB/Wi-Fi deployment remain subject to the no-motion qualification matrix. The displayed example was also run in MATLAB R2026a against the application CSV exporter, with the folder picker replaced by the fixture path. The check preserved quoted multiline notes and missing cells, selected one clock, removed repeated acquisition identities, and reproduced the expected encoder plot. Physical measurements were not used for that fixture.
