import { Handle, Position } from '@xyflow/react'
import { Box, Typography } from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'

export default function SubjectNode({ data }) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: 2,
        bgcolor: '#e3f2fd',
        border: '1.5px solid #90caf9',
        minWidth: 160,
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(33, 150, 243, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#90caf9' }} />
      <MenuBookIcon sx={{ fontSize: 18, color: '#1565c0' }} />
      <Box>
        <Typography sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#1565c0', lineHeight: 1.2 }}>
          {data.label}
        </Typography>
        {data.subject?.code && (
          <Typography sx={{ fontSize: '0.6875rem', color: '#42a5f5' }}>
            {data.subject.code}
          </Typography>
        )}
      </Box>
      <Handle type="source" position={Position.Bottom} style={{ background: '#90caf9' }} />
    </Box>
  )
}
