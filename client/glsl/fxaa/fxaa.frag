#version 100

precision highp float;

uniform sampler2D col;
uniform sampler2D lum;
uniform vec2 resolution;

#define FXAA_TRIM 0.0312
#define FXAA_TRIM_LOCAL 0.063

varying vec2 vCoord;
// simple for now

float gLum(vec2 v) {
  return texture2D(lum, v).r;
}

// https://catlikecoding.com/unity/tutorials/custom-srp/fxaa/
vec4 fxaa(vec2 m) {
  vec2 o = vec2(1.0, 1.0) / resolution;
  
  vec2 n  = m + vec2(0.0, o.y);
  vec2 s  = m + vec2(0.0, -o.y);
  vec2 e  = m + vec2(o.x, 0.0);
  vec2 w  = m + vec2(-o.x, 0.0);
  float nL  = gLum(n);
  float sL  = gLum(s);
  float eL = gLum(e);
  float wL = gLum(w);

  float lumaMax = max(max(nL, sL), max(eL, wL));
  float lumaMin = min(min(nL, sL), min(eL, wL));
  float lumaRan = lumaMax - lumaMin;

  float lumTest = step(max(FXAA_TRIM, lumaMax * FXAA_TRIM_LOCAL), lumaRan);

  if (lumaRan < max(FXAA_TRIM, lumaMax * FXAA_TRIM_LOCAL)) {
    // return vec4(vec3(0.0), 1.0);
    return texture2D(col, m);
  }

  vec2 nw = m + vec2(-o.x, o.y);
  vec2 ne = m + vec2(o.x, o.y);
  vec2 sw = m + vec2(-o.x, -o.y);
  vec2 se = m + vec2(o.x, -o.y);

  float nwL = gLum(nw);
  float neL = gLum(ne);
  float mL  = gLum(m);
  float swL = gLum(sw);
  float seL = gLum(se);
  
  float filter = 2.0 * (nL + eL + sL + wL) + neL + nwL + seL + swL;
  filter *= 0.083333333333;
  filter = max(min(filter, 1.0), 0.0);
  filter = smoothstep(0.0, 1.0, abs(filter - mL) / lumaRan);
  filter *= filter;

  // compute edge orientation
  float horizontal = 2.0 * abs(nL - 2.0 * mL + sL)
    + abs(nwL - 2.0 * wL + swL)
    + abs(neL - 2.0 * eL + seL);

  float vertical = 2.0 * abs(wL - 2.0 * mL + eL)
    + abs(nwL - 2.0 * nL + neL)
    + abs(swL - 2.0 * sL + seL);

  float isHorizontal = step(vertical, horizontal);
  vec2 stepSize = vec2(1.0 - isHorizontal, isHorizontal) * o;

  // compute gradients in either direction of our step, plus and minus
  // blend into the pixel whose single step gradient is greater
  float pLum, nLum;
  if (isHorizontal > 0.5) {
    pLum = nL;
    nLum = sL;
  } else {
    pLum = eL;
    nLum = wL;
  }

  float targLuma = pLum;

  // negative gradient is greater
  float gradP = mL - pLum;
  float gradN = mL - nLum;
  float edgeGrad = gradP;
  
  float dif = step(0.0, abs(gradP) - abs(gradN));
  if (dif < 0.5) {
    stepSize = -stepSize;
    targLuma = nLum;
    edgeGrad = gradN;
  }

  float edgeLuma = (mL + targLuma) * 0.5;

  // edgestep perpendicular to our gradient
  vec2 edgeStep = vec2(isHorizontal, 1.0 - isHorizontal) * o;

  // land on the edge
  vec2 cur = m + (stepSize * 0.5);

  float gradThresh = abs(0.25 * edgeGrad);
  float lumGradPos, lumGradNeg;


  for (int i = 0; i < 99; i++) {
    cur += edgeStep;
    lumGradPos = gLum(cur) - edgeLuma;
    if (abs(lumGradPos) > gradThresh) {
      break;
    }
  }

  float distToEdgePos = length(cur - (m + stepSize * 0.5));

  cur = m + (stepSize * 0.5);

  for (int i = 0; i < 99; i++) {
    cur -= edgeStep;
    lumGradNeg = gLum(cur) - edgeLuma;
    if (abs(lumGradNeg) > gradThresh) {
      break;
    }
  }

  float distToEdgeNeg = length(cur - (m + stepSize * 0.5));

  float pos = step(distToEdgePos, distToEdgeNeg);
  float delta = (pos * lumGradPos + (1.0 - pos) * lumGradNeg);
  if (int(sign(delta)) != int(sign(edgeGrad))) {
    float edgeFilter = 0.5 - (min(distToEdgePos, distToEdgeNeg) / (distToEdgePos + distToEdgeNeg));
    filter = max(filter, edgeFilter);
  }

  // return vec4(vec3(filter), 1.0);
  return texture2D(col, m + stepSize * filter);
}



void main() {
  gl_FragColor = fxaa(vCoord);
}