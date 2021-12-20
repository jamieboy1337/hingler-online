#include <version>

precision highp float;
precision highp int;

#include <compatibility>

// bad imports on this and vert code :3
#include <spotlight/object>

#define GRASS_DARK  vec3(0.115507, 0.124026, 0.024627)
#define GRASS_LIGHT vec3(0.289576, 0.311932, 0.056005)

VARYING vec4 vPosition;
VARYING vec3 vNormal;

// todo: bind texture dummies to these locations when not in use!
// temp workaround: create dummy spotlights with 0 intensity (longer exec time?)
uniform SpotLight spotlight[4];
uniform int spotlightCount;
uniform sampler2D texture_spotlight[4];

uniform SpotLight spotlight_noShadow[4];
uniform int spotlightCount_noShadow;

VARYING vec4 spot_coord[4];

uniform vec3 camPos;

OUTPUT_FRAGCOLOR

void main() {
  vec3 V = normalize(camPos - vPosition.xyz);
  vec3 N = normalize(vNormal);
  float D = dot(V, N);
  float Cs = step(0.5, D);
  vec3 C = mix(GRASS_DARK, GRASS_LIGHT, Cs);

  // phong shade

  fragColor = vec4(C, 1.0);
}