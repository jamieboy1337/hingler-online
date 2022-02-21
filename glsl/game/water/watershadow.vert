#include <version>
precision highp float;
precision highp int;

#include <compatibility>

#include <water.inc.glsl>

ATTRIB vec4 position;

uniform mat4 modelMatrix;
uniform mat4 vpMatrix;

uniform float time;

uniform Wave wavelist[4];
uniform int wavecount;

void main() {
  vec4 worldPos = (modelMatrix * position);

  vec3 particleInfluence = vec3(0.0);

  // calculate tbn space here
  // apply to simplex noise bump
  for (int i = 0; i < 4; i++) {
    if (i >= wavecount) {
      break;
    }

    particleInfluence += getParticleInfluencePosition(wavelist[i], worldPos.xyz, time);
  }

  gl_Position = vpMatrix * vec4(particleInfluence + worldPos.xyz, worldPos.w);
}

