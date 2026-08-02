"""Construct course records and display the units used by their fields."""

from ucsb_xrp import DriveCommand, MotionCommand, Pose, WheelSpeeds


pose = Pose(250.0, -75.0, 0.5)
wheel_speeds = WheelSpeeds(120.0, 115.0)
command = MotionCommand(100.0, -0.25)
drive = DriveCommand(0.30, 0.28)

print("pose_mm_rad:", pose.x_mm, pose.y_mm, pose.heading_rad)
print("wheel_speeds_mm_s:", wheel_speeds.left_mm_s, wheel_speeds.right_mm_s)
print("motion_command_mm_s_rad_s:", command.forward_speed_mm_s, command.turn_rate_rad_s)
print("drive_command_normalized:", drive.left, drive.right)
