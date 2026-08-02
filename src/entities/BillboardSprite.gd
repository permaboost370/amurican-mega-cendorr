class_name BillboardSprite
extends Sprite3D
## Strict cylindrical (Y-axis only) billboard for 2D standee sprites.
##
## Godot's built-in billboard mode tilts the sprite fully toward the camera,
## which makes paper standees lean backward under a pitched-down HD-2D
## camera. This script instead rotates the sprite only around its Y axis,
## so it always stays perfectly perpendicular to the ground plane.


func _ready() -> void:
	# Built-in billboarding must stay off — this script owns orientation.
	billboard = BaseMaterial3D.BILLBOARD_DISABLED
	# Crisp pixel edges for Retrodiffusion/Pixellab sprites.
	texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	# Hard-discard alpha avoids transparency sorting artifacts between
	# overlapping standees in the 3D scene.
	alpha_cut = SpriteBase3D.ALPHA_CUT_DISCARD


func _process(_delta: float) -> void:
	var camera: Camera3D = get_viewport().get_camera_3d()
	if camera == null:
		return

	# Project the camera onto the sprite's horizontal plane: with the Y
	# difference zeroed out, look_at can only produce yaw, never pitch.
	var target: Vector3 = camera.global_position
	target.y = global_position.y

	# look_at is undefined when the target coincides with our own position
	# (e.g. camera directly overhead) — keep the previous orientation.
	if target.is_equal_approx(global_position):
		return

	# use_model_front = true points the sprite's visible +Z face at the
	# camera so the texture is not horizontally mirrored.
	look_at(target, Vector3.UP, true)
