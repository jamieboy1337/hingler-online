// definitions pertaining to spotlights
// TODO: including these engine components vs from external?
// one solution would be including by default from some engine location (quotes vs angle brackets)
#include <attenuation.inc.glsl>

// TODO: scoot around?
#define SHADOW_BIAS 0.000001

struct SpotLight {
  // position of spot
  vec3 position;
  // direction of spot
  vec3 dir;

  // fov of spot (in rads)
  float fov;
  // falloff radius (0 = full falloff, 1 = hard cutoff)
  float falloffRadius;
  // intensity (0 - 1)
  float intensity;
  // color of light
  vec4 color;

  // mat4 which transforms from global coordinates to NDC from our light. correct for texcoord and lookup
  mat4 lightTransform;

  // attenuation factors for our light.
  Attenuation a;
};

// define a macro for spotlight arr?

vec4 getSpotLightColor(SpotLight, vec3);
vec4 getSpotLightColor(SpotLight, vec3, vec4, in sampler2D);
float getShadowTexture(SpotLight, vec3, vec4, in sampler2D);

vec4 getSpotLightColor(SpotLight s, vec3 pos) {
  vec3 dist = (pos - s.position);
  // atten based on dist
  float intensity = calculateAttenFactor(s.a, length(dist)) * s.intensity;
  float aoi = acos(dot(normalize(dist), normalize(s.dir)));
  float cut = s.fov / 2.0;
  // radius wrt fov --  1.0 = edge of lit area
  float rad = aoi / cut;

  // falloff
  intensity *= min(max(0.0, (1.0 - rad) / (s.falloffRadius + SHADOW_BIAS)), 1.0);

  return intensity * s.color;
}

vec4 getSpotLightColor(SpotLight s, vec3 pos, vec4 light_pos, in sampler2D shadowtex) {
  vec4 final_color = getSpotLightColor(s, pos);
  float shadowprop = getShadowTexture(s, pos, light_pos, shadowtex);

  return shadowprop * final_color;
}

/**
 * Determines whether or not the provided position is lit.
 * @param tex - the shadow texture.
 * @param shadowTransform - the matrix which transforms from world space to our shadow.
 * @param pos - the world position which we are checking.
 * @returns 1 if the position is lit by the light, 0 otherwise.
 */
float getShadowTexture(SpotLight s, vec3 pos, vec4 light_pos, in sampler2D shadowtex) {
  vec4 pos_ndc = light_pos;
  pos_ndc /= pos_ndc.w;
  float depth = pos_ndc.z;
  pos_ndc *= 0.5;
  pos_ndc += 0.5;
  vec2 pos_tex = pos_ndc.xy;
  float shadow_dist = texture2D(shadowtex, pos_tex).r + SHADOW_BIAS;

  float rawDist = (pos_ndc.z - shadow_dist);
  return 1.0 - step(0.0, rawDist);
}