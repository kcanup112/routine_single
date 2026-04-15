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
    <Box sx={{ minHeight: '100vh', bgcolor: '#f0f4f8' }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: '100vh', md: '100vh' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Background Image */}
        <Box
          component="img"
          src="/building.jpg"
          alt="Kantipur Engineering College"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />

        {/* Dark overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(10,20,50,0.72) 0%, rgba(10,30,60,0.82) 100%)',
          }}
        />

        {/* Hero Content */}
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center', px: 3 }}>
          {/* Logo */}
          <Box
            component="img"
            src="/kec logo.png"
            alt="KEC Logo"
            sx={{
              width: { xs: 100, md: 130 },
              height: { xs: 100, md: 130 },
              borderRadius: '50%',
              mb: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              border: '3px solid rgba(255,255,255,0.25)',
            }}
          />

          <Typography
            variant="overline"
            sx={{
              color: '#f59e0b',
              letterSpacing: 4,
              fontWeight: 700,
              fontSize: { xs: '0.65rem', md: '0.8rem' },
              display: 'block',
              mb: 1,
            }}
          >
            Kathmandu, Nepal &nbsp;·&nbsp; Est. 1998
          </Typography>

          <Typography
            variant="h3"
            fontWeight={800}
            sx={{
              color: 'white',
              fontSize: { xs: '1.8rem', md: '2.8rem' },
              lineHeight: 1.2,
              mb: 1,
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            }}
          >
            Kantipur Engineering College
          </Typography>

          {/* Divider line */}
          <Box
            sx={{
              width: 60,
              height: 3,
              bgcolor: '#f59e0b',
              borderRadius: 2,
              mx: 'auto',
              my: 2,
            }}
          />

          <Typography
            variant="h5"
            sx={{
              color: 'rgba(255,255,255,0.9)',
              fontWeight: 400,
              fontSize: { xs: '1rem', md: '1.35rem' },
              mb: 4,
              letterSpacing: 1,
            }}
          >
            Routine Management System
          </Typography>

          <Button
            variant="contained"
            size="large"
            startIcon={<LoginIcon />}
            onClick={() => navigate('/login')}
            sx={{
              background: 'linear-gradient(90deg, #f472b6 0%, #a78bfa 50%, #60a5fa 100%)',
              color: 'white',
              fontWeight: 700,
              px: 5,
              py: 1.5,
              fontSize: '1rem',
              borderRadius: '50px',
              boxShadow: '0 6px 24px rgba(167,139,250,0.35)',
              textTransform: 'none',
              transition: 'opacity 0.2s, transform 0.2s',
              '&:hover': {
                opacity: 0.92,
                transform: 'translateY(-1px)',
                background: 'linear-gradient(90deg, #f472b6 0%, #a78bfa 50%, #60a5fa 100%)',
                boxShadow: '0 8px 28px rgba(167,139,250,0.45)',
              },
            }}
          >
            Sign In
          </Button>
        </Container>

        {/* Scroll indicator */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.5,
            opacity: 0.6,
            animation: 'bounce 2s infinite',
            '@keyframes bounce': {
              '0%, 100%': { transform: 'translateX(-50%) translateY(0)' },
              '50%': { transform: 'translateX(-50%) translateY(8px)' },
            },
          }}
        >
          <Typography variant="caption" sx={{ color: 'white', letterSpacing: 2 }}>
            SCROLL
          </Typography>
          <Box sx={{ width: 1.5, height: 32, bgcolor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
        </Box>
      </Box>

      {/* Features Section */}
      <Box sx={{ bgcolor: 'white', py: { xs: 6, md: 10 } }}>
        <Container maxWidth="md">
          <Typography
            variant="h5"
            fontWeight={700}
            textAlign="center"
            sx={{ mb: 1, color: '#1a1a2e' }}
          >
            Everything you need to manage academic schedules
          </Typography>
          <Typography
            variant="body1"
            textAlign="center"
            color="text.secondary"
            sx={{ mb: 6 }}
          >
            Streamline timetable creation for all departments and programmes.
          </Typography>

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
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.08)' },
                }}
              >
                <Box sx={{ color: '#f59e0b', mb: 2 }}>{f.icon}</Box>
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

      {/* Footer */}
      <Box sx={{ bgcolor: '#1a1a2e', py: 3, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          © {new Date().getFullYear()} Kantipur Engineering College &nbsp;·&nbsp; Routine Management System
        </Typography>
      </Box>
    </Box>
  );
}
