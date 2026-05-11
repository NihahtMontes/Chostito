export const COLORS = {
  // Primarios — violeta índigo profundo
  primary: '#5B21B6',
  primaryLight: '#8B5CF6',
  primaryDark: '#4C1D95',

  // Secundario — cian vibrante
  secondary: '#0891B2',
  secondaryLight: '#22D3EE',

  // Acento
  accent: '#F59E0B',

  // Fondos
  background: '#F5F3FF',
  surface: '#FFFFFF',
  surfaceAlt: '#F8F7FF',
  surfaceCard: '#FDFCFF',

  // Texto
  text: '#1E1B4B',
  textSecondary: '#64748B',
  textAccent: '#5B21B6',
  textLight: '#9CA3AF',

  // Feedback
  success: '#059669',
  successLight: '#D1FAE5',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  info: '#2563EB',
  infoLight: '#DBEAFE',

  // Especiales
  dark: '#1E1B4B',
  glass: 'rgba(255,255,255,0.85)',
  glassDark: 'rgba(30,27,75,0.5)',
  gradientStart: '#5B21B6',
  gradientEnd: '#0891B2',
  border: '#EDE9FE',
};

export const SHADOWS = {
  none: {},
  small: {
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  light: {
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  medium: {
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 14,
    elevation: 7,
  },
  large: {
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  glow: {
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
};

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  xxl: 32,
  full: 999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
};
