/**
 * Shared page styles for consistent dashboard theming
 */

export const pageTokens = {
  bg: '#f4f7fb',
  surface: '#ffffff',
  border: '#e8edf2',
  borderHover: '#d0dae4',
  teal: '#2d6a6f',
  tealDark: '#235558',
  tealLight: '#2d6a6f18',
  textPrimary: '#1a2332',
  textSecondary: '#8896a4',
  textMuted: '#a0aec0',
  danger: '#ef4444',
  dangerLight: '#ef444418',
}

/** Outer page box – replaces raw <div> */
export const pageBox = {
  backgroundColor: pageTokens.bg,
}

/** Page-level header row (title + action button) */
export const pageHeaderRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: 3,
  flexWrap: 'wrap',
  gap: 2,
}

/** Primary "Add …" button style */
export const addButtonSx = {
  borderRadius: '10px',
  px: 2.5,
  py: 1,
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.85rem',
  backgroundColor: pageTokens.teal,
  boxShadow: 'none',
  '&:hover': {
    backgroundColor: pageTokens.tealDark,
    boxShadow: 'none',
  },
}

/** Secondary outlined button */
export const secondaryButtonSx = {
  borderRadius: '10px',
  px: 2.5,
  py: 1,
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.85rem',
  borderColor: pageTokens.border,
  color: pageTokens.textSecondary,
  '&:hover': {
    borderColor: pageTokens.teal,
    color: pageTokens.teal,
    backgroundColor: pageTokens.tealLight,
  },
}

/** Paper wrapping the DataGrid */
export const dataGridPaperSx = {
  border: `1px solid ${pageTokens.border}`,
  borderRadius: '16px',
  overflow: 'hidden',
  elevation: 0,
}

/** sx prop passed directly to DataGrid */
export const dataGridSx = {
  border: 'none',
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: '#f8fafc',
    borderBottom: `1px solid ${pageTokens.border}`,
    fontSize: '0.78rem',
    fontWeight: 700,
    color: pageTokens.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  '& .MuiDataGrid-cell': {
    borderColor: '#f0f4f8',
    fontSize: '0.87rem',
    color: pageTokens.textPrimary,
  },
  '& .MuiDataGrid-row:hover': {
    backgroundColor: '#f8fafc',
  },
  '& .MuiDataGrid-footerContainer': {
    borderTop: `1px solid ${pageTokens.border}`,
    backgroundColor: '#fafcfe',
  },
  '& .MuiDataGrid-toolbarContainer': {
    px: 2,
    pt: 1,
  },
}

/** Dialog paper styling */
export const dialogPaperSx = {
  borderRadius: '16px',
  boxShadow: '0 20px 60px -12px rgba(0,0,0,0.15)',
}

/** Edit icon button */
export const editIconBtnSx = {
  color: pageTokens.teal,
  backgroundColor: pageTokens.tealLight,
  borderRadius: '8px',
  p: '5px',
  '&:hover': { backgroundColor: '#2d6a6f30' },
}

/** Delete icon button */
export const deleteIconBtnSx = {
  color: pageTokens.danger,
  backgroundColor: pageTokens.dangerLight,
  borderRadius: '8px',
  p: '5px',
  '&:hover': { backgroundColor: '#ef444430' },
}
