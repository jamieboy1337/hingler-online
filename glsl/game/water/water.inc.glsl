struct Wave {
  // controls direction in which waves travel
  vec2 direction;

  // amp
  float amp;

  // precomputed constants
  float qa;
  float wa;

  // freq
  float freq;

  // speed component
  float phi;
};

struct WavePack {
  vec3 directionAmp;
  vec4 qa_wa_freq_phi;
};

/**
 *  Returns the influence a single wave has on the particle at pos.
 *  @param w - the wave
 *  @param pos - the position of the particle being observed
 *  @param t - time
 */
vec3 getParticleInfluencePosition(Wave w, vec3 pos, float t) {
  // calc in cpu
  float wd = (w.freq * dot(w.direction, pos.xz) + w.phi * t);
  float cos_wd = cos(wd);
  float sin_wd = sin(wd);

  return vec3(
    w.qa * w.direction.x * cos_wd,
    w.amp * sin_wd,
    w.qa * w.direction.y * cos_wd
  );
}

vec3 getParticleInfluenceNormal(Wave w, vec3 pos, float t, out vec3 tangent) {
  float wd_new = (w.freq * dot(w.direction, pos.xz) + w.phi * t);

  float cos_wd_new = cos(wd_new);
  float sin_wd_new = sin(wd_new);
  
  tangent = -vec3(
    w.qa * w.freq * w.direction.x * w.direction.y * sin_wd_new,
    w.direction.y * w.wa * cos_wd_new,
    w.qa * w.freq * w.direction.y * w.direction.y * sin_wd_new
  );

  return -vec3(
    w.direction.x * w.wa * cos_wd_new,
    w.qa * w.freq * sin_wd_new,
    w.direction.y * w.wa * cos_wd_new
  );
}

// calculate tangent as well?
// that way we can normal map our simplex noise on top