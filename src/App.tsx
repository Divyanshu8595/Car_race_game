import React, { useState, useEffect, useCallback } from 'react';
import {
  VEHICLES,
  CIRCUITS,
  INITIAL_LEADERBOARD,
  VehicleSpec,
  CircuitSpec,
  VehicleSetup,
  LeaderboardEntry,
  formatLapTime,
  calculateTunedSpecs,
} from './game/rules';
import { RaceCanvasView } from './components/RaceCanvasView';
import { GarageSection } from './components/GarageSection';
import { CircuitsAndLeagueSection } from './components/CircuitsAndLeagueSection';

export default function App() {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleSpec>(
    VEHICLES[0]
  );
  const [selectedCircuit, setSelectedCircuit] = useState<CircuitSpec>(
    CIRCUITS[0]
  );
  const [setup, setSetup] = useState<VehicleSetup>({
    downforce: 'Balanced',
    gearRatio: 'Standard',
    tireCompound: 'Soft Slick',
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(
    INITIAL_LEADERBOARD
  );
  const [isFullscreenRace, setIsFullscreenRace] = useState<boolean>(false);
  const [autoStartSignal, setAutoStartSignal] = useState<number>(0);

  // Support ?autostart=1 to boot directly into full-screen active race
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setIsFullscreenRace(true);
      setAutoStartSignal((n) => n + 1);
    }
  }, []);

  const handleLaunchRaceNow = useCallback(() => {
    setIsFullscreenRace(true);
    setAutoStartSignal((n) => n + 1);
  }, []);

  const handleLaunchWithVehicle = useCallback((vehicle: VehicleSpec) => {
    setSelectedVehicle(vehicle);
    setIsFullscreenRace(true);
    setAutoStartSignal((n) => n + 1);
  }, []);

  const handleLaunchCircuitRace = useCallback((circuit: CircuitSpec) => {
    setSelectedCircuit(circuit);
    setIsFullscreenRace(true);
    setAutoStartSignal((n) => n + 1);
  }, []);

  const handleRaceCompleted = useCallback(
    (result: {
      circuitId: string;
      vehicleName: string;
      vehicleClass: VehicleSpec['vehicleClass'];
      bestLapSeconds: number;
      topSpeedKmh: number;
    }) => {
      setLeaderboard((prev) => [
        {
          id: `lb-race-${Date.now()}`,
          rank: 1,
          pilotName: 'You (Active Session)',
          callsign: 'PLY-01',
          circuitId: result.circuitId,
          vehicleName: result.vehicleName,
          vehicleClass: result.vehicleClass,
          lapTime: formatLapTime(result.bestLapSeconds),
          topSpeedKmh: result.topSpeedKmh,
          verified: true,
        },
        ...prev,
      ]);
    },
    []
  );

  const handleRegisterPilot = useCallback((newEntry: LeaderboardEntry) => {
    setLeaderboard((prev) => [newEntry, ...prev]);
  }, []);

  const tuned = calculateTunedSpecs(selectedVehicle, setup);

  // When in full-viewport Game Shell mode, hide website chrome per game_title_and_hud.md
  if (isFullscreenRace) {
    return (
      <main className="w-screen h-screen bg-[#0A0B0E] overflow-hidden">
        <RaceCanvasView
          circuit={selectedCircuit}
          vehicle={selectedVehicle}
          setup={setup}
          isFullscreenModal={true}
          autoStartSignal={autoStartSignal}
          onExitFullscreen={() => setIsFullscreenRace(false)}
          onRaceCompleted={handleRaceCompleted}
        />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#F3F4F6] flex flex-col">
      {/* STRICT 3-ZONE TOP BAR CONTRACT */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-4 bg-[#0A0B0E]/95 border-b border-[#1D212C]">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="font-display text-2xl font-bold tracking-wider text-white whitespace-nowrap shrink-0"
        >
          APEX HORIZON
        </a>

        {/* Zone 2: 4–5 concise single-line text navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#9CA3AF]"
        >
          <a
            href="#simulator"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Simulator
          </a>
          <a
            href="#features"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Physics
          </a>
          <a
            href="#vehicles"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Vehicles
          </a>
          <a
            href="#circuits"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Circuits
          </a>
          <a
            href="#register"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            League Pass
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleLaunchRaceNow}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#E11D48] hover:bg-[#BE123C] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Launch Fullscreen Race
          </button>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* HERO & INTERACTIVE SIMULATOR ARENA SECTION */}
        <section id="simulator" className="scroll-mt-20 pt-10 pb-16 md:pt-14 md:pb-20">
          <div className="max-w-[1200px] mx-auto px-6">
            {/* Hero Proposition Header */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-8">
              <div className="lg:col-span-8">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular text-[#9CA3AF] mb-3">
                  <span>FIA GT1 ENDURANCE SIMULATION</span>
                  <span aria-hidden="true">·</span>
                  <span>MUNICH TELEMETRY DIVISION</span>
                  <span aria-hidden="true">·</span>
                  <span>INSTANT BROWSER ENGINE</span>
                </div>
                <h1
                  style={{
                    fontSize: 'clamp(2.25rem, 4vw, 3.75rem)',
                    textWrap: 'balance',
                  }}
                  className="font-display font-bold text-white leading-[1.05] tracking-tight"
                >
                  Precision Motorsport Physics You Can Drive Right in Your Browser
                </h1>
              </div>

              <div className="lg:col-span-4 flex flex-col justify-between gap-4">
                <p className="text-sm text-[#D1D5DB] leading-relaxed">
                  Configure ground-effect aerodynamics, draft past three distinct
                  rival AI archetypes, and deploy KERS hybrid boost across
                  laser-scanned mountain and expressway circuits.
                </p>
              </div>
            </div>

            {/* Interactive Embedded Race Viewport */}
            <RaceCanvasView
              circuit={selectedCircuit}
              vehicle={selectedVehicle}
              setup={setup}
              isFullscreenModal={false}
              autoStartSignal={autoStartSignal}
              onRaceCompleted={handleRaceCompleted}
            />

            {/* Full-Width 4-Column Quick Session Configuration Strip Below Hero Viewport */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
              <div className="bg-[#12141A] border border-[#222631] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#9CA3AF]">Active Chassis</div>
                  <div className="text-sm font-semibold text-white">
                    {selectedVehicle.name}
                  </div>
                </div>
                <span className="text-xs font-mono-tabular text-[#E11D48]">
                  {tuned.topSpeedKmh} km/h
                </span>
              </div>

              <div className="bg-[#12141A] border border-[#222631] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#9CA3AF]">Active Circuit</div>
                  <div className="text-sm font-semibold text-white">
                    {selectedCircuit.name}
                  </div>
                </div>
                <span className="text-xs font-mono-tabular text-[#F59E0B]">
                  {selectedCircuit.lengthKm.toFixed(1)} km
                </span>
              </div>

              <div className="bg-[#12141A] border border-[#222631] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#9CA3AF]">Dyno Aero &amp; Tires</div>
                  <div className="text-sm font-semibold text-white">
                    {setup.downforce} · {setup.tireCompound}
                  </div>
                </div>
                <span className="text-xs font-mono-tabular text-[#38BDF8]">
                  {tuned.lateralG.toFixed(2)} G
                </span>
              </div>

              <div className="bg-[#12141A] border border-[#222631] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#9CA3AF]">Cockpit Mode</div>
                  <div className="text-sm font-semibold text-white">
                    Full-Viewport Shell
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLaunchRaceNow}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#E11D48] hover:bg-[#BE123C] rounded-md cursor-pointer whitespace-nowrap shrink-0"
                >
                  Expand View
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ASYMMETRIC BENTO-GRID CORE CAPABILITIES & PHYSICS SECTION */}
        <section
          id="features"
          className="scroll-mt-20 py-20 border-t border-[#1D212C] bg-[#0D0F14]"
        >
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="max-w-2xl mb-12">
              <div className="text-xs font-mono-tabular text-[#9CA3AF] mb-2">
                SIMULATION ARCHITECTURE &amp; RACECRAFT MECHANICS
              </div>
              <h2
                style={{ textWrap: 'balance' }}
                className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight"
              >
                Built for Split-Second Braking &amp; Wheel-to-Wheel Overtakes
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bento Card 1: Span 2 */}
              <div className="lg:col-span-2 bg-[#12141A] border border-[#222631] rounded-xl p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono-tabular text-[#9CA3AF] mb-2">
                    AERO WAKE &amp; HYBRID DEPLOYMENT
                  </div>
                  <h3 className="font-display text-2xl font-bold text-white mb-3">
                    01. Dynamic Slipstream Pockets &amp; 3-Cell KERS Nitro Architecture
                  </h3>
                  <p className="text-sm text-[#D1D5DB] leading-relaxed mb-6">
                    Tucking within 95 meters behind a rival chassis slices
                    aerodynamic drag, adding +16 km/h terminal velocity while
                    doubling kinetic battery harvest rate from 11 to 28 units
                    per second. Deploy stored KERS energy on corner exit for an
                    instant +42 km/h straightaway surge.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#222631] text-xs font-mono-tabular">
                  <div>
                    <div className="text-[#9CA3AF]">DRAFT WINDOW</div>
                    <div className="text-base font-semibold text-white">
                      12m – 95m
                    </div>
                  </div>
                  <div>
                    <div className="text-[#9CA3AF]">KERS SURGE DELTA</div>
                    <div className="text-base font-semibold text-[#38BDF8]">
                      +42 km/h Peak
                    </div>
                  </div>
                  <div>
                    <div className="text-[#9CA3AF]">WAKE HARVEST</div>
                    <div className="text-base font-semibold text-[#F59E0B]">
                      2.5x Recharge
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento Card 2: Span 1 */}
              <div className="bg-[#12141A] border border-[#222631] rounded-xl p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono-tabular text-[#9CA3AF] mb-2">
                    AUTONOMOUS RACECRAFT
                  </div>
                  <h3 className="font-display text-2xl font-bold text-white mb-3">
                    02. Three Distinct Opponent AI Policies
                  </h3>
                  <p className="text-sm text-[#D1D5DB] leading-relaxed mb-6">
                    Compete against Apex Blockers that defend the inside line,
                    Slipstream Sprinters that fire straight-line KERS bursts, and
                    Outrun Sweepers that telegraph wide lane transitions with
                    amber hazard strobes.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#222631] text-xs font-mono-tabular text-[#9CA3AF]">
                  7 Rival Grid Slots · 0.4s Maneuver Telegraphs
                </div>
              </div>

              {/* Bento Card 3: Span 1 */}
              <div className="bg-[#12141A] border border-[#222631] rounded-xl p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono-tabular text-[#9CA3AF] mb-2">
                    SURFACE &amp; ELEVATION MODEL
                  </div>
                  <h3 className="font-display text-2xl font-bold text-white mb-3">
                    03. Centrifugal Load &amp; Apron Drag
                  </h3>
                  <p className="text-sm text-[#D1D5DB] leading-relaxed mb-6">
                    High-speed hairpins exert lateral centrifugal push inversely
                    proportional to your tire compound and downforce trim.
                    Dropping wheels beyond FIA rumble curbs triggers immediate
                    apron drag.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#222631] text-xs font-mono-tabular text-[#9CA3AF]">
                  Clamped 50ms Physics Step · Hitstop Impulse
                </div>
              </div>

              {/* Bento Card 4: Span 2 */}
              <div className="lg:col-span-2 bg-[#12141A] border border-[#222631] rounded-xl p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono-tabular text-[#9CA3AF] mb-2">
                    SYNTHESIZED POWERTRAIN AUDIO
                  </div>
                  <h3 className="font-display text-2xl font-bold text-white mb-3">
                    04. Real-Time Web Audio Flat-6 &amp; Hybrid Turbine Synthesis
                  </h3>
                  <p className="text-sm text-[#D1D5DB] leading-relaxed mb-6">
                    Zero external audio asset lag. Our procedural Web Audio
                    oscillator bank tracks live RPM across all 7 sequential
                    gears (2,400–9,000 RPM) and layers pitch-varied KERS
                    ignition whooshes, chassis contact impacts, and overtake
                    telemetry chimes.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#222631]">
                  <span className="text-xs font-mono-tabular text-[#9CA3AF]">
                    7-Speed Sequential Shift Logic · Instant Mute Toggle [M]
                  </span>
                  <a
                    href="#vehicles"
                    className="text-xs font-semibold text-[#E11D48] hover:text-[#FB7185] transition-colors whitespace-nowrap shrink-0"
                  >
                    Configure Vehicle Dyno Setup →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE VEHICLE GARAGE & DYNO TUNING LAB */}
        <GarageSection
          selectedVehicle={selectedVehicle}
          onSelectVehicle={setSelectedVehicle}
          setup={setup}
          onChangeSetup={setSetup}
          onLaunchWithVehicle={handleLaunchWithVehicle}
        />

        {/* INTERACTIVE CIRCUITS, LEADERBOARD, TESTIMONIALS & LEAGUE REGISTRATION */}
        <CircuitsAndLeagueSection
          selectedCircuit={selectedCircuit}
          onSelectCircuit={setSelectedCircuit}
          onLaunchCircuitRace={handleLaunchCircuitRace}
          leaderboard={leaderboard}
          onRegisterPilot={handleRegisterPilot}
        />
      </main>

      {/* QUIET FOOTER */}
      <footer className="border-t border-[#1D212C] bg-[#0A0B0E] py-10">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="font-display text-lg font-bold tracking-wider text-white">
              APEX HORIZON
            </span>
            <span className="text-xs text-[#9CA3AF]">
              © 2026 Apex Horizon Motorsport Engineering. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#9CA3AF]">
            <a href="#simulator" className="hover:text-white transition-colors">
              Simulator
            </a>
            <a href="#vehicles" className="hover:text-white transition-colors">
              Garage
            </a>
            <a href="#circuits" className="hover:text-white transition-colors">
              Circuits
            </a>
            <a href="#register" className="hover:text-white transition-colors">
              League Pass
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
