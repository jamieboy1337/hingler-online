#version 100

precision highp float;

varying vec2 screencoord;

void main() {
  gl_FragColor = vec4(0.0, 0.0, gl_FragCoord.z * 32.0, 1.0);
}