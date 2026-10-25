import React, { useState } from 'react';
import {
  VEHICLES,
  VehicleSpec,
  VehicleClass,
  VehicleSetup,
  DownforceSetup,
  GearSetup,
  TireCompound,
  calculateTunedSpecs,
} from '../game/rules';
import { VehicleStudioSvg } from './CarArtworkSvg';

interface GarageSectionProps {
  selectedVehicle: VehicleSpec;
  onSelectVehicle: (vehicle: VehicleSpec) => void;
  setup: VehicleSetup;
  onChangeSetup: (nextSetup: VehicleSetup) => void;
  onLaunchWithVehicle: (vehicle: VehicleSpec) => void;
}

const CLASS_FILTERS: Array<'All Classes' | VehicleClass> = [
  'All Classes',
  'GT1 Prototype',
  'Track Spec',
  'Street Tuned',
];

const DOWNFORCE_OPTIONS: DownforceSetup[] = [
  'Low Drag',
  'Balanced',
  'High Aero',
];
const GEAR_OPTIONS: GearSetup[] = [
  'Short Sprint',
  'Standard',
  'Tall Top-End',
];
const TIRE_OPTIONS: TireCompound[] = ['Soft Slick', 'Medium Endurance'];

export const GarageSection: React.FC<GarageSectionProps> = ({
  selectedVehicle,
  onSelectVehicle,
  setup,
  onChangeSetup,
  onLaunchWithVehicle,
}) => {
  const [classFilter, setClassFilter] = useState<'All Classes' | VehicleClass>(
    'All Classes'
  );

  const filteredVehicles =
    classFilter === 'All Classes'
      ? VEHICLES
      : VEHICLES.filter((v) => v.vehicleClass === classFilter);

  const tunedMetrics = calculateTunedSpecs(selectedVehicle, setup);

  return (
    <section
      id="vehicles"
      className="scroll-mt-20 py-20 border-t border-[#1D212C] bg-[#0A0B0E]"
    >
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header & Interactive Class Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="text-xs font-mono-tabular text-[#9CA3AF] mb-2">
              HOMOLOGATED PADDOCK ROSTER · 2026 FIA GT SERIES
            </div>
            <h2
              style={{ textWrap: 'balance' }}
              className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight"
            >
              Select &amp; Tune Your Works Machine
            </h2>
          </div>

          {/* Interactive Segmented Filter Control */}
          <div
            role="group"
            aria-label="Filter vehicles by homologation class"
            className="flex flex-wrap items-center gap-1 p-1 bg-[#12141A] border border-[#222631] rounded-lg self-start"
          >
            {CLASS_FILTERS.map((filterLabel) => {
              const isActive = classFilter === filterLabel;
              return (
                <button
                  key={filterLabel}
                  type="button"
                  onClick={() => setClassFilter(filterLabel)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#E11D48] text-white'
                      : 'text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  {filterLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Vehicle Selection Roster Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {filteredVehicles.map((car) => {
            const isSelected = car.id === selectedVehicle.id;
            return (
              <div
                key={car.id}
                onClick={() => onSelectVehicle(car)}
                className={`group flex flex-col justify-between bg-[#12141A] border rounded-xl overflow-hidden transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-[#E11D48]'
                    : 'border-[#222631] hover:border-[#374151]'
                }`}
              >
                <div>
                  <div className="aspect-[16/9] w-full bg-[#0D1017] border-b border-[#1D212C] overflow-hidden">
                    <VehicleStudioSvg vehicle={car} />
                  </div>

                  <div className="p-5">
                    {/* Clean unboxed metadata kicker with · separators (Zero-Pill Discipline) */}
                    <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF] mb-1.5 font-mono-tabular">
                      <span>{car.vehicleClass}</span>
                      <span aria-hidden="true">·</span>
                      <span>{car.powerHp} HP</span>
                      <span aria-hidden="true">·</span>
                      <span>{car.weightKg} kg</span>
                    </div>

                    <h3 className="font-display text-2xl font-bold text-white tracking-wide mb-2">
                      {car.name}
                    </h3>

                    <p className="text-xs text-[#9CA3AF] leading-relaxed mb-4">
                      {car.description}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-2 border-t border-[#1B1F2A] flex items-center justify-between gap-2">
                  <span className="text-xs font-mono-tabular text-[#D1D5DB]">
                    {car.baseTopSpeedKmh} km/h · {car.baseAccel0to100s}s
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectVehicle(car);
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-[#E11D48] text-white'
                        : 'bg-[#1B1F2A] text-[#D1D5DB] hover:text-white'
                    }`}
                  >
                    {isSelected ? 'Active Chassis' : 'Select Chassis'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Telemetry & Setup Dyno Configurator */}
        <div className="bg-[#12141A] border border-[#222631] rounded-xl p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left 7 Cols: Studio Showcase + Mechanical Dyno Controls */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#9CA3AF] font-mono-tabular mb-1">
                  <span>DYNO TELEMETRY LAB</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedVehicle.chassisCode}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedVehicle.drivetrain}</span>
                </div>
                <h3 className="font-display text-3xl font-bold text-white tracking-wide">
                  {selectedVehicle.name} — Custom Paddock Setup
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Downforce Selector */}
                <div>
                  <label className="block text-xs font-medium text-[#9CA3AF] mb-2">
                    Aero Downforce Trim
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {DOWNFORCE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          onChangeSetup({ ...setup, downforce: opt })
                        }
                        className={`px-3 py-2 text-xs font-medium text-left rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          setup.downforce === opt
                            ? 'bg-[#1D2230] border-[#E11D48] text-white'
                            : 'bg-[#0A0B0E] border-[#222631] text-[#9CA3AF] hover:text-white'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gear Ratio Selector */}
                <div>
                  <label className="block text-xs font-medium text-[#9CA3AF] mb-2">
                    Sequential Gear Ratio
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {GEAR_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          onChangeSetup({ ...setup, gearRatio: opt })
                        }
                        className={`px-3 py-2 text-xs font-medium text-left rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          setup.gearRatio === opt
                            ? 'bg-[#1D2230] border-[#E11D48] text-white'
                            : 'bg-[#0A0B0E] border-[#222631] text-[#9CA3AF] hover:text-white'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tire Compound Selector */}
                <div>
                  <label className="block text-xs font-medium text-[#9CA3AF] mb-2">
                    Slick Tire Compound
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {TIRE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          onChangeSetup({ ...setup, tireCompound: opt })
                        }
                        className={`px-3 py-2 text-xs font-medium text-left rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          setup.tireCompound === opt
                            ? 'bg-[#1D2230] border-[#E11D48] text-white'
                            : 'bg-[#0A0B0E] border-[#222631] text-[#9CA3AF] hover:text-white'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Live Computed Telemetry Readout & Launch Button */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-[#0A0B0E] border border-[#222631] rounded-xl p-6">
              <div>
                <div className="text-xs font-mono-tabular text-[#9CA3AF] mb-4">
                  COMPUTED DYNO OUTPUT · APPLIED TO LIVE SIMULATOR
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#9CA3AF]">
                        Peak Terminal Velocity
                      </span>
                      <span
                        data-testid="tuned-top-speed"
                        className="font-mono-tabular font-semibold text-white"
                      >
                        {tunedMetrics.topSpeedKmh} km/h
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#1B1F2A] rounded overflow-hidden">
                      <div
                        style={{
                          transform: `scaleX(${Math.min(
                            1,
                            tunedMetrics.topSpeedKmh / 375
                          )})`,
                          transformOrigin: 'left',
                        }}
                        className="w-full h-full bg-[#E11D48] transition-transform duration-150"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#9CA3AF]">
                        0–100 km/h Launch Sprint
                      </span>
                      <span
                        data-testid="tuned-accel"
                        className="font-mono-tabular font-semibold text-[#F59E0B]"
                      >
                        {tunedMetrics.accel0to100s.toFixed(2)} s
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#1B1F2A] rounded overflow-hidden">
                      <div
                        style={{
                          transform: `scaleX(${Math.min(
                            1,
                            Math.max(0.2, (3.6 - tunedMetrics.accel0to100s) / 1.8)
                          )})`,
                          transformOrigin: 'left',
                        }}
                        className="w-full h-full bg-[#F59E0B] transition-transform duration-150"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#9CA3AF]">
                        Sustained Cornering Lateral Force
                      </span>
                      <span
                        data-testid="tuned-grip"
                        className="font-mono-tabular font-semibold text-[#38BDF8]"
                      >
                        {tunedMetrics.lateralG.toFixed(2)} G ({tunedMetrics.handlingScore}/100)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#1B1F2A] rounded overflow-hidden">
                      <div
                        style={{
                          transform: `scaleX(${tunedMetrics.handlingScore / 100})`,
                          transformOrigin: 'left',
                        }}
                        className="w-full h-full bg-[#38BDF8] transition-transform duration-150"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onLaunchWithVehicle(selectedVehicle)}
                className="w-full px-5 py-3 text-sm font-semibold text-white bg-[#E11D48] hover:bg-[#BE123C] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Drive {selectedVehicle.name} on Track
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
