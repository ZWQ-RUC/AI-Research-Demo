// ============================================================================
// Procedural Noise, Math & Catmull-Rom Spline Utilities (Zero External Assets)
// ============================================================================
(function(global) {
  'use strict';

  function createRNG(seed) {
    let s = seed >>> 0;
    return function() {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const perm = new Uint8Array(512);
  (function initPerm() {
    const rng = createRNG(1337420);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = p[i]; p[i] = p[j]; p[j] = tmp;
    }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  })();

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a, b, t) { return a + t * (b - a); }
  function grad3(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  function noise3D(x, y, z) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    const u = fade(x), v = fade(y), w = fade(z);
    const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z;
    const B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
    return lerp(
      lerp(
        lerp(grad3(perm[AA], x, y, z), grad3(perm[BA], x - 1, y, z), u),
        lerp(grad3(perm[AB], x, y - 1, z), grad3(perm[BB], x - 1, y - 1, z), u),
        v
      ),
      lerp(
        lerp(grad3(perm[AA + 1], x, y, z - 1), grad3(perm[BA + 1], x - 1, y, z - 1), u),
        lerp(grad3(perm[AB + 1], x, y - 1, z - 1), grad3(perm[BB + 1], x - 1, y - 1, z - 1), u),
        v
      ),
      w
    );
  }

  function fbm3D(x, y, z, octaves) {
    octaves = octaves || 4;
    let val = 0, amp = 0.5, freq = 1.0, maxAmp = 0;
    for (let i = 0; i < octaves; i++) {
      val += amp * noise3D(x * freq, y * freq, z * freq);
      maxAmp += amp;
      amp *= 0.5;
      freq *= 2.07;
    }
    return val / maxAmp;
  }

  class CatmullRomSpline3D {
    constructor(points) {
      this.points = points;
      this.samples = [];
      this.buildSamples(400);
    }

    evaluate(t) {
      const pts = this.points;
      const n = pts.length - 1;
      const clampedT = Math.max(0, Math.min(1, t));
      const f = clampedT * n;
      const i = Math.min(n - 1, Math.floor(f));
      const u = f - i;
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[Math.min(n, i + 1)];
      const p3 = pts[Math.min(n, i + 2)];

      const u2 = u * u, u3 = u2 * u;
      function cr(v0, v1, v2, v3) {
        return 0.5 * (
          (2 * v1) +
          (-v0 + v2) * u +
          (2 * v0 - 5 * v1 + 4 * v2 - v3) * u2 +
          (-v0 + 3 * v1 - 3 * v2 + v3) * u3
        );
      }
      function dcr(v0, v1, v2, v3) {
        return 0.5 * (
          (-v0 + v2) +
          (4 * v0 - 10 * v1 + 8 * v2 - 2 * v3) * u +
          (-3 * v0 + 9 * v1 - 9 * v2 + 3 * v3) * u2
        );
      }

      const x = cr(p0.x, p1.x, p2.x, p3.x);
      const y = cr(p0.y, p1.y, p2.y, p3.y);
      const z = cr(p0.z, p1.z, p2.z, p3.z);
      const radiusW = cr(p0.radiusW, p1.radiusW, p2.radiusW, p3.radiusW);
      const heightH = cr(p0.heightH, p1.heightH, p2.heightH, p3.heightH);

      let tx = dcr(p0.x, p1.x, p2.x, p3.x);
      let ty = dcr(p0.y, p1.y, p2.y, p3.y);
      let tz = dcr(p0.z, p1.z, p2.z, p3.z);
      const tLen = Math.hypot(tx, ty, tz) || 1;
      tx /= tLen; ty /= tLen; tz /= tLen;

      const rLen = Math.hypot(tx, tz) || 1;
      const rx = -tz / rLen;
      const rz = tx / rLen;

      return { t: clampedT, x, y, z, tx, ty, tz, rx, rz, radiusW, heightH };
    }

    buildSamples(count) {
      this.samples = [];
      for (let i = 0; i <= count; i++) {
        this.samples.push(this.evaluate(i / count));
      }
    }

    findClosest(x, z) {
      let bestIdx = 0;
      let bestDistSq = Infinity;
      const samples = this.samples;
      for (let i = 0; i < samples.length; i++) {
        const dx = x - samples[i].x;
        const dz = z - samples[i].z;
        const d2 = dx * dx + dz * dz;
        if (d2 < bestDistSq) {
          bestDistSq = d2;
          bestIdx = i;
        }
      }
      const step = 1 / (samples.length - 1);
      const t0 = Math.max(0, (bestIdx - 1) * step);
      const t1 = Math.min(1, (bestIdx + 1) * step);
      let bestSample = samples[bestIdx];
      for (let k = 0; k <= 10; k++) {
        const t = t0 + (t1 - t0) * (k / 10);
        const s = this.evaluate(t);
        const d2 = (x - s.x) * (x - s.x) + (z - s.z) * (z - s.z);
        if (d2 < bestDistSq) {
          bestDistSq = d2;
          bestSample = s;
        }
      }
      const dx = x - bestSample.x;
      const dz = z - bestSample.z;
      const lateral = dx * bestSample.rx + dz * bestSample.rz;
      return {
        sample: bestSample,
        dist: Math.sqrt(bestDistSq),
        lateral: lateral
      };
    }
  }

  global.CaveMath = {
    createRNG,
    lerp,
    noise3D,
    fbm3D,
    CatmullRomSpline3D
  };
})(window);
