#include <version>

precision highp float;
precision highp int;

#include <compatibility>

#include <radialblur>


VARYING vec2 vTexcoord;

uniform sampler2D uBlurColor;
uniform vec2 glowCenter;
uniform int samples;
uniform float blurSize;

OUTPUT_FRAGCOLOR

void main() {
  fragColor = radialBlur(uBlurColor, glowCenter, vTexcoord, blurSize, samples);
}