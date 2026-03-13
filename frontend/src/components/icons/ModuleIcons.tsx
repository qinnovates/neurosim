import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

const defaults = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: "1.5",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Grid of 4 squares -- dashboard overview */
export function IconDashboard({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

/** EEG waveform -- sine wave with varying amplitude */
export function IconSignal({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults} {...props}>
      <path d="M2 12 L5 12 L7 5 L9 19 L11 8 L13 16 L15 10 L17 14 L19 12 L22 12" />
    </svg>
  );
}

/** Bell with small exclamation mark */
export function IconAlert({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults} {...props}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      <line x1="12" y1="3" x2="12" y2="1" />
    </svg>
  );
}

/** Shield with neural branching pattern inside */
export function IconNeurowall({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults} {...props}>
      <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11 5.25-.85 9-5.75 9-11V7l-9-5z" />
      <circle cx="12" cy="10" r="1" />
      <line x1="12" y1="11" x2="12" y2="15" />
      <line x1="12" y1="10" x2="9" y2="8" />
      <line x1="12" y1="10" x2="15" y2="8" />
      <line x1="12" y1="13" x2="9" y2="15" />
      <line x1="12" y1="13" x2="15" y2="15" />
    </svg>
  );
}

/** Crosshair / target -- attack targeting */
export function IconTara({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults} {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
    </svg>
  );
}

/** Bar chart with rising severity */
export function IconNiss({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults} {...props}>
      <line x1="4" y1="20" x2="4" y2="16" />
      <line x1="8" y1="20" x2="8" y2="13" />
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="16" y1="20" x2="16" y2="7" />
      <line x1="20" y1="20" x2="20" y2="4" />
    </svg>
  );
}

/** Stacked horizontal layers -- protocol layers */
export function IconRunemate({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults} {...props}>
      <path d="M12 2L3 7l9 5 9-5-9-5z" />
      <path d="M3 12l9 5 9-5" />
      <path d="M3 17l9 5 9-5" />
    </svg>
  );
}

/** Frequency bars -- vertical equalizer bars */
export function IconSpectrum({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults} {...props}>
      <line x1="3" y1="20" x2="3" y2="14" />
      <line x1="6.5" y1="20" x2="6.5" y2="8" />
      <line x1="10" y1="20" x2="10" y2="4" />
      <line x1="13.5" y1="20" x2="13.5" y2="10" />
      <line x1="17" y1="20" x2="17" y2="6" />
      <line x1="20.5" y1="20" x2="20.5" y2="12" />
    </svg>
  );
}

/** Simplified brain outline -- top-down view with central fissure */
export function IconBrainMap({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults} {...props}>
      <ellipse cx="12" cy="12" rx="9" ry="10" />
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="M5 8c2 1 4 1 7 0" />
      <path d="M12 8c3 1 5 1 7 0" />
      <path d="M5 15c2-1 4-1 7 0" />
      <path d="M12 15c3-1 5-1 7 0" />
    </svg>
  );
}

/** Circle with record dot -- recording / session indicator */
export function IconSession({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults} {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Gear / cog */
export function IconSettings({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

/** Connected nodes -- integrations / API */
export function IconIntegrations({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults} {...props}>
      <circle cx="5" cy="6" r="2.5" />
      <circle cx="19" cy="6" r="2.5" />
      <circle cx="5" cy="18" r="2.5" />
      <circle cx="19" cy="18" r="2.5" />
      <line x1="7.5" y1="6" x2="16.5" y2="6" />
      <line x1="5" y1="8.5" x2="5" y2="15.5" />
      <line x1="19" y1="8.5" x2="19" y2="15.5" />
      <line x1="7.5" y1="18" x2="16.5" y2="18" />
      <line x1="7" y1="7.5" x2="17" y2="16.5" />
    </svg>
  );
}

/** Oscilloscope / neural simulator -- BrainFlow integration hub */
export function IconNeuroSim({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults} {...props}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M6 10 L9 10 L10 6 L12 14 L14 8 L15 10 L18 10" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

/** Terminal / command prompt -- query interface */
export function IconKql({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults} {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="6 9 10 12 6 15" />
      <line x1="13" y1="15" x2="18" y2="15" />
    </svg>
  );
}
