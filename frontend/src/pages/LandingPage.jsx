import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Stack,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  Login as LoginIcon,
} from '@mui/icons-material';

const features = [
  { icon: <ScheduleIcon fontSize="large" />, title: 'Automated Scheduling', desc: 'Generate conflict-free routines using constraint-based optimization.' },
  { icon: <SchoolIcon fontSize="large" />, title: 'Academic Management', desc: 'Manage departments, programmes, teachers, subjects, and classes.' },
  { icon: <CalendarIcon fontSize="large" />, title: 'Academic Calendar', desc: 'Track holidays, exam schedules, and important dates.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Routine Scheduler
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.85, mb: 4 }}>
            Automated timetable generation for your institution
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<LoginIcon />}
            onClick={() => navigate('/login')}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              fontWeight: 600,
              px: 4,
              '&:hover': { bgcolor: 'grey.100' },
            }}
          >
            Sign In
          </Button>
        </Container>
      </Box>

      {/* Features */}
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          {features.map((f) => (
            <Paper
              key={f.title}
              elevation={0}
              sx={{
                flex: 1,
                p: 4,
                textAlign: 'center',
                border: '1px solid',
                borderColor: 'grey.200',
                borderRadius: 3,
              }}
            >
              <Box sx={{ color: 'primary.main', mb: 2 }}>{f.icon}</Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {f.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {f.desc}
              </Typography>
            </Paper>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
