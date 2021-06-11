#version 100

struct Light {
  vec4 pos;
  float intensity;
  vec4 diffuse;
  vec4 ambient;
};

varying vec4 position;
varying vec4 normal;

uniform vec4 surface_color;
uniform Light light;

void main() {
  vec4 light_vector = light.pos - position;
  float dist = length(light_vector);
  light_vector = normalize(light_vector);
  float n_b = max(dot(light_vector.xyz, normal), 0.0);

  vec4 col = surface_color * (n_b * light.intensity);
  gl_FragColor = vec4(col.xyz, 1.0);
}