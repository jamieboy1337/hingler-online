#version 100

precision highp float;

attribute vec4 position;

uniform mat4 model_matrix;
uniform mat4 shadow_matrix;

varying vec2 screencoord;

void main() {
  vec4 test = shadow_matrix * model_matrix * position;
  screencoord = test.xy / test.w;
  gl_Position = test;
}