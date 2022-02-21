#include <version>

precision highp float;

#include <compatibility>

VARYING vec4 v_pos;
VARYING vec2 v_tex;

VARYING float v_threshold;
VARYING vec4 v_col;
VARYING vec3 v_noise_offset;

uniform sampler2D noise_texture;

OUTPUT_FRAGCOLOR

void main() {
  // sample noise at (pos * scale + offset)
  float noise = TEXTURE2D(noise_texture, vec2(v_tex.x + (v_noise_offset.y / 8.0), v_tex.y)).r;
  if (noise < v_threshold) {
    discard;
  }

  fragColor = vec4(v_col.rgb, 1.0);
}