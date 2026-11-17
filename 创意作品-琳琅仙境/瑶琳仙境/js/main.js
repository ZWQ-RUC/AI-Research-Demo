// ============================================================================
// Main Controller: Player Input, "大黄带路" Autonomous Guide, Camera Orbit,
// 2D Minimap Renderer, Spot Discovery & Testing API (`window.yaolinApp`)
// ============================================================================
(function(global) {
  'use strict';

  const { lerp } = global.CaveMath;
  const { Renderer3D } = global.CaveEngine;
  const { CAVE_HALLS, SCENIC_SPOTS } = global.YaolinData;
  const PastoralDog = global.PastoralDog;
  const YaolinCaveWorld = global.YaolinCaveWorld;
  const CaveAudioEngine = global.CaveAudioEngine;

  class YaolinWonderlandApp {
    constructor() {
      this.canvas = document.getElementById('gl-canvas');
      this.minimapCanvas = document.getElementById('minimap-canvas');
      this.minimapCtx = this.minimapCanvas.getContext('2d');

      this.renderer = new Renderer3D(this.canvas);
      this.gl = this.renderer.gl;
      this.world = new YaolinCaveWorld(this.gl);
      this.dog = new PastoralDog(this.gl);
      this.world.root.add(this.dog.root);
      this.audio = new CaveAudioEngine();

      this.inCoverMode = true;
      this.autoGuide = false;
      this.autoTargetSpotIdx = 0;
      this.autoPauseTimer = 0;
      this.paused = false;

      const startSample = this.world.spline.evaluate(0.022);
      this.dogPos = [startSample.x + 1.15, this.world.getFloorHeight(startSample.x + 1.15, startSample.z), startSample.z];
      this.dogYaw = -0.58;
      this.currentSplineT = 0.022;

      this.camYaw = 0.0;
      this.camPitch = 0.14;
      this.camDistance = 5.0;

      this.visitedSpots = new Set([1, 2, 3]);
      this.activeSpot = SCENIC_SPOTS[2];

      this.keys = {};
      this.joystickVec = [0, 0];
      this.isDragging = false;
      this.lastMouse = [0, 0];
      this.forceSniffPose = false;

      this.bindUI();
      this.bindInput();
      this.updateHUD();

      this.lastTime = performance.now();
      this.elapsedTime = 0;
      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);
    }

    bindUI() {
      const enterBtn = document.getElementById('btn-enter-cave');
      enterBtn.addEventListener('click', () => {
        this.enterCave();
      });

      this.btnAutoGuide = document.getElementById('btn-auto-guide');
      this.btnAudio = document.getElementById('btn-audio');
      this.btnMap = document.getElementById('btn-map');
      this.btnHelp = document.getElementById('btn-help');

      this.btnAutoGuide.addEventListener('click', () => {
        this.toggleAutoGuide();
      });

      this.btnAudio.addEventListener('click', () => {
        const on = this.audio.toggle();
        this.btnAudio.classList.toggle('active', on);
        this.btnAudio.innerHTML = `<span class="icon">♪</span> ${on ? '声音 · 开' : '声音'}`;
      });

      const minimapCard = document.getElementById('minimap-card');
      this.btnMap.addEventListener('click', () => {
        const exp = minimapCard.classList.toggle('expanded');
        this.btnMap.classList.toggle('active', exp);
      });

      const helpModal = document.getElementById('help-modal');
      const closeHelpBtn = document.getElementById('btn-close-modal');
      this.btnHelp.addEventListener('click', () => {
        this.populateSpotsModalGrid();
        helpModal.classList.add('open');
      });
      closeHelpBtn.addEventListener('click', () => {
        helpModal.classList.remove('open');
      });
      helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) helpModal.classList.remove('open');
      });

      document.getElementById('btn-prev-spot').addEventListener('click', () => {
        const prevIdx = Math.max(1, (this.activeSpot ? this.activeSpot.index : 2) - 1);
        this.teleportToSpot(prevIdx);
      });
      document.getElementById('btn-next-spot').addEventListener('click', () => {
        const nextIdx = Math.min(18, (this.activeSpot ? this.activeSpot.index : 1) + 1);
        this.teleportToSpot(nextIdx);
      });

      this.minimapCanvas.addEventListener('click', (e) => {
        const rect = this.minimapCanvas.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = (e.clientY - rect.top) / rect.height;
        const wz = -(1.0 - ny) * 530.0 + 10.0;
        const wx = (nx - 0.52) * 95.0;
        let bestSpot = SCENIC_SPOTS[0];
        let bestD = Infinity;
        for (let i = 0; i < SCENIC_SPOTS.length; i++) {
          const sp = SCENIC_SPOTS[i];
          const s = this.world.spline.evaluate(sp.t);
          const d = Math.hypot(wx - s.x, wz - s.z);
          if (d < bestD) {
            bestD = d;
            bestSpot = sp;
          }
        }
        this.teleportToSpot(bestSpot.index);
      });
    }

    populateSpotsModalGrid() {
      const grid = document.getElementById('modal-spots-grid');
      grid.innerHTML = '';
      SCENIC_SPOTS.forEach((sp) => {
        const btn = document.createElement('button');
        btn.className = 'spot-jump-btn' + (this.visitedSpots.has(sp.index) ? ' visited' : '');
        btn.innerHTML = `<span class="num">探秘 ${sp.index} / 18</span><span class="name">${sp.title}</span>`;
        btn.addEventListener('click', () => {
          document.getElementById('help-modal').classList.remove('open');
          if (this.inCoverMode) this.enterCave();
          this.teleportToSpot(sp.index);
        });
        grid.appendChild(btn);
      });
    }

    enterCave() {
      this.inCoverMode = false;
      document.getElementById('cover-overlay').classList.add('hidden');
      document.getElementById('hud-layer').classList.remove('hidden');
      this.teleportToSpot(3, { keepVisitedCount: false });
    }

    toggleAutoGuide(forceState) {
      this.autoGuide = forceState !== undefined ? forceState : !this.autoGuide;
      this.btnAutoGuide.classList.toggle('active', this.autoGuide);
      const toast = document.getElementById('dog-status-toast');
      if (this.autoGuide) {
        let nextIdx = SCENIC_SPOTS.findIndex(sp => sp.t > this.currentSplineT + 0.01);
        if (nextIdx < 0) nextIdx = 0;
        this.autoTargetSpotIdx = nextIdx;
        this.autoPauseTimer = 0;
        toast.textContent = '🐕 大黄正在带路探秘中（按方向键可随时接管）';
        toast.classList.add('visible');
      } else {
        toast.classList.remove('visible');
      }
    }

    teleportToSpot(spotNumber, opts) {
      opts = opts || {};
      const idx = Math.max(1, Math.min(18, spotNumber)) - 1;
      const spot = SCENIC_SPOTS[idx];
      const s = this.world.spline.evaluate(spot.t);

      const wx = s.x + s.rx * (spot.lateralOffset || 0);
      const wz = s.z + s.rz * (spot.lateralOffset || 0);
      const wy = this.world.getFloorHeight(wx, wz);

      this.dogPos = [wx, wy, wz];
      this.currentSplineT = spot.t;

      const splineYaw = Math.atan2(-s.tx, -s.tz);
      this.dogYaw = splineYaw + (spot.lookYawOffset || 0);
      this.camYaw = splineYaw + (opts.camYawOffset || 0);
      this.camPitch = opts.camPitch !== undefined ? opts.camPitch : 0.12;
      this.camDistance = opts.camDistance !== undefined ? opts.camDistance : 4.8;

      if (opts.dogYawOffset !== undefined) {
        this.dogYaw = splineYaw + opts.dogYawOffset;
      }
      this.forceSniffPose = !!opts.sniffPose;
      if (this.forceSniffPose) {
        this.dog.sniffWeight = 1.0;
        this.dog.idleTimer = 3.0;
      } else {
        this.dog.sniffWeight = 0.0;
        this.dog.idleTimer = 0.0;
      }

      if (opts.visitedCount !== undefined) {
        this.visitedSpots.clear();
        for (let k = 1; k <= opts.visitedCount; k++) this.visitedSpots.add(k);
      } else {
        for (let k = 1; k <= spot.index; k++) this.visitedSpots.add(k);
      }

      this.activeSpot = spot;
      this.updateHUD(opts.overrideCard);
      this.stepFrame(0.016);
    }

    bindInput() {
      window.addEventListener('keydown', (e) => {
        this.keys[e.code] = true;
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
          if (this.inCoverMode) this.enterCave();
          if (this.autoGuide) this.toggleAutoGuide(false);
          this.forceSniffPose = false;
        }
      });

      window.addEventListener('keyup', (e) => {
        this.keys[e.code] = false;
      });

      this.canvas.addEventListener('mousedown', (e) => {
        this.isDragging = true;
        this.lastMouse = [e.clientX, e.clientY];
      });

      window.addEventListener('mousemove', (e) => {
        if (!this.isDragging) return;
        const dx = e.clientX - this.lastMouse[0];
        const dy = e.clientY - this.lastMouse[1];
        this.lastMouse = [e.clientX, e.clientY];
        this.camYaw -= dx * 0.0065;
        this.camPitch = Math.max(-0.18, Math.min(0.68, this.camPitch + dy * 0.0055));
      });

      window.addEventListener('mouseup', () => {
        this.isDragging = false;
      });

      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.camDistance = Math.max(2.6, Math.min(11.5, this.camDistance + e.deltaY * 0.004));
      }, { passive: false });

      let touchId = null;
      this.canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          touchId = e.touches[0].identifier;
          this.lastMouse = [e.touches[0].clientX, e.touches[0].clientY];
        }
      }, { passive: true });

      this.canvas.addEventListener('touchmove', (e) => {
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === touchId) {
            const dx = e.touches[i].clientX - this.lastMouse[0];
            const dy = e.touches[i].clientY - this.lastMouse[1];
            this.lastMouse = [e.touches[i].clientX, e.touches[i].clientY];
            this.camYaw -= dx * 0.0065;
            this.camPitch = Math.max(-0.18, Math.min(0.68, this.camPitch + dy * 0.0055));
          }
        }
      }, { passive: true });

      const joyZone = document.getElementById('touch-joystick');
      const joyKnob = document.getElementById('touch-joystick-knob');
      if (joyZone && joyKnob) {
        const handleJoy = (clientX, clientY) => {
          const rect = joyZone.getBoundingClientRect();
          const cx = rect.left + rect.width * 0.5;
          const cy = rect.top + rect.height * 0.5;
          const maxR = rect.width * 0.38;
          let dx = clientX - cx;
          let dy = clientY - cy;
          const dist = Math.hypot(dx, dy);
          if (dist > maxR) {
            dx = (dx / dist) * maxR;
            dy = (dy / dist) * maxR;
          }
          joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
          this.joystickVec = [dx / maxR, dy / maxR];
          if (this.autoGuide) this.toggleAutoGuide(false);
          this.forceSniffPose = false;
        };

        joyZone.addEventListener('touchstart', (e) => {
          e.stopPropagation();
          handleJoy(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });

        joyZone.addEventListener('touchmove', (e) => {
          e.stopPropagation();
          handleJoy(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });

        const resetJoy = () => {
          joyKnob.style.transform = 'translate(0px, 0px)';
          this.joystickVec = [0, 0];
        };
        joyZone.addEventListener('touchend', resetJoy);
        joyZone.addEventListener('touchcancel', resetJoy);
      }
    }

    updateHUD(overrideCard) {
      let hall = CAVE_HALLS[0];
      for (let i = 0; i < CAVE_HALLS.length; i++) {
        if (this.currentSplineT >= CAVE_HALLS[i].tMin && this.currentSplineT <= CAVE_HALLS[i].tMax) {
          hall = CAVE_HALLS[i];
          break;
        }
      }

      document.getElementById('hud-hall-title').textContent = hall.title;
      document.getElementById('hud-hall-subtitle').textContent = hall.subtitle;
      document.getElementById('hud-visited-count').textContent = String(this.visitedSpots.size);

      if (overrideCard) {
        document.getElementById('spot-badge').textContent = overrideCard.badge;
        document.getElementById('spot-title').textContent = overrideCard.title;
        document.getElementById('spot-desc').textContent = overrideCard.desc;
      } else if (this.activeSpot) {
        document.getElementById('spot-badge').textContent = `探秘 ${this.activeSpot.index} / 18`;
        document.getElementById('spot-title').textContent = this.activeSpot.title;
        document.getElementById('spot-desc').textContent = this.activeSpot.desc;
      }
    }

    drawMinimap() {
      const ctx = this.minimapCtx;
      const w = this.minimapCanvas.width;
      const h = this.minimapCanvas.height;
      ctx.clearRect(0, 0, w, h);

      const toMap = (wx, wz) => {
        const ny = 1.0 - (6.0 - wz) / 532.0;
        const nx = 0.52 + wx / 98.0;
        return [nx * w, 14 + ny * (h - 28)];
      };

      const samples = this.world.spline.samples;
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < samples.length; i += 2) {
        const s = samples[i];
        const lx = s.x - s.rx * s.radiusW * 0.92;
        const lz = s.z - s.rz * s.radiusW * 0.92;
        const [px, py] = toMap(lx, lz);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      for (let i = samples.length - 1; i >= 0; i -= 2) {
        const s = samples[i];
        const rx = s.x + s.rx * s.radiusW * 0.92;
        const rz = s.z + s.rz * s.radiusW * 0.92;
        const [px, py] = toMap(rx, rz);
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, h, 0, 0);
      grad.addColorStop(0.0, 'rgba(138, 118, 88, 0.58)');
      grad.addColorStop(0.5, 'rgba(118, 108, 92, 0.65)');
      grad.addColorStop(1.0, 'rgba(148, 132, 106, 0.68)');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(218, 190, 134, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      let startedRiver = false;
      for (let i = 0; i < samples.length; i += 2) {
        const s = samples[i];
        if (s.t >= 0.46 && s.t <= 0.69) {
          const rx = s.x + s.rx * (s.radiusW * 0.32);
          const rz = s.z + s.rz * (s.radiusW * 0.32);
          const [px, py] = toMap(rx, rz);
          if (!startedRiver) { ctx.moveTo(px, py); startedRiver = true; }
          else ctx.lineTo(px, py);
        }
      }
      ctx.strokeStyle = 'rgba(72, 198, 232, 0.72)';
      ctx.lineWidth = 5.5;
      ctx.lineCap = 'round';
      ctx.stroke();

      for (let i = 0; i < SCENIC_SPOTS.length; i++) {
        const sp = SCENIC_SPOTS[i];
        const s = this.world.spline.evaluate(sp.t);
        const wx = s.x + s.rx * (sp.lateralOffset || 0);
        const wz = s.z + s.rz * (sp.lateralOffset || 0);
        const [px, py] = toMap(wx, wz);

        const isVisited = this.visitedSpots.has(sp.index);
        const isCurrent = this.activeSpot && this.activeSpot.index === sp.index;

        ctx.beginPath();
        ctx.arc(px, py, isCurrent ? 3.6 : 2.5, 0, Math.PI * 2);
        if (isCurrent) {
          ctx.fillStyle = '#ffbe55';
        } else if (isVisited) {
          ctx.fillStyle = 'rgba(232, 186, 112, 0.88)';
        } else {
          ctx.fillStyle = 'rgba(180, 212, 224, 0.55)';
        }
        ctx.fill();
      }

      const [dx, dy] = toMap(this.dogPos[0], this.dogPos[2]);
      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(-this.dogYaw);
      ctx.beginPath();
      ctx.moveTo(0, -6.0);
      ctx.lineTo(4.2, 4.5);
      ctx.lineTo(0, 2.2);
      ctx.lineTo(-4.2, 4.5);
      ctx.closePath();
      ctx.fillStyle = '#e89438';
      ctx.fill();
      ctx.strokeStyle = '#181410';
      ctx.lineWidth = 1.0;
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    }

    updatePhysicsAndCamera(dt) {
      if (this.inCoverMode) {
        const s0 = this.world.spline.evaluate(0.022);
        const dogX = s0.x + 1.25;
        const dogZ = s0.z - 0.5;
        const dogY = this.world.getFloorHeight(dogX, dogZ);
        this.dogPos = [dogX, dogY, dogZ];
        // 3/4 side-rear pose facing right-forward so upright ears, snout profile & curled tail shine (Matches 6.png!)
        this.dogYaw = -0.62;

        this.dog.root.position = [dogX, dogY, dogZ];
        this.dog.root.rotation = [0, this.dogYaw, 0];
        this.dog.updateAnimation(dt, 0.0, false);

        this.renderer.cameraPos = [dogX - 1.35, dogY + 1.32, dogZ + 2.95];
        this.renderer.cameraTarget = [dogX - 0.85, dogY + 1.45, dogZ - 4.0];
        return;
      }

      let moveForward = 0;
      let moveTurn = 0;
      if (this.keys['KeyW'] || this.keys['ArrowUp']) moveForward += 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) moveForward -= 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveTurn += 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) moveTurn -= 1;

      if (Math.abs(this.joystickVec[1]) > 0.08) moveForward -= this.joystickVec[1];
      if (Math.abs(this.joystickVec[0]) > 0.08) moveTurn -= this.joystickVec[0];

      const isTrotting = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']);
      let speedFactor = 0;

      if (this.autoGuide) {
        const targetSpot = SCENIC_SPOTS[this.autoTargetSpotIdx];
        const ts = this.world.spline.evaluate(targetSpot.t);
        const tx = ts.x + ts.rx * (targetSpot.lateralOffset || 0);
        const tz = ts.z + ts.rz * (targetSpot.lateralOffset || 0);

        const dx = tx - this.dogPos[0];
        const dz = tz - this.dogPos[2];
        const dist = Math.hypot(dx, dz);

        if (dist < 1.8) {
          this.autoPauseTimer += dt;
          this.forceSniffPose = true;
          speedFactor = 0;
          if (this.autoPauseTimer > 4.2) {
            this.autoPauseTimer = 0;
            this.forceSniffPose = false;
            this.autoTargetSpotIdx = (this.autoTargetSpotIdx + 1) % SCENIC_SPOTS.length;
            if (this.autoTargetSpotIdx === 0) {
              this.teleportToSpot(1);
            }
          }
        } else {
          this.forceSniffPose = false;
          const desiredYaw = Math.atan2(-dx, -dz);
          let diff = desiredYaw - this.dogYaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          this.dogYaw += diff * Math.min(1.0, dt * 4.5);
          this.camYaw = lerp(this.camYaw, this.dogYaw, dt * 2.2);

          const stepSpeed = 6.2;
          this.dogPos[0] += (-Math.sin(this.dogYaw)) * stepSpeed * dt;
          this.dogPos[2] += (-Math.cos(this.dogYaw)) * stepSpeed * dt;
          speedFactor = 1.25;
        }
      } else if (Math.abs(moveForward) > 0.02 || Math.abs(moveTurn) > 0.02) {
        this.dogYaw += moveTurn * 2.1 * dt;
        const moveSpd = (isTrotting ? 9.2 : 5.4) * moveForward;
        this.dogPos[0] += (-Math.sin(this.dogYaw)) * moveSpd * dt;
        this.dogPos[2] += (-Math.cos(this.dogYaw)) * moveSpd * dt;
        speedFactor = Math.abs(moveForward) * (isTrotting ? 1.85 : 1.05);
        if (!this.isDragging && Math.abs(moveForward) > 0.1) {
          let diff = this.dogYaw - this.camYaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          this.camYaw += diff * dt * 2.4;
        }
      }

      const closest = this.world.spline.findClosest(this.dogPos[0], this.dogPos[2]);
      const s = closest.sample;
      this.currentSplineT = s.t;
      const maxLat = s.radiusW * 0.72;
      if (Math.abs(closest.lateral) > maxLat) {
        const clampedLat = Math.sign(closest.lateral) * maxLat;
        this.dogPos[0] = s.x + s.rx * clampedLat;
        this.dogPos[2] = s.z + s.rz * clampedLat;
      }

      this.dogPos[1] = this.world.getFloorHeight(this.dogPos[0], this.dogPos[2]);
      this.dog.root.position = [this.dogPos[0], this.dogPos[1], this.dogPos[2]];
      this.dog.root.rotation = [0, this.dogYaw, 0];
      this.dog.updateAnimation(dt, speedFactor, this.forceSniffPose);

      let nearestSpot = null;
      let nearestDist = Infinity;
      for (let i = 0; i < SCENIC_SPOTS.length; i++) {
        const sp = SCENIC_SPOTS[i];
        const spSample = this.world.spline.evaluate(sp.t);
        const sx = spSample.x + spSample.rx * (sp.lateralOffset || 0);
        const sz = spSample.z + spSample.rz * (sp.lateralOffset || 0);
        const d = Math.hypot(this.dogPos[0] - sx, this.dogPos[2] - sz);
        if (d < nearestDist) {
          nearestDist = d;
          nearestSpot = sp;
        }
      }

      if (nearestSpot && nearestDist < 19.5) {
        const prevVisitedSize = this.visitedSpots.size;
        this.visitedSpots.add(nearestSpot.index);
        if (this.activeSpot !== nearestSpot || this.visitedSpots.size !== prevVisitedSize) {
          this.activeSpot = nearestSpot;
          this.updateHUD();
        }
      } else {
        this.updateHUD();
      }

      const camHorizDist = Math.cos(this.camPitch) * this.camDistance;
      const camVertDist = Math.sin(this.camPitch) * this.camDistance + 1.38;

      const camX = this.dogPos[0] + Math.sin(this.camYaw) * camHorizDist;
      const camZ = this.dogPos[2] + Math.cos(this.camYaw) * camHorizDist;
      const floorAtCam = this.world.getFloorHeight(camX, camZ);
      const camY = Math.max(floorAtCam + 0.65, this.dogPos[1] + camVertDist);

      this.renderer.cameraPos = [camX, camY, camZ];
      this.renderer.cameraTarget = [
        this.dogPos[0] - Math.sin(this.camYaw) * 2.2,
        this.dogPos[1] + 1.15,
        this.dogPos[2] - Math.cos(this.camYaw) * 2.2
      ];
    }

    stepFrame(dt) {
      this.elapsedTime += dt;
      this.updatePhysicsAndCamera(dt);
      this.audio.update(dt, this.currentSplineT, 0);
      this.renderer.render(this.world.root, this.world.lights, this.world.particles, this.elapsedTime, this.dogPos);
      if (!this.inCoverMode) {
        this.drawMinimap();
      }
    }

    animate(now) {
      if (this.paused) return;
      const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTime) * 0.001));
      this.lastTime = now;
      this.stepFrame(dt);
      requestAnimationFrame(this.animate);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.yaolinApp = new YaolinWonderlandApp();
  });
})(window);
