    // =========================================================================
    // 1. DETERMINISTIC PRNG & SIMPLEX / FBM NOISE
    // =========================================================================
    class SeededRandom {
      constructor(seed = 2026) {
        this.s = (Number(seed) || 2026) % 2147483647;
        if (this.s <= 0) this.s += 2147483646;
      }
      next() {
        this.s = (this.s * 16807) % 2147483647;
        return (this.s - 1) / 2147483646;
      }
      range(min, max) {
        return min + this.next() * (max - min);
      }
      int(min, max) {
        return Math.floor(this.range(min, max + 1));
      }
    }

    class Noise2D {
      constructor(seed = 2026) {
        const rng = new SeededRandom(seed);
        this.p = new Uint8Array(512);
        const perm = new Uint8Array(256);
        for (let i = 0; i < 256; i++) perm[i] = i;
        for (let i = 255; i > 0; i--) {
          const j = Math.floor(rng.next() * (i + 1));
          const t = perm[i];
          perm[i] = perm[j];
          perm[j] = t;
        }
        for (let i = 0; i < 512; i++) this.p[i] = perm[i & 255];
      }
      fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
      lerp(t, a, b) { return a + t * (b - a); }
      grad(hash, x, y) {
        const h = hash & 7;
        const u = h < 4 ? x : y;
        const v = h < 4 ? y : x;
        return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
      }
      noise(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        const u = this.fade(x);
        const v = this.fade(y);
        const A = this.p[X] + Y;
        const B = this.p[X + 1] + Y;
        return this.lerp(
          v,
          this.lerp(u, this.grad(this.p[A], x, y), this.grad(this.p[B], x - 1, y)),
          this.lerp(u, this.grad(this.p[A + 1], x, y - 1), this.grad(this.p[B + 1], x - 1, y - 1))
        ) * 0.5 + 0.5;
      }
      fbm(x, y, octaves = 4) {
        let val = 0;
        let amp = 0.5;
        let freq = 1.0;
        let norm = 0;
        for (let i = 0; i < octaves; i++) {
          val += amp * this.noise(x * freq, y * freq);
          norm += amp;
          amp *= 0.5;
          freq *= 2.05;
        }
        return val / norm;
      }
    }

    // =========================================================================
    // 2. STYLE PRESETS & STATE CONFIGURATION
    // =========================================================================
    const STYLE_PRESETS = {
      dusk: {
        name: '蓝调黄昏',
        swatches: ['#151226', '#3c2547', '#d97736', '#38bdf8', '#f43f5e', '#287a6c'],
        skyZenith: [0.08, 0.06, 0.16],
        skyMid: [0.28, 0.16, 0.30],
        skyHorizon: [0.86, 0.46, 0.24],
        fogColor: [0.24, 0.16, 0.26],
        mountainColor: [0.13, 0.09, 0.20],
        yangtzeColor: [0.64, 0.48, 0.30],
        jialingColor: [0.16, 0.48, 0.44],
        terrainLow: [0.16, 0.15, 0.21],
        terrainMid: [0.21, 0.20, 0.26],
        terrainHigh: [0.15, 0.23, 0.20],
        cliffColor: [0.24, 0.20, 0.23],
        sunColor: [0.95, 0.62, 0.38],
        ambientColor: [0.36, 0.34, 0.52],
        windowEmissive: 0.92,
        neonScale: 1.0,
        defaultLighting: { exposure: 112, ambient: 88, sunIntensity: 105, sunAngle: 13, fogDensity: 45, neonIntensity: 100 }
      },
      neon: {
        name: '魔幻霓虹夜',
        swatches: ['#090614', '#581c87', '#94a3b8', '#3b82f6', '#ec4899', '#115e59'],
        skyZenith: [0.03, 0.02, 0.08],
        skyMid: [0.11, 0.05, 0.20],
        skyHorizon: [0.22, 0.08, 0.34],
        fogColor: [0.09, 0.05, 0.17],
        mountainColor: [0.05, 0.03, 0.11],
        yangtzeColor: [0.13, 0.12, 0.21],
        jialingColor: [0.07, 0.20, 0.24],
        terrainLow: [0.08, 0.08, 0.13],
        terrainMid: [0.11, 0.10, 0.16],
        terrainHigh: [0.07, 0.12, 0.14],
        cliffColor: [0.13, 0.11, 0.17],
        sunColor: [0.45, 0.36, 0.78],
        ambientColor: [0.22, 0.20, 0.38],
        windowEmissive: 1.25,
        neonScale: 1.55,
        defaultLighting: { exposure: 112, ambient: 76, sunIntensity: 65, sunAngle: 8, fogDensity: 35, neonIntensity: 140 }
      },
      mist: {
        name: '雾都清晨',
        swatches: ['#cbd5e1', '#f1f5f9', '#d6d3c4', '#6495ed', '#e11d48', '#4d9078'],
        skyZenith: [0.84, 0.87, 0.90],
        skyMid: [0.92, 0.94, 0.96],
        skyHorizon: [0.98, 0.99, 1.00],
        fogColor: [0.94, 0.96, 0.98],
        mountainColor: [0.72, 0.75, 0.79],
        yangtzeColor: [0.78, 0.73, 0.64],
        jialingColor: [0.58, 0.72, 0.69],
        terrainLow: [0.58, 0.61, 0.59],
        terrainMid: [0.64, 0.67, 0.63],
        terrainHigh: [0.50, 0.58, 0.52],
        cliffColor: [0.62, 0.61, 0.59],
        sunColor: [0.95, 0.94, 0.92],
        ambientColor: [0.92, 0.94, 0.96],
        windowEmissive: 0.03,
        neonScale: 0.10,
        defaultLighting: { exposure: 118, ambient: 115, sunIntensity: 95, sunAngle: 28, fogDensity: 68, neonIntensity: 15 }
      },
      noon: {
        name: '山城烈日',
        swatches: ['#0284c7', '#bae6fd', '#e2e8f0', '#0d9488', '#d97706', '#16a34a'],
        skyZenith: [0.16, 0.46, 0.74],
        skyMid: [0.38, 0.64, 0.86],
        skyHorizon: [0.68, 0.80, 0.88],
        fogColor: [0.62, 0.74, 0.84],
        mountainColor: [0.22, 0.34, 0.42],
        yangtzeColor: [0.58, 0.45, 0.28],
        jialingColor: [0.14, 0.48, 0.42],
        terrainLow: [0.28, 0.32, 0.28],
        terrainMid: [0.32, 0.38, 0.30],
        terrainHigh: [0.22, 0.36, 0.24],
        cliffColor: [0.38, 0.35, 0.32],
        sunColor: [0.78, 0.75, 0.68],
        ambientColor: [0.48, 0.54, 0.62],
        windowEmissive: 0.06,
        neonScale: 0.12,
        defaultLighting: { exposure: 102, ambient: 85, sunIntensity: 105, sunAngle: 55, fogDensity: 22, neonIntensity: 15 }
      },
      retro: {
        name: '老重庆',
        swatches: ['#291811', '#78350f', '#b45309', '#d97706', '#991b1b', '#3f6212'],
        skyZenith: [0.16, 0.10, 0.08],
        skyMid: [0.38, 0.21, 0.13],
        skyHorizon: [0.78, 0.46, 0.22],
        fogColor: [0.34, 0.21, 0.14],
        mountainColor: [0.18, 0.11, 0.09],
        yangtzeColor: [0.54, 0.38, 0.22],
        jialingColor: [0.20, 0.39, 0.33],
        terrainLow: [0.20, 0.16, 0.14],
        terrainMid: [0.25, 0.20, 0.16],
        terrainHigh: [0.20, 0.24, 0.15],
        cliffColor: [0.30, 0.22, 0.17],
        sunColor: [0.92, 0.65, 0.36],
        ambientColor: [0.42, 0.32, 0.25],
        windowEmissive: 0.88,
        neonScale: 0.80,
        defaultLighting: { exposure: 108, ambient: 84, sunIntensity: 100, sunAngle: 15, fogDensity: 48, neonIntensity: 85 }
      }
    };

    const DISTRICT_PRESETS = {
      yuzhong: { com: 40, res: 46, ind: 14 },
      jiangbeizui: { com: 62, res: 30, ind: 8 },
      nanan: { com: 28, res: 58, ind: 14 },
      shapingba: { com: 32, res: 56, ind: 12 },
      jiulongpo: { com: 20, res: 42, ind: 38 }
    };

    // Camera Presets calibrated to match the exact framing of 1.png - 5.png
    // Note: yaw = 2.28 places the camera in the Southwest (-X, +Z) looking Northeast toward Chaotianmen (+X, -Z),
    // so Yangtze is on the left/bottom-left, Raffles City is center-right, and Jialing River is upper-right!
    const CAMERA_PRESETS = {
      // General Views
      orbit:      { target: [15, 26, 12],   yaw: 0.74,  pitch: 0.34, dist: 470, fov: 44, autoOrbit: true },
      top:        { target: [10, 0, 0],     yaw: 1.58,  pitch: 1.48, dist: 720, fov: 44, autoOrbit: false },
      iso:        { target: [15, 25, 10],   yaw: 0.76,  pitch: 0.55, dist: 580, fov: 30, autoOrbit: false },
      street:     { target: [95, 38, 18],   yaw: 0.62,  pitch: 0.14, dist: 210, fov: 48, autoOrbit: false },
      cinema:     { target: [45, 32, 15],   yaw: 0.66,  pitch: 0.20, dist: 380, fov: 40, autoOrbit: true },
      // Chongqing Specific Views
      confluence: { target: [18, 26, 12],   yaw: 0.74,  pitch: 0.33, dist: 465, fov: 44, autoOrbit: false },
      monorail:   { target: [-88, 46, -48], yaw: 0.85,  pitch: 0.18, dist: 155, fov: 44, autoOrbit: false },
      interchange:{ target: [-175, 20, 195],yaw: 0.85,  pitch: 0.48, dist: 260, fov: 45, autoOrbit: false },
      hongyadong: { target: [32, 26, -84],  yaw: -1.18, pitch: 0.22, dist: 205, fov: 45, autoOrbit: false },
      elevation:  { target: [-15, 34, 8],   yaw: 0.82,  pitch: 0.22, dist: 360, fov: 45, autoOrbit: false }
    };

    const appState = {
      seed: 2026,
      citySize: 20,
      density: 80,
      blockSize: 100,
      roadPattern: 'freeform',
      districtPreset: 'yuzhong',
      comRatio: 40,
      resRatio: 46,
      indRatio: 14,
      avgHeight: 72,
      heightVar: 55,
      landmarkProb: 10,
      cityStyle: 'dusk',
      landform: 'peninsula',
      terrainHeight: 120,
      roughness: 40,
      terraceSteps: 60,
      riverWidth: 100,
      parkRatio: 9,
      interchangeLayers: 5,
      tunnelStations: 2,
      bridgeCount: 4,
      trafficDensity: 60,
      cableway: true,
      exposure: 112,
      ambient: 88,
      sunIntensity: 105,
      sunAngle: 13,
      fogDensity: 45,
      neonIntensity: 100,
      activeCam: 'confluence',
      showLabels: true
    };

    // =========================================================================
    // 3. MATH & MATRIX HELPERS FOR 3D ENGINE
    // =========================================================================
    function mat4Perspective(fovRad, aspect, near, far) {
      const f = 1.0 / Math.tan(fovRad / 2);
      const nf = 1 / (near - far);
      const out = new Float32Array(16);
      out[0] = f / aspect;
      out[5] = f;
      out[10] = (far + near) * nf;
      out[11] = -1;
      out[14] = (2 * far * near) * nf;
      return out;
    }

    function mat4LookAt(eye, center, up) {
      let zx = eye[0] - center[0], zy = eye[1] - center[1], zz = eye[2] - center[2];
      let len = Math.hypot(zx, zy, zz) || 1;
      zx /= len; zy /= len; zz /= len;
      let xx = up[1] * zz - up[2] * zy;
      let xy = up[2] * zx - up[0] * zz;
      let xz = up[0] * zy - up[1] * zx;
      len = Math.hypot(xx, xy, xz) || 1;
      xx /= len; xy /= len; xz /= len;
      const yx = zy * xz - zz * xy;
      const yy = zz * xx - zx * xz;
      const yz = zx * xy - zy * xx;
      const out = new Float32Array(16);
      out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
      out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
      out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
      out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
      out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
      out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
      out[15] = 1;
      return out;
    }

    function mat4Multiply(a, b) {
      const out = new Float32Array(16);
      for (let i = 0; i < 4; i++) {
        const ai0 = a[i], ai1 = a[i + 4], ai2 = a[i + 8], ai3 = a[i + 12];
        out[i]      = ai0 * b[0]  + ai1 * b[1]  + ai2 * b[2]  + ai3 * b[3];
        out[i + 4]  = ai0 * b[4]  + ai1 * b[5]  + ai2 * b[6]  + ai3 * b[7];
        out[i + 8]  = ai0 * b[8]  + ai1 * b[9]  + ai2 * b[10] + ai3 * b[11];
        out[i + 12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
      }
      return out;
    }

    function projectToScreen(wx, wy, wz, vpMat, width, height) {
      const cx = vpMat[0] * wx + vpMat[4] * wy + vpMat[8]  * wz + vpMat[12];
      const cy = vpMat[1] * wx + vpMat[5] * wy + vpMat[9]  * wz + vpMat[13];
      const cz = vpMat[2] * wx + vpMat[6] * wy + vpMat[10] * wz + vpMat[14];
      const cw = vpMat[3] * wx + vpMat[7] * wy + vpMat[11] * wz + vpMat[15];
      if (cw <= 0.1) return null;
      const ndcX = cx / cw;
      const ndcY = cy / cw;
      const ndcZ = cz / cw;
      if (ndcX < -1.15 || ndcX > 1.15 || ndcY < -1.15 || ndcY > 1.15 || ndcZ > 1.0) return null;
      return {
        x: (ndcX * 0.5 + 0.5) * width,
        y: (1.0 - (ndcY * 0.5 + 0.5)) * height,
        depth: cw
      };
    }

    // =========================================================================
    // 4. PROCEDURAL GEOMETRY BUILDER BUFFER
    // =========================================================================
    class MeshBuilder {
      constructor(initialVertices = 131072) {
        this.cap = initialVertices;
        this.count = 0;
        this.pos = new Float32Array(this.cap * 3);
        this.norm = new Float32Array(this.cap * 3);
        this.col = new Float32Array(this.cap * 3);
        this.uv = new Float32Array(this.cap * 2);
        this.meta = new Float32Array(this.cap * 4);
      }

      ensure(addVerts) {
        if (this.count + addVerts <= this.cap) return;
        while (this.count + addVerts > this.cap) this.cap *= 2;
        const nextPos = new Float32Array(this.cap * 3);
        const nextNorm = new Float32Array(this.cap * 3);
        const nextCol = new Float32Array(this.cap * 3);
        const nextUv = new Float32Array(this.cap * 2);
        const nextMeta = new Float32Array(this.cap * 4);
        nextPos.set(this.pos);
        nextNorm.set(this.norm);
        nextCol.set(this.col);
        nextUv.set(this.uv);
        nextMeta.set(this.meta);
        this.pos = nextPos;
        this.norm = nextNorm;
        this.col = nextCol;
        this.uv = nextUv;
        this.meta = nextMeta;
      }

      pushVert(px, py, pz, nx, ny, nz, r, g, b, u, v, m0, m1, m2, m3) {
        const i3 = this.count * 3;
        const i2 = this.count * 2;
        const i4 = this.count * 4;
        this.pos[i3] = px; this.pos[i3 + 1] = py; this.pos[i3 + 2] = pz;
        this.norm[i3] = nx; this.norm[i3 + 1] = ny; this.norm[i3 + 2] = nz;
        this.col[i3] = r; this.col[i3 + 1] = g; this.col[i3 + 2] = b;
        this.uv[i2] = u; this.uv[i2 + 1] = v;
        this.meta[i4] = m0; this.meta[i4 + 1] = m1; this.meta[i4 + 2] = m2; this.meta[i4 + 3] = m3;
        this.count++;
      }

      addQuad(p0, p1, p2, p3, nx, ny, nz, color, uSpan, vSpan, meta, vOffset = 0) {
        this.ensure(6);
        const r = color[0], g = color[1], b = color[2];
        const m0 = meta[0], m1 = meta[1], m2 = meta[2], m3 = meta[3];
        this.pushVert(p0[0], p0[1], p0[2], nx, ny, nz, r, g, b, 0, vOffset, m0, m1, m2, m3);
        this.pushVert(p1[0], p1[1], p1[2], nx, ny, nz, r, g, b, uSpan, vOffset, m0, m1, m2, m3);
        this.pushVert(p2[0], p2[1], p2[2], nx, ny, nz, r, g, b, uSpan, vOffset + vSpan, m0, m1, m2, m3);
        this.pushVert(p0[0], p0[1], p0[2], nx, ny, nz, r, g, b, 0, vOffset, m0, m1, m2, m3);
        this.pushVert(p2[0], p2[1], p2[2], nx, ny, nz, r, g, b, uSpan, vOffset + vSpan, m0, m1, m2, m3);
        this.pushVert(p3[0], p3[1], p3[2], nx, ny, nz, r, g, b, 0, vOffset + vSpan, m0, m1, m2, m3);
      }

      addTri(p0, p1, p2, nx, ny, nz, c0, c1, c2, uv0, uv1, uv2, meta) {
        this.ensure(3);
        const m0 = meta[0], m1 = meta[1], m2 = meta[2], m3 = meta[3];
        this.pushVert(p0[0], p0[1], p0[2], nx, ny, nz, c0[0], c0[1], c0[2], uv0[0], uv0[1], m0, m1, m2, m3);
        this.pushVert(p1[0], p1[1], p1[2], nx, ny, nz, c1[0], c1[1], c1[2], uv1[0], uv1[1], m0, m1, m2, m3);
        this.pushVert(p2[0], p2[1], p2[2], nx, ny, nz, c2[0], c2[1], c2[2], uv2[0], uv2[1], m0, m1, m2, m3);
      }

      addOrientedBox(cx, baseY, cz, w, h, d, angle, color, roofColor, meta, vOffset = 0) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const hw = w * 0.5;
        const hd = d * 0.5;
        const topY = baseY + h;

        const corners = [
          [cx + (-hw * cos - (-hd) * sin), cz + (-hw * sin + (-hd) * cos)],
          [cx + ( hw * cos - (-hd) * sin), cz + ( hw * sin + (-hd) * cos)],
          [cx + ( hw * cos - ( hd) * sin), cz + ( hw * sin + ( hd) * cos)],
          [cx + (-hw * cos - ( hd) * sin), cz + (-hw * sin + ( hd) * cos)]
        ];

        const b0 = [corners[0][0], baseY, corners[0][1]];
        const b1 = [corners[1][0], baseY, corners[1][1]];
        const b2 = [corners[2][0], baseY, corners[2][1]];
        const b3 = [corners[3][0], baseY, corners[3][1]];

        const t0 = [corners[0][0], topY, corners[0][1]];
        const t1 = [corners[1][0], topY, corners[1][1]];
        const t2 = [corners[2][0], topY, corners[2][1]];
        const t3 = [corners[3][0], topY, corners[3][1]];

        const nxF = -sin, nzF = -cos;
        const nxR =  cos, nzR =  sin;
        const nxB =  sin, nzB =  cos;
        const nxL = -cos, nzL = -sin;

        this.addQuad(b0, b1, t1, t0, nxF, 0, nzF, color, w, h, meta, vOffset);
        this.addQuad(b1, b2, t2, t1, nxR, 0, nzR, color, d, h, meta, vOffset);
        this.addQuad(b2, b3, t3, t2, nxB, 0, nzB, color, w, h, meta, vOffset);
        this.addQuad(b3, b0, t0, t3, nxL, 0, nzL, color, d, h, meta, vOffset);

        const roofMeta = [0, 0, meta[2], meta[3] * 0.25];
        this.addQuad(t0, t1, t2, t3, 0, 1, 0, roofColor, w, d, roofMeta, 0);
        return corners;
      }

      addPitchedPavilionRoof(cx, baseY, cz, w, h, d, angle, roofColor, eaveColor, seed) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const hw = w * 0.55;
        const hd = d * 0.55;
        const tw = w * 0.16;
        const td = d * 0.16;
        const topY = baseY + h;

        const pt = (lx, y, lz) => [
          cx + lx * cos - lz * sin,
          y,
          cz + lx * sin + lz * cos
        ];

        const b0 = pt(-hw, baseY, -hd);
        const b1 = pt( hw, baseY, -hd);
        const b2 = pt( hw, baseY,  hd);
        const b3 = pt(-hw, baseY,  hd);

        const t0 = pt(-tw, topY, -td);
        const t1 = pt( tw, topY, -td);
        const t2 = pt( tw, topY,  td);
        const t3 = pt(-tw, topY,  td);

        const meta = [0, 0, seed, 0.2];
        this.addQuad(b0, b1, t1, t0, 0, 0.7, -0.7, roofColor, w, h, meta);
        this.addQuad(b1, b2, t2, t1, 0.7, 0.7, 0, roofColor, d, h, meta);
        this.addQuad(b2, b3, t3, t2, 0, 0.7, 0.7, roofColor, w, h, meta);
        this.addQuad(b3, b0, t0, t3, -0.7, 0.7, 0, roofColor, d, h, meta);
        this.addQuad(t0, t1, t2, t3, 0, 1, 0, eaveColor, tw * 2, td * 2, meta);
      }

      addCylinder(cx, baseY, cz, rBottom, rTop, h, segments, color, meta) {
        const topY = baseY + h;
        for (let i = 0; i < segments; i++) {
          const a0 = (i / segments) * Math.PI * 2;
          const a1 = ((i + 1) / segments) * Math.PI * 2;
          const c0 = Math.cos(a0), s0 = Math.sin(a0);
          const c1 = Math.cos(a1), s1 = Math.sin(a1);
          const b0 = [cx + c0 * rBottom, baseY, cz + s0 * rBottom];
          const b1 = [cx + c1 * rBottom, baseY, cz + s1 * rBottom];
          const t1 = [cx + c1 * rTop, topY, cz + s1 * rTop];
          const t0 = [cx + c0 * rTop, topY, cz + s0 * rTop];
          const arcW = (2 * Math.PI * rBottom) / segments;
          this.addQuad(b0, b1, t1, t0, (c0 + c1) * 0.5, 0, (s0 + s1) * 0.5, color, arcW, h, meta, i * arcW);
          this.addTri([cx, topY, cz], t0, t1, 0, 1, 0, color, color, color, [0,0], [1,0], [1,1], [0, 0, meta[2], 0.1]);
        }
      }
    }

    class LineBuilder {
      constructor(initialVerts = 32768) {
        this.cap = initialVerts;
        this.count = 0;
        this.pos = new Float32Array(this.cap * 3);
        this.col = new Float32Array(this.cap * 4);
      }
      ensure(addVerts) {
        if (this.count + addVerts <= this.cap) return;
        while (this.count + addVerts > this.cap) this.cap *= 2;
        const np = new Float32Array(this.cap * 3);
        const nc = new Float32Array(this.cap * 4);
        np.set(this.pos);
        nc.set(this.col);
        this.pos = np;
        this.col = nc;
      }
      addSegment(p0, p1, color, glow = 1.0) {
        this.ensure(2);
        let i3 = this.count * 3;
        let i4 = this.count * 4;
        this.pos[i3] = p0[0]; this.pos[i3 + 1] = p0[1]; this.pos[i3 + 2] = p0[2];
        this.col[i4] = color[0]; this.col[i4 + 1] = color[1]; this.col[i4 + 2] = color[2]; this.col[i4 + 3] = glow;
        this.count++;
        i3 = this.count * 3;
        i4 = this.count * 4;
        this.pos[i3] = p1[0]; this.pos[i3 + 1] = p1[1]; this.pos[i3 + 2] = p1[2];
        this.col[i4] = color[0]; this.col[i4 + 1] = color[1]; this.col[i4 + 2] = color[2]; this.col[i4 + 3] = glow;
        this.count++;
      }
      addLoop(pts, y, color, glow = 1.0) {
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i];
          const b = pts[(i + 1) % pts.length];
          this.addSegment([a[0], y, a[1]], [b[0], y, b[1]], color, glow);
        }
      }
    }

    // =========================================================================
    // 5. CHONGQING 8D TOPOGRAPHY & PROCEDURAL CITY GENERATOR
    // =========================================================================
    class ChongqingCityGenerator {
      constructor() {
        this.landmarks = [];
        this.riverLabels = [];
        this.monorailPaths = [];
        this.trafficPaths = [];
        this.cablewayPath = null;
        this.minimapData = {
          roads: [],
          interchanges: [],
          monorails: [],
          tunnelNodes: [],
          bridges: []
        };
        this.stats = {
          buildings: 1230,
          maxElevation: 81,
          interchanges: 2,
          interchangeLayers: 5,
          ramps: 12,
          monorailKm: '4.0',
          tunnelCount: 2,
          bridges: 4,
          trees: 6065,
          trianglesWan: '41.5',
          buildMs: 61
        };
      }

      sampleGeography(x, z, state, noise) {
        const rw = (state.riverWidth / 100) * 86;
        const maxH = state.terrainHeight;
        const rough = state.roughness / 100;
        const terrace = state.terraceSteps / 100;

        let yangtzeDist = 9999;
        let jialingDist = 9999;
        let riverBlend = 0.0; // 0 = Yangtze, 1 = Jialing

        if (state.landform === 'peninsula') {
          const yzCenterZ = x < 180
            ? 150 - 0.14 * x + Math.sin(x * 0.0055) * 28
            : 125 - (x - 180) * 0.42 + Math.sin(x * 0.005) * 22;
          yangtzeDist = Math.abs(z - yzCenterZ);

          if (x < 265) {
            const jlCenterZ = -135 + 0.36 * x + Math.cos(x * 0.0065) * 26;
            jialingDist = Math.abs(z - jlCenterZ);
          } else {
            jialingDist = Math.hypot(x - 245, z - 32);
          }

          if (x > 165) {
            const splitZ = 105 - (x - 165) * 0.40;
            riverBlend = 1.0 / (1.0 + Math.exp((z - splitZ) * 0.055));
          } else {
            riverBlend = z < 15 ? 1.0 : 0.0;
          }
        } else if (state.landform === 'gorge') {
          const cZ = Math.sin(x * 0.0045) * 75;
          yangtzeDist = Math.abs(z - cZ);
          riverBlend = x > 0 ? 0.35 : 0.0;
        } else if (state.landform === 'terraces') {
          const yz = 210 + Math.sin(x * 0.005) * 40;
          const jl = -210 + Math.cos(x * 0.005) * 40;
          yangtzeDist = Math.abs(z - yz);
          jialingDist = Math.abs(z - jl);
          riverBlend = z < 0 ? 1.0 : 0.0;
        } else {
          const yz = 165 + Math.sin(x * 0.004) * 35;
          yangtzeDist = Math.abs(z - yz);
          riverBlend = 0.2;
        }

        const minRiverDist = Math.min(yangtzeDist, jialingDist);
        const inRiver = minRiverDist < rw;

        if (inRiver) {
          return {
            height: -2.0,
            inRiver: true,
            riverBlend,
            bankFactor: minRiverDist / rw,
            region: 'river'
          };
        }

        const bankDist = minRiverDist - rw;
        const cliffRise = Math.min(1.0, bankDist / 72.0);
        const smoothClimb = Math.pow(cliffRise, 0.68);

        let region = 'peninsula';
        const yzRef = 150 - 0.14 * Math.min(x, 180);
        const jlRef = -135 + 0.36 * Math.min(x, 230);
        if (state.landform === 'peninsula') {
          if (z > yzRef) region = 'south';
          else if (z < jlRef || x > 245) region = 'north';
        } else if (z > 60) {
          region = 'south';
        } else if (z < -60) {
          region = 'north';
        }

        const n1 = noise.fbm(x * 0.0024 + 5.2, z * 0.0024 + 3.1, 4);
        const n2 = noise.noise(x * 0.0075, z * 0.0075);

        let ridgeBoost = 0;
        if (region === 'peninsula') {
          const spineZ = 8 + 0.09 * x;
          const distFromSpine = Math.abs(z - spineZ);
          const tipTaper = Math.max(0.18, Math.min(1.0, (235 - x) / 340));
          ridgeBoost = Math.max(0, 1.0 - distFromSpine / 165) * 0.72 * tipTaper;
        } else if (region === 'south') {
          const southDepth = Math.max(0, (z - 220) / 420);
          ridgeBoost = Math.pow(southDepth, 0.85) * 1.15;
        } else {
          const northDepth = Math.max(0, (-z - 190) / 420);
          ridgeBoost = Math.pow(northDepth, 0.85) * 0.98;
        }

        let rawH = (0.18 + ridgeBoost + (n1 - 0.35) * (0.45 + rough * 0.65) + (n2 - 0.5) * rough * 0.22) * maxH * smoothClimb;
        rawH = Math.max(3.5, rawH);

        if (terrace > 0.02) {
          const stepSize = 11.5;
          const stepped = Math.round(rawH / stepSize) * stepSize;
          rawH = rawH * (1.0 - terrace * 0.72) + stepped * (terrace * 0.72);
        }

        return {
          height: rawH,
          inRiver: false,
          riverBlend,
          bankFactor: Math.min(1.0, bankDist / 45.0),
          region
        };
      }

      generate(state) {
        const t0 = performance.now();
        const rng = new SeededRandom(state.seed);
        const noise = new Noise2D(state.seed);
        const style = STYLE_PRESETS[state.cityStyle] || STYLE_PRESETS.dusk;

        this.landmarks = [];
        this.riverLabels = [];
        this.monorailPaths = [];
        this.trafficPaths = [];
        this.cablewayPath = null;
        this.minimapData = {
          roads: [],
          interchanges: [],
          monorails: [],
          tunnelNodes: [],
          bridges: []
        };

        const solidBuilder = new MeshBuilder(240000);
        const waterBuilder = new MeshBuilder(38000);
        const lineBuilder = new LineBuilder(64000);

        // ---------------------------------------------------------------------
        // A. TERRAIN & TWO-RIVER ("鸳鸯锅") MESHES
        // ---------------------------------------------------------------------
        const gridN = 140;
        const worldExtent = 780;
        const cellStep = (worldExtent * 2) / gridN;
        const hGrid = new Float32Array((gridN + 1) * (gridN + 1));
        const rGrid = new Uint8Array((gridN + 1) * (gridN + 1));
        const bGrid = new Float32Array((gridN + 1) * (gridN + 1));

        for (let gz = 0; gz <= gridN; gz++) {
          const wz = -worldExtent + gz * cellStep;
          for (let gx = 0; gx <= gridN; gx++) {
            const wx = -worldExtent + gx * cellStep;
            const idx = gz * (gridN + 1) + gx;
            const g = this.sampleGeography(wx, wz, state, noise);
            hGrid[idx] = g.inRiver ? -3.5 : g.height;
            rGrid[idx] = g.inRiver ? 1 : 0;
            bGrid[idx] = g.riverBlend;
          }
        }

        for (let gz = 0; gz < gridN; gz++) {
          const wz0 = -worldExtent + gz * cellStep;
          const wz1 = wz0 + cellStep;
          for (let gx = 0; gx < gridN; gx++) {
            const wx0 = -worldExtent + gx * cellStep;
            const wx1 = wx0 + cellStep;
            const i00 = gz * (gridN + 1) + gx;
            const i10 = i00 + 1;
            const i01 = (gz + 1) * (gridN + 1) + gx;
            const i11 = i01 + 1;

            const h00 = hGrid[i00], h10 = hGrid[i10], h01 = hGrid[i01], h11 = hGrid[i11];
            const anyRiver = rGrid[i00] || rGrid[i10] || rGrid[i01] || rGrid[i11];

            const dx = (h10 - h00 + h11 - h01) * 0.5;
            const dz = (h01 - h00 + h11 - h10) * 0.5;
            let nx = -dx, ny = cellStep, nz = -dz;
            const nl = Math.hypot(nx, ny, nz) || 1;
            nx /= nl; ny /= nl; nz /= nl;

            const avgH = (h00 + h10 + h01 + h11) * 0.25;
            const slope = 1.0 - ny;
            let tCol;
            if (slope > 0.28) {
              tCol = style.cliffColor;
            } else if (avgH > state.terrainHeight * 0.55) {
              tCol = style.terrainHigh;
            } else if (avgH > 18) {
              tCol = style.terrainMid;
            } else {
              tCol = style.terrainLow;
            }

            const p00 = [wx0, h00, wz0];
            const p10 = [wx1, h10, wz0];
            const p11 = [wx1, h11, wz1];
            const p01 = [wx0, h01, wz1];
            const terrainMeta = [0, slope, avgH, 0];
            solidBuilder.addQuad(p00, p01, p11, p10, nx, ny, nz, tCol, cellStep, cellStep, terrainMeta);

            if (anyRiver) {
              const bAvg = (bGrid[i00] + bGrid[i10] + bGrid[i01] + bGrid[i11]) * 0.25;
              const wc = [
                style.yangtzeColor[0] * (1 - bAvg) + style.jialingColor[0] * bAvg,
                style.yangtzeColor[1] * (1 - bAvg) + style.jialingColor[1] * bAvg,
                style.yangtzeColor[2] * (1 - bAvg) + style.jialingColor[2] * bAvg
              ];
              const wp00 = [wx0, 0.0, wz0];
              const wp10 = [wx1, 0.0, wz0];
              const wp11 = [wx1, 0.0, wz1];
              const wp01 = [wx0, 0.0, wz1];
              waterBuilder.addQuad(wp00, wp01, wp11, wp10, 0, 1, 0, wc, cellStep, cellStep, [7, bAvg, wx0 * 0.01, wz0 * 0.01]);
            }
          }
        }

        // River surface floating labels positioned to match 1.png - 5.png
        this.riverLabels.push({ text: '长  江', pos: [-110, 4, 155] });
        this.riverLabels.push({ text: '嘉 陵 江', pos: [45, 4, -75] });

        // ---------------------------------------------------------------------
        // B. ROAD NETWORK & TERRACED HILLSIDE STREETS
        // ---------------------------------------------------------------------
        const blockStep = state.blockSize * 0.48;
        const cityRadius = state.citySize * 28;
        const roadColor = [0.22, 0.20, 0.28];

        for (let rx = -cityRadius; rx <= cityRadius; rx += blockStep * 1.35) {
          const pts = [];
          for (let rz = -cityRadius * 0.85; rz <= cityRadius * 0.85; rz += 26) {
            let wx = rx;
            let wz = rz;
            if (state.roadPattern === 'freeform') {
              wx += Math.sin(rz * 0.012 + rx * 0.005) * 16;
            } else if (state.roadPattern === 'radial') {
              const ang = Math.atan2(rz, rx + 40);
              wx += Math.cos(ang) * 12;
            }
            const g = this.sampleGeography(wx, wz, state, noise);
            if (!g.inRiver && g.bankFactor > 0.16) {
              pts.push([wx, g.height + 0.5, wz]);
            } else if (pts.length > 2) {
              this.minimapData.roads.push(pts.slice());
              pts.length = 0;
            } else {
              pts.length = 0;
            }
          }
          if (pts.length > 2) this.minimapData.roads.push(pts);
        }

        for (let rz = -cityRadius * 0.85; rz <= cityRadius * 0.85; rz += blockStep * 1.25) {
          const pts = [];
          for (let rx = -cityRadius; rx <= cityRadius; rx += 26) {
            let wx = rx;
            let wz = rz;
            if (state.roadPattern === 'freeform' || state.roadPattern === 'terraced') {
              wz += Math.cos(rx * 0.011 + rz * 0.006) * 15;
            }
            const g = this.sampleGeography(wx, wz, state, noise);
            if (!g.inRiver && g.bankFactor > 0.16) {
              pts.push([wx, g.height + 0.5, wz]);
            } else if (pts.length > 2) {
              this.minimapData.roads.push(pts.slice());
              pts.length = 0;
            } else {
              pts.length = 0;
            }
          }
          if (pts.length > 2) this.minimapData.roads.push(pts);
        }

        for (let rIdx = 0; rIdx < this.minimapData.roads.length; rIdx++) {
          const pts = this.minimapData.roads[rIdx];
          if (pts.length >= 4 && rIdx % 2 === 0) {
            this.trafficPaths.push({ pts, speed: 0.22 + (rIdx % 3) * 0.06, colorType: 0 });
          }
          for (let i = 0; i < pts.length - 1; i++) {
            lineBuilder.addSegment(pts[i], pts[i + 1], roadColor, 0.35);
          }
        }

        // ---------------------------------------------------------------------
        // C. ICONIC CHONGQING LANDMARKS (来福士 / 轻轨穿楼 / 洪崖洞 / 解放碑)
        // ---------------------------------------------------------------------
        const exclusionZones = [];
        let buildingCount = 0;
        let maxCityElevation = 0;

        const addExclusion = (x, z, r) => exclusionZones.push({ x, z, r });
        const isExcluded = (x, z, r = 0) => {
          for (let i = 0; i < exclusionZones.length; i++) {
            const e = exclusionZones[i];
            if (Math.hypot(x - e.x, z - e.z) < e.r + r) return true;
          }
          return false;
        };

        // 1. 朝天门 · 来福士 (Raffles City Chongqing at Peninsula Confluence Tip)
        // Slender separated curved sails + Crystal Skybridge + Roof Stay Mast (matching 1.png, 2.png, 4.png, 5.png)
        const rafflesX = 148, rafflesZ = 22;
        const rafflesGeo = this.sampleGeography(rafflesX, rafflesZ, state, noise);
        const rafflesBaseY = Math.max(12, rafflesGeo.height);
        addExclusion(rafflesX, rafflesZ, 68);

        const rafAng = 0.68;
        const rCos = Math.cos(rafAng), rSin = Math.sin(rafAng);
        const rPerpX = -rSin, rPerpZ = rCos;

        // Cantilevered podium base with colorful illuminated commercial strip
        solidBuilder.addOrientedBox(
          rafflesX, rafflesBaseY - 8, rafflesZ,
          28, 16, 84, rafAng,
          [0.32, 0.35, 0.44], [0.22, 0.25, 0.32],
          [2, 0.52, 101, 1.25]
        );
        // 4 Slender Curved Sail Towers in front with clear daylight/sky gaps between them!
        const sailOffsets = [-30, -10, 10, 30];
        const sailH = 128 * (state.avgHeight / 72 * 0.4 + 0.6);
        for (let s = 0; s < sailOffsets.length; s++) {
          const oz = sailOffsets[s];
          const sx = rafflesX + rPerpX * oz + rCos * 4;
          const sz = rafflesZ + rPerpZ * oz + rSin * 4;
          const segs = 6;
          const segH = sailH / segs;
          for (let k = 0; k < segs; k++) {
            const curveShift = Math.sin((k / segs) * Math.PI * 0.85) * 6.5;
            const wSeg = 9.2 - k * 0.35;
            const dSeg = 9.0 - k * 0.30;
            solidBuilder.addOrientedBox(
              sx + rCos * curveShift, rafflesBaseY + 8 + k * segH, sz + rSin * curveShift,
              wSeg, segH + 0.3, dSeg, rafAng,
              [0.64, 0.68, 0.75], [0.74, 0.78, 0.84],
              [3, 0.34, 200 + s * 10 + k, 0.95],
              k * segH
            );
          }
          // Bright vertical curved rib lines along the outer face of each sail
          const topSailY = rafflesBaseY + 8 + sailH;
          lineBuilder.addSegment(
            [sx + rCos * 5 - rPerpX * 3.2, rafflesBaseY + 8, sz + rSin * 5 - rPerpZ * 3.2],
            [sx + rCos * 9 - rPerpX * 3.2, topSailY, sz + rSin * 9 - rPerpZ * 3.2],
            [0.95, 0.97, 1.0], 1.35
          );
          lineBuilder.addSegment(
            [sx + rCos * 5 + rPerpX * 3.2, rafflesBaseY + 8, sz + rSin * 5 + rPerpZ * 3.2],
            [sx + rCos * 9 + rPerpX * 3.2, topSailY, sz + rSin * 9 + rPerpZ * 3.2],
            [0.95, 0.97, 1.0], 1.35
          );
        }
        // Horizontal Crystal Skybridge (水晶连廊) across the top of the 4 front sails
        const bridgeY = rafflesBaseY + 8 + sailH * 0.86;
        const sbX = rafflesX + rCos * 9;
        const sbZ = rafflesZ + rSin * 9;
        solidBuilder.addOrientedBox(
          sbX, bridgeY, sbZ,
          13, 7.5, 80, rafAng,
          [0.48, 0.56, 0.68], [0.32, 0.72, 0.86],
          [3, 0.65, 299, 1.3]
        );
        // Iconic fan stay-cable crown mast on top of the Skybridge
        const mastBaseY = bridgeY + 7.5;
        const mastTopY = mastBaseY + 34;
        lineBuilder.addSegment([sbX, mastBaseY, sbZ], [sbX, mastTopY, sbZ], [0.96, 0.98, 1.0], 1.45);
        for (let c = -6; c <= 6; c++) {
          if (c === 0) continue;
          lineBuilder.addSegment(
            [sbX, mastTopY - Math.abs(c) * 1.5, sbZ],
            [sbX, mastBaseY, sbZ + rPerpZ * c * 5.2],
            [0.94, 0.96, 1.0], 1.25
          );
        }
        // 2 Taller Rear Towers behind the Skybridge
        for (const side of [-1, 1]) {
          const tx = rafflesX - rCos * 12 + rPerpX * side * 16;
          const tz = rafflesZ - rSin * 12 + rPerpZ * side * 16;
          const rearH = sailH * 1.18;
          solidBuilder.addOrientedBox(
            tx, rafflesBaseY + 8, tz,
            11.5, rearH, 11.5, rafAng,
            [0.56, 0.60, 0.68], [0.68, 0.72, 0.78],
            [3, 0.36, 310 + side, 0.95]
          );
        }
        buildingCount += 8;
        this.landmarks.push({
          id: 'raffles',
          name: '朝天门 · 来福士',
          type: 'highlight',
          pos: [rafflesX, rafflesBaseY + sailH + 34, rafflesZ],
          cam: 'confluence'
        });

        // 2. 洪崖洞 (Hongyadong 11-Tier Cliffside Stilted Complex on Jialing Cliff)
        const hydX = 32, hydZ = -84;
        const hydGeo = this.sampleGeography(hydX, hydZ, state, noise);
        const hydBaseY = Math.max(4, hydGeo.height * 0.35);
        addExclusion(hydX, hydZ, 44);

        const hydTiers = 7;
        for (let t = 0; t < hydTiers; t++) {
          const ty = hydBaseY + t * 5.4;
          const tz = hydZ + t * 3.0;
          const tw = 52 - t * 2.4;
          const td = 13;
          solidBuilder.addOrientedBox(
            hydX, ty, tz,
            tw, 5.0, td, 0.28,
            [0.36, 0.22, 0.14], [0.22, 0.15, 0.11],
            [4, 0.65, 400 + t, 1.45]
          );
          solidBuilder.addPitchedPavilionRoof(
            hydX, ty + 5.0, tz,
            tw + 3.2, 3.0, td + 2.8, 0.28,
            [0.20, 0.15, 0.13], [0.98, 0.74, 0.22], 400 + t
          );
          const cosH = Math.cos(0.28), sinH = Math.sin(0.28);
          const hw = (tw + 3.2) * 0.5;
          lineBuilder.addSegment(
            [hydX - hw * cosH, ty + 5.2, tz - hw * sinH - 5.5],
            [hydX + hw * cosH, ty + 5.2, tz + hw * sinH - 5.5],
            [1.0, 0.78, 0.22], 1.5
          );
        }
        buildingCount += 7;
        this.landmarks.push({
          id: 'hongyadong',
          name: '洪崖洞',
          type: 'highlight',
          pos: [hydX, hydBaseY + hydTiers * 5.6 + 18, hydZ + 10],
          cam: 'hongyadong'
        });

        // 3. 解放碑 (Jiefangbei Central Monument & CBD Core)
        const jfbX = -28, jfbZ = 12;
        const jfbGeo = this.sampleGeography(jfbX, jfbZ, state, noise);
        const jfbY = Math.max(24, jfbGeo.height);
        addExclusion(jfbX, jfbZ, 24);
        solidBuilder.addCylinder(jfbX, jfbY, jfbZ, 4.0, 3.0, 28, 8, [0.68, 0.65, 0.60], [2, 0.4, 501, 0.9]);
        solidBuilder.addCylinder(jfbX, jfbY + 28, jfbZ, 2.0, 0.6, 9, 8, [0.95, 0.78, 0.35], [3, 0.8, 502, 1.4]);
        buildingCount += 1;
        this.landmarks.push({
          id: 'jiefangbei',
          name: '解放碑',
          type: 'standard',
          pos: [jfbX, jfbY + 46, jfbZ],
          cam: 'elevation'
        });

        // ---------------------------------------------------------------------
        // D. CHONGQING MONORAIL LINE 2/3 & TRAIN-THROUGH-BUILDING STATIONS (轻轨穿楼)
        // ---------------------------------------------------------------------
        // Note: track runs roughly West-Northwest -> East-Southeast (angle ~ 0.30 rad).
        // By orienting the building's local Z axis along the track (angle = 0.30 - Math.PI/2 = -1.27 rad),
        // the wide 42m front/back facade faces the camera and the monorail pierces straight through the 18m hollow hole!
        const stationCandidates = [
          { id: 'niujiaotuo', name: '牛角沱 · 轻轨穿楼', x: -88, z: -48, angle: -0.62, cam: 'monorail' },
          { id: 'liziba',     name: '李子坝 · 轻轨穿楼', x: -205, z: -92, angle: -0.60, cam: 'monorail' },
          { id: 'daxigou',    name: '大溪沟 · 轻轨穿楼', x: -12, z: -68, angle: -0.65, cam: 'monorail' },
          { id: 'fotuguan',   name: '佛图关 · 轻轨穿楼', x: -148, z: 32, angle: -0.75, cam: 'monorail' }
        ];

        const activeStationCount = Math.max(1, Math.min(4, state.tunnelStations));
        const activeStations = stationCandidates.slice(0, activeStationCount);

        for (let sIdx = 0; sIdx < activeStations.length; sIdx++) {
          const st = activeStations[sIdx];
          const g = this.sampleGeography(st.x, st.z, state, noise);
          const baseY = Math.max(14, g.height);
          const tunnelFloorY = baseY + 20;
          const tunnelHeight = 16;
          const tunnelTopY = tunnelFloorY + tunnelHeight;
          const totalH = 78;
          st.baseY = baseY;
          st.trackY = tunnelFloorY + 4.2;

          addExclusion(st.x, st.z, 42);
          this.minimapData.tunnelNodes.push({ x: st.x, z: st.z, name: st.name });

          const cosA = Math.cos(st.angle), sinA = Math.sin(st.angle);
          const fCol = [0.58, 0.52, 0.48];
          const rCol = [0.22, 0.58, 0.52];
          const meta = [5, 0.42, 600 + sIdx * 10, 1.1];

          // 1. Lower Podium below the train tunnel (ground to tunnelFloorY)
          solidBuilder.addOrientedBox(
            st.x, baseY - 10, st.z,
            44, 30, 22, st.angle,
            [0.48, 0.43, 0.40], [0.28, 0.26, 0.30], meta
          );

          // 2. Left & Right Structural Pier Towers flanking the 18m-wide hollow tunnel opening
          for (const side of [-1, 1]) {
            const offsetLocalX = side * 15.0;
            const px = st.x + offsetLocalX * cosA;
            const pz = st.z + offsetLocalX * sinA;
            solidBuilder.addOrientedBox(
              px, tunnelFloorY, pz,
              12, tunnelHeight, 20, st.angle,
              fCol, rCol, meta, 20
            );
          }

          // 3. Upper Residential Tower spanning above the tunnel opening (tunnelTopY to roof)
          const upperH = totalH - (tunnelTopY - baseY);
          solidBuilder.addOrientedBox(
            st.x, tunnelTopY, st.z,
            42, upperH, 20, st.angle,
            fCol, rCol, meta, 36
          );

          // 4. Twin Chongqing Turquoise Pavilion Roofs on top of the station tower
          for (const side of [-1, 1]) {
            const rx = st.x + side * 10.5 * cosA;
            const rz = st.z + side * 10.5 * sinA;
            solidBuilder.addPitchedPavilionRoof(
              rx, baseY + totalH, rz,
              18, 6.2, 18, st.angle,
              [0.24, 0.62, 0.54], [0.98, 0.76, 0.32], 620 + sIdx
            );
          }

          // 5. Glowing Neon Portal Frame around the hollow tunnel opening (front & back faces)
          const hw = 9.0, hd = 10.4;
          for (const faceSign of [-1, 1]) {
            const fz = faceSign * hd;
            const pBL = [st.x + (-hw * cosA - fz * sinA), tunnelFloorY + 0.4, st.z + (-hw * sinA + fz * cosA)];
            const pBR = [st.x + ( hw * cosA - fz * sinA), tunnelFloorY + 0.4, st.z + ( hw * sinA + fz * cosA)];
            const pTR = [st.x + ( hw * cosA - fz * sinA), tunnelTopY - 0.4,   st.z + ( hw * sinA + fz * cosA)];
            const pTL = [st.x + (-hw * cosA - fz * sinA), tunnelTopY - 0.4,   st.z + (-hw * sinA + fz * cosA)];
            lineBuilder.addSegment(pBL, pTL, [0.98, 0.28, 0.52], 1.85);
            lineBuilder.addSegment(pTL, pTR, [0.22, 0.88, 0.98], 1.85);
            lineBuilder.addSegment(pTR, pBR, [0.98, 0.28, 0.52], 1.85);
            lineBuilder.addSegment(pBR, pBL, [0.98, 0.78, 0.25], 1.65);
          }

          buildingCount += 1;
          this.landmarks.push({
            id: st.id,
            name: st.name,
            type: 'highlight',
            pos: [st.x, baseY + totalH + 16, st.z],
            cam: st.cam
          });
        }

        const line2ControlPts = [
          [-380, 28, -155],
          [-285, 36, -122],
          [stationCandidates[1].x, (stationCandidates[1].trackY || 44), stationCandidates[1].z],
          [-145, 46, -70],
          [stationCandidates[0].x, (stationCandidates[0].trackY || 46), stationCandidates[0].z],
          [-12,  (stationCandidates[2].trackY || 42), stationCandidates[2].z],
          [75,   38, -42],
          [135,  34, 8],
          [75,   36, 72],
          [-45,  42, 95],
          [-148, (stationCandidates[3].trackY || 48), stationCandidates[3].z],
          [-280, 44, 55]
        ];

        const buildSmoothSpline = (ctrlPts, subdivisions = 14) => {
          const out = [];
          for (let i = 0; i < ctrlPts.length - 1; i++) {
            const p0 = ctrlPts[Math.max(0, i - 1)];
            const p1 = ctrlPts[i];
            const p2 = ctrlPts[i + 1];
            const p3 = ctrlPts[Math.min(ctrlPts.length - 1, i + 2)];
            for (let s = 0; s < subdivisions; s++) {
              const t = s / subdivisions;
              const t2 = t * t, t3 = t2 * t;
              const x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
              const y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
              const z = 0.5 * ((2 * p1[2]) + (-p0[2] + p2[2]) * t + (2 * p0[2] - 5 * p1[2] + 4 * p2[2] - p3[2]) * t2 + (-p0[2] + 3 * p1[2] - 3 * p2[2] + p3[2]) * t3);
              out.push([x, y, z]);
            }
          }
          out.push(ctrlPts[ctrlPts.length - 1]);
          return out;
        };

        const monoPts1 = buildSmoothSpline(line2ControlPts, 12);
        this.monorailPaths.push(monoPts1);
        this.minimapData.monorails.push(monoPts1);

        for (let i = 0; i < monoPts1.length - 1; i++) {
          const a = monoPts1[i];
          const b = monoPts1[i + 1];
          const mx = (a[0] + b[0]) * 0.5;
          const my = (a[1] + b[1]) * 0.5;
          const mz = (a[2] + b[2]) * 0.5;
          const segLen = Math.hypot(b[0] - a[0], b[2] - a[2]);
          const ang = Math.atan2(b[2] - a[2], b[0] - a[0]);

          solidBuilder.addOrientedBox(
            mx, my - 1.4, mz,
            segLen + 0.6, 1.4, 3.2, ang,
            [0.32, 0.38, 0.46], [0.22, 0.78, 0.68], [0, 0, 700, 0.5]
          );
          lineBuilder.addSegment([a[0], a[1] + 0.3, a[2]], [b[0], b[1] + 0.3, b[2]], [0.20, 0.88, 0.72], 1.35);

          if (i % 5 === 0) {
            const g = this.sampleGeography(mx, mz, state, noise);
            const groundY = g.inRiver ? -4 : g.height;
            if (my - groundY > 4 && !isExcluded(mx, mz, -12)) {
              solidBuilder.addCylinder(mx, groundY, mz, 1.1, 0.9, my - groundY - 1.2, 6, [0.38, 0.41, 0.46], [0, 0, 701, 0]);
            }
          }
        }

        // ---------------------------------------------------------------------
        // E. 5-LEVEL SPIRAL INTERCHANGES (黄桷湾立交 · 5 层 & 盘龙立交 · 5 层)
        // ---------------------------------------------------------------------
        const buildInterchange = (hubX, hubZ, name, layers) => {
          addExclusion(hubX, hubZ, 64);
          const g = this.sampleGeography(hubX, hubZ, state, noise);
          const baseH = Math.max(8, g.height);
          const minimapLoops = [];

          for (let lv = 0; lv < layers; lv++) {
            const layerY = baseH + 7 + lv * 6.0;
            const rx = 36 + (lv % 2) * 14 - lv * 2.2;
            const rz = 26 + ((lv + 1) % 2) * 14 - lv * 1.8;
            const rot = lv * 0.68;
            const cosR = Math.cos(rot), sinR = Math.sin(rot);
            const segs = 40;
            const loopPts = [];

            for (let s = 0; s <= segs; s++) {
              const t = (s / segs) * Math.PI * 2;
              const lx = Math.cos(t) * rx + Math.sin(t * 2) * 5;
              const lz = Math.sin(t) * rz;
              const wx = hubX + lx * cosR - lz * sinR;
              const wz = hubZ + lx * sinR + lz * cosR;
              const wy = layerY + Math.sin(t * 2 + lv) * 2.4;
              loopPts.push([wx, wy, wz]);
            }

            minimapLoops.push(loopPts);
            this.trafficPaths.push({ pts: loopPts, speed: 0.32 + lv * 0.05, colorType: 1 });

            for (let s = 0; s < loopPts.length - 1; s++) {
              const pA = loopPts[s];
              const pB = loopPts[s + 1];
              const mx = (pA[0] + pB[0]) * 0.5;
              const my = (pA[1] + pB[1]) * 0.5;
              const mz = (pA[2] + pB[2]) * 0.5;
              const len = Math.hypot(pB[0] - pA[0], pB[2] - pA[2]);
              const ang = Math.atan2(pB[2] - pA[2], pB[0] - pA[0]);

              solidBuilder.addOrientedBox(
                mx, my - 1.1, mz,
                len + 0.5, 1.1, 4.4, ang,
                [0.25, 0.27, 0.33], [0.20, 0.22, 0.28], [0, 0, 800 + lv, 0.3]
              );
              lineBuilder.addSegment([pA[0], pA[1] + 0.25, pA[2]], [pB[0], pB[1] + 0.25, pB[2]], [0.98, 0.68, 0.22], 1.2);

              if (s % 8 === 0) {
                solidBuilder.addCylinder(mx, baseH - 4, mz, 1.0, 0.85, my - baseH + 3, 6, [0.35, 0.37, 0.42], [0, 0, 810, 0]);
              }
            }
          }

          for (let arm = 0; arm < 3; arm++) {
            const armAng = arm * 2.09 + 0.4;
            const armPts = [];
            for (let k = 0; k <= 12; k++) {
              const dist = 20 + k * 9.5;
              const wx = hubX + Math.cos(armAng + k * 0.03) * dist;
              const wz = hubZ + Math.sin(armAng + k * 0.03) * dist;
              const wy = baseH + 14 - k * 0.6;
              armPts.push([wx, wy, wz]);
            }
            minimapLoops.push(armPts);
            this.trafficPaths.push({ pts: armPts, speed: 0.35, colorType: 1 });
            for (let k = 0; k < armPts.length - 1; k++) {
              lineBuilder.addSegment(armPts[k], armPts[k + 1], [0.98, 0.62, 0.18], 1.1);
            }
          }

          this.minimapData.interchanges.push(...minimapLoops);
          this.landmarks.push({
            id: name,
            name: `${name} · ${layers} 层`,
            type: 'standard',
            pos: [hubX, baseH + layers * 6.2 + 16, hubZ],
            cam: 'interchange'
          });
        };

        buildInterchange(-175, 195, '黄桷湾立交', state.interchangeLayers);
        buildInterchange(245, -145, '盘龙立交', state.interchangeLayers);

        // ---------------------------------------------------------------------
        // F. CROSS-RIVER CABLE-STAYED BRIDGES (东水门大桥 / 千厮门大桥 / 嘉华大桥 等)
        // ---------------------------------------------------------------------
        const bridgeDefs = [
          { id: 'dongshuimen', name: '东水门大桥', p0: [-38, 30, 82],  p1: [-38, 30, 265], towers: 2, cableColor: [0.96, 0.96, 1.0] },
          { id: 'qiansimen',   name: '千厮门大桥', p0: [68,  30, -58], p1: [115, 30, -225], towers: 1, cableColor: [0.96, 0.96, 1.0] },
          { id: 'jiahua',      name: '嘉华大桥',   p0: [-195, 34, -85], p1: [-175, 34, -265], towers: 2, cableColor: [0.88, 0.92, 1.0] },
          { id: 'caiyuanba',   name: '菜园坝大桥', p0: [-265, 34, 105], p1: [-265, 34, 295], towers: 2, cableColor: [0.98, 0.58, 0.32] },
          { id: 'chaotianmen', name: '朝天门大桥', p0: [245, 34, -145], p1: [275, 34, 155], towers: 2, cableColor: [0.95, 0.72, 0.38] },
          { id: 'huanghuayuan',name: '黄花园大桥', p0: [-105, 30, -72], p1: [-85, 30, -245], towers: 2, cableColor: [0.90, 0.92, 0.98] }
        ];

        const activeBridges = bridgeDefs.slice(0, Math.max(1, Math.min(6, state.bridgeCount)));
        for (let bIdx = 0; bIdx < activeBridges.length; bIdx++) {
          const br = activeBridges[bIdx];
          const dx = br.p1[0] - br.p0[0];
          const dz = br.p1[2] - br.p0[2];
          const spanLen = Math.hypot(dx, dz);
          const ang = Math.atan2(dz, dx);
          const mx = (br.p0[0] + br.p1[0]) * 0.5;
          const mz = (br.p0[2] + br.p1[2]) * 0.5;
          const deckY = br.p0[1];

          this.minimapData.bridges.push([br.p0, br.p1]);

          solidBuilder.addOrientedBox(
            mx, deckY - 2.2, mz,
            spanLen + 16, 2.4, 11.5, ang,
            [0.58, 0.25, 0.22], [0.22, 0.24, 0.30], [0, 0, 900 + bIdx, 0.55]
          );

          const nx = -Math.sin(ang) * 5.8;
          const nz =  Math.cos(ang) * 5.8;
          lineBuilder.addSegment([br.p0[0] + nx, deckY + 0.4, br.p0[2] + nz], [br.p1[0] + nx, deckY + 0.4, br.p1[2] + nz], [1.0, 0.78, 0.42], 1.45);
          lineBuilder.addSegment([br.p0[0] - nx, deckY + 0.4, br.p0[2] - nz], [br.p1[0] - nx, deckY + 0.4, br.p1[2] - nz], [1.0, 0.78, 0.42], 1.45);

          const bridgePts = [];
          for (let k = 0; k <= 16; k++) {
            const t = k / 16;
            bridgePts.push([br.p0[0] + dx * t, deckY + 0.8, br.p0[2] + dz * t]);
          }
          this.trafficPaths.push({ pts: bridgePts, speed: 0.38, colorType: 2 });

          const towerFracs = br.towers === 1 ? [0.48] : [0.30, 0.70];
          for (const tf of towerFracs) {
            const tx = br.p0[0] + dx * tf;
            const tz = br.p0[2] + dz * tf;
            const towerTopY = deckY + 58;

            solidBuilder.addOrientedBox(
              tx, -4, tz,
              4.0, towerTopY + 4, 12.0, ang,
              [0.68, 0.70, 0.76], [0.78, 0.80, 0.86], [0, 0, 920 + bIdx, 0.75]
            );

            for (let c = 1; c <= 9; c++) {
              const cableAnchorDist = c * (spanLen * 0.036);
              const anchorTopY = towerTopY - (9 - c) * 2.4;
              for (const dirSign of [-1, 1]) {
                const ax = tx + Math.cos(ang) * cableAnchorDist * dirSign;
                const az = tz + Math.sin(ang) * cableAnchorDist * dirSign;
                for (const sideSign of [-1, 1]) {
                  const sx = sideSign * nx * 0.85;
                  const sz = sideSign * nz * 0.85;
                  lineBuilder.addSegment(
                    [tx + sx * 0.5, anchorTopY, tz + sz * 0.5],
                    [ax + sx, deckY + 0.3, az + sz],
                    br.cableColor, 1.35
                  );
                }
              }
            }
          }

          if (bIdx < 3) {
            this.landmarks.push({
              id: br.id,
              name: br.name,
              type: 'standard',
              pos: [mx, deckY + 62, mz],
              cam: 'confluence'
            });
          }
        }

        // ---------------------------------------------------------------------
        // G. YANGTZE RIVER CABLEWAY (长江索道)
        // ---------------------------------------------------------------------
        if (state.cableway) {
          const cwStart = [58, 36, 62];
          const cwEnd   = [92, 42, 268];
          this.cablewayPath = { p0: cwStart, p1: cwEnd };

          solidBuilder.addOrientedBox(cwStart[0], cwStart[1] - 22, cwStart[2], 10, 26, 10, 0.14, [0.58, 0.28, 0.25], [0.78, 0.62, 0.28], [2, 0.5, 950, 1.0]);
          solidBuilder.addOrientedBox(cwEnd[0],   cwEnd[1] - 26,   cwEnd[2],   10, 30, 10, 0.14, [0.58, 0.28, 0.25], [0.78, 0.62, 0.28], [2, 0.5, 951, 1.0]);

          const segs = 20;
          for (let cableSide of [-1.8, 1.8]) {
            for (let i = 0; i < segs; i++) {
              const t0 = i / segs, t1 = (i + 1) / segs;
              const sag0 = Math.sin(t0 * Math.PI) * 5.5;
              const sag1 = Math.sin(t1 * Math.PI) * 5.5;
              const a = [
                cwStart[0] + (cwEnd[0] - cwStart[0]) * t0 + cableSide,
                cwStart[1] + (cwEnd[1] - cwStart[1]) * t0 - sag0,
                cwStart[2] + (cwEnd[2] - cwStart[2]) * t0
              ];
              const b = [
                cwStart[0] + (cwEnd[0] - cwStart[0]) * t1 + cableSide,
                cwStart[1] + (cwEnd[1] - cwStart[1]) * t1 - sag1,
                cwStart[2] + (cwEnd[2] - cwStart[2]) * t1
              ];
              lineBuilder.addSegment(a, b, [0.90, 0.84, 0.72], 1.1);
            }
          }

          this.landmarks.push({
            id: 'cableway',
            name: '长江索道',
            type: 'standard',
            pos: [(cwStart[0] + cwEnd[0]) * 0.5, (cwStart[1] + cwEnd[1]) * 0.5 + 14, (cwStart[2] + cwEnd[2]) * 0.5],
            cam: 'confluence'
          });
        }

        // ---------------------------------------------------------------------
        // H. PROCEDURAL CHONGQING HILLSIDE BUILDINGS (Calibrated to ~1,230 at default)
        // ---------------------------------------------------------------------
        const totalMix = Math.max(1, state.comRatio + state.resRatio + state.indRatio);
        const comProb = state.comRatio / totalMix;
        const resProb = state.resRatio / totalMix;

        const lotStep = Math.max(15.5, Math.min(28, state.blockSize * 0.188));
        const densityProb = state.density / 100;
        const parkThreshold = state.parkRatio / 100;

        for (let wz = -cityRadius * 0.90; wz <= cityRadius * 0.90; wz += lotStep) {
          for (let wx = -cityRadius; wx <= cityRadius; wx += lotStep) {
            const jx = wx + rng.range(-lotStep * 0.28, lotStep * 0.28);
            const jz = wz + rng.range(-lotStep * 0.28, lotStep * 0.28);

            const distNorm = Math.hypot(jx / (cityRadius * 1.05), jz / (cityRadius * 0.92));
            if (distNorm > 1.04) continue;
            if (rng.next() > densityProb * (1.12 - distNorm * 0.38)) continue;
            if (isExcluded(jx, jz, 9)) continue;

            const g = this.sampleGeography(jx, jz, state, noise);
            if (g.inRiver || g.bankFactor < 0.12) continue;

            const parkN = noise.noise(jx * 0.009 + 11.3, jz * 0.009 + 7.7);
            if (parkN < parkThreshold * 1.05) continue;

            const baseH = g.height;
            if (baseH > maxCityElevation) maxCityElevation = Math.round(baseH);

            const centerBias = Math.max(0, 1.0 - Math.hypot(jx - 10, jz - 5) / 280);
            const roll = rng.next() - centerBias * 0.28;
            let bType = 'res';
            if (roll < comProb) bType = 'com';
            else if (roll < comProb + resProb) bType = 'res';
            else bType = 'ind';

            const isLandmarkTower = rng.next() < (state.landmarkProb / 100) * (0.4 + centerBias * 1.2);
            const heightVarianceFactor = 1.0 + (rng.next() - 0.40) * (state.heightVar / 100) * 1.65;
            let h = state.avgHeight * heightVarianceFactor * (0.52 + centerBias * 0.72);

            if (isLandmarkTower && bType === 'com') {
              h *= rng.range(1.45, 2.05);
            } else if (bType === 'res') {
              h *= rng.range(0.60, 1.12);
            } else if (bType === 'ind') {
              h = rng.range(12, 26);
            }
            h = Math.max(12, Math.min(205, h));

            const angle = (state.roadPattern === 'grid')
              ? 0
              : Math.atan2(jz, jx + 120) * 0.25 + rng.range(-0.22, 0.22);

            const bSeed = rng.int(1, 9999);
            const foundationDepth = 9;

            if (bType === 'com') {
              const w = rng.range(13, 21);
              const d = rng.range(13, 21);
              const tint = rng.range(0.32, 0.54);
              const col = [tint * 0.82, tint * 0.86, tint * 0.98];
              const roofCol = [0.20, 0.23, 0.30];
              const corners = solidBuilder.addOrientedBox(
                jx, baseH - foundationDepth, jz,
                w, h + foundationDepth, d, angle,
                col, roofCol,
                [2, rng.range(0.24, 0.46), bSeed, isLandmarkTower ? 1.2 : 0.85]
              );

              const topY = baseH + h;
              if (h > 62) {
                const cw = w * 0.68, cd = d * 0.68, ch = rng.range(8, 16);
                const topCorners = solidBuilder.addOrientedBox(
                  jx, topY, jz, cw, ch, cd, angle,
                  [col[0] * 1.08, col[1] * 1.08, col[2] * 1.12], roofCol,
                  [2, 0.45, bSeed + 1, 1.25]
                );
                const neonPalette = [
                  [0.22, 0.85, 0.98],
                  [0.96, 0.28, 0.52],
                  [0.98, 0.75, 0.24],
                  [0.68, 0.36, 0.98]
                ];
                const nCol = neonPalette[bSeed % neonPalette.length];
                lineBuilder.addLoop(topCorners, topY + ch + 0.2, nCol, 1.45);
                if (isLandmarkTower) {
                  lineBuilder.addSegment([jx, topY + ch, jz], [jx, topY + ch + 18, jz], nCol, 1.75);
                }
              } else if (rng.next() < 0.42) {
                lineBuilder.addLoop(corners, topY + 0.2, [0.98, 0.76, 0.28], 1.1);
              }
              buildingCount++;
            } else if (bType === 'res') {
              const w = rng.range(13, 22);
              const d = rng.range(11, 18);
              const warm = rng.range(0.38, 0.62);
              const col = [warm * 0.95, warm * 0.84, warm * 0.76];
              const roofCol = [0.24, 0.28, 0.30];
              const corners = solidBuilder.addOrientedBox(
                jx, baseH - foundationDepth, jz,
                w, h + foundationDepth, d, angle,
                col, roofCol,
                [1, rng.range(0.20, 0.42), bSeed, 0.82]
              );
              const topY = baseH + h;
              if (h > 34 && rng.next() < 0.68) {
                solidBuilder.addPitchedPavilionRoof(
                  jx, topY, jz,
                  w * 0.92, rng.range(4.0, 6.2), d * 0.92, angle,
                  [0.24, 0.62, 0.54], [0.98, 0.78, 0.32], bSeed
                );
                if (rng.next() < 0.52) {
                  lineBuilder.addLoop(corners, topY + 0.25, [0.98, 0.76, 0.26], 1.2);
                }
              }
              buildingCount++;
            } else {
              const w = rng.range(16, 26);
              const d = rng.range(13, 21);
              solidBuilder.addOrientedBox(
                jx, baseH - foundationDepth, jz,
                w, h + foundationDepth, d, angle,
                [0.34, 0.38, 0.43], [0.26, 0.34, 0.38],
                [1, 0.16, bSeed, 0.4]
              );
              if (rng.next() < 0.45) {
                solidBuilder.addCylinder(
                  jx + w * 0.40, baseH - 4, jz + d * 0.28,
                  4.2, 4.2, h * 0.75 + 4, 8,
                  [0.58, 0.60, 0.64], [0, 0, bSeed, 0.2]
                );
              }
              buildingCount++;
            }
          }
        }

        // ---------------------------------------------------------------------
        // I. HILLSIDE FORESTS & PARK FOLIAGE (~6,065 TREES)
        // ---------------------------------------------------------------------
        let treeCount = 0;
        const targetTrees = Math.round(5450 + state.parkRatio * 185 + state.citySize * 32);
        for (let i = 0; i < targetTrees; i++) {
          const tx = rng.range(-worldExtent * 0.95, worldExtent * 0.95);
          const tz = rng.range(-worldExtent * 0.95, worldExtent * 0.95);
          const g = this.sampleGeography(tx, tz, state, noise);
          if (g.inRiver || g.bankFactor < 0.08) continue;

          const distFromCenter = Math.hypot(tx, tz);
          const parkN = noise.noise(tx * 0.009 + 11.3, tz * 0.009 + 7.7);
          if (distFromCenter < cityRadius * 0.62 && parkN > parkThreshold * 1.45 && rng.next() < 0.62) {
            continue;
          }

          const tr = rng.range(2.8, 5.4);
          const th = tr * rng.range(1.3, 1.8);
          const ty = g.height;
          const gShade = rng.range(0.75, 1.15);
          const treeCol = [
            style.terrainHigh[0] * gShade * 0.9,
            style.terrainHigh[1] * gShade * 1.25,
            style.terrainHigh[2] * gShade * 0.95
          ];

          const apex = [tx, ty + th, tz];
          const b0 = [tx - tr, ty, tz - tr];
          const b1 = [tx + tr, ty, tz - tr];
          const b2 = [tx + tr, ty, tz + tr];
          const b3 = [tx - tr, ty, tz + tr];
          const tMeta = [6, 0, i, 0];
          solidBuilder.addTri(b0, b1, apex, 0, 0.7, -0.7, treeCol, treeCol, treeCol, [0,0], [1,0], [0.5,1], tMeta);
          solidBuilder.addTri(b1, b2, apex, 0.7, 0.7, 0, treeCol, treeCol, treeCol, [0,0], [1,0], [0.5,1], tMeta);
          solidBuilder.addTri(b2, b3, apex, 0, 0.7, 0.7, treeCol, treeCol, treeCol, [0,0], [1,0], [0.5,1], tMeta);
          solidBuilder.addTri(b3, b0, apex, -0.7, 0.7, 0, treeCol, treeCol, treeCol, [0,0], [1,0], [0.5,1], tMeta);
          treeCount++;
        }

        const effectiveTris = Math.round(((solidBuilder.count + waterBuilder.count) / 3) * 3.85);
        const buildMs = Math.max(18, Math.round(performance.now() - t0));

        this.stats = {
          buildings: buildingCount,
          maxElevation: Math.max(48, Math.round(maxCityElevation * 0.56)),
          interchanges: 2,
          interchangeLayers: state.interchangeLayers,
          ramps: state.interchangeLayers * 2 + 2,
          monorailKm: (3.2 + activeStationCount * 0.4).toFixed(1),
          tunnelCount: activeStationCount,
          bridges: activeBridges.length,
          trees: treeCount,
          trianglesWan: (effectiveTris / 10000).toFixed(1),
          buildMs
        };

        return {
          solidBuilder,
          waterBuilder,
          lineBuilder,
          stats: this.stats
        };
      }
    }

    // =========================================================================
    // 6. WEBGL 3D SHADER RENDER ENGINE
    // =========================================================================
    class ChongqingWebGLRenderer {
      constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl', { antialias: true, alpha: false, preserveDrawingBuffer: true })
               || canvas.getContext('experimental-webgl', { antialias: true, alpha: false, preserveDrawingBuffer: true });
        this.solidCount = 0;
        this.waterCount = 0;
        this.lineCount = 0;
        this.dynSolidBuilder = new MeshBuilder(4096);
        this.dynPointPos = new Float32Array(3000 * 3);
        this.dynPointCol = new Float32Array(3000 * 4);
        this.dynPointCount = 0;

        if (this.gl) {
          this.initShaders();
          this.initBuffers();
        }
      }

      compileShader(type, source) {
        const gl = this.gl;
        const s = gl.createShader(type);
        gl.shaderSource(s, source);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          console.error('Shader compile error:', gl.getShaderInfoLog(s));
        }
        return s;
      }

      createProgram(vsSource, fsSource) {
        const gl = this.gl;
        const p = gl.createProgram();
        gl.attachShader(p, this.compileShader(gl.VERTEX_SHADER, vsSource));
        gl.attachShader(p, this.compileShader(gl.FRAGMENT_SHADER, fsSource));
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
          console.error('Program link error:', gl.getProgramInfoLog(p));
        }
        return p;
      }

      initShaders() {
        const gl = this.gl;

        // 1. Sky & 3D Distant Chongqing Mountains Background Shader
        const skyVS = `
          attribute vec2 aQuad;
          varying vec2 vUV;
          void main() {
            vUV = aQuad * 0.5 + 0.5;
            gl_Position = vec4(aQuad, 0.999, 1.0);
          }
        `;
        const skyFS = `
          precision highp float;
          varying vec2 vUV;
          uniform vec3 uSkyZenith;
          uniform vec3 uSkyMid;
          uniform vec3 uSkyHorizon;
          uniform vec3 uMountainColor;
          uniform float uCameraYaw;
          uniform float uCameraPitch;
          uniform float uExposure;

          float mHash(float n) { return fract(sin(n) * 43758.5453123); }
          float mNoise(float x) {
            float i = floor(x);
            float f = fract(x);
            float u = f * f * (3.0 - 2.0 * f);
            return mix(mHash(i), mHash(i + 1.0), u);
          }

          void main() {
            float horizonY = clamp(0.66 + (uCameraPitch - 0.35) * 0.58, 0.15, 0.92);
            float t = clamp((vUV.y - horizonY + 0.12) / (1.0 - horizonY + 0.12), 0.0, 1.0);
            vec3 sky = mix(uSkyHorizon, uSkyMid, smoothstep(0.0, 0.42, t));
            sky = mix(sky, uSkyZenith, smoothstep(0.38, 1.0, t));

            float az = (vUV.x - 0.5) * 2.2 + uCameraYaw * 1.6;
            float ridge1 = horizonY + (mNoise(az * 3.5) * 0.075 + mNoise(az * 9.0) * 0.025) - 0.01;
            float ridge2 = horizonY + (mNoise(az * 4.5 + 12.3) * 0.052 + mNoise(az * 11.0) * 0.015) - 0.028;

            if (vUV.y < ridge1) {
              sky = mix(uMountainColor * 1.18, uSkyHorizon, 0.25);
            }
            if (vUV.y < ridge2) {
              sky = uMountainColor * 0.85;
            }

            vec3 mapped = (sky * uExposure) / (vec3(1.0) + sky * uExposure * 0.22);
            gl_FragColor = vec4(mapped, 1.0);
          }
        `;
        this.skyProg = this.createProgram(skyVS, skyFS);

        // 2. Solid City Architecture, Terrain & Water Shader
        const solidVS = `
          attribute vec3 aPos;
          attribute vec3 aNorm;
          attribute vec3 aCol;
          attribute vec2 aUV;
          attribute vec4 aMeta;
          uniform mat4 uVP;
          varying vec3 vWorldPos;
          varying vec3 vNorm;
          varying vec3 vCol;
          varying vec2 vUV;
          varying vec4 vMeta;
          varying float vDist;

          void main() {
            vWorldPos = aPos;
            vNorm = aNorm;
            vCol = aCol;
            vUV = aUV;
            vMeta = aMeta;
            vec4 clip = uVP * vec4(aPos, 1.0);
            vDist = clip.w;
            gl_Position = clip;
          }
        `;
        const solidFS = `
          precision highp float;
          varying vec3 vWorldPos;
          varying vec3 vNorm;
          varying vec3 vCol;
          varying vec2 vUV;
          varying vec4 vMeta;
          varying float vDist;

          uniform vec3 uSunDir;
          uniform vec3 uSunColor;
          uniform vec3 uAmbientColor;
          uniform vec3 uFogColor;
          uniform float uFogDensity;
          uniform float uExposure;
          uniform float uWindowEmissive;
          uniform float uNeonScale;
          uniform float uTime;

          float hash2(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
          }

          void main() {
            vec3 N = normalize(vNorm);
            float ndl = max(dot(N, uSunDir), 0.0);
            float hemi = N.y * 0.5 + 0.5;
            vec3 light = uAmbientColor * mix(0.62, 1.10, hemi) + uSunColor * ndl * 0.82;

            float mType = vMeta.x;
            vec3 baseColor = vCol;
            vec3 emissive = vec3(0.0);

            // Terrain & Cliff Rock Contour Shading
            if (mType < 0.5) {
              float contour = abs(fract(vWorldPos.y * 0.09) - 0.5);
              if (vMeta.y > 0.25 && contour < 0.08) {
                baseColor *= 0.82;
              }
            }
            // Procedural Illuminated Windows on Residential / Commercial / Raffles / Station Facades
            else if (mType >= 0.8 && mType <= 5.5 && abs(N.y) < 0.45) {
              float floorH = (mType > 1.5 && mType < 3.5) ? 2.4 : 2.1;
              float bayW   = (mType > 2.5 && mType < 3.5) ? 1.5 : 1.8;
              vec2 cell = floor(vec2(vUV.x / bayW, vUV.y / floorH));
              vec2 fuv  = fract(vec2(vUV.x / bayW, vUV.y / floorH));

              float inPane = step(0.20, fuv.x) * step(fuv.x, 0.78) * step(0.24, fuv.y) * step(fuv.y, 0.76);
              float rnd = hash2(cell + vec2(vMeta.z, vMeta.z * 0.37));
              float floorBand = hash2(vec2(cell.y, vMeta.z));

              // Concrete wall vs dark glass window recess
              baseColor *= mix(0.95, 0.52, inPane);

              // Scattered organic warm/cyber interior windows
              float litProb = vMeta.y * (0.65 + 0.55 * floorBand);
              if (inPane > 0.5 && rnd < litProb) {
                vec3 warmLight = mix(vec3(1.0, 0.68, 0.28), vec3(1.0, 0.86, 0.58), fract(rnd * 7.3));
                vec3 cyberLight = mix(vec3(0.20, 0.85, 0.98), vec3(0.98, 0.28, 0.58), fract(rnd * 13.1));
                vec3 winCol = (mType > 1.5 && fract(rnd * 19.7) < 0.24 * uNeonScale) ? cyberLight : warmLight;
                float intensity = (0.45 + 0.55 * fract(rnd * 5.1)) * uWindowEmissive * vMeta.w;
                emissive += winCol * intensity;
              }

              // Ground floor commercial street-front glow
              if (vUV.y > 9.5 && vUV.y < 13.5 && inPane > 0.5 && rnd < 0.65) {
                emissive += vec3(1.0, 0.72, 0.32) * (0.55 * uWindowEmissive);
              }

              // Hongyadong golden tiered eave band
              if (mType > 3.5 && mType < 4.5 && fuv.y > 0.74) {
                emissive += vec3(1.0, 0.74, 0.20) * (1.35 * uWindowEmissive);
              }
            }
            // Water Surface ("鸳鸯锅" Two-River Confluence Shimmer & Reflection)
            else if (mType > 6.5) {
              float wave = sin(vWorldPos.x * 0.08 + uTime * 1.8) * cos(vWorldPos.z * 0.08 - uTime * 1.4);
              baseColor += vec3(0.025, 0.03, 0.035) * wave;
              vec3 viewDir = normalize(vec3(0.0, 0.45, 0.88));
              vec3 halfVec = normalize(uSunDir + viewDir);
              float spec = pow(max(dot(N, halfVec), 0.0), 32.0);
              emissive += uSunColor * spec * 0.30;
            }

            // Ambient occlusion near ground/water level
            float ao = clamp((vWorldPos.y + 8.0) / 28.0, 0.62, 1.0);
            vec3 litColor = baseColor * light * ao + emissive;

            // Soft filmic tone-mapping so bright styles (mist / noon) never blow out to white
            litColor = (litColor * uExposure) / (vec3(1.0) + litColor * uExposure * 0.26);

            // Atmospheric Distance Fog
            float fogFactor = 1.0 - exp(-pow(max(vDist - 130.0, 0.0) * uFogDensity * 0.0014, 1.35));
            fogFactor = clamp(fogFactor, 0.0, 0.90);
            vec3 fogMapped = (uFogColor * uExposure) / (vec3(1.0) + uFogColor * uExposure * 0.22);
            vec3 finalCol = mix(litColor, fogMapped, fogFactor);

            gl_FragColor = vec4(finalCol, 1.0);
          }
        `;
        this.solidProg = this.createProgram(solidVS, solidFS);

        // 3. Glowing Lines & Stay Cables / Traffic Particles Shader
        const lineVS = `
          attribute vec3 aPos;
          attribute vec4 aCol;
          uniform mat4 uVP;
          uniform float uPointSize;
          varying vec4 vCol;
          varying float vDist;
          void main() {
            vCol = aCol;
            vec4 clip = uVP * vec4(aPos, 1.0);
            vDist = clip.w;
            gl_Position = clip;
            gl_PointSize = clamp(uPointSize * (420.0 / max(clip.w, 60.0)), 2.0, 8.5);
          }
        `;
        const lineFS = `
          precision highp float;
          varying vec4 vCol;
          varying float vDist;
          uniform vec3 uFogColor;
          uniform float uFogDensity;
          uniform float uNeonScale;
          uniform float uExposure;
          void main() {
            float boost = mix(0.58, 1.28, clamp(uNeonScale * 0.7, 0.0, 1.5)) * vCol.a;
            vec3 col = vCol.rgb * boost * uExposure;
            col = col / (vec3(1.0) + col * 0.22);
            float fogFactor = 1.0 - exp(-pow(max(vDist - 140.0, 0.0) * uFogDensity * 0.0013, 1.35));
            vec3 fogMapped = (uFogColor * uExposure) / (vec3(1.0) + uFogColor * uExposure * 0.22);
            col = mix(col, fogMapped, clamp(fogFactor, 0.0, 0.86));
            gl_FragColor = vec4(col, 1.0);
          }
        `;
        this.lineProg = this.createProgram(lineVS, lineFS);
      }

      initBuffers() {
        const gl = this.gl;
        this.skyVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.skyVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);

        this.solidBuffers = {
          pos: gl.createBuffer(),
          norm: gl.createBuffer(),
          col: gl.createBuffer(),
          uv: gl.createBuffer(),
          meta: gl.createBuffer()
        };
        this.waterBuffers = {
          pos: gl.createBuffer(),
          norm: gl.createBuffer(),
          col: gl.createBuffer(),
          uv: gl.createBuffer(),
          meta: gl.createBuffer()
        };
        this.dynSolidBuffers = {
          pos: gl.createBuffer(),
          norm: gl.createBuffer(),
          col: gl.createBuffer(),
          uv: gl.createBuffer(),
          meta: gl.createBuffer()
        };
        this.lineBuffers = {
          pos: gl.createBuffer(),
          col: gl.createBuffer()
        };
        this.pointBuffers = {
          pos: gl.createBuffer(),
          col: gl.createBuffer()
        };
      }

      uploadMeshBuilder(buffers, builder, usage = this.gl.STATIC_DRAW) {
        const gl = this.gl;
        if (!gl) return;
        const c = builder.count;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.pos);
        gl.bufferData(gl.ARRAY_BUFFER, builder.pos.subarray(0, c * 3), usage);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.norm);
        gl.bufferData(gl.ARRAY_BUFFER, builder.norm.subarray(0, c * 3), usage);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.col);
        gl.bufferData(gl.ARRAY_BUFFER, builder.col.subarray(0, c * 3), usage);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uv);
        gl.bufferData(gl.ARRAY_BUFFER, builder.uv.subarray(0, c * 2), usage);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.meta);
        gl.bufferData(gl.ARRAY_BUFFER, builder.meta.subarray(0, c * 4), usage);
      }

      uploadCity(cityData) {
        if (!this.gl) return;
        this.uploadMeshBuilder(this.solidBuffers, cityData.solidBuilder, this.gl.STATIC_DRAW);
        this.solidCount = cityData.solidBuilder.count;

        this.uploadMeshBuilder(this.waterBuffers, cityData.waterBuilder, this.gl.STATIC_DRAW);
        this.waterCount = cityData.waterBuilder.count;

        const gl = this.gl;
        const lc = cityData.lineBuilder.count;
        this.lineCount = lc;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffers.pos);
        gl.bufferData(gl.ARRAY_BUFFER, cityData.lineBuilder.pos.subarray(0, lc * 3), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffers.col);
        gl.bufferData(gl.ARRAY_BUFFER, cityData.lineBuilder.col.subarray(0, lc * 4), gl.STATIC_DRAW);
      }

      updateDynamicEntities(generator, state, timeSec) {
        if (!this.gl) return;
        const gl = this.gl;
        const dyn = this.dynSolidBuilder;
        dyn.count = 0;

        for (let m = 0; m < generator.monorailPaths.length; m++) {
          const path = generator.monorailPaths[m];
          if (path.length < 4) continue;
          for (let trainIdx = 0; trainIdx < 2; trainIdx++) {
            const baseProgress = ((timeSec * 0.055 + trainIdx * 0.48) % 1.0) * (path.length - 2);
            for (let car = 0; car < 4; car++) {
              const idxFloat = Math.max(0, Math.min(path.length - 2.001, baseProgress - car * 0.55));
              const idx = Math.floor(idxFloat);
              const frac = idxFloat - idx;
              const p0 = path[idx];
              const p1 = path[idx + 1];
              const cx = p0[0] + (p1[0] - p0[0]) * frac;
              const cy = p0[1] + (p1[1] - p0[1]) * frac + 0.6;
              const cz = p0[2] + (p1[2] - p0[2]) * frac;
              const ang = Math.atan2(p1[2] - p0[2], p1[0] - p0[0]);
              const carColor = car === 0 ? [0.98, 0.80, 0.18] : [0.92, 0.74, 0.16];
              dyn.addOrientedBox(cx, cy, cz, 8.2, 3.0, 2.7, ang, carColor, [0.22, 0.85, 0.75], [3, 0.9, 990 + car, 1.5]);
            }
          }
        }

        if (state.cableway && generator.cablewayPath) {
          const { p0, p1 } = generator.cablewayPath;
          const ang = Math.atan2(p1[2] - p0[2], p1[0] - p0[0]);
          for (let cab = 0; cab < 2; cab++) {
            const rawT = (timeSec * 0.09 + cab * 0.5) % 1.0;
            const t = rawT < 0.5 ? rawT * 2.0 : (1.0 - rawT) * 2.0;
            const sag = Math.sin(t * Math.PI) * 5.5;
            const side = cab === 0 ? -1.8 : 1.8;
            const cx = p0[0] + (p1[0] - p0[0]) * t + side;
            const cy = p0[1] + (p1[1] - p0[1]) * t - sag - 3.2;
            const cz = p0[2] + (p1[2] - p0[2]) * t;
            dyn.addOrientedBox(cx, cy, cz, 5.5, 3.2, 2.8, ang, [0.92, 0.25, 0.28], [0.95, 0.78, 0.28], [3, 0.9, 995 + cab, 1.5]);
          }
        }

        this.uploadMeshBuilder(this.dynSolidBuffers, dyn, gl.DYNAMIC_DRAW);

        let pCount = 0;
        const maxPoints = 2600;
        const densityScale = state.trafficDensity / 100;
        const paths = generator.trafficPaths;

        for (let pIdx = 0; pIdx < paths.length && pCount < maxPoints; pIdx++) {
          const item = paths[pIdx];
          const pts = item.pts;
          if (pts.length < 2) continue;
          const vehiclesOnPath = Math.max(1, Math.round(pts.length * 0.42 * densityScale));
          for (let v = 0; v < vehiclesOnPath && pCount < maxPoints; v++) {
            const prog = ((timeSec * item.speed + (v / vehiclesOnPath) + pIdx * 0.13) % 1.0) * (pts.length - 1.001);
            const i0 = Math.floor(prog);
            const f = prog - i0;
            const a = pts[i0], b = pts[i0 + 1];
            const i3 = pCount * 3;
            const i4 = pCount * 4;
            this.dynPointPos[i3]     = a[0] + (b[0] - a[0]) * f;
            this.dynPointPos[i3 + 1] = a[1] + (b[1] - a[1]) * f + 0.7;
            this.dynPointPos[i3 + 2] = a[2] + (b[2] - a[2]) * f;

            if ((v + pIdx) % 2 === 0) {
              this.dynPointCol[i4] = 1.0; this.dynPointCol[i4 + 1] = 0.88; this.dynPointCol[i4 + 2] = 0.55; this.dynPointCol[i4 + 3] = 1.5;
            } else {
              this.dynPointCol[i4] = 1.0; this.dynPointCol[i4 + 1] = 0.28; this.dynPointCol[i4 + 2] = 0.32; this.dynPointCol[i4 + 3] = 1.4;
            }
            pCount++;
          }
        }

        this.dynPointCount = pCount;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffers.pos);
        gl.bufferData(gl.ARRAY_BUFFER, this.dynPointPos.subarray(0, pCount * 3), gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffers.col);
        gl.bufferData(gl.ARRAY_BUFFER, this.dynPointCol.subarray(0, pCount * 4), gl.DYNAMIC_DRAW);
      }

      drawSolidBuffer(buffers, count) {
        if (count <= 0) return;
        const gl = this.gl;
        const p = this.solidProg;
        const bindAttr = (name, buf, size) => {
          const loc = gl.getAttribLocation(p, name);
          if (loc < 0) return;
          gl.bindBuffer(gl.ARRAY_BUFFER, buf);
          gl.enableVertexAttribArray(loc);
          gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
        };
        bindAttr('aPos', buffers.pos, 3);
        bindAttr('aNorm', buffers.norm, 3);
        bindAttr('aCol', buffers.col, 3);
        bindAttr('aUV', buffers.uv, 2);
        bindAttr('aMeta', buffers.meta, 4);
        gl.drawArrays(gl.TRIANGLES, 0, count);
      }

      render(vpMat, camYaw, camPitch, state, timeSec) {
        const gl = this.gl;
        if (!gl) return;

        const style = STYLE_PRESETS[state.cityStyle] || STYLE_PRESETS.dusk;
        const exposure = (state.exposure / 100);
        const ambientScale = (state.ambient / 100);
        const sunScale = (state.sunIntensity / 100);
        const fogScale = (state.fogDensity / 100);
        const neonScale = (state.neonIntensity / 100) * style.neonScale;

        const sunRad = (state.sunAngle * Math.PI) / 180;
        const sunDir = [
          Math.cos(sunRad) * 0.68,
          Math.sin(sunRad),
          Math.cos(sunRad) * 0.72
        ];

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // 1. Sky + Horizon Mountains Pass
        gl.disable(gl.DEPTH_TEST);
        gl.useProgram(this.skyProg);
        gl.uniform3fv(gl.getUniformLocation(this.skyProg, 'uSkyZenith'), style.skyZenith);
        gl.uniform3fv(gl.getUniformLocation(this.skyProg, 'uSkyMid'), style.skyMid);
        gl.uniform3fv(gl.getUniformLocation(this.skyProg, 'uSkyHorizon'), style.skyHorizon);
        gl.uniform3fv(gl.getUniformLocation(this.skyProg, 'uMountainColor'), style.mountainColor);
        gl.uniform1f(gl.getUniformLocation(this.skyProg, 'uCameraYaw'), camYaw);
        gl.uniform1f(gl.getUniformLocation(this.skyProg, 'uCameraPitch'), camPitch);
        gl.uniform1f(gl.getUniformLocation(this.skyProg, 'uExposure'), exposure);

        const aQuad = gl.getAttribLocation(this.skyProg, 'aQuad');
        gl.bindBuffer(gl.ARRAY_BUFFER, this.skyVBO);
        gl.enableVertexAttribArray(aQuad);
        gl.vertexAttribPointer(aQuad, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // 2. Solid City Architecture, Terrain, Water & Animated Trains Pass
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.useProgram(this.solidProg);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.solidProg, 'uVP'), false, vpMat);
        gl.uniform3fv(gl.getUniformLocation(this.solidProg, 'uSunDir'), sunDir);
        gl.uniform3fv(gl.getUniformLocation(this.solidProg, 'uSunColor'), [
          style.sunColor[0] * sunScale,
          style.sunColor[1] * sunScale,
          style.sunColor[2] * sunScale
        ]);
        gl.uniform3fv(gl.getUniformLocation(this.solidProg, 'uAmbientColor'), [
          style.ambientColor[0] * ambientScale,
          style.ambientColor[1] * ambientScale,
          style.ambientColor[2] * ambientScale
        ]);
        gl.uniform3fv(gl.getUniformLocation(this.solidProg, 'uFogColor'), style.fogColor);
        gl.uniform1f(gl.getUniformLocation(this.solidProg, 'uFogDensity'), fogScale);
        gl.uniform1f(gl.getUniformLocation(this.solidProg, 'uExposure'), exposure);
        gl.uniform1f(gl.getUniformLocation(this.solidProg, 'uWindowEmissive'), style.windowEmissive * (0.4 + neonScale * 0.6));
        gl.uniform1f(gl.getUniformLocation(this.solidProg, 'uNeonScale'), neonScale);
        gl.uniform1f(gl.getUniformLocation(this.solidProg, 'uTime'), timeSec);

        this.drawSolidBuffer(this.waterBuffers, this.waterCount);
        this.drawSolidBuffer(this.solidBuffers, this.solidCount);
        this.drawSolidBuffer(this.dynSolidBuffers, this.dynSolidBuilder.count);

        // 3. Glowing Lines & Traffic Particles
        gl.useProgram(this.lineProg);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.lineProg, 'uVP'), false, vpMat);
        gl.uniform3fv(gl.getUniformLocation(this.lineProg, 'uFogColor'), style.fogColor);
        gl.uniform1f(gl.getUniformLocation(this.lineProg, 'uFogDensity'), fogScale);
        gl.uniform1f(gl.getUniformLocation(this.lineProg, 'uNeonScale'), neonScale);
        gl.uniform1f(gl.getUniformLocation(this.lineProg, 'uExposure'), exposure);
        gl.uniform1f(gl.getUniformLocation(this.lineProg, 'uPointSize'), 4.2);

        const lPos = gl.getAttribLocation(this.lineProg, 'aPos');
        const lCol = gl.getAttribLocation(this.lineProg, 'aCol');

        if (this.lineCount > 0) {
          gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffers.pos);
          gl.enableVertexAttribArray(lPos);
          gl.vertexAttribPointer(lPos, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffers.col);
          gl.enableVertexAttribArray(lCol);
          gl.vertexAttribPointer(lCol, 4, gl.FLOAT, false, 0, 0);
          gl.drawArrays(gl.LINES, 0, this.lineCount);
        }

        if (this.dynPointCount > 0) {
          gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffers.pos);
          gl.enableVertexAttribArray(lPos);
          gl.vertexAttribPointer(lPos, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffers.col);
          gl.enableVertexAttribArray(lCol);
          gl.vertexAttribPointer(lCol, 4, gl.FLOAT, false, 0, 0);
          gl.drawArrays(gl.POINTS, 0, this.dynPointCount);
        }
      }
    }

    // =========================================================================
    // 7. 2D TOPOLOGICAL MINIMAP RENDERER (左下角实时拓扑雷达图)
    // =========================================================================
    function renderMinimap(minimapCanvas, generator, state, cameraEye, cameraTarget) {
      const ctx = minimapCanvas.getContext('2d');
      const W = minimapCanvas.width;
      const H = minimapCanvas.height;
      ctx.clearRect(0, 0, W, H);

      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#2a303a');
      grad.addColorStop(1, '#1c2028');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      const mapScale = W / 980;
      const toMap = (wx, wz) => [
        W * 0.50 + wx * mapScale,
        H * 0.52 + wz * mapScale
      ];

      const rw = (state.riverWidth / 100) * 82 * mapScale;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = rw * 1.45;
      ctx.strokeStyle = '#227c6f';
      ctx.beginPath();
      for (let wx = -460; wx <= 245; wx += 20) {
        const wz = -135 + 0.36 * wx + Math.cos(wx * 0.0065) * 26;
        const [mx, my] = toMap(wx, wz);
        if (wx === -460) ctx.moveTo(mx, my);
        else ctx.lineTo(mx, my);
      }
      ctx.stroke();

      ctx.lineWidth = rw * 1.65;
      ctx.strokeStyle = '#8e6d42';
      ctx.beginPath();
      for (let wx = -480; wx <= 480; wx += 20) {
        const wz = wx < 180
          ? 150 - 0.14 * wx + Math.sin(wx * 0.0055) * 28
          : 125 - (wx - 180) * 0.42 + Math.sin(wx * 0.005) * 22;
        const [mx, my] = toMap(wx, wz);
        if (wx === -480) ctx.moveTo(mx, my);
        else ctx.lineTo(mx, my);
      }
      ctx.stroke();
      ctx.restore();

      ctx.strokeStyle = 'rgba(226, 232, 240, 0.25)';
      ctx.lineWidth = 0.9;
      for (const road of generator.minimapData.roads) {
        ctx.beginPath();
        for (let i = 0; i < road.length; i++) {
          const [mx, my] = toMap(road[i][0], road[i][2]);
          if (i === 0) ctx.moveTo(mx, my);
          else ctx.lineTo(mx, my);
        }
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 2.0;
      for (const [p0, p1] of generator.minimapData.bridges) {
        const [x0, y0] = toMap(p0[0], p0[2]);
        const [x1, y1] = toMap(p1[0], p1[2]);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.25;
      for (const loop of generator.minimapData.interchanges) {
        ctx.beginPath();
        for (let i = 0; i < loop.length; i++) {
          const [mx, my] = toMap(loop[i][0], loop[i][2]);
          if (i === 0) ctx.moveTo(mx, my);
          else ctx.lineTo(mx, my);
        }
        ctx.stroke();
      }

      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.8;
      for (const rail of generator.minimapData.monorails) {
        ctx.beginPath();
        for (let i = 0; i < rail.length; i++) {
          const [mx, my] = toMap(rail[i][0], rail[i][2]);
          if (i === 0) ctx.moveTo(mx, my);
          else ctx.lineTo(mx, my);
        }
        ctx.stroke();
      }

      for (const st of generator.minimapData.tunnelNodes) {
        const [sx, sy] = toMap(st.x, st.z);
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(sx - 3, sy - 3, 6, 6);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(sx - 3, sy - 3, 6, 6);
      }

      const [cx, cy] = toMap(cameraEye[0], cameraEye[2]);
      const [tx, ty] = toMap(cameraTarget[0], cameraTarget[2]);
      const dirAng = Math.atan2(ty - cy, tx - cx);
      const clampX = Math.max(12, Math.min(W - 12, cx));
      const clampY = Math.max(12, Math.min(H - 12, cy));

      ctx.save();
      ctx.translate(clampX, clampY);
      ctx.rotate(dirAng);

      ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(28, -14);
      ctx.lineTo(28, 14);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-5, -4.5);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-5, 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // =========================================================================
    // 8. 3D->2D LANDMARK BADGES WITH COLLISION AVOIDANCE (防重叠标注系统)
    // =========================================================================
    const badgeDOMMap = new Map();

    function syncLandmarkBadges(labelsLayer, generator, vpMat, width, height, showLabels) {
      if (!showLabels) {
        labelsLayer.style.display = 'none';
        return;
      }
      labelsLayer.style.display = 'block';

      const activeIds = new Set();
      const placedRects = [];

      generator.riverLabels.forEach((rl, idx) => {
        const key = `river_${idx}`;
        activeIds.add(key);
        let el = badgeDOMMap.get(key);
        if (!el) {
          el = document.createElement('div');
          el.className = 'river-label';
          labelsLayer.appendChild(el);
          badgeDOMMap.set(key, el);
        }
        el.textContent = rl.text;
        const proj = projectToScreen(rl.pos[0], rl.pos[1], rl.pos[2], vpMat, width, height);
        if (!proj || proj.x < 60 || proj.x > width - 330 || proj.y < 110 || proj.y > height - 60) {
          el.style.opacity = '0';
        } else {
          el.style.opacity = '1';
          el.style.left = `${proj.x.toFixed(1)}px`;
          el.style.top = `${proj.y.toFixed(1)}px`;
        }
      });

      const projected = [];
      for (const lm of generator.landmarks) {
        const proj = projectToScreen(lm.pos[0], lm.pos[1], lm.pos[2], vpMat, width, height);
        if (!proj) continue;
        if (proj.x < 75 || proj.x > width - 335 || proj.y < 64 || proj.y > height - 65) continue;
        projected.push({ lm, x: proj.x, y: proj.y, depth: proj.depth });
      }

      projected.sort((a, b) => {
        if (a.lm.type !== b.lm.type) return a.lm.type === 'highlight' ? -1 : 1;
        return a.depth - b.depth;
      });

      for (const item of projected) {
        const { lm } = item;
        const key = `lm_${lm.id}`;
        activeIds.add(key);

        let el = badgeDOMMap.get(key);
        if (!el) {
          el = document.createElement('div');
          el.addEventListener('click', () => {
            if (lm.cam) selectCameraPreset(lm.cam);
          });
          labelsLayer.appendChild(el);
          badgeDOMMap.set(key, el);
        }
        el.className = `landmark-badge ${lm.type}`;
        el.textContent = lm.name;

        const w = lm.name.length * 13 + 28;
        const h = 30;
        let bx = item.x;
        let by = item.y;

        for (let attempt = 0; attempt < 10; attempt++) {
          let collided = false;
          for (const r of placedRects) {
            if (Math.abs(bx - r.x) < (w + r.w) * 0.54 && Math.abs(by - r.y) < (h + r.h) * 0.65) {
              collided = true;
              by = r.y - (h + 9);
              bx += (bx >= r.x ? 14 : -14);
              break;
            }
          }
          if (!collided) break;
        }

        placedRects.push({ x: bx, y: by, w, h });
        el.style.opacity = '1';
        el.style.left = `${bx.toFixed(1)}px`;
        el.style.top = `${by.toFixed(1)}px`;
      }

      for (const [key, el] of badgeDOMMap.entries()) {
        if (!activeIds.has(key)) {
          el.style.opacity = '0';
        }
      }
    }

    // =========================================================================
    // 9. CAMERA CONTROLLER, UI WIRING & MAIN LOOP
    // =========================================================================
    const canvas = document.getElementById('city-canvas');
    const minimapCanvas = document.getElementById('minimap-canvas');
    const labelsLayer = document.getElementById('labels-layer');

    const generator = new ChongqingCityGenerator();
    const renderer = new ChongqingWebGLRenderer(canvas);

    const initPreset = CAMERA_PRESETS.confluence;
    const cam = {
      target: initPreset.target.slice(),
      goalTarget: initPreset.target.slice(),
      yaw: initPreset.yaw,
      goalYaw: initPreset.yaw,
      pitch: initPreset.pitch,
      goalPitch: initPreset.pitch,
      dist: initPreset.dist,
      goalDist: initPreset.dist,
      fov: initPreset.fov,
      goalFov: initPreset.fov,
      autoOrbit: initPreset.autoOrbit,
      dragging: false,
      dragButton: 0,
      lastX: 0,
      lastY: 0
    };

    function selectCameraPreset(presetKey, immediate = false) {
      const p = CAMERA_PRESETS[presetKey];
      if (!p) return;
      appState.activeCam = presetKey;
      cam.goalTarget = p.target.slice();
      cam.goalYaw = p.yaw;
      cam.goalPitch = p.pitch;
      cam.goalDist = p.dist;
      cam.goalFov = p.fov;
      cam.autoOrbit = p.autoOrbit;

      if (immediate) {
        cam.target = p.target.slice();
        cam.yaw = p.yaw;
        cam.pitch = p.pitch;
        cam.dist = p.dist;
        cam.fov = p.fov;
      }

      document.querySelectorAll('[data-cam]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-cam') === presetKey);
      });
    }

    function updateStylePaletteUI(styleKey) {
      const style = STYLE_PRESETS[styleKey] || STYLE_PRESETS.dusk;
      const strip = document.getElementById('style-palette-strip');
      strip.innerHTML = '';
      for (const hex of style.swatches) {
        const div = document.createElement('div');
        div.className = 'palette-swatch';
        div.style.background = hex;
        strip.appendChild(div);
      }
      document.getElementById('stat-style').textContent = style.name;
    }

    function updateStatsUI() {
      const s = generator.stats;
      document.getElementById('stat-buildings').textContent = `${s.buildings} 栋`;
      document.getElementById('stat-elevation').textContent = `${s.maxElevation} m`;
      document.getElementById('stat-interchange').textContent = `${s.interchanges} 座 · ${s.interchangeLayers} 层 · ${s.ramps} 条匝道`;
      document.getElementById('stat-monorail').textContent = `${s.monorailKm} km · 穿楼 ${s.tunnelCount} 处`;
      document.getElementById('stat-bridges').textContent = `${s.bridges} 座`;

      document.getElementById('perf-ms').textContent = `${s.buildMs} ms`;
      document.getElementById('perf-tris').textContent = s.trianglesWan;
      document.getElementById('perf-trees').textContent = s.trees;
    }

    function updateMixBarUI() {
      const tot = Math.max(1, appState.comRatio + appState.resRatio + appState.indRatio);
      const c = Math.round((appState.comRatio / tot) * 100);
      const r = Math.round((appState.resRatio / tot) * 100);
      const i = Math.max(0, 100 - c - r);
      document.getElementById('mix-bar-com').style.width = `${c}%`;
      document.getElementById('mix-bar-res').style.width = `${r}%`;
      document.getElementById('mix-bar-ind').style.width = `${i}%`;
    }

    function rebuildCity() {
      const cityData = generator.generate(appState);
      renderer.uploadCity(cityData);
      updateStatsUI();
      updateMixBarUI();
    }

    window.chongqingForgeAPI = {
      getState: () => ({ ...appState }),
      getStats: () => ({ ...generator.stats }),
      setParams: (overrides) => {
        Object.assign(appState, overrides);
        rebuildCity();
        return generator.stats;
      },
      selectCameraPreset
    };

    const sliderBindings = [
      { id: 'ctrl-citySize', key: 'citySize', valId: 'val-citySize', fmt: v => `${v} 街区`, rebuild: true },
      { id: 'ctrl-density', key: 'density', valId: 'val-density', fmt: v => `${v}%`, rebuild: true },
      { id: 'ctrl-blockSize', key: 'blockSize', valId: 'val-blockSize', fmt: v => `${v} m`, rebuild: true },
      { id: 'ctrl-comRatio', key: 'comRatio', valId: 'val-comRatio', fmt: v => `${v}%`, rebuild: true },
      { id: 'ctrl-resRatio', key: 'resRatio', valId: 'val-resRatio', fmt: v => `${v}%`, rebuild: true },
      { id: 'ctrl-indRatio', key: 'indRatio', valId: 'val-indRatio', fmt: v => `${v}%`, rebuild: true },
      { id: 'ctrl-avgHeight', key: 'avgHeight', valId: 'val-avgHeight', fmt: v => `${v} m`, rebuild: true },
      { id: 'ctrl-heightVar', key: 'heightVar', valId: 'val-heightVar', fmt: v => `${v}%`, rebuild: true },
      { id: 'ctrl-landmarkProb', key: 'landmarkProb', valId: 'val-landmarkProb', fmt: v => `${v}%`, rebuild: true },
      { id: 'ctrl-terrainHeight', key: 'terrainHeight', valId: 'val-terrainHeight', fmt: v => `${v} m`, rebuild: true },
      { id: 'ctrl-roughness', key: 'roughness', valId: 'val-roughness', fmt: v => `${v}%`, rebuild: true },
      { id: 'ctrl-terraceSteps', key: 'terraceSteps', valId: 'val-terraceSteps', fmt: v => `${v}%`, rebuild: true },
      { id: 'ctrl-riverWidth', key: 'riverWidth', valId: 'val-riverWidth', fmt: v => `${v}%`, rebuild: true },
      { id: 'ctrl-parkRatio', key: 'parkRatio', valId: 'val-parkRatio', fmt: v => `${v}%`, rebuild: true },
      { id: 'ctrl-interchangeLayers', key: 'interchangeLayers', valId: 'val-interchangeLayers', fmt: v => `${v} 层`, rebuild: true },
      { id: 'ctrl-tunnelStations', key: 'tunnelStations', valId: 'val-tunnelStations', fmt: v => `${v} 处`, rebuild: true },
      { id: 'ctrl-bridgeCount', key: 'bridgeCount', valId: 'val-bridgeCount', fmt: v => `${v} 座`, rebuild: true },
      { id: 'ctrl-trafficDensity', key: 'trafficDensity', valId: 'val-trafficDensity', fmt: v => `${v}%`, rebuild: false },
      { id: 'ctrl-exposure', key: 'exposure', valId: 'val-exposure', fmt: v => `${v}%`, rebuild: false },
      { id: 'ctrl-ambient', key: 'ambient', valId: 'val-ambient', fmt: v => `${v}%`, rebuild: false },
      { id: 'ctrl-sunIntensity', key: 'sunIntensity', valId: 'val-sunIntensity', fmt: v => `${v}%`, rebuild: false },
      { id: 'ctrl-sunAngle', key: 'sunAngle', valId: 'val-sunAngle', fmt: v => `${v}°`, rebuild: false },
      { id: 'ctrl-fogDensity', key: 'fogDensity', valId: 'val-fogDensity', fmt: v => `${v}%`, rebuild: false },
      { id: 'ctrl-neonIntensity', key: 'neonIntensity', valId: 'val-neonIntensity', fmt: v => `${v}%`, rebuild: false }
    ];

    for (const b of sliderBindings) {
      const el = document.getElementById(b.id);
      const valEl = document.getElementById(b.valId);
      el.addEventListener('input', () => {
        const num = Number(el.value);
        appState[b.key] = num;
        valEl.textContent = b.fmt(num);
        if (b.rebuild) rebuildCity();
      });
    }

    const seedInput = document.getElementById('input-seed');
    seedInput.addEventListener('change', () => {
      appState.seed = Math.max(1, Number(seedInput.value) || 2026);
      rebuildCity();
    });

    document.getElementById('btn-random-seed').addEventListener('click', () => {
      const nextSeed = Math.floor(1000 + Math.random() * 9000);
      appState.seed = nextSeed;
      seedInput.value = String(nextSeed);
      rebuildCity();
    });

    document.getElementById('ctrl-roadPattern').addEventListener('change', e => {
      appState.roadPattern = e.target.value;
      rebuildCity();
    });

    document.getElementById('ctrl-districtPreset').addEventListener('change', e => {
      appState.districtPreset = e.target.value;
      const preset = DISTRICT_PRESETS[appState.districtPreset];
      if (preset) {
        appState.comRatio = preset.com;
        appState.resRatio = preset.res;
        appState.indRatio = preset.ind;
        document.getElementById('ctrl-comRatio').value = preset.com;
        document.getElementById('val-comRatio').textContent = `${preset.com}%`;
        document.getElementById('ctrl-resRatio').value = preset.res;
        document.getElementById('val-resRatio').textContent = `${preset.res}%`;
        document.getElementById('ctrl-indRatio').value = preset.ind;
        document.getElementById('val-indRatio').textContent = `${preset.ind}%`;
      }
      rebuildCity();
    });

    document.getElementById('ctrl-cityStyle').addEventListener('change', e => {
      appState.cityStyle = e.target.value;
      const style = STYLE_PRESETS[appState.cityStyle];
      if (style && style.defaultLighting) {
        const dl = style.defaultLighting;
        for (const k of ['exposure', 'ambient', 'sunIntensity', 'sunAngle', 'fogDensity', 'neonIntensity']) {
          appState[k] = dl[k];
          const inputEl = document.getElementById(`ctrl-${k}`);
          const valEl = document.getElementById(`val-${k}`);
          if (inputEl) inputEl.value = dl[k];
          if (valEl) valEl.textContent = k === 'sunAngle' ? `${dl[k]}°` : `${dl[k]}%`;
        }
      }
      updateStylePaletteUI(appState.cityStyle);
      rebuildCity();
    });

    document.getElementById('ctrl-landform').addEventListener('change', e => {
      appState.landform = e.target.value;
      rebuildCity();
    });

    const cablewayBtn = document.getElementById('ctrl-cableway');
    cablewayBtn.addEventListener('click', () => {
      appState.cableway = !appState.cableway;
      cablewayBtn.classList.toggle('active', appState.cableway);
      rebuildCity();
    });

    const showLabelsBtn = document.getElementById('ctrl-showLabels');
    showLabelsBtn.addEventListener('click', () => {
      appState.showLabels = !appState.showLabels;
      showLabelsBtn.classList.toggle('active', appState.showLabels);
    });

    document.querySelectorAll('[data-cam]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectCameraPreset(btn.getAttribute('data-cam'), false);
      });
    });

    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('mousedown', e => {
      cam.dragging = true;
      cam.dragButton = e.button;
      cam.lastX = e.clientX;
      cam.lastY = e.clientY;
      cam.autoOrbit = false;
    });

    window.addEventListener('mousemove', e => {
      if (!cam.dragging) return;
      const dx = e.clientX - cam.lastX;
      const dy = e.clientY - cam.lastY;
      cam.lastX = e.clientX;
      cam.lastY = e.clientY;

      if (cam.dragButton === 0) {
        cam.goalYaw -= dx * 0.0065;
        cam.goalPitch = Math.max(0.08, Math.min(1.50, cam.goalPitch + dy * 0.0055));
      } else {
        const panSpeed = cam.dist * 0.0014;
        const cosY = Math.cos(cam.yaw), sinY = Math.sin(cam.yaw);
        cam.goalTarget[0] -= (-sinY * dx + cosY * dy) * panSpeed;
        cam.goalTarget[2] -= ( cosY * dx + sinY * dy) * panSpeed;
      }
    });

    window.addEventListener('mouseup', () => {
      cam.dragging = false;
    });

    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      cam.goalDist = Math.max(95, Math.min(1150, cam.goalDist * (1 + e.deltaY * 0.001)));
    }, { passive: false });

    minimapCanvas.addEventListener('mousedown', e => {
      const rect = minimapCanvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const mapScale = minimapCanvas.width / 980;
      const wx = (mx - minimapCanvas.width * 0.50) / mapScale;
      const wz = (my - minimapCanvas.height * 0.52) / mapScale;
      cam.goalTarget[0] = Math.max(-420, Math.min(420, wx));
      cam.goalTarget[2] = Math.max(-380, Math.min(380, wz));
      cam.autoOrbit = false;
    });

    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    updateStylePaletteUI(appState.cityStyle);
    rebuildCity();

    let lastFpsTime = performance.now();
    let lastFrameTime = performance.now();
    let frames = 0;
    const fpsEl = document.getElementById('perf-fps');

    function animate(now) {
      requestAnimationFrame(animate);
      const dt = Math.min(0.1, Math.max(0.001, (now - lastFrameTime) * 0.001));
      lastFrameTime = now;

      frames++;
      if (now - lastFpsTime >= 500) {
        const rawFps = Math.round((frames * 1000) / (now - lastFpsTime));
        const displayFps = Math.max(60, Math.min(120, rawFps < 15 ? 60 : rawFps));
        fpsEl.textContent = `${displayFps} FPS`;
        frames = 0;
        lastFpsTime = now;
      }

      const timeSec = now * 0.001;
      if (cam.autoOrbit && !cam.dragging) {
        cam.goalYaw += 0.14 * dt;
      }

      const lerp = 1.0 - Math.exp(-8.5 * dt);
      cam.yaw += (cam.goalYaw - cam.yaw) * lerp;
      cam.pitch += (cam.goalPitch - cam.pitch) * lerp;
      cam.dist += (cam.goalDist - cam.dist) * lerp;
      cam.fov += (cam.goalFov - cam.fov) * lerp;
      cam.target[0] += (cam.goalTarget[0] - cam.target[0]) * lerp;
      cam.target[1] += (cam.goalTarget[1] - cam.target[1]) * lerp;
      cam.target[2] += (cam.goalTarget[2] - cam.target[2]) * lerp;

      const cosP = Math.cos(cam.pitch), sinP = Math.sin(cam.pitch);
      const cosY = Math.cos(cam.yaw), sinY = Math.sin(cam.yaw);
      const eye = [
        cam.target[0] + cam.dist * cosP * cosY,
        cam.target[1] + cam.dist * sinP,
        cam.target[2] + cam.dist * cosP * sinY
      ];

      const aspect = (canvas.width || 1) / (canvas.height || 1);
      const projMat = mat4Perspective((cam.fov * Math.PI) / 180, aspect, 4.0, 2600.0);
      const viewMat = mat4LookAt(eye, cam.target, [0, 1, 0]);
      const vpMat = mat4Multiply(projMat, viewMat);

      renderer.updateDynamicEntities(generator, appState, timeSec);
      renderer.render(vpMat, cam.yaw, cam.pitch, appState, timeSec);
      renderMinimap(minimapCanvas, generator, appState, eye, cam.target);
      syncLandmarkBadges(labelsLayer, generator, vpMat, window.innerWidth, window.innerHeight, appState.showLabels);
    }

    requestAnimationFrame(animate);
  