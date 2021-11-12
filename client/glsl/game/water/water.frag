#version 100
#extension GL_EXT_shader_texture_lod : enable

precision highp float;
precision highp int;

#include <ambient>
#include <gradient>
#include <opensimplex>
#include <perlin>
#include <spotlight>

#include <./water.inc.glsl>

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

uniform samplerCube cubemapDiffuse;
uniform samplerCube cubemapSpec;
uniform sampler2D texBRDF;
uniform float skyboxIntensity;
uniform float specRes;
uniform int useSkybox;

#define WAVE_COLOR vec3(0.05, 0.111, 0.15)
#define METALLIC 0.005
#define ROUGH 0.02
#define FACTORS 1

// higher spec platforms: simplex perturbations in vert normal, perlin perturbation in frag, low (0.1 - 0.15) roughness
// lower  spec platforms: no perturbations, higher (0.5 - 0.7) roughness

// how to communicate necessity of changing specs?
// later we can add an option menu
// for now, we can use frame times to tweak it on the fly
// if frame times are long, we'll bump down to the lower spec ver (cut some effects)


// devise color mapping based on height, like in blender ver

// support spotlights
// low roughness, a little metallic


void main() {
  vec4 surfaceCol = getGradient(gradientCols, gradientStops, 0.14 * vHeight + 0.12);
  vec2 travel = (wavelist[0].direction * wavelist[0].phi * 1.4) * time;
  vec3 noisePos = (1.1 * vec3(vPositionOriginal.x, vPosition.y / 6.0, vPositionOriginal.z)) + vec3(travel.x, time * 0.9, travel.y);
  vec2 noisePosT = 2.2980446 * noisePos.xz;
  // bump += openSimplex2_Classical(noisePos);

  float bump_main = noise3d(noisePos) + noise2d(noisePosT) * 0.4;
  float bump_x = noise3d(noisePos + vec3(0.0001, 0.0, 0.0)) + noise2d(noisePosT + vec2(0.0001, 0.0)) * 0.4;
  float bump_z = noise3d(noisePos + vec3(0.0, 0.0, 0.0001)) + noise2d(noisePosT + vec2(0.0, 0.0001)) * 0.4;



  float foamIntensity = foamFactor * 0.45 * min(max(vHeight - 0.2, 0.0), 1.0);

  surfaceCol += vec4(vec3(foamIntensity), 0.0);
  vec3 norm = vec3(250.0 * (bump_x - bump_main), 1.0, 250.0 * (bump_z - bump_main));
  // vec3 norm = vNormal;

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

  // for (int i = 0; i < 4; i++) {
  //   if (i >= ambientCount) {
  //     break;
  //   }

  //   col += vec4(vec3(0.25, 0.5625, 0.78), 1.0) * getAmbientColor(ambient[i]);
  // }

  if (useSkybox > 0) {
    col += vec4(pbr(vPosition.xyz, camera_pos, cubemapDiffuse, cubemapSpec, texBRDF, surfaceCol.rgb, norm, roughness, METALLIC, specRes) * skyboxIntensity, 0.0);
  }

  // todo: what the fuck is the shadow problem?????

  gl_FragColor = vec4(pow(col.xyz, vec3(1.0 / 2.2)), 1.0);
}