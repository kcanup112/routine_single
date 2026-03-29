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
  Snackbar,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import { hierarchyService } from '../services/hierarchyService'
import { semesterSubjectService, teacherSubjectService } from '../services/index'
import { buildFlowGraph } from '../utils/buildFlowGraph'
import { getLayoutedElements } from '../utils/dagreLayout'
import SemesterNode from '../components/flow/SemesterNode'
import SubjectNode from '../components/flow/SubjectNode'
import ClassTypeNode from '../components/flow/ClassTypeNode'
import TeacherNode from '../components/flow/TeacherNode'
import { AddSubjectDialog, AddTeacherDialog, ConfirmRemoveDialog } from '../components/flow/HierarchyDialogs'

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

// Extract semesterId and subjectId from node IDs like "sub-3-12" or "teacher-3-12-theory-5"
function parseNodeId(nodeId) {
  const parts = nodeId.split('-')
  if (parts[0] === 'sem') return { semesterId: parseInt(parts[1]) }
  if (parts[0] === 'sub') return { semesterId: parseInt(parts[1]), subjectId: parseInt(parts[2]) }
  if (parts[0] === 'type') return { semesterId: parseInt(parts[1]), subjectId: parseInt(parts[2]), classType: parts[3] }
  if (parts[0] === 'teacher') return { semesterId: parseInt(parts[1]), subjectId: parseInt(parts[2]), classType: parts[3], teacherId: parseInt(parts[4]) }
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

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null)
  const [contextNode, setContextNode] = useState(null)

  // Dialog states
  const [addSubjectOpen, setAddSubjectOpen] = useState(false)
  const [addTeacherOpen, setAddTeacherOpen] = useState(false)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [dialogTarget, setDialogTarget] = useState(null)

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const loadData = useCallback(async (programmeId = null) => {
    setLoading(true)
    setError(null)
    try {
      const data = await hierarchyService.fetchHierarchyData(
        programmeId || null
      )
      setProgrammes(data.programmes)
      setHierarchyData(data)

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

  // Right-click handler on nodes
  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault()
    setContextMenu({ top: event.clientY, left: event.clientX })
    setContextNode(node)
  }, [])

  const closeContextMenu = () => {
    setContextMenu(null)
    setContextNode(null)
  }

  // Handle context menu actions
  const handleAction = useCallback((action, node) => {
    const parsed = parseNodeId(node.id)

    if (action === 'add-subject') {
      setDialogTarget({ semesterId: parsed.semesterId, semester: node.data.semester, id: parsed.semesterId, name: node.data.semester?.name })
      setAddSubjectOpen(true)
    } else if (action === 'add-teacher') {
      setDialogTarget({ subjectId: parsed.subjectId, subject: node.data.subject, id: parsed.subjectId, name: node.data.subject?.name })
      setAddTeacherOpen(true)
    } else if (action === 'remove-subject') {
      setDialogTarget({
        semesterId: parsed.semesterId,
        subjectId: parsed.subjectId,
        label: node.data.label,
      })
      setRemoveDialogOpen(true)
    } else if (action === 'remove-teacher') {
      setDialogTarget({
        subjectId: parsed.subjectId,
        teacherId: parsed.teacherId,
        label: node.data.label,
      })
      setRemoveDialogOpen(true)
    }
  }, [])

  // CRUD callbacks
  const handleAddSubject = async (semesterId, subjectId) => {
    await semesterSubjectService.addSubject(semesterId, subjectId)
    setSnackbar({ open: true, message: 'Subject added successfully', severity: 'success' })
    loadData(selectedProgramme || null)
  }

  const handleAddTeacher = async (teacherId, subjectId) => {
    await teacherSubjectService.assignSubject(teacherId, subjectId)
    setSnackbar({ open: true, message: 'Teacher assigned successfully', severity: 'success' })
    loadData(selectedProgramme || null)
  }

  const handleRemoveConfirm = async () => {
    if (dialogTarget?.teacherId) {
      await teacherSubjectService.removeSubject(dialogTarget.teacherId, dialogTarget.subjectId)
      setSnackbar({ open: true, message: 'Teacher removed successfully', severity: 'success' })
    } else if (dialogTarget?.subjectId && dialogTarget?.semesterId) {
      await semesterSubjectService.removeSubject(dialogTarget.semesterId, dialogTarget.subjectId)
      setSnackbar({ open: true, message: 'Subject removed successfully', severity: 'success' })
    }
    loadData(selectedProgramme || null)
  }

  // Compute existing IDs for filtering dropdowns
  const existingSubjectIds = useMemo(() => {
    if (!hierarchyData || !dialogTarget?.semesterId) return []
    const subjects = hierarchyData.semesterSubjectsMap[dialogTarget.semesterId] || []
    return subjects.map((s) => s.id)
  }, [hierarchyData, dialogTarget])

  const existingTeacherIds = useMemo(() => {
    if (!hierarchyData || !dialogTarget?.subjectId) return []
    const teachers = hierarchyData.subjectTeachersMap[dialogTarget.subjectId] || []
    return teachers.map((t) => t.id)
  }, [hierarchyData, dialogTarget])

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
              Right-click nodes to add/remove subjects & teachers
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
            onNodeContextMenu={onNodeContextMenu}
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

      {/* Context Menu */}
      {contextMenu && contextNode && (
        <Menu
          open
          onClose={closeContextMenu}
          anchorReference="anchorPosition"
          anchorPosition={{ top: contextMenu.top, left: contextMenu.left }}
          slotProps={{ paper: { sx: { borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', minWidth: 220 } } }}
        >
          {contextNode.type === 'semester' && (
            <MenuItem onClick={() => { handleAction('add-subject', contextNode); closeContextMenu() }}>
              <ListItemIcon><AddIcon sx={{ color: '#1565c0' }} /></ListItemIcon>
              <ListItemText>Add Subject to Semester</ListItemText>
            </MenuItem>
          )}
          {contextNode.type === 'subject' && [
            <MenuItem key="add-t" onClick={() => { handleAction('add-teacher', contextNode); closeContextMenu() }}>
              <ListItemIcon><PersonAddIcon sx={{ color: '#2e7d32' }} /></ListItemIcon>
              <ListItemText>Assign Teacher</ListItemText>
            </MenuItem>,
            <Divider key="d" />,
            <MenuItem key="rm-s" onClick={() => { handleAction('remove-subject', contextNode); closeContextMenu() }}>
              <ListItemIcon><DeleteIcon sx={{ color: '#d32f2f' }} /></ListItemIcon>
              <ListItemText sx={{ color: '#d32f2f' }}>Remove Subject</ListItemText>
            </MenuItem>,
          ]}
          {contextNode.type === 'teacher' && (
            <MenuItem onClick={() => { handleAction('remove-teacher', contextNode); closeContextMenu() }}>
              <ListItemIcon><PersonRemoveIcon sx={{ color: '#d32f2f' }} /></ListItemIcon>
              <ListItemText sx={{ color: '#d32f2f' }}>Remove Teacher</ListItemText>
            </MenuItem>
          )}
        </Menu>
      )}

      {/* Dialogs */}
      <AddSubjectDialog
        open={addSubjectOpen}
        onClose={() => setAddSubjectOpen(false)}
        semester={dialogTarget}
        existingSubjectIds={existingSubjectIds}
        onConfirm={handleAddSubject}
      />
      <AddTeacherDialog
        open={addTeacherOpen}
        onClose={() => setAddTeacherOpen(false)}
        subject={dialogTarget}
        existingTeacherIds={existingTeacherIds}
        onConfirm={handleAddTeacher}
      />
      <ConfirmRemoveDialog
        open={removeDialogOpen}
        onClose={() => setRemoveDialogOpen(false)}
        title={dialogTarget?.teacherId ? 'Remove Teacher' : 'Remove Subject'}
        message={dialogTarget?.teacherId
          ? `Remove teacher "${dialogTarget?.label}" from this subject?`
          : `Remove subject "${dialogTarget?.label}" from this semester? This won't delete the subject itself.`}
        onConfirm={handleRemoveConfirm}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
