// definitions pertaining to spotlights
// TODO: including these engine components vs from external?

#include <attenuation.inc.glsl>
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

// only include all this shader code if we absolutely need it
#ifndef STRUCT_ONLY
#define SHADOW_BIAS -0.000001

// one solution would be including by default from some engine location (quotes vs angle brackets)

#include <../pbr.inc.glsl>

// TODO: scoot around?

// define a macro for spotlight arr?
// TODO: account for normals in shadow func?

// extend into an alternative version which works with pbr

vec4 getSpotLightColor(SpotLight, vec3);
vec4 getSpotLightColor(SpotLight, vec3, vec4, in sampler2D);

/**
 *  Uses PBR pipeline to get spotlight color.
 *  @param s - the spotlight which lights the scene.
 *  @param cam_pos - the position of the camera.
 *  @param geom_pos - the position of our geometry.
 *  @param shadow_tex_pos - the position of our geometry with respect to NDC coordinates of our spotlight.
 *  @param albedo - RGB color of the point in question.
 *  @param norm - normal at point in question
 *  @param rough - roughness of surface at point
 *  @param shadow_tex - (optional) shadow texture at point.
 */
vec4 getSpotLightColorPBR(SpotLight s, vec3 cam_pos, vec3 geom_pos,                      vec3 albedo, vec3 norm, float rough, float metal);
vec4 getSpotLightColorPBR(SpotLight s, vec3 cam_pos, vec3 geom_pos, vec4 shadow_tex_pos, vec3 albedo, vec3 norm, float rough, float metal, in sampler2D shadow_tex);
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

vec4 getSpotLightColorPBR(SpotLight s, vec3 cam_pos, vec3 geom_pos, vec3 albedo, vec3 norm, float rough, float metal) {
  vec3 col = pbr(geom_pos, cam_pos, s.position.xyz, s.color.rgb, albedo, norm, rough, metal) * s.intensity;
  vec3 dist = (geom_pos - s.position);
  col *= calculateAttenFactor(s.a, length(dist));
  float aoi = acos(dot(normalize(dist), normalize(s.dir)));
  float cut = s.fov / 2.0;
  // radius wrt fov --  1.0 = edge of lit area
  float rad = aoi / cut;

  col *= min(max(0.0, (1.0 - rad) / (s.falloffRadius + SHADOW_BIAS)), 1.0);

  return vec4(col, 1.0);
}

vec4 getSpotLightColorPBR(SpotLight s, vec3 cam_pos, vec3 geom_pos, vec4 shadow_tex_pos, vec3 albedo, vec3 norm, float rough, float metal, in sampler2D shadow_tex) {
  vec4 col = getSpotLightColorPBR(s, cam_pos, geom_pos, albedo, norm, rough, metal);
  float shadowprop = getShadowTexture(s, geom_pos, shadow_tex_pos, shadow_tex);

  return vec4(shadowprop * col.rgb, 1.0);
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

#endif