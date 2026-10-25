import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  CircuitSpec,
  VehicleSpec,
  VehicleSetup,
  RaceSimState,
  RaceInputState,
  calculateTunedSpecs,
  buildTrackSegments,
  createInitialRaceState,
  stepRaceSimulation,
  getSegmentAtZ,
  formatLapTime,
  LAP_LENGTH_METERS,
  SEGMENT_LENGTH,
} from '../game/rules';
import { raceAudio } from '../game/sound';

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

const PARTICLE_POOL_SIZE = 128;

interface RaceCanvasViewProps {
  circuit: CircuitSpec;
  vehicle: VehicleSpec;
  setup: VehicleSetup;
  isFullscreenModal: boolean;
  autoStartSignal: number;
  onExitFullscreen?: () => void;
  onRaceCompleted?: (result: {
    circuitId: string;
    vehicleName: string;
    vehicleClass: VehicleSpec['vehicleClass'];
    bestLapSeconds: number;
    topSpeedKmh: number;
  }) => void;
}

export const RaceCanvasView: React.FC<RaceCanvasViewProps> = ({
  circuit,
  vehicle,
  setup,
  isFullscreenModal,
  autoStartSignal,
  onExitFullscreen,
  onRaceCompleted,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Store latest props in refs so 60Hz loop never tears down canvas
  const circuitRef = useRef(circuit);
  const vehicleRef = useRef(vehicle);
  const setupRef = useRef(setup);
  const onRaceCompletedRef = useRef(onRaceCompleted);

  circuitRef.current = circuit;
  vehicleRef.current = vehicle;
  setupRef.current = setup;
  onRaceCompletedRef.current = onRaceCompleted;

  const segmentsRef = useRef(buildTrackSegments(circuit.id));
  const tunedRef = useRef(calculateTunedSpecs(vehicle, setup));
  const simRef = useRef<RaceSimState>(
    createInitialRaceState(circuit, vehicle, setup, 0)
  );

  const keysPressedRef = useRef<Set<string>>(new Set());
  const touchInputRef = useRef<Partial<RaceInputState>>({});

  // Pre-allocated zero-GC particle ring buffer
  const particlePoolRef = useRef<Particle[]>(
    Array.from({ length: PARTICLE_POOL_SIZE }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      size: 3,
      color: '#F59E0B',
    }))
  );
  const particleCursorRef = useRef(0);

  // High-frequency DOM refs so we do not call React setState at 60Hz
  const speedDomRef = useRef<HTMLSpanElement | null>(null);
  const gearDomRef = useRef<HTMLSpanElement | null>(null);
  const rpmBarDomRef = useRef<HTMLDivElement | null>(null);
  const positionDomRef = useRef<HTMLSpanElement | null>(null);
  const lapDomRef = useRef<HTMLSpanElement | null>(null);
  const timerDomRef = useRef<HTMLSpanElement | null>(null);
  const scoreDomRef = useRef<HTMLSpanElement | null>(null);
  const nitroGhostBarRef = useRef<HTMLDivElement | null>(null);
  const nitroFillBarRef = useRef<HTMLDivElement | null>(null);
  const centerCueDomRef = useRef<HTMLDivElement | null>(null);
  const minimapPlayerDotRef = useRef<SVGCircleElement | null>(null);

  const [uiStatus, setUiStatus] = useState<RaceSimState['status']>('title');
  const [nitroPipStates, setNitroPipStates] = useState<
    Array<'full' | 'cracked' | 'empty'>
  >(['full', 'full', 'full']);
  const [isMuted, setIsMuted] = useState<boolean>(raceAudio.isMuted());
  const [, setSnapshotTrigger] = useState(0);

  const spawnParticles = useCallback(
    (
      cx: number,
      cy: number,
      count: number,
      color: string,
      speedSpread: number
    ) => {
      const pool = particlePoolRef.current;
      for (let i = 0; i < count; i++) {
        const idx = particleCursorRef.current;
        particleCursorRef.current = (idx + 1) % PARTICLE_POOL_SIZE;
        const p = pool[idx];
        const angle = -Math.PI * 0.15 - Math.random() * Math.PI * 0.7;
        const spd = (0.4 + Math.random() * 0.8) * speedSpread;
        p.active = true;
        p.x = cx + (Math.random() - 0.5) * 28;
        p.y = cy + (Math.random() - 0.5) * 10;
        p.vx = Math.cos(angle) * spd;
        p.vy = Math.sin(angle) * spd;
        p.life = 0;
        p.maxLife = 0.22 + Math.random() * 0.25;
        p.size = 2.5 + Math.random() * 3.5;
        p.color = color;
      }
    },
    []
  );

  const syncBodyState = useCallback((nextStatus: RaceSimState['status']) => {
    document.body.dataset.state = nextStatus;
    setUiStatus(nextStatus);
  }, []);

  const startOrRestartRace = useCallback(() => {
    const prevBest = simRef.current.bestScore;
    segmentsRef.current = buildTrackSegments(circuitRef.current.id);
    tunedRef.current = calculateTunedSpecs(
      vehicleRef.current,
      setupRef.current
    );
    const fresh = createInitialRaceState(
      circuitRef.current,
      vehicleRef.current,
      setupRef.current,
      prevBest
    );
    fresh.status = 'playing';
    // Give the car an immediate rolling launch so the first seconds feel alive
    fresh.speedKmh = 95;
    simRef.current = fresh;
    keysPressedRef.current.clear();
    touchInputRef.current = {};

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    canvasRef.current?.focus();
    syncBodyState('playing');
    setNitroPipStates(['full', 'full', 'full']);
  }, [syncBodyState]);

  const pauseOrResumeRace = useCallback(() => {
    const current = simRef.current.status;
    if (current === 'playing') {
      simRef.current.status = 'paused';
      raceAudio.stopEngineLoop();
      document.exitPointerLock?.();
      syncBodyState('paused');
    } else if (current === 'paused') {
      simRef.current.status = 'playing';
      keysPressedRef.current.clear();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      canvasRef.current?.focus();
      syncBodyState('playing');
    }
  }, [syncBodyState]);

  const returnToTitle = useCallback(() => {
    const prevBest = simRef.current.bestScore;
    const fresh = createInitialRaceState(
      circuitRef.current,
      vehicleRef.current,
      setupRef.current,
      prevBest
    );
    fresh.status = 'title';
    simRef.current = fresh;
    raceAudio.stopEngineLoop();
    document.exitPointerLock?.();
    syncBodyState('title');
  }, [syncBodyState]);

  // Rebuild track & tuned specs when user switches car/setup/circuit while on title screen
  useEffect(() => {
    segmentsRef.current = buildTrackSegments(circuit.id);
    tunedRef.current = calculateTunedSpecs(vehicle, setup);
    if (simRef.current.status === 'title') {
      simRef.current = createInitialRaceState(
        circuit,
        vehicle,
        setup,
        simRef.current.bestScore
      );
    }
  }, [circuit, vehicle, setup]);

  // Trigger start when parent increments autoStartSignal or ?autostart=1
  useEffect(() => {
    if (autoStartSignal > 0) {
      startOrRestartRace();
    }
  }, [autoStartSignal, startOrRestartRace]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      startOrRestartRace();
    } else {
      document.body.dataset.state = simRef.current.status;
    }
    return () => {
      raceAudio.stopEngineLoop();
    };
  }, [startOrRestartRace]);

  // Window keyboard & focus listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keyboard shortcuts if user is typing in an input or select
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA')
      ) {
        return;
      }

      const code = e.code;
      const status = simRef.current.status;

      if (status === 'title' && isFullscreenModal) {
        if (code === 'Enter' || code === 'Space') {
          e.preventDefault();
          startOrRestartRace();
          return;
        }
      }

      if (code === 'KeyP' || code === 'Escape') {
        if (status === 'playing' || status === 'paused') {
          e.preventDefault();
          pauseOrResumeRace();
          return;
        }
      }

      if (code === 'KeyM') {
        const muted = raceAudio.toggleMute();
        setIsMuted(muted);
        return;
      }

      if (code === 'KeyR' && (status === 'playing' || status === 'paused')) {
        e.preventDefault();
        startOrRestartRace();
        return;
      }

      if (
        status === 'playing' &&
        (code === 'ArrowUp' ||
          code === 'ArrowDown' ||
          code === 'ArrowLeft' ||
          code === 'ArrowRight' ||
          code === 'Space')
      ) {
        e.preventDefault();
      }

      keysPressedRef.current.add(code);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current.delete(e.code);
    };

    const clearHeldInputs = () => {
      keysPressedRef.current.clear();
      touchInputRef.current = {};
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearHeldInputs);
    document.addEventListener('visibilitychange', clearHeldInputs);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearHeldInputs);
      document.removeEventListener('visibilitychange', clearHeldInputs);
    };
  }, [isFullscreenModal, pauseOrResumeRace, startOrRestartRace]);

  // Main 60Hz Canvas2D Simulation & Render Loop (mounted once)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 960;
    let height = 540;

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(320, Math.floor(rect.width));
      height = Math.max(260, Math.floor(rect.height));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    updateCanvasSize();
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(container);

    let rafId = 0;
    let lastTime = performance.now();
    let titleFlyoverZ = 0;
    let lastPipSignature = 'full,full,full';

    const renderFrame = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.05);

      const state = simRef.current;
      const segments = segmentsRef.current;
      const tuned = tunedRef.current;
      const activeCircuit = circuitRef.current;
      const activeVehicle = vehicleRef.current;

      if (state.status === 'title') {
        // Live World Camera Tour flyover
        titleFlyoverZ = (titleFlyoverZ + 185 * dt) % LAP_LENGTH_METERS;
        raceAudio.stopEngineLoop();
      } else if (state.status === 'playing') {
        const keys = keysPressedRef.current;
        const tInput = touchInputRef.current;

        // Survive first 3 seconds gracefully with gentle auto-cruise if no key pressed yet
        const autoCruise =
          state.totalTimeSeconds < 3.0 &&
          keys.size === 0 &&
          !tInput.throttle &&
          !tInput.brake;

        const input: RaceInputState = {
          throttle:
            Boolean(tInput.throttle) ||
            autoCruise ||
            keys.has('KeyW') ||
            keys.has('ArrowUp'),
          brake:
            Boolean(tInput.brake) ||
            keys.has('KeyS') ||
            keys.has('ArrowDown'),
          left:
            Boolean(tInput.left) ||
            keys.has('KeyA') ||
            keys.has('ArrowLeft'),
          right:
            Boolean(tInput.right) ||
            keys.has('KeyD') ||
            keys.has('ArrowRight'),
          nitro:
            Boolean(tInput.nitro) ||
            keys.has('Space') ||
            keys.has('ShiftLeft') ||
            keys.has('ShiftRight'),
        };

        const events = stepRaceSimulation(state, input, segments, tuned, dt);

        raceAudio.updateEngineRpm(state.rpm, state.nitroActive, true);

        if (events.nitroTriggered) {
          raceAudio.playNitroBurst();
          spawnParticles(width * 0.5, height * 0.84, 18, '#38BDF8', 240);
        }
        if (events.collided) {
          raceAudio.playCollisionImpact();
          spawnParticles(width * 0.5, height * 0.78, 24, '#F59E0B', 320);
        }
        if (events.overtook) {
          raceAudio.playOvertakeChime();
        }
        if (events.finishedOutcome) {
          raceAudio.playOutcomeSting(events.finishedOutcome);
          syncBodyState('gameover');
          setSnapshotTrigger((v) => v + 1);
          if (
            events.finishedOutcome === 'victory' &&
            onRaceCompletedRef.current
          ) {
            onRaceCompletedRef.current({
              circuitId: activeCircuit.id,
              vehicleName: activeVehicle.name,
              vehicleClass: activeVehicle.vehicleClass,
              bestLapSeconds:
                state.bestLapSeconds ?? Number((state.totalTimeSeconds / state.totalLaps).toFixed(3)),
              topSpeedKmh: state.topSpeedReachedKmh,
            });
          }
        }

        // Continuous exhaust / tire particles when boosting or off-road
        if (state.nitroActive) {
          spawnParticles(width * 0.5, height * 0.86, 2, '#38BDF8', 160);
        } else if (state.offRoadActive && state.speedKmh > 80) {
          spawnParticles(width * 0.5, height * 0.86, 2, '#A16207', 120);
        }

        // Update high-frequency DOM readouts directly via refs (0 React re-renders)
        if (speedDomRef.current) {
          speedDomRef.current.textContent = String(Math.round(state.speedKmh));
        }
        if (gearDomRef.current) {
          gearDomRef.current.textContent = `G${state.gear}`;
        }
        if (rpmBarDomRef.current) {
          const pct = Math.min(100, Math.round((state.rpm / 9000) * 100));
          rpmBarDomRef.current.style.transform = `scaleX(${pct / 100})`;
        }
        if (positionDomRef.current) {
          positionDomRef.current.textContent = `${state.position}/${state.totalRacers}`;
        }
        if (lapDomRef.current) {
          lapDomRef.current.textContent = `${state.lap}/${state.totalLaps}`;
        }
        if (timerDomRef.current) {
          timerDomRef.current.textContent = `${Math.ceil(state.remainingTimeSeconds)}s`;
        }
        if (scoreDomRef.current) {
          scoreDomRef.current.textContent = String(Math.round(state.score));
        }
        if (nitroFillBarRef.current) {
          nitroFillBarRef.current.style.transform = `scaleX(${
            state.nitroCharge / 300
          })`;
        }
        if (nitroGhostBarRef.current) {
          nitroGhostBarRef.current.style.transform = `scaleX(${
            state.nitroGhostCharge / 300
          })`;
        }
        if (centerCueDomRef.current) {
          if (state.nitroActive) {
            centerCueDomRef.current.textContent = 'KERS NITRO DEPLOYED';
            centerCueDomRef.current.style.opacity = '1';
          } else if (state.slipstreamActive) {
            centerCueDomRef.current.textContent = 'SLIPSTREAM DRAFT +16 KM/H';
            centerCueDomRef.current.style.opacity = '1';
          } else if (state.offRoadActive) {
            centerCueDomRef.current.textContent = 'OFF-TRACK APRON DRAG';
            centerCueDomRef.current.style.opacity = '0.9';
          } else {
            centerCueDomRef.current.style.opacity = '0';
          }
        }
        if (minimapPlayerDotRef.current) {
          const lapProgress =
            ((state.playerZ % LAP_LENGTH_METERS) / LAP_LENGTH_METERS) *
            Math.PI *
            2;
          const mx = 44 + Math.cos(lapProgress - Math.PI / 2) * 28;
          const my = 44 + Math.sin(lapProgress - Math.PI / 2) * 20;
          minimapPlayerDotRef.current.setAttribute('cx', mx.toFixed(1));
          minimapPlayerDotRef.current.setAttribute('cy', my.toFixed(1));
        }

        // Update discrete 3-pip state only when pip threshold changes
        const p1 =
          state.nitroCharge >= 95
            ? 'full'
            : state.nitroCharge > 15
            ? 'cracked'
            : 'empty';
        const p2 =
          state.nitroCharge >= 195
            ? 'full'
            : state.nitroCharge > 110
            ? 'cracked'
            : 'empty';
        const p3 =
          state.nitroCharge >= 290
            ? 'full'
            : state.nitroCharge > 210
            ? 'cracked'
            : 'empty';
        const sig = `${p1},${p2},${p3}`;
        if (sig !== lastPipSignature) {
          lastPipSignature = sig;
          setNitroPipStates([p1, p2, p3]);
        }
      }

      // --- CANVAS 2D PSEUDO-3D ROAD & WORLD RENDER ---
      ctx.save();

      // Apply decaying trauma^2 camera shake on collisions
      if (state.cameraTrauma > 0.01 && state.status === 'playing') {
        const shake = state.cameraTrauma * state.cameraTrauma * 14;
        ctx.translate(
          (Math.random() - 0.5) * shake,
          (Math.random() - 0.5) * shake
        );
      }

      const cameraZ =
        state.status === 'title' ? titleFlyoverZ : state.playerZ;
      const baseSeg = getSegmentAtZ(segments, cameraZ);
      const horizonY = Math.floor(height * 0.43 - baseSeg.elevation * 0.65);

      // Sky gradient matched to circuit theme
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      if (activeCircuit.skyTheme === 'alpine') {
        skyGrad.addColorStop(0, '#090D18');
        skyGrad.addColorStop(0.65, '#162038');
        skyGrad.addColorStop(1, '#2D1E2F');
      } else if (activeCircuit.skyTheme === 'night') {
        skyGrad.addColorStop(0, '#05070D');
        skyGrad.addColorStop(0.7, '#0B1325');
        skyGrad.addColorStop(1, '#122238');
      } else {
        skyGrad.addColorStop(0, '#180E19');
        skyGrad.addColorStop(0.6, '#381B24');
        skyGrad.addColorStop(1, '#6E3228');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, horizonY + 2);

      // Distant mountain / skyline silhouette
      const parallaxX = ((baseSeg.index * 3.5) % width) * 0.25;
      ctx.fillStyle =
        activeCircuit.skyTheme === 'night' ? '#0D1627' : '#131722';
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      for (let x = 0; x <= width; x += 60) {
        const peak =
          Math.sin((x + parallaxX) * 0.014) * 28 +
          Math.cos((x + parallaxX) * 0.031) * 16;
        ctx.lineTo(x, horizonY - 24 - Math.abs(peak));
      }
      ctx.lineTo(width, horizonY);
      ctx.closePath();
      ctx.fill();

      // Ground base below horizon
      ctx.fillStyle =
        activeCircuit.skyTheme === 'desert' ? '#1B1512' : '#0B0E14';
      ctx.fillRect(0, horizonY, width, height - horizonY);

      // Project 36 road slices from back to front
      const drawDistance = 36;
      let curveAccum = 0;
      let curveStep = 0;

      interface ProjectedSlice {
        screenY: number;
        roadHalfWidth: number;
        centerX: number;
        seg: typeof baseSeg;
        depthNorm: number;
      }

      const slices: ProjectedSlice[] = [];
      for (let n = 0; n < drawDistance; n++) {
        const segZ = cameraZ + n * SEGMENT_LENGTH;
        const seg = getSegmentAtZ(segments, segZ);
        const depthNorm = (n + 1) / drawDistance; // 0 near, 1 far
        const perspective = Math.pow(1 - n / drawDistance, 2.15);

        const screenY =
          horizonY +
          (height - horizonY) * Math.pow(1 - n / drawDistance, 1.65) -
          seg.elevation * perspective * 0.9;
        const roadHalfWidth =
          width * (0.045 + 0.44 * Math.pow(1 - n / drawDistance, 1.55));

        curveStep += seg.curve * 1.45;
        curveAccum += curveStep * (1 - perspective * 0.55);

        const playerOffsetPx =
          (state.status === 'title' ? 0 : state.playerX) *
          roadHalfWidth *
          0.85;
        const centerX = width * 0.5 + curveAccum - playerOffsetPx;

        slices.push({
          screenY,
          roadHalfWidth,
          centerX,
          seg,
          depthNorm,
        });
      }

      // Draw slices back-to-front
      for (let n = drawDistance - 2; n >= 0; n--) {
        const curr = slices[n];
        const next = slices[n + 1];
        if (curr.screenY <= next.screenY) continue;

        const isAlt = curr.seg.index % 2 === 0;

        // Off-road apron strip
        ctx.fillStyle =
          activeCircuit.skyTheme === 'desert'
            ? isAlt
              ? '#241B16'
              : '#1D1511'
            : isAlt
            ? '#0E121A'
            : '#0B0E14';
        ctx.fillRect(
          0,
          next.screenY,
          width,
          Math.ceil(curr.screenY - next.screenY) + 1
        );

        // FIA Red / White Rumble Curbs
        const curbWCurr = curr.roadHalfWidth * 1.14;
        const curbWNext = next.roadHalfWidth * 1.14;
        ctx.fillStyle = isAlt ? '#E11D48' : '#E5E7EB';
        ctx.beginPath();
        ctx.moveTo(next.centerX - curbWNext, next.screenY);
        ctx.lineTo(next.centerX + curbWNext, next.screenY);
        ctx.lineTo(curr.centerX + curbWCurr, curr.screenY);
        ctx.lineTo(curr.centerX - curbWCurr, curr.screenY);
        ctx.closePath();
        ctx.fill();

        // Main Asphalt Surface
        const isStartLine = curr.seg.index < 3;
        ctx.fillStyle = isStartLine
          ? isAlt
            ? '#F3F4F6'
            : '#1F2430'
          : isAlt
          ? '#181C26'
          : '#141720';
        ctx.beginPath();
        ctx.moveTo(next.centerX - next.roadHalfWidth, next.screenY);
        ctx.lineTo(next.centerX + next.roadHalfWidth, next.screenY);
        ctx.lineTo(curr.centerX + curr.roadHalfWidth, curr.screenY);
        ctx.lineTo(curr.centerX - curr.roadHalfWidth, curr.screenY);
        ctx.closePath();
        ctx.fill();

        // Racing Lane Dividers
        if (isAlt && !isStartLine) {
          ctx.strokeStyle = 'rgba(243, 244, 246, 0.28)';
          ctx.lineWidth = Math.max(1, (1 - curr.depthNorm) * 3);
          for (const laneOffset of [-0.33, 0.33]) {
            ctx.beginPath();
            ctx.moveTo(
              next.centerX + next.roadHalfWidth * laneOffset,
              next.screenY
            );
            ctx.lineTo(
              curr.centerX + curr.roadHalfWidth * laneOffset,
              curr.screenY
            );
            ctx.stroke();
          }
        }

        // Roadside Scenery Props
        const scale = Math.max(0.15, 1 - curr.depthNorm);
        if (curr.seg.sceneryLeft !== 'none') {
          const sx = curr.centerX - curr.roadHalfWidth * 1.38;
          const sy = curr.screenY;
          ctx.fillStyle =
            curr.seg.sceneryLeft === 'grandstand' ? '#1E293B' : '#1F2430';
          ctx.fillRect(sx - 28 * scale, sy - 46 * scale, 22 * scale, 46 * scale);
          ctx.fillStyle = activeVehicle.primaryColor;
          ctx.fillRect(sx - 28 * scale, sy - 46 * scale, 22 * scale, 6 * scale);
        }
        if (curr.seg.sceneryRight !== 'none') {
          const sx = curr.centerX + curr.roadHalfWidth * 1.24;
          const sy = curr.screenY;
          ctx.fillStyle =
            curr.seg.sceneryRight === 'distance_board' ? '#F59E0B' : '#1F2430';
          ctx.fillRect(sx, sy - 42 * scale, 20 * scale, 42 * scale);
        }
      }

      // Draw Opponent Vehicles sorted back-to-front
      const visibleOpponents = state.opponents
        .map((opp) => {
          let relZ = opp.z - cameraZ;
          if (relZ < -LAP_LENGTH_METERS * 0.5) relZ += LAP_LENGTH_METERS;
          return { opp, relZ };
        })
        .filter(
          (item) =>
            item.relZ > 6 && item.relZ < drawDistance * SEGMENT_LENGTH
        )
        .sort((a, b) => b.relZ - a.relZ);

      for (const { opp, relZ } of visibleOpponents) {
        const sliceIdx = Math.min(
          drawDistance - 1,
          Math.max(0, Math.floor(relZ / SEGMENT_LENGTH))
        );
        const slice = slices[sliceIdx];
        if (!slice) continue;

        const scale = Math.max(0.18, 1 - sliceIdx / drawDistance);
        const carW = 112 * scale;
        const carH = 54 * scale;
        const cx = slice.centerX + opp.x * slice.roadHalfWidth * 0.78;
        const cy = slice.screenY - carH * 0.5;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(cx - carW * 0.52, cy + carH * 0.38, carW * 1.04, carH * 0.22);

        // Opponent Chassis with distinct archetype silhouette & telegraph cue
        ctx.fillStyle = opp.hitFlashTimer > 0 ? '#FFFFFF' : opp.colorPrimary;
        ctx.beginPath();
        ctx.roundRect(cx - carW * 0.48, cy - carH * 0.35, carW * 0.96, carH * 0.75, 6 * scale);
        ctx.fill();

        // Roof canopy
        ctx.fillStyle = '#0A0B0E';
        ctx.fillRect(cx - carW * 0.3, cy - carH * 0.52, carW * 0.6, carH * 0.28);

        // Rear Taillight Bar
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(cx - carW * 0.42, cy - carH * 0.08, carW * 0.22, carH * 0.14);
        ctx.fillRect(cx + carW * 0.2, cy - carH * 0.08, carW * 0.22, carH * 0.14);

        // Visible Attack / Maneuver Telegraph (Amber Hazard / KERS Strobe)
        if (opp.telegraphTimer > 0) {
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = Math.max(1.5, 3 * scale);
          ctx.strokeRect(
            cx - carW * 0.55,
            cy - carH * 0.62,
            carW * 1.1,
            carH * 1.15
          );
        }
      }

      // Draw Player Hero Car when in playing/paused/gameover (or showcase in title)
      const playerCx = width * 0.5;
      const playerCy = height * 0.82;
      const steerTilt =
        state.status === 'playing' ? state.playerVx * 0.035 : 0;

      ctx.save();
      ctx.translate(playerCx, playerCy);
      ctx.rotate(steerTilt);

      // Squash & stretch during Nitro surge
      const scaleX = state.nitroActive ? 1.05 : 1.0;
      const scaleY = state.nitroActive ? 0.94 : 1.0;
      ctx.scale(scaleX, scaleY);

      // Underbody ground-effect shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
      ctx.beginPath();
      ctx.ellipse(0, 26, 86, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rear Tires
      ctx.fillStyle = '#090A0F';
      ctx.fillRect(-78, -6, 24, 30);
      ctx.fillRect(54, -6, 24, 30);

      // Main Rear Diffuser & Widebody Haunches
      ctx.fillStyle =
        state.playerHitFlash > 0.15 ? '#FFFFFF' : activeVehicle.primaryColor;
      ctx.beginPath();
      ctx.moveTo(-72, 18);
      ctx.lineTo(-64, -18);
      ctx.lineTo(-38, -34);
      ctx.lineTo(38, -34);
      ctx.lineTo(64, -18);
      ctx.lineTo(72, 18);
      ctx.closePath();
      ctx.fill();

      // Rear Cabin & Engine Louvers
      ctx.fillStyle = '#11141D';
      ctx.beginPath();
      ctx.moveTo(-40, -18);
      ctx.lineTo(-26, -42);
      ctx.lineTo(26, -42);
      ctx.lineTo(40, -18);
      ctx.closePath();
      ctx.fill();

      // Swan-Neck Carbon Rear Wing
      ctx.fillStyle = '#0D0F17';
      ctx.fillRect(-68, -46, 136, 8);
      ctx.fillStyle = activeVehicle.accentColor;
      ctx.fillRect(-68, -48, 12, 12);
      ctx.fillRect(56, -48, 12, 12);
      ctx.fillRect(-22, -46, 8, 26);
      ctx.fillRect(14, -46, 8, 26);

      // LED Brake & Afterburner Taillight Strip
      ctx.fillStyle = '#FB7185';
      ctx.fillRect(-60, -10, 36, 7);
      ctx.fillRect(24, -10, 36, 7);

      // Dual Titanium Exhausts + Nitro Flame Plume
      ctx.fillStyle = '#9CA3AF';
      ctx.beginPath();
      ctx.arc(-12, 12, 5, 0, Math.PI * 2);
      ctx.arc(12, 12, 5, 0, Math.PI * 2);
      ctx.fill();

      if (state.nitroActive) {
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.moveTo(-17, 15);
        ctx.lineTo(-7, 15);
        ctx.lineTo(-12, 36 + Math.random() * 14);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(7, 15);
        ctx.lineTo(17, 15);
        ctx.lineTo(12, 36 + Math.random() * 14);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();

      // Update & Render Pooled Particle Ring Buffer
      const pool = particlePoolRef.current;
      for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
        const p = pool[i];
        if (!p.active) continue;
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const alpha = 1 - p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;

      ctx.restore();

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [spawnParticles, syncBodyState]);

  const snap = simRef.current.snapshot;

  return (
    <div
      ref={containerRef}
      data-testid="race-viewport"
      className={
        isFullscreenModal
          ? 'fixed inset-0 z-50 w-screen h-screen bg-[#0A0B0E] overflow-hidden select-none'
          : 'relative w-full h-[540px] lg:h-[600px] bg-[#0A0B0E] border border-[#222631] rounded-xl overflow-hidden select-none'
      }
    >
      {/* Isolated 60Hz Canvas Surface */}
      <canvas
        ref={canvasRef}
        tabIndex={0}
        aria-label="Apex Horizon interactive racing track canvas"
        className="block w-full h-full outline-none"
      />

      {/* TITLE OVERLAY STAGE */}
      {uiStatus === 'title' && (
        <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 md:p-10 pointer-events-none bg-gradient-to-r from-[#0A0B0E]/90 via-[#0A0B0E]/55 to-transparent">
          {/* Top-Left Custom Inline SVG Motorsport Emblem Lockup */}
          <div className="max-w-lg pointer-events-auto">
            <svg
              viewBox="0 0 420 96"
              className="w-72 md:w-96 h-auto mb-3"
              role="img"
              aria-label="Apex Horizon Championship Emblem"
            >
              <polygon points="0,14 48,14 34,42 0,42" fill="#E11D48" />
              <polygon points="56,14 76,14 62,42 42,42" fill="#F59E0B" />
              <text
                x="88"
                y="36"
                fill="#F3F4F6"
                fontFamily="JetBrains Mono, monospace"
                fontSize="13"
                fontWeight="600"
                letterSpacing="2"
              >
                FIA GT1 SIMULATOR
              </text>
              <text
                x="0"
                y="84"
                fill="#F3F4F6"
                fontFamily="Barlow Condensed, sans-serif"
                fontSize="54"
                fontWeight="700"
                fontStyle="italic"
                letterSpacing="1"
              >
                APEX HORIZON
              </text>
            </svg>

            <p className="text-sm md:text-base text-[#D1D5DB] leading-relaxed mb-5 max-w-md">
              Selected Setup: <strong className="text-white">{vehicle.name}</strong> on{' '}
              <strong className="text-white">{circuit.name}</strong> ({circuit.laps} Laps · Top-3
              Podium Qualification).
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-start="true"
                onClick={startOrRestartRace}
                className="px-6 py-3 text-sm font-semibold text-white bg-[#E11D48] hover:bg-[#BE123C] rounded-lg transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
              >
                Start Race Now
              </button>
              {isFullscreenModal && onExitFullscreen && (
                <button
                  type="button"
                  onClick={onExitFullscreen}
                  className="px-4 py-3 text-sm font-medium text-[#D1D5DB] bg-[#141720] hover:bg-[#1E2330] border border-[#2A303F] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Return to Paddock Website
                </button>
              )}
            </div>
          </div>

          {/* Flat borderless inline control hint in bottom safe margin */}
          <div className="text-xs font-mono-tabular text-[#D1D5DB]">
            WASD / Arrows Steer &amp; Throttle · Space Nitro Boost · P / Esc Pause · R Restart · M Mute
          </div>
        </div>
      )}

      {/* PLAYING HUD SHELL (World-Matched, Zero backdrop-blur, >=85% clear playfield) */}
      {uiStatus === 'playing' && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-6">
          {/* Top Perimeter Row: Left Position/Lap Cluster + Right Utility Controls */}
          <div className="flex items-start justify-between gap-4">
            {/* Top-Left Cluster: Position, Lap, Checkpoint Timer & Score */}
            <div className="bg-[#0D1017]/90 border border-[#2A3040] rounded-lg px-4 py-2.5 shadow-lg flex items-center gap-5">
              <div>
                <div className="text-[10px] font-mono-tabular text-[#9CA3AF] tracking-wider">
                  POS
                </div>
                <div
                  ref={positionDomRef}
                  className="font-display text-2xl md:text-3xl font-bold text-[#F59E0B] font-mono-tabular leading-none"
                >
                  8/8
                </div>
              </div>

              <div className="h-7 w-px bg-[#222631]" />

              <div>
                <div className="text-[10px] font-mono-tabular text-[#9CA3AF] tracking-wider">
                  LAP
                </div>
                <div
                  ref={lapDomRef}
                  className="font-display text-2xl md:text-3xl font-bold text-white font-mono-tabular leading-none"
                >
                  1/{circuit.laps}
                </div>
              </div>

              <div className="h-7 w-px bg-[#222631]" />

              <div>
                <div className="text-[10px] font-mono-tabular text-[#9CA3AF] tracking-wider">
                  TIME REM
                </div>
                <div
                  ref={timerDomRef}
                  className="font-display text-2xl md:text-3xl font-bold text-white font-mono-tabular leading-none"
                >
                  {circuit.timeLimitSeconds}s
                </div>
              </div>

              <div className="hidden sm:block h-7 w-px bg-[#222631]" />

              <div className="hidden sm:block">
                <div className="text-[10px] font-mono-tabular text-[#9CA3AF] tracking-wider">
                  POINTS
                </div>
                <div
                  ref={scoreDomRef}
                  className="font-display text-2xl md:text-3xl font-bold text-[#38BDF8] font-mono-tabular leading-none"
                >
                  0
                </div>
              </div>
            </div>

            {/* Top-Right Cluster: Corner Minimap + Compact Square SVG Utility Buttons */}
            <div className="flex items-start gap-2.5 pointer-events-auto">
              <div
                className="hidden sm:flex items-center justify-center bg-[#0D1017]/90 border border-[#2A3040] rounded-lg p-1.5 shadow-lg"
                title="Live Circuit Radar"
              >
                <svg
                  viewBox="0 0 88 88"
                  className="w-14 h-14"
                  aria-label="Live circuit progress radar"
                >
                  <ellipse
                    cx="44"
                    cy="44"
                    rx="28"
                    ry="20"
                    fill="none"
                    stroke="#2A3040"
                    strokeWidth="5"
                  />
                  <circle cx="44" cy="24" r="3" fill="#F3F4F6" />
                  <circle
                    ref={minimapPlayerDotRef}
                    cx="44"
                    cy="24"
                    r="4.5"
                    fill="#E11D48"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>

              <button
                type="button"
                tabIndex={-1}
                aria-label={isMuted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
                onClick={(e) => {
                  e.currentTarget.blur();
                  setIsMuted(raceAudio.toggleMute());
                }}
                className="w-10 h-10 flex items-center justify-center bg-[#0D1017]/90 hover:bg-[#191E2B] border border-[#2A3040] rounded-lg text-[#E5E7EB] cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <path
                    d="M11 5L6 9H2V15H6L11 19V5Z"
                    fill="#1F2430"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  {!isMuted ? (
                    <path
                      d="M15.5 8.5C16.8 9.8 16.8 14.2 15.5 15.5M18.5 6C21 8.5 21 15.5 18.5 18"
                      stroke="#38BDF8"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  ) : (
                    <path
                      d="M21 9L15 15M15 9L21 15"
                      stroke="#E11D48"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  )}
                </svg>
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label="Restart Race [R]"
                onClick={(e) => {
                  e.currentTarget.blur();
                  startOrRestartRace();
                }}
                className="w-10 h-10 flex items-center justify-center bg-[#0D1017]/90 hover:bg-[#191E2B] border border-[#2A3040] rounded-lg text-[#E5E7EB] cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <path
                    d="M4 12A8 8 0 1 1 6.3 17.6M4 12V7M4 12H9"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label="Pause Race [P]"
                onClick={(e) => {
                  e.currentTarget.blur();
                  pauseOrResumeRace();
                }}
                className="w-10 h-10 flex items-center justify-center bg-[#0D1017]/90 hover:bg-[#191E2B] border border-[#2A3040] rounded-lg text-[#E5E7EB] cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <rect
                    x="6"
                    y="5"
                    width="4"
                    height="14"
                    rx="1"
                    fill="#1F2430"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <rect
                    x="14"
                    y="5"
                    width="4"
                    height="14"
                    rx="1"
                    fill="#1F2430"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                </svg>
              </button>

              {isFullscreenModal && onExitFullscreen && (
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Exit Fullscreen Race"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    raceAudio.stopEngineLoop();
                    onExitFullscreen();
                  }}
                  className="px-3 h-10 flex items-center justify-center bg-[#0D1017]/90 hover:bg-[#191E2B] border border-[#2A3040] rounded-lg text-xs font-medium text-[#D1D5DB] cursor-pointer whitespace-nowrap shrink-0"
                >
                  Paddock
                </button>
              )}
            </div>
          </div>

          {/* Center Gaze Cue (Slipstream / Nitro / Off-track status) */}
          <div className="flex justify-center">
            <div
              ref={centerCueDomRef}
              style={{ opacity: 0 }}
              className="px-3 py-1 rounded bg-[#0D1017]/90 border border-[#38BDF8]/50 text-xs font-mono-tabular font-semibold text-[#38BDF8] transition-opacity duration-150"
            >
              SLIPSTREAM READY
            </div>
          </div>

          {/* Bottom Perimeter Row: Touch Controls (mobile) + Bottom-Right Telemetry Tachometer & 3-State Nitro Pips */}
          <div className="flex items-end justify-between gap-4">
            {/* On-screen touch/pointer controls for mobile or mouse testing */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                aria-label="Steer Left"
                onPointerDown={() => {
                  touchInputRef.current.left = true;
                }}
                onPointerUp={() => {
                  touchInputRef.current.left = false;
                }}
                onPointerLeave={() => {
                  touchInputRef.current.left = false;
                }}
                className="w-11 h-11 flex items-center justify-center bg-[#0D1017]/90 active:bg-[#E11D48] border border-[#2A3040] rounded-lg text-white text-sm font-mono-tabular cursor-pointer"
              >
                ◀
              </button>
              <button
                type="button"
                aria-label="Steer Right"
                onPointerDown={() => {
                  touchInputRef.current.right = true;
                }}
                onPointerUp={() => {
                  touchInputRef.current.right = false;
                }}
                onPointerLeave={() => {
                  touchInputRef.current.right = false;
                }}
                className="w-11 h-11 flex items-center justify-center bg-[#0D1017]/90 active:bg-[#E11D48] border border-[#2A3040] rounded-lg text-white text-sm font-mono-tabular cursor-pointer"
              >
                ▶
              </button>
              <button
                type="button"
                aria-label="Deploy Nitro [Space]"
                onPointerDown={() => {
                  touchInputRef.current.throttle = true;
                  touchInputRef.current.nitro = true;
                }}
                onPointerUp={() => {
                  touchInputRef.current.nitro = false;
                }}
                onPointerLeave={() => {
                  touchInputRef.current.nitro = false;
                }}
                className="px-3.5 h-11 flex items-center justify-center bg-[#0D1017]/90 active:bg-[#38BDF8] border border-[#38BDF8]/60 rounded-lg text-[#38BDF8] active:text-[#0A0B0E] text-xs font-mono-tabular font-semibold cursor-pointer whitespace-nowrap shrink-0"
              >
                NITRO [SPACE]
              </button>
            </div>

            {/* Bottom-Right Telemetry Cluster: Speed Hero Readout, Gear, RPM & 3-State Nitro Pips */}
            <div className="bg-[#0D1017]/90 border border-[#2A3040] rounded-lg px-4 py-3 shadow-lg min-w-[230px]">
              <div className="flex items-baseline justify-between gap-4 mb-1.5">
                <div>
                  <span
                    ref={speedDomRef}
                    className="font-display text-4xl font-bold text-white font-mono-tabular tracking-tight leading-none"
                  >
                    95
                  </span>
                  <span className="ml-1.5 text-[11px] font-mono-tabular text-[#9CA3AF]">
                    KM/H
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono-tabular text-[#9CA3AF] mr-1.5">
                    GEAR
                  </span>
                  <span
                    ref={gearDomRef}
                    className="font-display text-2xl font-bold text-[#E11D48] font-mono-tabular leading-none"
                  >
                    G2
                  </span>
                </div>
              </div>

              {/* RPM Shift Bar */}
              <div className="w-full h-1.5 bg-[#1B1F2A] rounded overflow-hidden mb-2.5">
                <div
                  ref={rpmBarDomRef}
                  style={{ transform: 'scaleX(0.35)', transformOrigin: 'left' }}
                  className="w-full h-full bg-[#E11D48]"
                />
              </div>

              {/* Code-Authored 3-State Nitro Vitality Sockets + Trailing Ghost Bar */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-mono-tabular text-[#9CA3AF]">
                  KERS NITRO CELLS
                </span>
                <div className="flex items-center gap-1.5">
                  {nitroPipStates.map((pipState, idx) => (
                    <svg
                      key={idx}
                      viewBox="0 0 24 24"
                      className="w-4 h-4"
                      aria-label={`Nitro Cell ${idx + 1}: ${pipState}`}
                    >
                      {/* Outer dark silhouette socket */}
                      <polygon
                        points="4,4 20,4 17,20 1,20"
                        fill="#0A0B0E"
                        stroke="#4B5563"
                        strokeWidth="2"
                      />
                      {pipState === 'full' && (
                        <>
                          <polygon points="6,6 18,6 15.5,18 3.5,18" fill="#38BDF8" />
                          <line
                            x1="6.5"
                            y1="7"
                            x2="17"
                            y2="7"
                            stroke="#E0F2FE"
                            strokeWidth="1.5"
                          />
                        </>
                      )}
                      {pipState === 'cracked' && (
                        <>
                          <polygon points="6,11 17,11 15.5,18 3.5,18" fill="#F59E0B" />
                          <path
                            d="M 8 6 L 12 12 L 9 17"
                            stroke="#0A0B0E"
                            strokeWidth="1.6"
                            fill="none"
                          />
                        </>
                      )}
                    </svg>
                  ))}
                </div>
              </div>

              {/* Continuous Nitro Bar with Delayed Trailing Drain Ghost Bar */}
              <div className="relative w-full h-1.5 bg-[#1B1F2A] rounded overflow-hidden">
                <div
                  ref={nitroGhostBarRef}
                  style={{ transform: 'scaleX(1)', transformOrigin: 'left' }}
                  className="absolute inset-0 bg-[#F59E0B]/70"
                />
                <div
                  ref={nitroFillBarRef}
                  style={{ transform: 'scaleX(1)', transformOrigin: 'left' }}
                  className="relative w-full h-full bg-[#38BDF8]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAUSE MODAL (`document.body.dataset.state === 'paused'`) */}
      {uiStatus === 'paused' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-modal-title"
          className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-[#0A0B0E]/85 pointer-events-auto"
        >
          <div className="w-full max-w-md bg-[#12141A] border border-[#2A3040] rounded-xl p-6 shadow-2xl">
            <div className="text-xs font-mono-tabular text-[#F59E0B] mb-1">
              TELEMETRY FROZEN · SESSION PAUSED
            </div>
            <h3
              id="pause-modal-title"
              className="font-display text-3xl font-bold text-white tracking-wide mb-4"
            >
              Race Control Pause
            </h3>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-[#0A0B0E] border border-[#222631] rounded-lg p-3">
                <div className="text-[11px] text-[#9CA3AF]">Position</div>
                <div className="font-mono-tabular text-lg font-semibold text-white">
                  P{simRef.current.position}/{simRef.current.totalRacers}
                </div>
              </div>
              <div className="bg-[#0A0B0E] border border-[#222631] rounded-lg p-3">
                <div className="text-[11px] text-[#9CA3AF]">Top Speed</div>
                <div className="font-mono-tabular text-lg font-semibold text-white">
                  {simRef.current.topSpeedReachedKmh} km/h
                </div>
              </div>
              <div className="bg-[#0A0B0E] border border-[#222631] rounded-lg p-3">
                <div className="text-[11px] text-[#9CA3AF]">Points</div>
                <div className="font-mono-tabular text-lg font-semibold text-[#38BDF8]">
                  {Math.round(simRef.current.score)}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={pauseOrResumeRace}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#E11D48] hover:bg-[#BE123C] rounded-lg cursor-pointer whitespace-nowrap shrink-0"
              >
                Resume Race
              </button>
              <button
                type="button"
                onClick={startOrRestartRace}
                className="px-4 py-2.5 text-sm font-medium text-white bg-[#1B1F2A] hover:bg-[#252B3B] border border-[#2E3646] rounded-lg cursor-pointer whitespace-nowrap shrink-0"
              >
                Restart
              </button>
              <button
                type="button"
                onClick={returnToTitle}
                className="px-4 py-2.5 text-sm font-medium text-[#9CA3AF] hover:text-white bg-[#0A0B0E] border border-[#222631] rounded-lg cursor-pointer whitespace-nowrap shrink-0"
              >
                Title
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VICTORY / GAME OVER MODAL (`document.body.dataset.state === 'gameover'`) */}
      {uiStatus === 'gameover' && snap && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="outcome-modal-title"
          className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-[#0A0B0E]/88 pointer-events-auto"
        >
          <div className="w-full max-w-lg bg-[#12141A] border border-[#2A3040] rounded-xl p-6 shadow-2xl">
            <div
              className={`text-xs font-mono-tabular mb-1 ${
                snap.outcome === 'victory' ? 'text-[#10B981]' : 'text-[#F59E0B]'
              }`}
            >
              {snap.outcome === 'victory'
                ? 'CHECKERED FLAG · PODIUM QUALIFIED'
                : 'RACE SESSION CONCLUDED'}
            </div>
            <h3
              id="outcome-modal-title"
              className="font-display text-3xl font-bold text-white tracking-wide mb-1"
            >
              {snap.outcome === 'victory'
                ? `Victory — P${snap.finalPosition} Overall`
                : 'Session Complete — Try Again'}
            </h3>
            <p className="text-sm text-[#9CA3AF] mb-5">{snap.reason}</p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-[#0A0B0E] border border-[#222631] rounded-lg p-3">
                <div className="text-[11px] text-[#9CA3AF]">
                  {snap.outcome === 'victory' ? 'Clear Time' : 'Distance Reached'}
                </div>
                <div className="font-mono-tabular text-lg font-semibold text-white">
                  {snap.outcome === 'victory'
                    ? formatLapTime(snap.clearTimeSeconds)
                    : `${Math.round(snap.distanceCompletedRatio * 100)}%`}
                </div>
              </div>

              <div className="bg-[#0A0B0E] border border-[#222631] rounded-lg p-3">
                <div className="text-[11px] text-[#9CA3AF]">Score / Best</div>
                <div className="font-mono-tabular text-lg font-semibold text-[#F59E0B]">
                  {snap.score} / {snap.bestScore}
                </div>
              </div>

              <div className="bg-[#0A0B0E] border border-[#222631] rounded-lg p-3">
                <div className="text-[11px] text-[#9CA3AF]">
                  Overtakes · Top Speed
                </div>
                <div className="font-mono-tabular text-lg font-semibold text-[#38BDF8]">
                  {snap.overtakesCount} · {snap.topSpeedReachedKmh} km/h
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-start="true"
                onClick={startOrRestartRace}
                className="flex-1 px-5 py-2.5 text-sm font-semibold text-white bg-[#E11D48] hover:bg-[#BE123C] rounded-lg cursor-pointer whitespace-nowrap shrink-0"
              >
                {snap.outcome === 'victory' ? 'Play Again' : 'Try Again'}
              </button>
              <button
                type="button"
                onClick={returnToTitle}
                className="px-4 py-2.5 text-sm font-medium text-[#D1D5DB] hover:text-white bg-[#1B1F2A] border border-[#2E3646] rounded-lg cursor-pointer whitespace-nowrap shrink-0"
              >
                Title Screen
              </button>
              {isFullscreenModal && onExitFullscreen && (
                <button
                  type="button"
                  onClick={onExitFullscreen}
                  className="px-4 py-2.5 text-sm font-medium text-[#9CA3AF] hover:text-white bg-[#0A0B0E] border border-[#222631] rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                >
                  Paddock Website
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
