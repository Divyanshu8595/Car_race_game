import React, { useState } from 'react';
import {
  CIRCUITS,
  VEHICLES,
  CircuitSpec,
  LeaderboardEntry,
  RegistrationFormInput,
  validateRegistrationForm,
} from '../game/rules';
import { CircuitTelemetrySvg } from './CarArtworkSvg';

interface CircuitsAndLeagueSectionProps {
  selectedCircuit: CircuitSpec;
  onSelectCircuit: (circuit: CircuitSpec) => void;
  onLaunchCircuitRace: (circuit: CircuitSpec) => void;
  leaderboard: LeaderboardEntry[];
  onRegisterPilot: (entry: LeaderboardEntry) => void;
}

export const CircuitsAndLeagueSection: React.FC<
  CircuitsAndLeagueSectionProps
> = ({
  selectedCircuit,
  onSelectCircuit,
  onLaunchCircuitRace,
  leaderboard,
  onRegisterPilot,
}) => {
  const [standingsFilter, setStandingsFilter] = useState<string>('all');

  const [formInput, setFormInput] = useState<RegistrationFormInput>({
    pilotName: '',
    email: '',
    callsign: '',
    vehicleId: VEHICLES[0].id,
    circuitId: CIRCUITS[0].id,
  });

  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof RegistrationFormInput, string>>
  >({});
  const [submittedPilot, setSubmittedPilot] = useState<string | null>(null);

  const visibleLeaderboard =
    standingsFilter === 'all'
      ? leaderboard
      : leaderboard.filter((row) => row.circuitId === standingsFilter);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateRegistrationForm(formInput);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      setSubmittedPilot(null);
      return;
    }

    setFormErrors({});
    const chosenVehicle =
      VEHICLES.find((v) => v.id === formInput.vehicleId) ?? VEHICLES[0];
    const chosenCircuit =
      CIRCUITS.find((c) => c.id === formInput.circuitId) ?? CIRCUITS[0];

    const newEntry: LeaderboardEntry = {
      id: `lb-user-${Date.now()}`,
      rank: leaderboard.length + 1,
      pilotName: formInput.pilotName.trim(),
      callsign: formInput.callsign.trim().toUpperCase(),
      circuitId: chosenCircuit.id,
      vehicleName: chosenVehicle.name,
      vehicleClass: chosenVehicle.vehicleClass,
      lapTime: chosenCircuit.recordTime,
      topSpeedKmh: chosenVehicle.baseTopSpeedKmh,
      verified: true,
    };

    onRegisterPilot(newEntry);
    setSubmittedPilot(
      `${newEntry.pilotName} (${newEntry.callsign}) registered for ${chosenCircuit.name}`
    );
    setFormInput({
      pilotName: '',
      email: '',
      callsign: '',
      vehicleId: chosenVehicle.id,
      circuitId: chosenCircuit.id,
    });
  };

  return (
    <>
      {/* CIRCUITS & CHAMPIONSHIP STANDINGS SECTION */}
      <section
        id="circuits"
        className="scroll-mt-20 py-20 border-t border-[#1D212C] bg-[#0A0B0E]"
      >
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="text-xs font-mono-tabular text-[#9CA3AF] mb-2">
                LASER-SCANNED GRAND PRIX CIRCUITS · SECTOR TELEMETRY
              </div>
              <h2
                style={{ textWrap: 'balance' }}
                className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight"
              >
                International Championship Calendar
              </h2>
            </div>

            {/* Circuit Selector Buttons */}
            <div
              role="group"
              aria-label="Select racing circuit"
              className="flex flex-wrap items-center gap-1 p-1 bg-[#12141A] border border-[#222631] rounded-lg self-start"
            >
              {CIRCUITS.map((c) => {
                const active = c.id === selectedCircuit.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelectCircuit(c)}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#E11D48] text-white'
                        : 'text-[#9CA3AF] hover:text-white'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Circuit Spotlight Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-16">
            <div className="lg:col-span-7 bg-[#12141A] border border-[#222631] rounded-xl overflow-hidden flex flex-col justify-between">
              <CircuitTelemetrySvg
                circuit={selectedCircuit}
                className="w-full h-full min-h-[280px]"
              />
            </div>

            <div className="lg:col-span-5 bg-[#12141A] border border-[#222631] rounded-xl p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#9CA3AF] font-mono-tabular mb-2">
                  <span>{selectedCircuit.location}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedCircuit.difficulty} Grade</span>
                </div>

                <h3 className="font-display text-3xl font-bold text-white tracking-wide mb-3">
                  {selectedCircuit.name}
                </h3>

                <p className="text-sm text-[#D1D5DB] leading-relaxed mb-6">
                  {selectedCircuit.description}
                </p>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#222631] mb-6">
                  <div>
                    <div className="text-xs text-[#9CA3AF]">Track Length</div>
                    <div className="font-mono-tabular text-lg font-semibold text-white">
                      {selectedCircuit.lengthKm.toFixed(1)} km ·{' '}
                      {selectedCircuit.corners} Turns
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#9CA3AF]">
                      Official Lap Record
                    </div>
                    <div className="font-mono-tabular text-lg font-semibold text-[#F59E0B]">
                      {selectedCircuit.recordTime} ({selectedCircuit.recordHolder})
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#9CA3AF]">Surface Spec</div>
                    <div className="font-mono-tabular text-sm font-medium text-[#D1D5DB]">
                      {selectedCircuit.surface}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#9CA3AF]">
                      Elevation Change
                    </div>
                    <div className="font-mono-tabular text-sm font-medium text-[#D1D5DB]">
                      {selectedCircuit.elevationDeltaM} m Vertical Delta
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onLaunchCircuitRace(selectedCircuit)}
                className="w-full px-5 py-3 text-sm font-semibold text-white bg-[#E11D48] hover:bg-[#BE123C] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Launch Qualifying Session at {selectedCircuit.name}
              </button>
            </div>
          </div>

          {/* Verified Championship Telemetry Standings Table */}
          <div className="bg-[#12141A] border border-[#222631] rounded-xl p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-display text-2xl font-bold text-white tracking-wide">
                  Verified Time-Trial Championship Standings
                </h3>
                <p className="text-xs text-[#9CA3AF]">
                  Live telemetry records from global qualifying heats and player
                  podium finishes ({visibleLeaderboard.length} entries shown).
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 bg-[#0A0B0E] border border-[#222631] rounded-lg self-start">
                <button
                  type="button"
                  onClick={() => setStandingsFilter('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap shrink-0 ${
                    standingsFilter === 'all'
                      ? 'bg-[#1D2230] text-white'
                      : 'text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  All Circuits
                </button>
                {CIRCUITS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setStandingsFilter(c.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap shrink-0 ${
                      standingsFilter === c.id
                        ? 'bg-[#1D2230] text-white'
                        : 'text-[#9CA3AF] hover:text-white'
                    }`}
                  >
                    {c.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#222631] text-xs font-mono-tabular text-[#9CA3AF]">
                    <th className="py-3 pr-4">RANK</th>
                    <th className="py-3 px-4">PILOT · CALLSIGN</th>
                    <th className="py-3 px-4">HOMOLOGATED CHASSIS</th>
                    <th className="py-3 px-4">CIRCUIT</th>
                    <th className="py-3 px-4 text-right">BEST LAP</th>
                    <th className="py-3 pl-4 text-right">TRAP SPEED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B1F2A] text-sm">
                  {visibleLeaderboard.map((entry, idx) => {
                    const circuitObj = CIRCUITS.find(
                      (c) => c.id === entry.circuitId
                    );
                    return (
                      <tr
                        key={entry.id}
                        className="hover:bg-[#171A24] transition-colors"
                      >
                        <td className="py-3.5 pr-4 font-mono-tabular font-semibold text-[#F59E0B]">
                          #{idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-white">
                          {entry.pilotName}{' '}
                          <span className="text-xs font-mono-tabular text-[#9CA3AF]">
                            · {entry.callsign}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#D1D5DB]">
                          {entry.vehicleName}{' '}
                          <span className="text-xs text-[#9CA3AF]">
                            · {entry.vehicleClass}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#9CA3AF]">
                          {circuitObj ? circuitObj.name : entry.circuitId}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-white">
                          {entry.lapTime}
                        </td>
                        <td className="py-3.5 pl-4 text-right font-mono-tabular text-[#38BDF8]">
                          {entry.topSpeedKmh} km/h
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* LEAGUE PASS REGISTRATION & PROOF OF IMPACT SECTION */}
      <section
        id="register"
        className="scroll-mt-20 py-20 border-t border-[#1D212C] bg-[#0D0F14]"
      >
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left 6 Cols: Quantitative Proof & Attributable Motorsport Testimonials */}
            <div className="lg:col-span-6 space-y-8">
              <div>
                <div className="text-xs font-mono-tabular text-[#9CA3AF] mb-2">
                  CHAMPIONSHIP TELEMETRY &amp; DRIVER ENDORSEMENTS
                </div>
                <h2
                  style={{ textWrap: 'balance' }}
                  className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight mb-4"
                >
                  Engineered With Real GT3 &amp; Endurance Drivers
                </h2>
                <p className="text-sm text-[#D1D5DB] leading-relaxed">
                  Every slipstream pocket, curb vibration impulse, and KERS
                  deployment curve is calibrated against 1,000 Hz laser-scanned
                  paddock telemetry across 142,000+ competitive qualifying laps
                  recorded in Q3 2026.
                </p>
              </div>

              {/* Concrete Quantified Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#12141A] border border-[#222631] rounded-xl p-5">
                  <div className="font-display text-3xl font-bold text-white font-mono-tabular mb-1">
                    -1.42s Avg Lap Delta
                  </div>
                  <div className="text-xs text-[#9CA3AF]">
                    Measured driver braking-point consistency gain over 6 weeks
                    of simulator training.
                  </div>
                </div>
                <div className="bg-[#12141A] border border-[#222631] rounded-xl p-5">
                  <div className="font-display text-3xl font-bold text-[#F59E0B] font-mono-tabular mb-1">
                    142,800+ Ranked Heats
                  </div>
                  <div className="text-xs text-[#9CA3AF]">
                    Completed across 3 international divisions with zero
                    physics desynchronization.
                  </div>
                </div>
              </div>

              {/* Attributable Testimonials (Full Name, Role, Organization, Concrete Outcome) */}
              <div className="space-y-4">
                <blockquote className="bg-[#12141A] border border-[#222631] rounded-xl p-5">
                  <p className="text-sm text-[#E5E7EB] leading-relaxed mb-3">
                    &ldquo;Before switching our junior drivers to Apex Horizon,
                    wet-curb trail-braking errors cost us 0.8 seconds in Sector
                    2. After 40 hours on the Alpine Hairpin Pass physics build,
                    our 2026 endurance squad shaved 1.3 seconds off their
                    qualifying pace.&rdquo;
                  </p>
                  <footer className="text-xs text-[#9CA3AF] font-mono-tabular">
                    Marcus Lindqvist · Chief Race Engineer · Nordik Works GT
                    Motorsport
                  </footer>
                </blockquote>

                <blockquote className="bg-[#12141A] border border-[#222631] rounded-xl p-5">
                  <p className="text-sm text-[#E5E7EB] leading-relaxed mb-3">
                    &ldquo;The aerodynamic wake and KERS battery harvest model
                    mirrors our actual Wangan telemetry logger within 1.5%
                    tolerance, allowing us to validate gear ratios before
                    unloading the car from the transporter.&rdquo;
                  </p>
                  <footer className="text-xs text-[#9CA3AF] font-mono-tabular">
                    Kenji Takahashi · Lead Factory Driver · Shibaura Prototype
                    Racing
                  </footer>
                </blockquote>
              </div>
            </div>

            {/* Right 6 Cols: Validated League Pass & Paddock Entry Form */}
            <div className="lg:col-span-6 bg-[#12141A] border border-[#222631] rounded-xl p-6 md:p-8">
              <div className="text-xs font-mono-tabular text-[#9CA3AF] mb-1">
                2026 SEASON QUALIFYING ENTRY
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold text-white tracking-wide mb-2">
                Register Official Driver Callsign
              </h3>
              <p className="text-xs text-[#9CA3AF] mb-6">
                Reserve your paddock license to post verified times to the
                championship standings and receive seasonal telemetry patches.
              </p>

              {submittedPilot && (
                <div
                  role="status"
                  className="mb-5 p-4 rounded-lg bg-[#0A0B0E] border border-[#10B981] text-xs text-[#10B981] font-mono-tabular"
                >
                  LICENSE CONFIRMED: {submittedPilot}. Added to live
                  championship standings above.
                </div>
              )}

              <form onSubmit={handleFormSubmit} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="pilot-name-input"
                    className="block text-xs font-medium text-[#D1D5DB] mb-1.5"
                  >
                    Pilot Full Name
                  </label>
                  <input
                    id="pilot-name-input"
                    type="text"
                    placeholder="e.g. Ayrton Vance"
                    value={formInput.pilotName}
                    onChange={(e) =>
                      setFormInput({ ...formInput, pilotName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-sm text-white bg-[#0A0B0E] border border-[#2A3040] rounded-lg focus:outline-none focus:border-[#E11D48]"
                  />
                  {formErrors.pilotName && (
                    <p className="mt-1 text-xs text-[#EF4444]">
                      {formErrors.pilotName}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="pilot-email-input"
                      className="block text-xs font-medium text-[#D1D5DB] mb-1.5"
                    >
                      Telemetry Dispatch Email
                    </label>
                    <input
                      id="pilot-email-input"
                      type="email"
                      placeholder="pilot@team-apex.io"
                      value={formInput.email}
                      onChange={(e) =>
                        setFormInput({ ...formInput, email: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-sm text-white bg-[#0A0B0E] border border-[#2A3040] rounded-lg focus:outline-none focus:border-[#E11D48]"
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-xs text-[#EF4444]">
                        {formErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="pilot-callsign-input"
                      className="block text-xs font-medium text-[#D1D5DB] mb-1.5"
                    >
                      Paddock Callsign (3–7 chars)
                    </label>
                    <input
                      id="pilot-callsign-input"
                      type="text"
                      placeholder="e.g. VNC-01"
                      value={formInput.callsign}
                      onChange={(e) =>
                        setFormInput({ ...formInput, callsign: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-sm font-mono-tabular uppercase text-white bg-[#0A0B0E] border border-[#2A3040] rounded-lg focus:outline-none focus:border-[#E11D48]"
                    />
                    {formErrors.callsign && (
                      <p className="mt-1 text-xs text-[#EF4444]">
                        {formErrors.callsign}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="pilot-vehicle-select"
                      className="block text-xs font-medium text-[#D1D5DB] mb-1.5"
                    >
                      Homologated Vehicle Entry
                    </label>
                    <select
                      id="pilot-vehicle-select"
                      value={formInput.vehicleId}
                      onChange={(e) =>
                        setFormInput({ ...formInput, vehicleId: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-sm text-white bg-[#0A0B0E] border border-[#2A3040] rounded-lg focus:outline-none focus:border-[#E11D48]"
                    >
                      {VEHICLES.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="pilot-circuit-select"
                      className="block text-xs font-medium text-[#D1D5DB] mb-1.5"
                    >
                      Primary Qualifying Circuit
                    </label>
                    <select
                      id="pilot-circuit-select"
                      value={formInput.circuitId}
                      onChange={(e) =>
                        setFormInput({ ...formInput, circuitId: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-sm text-white bg-[#0A0B0E] border border-[#2A3040] rounded-lg focus:outline-none focus:border-[#E11D48]"
                    >
                      {CIRCUITS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full px-5 py-3 text-sm font-semibold text-white bg-[#E11D48] hover:bg-[#BE123C] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Issue FIA Paddock License &amp; Post Entry
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
