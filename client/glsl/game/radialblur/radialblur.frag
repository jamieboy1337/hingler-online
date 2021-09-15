#version 100

precision highp float;
precision highp int;

#include <../../includes/radialblur.inc.glsl>

varying vec2 vTexcoord;

uniform sampler2D uBlurColor;
uniform vec2 glowCenter;
uniform int samples;
uniform float blurSize;

void main() {
  gl_FragColor = radialBlur(uBlurColor, glowCenter, vTexcoord, blurSize, samples);
}