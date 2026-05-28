// shared/theme/tokens.js
// ─────────────────────────────────────────────────────────────────────────────
// Canonical design tokens for SyntaxType. Every feature should import from
// here instead of defining its own PALETTE / gradientText / fonts. When the
// design system shifts, this is the one file to change.
// ─────────────────────────────────────────────────────────────────────────────

export const PALETTE = {
  pink: '#C8456D',
  salmon: '#E78AAC',
  gold: '#FFC700',
  navy: '#1A1A2E',
  deepNavy: '#0A0A14',
  cream: '#FFF8F0',
  // semantic neutrals
  paper: '#f5f0e8',
  paperDark: '#ede7d9',
  paperMid: '#ddd5c5',
  ink: '#1a1a2e',
};

// Brighter variants for dark backgrounds where the base palette becomes muddy.
export const PALETTE_DARK_ADJUSTED = {
  green: '#4ade80',
  blue: '#60a5fa',
  amber: '#fbbf24',
  red: '#f87171',
  purple: '#a78bfa',
};

export const PALETTE_LIGHT_SEMANTIC = {
  green: '#2d7a3a',
  blue: '#2563a8',
  amber: '#b45309',
  red: '#b91c1c',
  purple: '#7c3aed',
};

export const FONT_MONO = '"JetBrains Mono", Menlo, Monaco, Consolas, monospace';
export const FONT_PIXEL = '"Press Start 2P", monospace';
export const FONT_BODY = '"DM Sans", system-ui, sans-serif';

// Drop-in `sx={gradientText}` for the signature pink → salmon → gold heading.
export const gradientText = {
  background: `linear-gradient(90deg, ${PALETTE.pink} 0%, ${PALETTE.salmon} 50%, ${PALETTE.gold} 100%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  display: 'inline-block',
};

// Standard hard-drop shadow used for the chunky pixel-card look.
export const PIXEL_SHADOW = '0 4px 0 rgba(0,0,0,0.5)';
export const PIXEL_SHADOW_LG = '0 8px 0 rgba(0,0,0,0.55)';

// Theme-aware semantic color picker. Pass `isDark` from `useTheme()` callers.
export const semanticColor = (isDark, key) =>
  (isDark ? PALETTE_DARK_ADJUSTED : PALETTE_LIGHT_SEMANTIC)[key];
