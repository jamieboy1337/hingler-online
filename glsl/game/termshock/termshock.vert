#include <version>

#include <compatibility>
#include <env>

ATTRIB vec4 aPosition;

VARYING vec4 v_pos;

uniform mat4 model_matrix;
uniform mat4 vp_matrix;

void main() {
  v_pos = model_matrix * aPosition;
  gl_Position = vp_matrix * v_pos;
}