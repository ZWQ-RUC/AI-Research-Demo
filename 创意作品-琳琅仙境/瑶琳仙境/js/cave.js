// ============================================================================
// Procedural Yaolin Wonderland Cave Generator (v3)
// ============================================================================
(function(global) {
  'use strict';

  const { createRNG, lerp, fbm3D, CatmullRomSpline3D } = global.CaveMath;
  const { Node3D, Mesh3D, createBufferGeometry, computeVertexNormals } = global.CaveEngine;
  const { CAVE_CONTROL_POINTS } = global.YaolinData;

  class YaolinCaveWorld {
    constructor(gl) {
      this.gl = gl;
      this.spline = new CatmullRomSpline3D(CAVE_CONTROL_POINTS);
      this.root = new Node3D();
      this.lights = [];
      this.particles = null;

      this.buildCaveShell(gl);
      this.buildWaterBodies(gl);
      this.buildIconicLandmarks(gl);
      this.buildSpeleothemForest(gl);
      this.buildVolumetricBeams(gl);
      this.buildLights();
      this.buildMistParticles(gl);
    }

    getFloorHeight(x, z) {
      const info = this.spline.findClosest(x, z);
      const s = info.sample;
      const lat = info.lateral;
      const rw = s.radiusW;
      const normLat = lat / rw;

      let h = s.y;
      h += fbm3D(x * 0.08, 0.0, z * 0.08, 3) * 0.38;

      if (s.t > 0.07 && s.t < 0.17 && normLat < -0.10) {
        const poolBlend = Math.sin(((s.t - 0.07) / 0.10) * Math.PI);
        const sideDepth = Math.min(1.0, (-normLat - 0.10) / 0.45);
        h -= poolBlend * sideDepth * 0.92;
      }

      if (s.t > 0.46 && s.t < 0.69 && normLat > 0.08) {
        const riverBlend = Math.sin(((s.t - 0.46) / 0.23) * Math.PI);
        const trench = Math.min(1.0, (normLat - 0.08) / 0.35);
        h -= riverBlend * trench * 1.45;
      }

      // Hall 3 (三十三重天): Stepped terraces on left hillside (Matches 8.png!)
      if (s.t > 0.73 && s.t < 0.97 && normLat < -0.10) {
        const hall3Blend = Math.sin(((s.t - 0.73) / 0.24) * Math.PI);
        const slope = Math.max(0, -normLat - 0.10);
        const rawRise = slope * 10.5;
        const terracedRise = rawRise + Math.sin(rawRise * 2.4) * 0.38;
        h += hall3Blend * terracedRise;
      }

      const edge = Math.max(0, Math.abs(normLat) - 0.76) / 0.24;
      h += edge * edge * 1.6;

      return h;
    }

    buildCaveShell(gl) {
      const lengthSteps = 190;
      const profileSteps = 34;
      const positions = [];
      const normals = [];
      const colors = [];
      const uvs = [];
      const indices = [];

      for (let i = 0; i <= lengthSteps; i++) {
        const t = i / lengthSteps;
        const s = this.spline.evaluate(t);

        let floorTint = [0.45, 0.40, 0.35];
        let wallTint  = [0.62, 0.60, 0.66];
        if (t < 0.21) {
          wallTint = [0.54, 0.66, 0.62];
        } else if (t < 0.46) {
          wallTint = [0.60, 0.62, 0.72];
        } else if (t < 0.74) {
          wallTint = [0.56, 0.58, 0.70];
        } else {
          wallTint = [0.66, 0.58, 0.66];
        }

        for (let j = 0; j <= profileSteps; j++) {
          const u = j / profileSteps;
          const angle = u * Math.PI * 2.0;
          const sinA = Math.sin(angle);
          const cosA = Math.cos(angle);

          const lat = sinA * s.radiusW;
          const wx = s.x + s.rx * lat;
          const wz = s.z + s.rz * lat;

          let wy;
          let col;
          let nx, ny, nz;

          if (cosA <= 0.08) {
            wy = this.getFloorHeight(wx, wz);
            if (cosA > -0.25) {
              const wallLift = ((cosA + 0.25) / 0.33) * s.heightH * 0.16;
              wy += wallLift;
            }
            const nVal = fbm3D(wx * 0.15, wy * 0.15, wz * 0.15, 3);
            col = [
              floorTint[0] * (0.92 + 0.18 * nVal),
              floorTint[1] * (0.92 + 0.18 * nVal),
              floorTint[2] * (0.92 + 0.18 * nVal)
            ];
            nx = -s.rx * sinA * 0.22;
            ny = 0.96;
            nz = -s.rz * sinA * 0.22;
          } else {
            const archH = Math.pow(cosA, 0.72) * s.heightH;
            const baseFloor = this.getFloorHeight(wx, wz);
            const karstDisp = fbm3D(wx * 0.11, archH * 0.11, wz * 0.11, 4) * 3.2;
            const stalRipple = (cosA > 0.55) ? Math.pow(Math.max(0, fbm3D(wx * 0.45, 1.2, wz * 0.45, 3)), 1.6) * 3.6 : 0.0;
            wy = baseFloor + archH + karstDisp - stalRipple;
            col = [
              wallTint[0] * (0.88 + 0.24 * cosA),
              wallTint[1] * (0.88 + 0.24 * cosA),
              wallTint[2] * (0.88 + 0.24 * cosA)
            ];
            nx = (s.x - wx) + (karstDisp * 0.35);
            ny = (s.y + s.heightH * 0.32 - wy);
            nz = (s.z - wz) + (karstDisp * 0.35);
          }

          const nLen = Math.hypot(nx, ny, nz) || 1;
          positions.push(wx, wy, wz);
          normals.push(nx / nLen, ny / nLen, nz / nLen);
          colors.push(col[0], col[1], col[2]);
          uvs.push(u, t * 20.0);
        }
      }

      const stride = profileSteps + 1;
      for (let i = 0; i < lengthSteps; i++) {
        for (let j = 0; j < profileSteps; j++) {
          const a = i * stride + j;
          const b = a + stride;
          const c = b + 1;
          const d = a + 1;
          indices.push(a, d, b);
          indices.push(b, d, c);
        }
      }

      const caveGeom = createBufferGeometry(gl, {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        colors: new Float32Array(colors),
        uvs: new Float32Array(uvs),
        indices: new Uint16Array(indices)
      });

      this.caveMesh = new Mesh3D(caveGeom, {
        type: 'karst',
        roughness: 0.44,
        subsurface: 0.35,
        fluting: 0.52,
        cullFace: false
      });
      this.root.add(this.caveMesh);
    }

    createSpeleothemGeometry(gl, opts) {
      const rng = createRNG(opts.seed || 101);
      const rings = opts.rings || 20;
      const segs = opts.segs || 20;
      const height = opts.height || 5.0;
      const rBot = opts.radiusBottom || 1.0;
      const rTop = opts.radiusTop !== undefined ? opts.radiusTop : 0.04;
      const pagoda = opts.pagodaRibs || 0.0;
      const fluteAmp = opts.flutingAmp || 0.16;
      const cBot = opts.colorBottom || [0.64, 0.58, 0.54];
      const cTop = opts.colorTop || [0.86, 0.82, 0.78];

      const positions = [];
      const colors = [];
      const uvs = [];
      const indices = [];

      const phaseOff = rng() * Math.PI * 2;
      for (let i = 0; i <= rings; i++) {
        const v = i / rings;
        const y = v * height;
        let rad = lerp(rBot, rTop, Math.pow(v, 0.85));
        if (pagoda > 0) {
          const tierPhase = v * opts.pagodaTiers * Math.PI * 2.0 + phaseOff;
          const tierLedge = Math.sin(tierPhase) + 0.35 * Math.sin(tierPhase * 2.0);
          rad *= (1.0 + pagoda * tierLedge * (1.0 - v * 0.35));
        }
        if (i === rings) rad = 0.01;

        const ringCol = [
          lerp(cBot[0], cTop[0], v),
          lerp(cBot[1], cTop[1], v),
          lerp(cBot[2], cTop[2], v)
        ];

        for (let j = 0; j <= segs; j++) {
          const u = j / segs;
          const theta = (j % segs) / segs * Math.PI * 2.0;
          const flute = 1.0 + fluteAmp * Math.sin(theta * 9.0 + v * 2.5 + phaseOff)
                            + (fluteAmp * 0.55) * Math.cos(theta * 16.0 - v * 3.0);
          const rFinal = Math.max(0.01, rad * flute);
          const px = Math.sin(theta) * rFinal;
          const pz = Math.cos(theta) * rFinal;

          positions.push(px, y, pz);
          colors.push(ringCol[0], ringCol[1], ringCol[2]);
          uvs.push(u, v);
        }
      }

      const stride = segs + 1;
      for (let i = 0; i < rings; i++) {
        for (let j = 0; j < segs; j++) {
          const a = i * stride + j;
          const b = a + stride;
          const c = b + 1;
          const d = a + 1;
          indices.push(a, b, d);
          indices.push(b, c, d);
        }
      }

      const posArr = new Float32Array(positions);
      const idxArr = new Uint16Array(indices);
      const normArr = computeVertexNormals(posArr, idxArr);
      return createBufferGeometry(gl, {
        positions: posArr,
        normals: normArr,
        colors: new Float32Array(colors),
        uvs: new Float32Array(uvs),
        indices: idxArr
      });
    }

    buildIconicLandmarks(gl) {
      // --- 1. 银河飞瀑 (Galaxy Stone Waterfall, Hall 1, t = 0.335, Matches 7.png!) ---
      const sWf = this.spline.evaluate(0.335);
      const wfWidth = 12.8;
      const wfHeight = 3.8;
      const cols = 64;
      const rows = 28;
      const wfPos = [];
      const wfCol = [];
      const wfUV = [];
      const wfIdx = [];

      // Position waterfall 11.5m ahead of Spot 7 so its full width & top cliff edge are in frame!
      const wfCenterX = sWf.x + sWf.tx * 11.5 + sWf.rx * 0.4;
      const wfCenterZ = sWf.z + sWf.tz * 11.5 + sWf.rz * 0.4;
      const wfBaseY = this.getFloorHeight(wfCenterX, wfCenterZ) + 2.1;

      for (let r = 0; r <= rows; r++) {
        const v = r / rows; // 0 = bottom icicle fringe, 1 = top horizontal cliff lip
        for (let c = 0; c <= cols; c++) {
          const u = c / cols;
          const uCentered = u - 0.5;
          // Fine vertical icicle stalactite fringes along the lower border (like 7.png!)
          const fineIcicles = (
            Math.sin(u * 95.0) * 0.28 +
            Math.cos(u * 160.0) * 0.18 +
            Math.sin(u * 38.0) * 0.35
          ) * Math.pow(1.0 - v, 1.4);
          // Central deeper V-cascade curtain drop (Matches 7.png!)
          const centerDrop = Math.exp(-uCentered * uCentered * 9.0) * 1.65 * (1.0 - v);
          const y = wfBaseY + v * wfHeight - centerDrop + fineIcicles;

          // Dense vertical flowstone pleats
          const foldZ = Math.sin(u * 78.0) * 0.25 + Math.cos(u * 140.0) * 0.14 + Math.sin(v * Math.PI) * 0.55;
          const curveX = uCentered * wfWidth;
          const curveZ = -Math.pow(uCentered * 2.0, 2.0) * 1.2 + foldZ;

          const wx = wfCenterX + sWf.rx * curveX - sWf.tx * curveZ;
          const wz = wfCenterZ + sWf.rz * curveX - sWf.tz * curveZ;

          wfPos.push(wx, y, wz);
          const flutingShade = 0.78 + 0.22 * Math.sin(u * 78.0);
          wfCol.push(flutingShade * 0.88, flutingShade * 0.93, flutingShade * 1.00);
          wfUV.push(u, v);
        }
      }

      const wfStride = cols + 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const a = r * wfStride + c;
          const b = a + wfStride;
          const d = a + 1;
          const e = b + 1;
          wfIdx.push(a, b, d);
          wfIdx.push(b, e, d);
        }
      }

      const wfPosArr = new Float32Array(wfPos);
      const wfIdxArr = new Uint16Array(wfIdx);
      const wfGeom = createBufferGeometry(gl, {
        positions: wfPosArr,
        normals: computeVertexNormals(wfPosArr, wfIdxArr),
        colors: new Float32Array(wfCol),
        uvs: new Float32Array(wfUV),
        indices: wfIdxArr
      });
      const wfMesh = new Mesh3D(wfGeom, {
        type: 'karst',
        roughness: 0.26,
        subsurface: 0.52,
        fluting: 0.90,
        cullFace: false
      });
      this.root.add(wfMesh);

      // --- 2. 擎天玉柱 (Sky-Supporting Jade Pillar, Hall 2, t = 0.715) ---
      const sPillar = this.spline.evaluate(0.715);
      const px = sPillar.x - sPillar.rx * 4.5;
      const pz = sPillar.z - sPillar.rz * 4.5;
      const py = this.getFloorHeight(px, pz) - 0.5;
      const pillarGeom = this.createSpeleothemGeometry(gl, {
        height: 22.0,
        radiusBottom: 2.3,
        radiusTop: 1.85,
        rings: 26,
        segs: 22,
        pagodaRibs: 0.14,
        pagodaTiers: 11,
        flutingAmp: 0.16,
        colorBottom: [0.72, 0.64, 0.54],
        colorTop: [0.86, 0.80, 0.70],
        seed: 715
      });
      const pillarMesh = new Mesh3D(pillarGeom, {
        type: 'karst',
        roughness: 0.34,
        subsurface: 0.45,
        fluting: 0.78
      });
      pillarMesh.position = [px, py, pz];
      pillarMesh.cullRadius = 110.0;
      this.root.add(pillarMesh);

      // --- 3. 瑶琳玉峰 (Yaolin Jade Peak Goddess Stalagmite, Hall 3, t = 0.955) ---
      const sPeak = this.spline.evaluate(0.955);
      const yx = sPeak.x;
      const yz = sPeak.z - 2.0;
      const yy = this.getFloorHeight(yx, yz) - 0.2;
      const peakGeom = this.createSpeleothemGeometry(gl, {
        height: 9.2,
        radiusBottom: 1.35,
        radiusTop: 0.22,
        rings: 24,
        segs: 20,
        pagodaRibs: 0.22,
        pagodaTiers: 9,
        flutingAmp: 0.18,
        colorBottom: [0.80, 0.76, 0.82],
        colorTop: [0.94, 0.92, 0.96],
        seed: 955
      });
      const peakMesh = new Mesh3D(peakGeom, {
        type: 'karst',
        roughness: 0.26,
        subsurface: 0.58,
        fluting: 0.82
      });
      peakMesh.position = [yx, yy, yz];
      peakMesh.cullRadius = 110.0;
      this.root.add(peakMesh);
    }

    buildSpeleothemForest(gl) {
      const rng = createRNG(20261116);

      const archetypes = [
        // 0: Tall fluted stalagmite
        this.createSpeleothemGeometry(gl, {
          height: 6.2, radiusBottom: 0.88, radiusTop: 0.04,
          rings: 20, segs: 18, pagodaRibs: 0.18, pagodaTiers: 7, flutingAmp: 0.20,
          colorBottom: [0.70, 0.64, 0.68], colorTop: [0.88, 0.84, 0.88], seed: 11
        }),
        // 1: Tiered Pagoda stalagmite
        this.createSpeleothemGeometry(gl, {
          height: 5.2, radiusBottom: 1.15, radiusTop: 0.06,
          rings: 22, segs: 18, pagodaRibs: 0.28, pagodaTiers: 6, flutingAmp: 0.16,
          colorBottom: [0.72, 0.66, 0.60], colorTop: [0.86, 0.82, 0.76], seed: 22
        }),
        // 2: Slender bamboo-shoot fluted stalagmite (三十三重天 dense cluster, Matches 8.png!)
        this.createSpeleothemGeometry(gl, {
          height: 4.8, radiusBottom: 0.44, radiusTop: 0.03,
          rings: 18, segs: 16, pagodaRibs: 0.24, pagodaTiers: 9, flutingAmp: 0.22,
          colorBottom: [0.76, 0.68, 0.78], colorTop: [0.92, 0.86, 0.94], seed: 33
        }),
        // 3: Hanging icicle stalactite from ceiling
        this.createSpeleothemGeometry(gl, {
          height: 4.0, radiusBottom: 0.36, radiusTop: 0.02,
          rings: 12, segs: 12, pagodaRibs: 0.10, pagodaTiers: 5, flutingAmp: 0.18,
          colorBottom: [0.68, 0.66, 0.74], colorTop: [0.86, 0.84, 0.90], seed: 44
        })
      ];

      const placeStalagmite = (x, z, archIdx, scaleXZ, scaleY) => {
        const y = this.getFloorHeight(x, z) - 0.25;
        const m = new Mesh3D(archetypes[archIdx], {
          type: 'karst',
          roughness: 0.36,
          subsurface: 0.42,
          fluting: 0.78
        });
        m.position = [x, y, z];
        m.rotation = [0, rng() * Math.PI * 2, 0];
        m.scale = [scaleXZ, scaleY, scaleXZ];
        m.cullRadius = 92.0;
        this.root.add(m);
      };

      const placeCeilingStalactite = (x, yCeil, z, scaleXZ, scaleY) => {
        const m = new Mesh3D(archetypes[3], {
          type: 'karst',
          roughness: 0.38,
          subsurface: 0.40,
          fluting: 0.70,
          cullFace: false
        });
        m.position = [x, yCeil, z];
        m.rotation = [Math.PI, rng() * Math.PI * 2, 0];
        m.scale = [scaleXZ, scaleY, scaleXZ];
        m.cullRadius = 85.0;
        this.root.add(m);
      };

      // --- A. Front Hall (前厅 · 江南水乡, Matches 9.png) ---
      const sFront = this.spline.evaluate(0.125);
      placeStalagmite(sFront.x + sFront.rx * 5.2, sFront.z + sFront.rz * 5.2 - 3.5, 1, 1.25, 1.28);
      placeStalagmite(sFront.x + sFront.rx * 6.8, sFront.z + sFront.rz * 6.8 - 1.5, 0, 0.90, 0.82);
      placeStalagmite(sFront.x - sFront.rx * 4.2, sFront.z - sFront.rz * 4.2 - 2.0, 2, 0.88, 0.62);
      placeStalagmite(sFront.x - sFront.rx * 3.8, sFront.z - sFront.rz * 3.8 - 11.5, 0, 1.10, 2.15);

      // --- B. Hall 1 (第一洞厅 · 仙女聚会 & 银河飞瀑, Matches 7.png!) ---
      const sH1 = this.spline.evaluate(0.335);
      const wfBaseX = sH1.x + sH1.tx * 9.5;
      const wfBaseZ = sH1.z + sH1.tz * 9.5;
      // Left cluster (rose-pink & violet stalagmites in 7.png)
      placeStalagmite(wfBaseX - sH1.rx * 4.8, wfBaseZ - sH1.rz * 4.8 + 1.5, 0, 1.15, 1.35);
      placeStalagmite(wfBaseX - sH1.rx * 6.2, wfBaseZ - sH1.rz * 6.2 + 2.2, 2, 0.95, 0.85);
      placeStalagmite(wfBaseX - sH1.rx * 7.5, wfBaseZ - sH1.rz * 7.5 + 1.8, 2, 0.85, 0.72);
      // Right cluster (warm gold & emerald green pagoda stalagmites in 7.png)
      placeStalagmite(wfBaseX + sH1.rx * 4.5, wfBaseZ + sH1.rz * 4.5 + 1.2, 0, 1.15, 1.12);
      placeStalagmite(wfBaseX + sH1.rx * 6.8, wfBaseZ + sH1.rz * 6.8 + 0.5, 1, 1.05, 1.25);
      placeStalagmite(wfBaseX + sH1.rx * 8.2, wfBaseZ + sH1.rz * 8.2 + 1.5, 2, 0.85, 0.88);

      // --- C. Hall 2 (第二洞厅 · 龙宫峡谷 & 地下河, Matches 10.png) ---
      const sH2 = this.spline.evaluate(0.555);
      placeStalagmite(sH2.x - sH2.rx * 4.5, sH2.z - sH2.rz * 4.5 - 3.0, 1, 1.48, 1.02);
      placeStalagmite(sH2.x - sH2.rx * 3.2, sH2.z - sH2.rz * 3.2 - 4.5, 0, 1.10, 0.92);
      placeStalagmite(sH2.x - sH2.rx * 6.5, sH2.z - sH2.rz * 6.5 - 6.0, 1, 1.30, 1.20);
      placeStalagmite(sH2.x + sH2.rx * 2.3, sH2.z + sH2.rz * 2.3 - 5.5, 0, 1.68, 1.82);
      placeStalagmite(sH2.x + sH2.rx * 2.0, sH2.z + sH2.rz * 2.0 - 3.8, 2, 1.12, 1.02);
      placeStalagmite(sH2.x - sH2.rx * 1.2, sH2.z - sH2.rz * 1.2 - 14.0, 0, 1.08, 1.22);

      // --- D. Hall 3 (第三洞厅 · 三十三重天, Matches 8.png!) ---
      // Grand panoramic amphitheater of 165+ layered stalagmites across left, center-ahead, and right terraces
      for (let i = 0; i < 165; i++) {
        const t = 0.808 + (i / 165) * 0.14;
        const s = this.spline.evaluate(t);
        const tier = (i % 6);
        // Span across the entire panoramic backdrop from left (-16m) through center (0m) to right (+11m)
        const spanU = ((i * 0.61803398875) % 1.0);
        const lat = -16.0 + spanU * 27.0;
        // Leave a narrow 3.2m walkable path channel around lat=1.2 for Dahuang at t < 0.825
        if (t < 0.825 && Math.abs(lat - 1.2) < 2.8) continue;
        const along = (rng() - 0.5) * 4.2;
        const wx = s.x + s.rx * lat + s.tx * along;
        const wz = s.z + s.rz * lat + s.tz * along;
        const arch = (i % 6 === 0) ? 0 : ((i % 4 === 0) ? 1 : 2);
        const scXZ = 0.44 + rng() * 0.48 + (i % 11 === 0 ? 0.45 : 0.0);
        const scY  = 0.48 + rng() * 0.78 + tier * 0.12;
        placeStalagmite(wx, wz, arch, scXZ, scY);

        if (i % 2 === 0) {
          const cy = this.getFloorHeight(wx, wz) + 5.2 + rng() * 3.8;
          placeCeilingStalactite(wx, cy, wz, 0.48 + rng() * 0.48, 0.65 + rng() * 0.90);
        }
      }
      const sH3 = this.spline.evaluate(0.815);
      placeStalagmite(sH3.x + sH3.rx * 6.5, sH3.z + sH3.rz * 6.5 - 3.5, 0, 1.25, 1.55);

      // --- E. General Cave Corridor Stalagmites & Ceiling Stalactites ---
      for (let i = 0; i < 75; i++) {
        const t = 0.04 + (i / 75) * 0.93;
        const s = this.spline.evaluate(t);
        const side = (i % 2 === 0) ? -1 : 1;
        if (t > 0.47 && t < 0.68 && side > 0 && (i % 3 !== 0)) continue;
        if (t > 0.74 && t < 0.86 && side > 0) continue;
        const lat = side * (s.radiusW * (0.40 + rng() * 0.42));
        const wx = s.x + s.rx * lat;
        const wz = s.z + s.rz * lat;
        const arch = Math.floor(rng() * 3);
        placeStalagmite(wx, wz, arch, 0.65 + rng() * 0.65, 0.65 + rng() * 0.85);

        const ceilLat = (rng() - 0.5) * s.radiusW * 1.25;
        const cx = s.x + s.rx * ceilLat;
        const cz = s.z + s.rz * ceilLat;
        const cy = s.y + s.heightH * (0.76 + rng() * 0.18);
        placeCeilingStalactite(cx, cy, cz, 0.48 + rng() * 0.65, 0.60 + rng() * 1.05);
      }
    }

    buildWaterBodies(gl) {
      const buildWaterRibbon = (tStart, tEnd, steps, latMin, latMax, yOffset, baseCol) => {
        const positions = [];
        const normals = [];
        const colors = [];
        const uvs = [];
        const indices = [];

        for (let i = 0; i <= steps; i++) {
          const u = i / steps;
          const t = lerp(tStart, tEnd, u);
          const s = this.spline.evaluate(t);
          const l0 = latMin * s.radiusW;
          const l1 = latMax * s.radiusW;

          const x0 = s.x + s.rx * l0, z0 = s.z + s.rz * l0;
          const x1 = s.x + s.rx * l1, z1 = s.z + s.rz * l1;
          const y = s.y + yOffset;

          positions.push(x0, y, z0, x1, y, z1);
          normals.push(0, 1, 0, 0, 1, 0);
          colors.push(baseCol[0], baseCol[1], baseCol[2], baseCol[0], baseCol[1], baseCol[2]);
          uvs.push(0, u * 6.0, 1, u * 6.0);
        }

        for (let i = 0; i < steps; i++) {
          const a = i * 2;
          const b = a + 1;
          const c = a + 2;
          const d = a + 3;
          indices.push(a, c, b);
          indices.push(b, c, d);
        }

        const geom = createBufferGeometry(gl, {
          positions: new Float32Array(positions),
          normals: new Float32Array(normals),
          colors: new Float32Array(colors),
          uvs: new Float32Array(uvs),
          indices: new Uint16Array(indices)
        });
        const mesh = new Mesh3D(geom, {
          type: 'water',
          transparent: true,
          opacity: 0.88,
          cullFace: false
        });
        this.root.add(mesh);
      };

      buildWaterRibbon(0.08, 0.165, 24, -0.82, -0.14, -0.42, [0.14, 0.65, 0.58]);
      buildWaterRibbon(0.31, 0.365, 20, -0.15, 0.65, -0.15, [0.16, 0.58, 0.72]);
      buildWaterRibbon(0.465, 0.685, 45, 0.10, 0.85, -0.78, [0.16, 0.68, 0.85]);
    }

    buildVolumetricBeams(gl) {
      const createConeBeam = (xTop, yTop, zTop, xBot, yBot, zBot, rTop, rBot, col, opacity) => {
        const segs = 24;
        const positions = [];
        const normals = [];
        const colors = [];
        const uvs = [];
        const indices = [];

        for (let i = 0; i <= 1; i++) {
          const v = i;
          const cx = lerp(xBot, xTop, v);
          const cy = lerp(yBot, yTop, v);
          const cz = lerp(zBot, zTop, v);
          const rad = lerp(rBot, rTop, v);

          for (let j = 0; j <= segs; j++) {
            const u = j / segs;
            const th = u * Math.PI * 2.0;
            const nx = Math.sin(th);
            const nz = Math.cos(th);
            positions.push(cx + nx * rad, cy, cz + nz * rad);
            normals.push(nx, 0.15, nz);
            colors.push(col[0], col[1], col[2]);
            uvs.push(u, v);
          }
        }

        const stride = segs + 1;
        for (let j = 0; j < segs; j++) {
          const a = j;
          const b = j + stride;
          const c = b + 1;
          const d = j + 1;
          indices.push(a, b, d);
          indices.push(b, c, d);
        }

        const geom = createBufferGeometry(gl, {
          positions: new Float32Array(positions),
          normals: new Float32Array(normals),
          colors: new Float32Array(colors),
          uvs: new Float32Array(uvs),
          indices: new Uint16Array(indices)
        });
        const mesh = new Mesh3D(geom, {
          type: 'beam',
          transparent: true,
          additive: true,
          opacity: opacity,
          cullFace: false
        });
        this.root.add(mesh);
      };

      const sBeam2 = this.spline.evaluate(0.575);
      createConeBeam(
        sBeam2.x - 4.2, sBeam2.y + 18.5, sBeam2.z - 6.0,
        sBeam2.x - 0.8, sBeam2.y + 0.5,  sBeam2.z - 2.0,
        0.55, 2.35,
        [0.98, 0.90, 0.72], 0.45
      );

      const sBeam1 = this.spline.evaluate(0.350);
      createConeBeam(
        sBeam1.x + 1.0, sBeam1.y + 20.0, sBeam1.z,
        sBeam1.x + 0.5, sBeam1.y + 0.5,  sBeam1.z,
        0.95, 3.8,
        [0.78, 0.94, 1.00], 0.34
      );
    }

    buildLights() {
      const addLight = (t, latOffset, yOffset, r, g, b, radius) => {
        const s = this.spline.evaluate(t);
        const x = s.x + s.rx * latOffset;
        const z = s.z + s.rz * latOffset;
        const y = this.getFloorHeight(x, z) + yOffset;
        this.lights.push({ x, y, z, r, g, b, radius });
      };

      addLight(0.015,  3.5, 5.5,  0.86, 0.66, 0.32, 28.0);
      addLight(0.045, -4.5, 6.0,  0.52, 0.38, 0.74, 26.0);

      // Front Hall: Jiangnan Water Town (Matches 9.png)
      addLight(0.115, -5.5, 4.2,  0.10, 0.88, 0.64, 30.0);
      addLight(0.130, -3.2, 2.5,  0.20, 0.86, 0.78, 26.0);
      addLight(0.125,  5.5, 4.5,  0.88, 0.64, 0.26, 28.0);
      addLight(0.175,  0.0, 5.5,  0.68, 0.54, 0.84, 28.0);

      // Hall 1: Fairy Gathering & Galaxy Waterfall (Matches 7.png)
      addLight(0.245, -4.0, 6.5,  0.22, 0.78, 0.86, 34.0);
      addLight(0.285,  5.0, 6.5,  0.82, 0.42, 0.74, 32.0);
      addLight(0.352,  0.5, 4.5,  0.82, 0.92, 1.00, 36.0);
      addLight(0.348, -5.5, 3.8,  0.86, 0.44, 0.74, 28.0);
      addLight(0.352,  5.5, 3.8,  0.90, 0.68, 0.30, 28.0);
      addLight(0.360,  8.8, 4.5,  0.24, 0.88, 0.56, 30.0);
      addLight(0.415, -3.5, 5.5,  0.40, 0.74, 0.90, 32.0);

      // Hall 2: Dragon Palace Canyon & Underground River (Matches 10.png)
      addLight(0.510,  4.8, 3.5,  0.18, 0.82, 0.94, 32.0);
      addLight(0.545, -4.5, 4.5,  0.74, 0.52, 0.82, 28.0);
      addLight(0.558,  2.2, 5.5,  0.14, 0.86, 0.58, 30.0);
      addLight(0.570,  5.5, 2.5,  0.20, 0.84, 0.96, 34.0);
      addLight(0.580, -1.5, 6.0,  0.92, 0.80, 0.54, 30.0);
      addLight(0.640,  4.5, 3.5,  0.18, 0.78, 0.92, 32.0);
      addLight(0.715, -3.5, 7.5,  0.90, 0.70, 0.38, 38.0);

      // Hall 3: Thirty-Three Heavens (Matches 8.png!)
      addLight(0.785, -5.5, 4.5,  0.88, 0.42, 0.74, 38.0);
      addLight(0.810, -10.0, 7.5, 0.72, 0.46, 0.92, 40.0);
      addLight(0.820,  3.5, 8.5,  0.28, 0.92, 0.36, 38.0);
      addLight(0.845, -4.0, 5.0,  0.92, 0.62, 0.36, 36.0);
      addLight(0.885, -8.0, 7.0,  0.82, 0.44, 0.78, 36.0);
      addLight(0.920,  4.0, 6.0,  0.30, 0.84, 0.72, 34.0);
      addLight(0.955,  0.0, 6.5,  0.92, 0.88, 0.80, 36.0);
    }

    buildMistParticles(gl) {
      const rng = createRNG(8888);
      const count = 220;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const sizes = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        const t = rng();
        const s = this.spline.evaluate(t);
        const lat = (rng() - 0.5) * s.radiusW * 1.35;
        const wx = s.x + s.rx * lat;
        const wz = s.z + s.rz * lat;
        const wy = this.getFloorHeight(wx, wz) + 0.5 + rng() * (s.heightH * 0.55);

        positions[i * 3] = wx;
        positions[i * 3 + 1] = wy;
        positions[i * 3 + 2] = wz;

        sizes[i] = 2.0 + rng() * 2.8;

        if (t < 0.21) {
          colors[i * 3] = 0.65; colors[i * 3 + 1] = 0.96; colors[i * 3 + 2] = 0.84;
        } else if (t < 0.46) {
          colors[i * 3] = 0.90; colors[i * 3 + 1] = 0.94; colors[i * 3 + 2] = 1.00;
        } else if (t < 0.74) {
          colors[i * 3] = 0.60; colors[i * 3 + 1] = 0.92; colors[i * 3 + 2] = 0.98;
        } else {
          colors[i * 3] = 0.96; colors[i * 3 + 1] = 0.82; colors[i * 3 + 2] = 0.72;
        }
      }

      const posBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

      const colBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
      gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

      const sizeBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuf);
      gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.STATIC_DRAW);

      this.particles = { posBuf, colBuf, sizeBuf, count };
    }
  }

  global.YaolinCaveWorld = YaolinCaveWorld;
})(window);
