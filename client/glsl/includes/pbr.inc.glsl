// thank you https://learnopengl.com/PBR/Theory

#include <constants.inc.glsl>

float trowbridgeReitz(vec3, vec3, float);
float schlick(vec3, vec3, float);
float schlickSmith(vec3, vec3, vec3, float);
vec3 fresnel(vec3, vec3, vec3);

vec3 pbr(vec3 pos, vec3 cam_pos, vec3 light_pos, vec3 light_color, vec3 albedo, vec3 normal, float roughness, float metallic) {
  vec3 N = normalize(normal);
  vec3 V = normalize(cam_pos - pos);
  vec3 L = normalize(light_pos - pos);
  vec3 H = normalize(L + V);

  float NdotL = max(dot(N, L), 0.0);

  float NDF = trowbridgeReitz(N, H, roughness);
  float G = schlickSmith(N, V, L, roughness);
  vec3 F0 = mix(vec3(0.04), albedo, metallic);
  vec3 F = fresnel(N, V, F0);

  // fudge factor: not phys accurate
  if (metallic < 0.001) {
    F = vec3(0.0);
  }

  vec3 ks = F;
  vec3 kd = vec3(1.0) - ks;
  kd *= (1.0 - metallic);

  vec3 num = NDF * G * F;
  float denom = 4.0 * max(dot(N, V), 0.0) * NdotL;
  vec3 specular = num / max(denom, 0.0001);

  vec3 diffuse = albedo * kd / PI;
  return (specular + diffuse) * light_color * NdotL;
}

float trowbridgeReitz(vec3 N, vec3 H, float alpha) {
  float a2 = alpha * alpha;
  float n_h = max(dot(N, H), 0.0);
  float denom_term = (n_h * n_h) * (a2  - 1.0) + 1.0;

  return a2 / (PI * denom_term * denom_term);
}

float schlick(vec3 N, vec3 V, float K) {
  float nv = max(dot(N, V), 0.0);
  return nv / (nv * (1.0 - K) + K);
}

float schlickSmith(vec3 N, vec3 V, vec3 L, float alpha) {
  float alph_num = (alpha + 1.0);
  float K = (alph_num * alph_num) / 8.0;

  float schlickSubV = schlick(N, V, K);
  float schlickSubL = schlick(N, L, K);

  return schlickSubV * schlickSubL;
}

vec3 fresnel(vec3 H, vec3 V, vec3 F0) {
  float one_minus_hv = (1.0 - max(dot(H, V), 0.0));
  return F0 + (vec3(1.0) - F0) * pow(one_minus_hv, 5.0);
}

