#version 100
precision highp float;
precision highp int;

#include <opensimplex>
#include <perlin>
#include <spotlight>

#include <./water.inc.glsl>

attribute vec4 position;

// apply ocean modifier to position
// calculate normal via gpugems method

varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vPositionOriginal;

varying float vHeight;
varying float foamFactor;

varying mat3 TBN;

uniform mat4 modelMatrix;
uniform mat4 vpMatrix;

uniform float time;

uniform Wave wavelist[4];
uniform int wavecount;

uniform SpotLight spotlight[3];
uniform int spotlightCount;

varying vec4 spot_coord[3];

void main() {
  vec4 worldPos = (modelMatrix * position);
  vPositionOriginal = worldPos.xyz;

  vec3 particleInfluence = vec3(0.0);
  vec3 normalInfluence = vec3(0.0);
  vec3 tangentInfluence = vec3(0.0);

  // calculate tbn space here
  // apply to simplex noise bump

  vec3 tangentTemp = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    if (i >= wavecount) {
      break;
    }

    particleInfluence += getParticleInfluencePosition(wavelist[i], worldPos.xyz, time);
    normalInfluence += getParticleInfluenceNormal(wavelist[i], worldPos.xyz, time, tangentTemp);
    tangentInfluence += tangentTemp;
  }

  vPosition = 1.0 * particleInfluence + worldPos.xyz;

  // get noise here
  // vec4 noise = vec4(0.0);
  // vec3 samplePos = 1.5 * vPosition + vec3(0.0, time * 0.3, 0.0);
  // noise += 0.03 * openSimplex2_Classical(samplePos);

  // vec3 N = normalize(vec3(0.0, 1.0, 0.0) + normalInfluence + vec3(noise.x, 0.0, noise.z));
  vec3 N = normalize(vec3(0.0, 1.0, 0.0) + normalInfluence);
  vec3 T = normalize(vec3(0.0, 0.0, 1.0) + tangentInfluence);
  vec3 B = normalize(cross(N, T));
  TBN = mat3(T, B, N);
  vNormal = N;

  foamFactor = (noise2d(0.5 * worldPos.xy) + 1.0) * 0.5;
  foamFactor = pow(foamFactor, 1.6);
  vHeight = particleInfluence.y;
  worldPos = vec4(vPosition.xyz, worldPos.w);

  for (int i = 0; i < 3; i++) {
    if (i >= spotlightCount) {
      break;
    }

    spot_coord[i] = spotlight[i].lightTransform * worldPos;
  }
  
  gl_Position = vpMatrix * worldPos;
}

