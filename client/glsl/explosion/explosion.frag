#version 100

precision highp float;

#include <../includes/opensimplex.inc.glsl>

varying vec4 v_pos;

varying float v_threshold;
varying vec4 v_col;
varying vec3 v_noise_scale;
varying vec3 v_noise_offset;

void main() {
  // sample noise at (pos * scale + offset)
  vec3 noise_pos = v_pos.xyz * v_noise_scale + v_noise_offset;
  float noise = (openSimplex2Base(noise_pos).w + 1.0) / 2.0;
  if (noise < v_threshold) {
    discard;
  }

  gl_FragColor = vec4(v_col.rgb, 1.0);
}