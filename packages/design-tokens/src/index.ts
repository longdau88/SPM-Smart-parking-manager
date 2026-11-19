export const SPM_COLORS = {
  // Brand & Action
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#3A86FF',
    600: '#2563EB',
    700: '#1D4ED8',
  },
  accent: {
    cyan: '#00F5D4',
    cyanDark: '#00BB9C',
  },
  // Dark Control Center Palette
  navy: {
    base: '#0B132B',     // Background
    surface: '#1C2541',  // Panels & Cards
    elevated: '#243356', // Popovers & Modals
    border: '#334155',   // Subtle Borders
  },
  // Neutral Surfaces
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    500: '#64748B',
    800: '#1E293B',
    900: '#0F172A',
  },
  // Semantic Feedback
  status: {
    success: '#10B981', // Barrier Open / Valid Plate
    warning: '#F59E0B', // Review Needed / Low Confidence
    danger: '#EF4444',  // Barrier Error / Blacklist
    info: '#0EA5E9',
  },
} as const;

export const SPM_SPACING = {
  0: '0px',
  1: '4px',   // Micro gap
  2: '8px',   // Standard element inner padding
  3: '12px',  // Intermediate gap
  4: '16px',  // Card padding
  6: '24px',  // Section gap
  8: '32px',  // Major block spacing
  12: '48px', // Page layout division
  16: '64px',
} as const;

export const SPM_TYPOGRAPHY = {
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Roboto Mono", monospace',
  },
  fontSize: {
    display: '32px',
    h1: '24px',
    h2: '20px',
    h3: '16px',
    body: '14px',
    caption: '12px',
    plate: '22px', // Minimum height for legible plate reading
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;
