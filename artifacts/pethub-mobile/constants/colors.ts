/**
 * Semantic design tokens — derived from the PetHub logo palette.
 * primary:  HSL(161 65% 29%)  → #1a7a5c  (Deep Forest Teal)
 * accent:   HSL(148 57% 50%)  → #34c97a  (Bright Emerald)
 */

const colors = {
  light: {
    // Legacy aliases
    text: '#0d3327',
    tint: '#1a7a5c',

    // Surfaces
    background: '#f5faf8',
    foreground: '#0d3327',
    card: '#ffffff',
    cardForeground: '#0d3327',

    // Primary action (header, buttons, active states)
    primary: '#1a7a5c',
    primaryForeground: '#ffffff',

    // Secondary
    secondary: '#edf7f3',
    secondaryForeground: '#0d3327',

    // Muted / subdued
    muted: '#edf7f3',
    mutedForeground: '#4a7a68',

    // Accent — bright emerald
    accent: '#34c97a',
    accentForeground: '#ffffff',

    // Destructive
    destructive: '#f24059',
    destructiveForeground: '#ffffff',

    // Borders & inputs
    border: '#c3e0d3',
    input: '#c3e0d3',

    // Semantic status colours
    success: '#16a34a',
    successForeground: '#ffffff',
    warning: '#ea580c',
    warningForeground: '#ffffff',
  },

  radius: 8,
};

export default colors;
