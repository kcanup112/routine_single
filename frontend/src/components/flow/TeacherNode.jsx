import { useState } from 'react'
import { Handle, Position, useReactFlow } from '@xyflow/react'
import { Box, Typography, Avatar, TextField } from '@mui/material'

const LOAD_STORAGE_KEY = 'kec_teacher_loads'
function getStoredLoads() {
  try { return JSON.parse(localStorage.getItem(LOAD_STORAGE_KEY) || '{}') } catch { return {} }
}

export default function TeacherNode({ id, data }) {
  const { updateNodeData } = useReactFlow()
  const [load, setLoad] = useState(() => {
    if (data.load !== '' && data.load != null) return data.load
    return getStoredLoads()[id] ?? ''
  })
  const teacher = data.teacher || {}
  const initials = (teacher.name || '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Box
      sx={{
        px: 1.5,
        py: 1,
        borderRadius: 2,
        bgcolor: '#e8f5e9',
        border: '1.5px solid #81c784',
        minWidth: 160,
        boxShadow: '0 2px 8px rgba(76, 175, 80, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#81c784' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#81c784' }} />
      <Avatar
        sx={{
          width: 28,
          height: 28,
          bgcolor: '#43a047',
          fontSize: '0.65rem',
          fontWeight: 700,
        }}
      >
        {initials}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            color: '#2e7d32',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {data.label}
        </Typography>
        {teacher.designation && (
          <Typography sx={{ fontSize: '0.625rem', color: '#66bb6a' }}>
            {teacher.designation}
          </Typography>
        )}
        {teacher.abbreviation && (
          <Typography sx={{ fontSize: '0.625rem', color: '#81c784', fontWeight: 500 }}>
            ({teacher.abbreviation})
          </Typography>
        )}
        <TextField
          label="Load"
          size="small"
          type="number"
          value={load}
          onChange={(e) => setLoad(e.target.value)}
          onBlur={() => {
            const val = parseFloat(load) || 0
            updateNodeData(id, { load: val })
            const loads = getStoredLoads()
            loads[id] = val
            localStorage.setItem(LOAD_STORAGE_KEY, JSON.stringify(loads))
          }}
          onClick={(e) => e.stopPropagation()}
          className="nodrag nopan"
          inputProps={{ min: 0, max: 999, step: 0.5 }}
          sx={{
            mt: 0.75,
            width: '100%',
            '& .MuiInputBase-input': { fontSize: '0.7rem', py: 0.4, px: 0.75 },
            '& .MuiInputLabel-root': { fontSize: '0.65rem' },
            '& .MuiOutlinedInput-root': {
              bgcolor: '#fff',
              '& fieldset': { borderColor: '#a5d6a7' },
              '&:hover fieldset': { borderColor: '#66bb6a' },
            },
          }}
        />
      </Box>
    </Box>
  )
}
