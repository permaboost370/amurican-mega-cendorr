shader_type canvas_item;
render_mode unshaded;

// Screen-space tilt-shift for the miniature diorama look.
// Keeps a horizontal band around focus_center perfectly crisp and blurs
// progressively toward the top and bottom edges of the viewport.
// Attach to a full-screen ColorRect inside a CanvasLayer.

uniform sampler2D screen_texture : hint_screen_texture, filter_linear_mipmap;

// Vertical center of the in-focus band (0 = top of screen, 1 = bottom).
uniform float focus_center : hint_range(0.0, 1.0) = 0.5;
// Half-height of the fully crisp band around focus_center.
uniform float focus_half_band : hint_range(0.0, 0.5) = 0.12;
// Distance over which blur ramps from zero to full strength.
uniform float blur_falloff : hint_range(0.01, 0.5) = 0.25;
// Maximum blur radius in screen pixels, reached at the top/bottom edges.
uniform float max_blur_px : hint_range(0.0, 16.0) = 5.0;

// Poisson disk offsets: a 12-tap approximation of a gaussian disk that
// stays cheap enough for WebGL2 in a single pass.
const vec2 POISSON_TAPS[12] = vec2[12](
	vec2(-0.326212, -0.405810), vec2(-0.840144, -0.073580),
	vec2(-0.695914, 0.457137), vec2(-0.203345, 0.620716),
	vec2(0.962340, -0.194983), vec2(0.473434, -0.480026),
	vec2(0.519456, 0.767022), vec2(0.185461, -0.893124),
	vec2(0.507431, 0.064425), vec2(0.896420, 0.412458),
	vec2(-0.321940, -0.932615), vec2(-0.791559, -0.597710)
);

void fragment() {
	float dist_from_focus = abs(SCREEN_UV.y - focus_center);
	float blur_amount = smoothstep(focus_half_band, focus_half_band + blur_falloff, dist_from_focus);
	vec2 radius_uv = SCREEN_PIXEL_SIZE * max_blur_px * blur_amount;

	vec3 color_sum = texture(screen_texture, SCREEN_UV).rgb;
	for (int i = 0; i < 12; i++) {
		color_sum += texture(screen_texture, SCREEN_UV + POISSON_TAPS[i] * radius_uv).rgb;
	}
	COLOR = vec4(color_sum / 13.0, 1.0);
}
