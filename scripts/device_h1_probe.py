"""Non-motion XRP H1 probe; safe to run from the host with mpremote.

This script never issues nonzero motor effort. It reports independent component
outcomes so an absent optional sensor does not hide successful checks. On the
RP2350 controller, USB can energize the motor-driver VIN rail when the board
power switch is on; a disconnected battery is therefore not an unpowered-motor
guarantee.
"""

import json


results = {}


def check(name, operation):
    try:
        value = operation()
        results[name] = {"state": "pass", "value": value}
    except Exception as exc:
        results[name] = {
            "state": "fail",
            "error_type": type(exc).__name__,
            "detail": str(exc),
        }


def board_check():
    from XRPLib.board import Board

    board = Board.get_default_board()
    voltage = board.get_battery_voltage()
    powered = board.are_motors_powered()
    button = board.is_button_pressed()
    board.led_on()
    board.led_off()
    return {
        "xrplib_vin_reported_v": voltage,
        "vin_nominal_corrected_v": voltage * (13.3 / 14.0),
        "motor_supply_detected": powered,
        "power_source": "unknown",
        "power_interpretation": (
            "Diagnostic only: XRPLib compares measured VIN with 4.272 V; "
            "it does not distinguish USB from battery power. The corrected "
            "value uses the RP2350 board's nominal 100k/33k divider."
        ),
        "button_pressed": button,
        "led_on_off_commanded": True,
    }


def imu_check():
    from XRPLib.imu import IMU

    imu = IMU.get_default_imu()
    return {
        "connected": imu.is_connected(),
        "acceleration_mg": imu.get_acc_rates(),
        "angular_rate_mdps": imu.get_gyro_rates(),
        "temperature_c": imu.temperature(),
    }


def range_check():
    from XRPLib.rangefinder import Rangefinder

    rangefinder = Rangefinder.get_default_rangefinder()
    return {"distance_cm": rangefinder.distance()}


def encoder_and_zero_check():
    from XRPLib.encoded_motor import EncodedMotor

    left = EncodedMotor.get_default_encoded_motor(index=1)
    right = EncodedMotor.get_default_encoded_motor(index=2)
    try:
        left.set_effort(0.0)
        right.set_effort(0.0)
        return {
            "zero_effort_commanded": True,
            "left_count": left.get_position_counts(),
            "right_count": right.get_position_counts(),
            "left_revolutions": left.get_position(),
            "right_revolutions": right.get_position(),
        }
    finally:
        left.set_effort(0.0)
        right.set_effort(0.0)


# Establish a zero command before slower peripheral operations. The same helper
# repeats the zero command in its own finally block.
check("encoders_and_zero_effort", encoder_and_zero_check)
check("xrplib_import", lambda: __import__("XRPLib").__name__)
check("board", board_check)
check("imu", imu_check)
check("rangefinder", range_check)
check("final_zero_effort", encoder_and_zero_check)

print("UCSB_XRP_H1=" + json.dumps(results))
