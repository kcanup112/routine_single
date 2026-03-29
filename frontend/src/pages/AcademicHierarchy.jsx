import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
} from '@mui/material'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import { hierarchyService } from '../services/hierarchyService'
import { buildFlowGraph } from '../utils/buildFlowGraph'
import { getLayoutedElements } from '../utils/dagreLayout'
import SemesterNode from '../components/flow/SemesterNode'
import SubjectNode from '../components/flow/SubjectNode'
import ClassTypeNode from '../components/flow/ClassTypeNode'
import TeacherNode from '../components/flow/TeacherNode'

const nodeTypes = {
  semester: SemesterNode,
  subject: SubjectNode,
  classType: ClassTypeNode,
  teacher: TeacherNode,
}

const miniMapNodeColor = (node) => {
  switch (node.type) {
    case 'semester':
      return '#1e3a5f'
    case 'subject':
      return '#42a5f5'
    case 'classType':
      return '#bdbdbd'
    case 'teacher':
      return '#66bb6a'
    default:
      return '#ccc'
  }
}

export default function AcademicHierarchy() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [programmes, setProgrammes] = useState([])
  const [selectedProgramme, setSelectedProgramme] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = useCallback(async (programmeId = null) => {
    setLoading(true)
    setError(null)
    try {
      const data = await hierarchyService.fetchHierarchyData(
        programmeId || null
      )
      setProgrammes(data.programmes)

      if (data.semesters.length === 0) {
        setNodes([])
        setEdges([])
        setLoading(false)
        return
      }

      const { nodes: rawNodes, edges: rawEdges } = buildFlowGraph(data)
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(rawNodes, rawEdges, 'TB')

      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
    } catch (err) {
      console.error('Failed to load hierarchy data:', err)
      setError('Failed to load academic hierarchy data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [setNodes, setEdges])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleProgrammeChange = (e) => {
    const val = e.target.value
    setSelectedProgramme(val)
    loadData(val || null)
  }

  const stats = useMemo(() => {
    const semCount = nodes.filter((n) => n.type === 'semester').length
    const subCount = nodes.filter((n) => n.type === 'subject').length
    const teacherCount = nodes.filter((n) => n.type === 'teacher').length
    return { semCount, subCount, teacherCount }
  }, [nodes])

  return (
    <Box sx={{ p: 3, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AccountTreeIcon sx={{ fontSize: 28, color: '#6366f1' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Academic Hierarchy
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Semester → Subject → Theory/Practical → Teacher
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip label={`${stats.semCount} Semesters`} size="small" sx={{ bgcolor: '#1e3a5f', color: '#fff' }} />
          <Chip label={`${stats.subCount} Subjects`} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0' }} />
          <Chip label={`${stats.teacherCount} Teachers`} size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }} />

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Programme</InputLabel>
            <Select
              value={selectedProgramme}
              onChange={handleProgrammeChange}
              label="Filter by Programme"
            >
              <MenuItem value="">All Programmes</MenuItem>
              {programmes.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Flow Canvas */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress sx={{ color: '#6366f1' }} />
            <Typography sx={{ ml: 2, color: '#64748b' }}>Loading hierarchy...</Typography>
          </Box>
        ) : nodes.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 1 }}>
            <AccountTreeIcon sx={{ fontSize: 48, color: '#cbd5e1' }} />
            <Typography sx={{ color: '#94a3b8' }}>
              No academic data found. {selectedProgramme ? 'Try selecting a different programme.' : 'Please add semesters and subjects first.'}
            </Typography>
          </Box>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            maxZoom={2}
          >
            <Controls
              style={{
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
            <MiniMap
              nodeColor={miniMapNodeColor}
              nodeStrokeWidth={2}
              style={{ borderRadius: 8 }}
              pannable
              zoomable
            />
            <Background variant="dots" gap={16} size={1} color="#e2e8f0" />
          </ReactFlow>
        )}
      </Paper>
    </Box>
  )
}
