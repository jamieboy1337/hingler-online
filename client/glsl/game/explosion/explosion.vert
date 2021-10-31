#version 100

precision highp float;

attribute vec4 position;
attribute vec2 texcoord;
attribute mat4 model_matrix;

attribute float threshold;
attribute vec4 color;
attribute vec3 noise_offset;

uniform mat4 camera_matrix;

varying vec4 v_pos;
varying vec2 v_tex;

varying float v_threshold;
varying vec4 v_col;
varying vec3 v_noise_offset;

void main() {
  v_pos = model_matrix * position;
  v_tex = texcoord;
  v_threshold = threshold;
  v_col = color;
  v_noise_offset = noise_offset;
  gl_Position = camera_matrix * v_pos;
}