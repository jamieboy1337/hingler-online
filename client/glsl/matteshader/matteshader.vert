#version 100

attribute vec4 position;
attribute vec2 texcoord;
attribute vec3 normal;

uniform mat4 model_matrix;
uniform mat4 vp_matrix;
uniform mat3 normal_matrix;

varying vec4 position_output;
varying vec3 normal_output;

void main() {
  position_output = model_matrix * position;
  normal_output = normalize(normal_matrix * normal);
  gl_Position = vp_matrix * model_matrix * position;
}

