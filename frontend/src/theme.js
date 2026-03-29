import { createTheme, alpha } from '@mui/material/styles'

// Modern color palette
const colors = {
  primary: {
    main: '#6366f1',
    light: '#818cf8',
    dark: '#4f46e5',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#ec4899',
    light: '#f472b6',
    dark: '#db2777',
    contrastText: '#ffffff',
  },
  success: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
  },
  warning: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
  },
  error: {
    main: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
  },
  info: {
    main: '#3b82f6',
    light: '#60a5fa',
    dark: '#2563eb',
  },
  grey: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
    grey: colors.grey,
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: colors.grey[900],
      secondary: colors.grey[600],
    },
    divider: colors.grey[200],
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.1 },
    h2: { fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2 },
    h3: { fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.3 },
    h4: { fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.35 },
    h5: { fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500, lineHeight: 1.5 },
    subtitle2: { fontWeight: 500, lineHeight: 1.5 },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: 600 },
    caption: { fontWeight: 500 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': { width: '8px', height: '8px' },
          '&::-webkit-scrollbar-track': { background: colors.grey[100] },
          '&::-webkit-scrollbar-thumb': { background: colors.grey[300], borderRadius: '4px' },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontSize: '0.9375rem',
          boxShadow: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
        },
        contained: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
        containedPrimary: {
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          '&:hover': { background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)' },
        },
        outlined: { borderWidth: '1.5px', '&:hover': { borderWidth: '1.5px' } },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none', borderRadius: 16 },
        elevation1: { boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' },
        elevation2: { boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -1px rgba(0,0,0,0.04)' },
        elevation3: { boxShadow: '0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -2px rgba(0,0,0,0.03)' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 20px 40px -12px rgba(0,0,0,0.1)' },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: { root: { padding: 24, '&:last-child': { paddingBottom: 24 } } },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'all 0.2s ease',
            '&:hover': { boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.08)' },
            '&.Mui-focused': { boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.12)' },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.grey[200] },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.grey[400] },
        },
      },
    },
    MuiTableContainer: { styleOverrides: { root: { borderRadius: 12, border: '1px solid #e2e8f0' } } },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: colors.grey[100], padding: '16px 20px' },
        head: { fontWeight: 600, backgroundColor: colors.grey[50], color: colors.grey[700], fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
      },
    },
    MuiTableRow: {
      styleOverrides: { root: { transition: 'background-color 0.2s ease', '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.02)' } } },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 },
        colorPrimary: { background: 'rgba(99, 102, 241, 0.1)', color: colors.primary.dark },
        colorSuccess: { background: 'rgba(16, 185, 129, 0.1)', color: colors.success.dark },
        colorWarning: { background: 'rgba(245, 158, 11, 0.1)', color: colors.warning.dark },
        colorError: { background: 'rgba(239, 68, 68, 0.1)', color: colors.error.dark },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12, fontWeight: 500 },
        standardSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.08)', color: colors.success.dark },
        standardError: { backgroundColor: 'rgba(239, 68, 68, 0.08)', color: colors.error.dark },
        standardWarning: { backgroundColor: 'rgba(245, 158, 11, 0.08)', color: colors.warning.dark },
        standardInfo: { backgroundColor: 'rgba(59, 130, 246, 0.08)', color: colors.info.dark },
      },
    },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' } } },
    MuiDialogTitle: { styleOverrides: { root: { fontWeight: 700, fontSize: '1.25rem', padding: '24px 24px 16px' } } },
    MuiDrawer: { styleOverrides: { paper: { border: 'none' } } },
    MuiAppBar: { styleOverrides: { root: { boxShadow: '0 1px 3px rgba(0,0,0,0.05)' } } },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 8px',
          transition: 'all 0.2s ease',
          '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.08)' },
          '&.Mui-selected': { backgroundColor: 'rgba(99, 102, 241, 0.12)', '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.16)' } },
        },
      },
    },
    MuiMenu: { styleOverrides: { paper: { borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0' } } },
    MuiMenuItem: { styleOverrides: { root: { borderRadius: 8, margin: '2px 8px', padding: '10px 16px' } } },
    MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 8, fontWeight: 500, padding: '8px 14px', backgroundColor: colors.grey[800] } } },
    MuiIconButton: { styleOverrides: { root: { transition: 'all 0.2s ease', '&:hover': { transform: 'scale(1.05)' } } } },
    MuiDivider: { styleOverrides: { root: { borderColor: colors.grey[100] } } },
  },
})

export default theme
export { colors }
