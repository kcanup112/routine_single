import { Handle, Position } from '@xyflow/react'
import { Box, Typography } from '@mui/material'
import SchoolIcon from '@mui/icons-material/School'

export default function SemesterNode({ data }) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: 2,
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
        color: '#fff',
        minWidth: 180,
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(30, 58, 95, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <SchoolIcon sx={{ fontSize: 20 }} />
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.2 }}>
          {data.label}
        </Typography>
        {data.semester?.academic_year && (
          <Typography sx={{ fontSize: '0.7rem', opacity: 0.8 }}>
            {data.semester.academic_year}
          </Typography>
        )}
      </Box>
      <Handle type="source" position={Position.Bottom} style={{ background: '#60a5fa' }} />
    </Box>
  )
}
