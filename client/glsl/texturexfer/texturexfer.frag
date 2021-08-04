#version 100

precision mediump float;

varying vec2 vCoord;

uniform sampler2D tex;

void main() {
  vec3 res = texture2D(tex, vCoord).rgb;
  res = pow(res, vec3(1.0 / 2.2));
  gl_FragColor = vec4(res, 1.0);
}