#version 100

// add some highlight, give it some glow

precision highp float;

varying vec4 vPosition;
varying vec3 vNormal;
varying vec4 vColor;

uniform vec3 camPos;

void main() {
  // use fresnel to determine lighting
  // brighten color (boost value and clip rgb)
  vec3 N = normalize(vNormal);
  vec3 V = normalize(camPos - vPosition.xyz);
  float D = dot(N, -V);
  float S = pow(1.0 - D, 32.0);
  float F = pow(D, 3.0);
  // f should slightly brighten the color
  vec3 col = vColor.rgb;
  col = col * 0.5 + (((F + S) * 0.2) * col);
  gl_FragColor = vec4(col, 1.0);
}