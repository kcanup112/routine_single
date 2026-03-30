import { Handle, Position } from '@xyflow/react'
import { Box, Typography, Chip } from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import ScienceIcon from '@mui/icons-material/Science'

export default function SubjectNode({ data }) {
  const isLab = data.subject?.is_lab
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
      {isLab ? <ScienceIcon sx={{ fontSize: 18, color: '#e65100' }} /> : <MenuBookIcon sx={{ fontSize: 18, color: '#1565c0' }} />}
      <Box>
        <Typography sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#1565c0', lineHeight: 1.2 }}>
          {data.label}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center', mt: 0.25 }}>
          {data.subject?.code && (
            <Typography sx={{ fontSize: '0.6875rem', color: '#42a5f5' }}>
              {data.subject.code}
            </Typography>
          )}
          {isLab && (
            <Chip label="Lab" size="small" sx={{ height: 14, fontSize: '0.55rem', bgcolor: '#fff3e0', color: '#e65100', '& .MuiChip-label': { px: 0.5 } }} />
          )}
        </Box>
      </Box>
      {/* 3 source handles spread across the bottom */}
      <Handle type="source" id="src-a" position={Position.Bottom} style={{ background: '#90caf9', left: '20%' }} />
      <Handle type="source" id="src-b" position={Position.Bottom} style={{ background: '#90caf9', left: '50%' }} />
      <Handle type="source" id="src-c" position={Position.Bottom} style={{ background: '#90caf9', left: '80%' }} />
    </Box>
  )
}
