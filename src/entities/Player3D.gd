class_name Player3D
extends CharacterBody3D
## Grid-based 3D movement controller for the HD-2D prototype.
##
## The player moves in discrete steps of GRID_SIZE units on the XZ plane,
## tweening between grid intersections rather than using velocity physics.
## Expected node hierarchy:
##   CharacterBody3D (this script)
##   ├── CollisionShape3D (BoxShape3D)
##   ├── Sprite3D (with BillboardSprite.gd attached)
##   └── Camera3D (gimbal-mounted or remote tracked)

## Side length of one grid cell in world units.
const GRID_SIZE: float = 2.0
## Time in seconds to tween from one grid intersection to the next.
const STEP_DURATION: float = 0.25

## True while a step tween is in flight; blocks new steps until it finishes.
var _is_moving: bool = false
## Direction pressed mid-step, consumed as soon as the current step ends.
## Gives held keys and rapid taps seamless continuous stepping.
var _buffered_direction: Vector3 = Vector3.ZERO

@onready var _sprite: Sprite3D = $Sprite3D


func _ready() -> void:
	# Guarantee the player starts exactly on a grid intersection so every
	# subsequent step lands on clean multiples of GRID_SIZE.
	global_position = _snap_to_grid(global_position)


func _physics_process(_delta: float) -> void:
	var input_direction: Vector3 = _read_input_direction()

	if _is_moving:
		# Buffer the most recent direction pressed during a step so releasing
		# and re-pressing (or holding) a key never drops an intended step.
		if input_direction != Vector3.ZERO:
			_buffered_direction = input_direction
		return

	# Idle: prefer live input, fall back to whatever was buffered mid-step.
	var step_direction: Vector3 = input_direction
	if step_direction == Vector3.ZERO:
		step_direction = _buffered_direction
	_buffered_direction = Vector3.ZERO

	if step_direction != Vector3.ZERO:
		_try_step(step_direction)


## Converts the 2D input vector into a single cardinal 3D direction.
## Diagonals resolve to the dominant axis (X wins exact ties) so movement
## is always strictly 4-directional on the grid.
func _read_input_direction() -> Vector3:
	var input_2d: Vector2 = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	if input_2d == Vector2.ZERO:
		return Vector3.ZERO
	if absf(input_2d.x) >= absf(input_2d.y):
		return Vector3(signf(input_2d.x), 0.0, 0.0)
	return Vector3(0.0, 0.0, signf(input_2d.y))


## Sweeps the body's collision shape toward the target cell and starts the
## step tween only if the path is clear of static collisions.
func _try_step(direction: Vector3) -> void:
	_update_facing(direction)

	var motion: Vector3 = direction * GRID_SIZE
	if test_move(global_transform, motion):
		return

	_is_moving = true
	var target: Vector3 = _snap_to_grid(global_position + motion)
	var tween: Tween = create_tween()
	tween.tween_property(self, "global_position", target, STEP_DURATION) \
		.set_trans(Tween.TRANS_LINEAR)
	tween.finished.connect(_on_step_finished)


func _on_step_finished() -> void:
	# Re-snap to kill any floating-point drift accumulated by the tween.
	global_position = _snap_to_grid(global_position)
	_is_moving = false


## Mirrors the sprite horizontally for left/right steps. Vertical steps keep
## the last horizontal facing, matching classic 2D RPG standee behavior.
func _update_facing(direction: Vector3) -> void:
	if direction.x > 0.0:
		_sprite.flip_h = false
	elif direction.x < 0.0:
		_sprite.flip_h = true


func _snap_to_grid(pos: Vector3) -> Vector3:
	return Vector3(
		roundf(pos.x / GRID_SIZE) * GRID_SIZE,
		pos.y,
		roundf(pos.z / GRID_SIZE) * GRID_SIZE
	)
