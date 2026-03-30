import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
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
  Snackbar,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Tooltip,
} from '@mui/material'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import SchoolIcon from '@mui/icons-material/School'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import PersonIcon from '@mui/icons-material/Person'
import { hierarchyService } from '../services/hierarchyService'
import { semesterSubjectService, teacherSubjectService, semesterService, subjectService, teacherService } from '../services/index'
import { buildFlowGraph } from '../utils/buildFlowGraph'
import { getLayoutedElements } from '../utils/dagreLayout'
import SemesterNode from '../components/flow/SemesterNode'
import SubjectNode from '../components/flow/SubjectNode'
import TeacherNode from '../components/flow/TeacherNode'
import { ConfirmRemoveDialog } from '../components/flow/HierarchyDialogs'

const nodeTypes = {
  semester: SemesterNode,
  subject: SubjectNode,
  teacher: TeacherNode,
}

const EDGE_DEFAULTS = {
  type: 'smoothstep',
  animated: false,
  style: { stroke: '#94a3b8', strokeWidth: 1.5 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 16, height: 16 },
}

const miniMapNodeColor = (node) => {
  switch (node.type) {
    case 'semester':
      return '#1e3a5f'
    case 'subject':
      return '#42a5f5'
    case 'teacher':
      return '#66bb6a'
    default:
      return '#ccc'
  }
}

// Parse flat node IDs: sem-{id}, sub-{id}, teacher-{id}
function parseNodeId(nodeId) {
  const parts = nodeId.split('-')
  if (parts[0] === 'sem') return { type: 'semester', semesterId: parseInt(parts[1]) }
  if (parts[0] === 'sub') return { type: 'subject', subjectId: parseInt(parts[1]) }
  if (parts[0] === 'teacher') return { type: 'teacher', teacherId: parseInt(parts[1]) }
  return {}
}

// Parse edge IDs: e-sem-{semId}-sub-{subId} or e-sub-{subId}-teacher-{teacherId}
function parseEdgeId(edgeId) {
  if (edgeId.startsWith('e-sem-')) {
    const m = edgeId.match(/^e-sem-(\d+)-sub-(\d+)$/)
    if (m) return { type: 'semester-subject', semesterId: parseInt(m[1]), subjectId: parseInt(m[2]) }
  }
  if (edgeId.startsWith('e-sub-')) {
    const m = edgeId.match(/^e-sub-(\d+)-teacher-(\d+)$/)
    if (m) return { type: 'subject-teacher', subjectId: parseInt(m[1]), teacherId: parseInt(m[2]) }
  }
  return {}
}

export default function AcademicHierarchy() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [programmes, setProgrammes] = useState([])
  const [selectedProgramme, setSelectedProgramme] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hierarchyData, setHierarchyData] = useState(null)

  // Add-node toolbar state
  const [addNodeType, setAddNodeType] = useState(null) // 'semester'|'subject'|'teacher'
  const [availableItems, setAvailableItems] = useState([])
  const [addNodeMenuAnchor, setAddNodeMenuAnchor] = useState(null)
  const [loadingItems, setLoadingItems] = useState(false)

  // Right-click context menu
  const [contextMenu, setContextMenu] = useState(null)
  const [contextNode, setContextNode] = useState(null)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [dialogTarget, setDialogTarget] = useState(null)

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const toast = (message, severity = 'success') => setSnackbar({ open: true, message, severity })

  const loadData = useCallback(async (programmeId = null) => {
    setLoading(true)
    setError(null)
    try {
      const data = await hierarchyService.fetchHierarchyData(programmeId || null)
      setProgrammes(data.programmes)
      setHierarchyData(data)

      if (data.semesters.length === 0) {
        setNodes([])
        setEdges([])
        setLoading(false)
        return
      }

      const { nodes: rawNodes, edges: rawEdges } = buildFlowGraph(data)
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rawNodes, rawEdges, 'TB')
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
    } catch (err) {
      console.error(err)
      setError('Failed to load academic hierarchy data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [setNodes, setEdges])

  useEffect(() => { loadData() }, [loadData])

  const handleProgrammeChange = (e) => {
    const val = e.target.value
    setSelectedProgramme(val)
    loadData(val || null)
  }

  // â”€â”€ Add Node Toolbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const openAddNodeMenu = async (event, type) => {
    setAddNodeMenuAnchor(event.currentTarget)
    setAddNodeType(type)
    setLoadingItems(true)
    try {
      const canvasIds = nodes.map((n) => n.id)
      let items = []
      if (type === 'semester') {
        const res = await semesterService.getAll()
        items = res.data.filter((s) => !canvasIds.includes(`sem-${s.id}`))
      } else if (type === 'subject') {
        const res = await subjectService.getAll()
        items = res.data.filter((s) => s.is_active && !canvasIds.includes(`sub-${s.id}`))
      } else if (type === 'teacher') {
        const res = await teacherService.getAll()
        items = res.data.filter((t) => t.is_active && !canvasIds.includes(`teacher-${t.id}`))
      }
      setAvailableItems(items)
    } finally {
      setLoadingItems(false)
    }
  }

  const closeAddNodeMenu = () => {
    setAddNodeMenuAnchor(null)
    setAddNodeType(null)
    setAvailableItems([])
  }

  const handleAddNodeFromMenu = (item) => {
    closeAddNodeMenu()
    let newNode
    if (addNodeType === 'semester') {
      newNode = { id: `sem-${item.id}`, type: 'semester', data: { label: item.name, semester: item }, position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 100 } }
    } else if (addNodeType === 'subject') {
      newNode = { id: `sub-${item.id}`, type: 'subject', data: { label: item.name, subject: item }, position: { x: 100 + Math.random() * 300, y: 200 + Math.random() * 100 } }
    } else if (addNodeType === 'teacher') {
      newNode = { id: `teacher-${item.id}`, type: 'teacher', data: { label: item.name, teacher: item }, position: { x: 100 + Math.random() * 300, y: 350 + Math.random() * 100 } }
    }
    if (newNode) setNodes((nds) => [...nds, newNode])
  }

  // â”€â”€ Connect: draw edge â†’ persist to DB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const onConnect = useCallback(async (connection) => {
    const src = parseNodeId(connection.source)
    const tgt = parseNodeId(connection.target)

    // semester â†’ subject
    if (src.type === 'semester' && tgt.type === 'subject') {
      try {
        await semesterSubjectService.addSubject(src.semesterId, tgt.subjectId)
        setEdges((eds) => addEdge({ ...connection, ...EDGE_DEFAULTS, id: `e-sem-${src.semesterId}-sub-${tgt.subjectId}` }, eds))
        toast('Subject added to semester')
      } catch (e) {
        toast(e?.response?.data?.detail || 'Failed to add subject to semester', 'error')
      }
      return
    }

    // subject â†’ teacher  OR  teacher â†’ subject
    let subjectId, teacherId
    if (src.type === 'subject' && tgt.type === 'teacher') {
      subjectId = src.subjectId; teacherId = tgt.teacherId
    } else if (src.type === 'teacher' && tgt.type === 'subject') {
      subjectId = tgt.subjectId; teacherId = src.teacherId
    }

    if (subjectId && teacherId) {
      try {
        await teacherSubjectService.assignSubject(teacherId, subjectId)
        setEdges((eds) => addEdge({ ...connection, ...EDGE_DEFAULTS, id: `e-sub-${subjectId}-teacher-${teacherId}` }, eds))
        toast('Teacher assigned to subject')
      } catch (e) {
        toast(e?.response?.data?.detail || 'Failed to assign teacher', 'error')
      }
      return
    }

    toast('Invalid connection: only Semesterâ†’Subject or Subjectâ†”Teacher connections are allowed', 'error')
  }, [setEdges, toast])

  // â”€â”€ Delete edge â†’ remove DB relationship â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const onEdgesDelete = useCallback(async (deletedEdges) => {
    for (const edge of deletedEdges) {
      const parsed = parseEdgeId(edge.id)
      try {
        if (parsed.type === 'semester-subject') {
          await semesterSubjectService.removeSubject(parsed.semesterId, parsed.subjectId)
          toast('Subject removed from semester')
        } else if (parsed.type === 'subject-teacher') {
          await teacherSubjectService.removeSubject(parsed.teacherId, parsed.subjectId)
          toast('Teacher removed from subject')
        }
      } catch (e) {
        toast(e?.response?.data?.detail || 'Failed to remove connection', 'error')
      }
    }
  }, [])

  // â”€â”€ Delete node â†’ remove all its DB relationships â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const onNodesDelete = useCallback(async (deletedNodes) => {
    for (const node of deletedNodes) {
      const parsed = parseNodeId(node.id)
      // Find all edges connected to this node in the current graph
      const relatedEdges = edges.filter((e) => e.source === node.id || e.target === node.id)
      for (const edge of relatedEdges) {
        const ep = parseEdgeId(edge.id)
        try {
          if (ep.type === 'semester-subject') {
            await semesterSubjectService.removeSubject(ep.semesterId, ep.subjectId)
          } else if (ep.type === 'subject-teacher') {
            await teacherSubjectService.removeSubject(ep.teacherId, ep.subjectId)
          }
        } catch {}
      }
      if (parsed.type) toast(`${node.data.label} removed from canvas`)
    }
  }, [edges])

  // â”€â”€ Right-click context menu â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault()
    setContextMenu({ top: event.clientY, left: event.clientX })
    setContextNode(node)
  }, [])

  const closeContextMenu = () => { setContextMenu(null); setContextNode(null) }

  const handleContextAction = (action) => {
    if (!contextNode) return
    const parsed = parseNodeId(contextNode.id)
    if (action === 'remove-from-canvas') {
      // Just remove from canvas, no DB call
      setNodes((nds) => nds.filter((n) => n.id !== contextNode.id))
      setEdges((eds) => eds.filter((e) => e.source !== contextNode.id && e.target !== contextNode.id))
    } else if (action === 'delete-relations') {
      setDialogTarget({ node: contextNode, parsed, label: contextNode.data.label })
      setRemoveDialogOpen(true)
    }
    closeContextMenu()
  }

  const handleRemoveConfirm = async () => {
    const { node, parsed } = dialogTarget
    const relatedEdges = edges.filter((e) => e.source === node.id || e.target === node.id)
    for (const edge of relatedEdges) {
      const ep = parseEdgeId(edge.id)
      try {
        if (ep.type === 'semester-subject') await semesterSubjectService.removeSubject(ep.semesterId, ep.subjectId)
        else if (ep.type === 'subject-teacher') await teacherSubjectService.removeSubject(ep.teacherId, ep.subjectId)
      } catch {}
    }
    setNodes((nds) => nds.filter((n) => n.id !== node.id))
    setEdges((eds) => eds.filter((e) => e.source !== node.id && e.target !== node.id))
    toast(`${dialogTarget.label} and its connections removed`)
  }

  const stats = useMemo(() => ({
    semCount: nodes.filter((n) => n.type === 'semester').length,
    subCount: nodes.filter((n) => n.type === 'subject').length,
    teacherCount: nodes.filter((n) => n.type === 'teacher').length,
  }), [nodes])

  return (
    <Box sx={{ p: 3, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 3, background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AccountTreeIcon sx={{ fontSize: 28, color: '#6366f1' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Academic Hierarchy</Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Drag handles to connect â€¢ Right-click to remove â€¢ Delete key removes selected
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Chip label={`${stats.semCount} Semesters`} size="small" sx={{ bgcolor: '#1e3a5f', color: '#fff' }} />
          <Chip label={`${stats.subCount} Subjects`} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0' }} />
          <Chip label={`${stats.teacherCount} Teachers`} size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }} />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Programme</InputLabel>
            <Select value={selectedProgramme} onChange={handleProgrammeChange} label="Filter by Programme">
              <MenuItem value="">All Programmes</MenuItem>
              {programmes.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Flow Canvas */}
      <Paper elevation={0} sx={{ flex: 1, borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden', position: 'relative' }}>
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress sx={{ color: '#6366f1' }} />
            <Typography sx={{ ml: 2, color: '#64748b' }}>Loading hierarchy...</Typography>
          </Box>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgesDelete={onEdgesDelete}
            onNodesDelete={onNodesDelete}
            onNodeContextMenu={onNodeContextMenu}
            nodeTypes={nodeTypes}
            deleteKeyCode={['Backspace', 'Delete']}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            maxZoom={2}
          >
            <Controls style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            <MiniMap nodeColor={miniMapNodeColor} nodeStrokeWidth={2} style={{ borderRadius: 8 }} pannable zoomable />
            <Background variant="dots" gap={16} size={1} color="#e2e8f0" />

            {/* Add Node Toolbar */}
            <Panel position="top-left">
              <Paper elevation={2} sx={{ p: 1, borderRadius: 2, display: 'flex', gap: 1, bgcolor: '#fff' }}>
                <Tooltip title="Add Semester node">
                  <Button size="small" variant="outlined" startIcon={<SchoolIcon />}
                    onClick={(e) => openAddNodeMenu(e, 'semester')}
                    sx={{ borderColor: '#1e3a5f', color: '#1e3a5f', fontSize: '0.75rem', textTransform: 'none', '&:hover': { bgcolor: '#e8eaf6' } }}>
                    + Semester
                  </Button>
                </Tooltip>
                <Tooltip title="Add Subject node">
                  <Button size="small" variant="outlined" startIcon={<MenuBookIcon />}
                    onClick={(e) => openAddNodeMenu(e, 'subject')}
                    sx={{ borderColor: '#1565c0', color: '#1565c0', fontSize: '0.75rem', textTransform: 'none', '&:hover': { bgcolor: '#e3f2fd' } }}>
                    + Subject
                  </Button>
                </Tooltip>
                <Tooltip title="Add Teacher node">
                  <Button size="small" variant="outlined" startIcon={<PersonIcon />}
                    onClick={(e) => openAddNodeMenu(e, 'teacher')}
                    sx={{ borderColor: '#2e7d32', color: '#2e7d32', fontSize: '0.75rem', textTransform: 'none', '&:hover': { bgcolor: '#e8f5e9' } }}>
                    + Teacher
                  </Button>
                </Tooltip>
              </Paper>
            </Panel>
          </ReactFlow>
        )}
      </Paper>

      {/* Add Node Dropdown Menu */}
      <Menu open={Boolean(addNodeMenuAnchor)} anchorEl={addNodeMenuAnchor} onClose={closeAddNodeMenu}
        PaperProps={{ sx: { maxHeight: 320, minWidth: 220, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' } }}>
        {loadingItems ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={20} /></Box>
        ) : availableItems.length === 0 ? (
          <MenuItem disabled><Typography sx={{ fontSize: '0.875rem', color: '#94a3b8' }}>All already on canvas</Typography></MenuItem>
        ) : (
          availableItems.map((item) => (
            <MenuItem key={item.id} onClick={() => handleAddNodeFromMenu(item)}>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.name}</Typography>
                {(item.code || item.abbreviation) && (
                  <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{item.code || item.abbreviation}</Typography>
                )}
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>

      {/* Right-click Context Menu */}
      {contextMenu && contextNode && (
        <Menu open onClose={closeContextMenu} anchorReference="anchorPosition"
          anchorPosition={{ top: contextMenu.top, left: contextMenu.left }}
          slotProps={{ paper: { sx: { borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', minWidth: 220 } } }}>
          <MenuItem onClick={() => handleContextAction('remove-from-canvas')}>
            <ListItemIcon><DeleteIcon sx={{ color: '#64748b' }} /></ListItemIcon>
            <ListItemText>Remove from canvas only</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => handleContextAction('delete-relations')}>
            <ListItemIcon><PersonRemoveIcon sx={{ color: '#d32f2f' }} /></ListItemIcon>
            <ListItemText sx={{ color: '#d32f2f' }}>Remove & delete all connections</ListItemText>
          </MenuItem>
        </Menu>
      )}

      {/* Confirm Remove Dialog */}
      <ConfirmRemoveDialog
        open={removeDialogOpen}
        onClose={() => setRemoveDialogOpen(false)}
        title="Remove & Delete Connections"
        message={`Remove "${dialogTarget?.label}" from canvas and delete all its database relationships?`}
        onConfirm={handleRemoveConfirm}
      />

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
