#include <version>

precision highp float;
precision highp int;

#include <env>
#include <compatibility>
#include <spotlight/object>

ATTRIB vec4 aPosition;
ATTRIB vec3 aNormal;

VARYING vec4 vPosition;
VARYING vec3 vNormal;

ATTRIB mat4 modelMatChild;
// field is just a translation, assume normal is unchanged
ATTRIB mat3 normalMatChild;
uniform mat4 modelMatParent;
uniform mat4 vpMat;

uniform SpotLight spotlight[4];
uniform int spotlightCount;

VARYING vec4 spot_coord[4];

uniform samplerCube skyboxDiffuse[2];
uniform float skyboxDiffuseIntensity[2];

void main() {
  vPosition = modelMatParent * modelMatChild * aPosition;
  vNormal = normalMatChild * aNormal;

  for (int i = 0; i < 4; i++) {
    if (i >= spotlightCount) {
      break;
    }

    spot_coord[i] = spotlight[i].lightTransform * vPosition;
  }
  
  gl_Position = vpMat * vPosition;
}