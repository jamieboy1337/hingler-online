#include <version>

precision highp float;
precision highp int;

#include <env>
#include <compatibility>
#include <radialblur>

VARYING vec2 vCoord;

// two passes
// draw the explosion
// todo: we can perform our glow pass elsewhere, instead of doing it here
uniform sampler2D uColor;
uniform sampler2D uDepth;
uniform sampler2D uExplosion;
uniform vec2 glowCenter;

uniform float dist;

OUTPUT_FRAGCOLOR

void main() {
  // blur gets more severe as explosion approaches? implement later
  vec4 col = radialBlur(uExplosion, glowCenter, vCoord, dist, 8);
  col = vec4(pow(col.xyz, vec3(1.6)) * 3.6 * col.a, col.a);
  vec4 temp = TEXTURE2D(uExplosion, vCoord);
  vec4 colInit = (temp + TEXTURE2D(uColor, vCoord) * (1.0 - temp.a));
  fragColor = col + colInit * (1.0 - col.a);
  // preserve depth value for future passes
  // gl_FragDepth = depth;
  // linear blur explosion
}