#version 100

precision mediump float;

varying vec2 vCoord;

uniform sampler2D tex;

void main() {
  gl_FragColor = texture2D(tex, vCoord);
}