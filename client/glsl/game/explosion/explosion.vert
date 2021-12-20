#include <version>

precision highp float;

#include <compatibility>

ATTRIB vec4 position;
ATTRIB vec2 texcoord;
ATTRIB mat4 model_matrix;

ATTRIB float threshold;
ATTRIB vec4 color;
ATTRIB vec3 noise_offset;

uniform mat4 camera_matrix;

VARYING vec4 v_pos;
VARYING vec2 v_tex;

VARYING float v_threshold;
VARYING vec4 v_col;
VARYING vec3 v_noise_offset;

void main() {
  v_pos = model_matrix * position;
  v_tex = texcoord;
  v_threshold = threshold;
  v_col = color;
  v_noise_offset = noise_offset;
  gl_Position = camera_matrix * v_pos;
}