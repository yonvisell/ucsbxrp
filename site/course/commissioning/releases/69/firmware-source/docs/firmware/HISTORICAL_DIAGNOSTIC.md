# Historical firmware diagnostic

This compact record replaces the September 30 experimental trees and raw reports
removed on October 21, 2026. It records the existing conclusions; no new hardware
qualification was performed. The accepted firmware, patch, recipe and qualification
summary remain in Git.

The rejected image `ucsbxrp-rp2350-1.29.0-gcsync-20260930.2`
(SHA-256 `575c329513b46d7469258ef23e41a480a46601dcd34405018d64bb12894e34f6`)
failed the `next_run` case after an allocating-loop Stop/reset. The report status
was `failed`; its first failure was an AssertionError reporting device stderr.
The investigation identified native garbage-collection rendezvous failures and
withdrew the timed SDK mutex-wait approach. Keep this rejection distinct from
qualification of the accepted `.1` image; see `recipe.json` and BUILD_PROVENANCE.md.

For the accepted `.1` image, the clean Mac commissioning check recorded two completed
runs of 302 samples and one stopped run of 1,053 samples. CSV sequences were
contiguous, no telemetry/output drops or nonzero motor effort were observed, and
recordings reopened after browser reload. These were stationary checks. They do
not establish Windows or floor-motion performance. The precise retained scope and
software identities are in NATIVE_QUALIFICATION.json.

The original raw reports are no longer retained. Their SHA-256 values identify
what was summarized, not a recoverable backup:

- `gcsync-qualification/runs/gcsync2-standard-01/report.json`: `a2598d1da507e52836a7491d5187ef6096a26b301690fffa6228b871ace484fc`
- `gcsync2-after-stop-native-stats.json`: `85e505db927b7a906caafd92eaf02e92cecf1f3809418318912c9df71c03d094`
- `final-native-run-recording.json`: `648cade56fcc600ca17c0ff693b71eced1f3ce3f3aec11dc3b240cae6a23ab2f`
- `final-native-commission-complete.json`: `720194b8f1957188d40e53218859a23a6b80bfa0142614531996ba3cc0be7dd4`
- `final-native-battery-wifi.json`: `c5707ba0746d558ba2c61f2a33d18354c78d3d92310e4a48dbd5520dd92a4057`
