// ============================================================================
// Pure WebGL 3D Scene Graph & High-Definition Karst/Fur/Water Shader Engine
// ============================================================================
(function(global) {
  'use strict';

  function mat4Identity() {
    return new Float32Array([
      1,0,0,0,
      0,1,0,0,
      0,0,1,0,
      0,0,0,1
    ]);
  }

  function mat4Multiply(out, a, b) {
    const a00=a[0], a01=a[1], a02=a[2], a03=a[3];
    const a10=a[4], a11=a[5], a12=a[6], a13=a[7];
    const a20=a[8], a21=a[9], a22=a[10], a23=a[11];
    const a30=a[12], a31=a[13], a32=a[14], a33=a[15];

    let b0=b[0], b1=b[1], b2=b[2], b3=b[3];
    out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0=b[4]; b1=b[5]; b2=b[6]; b3=b[7];
    out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0=b[8]; b1=b[9]; b2=b[10]; b3=b[11];
    out[8]  = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[9]  = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0=b[12]; b1=b[13]; b2=b[14]; b3=b[15];
    out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    return out;
  }

  function mat4Perspective(out, fovyRad, aspect, near, far) {
    const f = 1.0 / Math.tan(fovyRad * 0.5);
    const nf = 1.0 / (near - far);
    out.fill(0);
    out[0] = f / aspect;
    out[5] = f;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[14] = (2 * far * near) * nf;
    return out;
  }

  function mat4LookAt(out, eye, center, up) {
    let z0 = eye[0] - center[0], z1 = eye[1] - center[1], z2 = eye[2] - center[2];
    let len = Math.hypot(z0, z1, z2) || 1;
    z0 /= len; z1 /= len; z2 /= len;

    let x0 = up[1]*z2 - up[2]*z1;
    let x1 = up[2]*z0 - up[0]*z2;
    let x2 = up[0]*z1 - up[1]*z0;
    len = Math.hypot(x0, x1, x2) || 1;
    x0 /= len; x1 /= len; x2 /= len;

    let y0 = z1*x2 - z2*x1;
    let y1 = z2*x0 - z0*x2;
    let y2 = z0*x1 - z1*x0;

    out[0] = x0; out[1] = y0; out[2] = z0; out[3] = 0;
    out[4] = x1; out[5] = y1; out[6] = z1; out[7] = 0;
    out[8] = x2; out[9] = y2; out[10] = z2; out[11] = 0;
    out[12] = -(x0*eye[0] + x1*eye[1] + x2*eye[2]);
    out[13] = -(y0*eye[0] + y1*eye[1] + y2*eye[2]);
    out[14] = -(z0*eye[0] + z1*eye[1] + z2*eye[2]);
    out[15] = 1;
    return out;
  }

  function mat4ComposeTRS(out, pos, rot, scale) {
    const cy = Math.cos(rot[1]), sy = Math.sin(rot[1]);
    const cx = Math.cos(rot[0]), sx = Math.sin(rot[0]);
    const cz = Math.cos(rot[2]), sz = Math.sin(rot[2]);

    const sx_ = scale[0], sy_ = scale[1], sz_ = scale[2];

    out[0]  = (cy * cz + sy * sx * sz) * sx_;
    out[1]  = (cx * sz) * sx_;
    out[2]  = (-sy * cz + cy * sx * sz) * sx_;
    out[3]  = 0;

    out[4]  = (-cy * sz + sy * sx * cz) * sy_;
    out[5]  = (cx * cz) * sy_;
    out[6]  = (sy * sz + cy * sx * cz) * sy_;
    out[7]  = 0;

    out[8]  = (sy * cx) * sz_;
    out[9]  = (-sx) * sz_;
    out[10] = (cy * cx) * sz_;
    out[11] = 0;

    out[12] = pos[0];
    out[13] = pos[1];
    out[14] = pos[2];
    out[15] = 1;
    return out;
  }

  class Node3D {
    constructor() {
      this.position = [0, 0, 0];
      this.rotation = [0, 0, 0];
      this.scale = [1, 1, 1];
      this.localMatrix = mat4Identity();
      this.worldMatrix = mat4Identity();
      this.children = [];
      this.parent = null;
      this.visible = true;
    }

    add(child) {
      if (child.parent) {
        const idx = child.parent.children.indexOf(child);
        if (idx >= 0) child.parent.children.splice(idx, 1);
      }
      child.parent = this;
      this.children.push(child);
      return this;
    }

    updateWorldMatrix(parentWorldMatrix) {
      mat4ComposeTRS(this.localMatrix, this.position, this.rotation, this.scale);
      if (parentWorldMatrix) {
        mat4Multiply(this.worldMatrix, parentWorldMatrix, this.localMatrix);
      } else {
        this.worldMatrix.set(this.localMatrix);
      }
      for (let i = 0; i < this.children.length; i++) {
        this.children[i].updateWorldMatrix(this.worldMatrix);
      }
    }
  }

  class Mesh3D extends Node3D {
    constructor(geometry, materialOpts) {
      super();
      this.geometry = geometry;
      this.cullRadius = 0;
      this.material = Object.assign({
        type: 'karst',
        roughness: 0.42,
        subsurface: 0.30,
        fluting: 0.5,
        opacity: 1.0,
        transparent: false,
        additive: false,
        cullFace: true
      }, materialOpts || {});
    }
  }

  function createBufferGeometry(gl, data) {
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, data.positions, gl.STATIC_DRAW);

    const normBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
    gl.bufferData(gl.ARRAY_BUFFER, data.normals, gl.STATIC_DRAW);

    const colBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
    gl.bufferData(gl.ARRAY_BUFFER, data.colors, gl.STATIC_DRAW);

    const uvArray = data.uvs || new Float32Array((data.positions.length / 3) * 2);
    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvArray, gl.STATIC_DRAW);

    let idxBuf = null;
    let indexCount = 0;
    let indexType = gl.UNSIGNED_SHORT;
    if (data.indices) {
      idxBuf = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
      if (data.indices instanceof Uint32Array) {
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indices, gl.STATIC_DRAW);
        indexType = gl.UNSIGNED_INT;
      } else {
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indices, gl.STATIC_DRAW);
        indexType = gl.UNSIGNED_SHORT;
      }
      indexCount = data.indices.length;
    }

    return {
      posBuf,
      normBuf,
      colBuf,
      uvBuf,
      idxBuf,
      indexCount,
      indexType,
      vertexCount: data.positions.length / 3
    };
  }

  function computeVertexNormals(positions, indices) {
    const normals = new Float32Array(positions.length);
    for (let i = 0; i < indices.length; i += 3) {
      const i0 = indices[i] * 3;
      const i1 = indices[i + 1] * 3;
      const i2 = indices[i + 2] * 3;

      const ax = positions[i1] - positions[i0];
      const ay = positions[i1 + 1] - positions[i0 + 1];
      const az = positions[i1 + 2] - positions[i0 + 2];

      const bx = positions[i2] - positions[i0];
      const by = positions[i2 + 1] - positions[i0 + 1];
      const bz = positions[i2 + 2] - positions[i0 + 2];

      const nx = ay * bz - az * by;
      const ny = az * bx - ax * bz;
      const nz = ax * by - ay * bx;

      normals[i0] += nx; normals[i0 + 1] += ny; normals[i0 + 2] += nz;
      normals[i1] += nx; normals[i1 + 1] += ny; normals[i1 + 2] += nz;
      normals[i2] += nx; normals[i2 + 1] += ny; normals[i2 + 2] += nz;
    }
    for (let i = 0; i < normals.length; i += 3) {
      const l = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
      normals[i] /= l;
      normals[i + 1] /= l;
      normals[i + 2] /= l;
    }
    return normals;
  }

  const MAIN_VS = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec3 aColor;
    attribute vec2 aUV;

    uniform mat4 uModel;
    uniform mat4 uViewProj;

    varying vec3 vWorldPos;
    varying vec3 vLocalPos;
    varying vec3 vNormal;
    varying vec3 vColor;
    varying vec2 vUV;

    void main() {
      vec4 worldPos = uModel * vec4(aPosition, 1.0);
      vWorldPos = worldPos.xyz;
      vLocalPos = aPosition;
      mat3 normalMat = mat3(uModel[0].xyz, uModel[1].xyz, uModel[2].xyz);
      vec3 n = normalMat * aNormal;
      float nLen = length(n);
      vNormal = nLen > 0.0001 ? (n / nLen) : vec3(0.0, 1.0, 0.0);
      vColor = aColor;
      vUV = aUV;
      gl_Position = uViewProj * worldPos;
    }
  `;

  const MAIN_FS = `
    precision highp float;

    varying vec3 vWorldPos;
    varying vec3 vLocalPos;
    varying vec3 vNormal;
    varying vec3 vColor;
    varying vec2 vUV;

    uniform vec3 uCameraPos;
    uniform float uTime;
    uniform int uMaterialType; // 0=karst, 1=dog, 2=water, 3=beam, 4=shadow
    uniform float uRoughness;
    uniform float uSubsurface;
    uniform float uFluting;
    uniform float uOpacity;
    uniform vec3 uDogPos;

    #define MAX_LIGHTS 12
    uniform vec3 uLightPos[MAX_LIGHTS];
    uniform vec3 uLightColor[MAX_LIGHTS];
    uniform float uLightRadius[MAX_LIGHTS];

    float fastNoise3(vec3 p) {
      vec3 s1 = sin(p * vec3(1.73, 2.17, 1.91) + p.yzx * vec3(1.13, 1.37, 1.49));
      vec3 s2 = cos(p * vec3(3.47, 2.89, 3.13) - p.zxy * vec3(2.11, 2.53, 1.87));
      return dot(s1, vec3(0.166)) + dot(s2, vec3(0.095)) + 0.5;
    }

    vec3 toneMapACES(vec3 x) {
      const float a = 2.51;
      const float b = 0.03;
      const float c = 2.43;
      const float d = 0.59;
      const float e = 0.14;
      return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
    }

    void main() {
      // 4: Soft ground contact shadow under Dahuang
      if (uMaterialType == 4) {
        float r = length(vUV * 2.0 - 1.0);
        float alpha = smoothstep(1.0, 0.15, r) * uOpacity;
        gl_FragColor = vec4(0.02, 0.02, 0.03, alpha);
        return;
      }

      // 3: Volumetric God-Ray Light Shaft Cone
      if (uMaterialType == 3) {
        vec3 V = normalize(uCameraPos - vWorldPos + vec3(0.0, 0.0001, 0.0));
        vec3 N = normalize(vNormal + vec3(0.0, 0.0001, 0.0));
        float fresnel = pow(clamp(abs(dot(N, V)), 0.0, 1.0), 1.5);
        float vFade = smoothstep(0.0, 0.25, vUV.y) * smoothstep(1.0, 0.08, vUV.y);
        float rayStreak = 0.85 + 0.15 * sin(vUV.x * 37.699 + uTime * 0.8);
        float alpha = fresnel * vFade * rayStreak * uOpacity;
        gl_FragColor = vec4(vColor, alpha);
        return;
      }

      vec3 N = normalize(vNormal + vec3(0.0, 0.0001, 0.0));
      vec3 V = normalize(uCameraPos - vWorldPos + vec3(0.0, 0.0001, 0.0));
      vec3 baseColor = vColor;

      // 2: Emerald Cave Pools & Underground River Water Shader
      if (uMaterialType == 2) {
        float edgeAlpha = smoothstep(0.0, 0.20, vUV.x) * smoothstep(1.0, 0.80, vUV.x);
        float r1 = sin(vWorldPos.x * 3.2 + vWorldPos.z * 2.5 + uTime * 1.8) *
                   cos(vWorldPos.z * 3.5 - vWorldPos.x * 1.9 - uTime * 1.4);
        float r2 = sin(vWorldPos.x * 7.4 - vWorldPos.z * 6.2 + uTime * 2.6) * 0.45;
        float ripple = (r1 + r2) * 0.5;
        N = normalize(vec3(ripple * 0.25, 1.0, ripple * 0.25));

        float caustic = smoothstep(0.10, 0.88, ripple * 0.5 + 0.5);
        vec3 waterCol = baseColor * (0.72 + 0.52 * caustic);

        vec3 specTotal = vec3(0.0);
        for (int i = 0; i < MAX_LIGHTS; i++) {
          vec3 Lvec = uLightPos[i] - vWorldPos;
          float d = length(Lvec);
          float rad = max(uLightRadius[i], 1.0);
          if (d < rad * 1.35) {
            vec3 L = Lvec / max(d, 0.001);
            vec3 H = normalize(L + V);
            float att = pow(clamp(1.0 - d / (rad * 1.35), 0.0, 1.0), 1.45);
            float spec = pow(max(dot(N, H), 0.0), 38.0);
            specTotal += uLightColor[i] * (spec * 1.05 + 0.25) * att;
          }
        }
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.3);
        vec3 finalWater = toneMapACES(waterCol + specTotal + vec3(0.20, 0.48, 0.52) * fresnel);

        float distCam = length(uCameraPos - vWorldPos);
        float fogF = clamp(1.0 - exp(-distCam * 0.0095), 0.0, 1.0);
        finalWater = mix(finalWater, vec3(0.07, 0.06, 0.10), fogF);
        gl_FragColor = vec4(finalWater, uOpacity * edgeAlpha);
        return;
      }

      // 1: Procedural Chinese Pastoral Dog ("大黄") Plush Fur & Anatomy Shader
      if (uMaterialType == 1) {
        float fur1 = fastNoise3(vLocalPos * 32.0);
        float fur2 = fastNoise3(vLocalPos * 72.0 + vec3(2.3, 5.1, 1.7));
        float furWave = (fur1 * 0.65 + fur2 * 0.35) - 0.5;
        N = normalize(N + vec3(furWave * 0.15, furWave * 0.10, furWave * 0.15));
        baseColor *= (0.93 + 0.16 * (fur1 * 0.6 + fur2 * 0.4));

        vec3 keyDir = normalize(vec3(0.35, 0.82, 0.42));
        float halfLambert = pow(dot(N, keyDir) * 0.5 + 0.5, 1.38);
        vec3 totalLight = vec3(0.28, 0.24, 0.21) + vec3(0.76, 0.66, 0.54) * halfLambert;

        // Plush golden rim light around Dahuang's fur silhouette
        float rim = pow(1.0 - max(dot(N, V), 0.0), 2.4);
        totalLight += vec3(0.95, 0.76, 0.44) * rim * 0.48;

        for (int i = 0; i < MAX_LIGHTS; i++) {
          vec3 Lvec = uLightPos[i] - vWorldPos;
          float d = length(Lvec);
          float rad = max(uLightRadius[i], 1.0);
          if (d < rad) {
            vec3 L = Lvec / max(d, 0.001);
            float att = pow(clamp(1.0 - d / rad, 0.0, 1.0), 1.8);
            float diff = max(dot(N, L) * 0.5 + 0.5, 0.0);
            totalLight += uLightColor[i] * diff * att * 0.22;
          }
        }

        vec3 H = normalize(keyDir + V);
        float specPower = mix(64.0, 10.0, clamp(uRoughness, 0.05, 1.0));
        float specStrength = mix(0.85, 0.04, clamp(uRoughness, 0.05, 1.0));
        float spec = pow(max(dot(N, H), 0.0), specPower) * specStrength;

        vec3 dogCol = toneMapACES(baseColor * totalLight + vec3(1.0, 0.96, 0.90) * spec);
        gl_FragColor = vec4(dogCol, 1.0);
        return;
      }

      // 0: High-Definition Procedural Karst Cave Wall, Stalactite, Stalagmite & Waterfall Shader
      float n1 = fastNoise3(vWorldPos * 0.52);
      float n2 = fastNoise3(vWorldPos * 2.15);
      float n3 = fastNoise3(vWorldPos * 6.40);
      // Detailed vertical calcite flowstone flutes (石瀑与石笋竖纹) + horizontal drip rings
      float flute = sin(vWorldPos.x * 7.5 + vWorldPos.z * 7.5 + n1 * 4.2 + n2 * 1.8) * 0.5 + 0.5;
      float ring  = sin(vWorldPos.y * 4.2 + n2 * 2.4) * 0.5 + 0.5;
      float micro = mix(n2 * 0.6 + n3 * 0.4, flute * 0.72 + ring * 0.28, uFluting) - 0.5;

      N = normalize(N + vec3(
        micro * 0.32 + (n3 - 0.5) * 0.16,
        (ring - 0.5) * 0.18 * uFluting + (n3 - 0.5) * 0.12,
        -micro * 0.32 + (n2 - 0.5) * 0.16
      ));

      float band = 0.82 + 0.34 * (n1 * 0.45 + n2 * 0.30 + flute * 0.25 * uFluting);
      vec3 rockAlbedo = baseColor * band;

      // Ambient + Dahuang warm ground aura
      vec3 accumLight = vec3(0.22, 0.20, 0.25);
      float distDog = length(vWorldPos - uDogPos);
      if (distDog < 18.0) {
        float dogAtt = pow(clamp(1.0 - distDog / 18.0, 0.0, 1.0), 1.6);
        accumLight += vec3(0.40, 0.31, 0.20) * dogAtt;
      }

      vec3 specAccum = vec3(0.0);
      for (int i = 0; i < MAX_LIGHTS; i++) {
        vec3 Lvec = uLightPos[i] - vWorldPos;
        float d = length(Lvec);
        float rad = max(uLightRadius[i], 1.0);
        if (d < rad) {
          vec3 L = Lvec / max(d, 0.001);
          float att = pow(clamp(1.0 - d / rad, 0.0, 1.0), 1.45);
          float ndotl = dot(N, L);
          float diff = max(ndotl, 0.0) + max(-ndotl, 0.0) * 0.32;
          float wrap = (ndotl * 0.5 + 0.5) * uSubsurface;
          accumLight += uLightColor[i] * (diff * 0.85 + wrap * 0.62) * att;

          vec3 H = normalize(L + V);
          float spec = pow(max(abs(dot(N, H)), 0.0), 26.0) * (1.0 - uRoughness * 0.65);
          specAccum += uLightColor[i] * spec * att * 0.36;
        }
      }

      vec3 litColor = toneMapACES(rockAlbedo * accumLight + specAccum);

      float distCam = length(uCameraPos - vWorldPos);
      float fogFactor = clamp(1.0 - exp(-distCam * 0.0108), 0.0, 1.0);
      vec3 fogColor = vec3(0.07, 0.06, 0.10);
      litColor = mix(litColor, fogColor, fogFactor);

      gl_FragColor = vec4(litColor, uOpacity);
    }
  `;

  // Subtle Firefly Spores & Soft Water Mist Shader
  const PARTICLE_VS = `
    attribute vec3 aPosition;
    attribute vec3 aColor;
    attribute float aSize;

    uniform mat4 uViewProj;
    uniform float uTime;
    uniform float uViewportHeight;

    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vec3 pos = aPosition;
      pos.y += mod(uTime * 0.20 + aPosition.x * 0.37 + aPosition.z * 0.23, 3.6) - 1.0;
      pos.x += sin(uTime * 0.55 + aPosition.z * 0.4) * 0.25;
      pos.z += cos(uTime * 0.48 + aPosition.x * 0.4) * 0.25;

      vec4 clipPos = uViewProj * vec4(pos, 1.0);
      gl_Position = clipPos;
      float dist = max(clipPos.w, 1.0);
      gl_PointSize = clamp(aSize * (uViewportHeight * 0.45) / dist, 1.5, 16.0);
      vColor = aColor;
      vAlpha = smoothstep(75.0, 8.0, dist);
    }
  `;

  const PARTICLE_FS = `
    precision mediump float;
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vec2 p = gl_PointCoord * 2.0 - 1.0;
      float r2 = dot(p, p);
      if (r2 > 1.0) discard;
      float soft = pow(1.0 - r2, 2.2);
      gl_FragColor = vec4(vColor, soft * vAlpha * 0.52);
    }
  `;

  function compileShader(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(sh));
    }
    return sh;
  }

  function createProgram(gl, vsSrc, fsSrc) {
    const prog = gl.createProgram();
    gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(prog));
    }
    return prog;
  }

  class Renderer3D {
    constructor(canvas) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl2', { antialias: true, alpha: false, preserveDrawingBuffer: true }) ||
                 canvas.getContext('webgl', { antialias: true, alpha: false, preserveDrawingBuffer: true });
      this.gl = gl;
      gl.getExtension('OES_element_index_uint');

      this.mainProg = createProgram(gl, MAIN_VS, MAIN_FS);
      this.partProg = createProgram(gl, PARTICLE_VS, PARTICLE_FS);

      this.cacheLocations();
      this.projMatrix = mat4Identity();
      this.viewMatrix = mat4Identity();
      this.viewProjMatrix = mat4Identity();
      this.cameraPos = [0, 3, 6];
      this.cameraTarget = [0, 1.5, 0];
      this.fov = 52 * Math.PI / 180;
    }

    cacheLocations() {
      const gl = this.gl;
      const mp = this.mainProg;
      this.mainLoc = {
        aPosition: gl.getAttribLocation(mp, 'aPosition'),
        aNormal: gl.getAttribLocation(mp, 'aNormal'),
        aColor: gl.getAttribLocation(mp, 'aColor'),
        aUV: gl.getAttribLocation(mp, 'aUV'),
        uModel: gl.getUniformLocation(mp, 'uModel'),
        uViewProj: gl.getUniformLocation(mp, 'uViewProj'),
        uCameraPos: gl.getUniformLocation(mp, 'uCameraPos'),
        uTime: gl.getUniformLocation(mp, 'uTime'),
        uMaterialType: gl.getUniformLocation(mp, 'uMaterialType'),
        uRoughness: gl.getUniformLocation(mp, 'uRoughness'),
        uSubsurface: gl.getUniformLocation(mp, 'uSubsurface'),
        uFluting: gl.getUniformLocation(mp, 'uFluting'),
        uOpacity: gl.getUniformLocation(mp, 'uOpacity'),
        uDogPos: gl.getUniformLocation(mp, 'uDogPos'),
        uLightPos: gl.getUniformLocation(mp, 'uLightPos[0]'),
        uLightColor: gl.getUniformLocation(mp, 'uLightColor[0]'),
        uLightRadius: gl.getUniformLocation(mp, 'uLightRadius[0]')
      };

      const pp = this.partProg;
      this.partLoc = {
        aPosition: gl.getAttribLocation(pp, 'aPosition'),
        aColor: gl.getAttribLocation(pp, 'aColor'),
        aSize: gl.getAttribLocation(pp, 'aSize'),
        uViewProj: gl.getUniformLocation(pp, 'uViewProj'),
        uTime: gl.getUniformLocation(pp, 'uTime'),
        uViewportHeight: gl.getUniformLocation(pp, 'uViewportHeight')
      };
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.floor(this.canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w;
        this.canvas.height = h;
      }
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    render(sceneRoot, lights, particles, timeSec, dogPos) {
      this.resize();
      const gl = this.gl;
      const w = this.canvas.width;
      const h = this.canvas.height;

      gl.clearColor(0.07, 0.06, 0.10, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);

      mat4Perspective(this.projMatrix, this.fov, w / h, 0.25, 180.0);
      mat4LookAt(this.viewMatrix, this.cameraPos, this.cameraTarget, [0, 1, 0]);
      mat4Multiply(this.viewProjMatrix, this.projMatrix, this.viewMatrix);

      sceneRoot.updateWorldMatrix(null);

      const camZ = this.cameraPos[2];
      const opaqueMeshes = [];
      const transMeshes = [];
      function traverse(node) {
        if (!node.visible) return;
        if (node instanceof Mesh3D && node.geometry) {
          if (node.cullRadius > 0) {
            const mz = node.worldMatrix[14];
            if (Math.abs(mz - camZ) > node.cullRadius) return;
          }
          if (node.material.transparent) transMeshes.push(node);
          else opaqueMeshes.push(node);
        }
        for (let i = 0; i < node.children.length; i++) {
          traverse(node.children[i]);
        }
      }
      traverse(sceneRoot);

      const sortedLights = lights.slice().sort((a, b) => {
        const da = (a.x - dogPos[0]) * (a.x - dogPos[0]) + (a.z - dogPos[2]) * (a.z - dogPos[2]);
        const db = (b.x - dogPos[0]) * (b.x - dogPos[0]) + (b.z - dogPos[2]) * (b.z - dogPos[2]);
        return da - db;
      });

      const MAX_L = 12;
      const lightPosArr = new Float32Array(MAX_L * 3);
      const lightColArr = new Float32Array(MAX_L * 3);
      const lightRadArr = new Float32Array(MAX_L);
      for (let i = 0; i < MAX_L; i++) {
        const L = sortedLights[i] || { x: 0, y: -100, z: 0, r: 0, g: 0, b: 0, radius: 1 };
        lightPosArr[i * 3] = L.x;
        lightPosArr[i * 3 + 1] = L.y;
        lightPosArr[i * 3 + 2] = L.z;
        lightColArr[i * 3] = L.r;
        lightColArr[i * 3 + 1] = L.g;
        lightColArr[i * 3 + 2] = L.b;
        lightRadArr[i] = L.radius;
      }

      gl.useProgram(this.mainProg);
      const loc = this.mainLoc;
      gl.uniformMatrix4fv(loc.uViewProj, false, this.viewProjMatrix);
      gl.uniform3fv(loc.uCameraPos, this.cameraPos);
      gl.uniform1f(loc.uTime, timeSec);
      gl.uniform3fv(loc.uDogPos, dogPos);
      gl.uniform3fv(loc.uLightPos, lightPosArr);
      gl.uniform3fv(loc.uLightColor, lightColArr);
      gl.uniform1fv(loc.uLightRadius, lightRadArr);

      gl.enableVertexAttribArray(loc.aPosition);
      gl.enableVertexAttribArray(loc.aNormal);
      gl.enableVertexAttribArray(loc.aColor);
      gl.enableVertexAttribArray(loc.aUV);

      const drawMesh = (mesh) => {
        const geom = mesh.geometry;
        const mat = mesh.material;

        if (mat.cullFace) {
          gl.enable(gl.CULL_FACE);
          gl.cullFace(gl.BACK);
        } else {
          gl.disable(gl.CULL_FACE);
        }

        let matTypeInt = 0;
        if (mat.type === 'dog') matTypeInt = 1;
        else if (mat.type === 'water') matTypeInt = 2;
        else if (mat.type === 'beam') matTypeInt = 3;
        else if (mat.type === 'shadow') matTypeInt = 4;

        gl.uniformMatrix4fv(loc.uModel, false, mesh.worldMatrix);
        gl.uniform1i(loc.uMaterialType, matTypeInt);
        gl.uniform1f(loc.uRoughness, mat.roughness);
        gl.uniform1f(loc.uSubsurface, mat.subsurface);
        gl.uniform1f(loc.uFluting, mat.fluting);
        gl.uniform1f(loc.uOpacity, mat.opacity);

        gl.bindBuffer(gl.ARRAY_BUFFER, geom.posBuf);
        gl.vertexAttribPointer(loc.aPosition, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, geom.normBuf);
        gl.vertexAttribPointer(loc.aNormal, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, geom.colBuf);
        gl.vertexAttribPointer(loc.aColor, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, geom.uvBuf);
        gl.vertexAttribPointer(loc.aUV, 2, gl.FLOAT, false, 0, 0);

        if (geom.idxBuf) {
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geom.idxBuf);
          gl.drawElements(gl.TRIANGLES, geom.indexCount, geom.indexType, 0);
        } else {
          gl.drawArrays(gl.TRIANGLES, 0, geom.vertexCount);
        }
      };

      gl.disable(gl.BLEND);
      gl.depthMask(true);
      for (let i = 0; i < opaqueMeshes.length; i++) {
        drawMesh(opaqueMeshes[i]);
      }

      gl.enable(gl.BLEND);
      gl.depthMask(false);
      for (let i = 0; i < transMeshes.length; i++) {
        const m = transMeshes[i];
        if (m.material.additive) {
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        } else {
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        }
        drawMesh(m);
      }

      if (particles && particles.count > 0) {
        gl.useProgram(this.partProg);
        const ploc = this.partLoc;
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.uniformMatrix4fv(ploc.uViewProj, false, this.viewProjMatrix);
        gl.uniform1f(ploc.uTime, timeSec);
        gl.uniform1f(ploc.uViewportHeight, h);

        gl.enableVertexAttribArray(ploc.aPosition);
        gl.bindBuffer(gl.ARRAY_BUFFER, particles.posBuf);
        gl.vertexAttribPointer(ploc.aPosition, 3, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(ploc.aColor);
        gl.bindBuffer(gl.ARRAY_BUFFER, particles.colBuf);
        gl.vertexAttribPointer(ploc.aColor, 3, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(ploc.aSize);
        gl.bindBuffer(gl.ARRAY_BUFFER, particles.sizeBuf);
        gl.vertexAttribPointer(ploc.aSize, 1, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.POINTS, 0, particles.count);
      }

      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }
  }

  global.CaveEngine = {
    Node3D,
    Mesh3D,
    Renderer3D,
    createBufferGeometry,
    computeVertexNormals
  };
})(window);
