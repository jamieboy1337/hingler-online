#version 100

precision highp float;
precision highp int;

#include <../includes/spotlight/spotlight.inc.glsl>
uniform SpotLight spotlight[4];
uniform sampler2D texture_spotlight[4];

uniform int spotlightCount;

varying vec4 spot_coord[4];

varying vec4 position_v;
varying vec3 normal_v;

uniform vec4 surface_color;


void main() {
  vec4 col = vec4(0.0);
  for (int i = 0; i < 4; i++) {
    if (i >= spotlightCount) {
      break;
    }

    vec3 light_vector = spotlight[i].position - position_v.xyz;
    light_vector = normalize(light_vector);
    float n_b = max(dot(light_vector.xyz, normal_v), 0.0);
    vec4 light_col = getSpotLightColor(spotlight[i], position_v.xyz, spot_coord[i], texture_spotlight[i]);
    col += n_b * light_col;
  }

  gl_FragColor = vec4(col.xyz, 1.0);
}