#version 100
precision highp float;
precision highp int;

#include <../../includes/opensimplex.inc.glsl>
#include <../../includes/spotlight/spotlight.inc.glsl>
#include <./water.inc.glsl>
#include <../../includes/ambient.inc.glsl>
#include <../../includes/gradient.inc.glsl>
#include <../../includes/perlin.inc.glsl>

varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vPositionOriginal;
varying float vHeight;
varying float foamFactor;
varying mat3 TBN;
varying vec4 spot_coord[3];

uniform float time;

uniform SpotLight spotlight[3];
uniform sampler2D texture_spotlight[3];
uniform int spotlightCount;


uniform SpotLight spotlight_no_shadow[4];
uniform int spotlightCount_no_shadow;

uniform AmbientLight ambient[4];
uniform int ambientCount;

uniform vec3 camera_pos;

uniform vec4 gradientCols[4];
uniform float gradientStops[4];

uniform Wave wavelist[4];
uniform int wavecount;

#define WAVE_COLOR vec3(0.05, 0.111, 0.15)
#define METALLIC 0.005
#define ROUGH 0.08
#define FACTORS 1


// devise color mapping based on height, like in blender ver

// support spotlights
// low roughness, a little metallic


void main() {
  vec4 surfaceCol = getGradient(gradientCols, gradientStops, 0.1 * vHeight + 0.13);
  vec4 bump = vec4(0.0);
  vec2 travel = (wavelist[0].direction * wavelist[0].phi * 2.0) * time;
  vec3 noisePos = (1.1 * vPositionOriginal).xyz + vec3(travel.x, time * 0.9, travel.y);
  vec2 noisePosT = 2.2980446 * noisePos.xz;
  // bump += openSimplex2_Classical(noisePos);

  float bump_main = noise3d(noisePos) + noise2d(noisePosT) * 0.4;
  float bump_x = noise3d(noisePos + vec3(0.0001, 0.0, 0.0)) + noise2d(noisePosT + vec2(0.0001, 0.0)) * 0.4;
  float bump_z = noise3d(noisePos + vec3(0.0, 0.0, 0.0001)) + noise2d(noisePosT + vec2(0.0, 0.0001)) * 0.4;



  float foamIntensity = foamFactor * (2.0 + bump.w + 1.0) * 0.25 * min(max(vHeight - 0.2, 0.0), 1.0);

  surfaceCol += vec4(vec3(foamIntensity), 0.0);
  vec3 norm = vec3(250.0 * (bump_x - bump_main), 1.0, 250.0 * (bump_z - bump_main));
  norm = normalize(norm);

  float roughness = mix(ROUGH, 0.9, foamIntensity);

  vec4 col = vec4(0.0);
  for (int i = 0; i < 4; i++) {
    if (i >= spotlightCount) {
      break;
    }

    col += getSpotLightColorPBR(spotlight[i], camera_pos, vPosition.xyz, spot_coord[i], surfaceCol.rgb, norm, roughness, METALLIC, texture_spotlight[i]);

  }

  for (int i = 0; i < 4; i++) {
    if (i >= spotlightCount_no_shadow) {
      break;
    }

    col += getSpotLightColorPBR(spotlight_no_shadow[i], camera_pos, vPosition.xyz, surfaceCol.rgb, norm, roughness, METALLIC);
  }

  vec4 pos_ndc = spot_coord[0];
  pos_ndc /= pos_ndc.w;
  float depth = pos_ndc.z;
  pos_ndc *= 0.5;
  pos_ndc += 0.5;
  float z = texture2D(texture_spotlight[0], gl_FragCoord.xy / vec2(1920.0, 951.0)).r;
  float k = (2.0 * 4.0) / (750.0 + 4.0 - z * (750.0 - 4.0));
  // for (int i = 0; i < 4; i++) {
  //   if (i >= ambientCount) {
  //     break;
  //   }

  //   col += vec4(vec3(0.25, 0.5625, 0.78), 1.0) * getAmbientColor(ambient[i]);
  // }

  // todo: what the fuck is the shadow problem?????

  gl_FragColor = vec4(pow(col.xyz, vec3(1.0 / 2.2)), 1.0);
}