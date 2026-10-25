import React from 'react';
import { VehicleSpec, CircuitSpec } from '../game/rules';

interface VehicleStudioSvgProps {
  vehicle: VehicleSpec;
  className?: string;
}

export const VehicleStudioSvg: React.FC<VehicleStudioSvgProps> = ({
  vehicle,
  className = 'w-full h-full',
}) => {
  const isPrototype = vehicle.vehicleClass === 'GT1 Prototype';
  const isTrack = vehicle.vehicleClass === 'Track Spec';

  return (
    <svg
      viewBox="0 0 640 360"
      className={className}
      role="img"
      aria-label={`${vehicle.name} studio automotive profile`}
    >
      <defs>
        <linearGradient id={`bg-${vehicle.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0D1017" />
          <stop offset="55%" stopColor="#141822" />
          <stop offset="100%" stopColor="#090A0E" />
        </linearGradient>
        <linearGradient id={`body-${vehicle.id}`} x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0%" stopColor={vehicle.primaryColor} />
          <stop offset="65%" stopColor={vehicle.primaryColor} stopOpacity="0.88" />
          <stop offset="100%" stopColor="#1E2330" />
        </linearGradient>
        <linearGradient id={`glass-${vehicle.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#0A0B0E" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {/* Studio Backdrop */}
      <rect width="640" height="360" fill={`url(#bg-${vehicle.id})`} />

      {/* Subtle architectural paddock light strips */}
      <line x1="60" y1="44" x2="580" y2="44" stroke="#262B38" strokeWidth="2" />
      <line
        x1="140"
        y1="44"
        x2="500"
        y2="44"
        stroke={vehicle.primaryColor}
        strokeWidth="2"
        strokeOpacity="0.65"
      />

      {/* Aerodynamic wind-tunnel slipstream flow lines */}
      <path
        d="M 45 215 Q 190 190, 290 155 T 585 162"
        fill="none"
        stroke={vehicle.accentColor}
        strokeWidth="1.5"
        strokeDasharray="8 6"
        strokeOpacity="0.4"
      />
      <path
        d="M 65 245 Q 210 218, 340 185 T 595 190"
        fill="none"
        stroke={vehicle.primaryColor}
        strokeWidth="1.2"
        strokeOpacity="0.35"
      />

      {/* Paddock floor shadow */}
      <ellipse cx="325" cy="286" rx="235" ry="18" fill="#040507" opacity="0.85" />
      <line x1="30" y1="286" x2="610" y2="286" stroke="#222631" strokeWidth="1.5" />

      {/* Rear Swan-Neck GT Wing */}
      {isPrototype ? (
        <g>
          <path
            d="M 505 186 L 548 134 L 564 134 L 532 192 Z"
            fill="#181C26"
            stroke="#374151"
            strokeWidth="1.5"
          />
          <path
            d="M 488 132 L 576 126 L 580 138 L 492 141 Z"
            fill={vehicle.accentColor}
          />
          {/* LMP Shark Fin */}
          <path
            d="M 380 144 L 515 144 L 502 188 L 395 182 Z"
            fill="#141720"
            stroke={vehicle.primaryColor}
            strokeWidth="1.2"
          />
        </g>
      ) : isTrack ? (
        <g>
          <path
            d="M 512 195 L 542 146 L 555 146 L 530 196 Z"
            fill="#1F2430"
          />
          <path
            d="M 500 144 L 568 140 L 570 149 L 502 151 Z"
            fill={vehicle.primaryColor}
          />
        </g>
      ) : (
        <path
          d="M 516 188 L 560 174 L 565 184 L 520 196 Z"
          fill={vehicle.accentColor}
        />
      )}

      {/* Main Chassis Silhouette */}
      <path
        d={
          isPrototype
            ? 'M 76 262 L 96 222 L 188 196 L 268 146 L 392 144 L 486 182 L 564 188 L 574 256 L 536 268 L 102 268 Z'
            : 'M 82 262 L 100 214 L 204 192 L 278 148 L 408 150 L 495 188 L 558 196 L 564 258 L 526 268 L 106 268 Z'
        }
        fill={`url(#body-${vehicle.id})`}
        stroke="#F3F4F6"
        strokeOpacity="0.24"
        strokeWidth="1.5"
      />

      {/* Canopy / Cockpit Glazing */}
      <path
        d="M 212 193 L 278 154 L 388 154 L 448 188 L 212 193 Z"
        fill={`url(#glass-${vehicle.id})`}
        stroke="#9CA3AF"
        strokeOpacity="0.4"
        strokeWidth="1.2"
      />

      {/* Side Intake & Carbon Splitter Skirt */}
      <polygon
        points="250,212 415,204 402,248 232,248"
        fill="#0B0D13"
        stroke={vehicle.accentColor}
        strokeWidth="1.2"
      />
      <rect x="70" y="258" width="498" height="10" rx="3" fill="#11141C" />
      <rect x="66" y="263" width="68" height="6" rx="2" fill={vehicle.accentColor} />

      {/* Laser Headlight & Taillight Blades */}
      <polygon points="94,224 142,214 136,226 90,232" fill="#F8FAFC" />
      <polygon points="548,198 570,198 572,216 550,214" fill="#EF4444" />

      {/* Front Wheel Assembly */}
      <g transform="translate(178, 256)">
        <circle r="42" fill="#0B0D12" stroke="#2E3444" strokeWidth="6" />
        <circle r="29" fill="#161922" stroke="#6B7280" strokeWidth="2" />
        {/* Brake Rotor & Glowing Caliper */}
        <circle r="20" fill="none" stroke="#4B5563" strokeWidth="4" strokeDasharray="6 4" />
        <path d="M -18 -12 A 22 22 0 0 1 -4 -22 L -2 -14 L -12 -6 Z" fill={vehicle.accentColor} />
        <circle r="8" fill={vehicle.primaryColor} />
      </g>

      {/* Rear Wheel Assembly */}
      <g transform="translate(466, 256)">
        <circle r="44" fill="#0B0D12" stroke="#2E3444" strokeWidth="6" />
        <circle r="31" fill="#161922" stroke="#6B7280" strokeWidth="2" />
        <circle r="21" fill="none" stroke="#4B5563" strokeWidth="4" strokeDasharray="6 4" />
        <path d="M 18 -12 A 22 22 0 0 0 4 -22 L 2 -14 L 12 -6 Z" fill={vehicle.accentColor} />
        <circle r="8" fill={vehicle.primaryColor} />
      </g>

      {/* Chassis Spec Overlay Watermark-Free Corner Kicker */}
      <text
        x="28"
        y="334"
        fill="#9CA3AF"
        fontSize="12"
        fontFamily="JetBrains Mono, monospace"
      >
        {vehicle.chassisCode} · {vehicle.engineLayout} · {vehicle.powerHp} HP
      </text>
    </svg>
  );
};

interface CircuitTelemetrySvgProps {
  circuit: CircuitSpec;
  className?: string;
}

export const CircuitTelemetrySvg: React.FC<CircuitTelemetrySvgProps> = ({
  circuit,
  className = 'w-full h-full',
}) => {
  const pathData =
    circuit.id === 'alpine-pass'
      ? 'M 110 250 C 75 180, 120 95, 210 90 C 285 86, 290 155, 355 140 C 420 125, 455 68, 525 98 C 585 124, 570 218, 495 245 C 415 274, 360 215, 285 242 C 215 266, 145 295, 110 250 Z'
      : circuit.id === 'neo-tokyo'
      ? 'M 95 220 L 215 95 C 260 65, 365 65, 425 95 L 545 165 C 580 195, 560 265, 495 270 L 245 270 C 165 270, 110 255, 95 220 Z'
      : 'M 105 240 C 85 145, 165 75, 265 88 C 345 98, 385 65, 475 85 C 565 105, 575 205, 510 252 C 445 298, 355 240, 275 262 C 195 284, 125 295, 105 240 Z';

  const accent =
    circuit.skyTheme === 'alpine'
      ? '#E11D48'
      : circuit.skyTheme === 'night'
      ? '#38BDF8'
      : '#F59E0B';

  return (
    <svg
      viewBox="0 0 640 340"
      className={className}
      role="img"
      aria-label={`${circuit.name} telemetry track layout`}
    >
      <rect width="640" height="340" fill="#0D0F14" />

      {/* Topographic Telemetry Grid */}
      <g stroke="#1B1F2A" strokeWidth="1">
        <line x1="0" y1="68" x2="640" y2="68" />
        <line x1="0" y1="136" x2="640" y2="136" />
        <line x1="0" y1="204" x2="640" y2="204" />
        <line x1="0" y1="272" x2="640" y2="272" />
        <line x1="128" y1="0" x2="128" y2="340" />
        <line x1="256" y1="0" x2="256" y2="340" />
        <line x1="384" y1="0" x2="384" y2="340" />
        <line x1="512" y1="0" x2="512" y2="340" />
      </g>

      {/* Track Outer Apron */}
      <path
        d={pathData}
        fill="none"
        stroke="#222736"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Racing Line Ribbon */}
      <path
        d={pathData}
        fill="none"
        stroke={accent}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Sector Timing Splits */}
      <g fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#E5E7EB">
        <circle cx="110" cy="246" r="7" fill="#F3F4F6" stroke="#0A0B0E" strokeWidth="2" />
        <text x="124" y="250">
          START / FINISH
        </text>

        <circle cx="245" cy="92" r="5" fill={accent} />
        <text x="256" y="88" fill="#9CA3AF">
          S1 · DRS ZONE
        </text>

        <circle cx="515" cy="126" r="5" fill="#F59E0B" />
        <text x="430" y="122" fill="#9CA3AF">
          S2 · APEX TRAP
        </text>
      </g>

      {/* Bottom Metadata Readout */}
      <text
        x="24"
        y="316"
        fill="#9CA3AF"
        fontSize="12"
        fontFamily="JetBrains Mono, monospace"
      >
        {circuit.location.toUpperCase()} · {circuit.lengthKm.toFixed(1)} KM · {circuit.corners}{' '}
        CORNERS · ELEVATION Δ {circuit.elevationDeltaM}M
      </text>
    </svg>
  );
};
