// Shared design tokens — Notion-inspired: warm off-white surfaces, warm
// near-black text, hairline borders instead of shadows, one accent color
// used sparingly. Import from here instead of hardcoding hex values so the
// whole app moves together.
export const theme = {
  bg:           '#FFFFFF',
  bgSubtle:     '#F7F6F3',
  bgHover:      'rgba(55,53,47,0.06)',
  bgActive:     'rgba(55,53,47,0.08)',
  border:       'rgba(55,53,47,0.10)',
  borderStrong: 'rgba(55,53,47,0.18)',
  text:         '#2F2E2B',
  textMuted:    '#787774',
  textFaint:    '#9B9A97',
  accent:       '#E8472A',
  accentBg:     'rgba(232,71,42,0.09)',
  accentBorder: 'rgba(232,71,42,0.25)',
  success:      '#2F9E44',
  successBg:    'rgba(47,158,68,0.10)',
  warning:      '#D9730D',
  warningBg:    'rgba(217,115,13,0.10)',
  danger:       '#E03E3E',
  dangerBg:     'rgba(224,62,62,0.10)',
  radius:       8,
  radiusSm:     6,
  font: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
}
