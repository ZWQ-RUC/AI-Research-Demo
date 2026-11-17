// ============================================================================
// Procedural 3D Chinese Pastoral Dog ("大黄" / 中华田园犬)
// True 3D Tangent-Aligned Lofted Anatomy (Full 3D volume from all angles),
// Articulated Limbs, Upright Ears, Expressive Snout/Eyes/Jaw & Sniffing Pose
// ============================================================================
(function(global) {
  'use strict';

  const { Node3D, Mesh3D, createBufferGeometry } = global.CaveEngine;

  const COL_DORSAL_GOLD = [0.78, 0.51, 0.21];   // Warm golden-ochre dorsal coat
  const COL_SIDE_AMBER  = [0.84, 0.59, 0.28];   // Golden-yellow flanks
  const COL_BELLY_CREAM = [0.92, 0.84, 0.70];   // Soft cream-white chest/belly/inner legs
  const COL_PAW_SOCK    = [0.91, 0.85, 0.74];   // Light cream paws
  const COL_EAR_INNER   = [0.86, 0.67, 0.58];   // Warm pinkish-buff inner ear
  const COL_MUZZLE_DARK = [0.56, 0.36, 0.16];   // Shaded dorsal snout bridge
  const COL_NOSE_BLACK  = [0.08, 0.07, 0.07];   // Moist black nose leather
  const COL_EYE_DARK    = [0.09, 0.05, 0.03];   // Deep dark brown eyes

  function mixColor(c1, c2, t) {
    const u = Math.max(0, Math.min(1, t));
    return [
      c1[0] + (c2[0] - c1[0]) * u,
      c1[1] + (c2[1] - c1[1]) * u,
      c1[2] + (c2[2] - c1[2]) * u
    ];
  }

  // True 3D Tangent-Frame Lofted Tube Builder!
  // At every ring i, computes the 3D spine tangent T = normalize(P[i+1] - P[i-1]),
  // a horizontal lateral basis vector R = normalize(cross(T, refUp)) (always along X),
  // and a sagittal dorsal/anterior basis vector U = cross(R, T).
  // Thus `rx` is ALWAYS lateral width (X) and `ry` is ALWAYS sagittal depth/thickness (Y/Z),
  // whether the bone runs horizontally (torso/head), vertically (legs/ears), or curves (tail)!
  function buildLoftedMesh(gl, rings, segsAround) {
    segsAround = segsAround || 22;
    const ringCount = rings.length;
    const positions = [];
    const normals = [];
    const colors = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i < ringCount; i++) {
      const r = rings[i];
      const rPrev = rings[Math.max(0, i - 1)];
      const rNext = rings[Math.min(ringCount - 1, i + 1)];
      const v = i / Math.max(1, ringCount - 1);

      // 3D Spine tangent T
      let tx = rNext.x - rPrev.x;
      let ty = rNext.y - rPrev.y;
      let tz = rNext.z - rPrev.z;
      let tLen = Math.hypot(tx, ty, tz);
      if (tLen < 0.0001) { tx = 0; ty = 0; tz = -1; tLen = 1; }
      tx /= tLen; ty /= tLen; tz /= tLen;

      // Lateral right vector B = (+1, 0, 0) orthogonalized against T
      // And sagittal vector N_up = cross(T, B) so it lies in the YZ sagittal plane!
      let bx = 1.0, by = 0.0, bz = 0.0;
      const dotTB = tx * bx + ty * by + tz * bz;
      bx -= dotTB * tx; by -= dotTB * ty; bz -= dotTB * tz;
      const bLen = Math.hypot(bx, by, bz) || 1;
      bx /= bLen; by /= bLen; bz /= bLen;

      let ux = ty * bz - tz * by;
      let uy = tz * bx - tx * bz;
      let uz = tx * by - ty * bx;
      if (i === 0) {
        if (uy < -0.1 || (Math.abs(uy) <= 0.1 && uz > 0)) {
          ux = -ux; uy = -uy; uz = -uz;
        }
        rings._prevU = [ux, uy, uz];
      } else {
        const pu = rings._prevU;
        if (ux * pu[0] + uy * pu[1] + uz * pu[2] < 0) {
          ux = -ux; uy = -uy; uz = -uz;
        }
        rings._prevU = [ux, uy, uz];
      }

      const topC = r.topCol || COL_DORSAL_GOLD;
      const midC = r.midCol || COL_SIDE_AMBER;
      const botC = r.botCol || COL_BELLY_CREAM;

      for (let j = 0; j <= segsAround; j++) {
        const u = j / segsAround;
        const theta = (j % segsAround) / segsAround * Math.PI * 2.0;
        const sinT = Math.sin(theta); // Lateral (+X / -X)
        const cosT = Math.cos(theta); // Sagittal (+U dorsal/anterior / -U ventral/posterior)

        let rxMod = r.rx;
        let ryMod = r.ry;
        if (r.pinchTop && cosT > 0) {
          rxMod *= (1.0 - r.pinchTop * cosT * cosT);
        }
        if (r.cheekBulge && Math.abs(cosT) < 0.65) {
          rxMod *= (1.0 + r.cheekBulge * (1.0 - Math.abs(cosT)));
        }
        if (r.flatBottom && cosT < -0.3) {
          ryMod *= (1.0 - r.flatBottom * (-cosT - 0.3));
        }

        const offX = bx * (sinT * rxMod) + ux * (cosT * ryMod);
        const offY = by * (sinT * rxMod) + uy * (cosT * ryMod);
        const offZ = bz * (sinT * rxMod) + uz * (cosT * ryMod);

        positions.push(r.x + offX, r.y + offY, r.z + offZ);
        uvs.push(u, v);

        // Smooth radial normal
        let nx = bx * (sinT / Math.max(0.01, rxMod)) + ux * (cosT / Math.max(0.01, ryMod));
        let ny = by * (sinT / Math.max(0.01, rxMod)) + uy * (cosT / Math.max(0.01, ryMod));
        let nz = bz * (sinT / Math.max(0.01, rxMod)) + uz * (cosT / Math.max(0.01, ryMod));
        if (i === 0 && r.rx < 0.012) { nx -= tx * 1.5; ny -= ty * 1.5; nz -= tz * 1.5; }
        if (i === ringCount - 1 && r.rx < 0.012) { nx += tx * 1.5; ny += ty * 1.5; nz += tz * 1.5; }
        const nLen = Math.hypot(nx, ny, nz) || 1;
        normals.push(nx / nLen, ny / nLen, nz / nLen);

        let c;
        if (cosT >= 0.15) {
          c = mixColor(midC, topC, (cosT - 0.15) / 0.85);
        } else if (cosT >= -0.35) {
          c = mixColor(botC, midC, (cosT + 0.35) / 0.50);
        } else {
          c = botC;
        }
        colors.push(c[0], c[1], c[2]);
      }
    }

    const stride = segsAround + 1;
    for (let i = 0; i < ringCount - 1; i++) {
      for (let j = 0; j < segsAround; j++) {
        const a = i * stride + j;
        const b = a + stride;
        const c = b + 1;
        const d = a + 1;
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    return createBufferGeometry(gl, {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      colors: new Float32Array(colors),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(indices)
    });
  }

  function createShadowQuad(gl, rx, rz) {
    const positions = new Float32Array([
      -rx, 0.03, -rz,
       rx, 0.03, -rz,
       rx, 0.03,  rz,
      -rx, 0.03,  rz
    ]);
    const normals = new Float32Array([0,1,0, 0,1,0, 0,1,0, 0,1,0]);
    const colors = new Float32Array([0,0,0, 0,0,0, 0,0,0, 0,0,0]);
    const uvs = new Float32Array([0,0, 1,0, 1,1, 0,1]);
    const indices = new Uint16Array([0, 2, 1, 0, 3, 2]);
    return createBufferGeometry(gl, { positions, normals, colors, uvs, indices });
  }

  class PastoralDog {
    constructor(gl) {
      this.gl = gl;
      this.root = new Node3D();
      this.bodyNode = new Node3D();
      this.bodyNode.position = [0, 0.72, 0];
      this.root.add(this.bodyNode);

      this.shadowMesh = new Mesh3D(createShadowQuad(gl, 0.72, 1.08), {
        type: 'shadow',
        transparent: true,
        opacity: 0.58,
        cullFace: false
      });
      this.root.add(this.shadowMesh);

      this.buildTorso(gl);
      this.buildNeckAndHead(gl);
      this.buildTail(gl);
      this.buildLegs(gl);

      this.animTime = 0;
      this.idleTimer = 2.2;
      this.sniffWeight = 0;
    }

    buildTorso(gl) {
      const torsoRings = [
        { x: 0, y:  0.02, z:  0.58, rx: 0.005, ry: 0.005, topCol: COL_DORSAL_GOLD, botCol: COL_BELLY_CREAM },
        { x: 0, y:  0.03, z:  0.54, rx: 0.12, ry: 0.13, topCol: COL_DORSAL_GOLD, botCol: COL_BELLY_CREAM },
        { x: 0, y:  0.04, z:  0.45, rx: 0.19, ry: 0.20, topCol: COL_DORSAL_GOLD, botCol: COL_BELLY_CREAM },
        { x: 0, y:  0.04, z:  0.32, rx: 0.21, ry: 0.22, topCol: COL_DORSAL_GOLD, botCol: COL_BELLY_CREAM },
        { x: 0, y:  0.03, z:  0.14, rx: 0.20, ry: 0.21, topCol: COL_DORSAL_GOLD, botCol: COL_BELLY_CREAM },
        { x: 0, y:  0.01, z: -0.05, rx: 0.23, ry: 0.26, topCol: COL_DORSAL_GOLD, botCol: COL_BELLY_CREAM },
        { x: 0, y:  0.00, z: -0.25, rx: 0.24, ry: 0.28, topCol: COL_DORSAL_GOLD, botCol: COL_BELLY_CREAM },
        { x: 0, y:  0.03, z: -0.43, rx: 0.22, ry: 0.25, topCol: COL_DORSAL_GOLD, botCol: COL_BELLY_CREAM },
        { x: 0, y:  0.06, z: -0.54, rx: 0.15, ry: 0.17, topCol: COL_DORSAL_GOLD, botCol: COL_BELLY_CREAM },
        { x: 0, y:  0.07, z: -0.58, rx: 0.005, ry: 0.005, topCol: COL_BELLY_CREAM, botCol: COL_BELLY_CREAM }
      ];
      this.torsoMesh = new Mesh3D(buildLoftedMesh(gl, torsoRings, 24), { type: 'dog', roughness: 0.68, cullFace: false });
      this.bodyNode.add(this.torsoMesh);
    }

    buildNeckAndHead(gl) {
      this.neckPivot = new Node3D();
      this.neckPivot.position = [0, 0.10, -0.42];
      this.bodyNode.add(this.neckPivot);

      const neckRings = [
        { x: 0, y: -0.04, z:  0.05, rx: 0.006, ry: 0.006, topCol: COL_DORSAL_GOLD, botCol: COL_BELLY_CREAM },
        { x: 0, y: -0.01, z:  0.02, rx: 0.175, ry: 0.195, topCol: COL_DORSAL_GOLD, botCol: COL_BELLY_CREAM },
        { x: 0, y:  0.09, z: -0.06, rx: 0.158, ry: 0.175, topCol: COL_DORSAL_GOLD, botCol: COL_BELLY_CREAM },
        { x: 0, y:  0.19, z: -0.14, rx: 0.140, ry: 0.155, topCol: COL_DORSAL_GOLD, botCol: COL_BELLY_CREAM },
        { x: 0, y:  0.26, z: -0.20, rx: 0.125, ry: 0.138, topCol: COL_DORSAL_GOLD, botCol: COL_BELLY_CREAM },
        { x: 0, y:  0.28, z: -0.22, rx: 0.006, ry: 0.006, topCol: COL_DORSAL_GOLD, botCol: COL_BELLY_CREAM }
      ];
      const neckMesh = new Mesh3D(buildLoftedMesh(gl, neckRings, 20), { type: 'dog', roughness: 0.68, cullFace: false });
      this.neckPivot.add(neckMesh);

      this.headPivot = new Node3D();
      this.headPivot.position = [0, 0.25, -0.18];
      this.neckPivot.add(this.headPivot);

      // Cranium + Forehead Stop + Tapered Muzzle + Wet Black Nose Tip
      const headRings = [
        { x: 0, y:  0.01, z:  0.13, rx: 0.005, ry: 0.005, topCol: COL_DORSAL_GOLD, botCol: COL_BELLY_CREAM },
        { x: 0, y:  0.02, z:  0.10, rx: 0.125, ry: 0.122, topCol: COL_DORSAL_GOLD, botCol: COL_BELLY_CREAM },
        { x: 0, y:  0.04, z:  0.03, rx: 0.158, ry: 0.152, topCol: COL_DORSAL_GOLD, botCol: COL_BELLY_CREAM, cheekBulge: 0.14 },
        { x: 0, y:  0.04, z: -0.05, rx: 0.152, ry: 0.146, topCol: COL_DORSAL_GOLD, botCol: COL_BELLY_CREAM, cheekBulge: 0.12 },
        { x: 0, y:  0.02, z: -0.13, rx: 0.126, ry: 0.122, topCol: COL_DORSAL_GOLD, botCol: COL_BELLY_CREAM, pinchTop: 0.08 },
        { x: 0, y: -0.015, z: -0.19, rx: 0.090, ry: 0.088, topCol: COL_MUZZLE_DARK, midCol: COL_SIDE_AMBER, botCol: COL_BELLY_CREAM, flatBottom: 0.25 },
        { x: 0, y: -0.028, z: -0.28, rx: 0.070, ry: 0.068, topCol: COL_MUZZLE_DARK, midCol: COL_SIDE_AMBER, botCol: COL_BELLY_CREAM, flatBottom: 0.28 },
        { x: 0, y: -0.034, z: -0.36, rx: 0.052, ry: 0.052, topCol: COL_MUZZLE_DARK, midCol: COL_BELLY_CREAM, botCol: COL_BELLY_CREAM },
        { x: 0, y: -0.032, z: -0.405, rx: 0.042, ry: 0.038, topCol: COL_NOSE_BLACK, midCol: COL_NOSE_BLACK, botCol: COL_NOSE_BLACK },
        { x: 0, y: -0.032, z: -0.420, rx: 0.005, ry: 0.005, topCol: COL_NOSE_BLACK, midCol: COL_NOSE_BLACK, botCol: COL_NOSE_BLACK }
      ];
      const skullMesh = new Mesh3D(buildLoftedMesh(gl, headRings, 22), { type: 'dog', roughness: 0.64, cullFace: false });
      this.headPivot.add(skullMesh);

      // Articulated Lower Jaw
      this.jawPivot = new Node3D();
      this.jawPivot.position = [0, -0.052, -0.14];
      this.headPivot.add(this.jawPivot);

      const jawRings = [
        { x: 0, y:  0.00, z:  0.01, rx: 0.004, ry: 0.004, topCol: COL_BELLY_CREAM, botCol: COL_BELLY_CREAM },
        { x: 0, y:  0.00, z: -0.01, rx: 0.074, ry: 0.036, topCol: COL_BELLY_CREAM, botCol: COL_BELLY_CREAM },
        { x: 0, y:  0.002, z: -0.12, rx: 0.056, ry: 0.030, topCol: COL_BELLY_CREAM, botCol: COL_BELLY_CREAM },
        { x: 0, y:  0.006, z: -0.22, rx: 0.036, ry: 0.022, topCol: COL_BELLY_CREAM, botCol: COL_BELLY_CREAM },
        { x: 0, y:  0.008, z: -0.24, rx: 0.004, ry: 0.004, topCol: COL_BELLY_CREAM, botCol: COL_BELLY_CREAM }
      ];
      const jawMesh = new Mesh3D(buildLoftedMesh(gl, jawRings, 14), { type: 'dog', roughness: 0.62, cullFace: false });
      this.jawPivot.add(jawMesh);

      // Expressive Almond Eyes
      const buildEye = (side) => {
        const eyeRings = [
          { x: 0, y: 0, z:  0.018, rx: 0.002, ry: 0.002, topCol: COL_EYE_DARK, midCol: COL_EYE_DARK, botCol: COL_EYE_DARK },
          { x: 0, y: 0, z:  0.000, rx: 0.021, ry: 0.018, topCol: COL_EYE_DARK, midCol: COL_EYE_DARK, botCol: COL_EYE_DARK },
          { x: 0, y: 0, z: -0.018, rx: 0.002, ry: 0.002, topCol: COL_EYE_DARK, midCol: COL_EYE_DARK, botCol: COL_EYE_DARK }
        ];
        const eyeMesh = new Mesh3D(buildLoftedMesh(gl, eyeRings, 12), { type: 'dog', roughness: 0.08, cullFace: false });
        eyeMesh.position = [side * 0.082, 0.026, -0.148];
        eyeMesh.rotation = [0.08, side * (-0.42), 0];
        this.headPivot.add(eyeMesh);
      };
      buildEye(-1);
      buildEye(1);

      // Upright Triangular Ears (中华田园犬立耳 — Full 3D Conical Volume!)
      const buildEar = (side) => {
        const earPivot = new Node3D();
        earPivot.position = [side * 0.095, 0.11, 0.01];
        earPivot.rotation = [0.18, side * (-0.22), side * (-0.16)];

        const earRings = [
          { x: 0, y: 0.00, z:  0.00,  rx: 0.005, ry: 0.005, topCol: COL_EAR_INNER, botCol: COL_DORSAL_GOLD },
          { x: 0, y: 0.02, z:  0.00,  rx: 0.056, ry: 0.042, topCol: COL_EAR_INNER, midCol: COL_SIDE_AMBER, botCol: COL_DORSAL_GOLD },
          { x: 0, y: 0.09, z: -0.01,  rx: 0.048, ry: 0.034, topCol: COL_EAR_INNER, midCol: COL_SIDE_AMBER, botCol: COL_DORSAL_GOLD },
          { x: 0, y: 0.16, z: -0.02,  rx: 0.030, ry: 0.022, topCol: COL_EAR_INNER, midCol: COL_SIDE_AMBER, botCol: COL_DORSAL_GOLD },
          { x: 0, y: 0.21, z: -0.025, rx: 0.004, ry: 0.004, topCol: COL_MUZZLE_DARK, midCol: COL_DORSAL_GOLD, botCol: COL_DORSAL_GOLD }
        ];
        const earMesh = new Mesh3D(buildLoftedMesh(gl, earRings, 14), { type: 'dog', roughness: 0.68, cullFace: false });
        earPivot.add(earMesh);
        this.headPivot.add(earPivot);
        return earPivot;
      };
      this.leftEar = buildEar(-1);
      this.rightEar = buildEar(1);
    }

    buildTail(gl) {
      // Fluffy Sickle/Curled Tail (金钱尾/镰刀尾) with full 3D brush thickness from side & back!
      this.tailPivot = new Node3D();
      this.tailPivot.position = [0, 0.09, 0.46];
      this.bodyNode.add(this.tailPivot);

      const tailRings = [];
      const steps = 16;
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        // Sweeps backward, up, and curls forward over the back (Matches 6.png, 7.png, 8.png!)
        const theta = u * Math.PI * 1.12;
        const x = Math.sin(u * Math.PI) * 0.025;
        const y = Math.sin(theta * 0.78) * 0.42 + u * 0.14;
        const z = Math.sin(theta * 0.95) * 0.18 - Math.pow(u, 1.8) * 0.34;

        let rad = (0.056 + Math.sin(u * Math.PI) * 0.028) * (1.0 - u * 0.52);
        if (i === 0 || i === steps) rad = 0.004;
        tailRings.push({
          x: x,
          y: y,
          z: z,
          rx: rad * 0.95,
          ry: rad * 1.15,
          topCol: COL_DORSAL_GOLD,
          midCol: COL_SIDE_AMBER,
          botCol: COL_BELLY_CREAM
        });
      }
      const tailMesh = new Mesh3D(buildLoftedMesh(gl, tailRings, 16), { type: 'dog', roughness: 0.74, cullFace: false });
      this.tailPivot.add(tailMesh);
    }

    buildLegs(gl) {
      // Full 3D Muscular Limbs (rx = lateral thickness, ry = anterior-posterior haunch/calf depth!)
      const makeLeg = (isFront, side) => {
        const hipPivot = new Node3D();
        hipPivot.position = [
          side * (isFront ? 0.142 : 0.152),
          isFront ? -0.06 : -0.02,
          isFront ? -0.36 : 0.36
        ];
        this.bodyNode.add(hipPivot);

        const upperLen = isFront ? 0.32 : 0.35;
        const upperRings = [
          { x: -side * 0.04, y:  0.09, z: 0.00, rx: 0.005, ry: 0.005, topCol: COL_DORSAL_GOLD, botCol: COL_DORSAL_GOLD },
          { x: -side * 0.02, y:  0.05, z: 0.00, rx: isFront ? 0.072 : 0.086, ry: isFront ? 0.095 : 0.130, topCol: COL_DORSAL_GOLD, midCol: COL_DORSAL_GOLD, botCol: COL_SIDE_AMBER },
          { x: 0, y: -0.02, z: 0.00, rx: isFront ? 0.076 : 0.090, ry: isFront ? 0.102 : 0.140, topCol: COL_DORSAL_GOLD, midCol: COL_SIDE_AMBER, botCol: COL_BELLY_CREAM },
          { x: 0, y: -upperLen * 0.52, z: isFront ? 0.02 : -0.03, rx: isFront ? 0.064 : 0.076, ry: isFront ? 0.082 : 0.108, topCol: COL_SIDE_AMBER, midCol: COL_SIDE_AMBER, botCol: COL_BELLY_CREAM },
          { x: 0, y: -upperLen, z: isFront ? 0.03 : -0.05, rx: 0.052, ry: 0.064, topCol: COL_SIDE_AMBER, midCol: COL_BELLY_CREAM, botCol: COL_BELLY_CREAM },
          { x: 0, y: -upperLen - 0.02, z: isFront ? 0.03 : -0.05, rx: 0.005, ry: 0.005, topCol: COL_BELLY_CREAM, botCol: COL_BELLY_CREAM }
        ];
        const upperMesh = new Mesh3D(buildLoftedMesh(gl, upperRings, 14), { type: 'dog', roughness: 0.68, cullFace: false });
        hipPivot.add(upperMesh);

        const kneePivot = new Node3D();
        kneePivot.position = [0, -upperLen + 0.02, isFront ? 0.025 : -0.045];
        hipPivot.add(kneePivot);

        const lowerLen = isFront ? 0.34 : 0.36;
        const lowerRings = [
          { x: 0, y:  0.02, z:  0.00, rx: 0.005, ry: 0.005, topCol: COL_SIDE_AMBER, botCol: COL_BELLY_CREAM },
          { x: 0, y:  0.00, z:  0.00, rx: 0.048, ry: 0.058, topCol: COL_SIDE_AMBER, midCol: COL_BELLY_CREAM, botCol: COL_BELLY_CREAM },
          { x: 0, y: -lowerLen * 0.55, z: isFront ? -0.015 : 0.025, rx: 0.040, ry: 0.048, topCol: COL_SIDE_AMBER, midCol: COL_PAW_SOCK, botCol: COL_PAW_SOCK },
          { x: 0, y: -lowerLen * 0.88, z: isFront ? -0.02 : 0.01, rx: 0.038, ry: 0.045, topCol: COL_PAW_SOCK, midCol: COL_PAW_SOCK, botCol: COL_PAW_SOCK },
          { x: 0, y: -lowerLen, z: -0.035, rx: 0.048, ry: 0.062, topCol: COL_PAW_SOCK, midCol: COL_PAW_SOCK, botCol: COL_PAW_SOCK },
          { x: 0, y: -lowerLen - 0.015, z: -0.045, rx: 0.005, ry: 0.005, topCol: COL_PAW_SOCK, botCol: COL_PAW_SOCK }
        ];
        const lowerMesh = new Mesh3D(buildLoftedMesh(gl, lowerRings, 14), { type: 'dog', roughness: 0.68, cullFace: false });
        kneePivot.add(lowerMesh);

        return { hipPivot, kneePivot, isFront, side };
      };

      this.legFL = makeLeg(true, -1);
      this.legFR = makeLeg(true,  1);
      this.legBL = makeLeg(false, -1);
      this.legBR = makeLeg(false,  1);
    }

    updateAnimation(dt, speedFactor, forceSniff) {
      const isMoving = speedFactor > 0.05;
      if (isMoving) {
        this.idleTimer = 0;
        this.sniffWeight = Math.max(0, this.sniffWeight - dt * 4.5);
        this.animTime += dt * (6.8 + speedFactor * 3.8);
      } else {
        this.idleTimer += dt;
        this.animTime += dt * 2.4;
        const wantSniff = forceSniff || (this.idleTimer > 1.1 && (Math.floor(this.idleTimer / 6.5) % 2 === 0));
        if (wantSniff) {
          this.sniffWeight = Math.min(1, this.sniffWeight + dt * 2.6);
        } else {
          this.sniffWeight = Math.max(0, this.sniffWeight - dt * 2.2);
        }
      }

      const sw = this.sniffWeight;
      const walkAmp = Math.min(1.0, speedFactor) * (1.0 - sw * 0.85);
      const phase = this.animTime;

      const gaitBob = Math.abs(Math.sin(phase)) * 0.034 * walkAmp;
      const breathe = Math.sin(this.animTime * 1.1) * 0.007;
      const sniffCrouchY = -0.028 * sw;
      const sniffPitch = 0.16 * sw;

      this.bodyNode.position[1] = 0.72 + gaitBob + breathe + sniffCrouchY;
      this.bodyNode.rotation[0] = -sniffPitch + Math.cos(phase * 2.0) * 0.022 * walkAmp;
      this.bodyNode.rotation[2] = Math.sin(phase) * 0.028 * walkAmp;

      const sniffSweepYaw = Math.sin(this.animTime * 1.65) * 0.38 * sw + Math.sin(this.animTime * 3.7) * 0.10 * sw;
      const sniffMicroBob = Math.sin(this.animTime * 9.5) * 0.032 * sw;
      const idleLookYaw = Math.sin(this.animTime * 0.55) * 0.14 * (1.0 - sw) * (1.0 - walkAmp);

      this.neckPivot.rotation[0] = -0.06 - 0.72 * sw + Math.sin(phase * 2.0) * 0.035 * walkAmp;
      this.neckPivot.rotation[1] = sniffSweepYaw * 0.45 + idleLookYaw * 0.4;

      this.headPivot.rotation[0] = 0.04 - 0.32 * sw + sniffMicroBob;
      this.headPivot.rotation[1] = sniffSweepYaw * 0.55 + idleLookYaw * 0.6;
      this.headPivot.rotation[2] = Math.cos(this.animTime * 1.65) * 0.08 * sw;

      this.jawPivot.rotation[0] = -0.05 - Math.abs(Math.sin(this.animTime * (sw > 0.3 ? 6.0 : 1.8))) * (sw > 0.3 ? 0.04 : 0.08);

      const earPerk = 0.14 * sw + Math.sin(this.animTime * 3.1) * 0.04;
      this.leftEar.rotation[0] = 0.16 + earPerk;
      this.rightEar.rotation[0] = 0.16 + earPerk + Math.cos(this.animTime * 2.3) * 0.04;

      const wagFreq = isMoving ? 2.0 : (sw > 0.3 ? 2.6 : 1.2);
      const wagAmp = isMoving ? 0.22 : (sw > 0.3 ? 0.28 : 0.14);
      this.tailPivot.rotation[2] = Math.sin(this.animTime * wagFreq) * wagAmp;
      this.tailPivot.rotation[0] = 0.10 * sw + Math.cos(phase) * 0.05 * walkAmp;

      const animateLeg = (leg, phaseOffset) => {
        const p = phase + phaseOffset;
        const swing = Math.sin(p) * 0.46 * walkAmp;
        const lift = Math.max(0, Math.cos(p)) * 0.40 * walkAmp;

        if (leg.isFront) {
          // Stagger left and right front legs slightly during sniffing so both legs are clearly distinct in profile!
          const stagger = leg.side * 0.18 * sw;
          const crouchHip = (0.28 + stagger) * sw;
          const crouchKnee = (-0.42 - stagger * 0.5) * sw;
          leg.hipPivot.rotation[0] = swing + crouchHip;
          leg.kneePivot.rotation[0] = -lift * 0.85 + crouchKnee;
        } else {
          const staggerRear = leg.side * 0.14 * sw;
          const rearStance = (-0.15 + staggerRear) * sw;
          leg.hipPivot.rotation[0] = swing + rearStance;
          leg.kneePivot.rotation[0] = lift * 0.75 + 0.20 * sw;
        }
      };

      animateLeg(this.legFL, 0.0);
      animateLeg(this.legBR, 0.0);
      animateLeg(this.legFR, Math.PI);
      animateLeg(this.legBL, Math.PI);
    }
  }

  global.PastoralDog = PastoralDog;
})(window);
