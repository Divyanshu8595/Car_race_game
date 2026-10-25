export type VehicleClass = 'GT1 Prototype' | 'Track Spec' | 'Street Tuned';

export type DownforceSetup = 'Low Drag' | 'Balanced' | 'High Aero';
export type GearSetup = 'Short Sprint' | 'Standard' | 'Tall Top-End';
export type TireCompound = 'Soft Slick' | 'Medium Endurance';

export interface VehicleSetup {
  downforce: DownforceSetup;
  gearRatio: GearSetup;
  tireCompound: TireCompound;
}

export interface VehicleSpec {
  id: string;
  name: string;
  chassisCode: string;
  vehicleClass: VehicleClass;
  drivetrain: string;
  engineLayout: string;
  powerHp: number;
  weightKg: number;
  baseTopSpeedKmh: number;
  baseAccel0to100s: number;
  baseLateralG: number;
  baseNitroCapacity: number;
  primaryColor: string;
  accentColor: string;
  description: string;
}

export interface TunedVehicleMetrics {
  topSpeedKmh: number;
  accel0to100s: number;
  lateralG: number;
  nitroCapacity: number;
  handlingScore: number;
  accelerationFactor: number;
  cornerStiffness: number;
}

export type SkyTheme = 'alpine' | 'night' | 'desert';

export interface CircuitSpec {
  id: string;
  name: string;
  location: string;
  lengthKm: number;
  laps: number;
  corners: number;
  elevationDeltaM: number;
  surface: string;
  recordTime: string;
  recordHolder: string;
  recordVehicle: string;
  timeLimitSeconds: number;
  skyTheme: SkyTheme;
  difficulty: 'Intermediate' | 'Technical' | 'High-Speed';
  description: string;
}

export interface TrackSegment {
  index: number;
  z: number;
  curve: number;
  elevation: number;
  sceneryLeft: 'none' | 'pine' | 'grandstand' | 'distance_board' | 'light_pylon' | 'canyon_rock';
  sceneryRight: 'none' | 'pine' | 'grandstand' | 'distance_board' | 'light_pylon' | 'canyon_rock';
}

export type OpponentArchetype = 'blocker' | 'sprinter' | 'drifter';

export interface OpponentCar {
  id: string;
  driverName: string;
  archetype: OpponentArchetype;
  z: number;
  x: number; // -1..1 road width
  vx: number;
  speed: number;
  baseMaxSpeed: number;
  colorPrimary: string;
  colorAccent: string;
  telegraphTimer: number;
  targetLaneX: number;
  burstCooldown: number;
  hitFlashTimer: number;
}

export interface RaceInputState {
  throttle: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
  nitro: boolean;
}

export interface RaceSnapshot {
  outcome: 'victory' | 'gameover';
  reason: string;
  finalPosition: number;
  totalRacers: number;
  clearTimeSeconds: number;
  bestLapSeconds: number | null;
  topSpeedReachedKmh: number;
  overtakesCount: number;
  collisionsCount: number;
  distanceCompletedRatio: number;
  score: number;
  bestScore: number;
}

export interface RaceSimState {
  status: 'title' | 'playing' | 'paused' | 'gameover';
  circuitId: string;
  vehicleId: string;
  playerZ: number;
  playerX: number;
  playerVx: number;
  speedKmh: number;
  maxSpeedKmh: number;
  rpm: number;
  gear: number;
  nitroCharge: number; // 0..300 (3 pips of 100)
  nitroGhostCharge: number;
  nitroActive: boolean;
  lap: number;
  totalLaps: number;
  lapTimeSeconds: number;
  bestLapSeconds: number | null;
  totalTimeSeconds: number;
  remainingTimeSeconds: number;
  position: number;
  totalRacers: number;
  score: number;
  bestScore: number;
  topSpeedReachedKmh: number;
  overtakesCount: number;
  collisionsCount: number;
  slipstreamActive: boolean;
  offRoadActive: boolean;
  hitstopTimer: number;
  cameraTrauma: number;
  playerHitFlash: number;
  opponents: OpponentCar[];
  snapshot: RaceSnapshot | null;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  pilotName: string;
  callsign: string;
  circuitId: string;
  vehicleName: string;
  vehicleClass: VehicleClass;
  lapTime: string;
  topSpeedKmh: number;
  verified: boolean;
}

export interface RegistrationFormInput {
  pilotName: string;
  email: string;
  callsign: string;
  vehicleId: string;
  circuitId: string;
}

export interface RegistrationValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof RegistrationFormInput, string>>;
}

export const SEGMENT_LENGTH = 10; // meters per segment
export const SEGMENTS_PER_LAP = 480; // 4.8 km per lap in simulation units
export const LAP_LENGTH_METERS = SEGMENT_LENGTH * SEGMENTS_PER_LAP;

export const VEHICLES: VehicleSpec[] = [
  {
    id: 'valkyrie-gt1',
    name: 'Valkyrie AMR-GT1',
    chassisCode: 'VK-01 EVO',
    vehicleClass: 'GT1 Prototype',
    drivetrain: 'RWD 7-Speed Sequential',
    engineLayout: '4.0L Twin-Turbo Flat-6',
    powerHp: 840,
    weightKg: 1080,
    baseTopSpeedKmh: 342,
    baseAccel0to100s: 2.4,
    baseLateralG: 2.15,
    baseNitroCapacity: 300,
    primaryColor: '#E11D48',
    accentColor: '#F59E0B',
    description:
      'Carbon-monocoque endurance prototype engineered with ground-effect venturi tunnels and active swan-neck rear aero.',
  },
  {
    id: 'solaris-track',
    name: 'Solaris RS-Clubsport',
    chassisCode: 'SR-992 GT',
    vehicleClass: 'Track Spec',
    drivetrain: 'AWD Torque-Vectoring',
    engineLayout: '3.8L Naturally Aspirated Flat-6',
    powerHp: 690,
    weightKg: 1220,
    baseTopSpeedKmh: 318,
    baseAccel0to100s: 2.7,
    baseLateralG: 2.02,
    baseNitroCapacity: 300,
    primaryColor: '#F59E0B',
    accentColor: '#38BDF8',
    description:
      'Precision-balanced homologation track special featuring forged magnesium wheels and ultra-responsive front turn-in.',
  },
  {
    id: 'vantablack-street',
    name: 'Vantablack ZR-Twin',
    chassisCode: 'VB-34 SPEC',
    vehicleClass: 'Street Tuned',
    drivetrain: 'RWD 6-Speed Dogbox',
    engineLayout: '3.0L Twin-Scroll Inline-6',
    powerHp: 640,
    weightKg: 1340,
    baseTopSpeedKmh: 308,
    baseAccel0to100s: 2.9,
    baseLateralG: 1.84,
    baseNitroCapacity: 300,
    primaryColor: '#38BDF8',
    accentColor: '#E11D48',
    description:
      'Widebody midnight expressway runner built for sustained high-boost slipstreaming and high-angle corner exits.',
  },
  {
    id: 'aetherion-lmp',
    name: 'Aetherion LMP-Evo',
    chassisCode: 'AE-9X HYBRID',
    vehicleClass: 'GT1 Prototype',
    drivetrain: 'Hybrid E-AWD Sequential',
    engineLayout: '3.5L V6 + Front KERS',
    powerHp: 910,
    weightKg: 995,
    baseTopSpeedKmh: 352,
    baseAccel0to100s: 2.3,
    baseLateralG: 2.24,
    baseNitroCapacity: 300,
    primaryColor: '#10B981',
    accentColor: '#F59E0B',
    description:
      'Works championship hypercar combining kinetic front-axle deployment with low-drag titanium exhaust architecture.',
  },
];

export const CIRCUITS: CircuitSpec[] = [
  {
    id: 'alpine-pass',
    name: 'Alpine Hairpin Pass',
    location: 'Bernese Oberland · Switzerland',
    lengthKm: 4.8,
    laps: 2,
    corners: 14,
    elevationDeltaM: 310,
    surface: 'Dry Granite Tarmac',
    recordTime: '01:18.420',
    recordHolder: 'M. Lindqvist',
    recordVehicle: 'Valkyrie AMR-GT1',
    timeLimitSeconds: 135,
    skyTheme: 'alpine',
    difficulty: 'Technical',
    description:
      'High-altitude mountain ribbon with sweeping granite cliffside hairpins, rapid elevation drops, and late-braking zones.',
  },
  {
    id: 'neo-tokyo',
    name: 'Neo-Tokyo Bay Loop',
    location: 'Wangan & Shibaura · Japan',
    lengthKm: 5.4,
    laps: 2,
    corners: 11,
    elevationDeltaM: 85,
    surface: 'Night Polymer Asphalt',
    recordTime: '01:12.890',
    recordHolder: 'K. Takahashi',
    recordVehicle: 'Aetherion LMP-Evo',
    timeLimitSeconds: 130,
    skyTheme: 'night',
    difficulty: 'High-Speed',
    description:
      'Multi-lane elevated coastal expressway featuring long slipstream straights, sodium-lit tunnels, and high-speed chicanes.',
  },
  {
    id: 'mojave-canyon',
    name: 'Mojave Mirage Circuit',
    location: 'Red Rock Basin · Nevada',
    lengthKm: 6.1,
    laps: 2,
    corners: 16,
    elevationDeltaM: 240,
    surface: 'Abrasive Desert Tarmac',
    recordTime: '01:24.150',
    recordHolder: 'S. Vance',
    recordVehicle: 'Solaris RS-Clubsport',
    timeLimitSeconds: 140,
    skyTheme: 'desert',
    difficulty: 'Intermediate',
    description:
      'Sun-drenched sandstone canyon circuit with blind cresting S-curves, banked bowl turns, and wide overtaking aprons.',
  },
];

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'lb-1',
    rank: 1,
    pilotName: 'Marcus Lindqvist',
    callsign: 'LND-01',
    circuitId: 'alpine-pass',
    vehicleName: 'Valkyrie AMR-GT1',
    vehicleClass: 'GT1 Prototype',
    lapTime: '01:18.420',
    topSpeedKmh: 344,
    verified: true,
  },
  {
    id: 'lb-2',
    rank: 2,
    pilotName: 'Kenji Takahashi',
    callsign: 'TKH-88',
    circuitId: 'neo-tokyo',
    vehicleName: 'Aetherion LMP-Evo',
    vehicleClass: 'GT1 Prototype',
    lapTime: '01:12.890',
    topSpeedKmh: 355,
    verified: true,
  },
  {
    id: 'lb-3',
    rank: 3,
    pilotName: 'Sienna Vance',
    callsign: 'VNC-14',
    circuitId: 'mojave-canyon',
    vehicleName: 'Solaris RS-Clubsport',
    vehicleClass: 'Track Spec',
    lapTime: '01:24.150',
    topSpeedKmh: 321,
    verified: true,
  },
  {
    id: 'lb-4',
    rank: 4,
    pilotName: 'Elena Rostova',
    callsign: 'RST-07',
    circuitId: 'alpine-pass',
    vehicleName: 'Solaris RS-Clubsport',
    vehicleClass: 'Track Spec',
    lapTime: '01:19.905',
    topSpeedKmh: 324,
    verified: true,
  },
  {
    id: 'lb-5',
    rank: 5,
    pilotName: 'Devon Mercer',
    callsign: 'MRC-22',
    circuitId: 'neo-tokyo',
    vehicleName: 'Vantablack ZR-Twin',
    vehicleClass: 'Street Tuned',
    lapTime: '01:15.340',
    topSpeedKmh: 316,
    verified: true,
  },
];

export function calculateTunedSpecs(
  vehicle: VehicleSpec,
  setup: VehicleSetup
): TunedVehicleMetrics {
  let topSpeedDelta = 0;
  let accelDelta = 0;
  let lateralGDelta = 0;

  if (setup.downforce === 'Low Drag') {
    topSpeedDelta += 11;
    lateralGDelta -= 0.11;
    accelDelta -= 0.04;
  } else if (setup.downforce === 'High Aero') {
    topSpeedDelta -= 9;
    lateralGDelta += 0.16;
    accelDelta += 0.05;
  }

  if (setup.gearRatio === 'Short Sprint') {
    topSpeedDelta -= 8;
    accelDelta -= 0.18;
  } else if (setup.gearRatio === 'Tall Top-End') {
    topSpeedDelta += 10;
    accelDelta += 0.14;
  }

  if (setup.tireCompound === 'Soft Slick') {
    lateralGDelta += 0.12;
    accelDelta -= 0.08;
  } else {
    topSpeedDelta += 3;
    lateralGDelta -= 0.04;
  }

  const topSpeedKmh = Math.round(vehicle.baseTopSpeedKmh + topSpeedDelta);
  const accel0to100s = Number(
    Math.max(1.8, vehicle.baseAccel0to100s + accelDelta).toFixed(2)
  );
  const lateralG = Number(
    Math.max(1.4, vehicle.baseLateralG + lateralGDelta).toFixed(2)
  );

  const handlingScore = Math.min(100, Math.round((lateralG / 2.5) * 100));
  const accelerationFactor = Number((3.2 / accel0to100s).toFixed(2));
  const cornerStiffness = Number((lateralG / 2.0).toFixed(2));

  return {
    topSpeedKmh,
    accel0to100s,
    lateralG,
    nitroCapacity: vehicle.baseNitroCapacity,
    handlingScore,
    accelerationFactor,
    cornerStiffness,
  };
}

export function buildTrackSegments(circuitId: string): TrackSegment[] {
  const segments: TrackSegment[] = [];
  const curveScale =
    circuitId === 'alpine-pass' ? 1.25 : circuitId === 'neo-tokyo' ? 0.85 : 1.05;
  const hillScale =
    circuitId === 'alpine-pass' ? 1.35 : circuitId === 'neo-tokyo' ? 0.55 : 1.0;

  for (let i = 0; i < SEGMENTS_PER_LAP; i++) {
    let curve = 0;
    if (i >= 35 && i < 95) curve = 0.75 * curveScale;
    else if (i >= 120 && i < 185) curve = -0.9 * curveScale;
    else if (i >= 210 && i < 255) curve = 0.55 * curveScale;
    else if (i >= 280 && i < 340) curve = -0.7 * curveScale;
    else if (i >= 365 && i < 425) curve = 0.85 * curveScale;

    const elevation =
      Math.sin((i / SEGMENTS_PER_LAP) * Math.PI * 4) * 18 * hillScale +
      Math.cos((i / SEGMENTS_PER_LAP) * Math.PI * 2) * 10 * hillScale;

    let sceneryLeft: TrackSegment['sceneryLeft'] = 'none';
    let sceneryRight: TrackSegment['sceneryRight'] = 'none';

    if (i < 24 || i > SEGMENTS_PER_LAP - 20) {
      if (i % 4 === 0) {
        sceneryLeft = 'grandstand';
        sceneryRight = 'grandstand';
      }
    } else if (i % 12 === 0) {
      sceneryLeft =
        circuitId === 'neo-tokyo'
          ? 'light_pylon'
          : circuitId === 'mojave-canyon'
          ? 'canyon_rock'
          : 'pine';
    } else if (i % 18 === 0) {
      sceneryRight = 'distance_board';
    } else if (i % 9 === 0) {
      sceneryRight =
        circuitId === 'neo-tokyo'
          ? 'light_pylon'
          : circuitId === 'mojave-canyon'
          ? 'canyon_rock'
          : 'pine';
    }

    segments.push({
      index: i,
      z: i * SEGMENT_LENGTH,
      curve,
      elevation,
      sceneryLeft,
      sceneryRight,
    });
  }

  return segments;
}

export function getSegmentAtZ(
  segments: TrackSegment[],
  z: number
): TrackSegment {
  const count = segments.length;
  const rawIdx = Math.floor(z / SEGMENT_LENGTH) % count;
  const normalizedIdx = rawIdx < 0 ? rawIdx + count : rawIdx;
  return segments[normalizedIdx];
}

export function createInitialOpponents(): OpponentCar[] {
  const archetypes: OpponentArchetype[] = [
    'blocker',
    'sprinter',
    'drifter',
    'sprinter',
    'blocker',
    'drifter',
    'sprinter',
  ];
  const names = [
    'M. Lindqvist',
    'K. Takahashi',
    'S. Vance',
    'E. Rostova',
    'D. Mercer',
    'A. Bellini',
    'H. Lindholm',
  ];
  const colors = [
    { primary: '#E11D48', accent: '#FBBF24' },
    { primary: '#F59E0B', accent: '#38BDF8' },
    { primary: '#38BDF8', accent: '#E11D48' },
    { primary: '#10B981', accent: '#F3F4F6' },
    { primary: '#A855F7', accent: '#F59E0B' },
    { primary: '#F97316', accent: '#38BDF8' },
    { primary: '#EC4899', accent: '#F3F4F6' },
  ];

  return archetypes.map((archetype, idx) => {
    const startZ = 180 + idx * 420;
    const laneX = idx % 2 === 0 ? -0.45 : 0.45;
    return {
      id: `opp-${idx + 1}`,
      driverName: names[idx],
      archetype,
      z: startZ,
      x: laneX,
      vx: 0,
      speed: 205 + idx * 6,
      baseMaxSpeed: 235 + idx * 8,
      colorPrimary: colors[idx].primary,
      colorAccent: colors[idx].accent,
      telegraphTimer: 0,
      targetLaneX: laneX,
      burstCooldown: 2.5 + idx * 0.6,
      hitFlashTimer: 0,
    };
  });
}

export function createInitialRaceState(
  circuit: CircuitSpec,
  vehicle: VehicleSpec,
  setup: VehicleSetup,
  bestScore = 0
): RaceSimState {
  const tuned = calculateTunedSpecs(vehicle, setup);
  return {
    status: 'title',
    circuitId: circuit.id,
    vehicleId: vehicle.id,
    playerZ: 0,
    playerX: 0,
    playerVx: 0,
    speedKmh: 0,
    maxSpeedKmh: tuned.topSpeedKmh,
    rpm: 1200,
    gear: 1,
    nitroCharge: tuned.nitroCapacity,
    nitroGhostCharge: tuned.nitroCapacity,
    nitroActive: false,
    lap: 1,
    totalLaps: circuit.laps,
    lapTimeSeconds: 0,
    bestLapSeconds: null,
    totalTimeSeconds: 0,
    remainingTimeSeconds: circuit.timeLimitSeconds,
    position: 8,
    totalRacers: 8,
    score: 0,
    bestScore,
    topSpeedReachedKmh: 0,
    overtakesCount: 0,
    collisionsCount: 0,
    slipstreamActive: false,
    offRoadActive: false,
    hitstopTimer: 0,
    cameraTrauma: 0,
    playerHitFlash: 0,
    opponents: createInitialOpponents(),
    snapshot: null,
  };
}

/**
 * Updates an individual opponent using 1 of 3 genuinely distinct AI driving policies:
 * 1. 'blocker': Monitors player lateral X when player approaches within 160m behind and defends the inside lane.
 * 2. 'sprinter': Holds racing apex on curves and fires periodic straight-line KERS speed bursts.
 * 3. 'drifter': Sweeps wide sinusoidal out-in-out drift arcs with telegraph hazard flash before lane sweeps.
 */
export function updateOpponentAI(
  opp: OpponentCar,
  playerZ: number,
  playerX: number,
  segment: TrackSegment,
  simDt: number,
  elapsedTime: number
): void {
  if (opp.hitFlashTimer > 0) {
    opp.hitFlashTimer = Math.max(0, opp.hitFlashTimer - simDt);
  }

  const distBehindOpponent = opp.z - playerZ;

  if (opp.archetype === 'blocker') {
    // Policy 1: Defensive line blocker when player is closing in behind
    if (distBehindOpponent > 0 && distBehindOpponent < 160) {
      opp.targetLaneX = Math.max(-0.72, Math.min(0.72, playerX * 0.88));
      opp.telegraphTimer = Math.min(0.5, opp.telegraphTimer + simDt);
    } else {
      opp.targetLaneX = Math.max(-0.6, Math.min(0.6, -segment.curve * 0.3));
      opp.telegraphTimer = Math.max(0, opp.telegraphTimer - simDt);
    }
    const dx = opp.targetLaneX - opp.x;
    opp.vx = dx * 3.4;
    opp.x += opp.vx * simDt;
    const cornerPenalty = Math.abs(segment.curve) * 14;
    const targetSpeed = opp.baseMaxSpeed - cornerPenalty;
    opp.speed += (targetSpeed - opp.speed) * Math.min(1, simDt * 3.0);
  } else if (opp.archetype === 'sprinter') {
    // Policy 2: Apex hugger + periodic straightaway KERS sprint bursts
    opp.burstCooldown -= simDt;
    const isStraight = Math.abs(segment.curve) < 0.35;
    let boostBonus = 0;
    if (isStraight && opp.burstCooldown <= 0) {
      boostBonus = 36;
      opp.telegraphTimer = 0.45;
      if (opp.burstCooldown < -1.4) {
        opp.burstCooldown = 3.6;
      }
    } else {
      opp.telegraphTimer = Math.max(0, opp.telegraphTimer - simDt);
    }
    opp.targetLaneX = Math.max(-0.65, Math.min(0.65, -segment.curve * 0.5));
    opp.vx = (opp.targetLaneX - opp.x) * 4.2;
    opp.x += opp.vx * simDt;
    const targetSpeed =
      opp.baseMaxSpeed + boostBonus - Math.abs(segment.curve) * 18;
    opp.speed += (targetSpeed - opp.speed) * Math.min(1, simDt * 4.0);
  } else {
    // Policy 3 ('drifter'): Wide sinusoidal out-in-out sweeper with lane-switch telegraph
    const phase = elapsedTime * 1.4 + opp.baseMaxSpeed * 0.1;
    const desiredX = Math.sin(phase) * 0.68;
    if (Math.abs(desiredX - opp.x) > 0.28) {
      opp.telegraphTimer = 0.4;
    } else {
      opp.telegraphTimer = Math.max(0, opp.telegraphTimer - simDt);
    }
    opp.targetLaneX = desiredX;
    opp.vx = (opp.targetLaneX - opp.x) * 2.8;
    opp.x += opp.vx * simDt;
    // Maintains high speed in curves while drifting
    const targetSpeed = opp.baseMaxSpeed + Math.abs(segment.curve) * 6;
    opp.speed += (targetSpeed - opp.speed) * Math.min(1, simDt * 2.5);
  }

  opp.x = Math.max(-0.85, Math.min(0.85, opp.x));
  const metersPerSec = (opp.speed * 1000) / 3600;
  opp.z += metersPerSec * simDt;
}

export interface StepSimulationEvents {
  collided: boolean;
  overtook: boolean;
  lapCompleted: boolean;
  nitroTriggered: boolean;
  finishedOutcome: 'victory' | 'gameover' | null;
}

export function stepRaceSimulation(
  state: RaceSimState,
  input: RaceInputState,
  segments: TrackSegment[],
  tuned: TunedVehicleMetrics,
  rawDt: number
): StepSimulationEvents {
  const events: StepSimulationEvents = {
    collided: false,
    overtook: false,
    lapCompleted: false,
    nitroTriggered: false,
    finishedOutcome: null,
  };

  if (state.status !== 'playing') {
    return events;
  }

  // Clamp dt <= 0.05s per ultra-mode rules
  const dt = Math.min(Math.max(rawDt, 0), 0.05);

  // Decay camera trauma and hit flash in real dt
  state.cameraTrauma = Math.max(0, state.cameraTrauma - dt * 1.8);
  state.playerHitFlash = Math.max(0, state.playerHitFlash - dt);

  if (state.hitstopTimer > 0) {
    state.hitstopTimer = Math.max(0, state.hitstopTimer - dt);
    return events;
  }

  const simDt = dt;
  state.totalTimeSeconds += simDt;
  state.lapTimeSeconds += simDt;
  state.remainingTimeSeconds = Math.max(0, state.remainingTimeSeconds - simDt);

  const currentSegment = getSegmentAtZ(segments, state.playerZ);

  // Nitro handling
  const wasNitroActive = state.nitroActive;
  if (input.nitro && state.nitroCharge > 8 && input.throttle) {
    state.nitroActive = true;
    state.nitroCharge = Math.max(0, state.nitroCharge - 62 * simDt);
    if (!wasNitroActive) {
      events.nitroTriggered = true;
    }
  } else {
    state.nitroActive = false;
    // Recharge slowly on throttle, faster in slipstream
    const rechargeRate = state.slipstreamActive ? 28 : 11;
    state.nitroCharge = Math.min(
      tuned.nitroCapacity,
      state.nitroCharge + rechargeRate * simDt
    );
  }

  // Trailing ghost bar for nitro
  if (state.nitroGhostCharge > state.nitroCharge) {
    state.nitroGhostCharge = Math.max(
      state.nitroCharge,
      state.nitroGhostCharge - 48 * simDt
    );
  } else {
    state.nitroGhostCharge = state.nitroCharge;
  }

  // Check slipstream behind any opponent within 95m ahead and aligned in X
  let slipstream = false;
  for (const opp of state.opponents) {
    const dz = opp.z - state.playerZ;
    if (dz > 12 && dz < 95 && Math.abs(opp.x - state.playerX) < 0.34) {
      slipstream = true;
      break;
    }
  }
  state.slipstreamActive = slipstream;

  const effectiveTopSpeed =
    tuned.topSpeedKmh +
    (state.nitroActive ? 42 : 0) +
    (state.slipstreamActive ? 16 : 0);

  // Longitudinal physics
  if (input.throttle) {
    const speedRatio = state.speedKmh / Math.max(1, effectiveTopSpeed);
    const baseAccel = 115 * tuned.accelerationFactor * (1 - speedRatio * 0.55);
    const nitroBoost = state.nitroActive ? 85 : 0;
    state.speedKmh += (baseAccel + nitroBoost) * simDt;
  } else if (input.brake) {
    state.speedKmh -= 220 * simDt;
  } else {
    // Aerodynamic drag & rolling resistance
    state.speedKmh -= 48 * simDt;
  }

  // Off-road shoulder penalty
  state.offRoadActive = Math.abs(state.playerX) > 1.02;
  if (state.offRoadActive && state.speedKmh > 125) {
    state.speedKmh -= 145 * simDt;
  }

  state.speedKmh = Math.max(0, Math.min(effectiveTopSpeed, state.speedKmh));
  if (state.speedKmh > state.topSpeedReachedKmh) {
    state.topSpeedReachedKmh = Math.round(state.speedKmh);
  }

  // Gear & RPM calculation
  const gearThresholds = [0, 68, 122, 176, 228, 282, 330];
  let gear = 1;
  for (let g = gearThresholds.length - 1; g >= 1; g--) {
    if (state.speedKmh >= gearThresholds[g]) {
      gear = g + 1;
      break;
    }
  }
  state.gear = Math.min(7, gear);
  const lowBound = gearThresholds[state.gear - 1] ?? 0;
  const highBound = gearThresholds[state.gear] ?? tuned.topSpeedKmh + 40;
  const gearProgress = Math.max(
    0,
    Math.min(1, (state.speedKmh - lowBound) / Math.max(1, highBound - lowBound))
  );
  state.rpm = Math.round(2400 + gearProgress * 6600);

  // Lateral steering & centrifugal force
  const steerSpeedFactor = Math.min(1, state.speedKmh / 90);
  const steerInput = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const steerAuthority = 2.15 * tuned.cornerStiffness;
  state.playerVx = steerInput * steerAuthority * steerSpeedFactor;

  const speedNorm = state.speedKmh / Math.max(1, tuned.topSpeedKmh);
  const centrifugalPush =
    (currentSegment.curve * speedNorm * speedNorm * 0.58) /
    Math.max(0.75, tuned.cornerStiffness);

  // Subtle racing-line assist when no manual steering is held so car stays on tarmac
  const assistPull =
    steerInput === 0 && Math.abs(state.playerX) > 0.45
      ? -state.playerX * 0.85
      : 0;

  state.playerX += (state.playerVx - centrifugalPush + assistPull) * simDt;
  state.playerX = Math.max(-1.45, Math.min(1.45, state.playerX));

  // Advance player Z
  const prevPlayerZ = state.playerZ;
  const playerMetersPerSec = (state.speedKmh * 1000) / 3600;
  state.playerZ += playerMetersPerSec * simDt;

  // Score accumulates from clean speed + slipstream + nitro
  const speedPoints =
    Math.round(
      playerMetersPerSec *
        simDt *
        (state.offRoadActive ? 0.3 : 1.2) *
        (state.slipstreamActive ? 1.5 : 1.0)
    );
  state.score += speedPoints;
  if (state.score > state.bestScore) {
    state.bestScore = state.score;
  }

  // Update opponents and check overtakes + collisions
  let opponentsAhead = 0;
  for (const opp of state.opponents) {
    const wasAhead = opp.z > prevPlayerZ;
    const oppSeg = getSegmentAtZ(segments, opp.z);
    updateOpponentAI(
      opp,
      state.playerZ,
      state.playerX,
      oppSeg,
      simDt,
      state.totalTimeSeconds
    );

    const isAheadNow = opp.z > state.playerZ;
    if (wasAhead && !isAheadNow) {
      state.overtakesCount += 1;
      state.score += 250;
      events.overtook = true;
    }

    // Check bounding-box collision
    const dz = Math.abs(opp.z - state.playerZ);
    const dx = Math.abs(opp.x - state.playerX);
    if (dz < 11 && dx < 0.32 && state.playerHitFlash <= 0) {
      events.collided = true;
      state.collisionsCount += 1;
      state.hitstopTimer = 0.045;
      state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.65);
      state.playerHitFlash = 0.35;
      opp.hitFlashTimer = 0.25;

      // Momentum transfer & separation impulse
      state.speedKmh = Math.max(65, state.speedKmh * 0.76);
      opp.speed = Math.min(opp.baseMaxSpeed + 30, opp.speed + 25);
      if (state.playerZ <= opp.z) {
        opp.z += 9;
      }
      const pushDir = state.playerX >= opp.x ? 1 : -1;
      state.playerX = Math.max(-1.35, Math.min(1.35, state.playerX + pushDir * 0.24));
    }

    if (opp.z > state.playerZ) {
      opponentsAhead += 1;
    }
  }

  state.position = 1 + opponentsAhead;
  if (state.score > state.bestScore) {
    state.bestScore = state.score;
  }

  // Check lap completion
  const completedLaps = Math.floor(state.playerZ / LAP_LENGTH_METERS);
  const newLap = completedLaps + 1;
  if (newLap > state.lap) {
    events.lapCompleted = true;
    if (
      state.bestLapSeconds === null ||
      state.lapTimeSeconds < state.bestLapSeconds
    ) {
      state.bestLapSeconds = Number(state.lapTimeSeconds.toFixed(3));
    }
    state.lapTimeSeconds = 0;
    state.lap = Math.min(state.totalLaps, newLap);
  }

  // Check race finish (completed all laps)
  const totalRaceDistance = state.totalLaps * LAP_LENGTH_METERS;
  if (state.playerZ >= totalRaceDistance) {
    // Podium finish (Top 3) = Victory; 4th or lower = Game Over (Defeat)
    const isVictory = state.position <= 3;
    const outcome = isVictory ? 'victory' : 'gameover';
    const podiumBonus = isVictory ? (4 - state.position) * 1500 : 0;
    state.score += podiumBonus;
    if (state.score > state.bestScore) {
      state.bestScore = state.score;
    }
    state.status = 'gameover';
    state.snapshot = {
      outcome,
      reason: isVictory
        ? `Podium P${state.position} Finish — Checkered Flag`
        : `Finished P${state.position} — Top 3 Required for Podium Qualification`,
      finalPosition: state.position,
      totalRacers: state.totalRacers,
      clearTimeSeconds: Number(state.totalTimeSeconds.toFixed(2)),
      bestLapSeconds: state.bestLapSeconds,
      topSpeedReachedKmh: state.topSpeedReachedKmh,
      overtakesCount: state.overtakesCount,
      collisionsCount: state.collisionsCount,
      distanceCompletedRatio: 1,
      score: state.score,
      bestScore: state.bestScore,
    };
    events.finishedOutcome = outcome;
    return events;
  }

  // Check time limit expiration
  if (state.remainingTimeSeconds <= 0) {
    state.status = 'gameover';
    const ratio = Math.min(1, state.playerZ / totalRaceDistance);
    state.snapshot = {
      outcome: 'gameover',
      reason: 'Checkpoint Time Limit Expired',
      finalPosition: state.position,
      totalRacers: state.totalRacers,
      clearTimeSeconds: Number(state.totalTimeSeconds.toFixed(2)),
      bestLapSeconds: state.bestLapSeconds,
      topSpeedReachedKmh: state.topSpeedReachedKmh,
      overtakesCount: state.overtakesCount,
      collisionsCount: state.collisionsCount,
      distanceCompletedRatio: Number(ratio.toFixed(2)),
      score: state.score,
      bestScore: state.bestScore,
    };
    events.finishedOutcome = 'gameover';
  }

  return events;
}

export function formatLapTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  const millis = Math.floor((safe - Math.floor(safe)) * 1000);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

export function validateRegistrationForm(
  input: RegistrationFormInput
): RegistrationValidationResult {
  const errors: Partial<Record<keyof RegistrationFormInput, string>> = {};

  const trimmedName = input.pilotName.trim();
  if (!trimmedName) {
    errors.pilotName = 'Pilot full name is required.';
  } else if (trimmedName.length < 2) {
    errors.pilotName = 'Pilot name must be at least 2 characters.';
  }

  const trimmedEmail = input.email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!trimmedEmail) {
    errors.email = 'Telemetry dispatch email is required.';
  } else if (!emailRegex.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address (e.g., pilot@apex racing.org).';
  }

  const trimmedCallsign = input.callsign.trim().toUpperCase();
  const callsignRegex = /^[A-Z0-9-]{3,7}$/;
  if (!trimmedCallsign) {
    errors.callsign = '3–7 character paddock callsign is required.';
  } else if (!callsignRegex.test(trimmedCallsign)) {
    errors.callsign = 'Use 3–7 alphanumeric characters or hyphens (e.g., APX-09).';
  }

  if (!input.vehicleId.trim()) {
    errors.vehicleId = 'Select a homologated vehicle entry.';
  }

  if (!input.circuitId.trim()) {
    errors.circuitId = 'Select a primary qualifying circuit.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
