const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function ClockIcon({ size = 26 }) {
  return (
    <svg {...base} width={size} height={size}>
      <rect x="2" y="7.5" width="20" height="13" rx="3" />
      <circle cx="8" cy="14" r="3.6" />
      <circle cx="16" cy="14" r="3.6" />
      <path d="M8 14v-2.2M16 14l1.6-1.1M6 7.5V5.2h4v2.3M14.5 7.5V6h3v1.5" />
    </svg>
  );
}

export function SudokuIcon({ size = 26 }) {
  return (
    <svg {...base} width={size} height={size}>
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
      <rect x="9" y="9" width="6" height="6" fill="currentColor" stroke="none" opacity="0.55" />
      <rect x="15" y="3" width="6" height="6" rx="2" fill="currentColor" stroke="none" opacity="0.3" />
    </svg>
  );
}

export function CryptoIcon({ size = 26 }) {
  return (
    <svg {...base} width={size} height={size}>
      <circle cx="7.5" cy="12" r="4.2" />
      <circle cx="7.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <path d="M11.7 12H21.5M18.5 12v3.2M21.5 12v2.2" />
    </svg>
  );
}

export function WordIcon({ size = 26 }) {
  return (
    <svg {...base} width={size} height={size}>
      <rect x="2.5" y="4" width="5.5" height="5.5" rx="1.2" fill="currentColor" stroke="none" />
      <rect x="9.25" y="4" width="5.5" height="5.5" rx="1.2" />
      <rect x="16" y="4" width="5.5" height="5.5" rx="1.2" fill="currentColor" stroke="none" opacity="0.5" />
      <rect x="2.5" y="14.5" width="5.5" height="5.5" rx="1.2" fill="currentColor" stroke="none" />
      <rect x="9.25" y="14.5" width="5.5" height="5.5" rx="1.2" fill="currentColor" stroke="none" />
      <rect x="16" y="14.5" width="5.5" height="5.5" rx="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function NonogramIcon({ size = 26 }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M2.5 9.5h3M2.5 14h2M2.5 18.5h3M9.5 2.5v3M14 2.5v2M18.5 2.5v3" />
      <rect x="7.5" y="7.5" width="14" height="14" rx="1.5" />
      <rect x="7.5" y="7.5" width="4.7" height="4.7" fill="currentColor" stroke="none" />
      <rect x="12.2" y="12.2" width="4.7" height="4.7" fill="currentColor" stroke="none" />
      <rect x="16.8" y="7.5" width="4.7" height="4.7" fill="currentColor" stroke="none" />
      <rect x="7.5" y="16.8" width="9.4" height="4.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function GearIcon({ size = 22 }) {
  return (
    <svg {...base} width={size} height={size}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
      <circle cx="12" cy="12" r="6.6" />
    </svg>
  );
}

export const GAME_ICONS = {
  sudoku: SudokuIcon,
  crypto: CryptoIcon,
  word: WordIcon,
  nono: NonogramIcon,
};
