// definitions pertaining to spotlights
// TODO: including these engine components vs from external?
// one solution would be including by default from some engine location (quotes vs angle brackets)
#include <attenuation.inc.glsl>

// TODO: scoot around?
#define SHADOW_BIAS 0.0005

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

float getShadowTexture(SpotLight, vec3, vec4, in sampler2D);

vec4 getSpotLightColor(SpotLight s, vec3 pos, vec4 light_pos, in sampler2D shadowtex) {
  // figure out intensity w/ attenuation based on dist, falloff, fov
  vec3 dist = (pos - s.position);
  // atten based on dist
  float intensity = calculateAttenFactor(s.a, length(dist)) * s.intensity;
  float aoi = acos(dot(normalize(dist), normalize(s.dir)));
  float cut = s.fov / 2.0;
  // radius wrt fov --  1.0 = edge of lit area
  float rad = aoi / cut;

  // falloff
  intensity *= min(max(0.0, (1.0 - rad) / (s.falloffRadius + SHADOW_BIAS)), 1.0);

  // shadow texture
  float shadowprop = getShadowTexture(s, pos, light_pos, shadowtex);

  return (intensity * shadowprop) * s.color;
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
  float depth = pos_ndc.z + SHADOW_BIAS;
  pos_ndc *= 0.5;
  pos_ndc += 0.5;
  vec2 pos_tex = pos_ndc.xy;
  float shadow_dist = texture2D(shadowtex, pos_tex).r;

  float rawDist = (depth - shadow_dist);
  return 1.0 - step(0.0, rawDist);
}