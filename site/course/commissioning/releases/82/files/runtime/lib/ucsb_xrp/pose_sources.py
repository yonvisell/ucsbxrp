"""Configure camera-based GPS and driving drift for Virtual XRP."""

import json
from .localization import PoseFix, set_pose_provider
from .records import Pose


def configure_pose_source(rate_hz=2.0, latency_ms=0, dropout_start_ms=-1,
                          dropout_duration_ms=0, position_drift_mm=3.0,
                          heading_drift_rad=0.005, driving_drift_percent=1.0):
    """Configure simulated GPS and driving drift; the Pi sets the physical GPS rate.

    Dropout times are relative to the first observation requested in this run.
    No browser or simulator API is required on the physical robot.
    """
    try:
        import xrp_sim_bridge
    except ImportError:
        return
    read = getattr(xrp_sim_bridge, "camera_observation", None)
    if read is None:
        return

    configure = getattr(xrp_sim_bridge, "configure_gps", None)
    if configure is not None:
        configure(position_drift_mm, heading_drift_rad, driving_drift_percent)

    def observe(now_ms):
        value = read(now_ms, rate_hz, latency_ms, dropout_start_ms, dropout_duration_ms)
        if value is None:
            return None
        item = json.loads(str(value))
        return PoseFix(Pose(item[0], item[1], item[2]), item[3], item[4], item[5], item[6], 0.0)

    set_pose_provider(observe)
