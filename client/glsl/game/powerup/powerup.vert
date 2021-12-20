#include <version>

#include <compatibility>

ATTRIB vec4 aPosition;
ATTRIB vec3 aNormal;
ATTRIB vec4 aColor;
ATTRIB mat4 aModelMat;
ATTRIB mat3 aNormalMat;

VARYING vec4 vPosition;
VARYING vec3 vNormal;
VARYING vec4 vColor;

uniform mat4 vpMat;

void main() {
  vNormal = aNormalMat * aNormal;
  vPosition = aModelMat * aPosition;
  vColor = aColor;
  gl_Position = vpMat * vPosition;
}