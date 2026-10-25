import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VEHICLES,
  CIRCUITS,
  calculateTunedSpecs,
  buildTrackSegments,
  createInitialRaceState,
  stepRaceSimulation,
  updateOpponentAI,
  validateRegistrationForm,
  LAP_LENGTH_METERS,
} from './rules';

test('calculateTunedSpecs modifies top speed, acceleration, and lateral G accurately', () => {
  const car = VEHICLES[0];
  const lowDrag = calculateTunedSpecs(car, {
    downforce: 'Low Drag',
    gearRatio: 'Tall Top-End',
    tireCompound: 'Medium Endurance',
  });
  const highAero = calculateTunedSpecs(car, {
    downforce: 'High Aero',
    gearRatio: 'Short Sprint',
    tireCompound: 'Soft Slick',
  });

  assert.equal(lowDrag.topSpeedKmh > highAero.topSpeedKmh, true);
  assert.equal(highAero.lateralG > lowDrag.lateralG, true);
  assert.equal(highAero.accel0to100s < lowDrag.accel0to100s, true);
});

test('stepRaceSimulation accelerates vehicle, clamps dt, and activates nitro boost', () => {
  const car = VEHICLES[0];
  const circuit = CIRCUITS[0];
  const setup = {
    downforce: 'Balanced' as const,
    gearRatio: 'Standard' as const,
    tireCompound: 'Soft Slick' as const,
  };
  const tuned = calculateTunedSpecs(car, setup);
  const segments = buildTrackSegments(circuit.id);
  const state = createInitialRaceState(circuit, car, setup, 0);
  state.status = 'playing';

  // Even if rawDt is huge (1.0s), stepRaceSimulation clamps it to 0.05s
  const events = stepRaceSimulation(
    state,
    { throttle: true, brake: false, left: false, right: false, nitro: true },
    segments,
    tuned,
    1.0
  );

  assert.equal(events.nitroTriggered, true);
  assert.equal(state.nitroActive, true);
  assert.equal(state.speedKmh > 0, true);
  assert.equal(state.totalTimeSeconds <= 0.0501, true);
});

test('updateOpponentAI produces distinct behavior across blocker, sprinter, and drifter', () => {
  const segments = buildTrackSegments('alpine-pass');
  const straightSeg = segments[0];

  const blocker = {
    id: 'b1',
    driverName: 'Blocker',
    archetype: 'blocker' as const,
    z: 100,
    x: 0,
    vx: 0,
    speed: 200,
    baseMaxSpeed: 240,
    colorPrimary: '#fff',
    colorAccent: '#000',
    telegraphTimer: 0,
    targetLaneX: 0,
    burstCooldown: 0,
    hitFlashTimer: 0,
  };

  const sprinter = {
    ...blocker,
    id: 's1',
    archetype: 'sprinter' as const,
    burstCooldown: -0.1,
  };

  const drifter = {
    ...blocker,
    id: 'd1',
    archetype: 'drifter' as const,
  };

  // Player is at z=20 (80m behind blocker) and at x=0.6
  updateOpponentAI(blocker, 20, 0.6, straightSeg, 0.05, 1.2);
  updateOpponentAI(sprinter, 20, 0.6, straightSeg, 0.05, 1.2);
  updateOpponentAI(drifter, 20, 0.6, straightSeg, 0.05, 1.2);

  // Blocker tracks player's positive X
  assert.equal(blocker.targetLaneX > 0.4, true);
  // Sprinter holds center apex on straight and gains burst speed
  assert.equal(Math.abs(sprinter.targetLaneX) < 0.05, true);
  assert.equal(sprinter.speed > blocker.speed, true);
  // Drifter follows sinusoidal target lane X
  assert.notEqual(drifter.targetLaneX, sprinter.targetLaneX);
});

test('stepRaceSimulation triggers victory snapshot when finishing laps in Top 3', () => {
  const car = VEHICLES[0];
  const circuit = CIRCUITS[0];
  const setup = {
    downforce: 'Balanced' as const,
    gearRatio: 'Standard' as const,
    tireCompound: 'Soft Slick' as const,
  };
  const tuned = calculateTunedSpecs(car, setup);
  const segments = buildTrackSegments(circuit.id);
  const state = createInitialRaceState(circuit, car, setup, 500);
  state.status = 'playing';
  state.speedKmh = 300;
  // Place player just before finish line of final lap, ahead of all opponents
  state.playerZ = circuit.laps * LAP_LENGTH_METERS - 1;
  state.opponents.forEach((o) => {
    o.z = 100;
  });

  const events = stepRaceSimulation(
    state,
    { throttle: true, brake: false, left: false, right: false, nitro: false },
    segments,
    tuned,
    0.05
  );

  assert.equal(events.finishedOutcome, 'victory');
  assert.equal(state.status, 'gameover');
  assert.notEqual(state.snapshot, null);
  assert.equal(state.snapshot?.outcome, 'victory');
  assert.equal(state.snapshot?.finalPosition, 1);
});

test('validateRegistrationForm enforces required fields and valid formats', () => {
  const invalid = validateRegistrationForm({
    pilotName: '',
    email: 'invalid-email',
    callsign: 'A',
    vehicleId: '',
    circuitId: '',
  });
  assert.equal(invalid.valid, false);
  assert.equal(Boolean(invalid.errors.pilotName), true);
  assert.equal(Boolean(invalid.errors.email), true);
  assert.equal(Boolean(invalid.errors.callsign), true);

  const valid = validateRegistrationForm({
    pilotName: 'Ayrton Vance',
    email: 'ayrton@apexhorizon.io',
    callsign: 'AYR-01',
    vehicleId: 'valkyrie-gt1',
    circuitId: 'alpine-pass',
  });
  assert.equal(valid.valid, true);
  assert.equal(Object.keys(valid.errors).length, 0);
});
