#version 100

precision highp float;
precision highp int;

#define STRUCT_ONLY
#include <../includes/spotlight/spotlight.inc.glsl>

// TODO: bitangents are already calculated as 
// part of tangent computation, so just toss them in
attribute vec4 position;
attribute vec3 normal;
attribute vec2 texcoord;
attribute vec3 tangent;

varying vec4 v_pos;
varying vec2 v_tex;
varying vec3 v_norm;
varying mat3 TBN;

uniform mat4 model_matrix;
uniform mat4 vp_matrix;
uniform mat3 normal_matrix;

uniform SpotLight spotlight[4];
uniform int spotlightCount;

varying vec4 spot_coord[4];

void main() {
  v_pos = model_matrix * position;
  v_tex = texcoord;

  // calculate tbn matrix
  vec3 T = normalize(normal_matrix * tangent);
  vec3 B = normalize(normal_matrix * cross(normal, tangent));
  vec3 N = normalize(normal_matrix * normal);

  v_norm = N;

  TBN = mat3(T, B, N);

  for (int i = 0; i < 4; i++) {
    if (i >= spotlightCount) {
      break;
    }

    spot_coord[i] = spotlight[i].lightTransform * v_pos;
  }

  gl_Position = vp_matrix * v_pos;
}