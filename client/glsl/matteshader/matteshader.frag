#version 100

precision mediump float;

#include <../includes/spotlight/spotlight.inc.glsl>

varying vec4 position_v;
varying vec3 normal_v;

varying vec4 spot_coord;

uniform vec4 surface_color;

uniform SpotLight spotlight;

void main() {
  vec3 light_vector = spotlight.position - position_v.xyz;
  light_vector = normalize(light_vector);
  float n_b = max(dot(light_vector.xyz, normal_v), 0.0);

  vec4 col = surface_color * (n_b * getSpotLightColor(spotlight, position_v.xyz, spot_coord));
  gl_FragColor = vec4(col.xyz, 1.0);
}