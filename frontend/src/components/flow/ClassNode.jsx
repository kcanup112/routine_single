import { Handle, Position } from '@xyflow/react'
import { Box, Typography } from '@mui/material'
import ClassIcon from '@mui/icons-material/Class'

export default function ClassNode({ data }) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1.25,
        borderRadius: 2,
        bgcolor: '#f3e5f5',
        border: '1.5px solid #ce93d8',
        minWidth: 150,
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(156, 39, 176, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#ce93d8' }} />
      <ClassIcon sx={{ fontSize: 18, color: '#7b1fa2', flexShrink: 0 }} />
      <Box sx={{ textAlign: 'left' }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', color: '#6a1b9a', lineHeight: 1.3 }}>
          {data.label}
        </Typography>
        {data.section && (
          <Typography sx={{ fontSize: '0.6875rem', color: '#9c27b0', lineHeight: 1.2 }}>
            {data.section}
          </Typography>
        )}
      </Box>
      <Handle type="source" position={Position.Bottom} style={{ background: '#ce93d8' }} />
    </Box>
  )
}
