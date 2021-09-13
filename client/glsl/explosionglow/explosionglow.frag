#version 100

precision highp float;
precision highp int;

#include <../includes/radialblur.inc.glsl>

varying vec2 vCoord;

// two passes
// draw the explosion
// todo: we can perform our glow pass elsewhere, instead of doing it here
// separate into two passes (18 and 5 ? something which doesn't divide evenly i would imagine)

uniform sampler2D uColor;
uniform sampler2D uDepth;
uniform sampler2D uExplosion;

void main() {
  // perform a linear blur on the explosion from some point
  // add it to the color
  // preserve depth (for now -- use explosion depth if needed)

  vec4 col = radialBlur(uExplosion, vec2(-2.0, 0.5), vCoord, 0.1, 64) / 1.0;
  col = vec4(col.xyz * 5.0, col.a);
  vec4 temp = texture2D(uExplosion, vCoord);
  vec4 colInit = (temp + texture2D(uColor, vCoord) * (1.0 - temp.a));
  gl_FragColor = col + colInit * (1.0 - col.a);
  // preserve depth value for future passes
  // gl_FragDepth = depth;
  // linear blur explosion
}