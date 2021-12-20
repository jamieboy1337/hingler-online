#include <version>

precision highp float;
precision highp int;

#include <compatibility>
#include <env>

#include <opensimplex>
#include <gradient>

VARYING vec4 v_pos;

uniform vec2 resolution;
uniform sampler2D uDepth;

uniform vec4 gradientCols[4];
uniform float gradientStops[4];

uniform float explosionZ;

OUTPUT_FRAGCOLOR

void main() {
  float depth = gl_FragCoord.z;
  vec2 texcoord = (gl_FragCoord.xy / resolution);
  float fbDepth = TEXTURE2D(uDepth, texcoord).r;

  if (depth > fbDepth) {
    discard;
  }

  float grad = 0.0;
  vec3 samplePoint = vec3(explosionZ, v_pos.yz);
  samplePoint /= 96.0;
  for (int i = 0; i < 5; i++) {
    grad += openSimplex2_Classical(samplePoint).w;
    samplePoint *= 3.0;
  }

  grad /= 6.0;
  grad += 1.0;
  grad /= 2.0;

  vec4 col = getGradient(gradientCols, gradientStops, grad);
  fragColor = vec4(vec3(pow(col.xyz, vec3(1.0 / 2.2))), 1.0);
}