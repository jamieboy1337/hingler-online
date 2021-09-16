#version 100

attribute vec4 aPosition;
attribute vec3 aNormal;
attribute vec4 aColor;
attribute mat4 aModelMat;
attribute mat3 aNormalMat;

varying vec4 vPosition;
varying vec3 vNormal;
varying vec4 vColor;

uniform mat4 vpMat;

void main() {
  vNormal = aNormalMat * aNormal;
  vPosition = aModelMat * aPosition;
  vColor = aColor;
  gl_Position = vpMat * vPosition;
}