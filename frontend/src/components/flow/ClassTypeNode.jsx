import { Handle, Position } from '@xyflow/react'
import { Box, Typography } from '@mui/material'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import ScienceIcon from '@mui/icons-material/Science'

export default function ClassTypeNode({ data }) {
  const isPractical = data.classType === 'practical'

  return (
    <Box
      sx={{
        px: 1.5,
        py: 1,
        borderRadius: 1.5,
        bgcolor: isPractical ? '#fff3e0' : '#f5f5f5',
        border: `1.5px solid ${isPractical ? '#ffb74d' : '#bdbdbd'}`,
        minWidth: 120,
        textAlign: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: isPractical ? '#ffb74d' : '#bdbdbd' }} />
      {isPractical ? (
        <ScienceIcon sx={{ fontSize: 16, color: '#e65100' }} />
      ) : (
        <AutoStoriesIcon sx={{ fontSize: 16, color: '#616161' }} />
      )}
      <Typography sx={{ fontWeight: 600, fontSize: '0.75rem', color: isPractical ? '#e65100' : '#424242' }}>
        {data.label}
      </Typography>
      <Handle type="source" position={Position.Bottom} style={{ background: isPractical ? '#ffb74d' : '#bdbdbd' }} />
    </Box>
  )
}
