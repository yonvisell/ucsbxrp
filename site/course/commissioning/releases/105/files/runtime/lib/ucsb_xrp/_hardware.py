"""Course ownership of XRPLib devices; no background motor or IMU reads.

The course provides its own wheel controller and samples devices in one owner
at a time. XRPLib's optional timer-driven speed controller and integrated IMU
angles are therefore unused here. Ordinary XRPLib programs remain unchanged
unless they acquire devices through this private course adapter.
"""

_course_imu = None
_imu_attempted = False
_imu_error = None
_course_rangefinder = None


def get_course_rangefinder():
    """Share ultrasound timing across idle reads and all course robot objects."""
    global _course_rangefinder
    if _course_rangefinder is None:
        from XRPLib.rangefinder import Rangefinder
        from ._range import RangeAcquisition

        _course_rangefinder = RangeAcquisition(Rangefinder.get_default_rangefinder())
    return _course_rangefinder


def _ignore_timer(*_args):
    pass


def get_course_motor(index):
    from XRPLib.encoded_motor import EncodedMotor

    motor = EncodedMotor.get_default_encoded_motor(index=index)
    timer = getattr(motor, "updateTimer", None)
    if timer is not None:
        # The timer lambda looks up _update when it executes. Retire that hook
        # too, so a callback queued before deinit cannot read the encoder later.
        motor.target_speed = None
        motor._update = _ignore_timer
        timer.deinit()
    return motor


def _retire_imu_timer(imu):
    timer = getattr(imu, "update_timer", None)
    if timer is not None:
        imu._update_imu_readings = _ignore_timer
        # XRPLib reset/calibrate/gyro_rate otherwise restart the same timer.
        imu._start_timer = _ignore_timer
        timer.deinit()


def get_course_imu(retry=False):
    """Return the optional IMU; retry failed initialization only on Reset."""
    global _course_imu, _imu_attempted, _imu_error
    if _imu_attempted and (_course_imu is not None or not retry):
        return _course_imu
    previous_error = _imu_error
    _imu_attempted = True
    imu_class = None
    try:
        from XRPLib.imu import IMU

        imu_class = IMU
        if previous_error is not None and hasattr(IMU, "_DEFAULT_IMU_INSTANCE"):
            # XRPLib publishes its singleton before calibration completes.
            # An explicit retry must initialize and calibrate a fresh device.
            IMU._DEFAULT_IMU_INSTANCE = None
        imu = IMU.get_default_imu()
        _retire_imu_timer(imu)
    except Exception as error:
        _imu_error = error
        # Failed calibration can leave a partially initialized singleton.
        # Retire any remaining timer without obscuring the original failure.
        try:
            _retire_imu_timer(getattr(imu_class, "_DEFAULT_IMU_INSTANCE", None))
        except Exception:
            pass
        _course_imu = None
        return None
    _imu_error = None
    _course_imu = imu
    return imu


def course_imu_error():
    return _imu_error


def read_imu_diagnostics(imu):
    """Acquire fresh vectors on the caller's core, never in a timer callback."""
    combined = getattr(imu, "get_acc_gyro_rates", None)
    if callable(combined):
        acceleration, angular_rate = combined()
    else:
        # The virtual driver exposes the same measurements as separate reads.
        acceleration = imu.get_acc_rates()
        angular_rate = imu.get_gyro_rates()
    return list(acceleration), list(angular_rate), float(imu.temperature())
