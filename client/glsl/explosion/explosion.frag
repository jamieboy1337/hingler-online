#version 100

precision highp float;

#include <../includes/opensimplex.inc.glsl>

varying vec4 v_pos;
varying vec2 v_tex;

varying float v_threshold;
varying vec4 v_col;
varying vec3 v_noise_scale;
varying vec3 v_noise_offset;

uniform sampler2D noise_texture;

void main() {
  // sample noise at (pos * scale + offset)
  float noise = texture2D(noise_texture, vec2(v_tex.x + (v_noise_offset.y / 8.0), v_tex.y)).r;
  if (noise < v_threshold) {
    discard;
  }

  gl_FragColor = vec4(v_col.rgb, 1.0);
}