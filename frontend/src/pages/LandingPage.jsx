import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Fade,
  Slide,
  Zoom,
  useScrollTrigger,
  Chip,
  Avatar,
  Stack,
} from '@mui/material';
import {
  School,
  Schedule,
  People,
  CalendarMonth,
  TrendingUp,
  Speed,
  Security,
  Cloud,
  CheckCircle,
  Star,
  Menu as MenuIcon,
  ArrowForward,
  BusinessCenter,
  Notifications,
  Timeline,
} from '@mui/icons-material';
import { keyframes } from '@mui/system';

// Animations
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

function ScrollAppBar() {
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: trigger
            ? 'rgba(255, 255, 255, 0.95)'
            : 'transparent',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s',
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <School sx={{ fontSize: 32, color: trigger ? 'primary.main' : 'white', mr: 1 }} />
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                color: trigger ? 'transparent' : 'white',
                background: trigger ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'none',
                backgroundClip: trigger ? 'text' : 'none',
                WebkitBackgroundClip: trigger ? 'text' : 'none',
                WebkitTextFillColor: trigger ? 'transparent' : 'white',
              }}
            >
              Routine Scheduler
            </Typography>
          </Box>
          <Button color="inherit" sx={{ mr: 2, color: trigger ? 'text.primary' : 'white' }}>
            Features
          </Button>
          <Button color="inherit" sx={{ mr: 2, color: trigger ? 'text.primary' : 'white' }}>
            Pricing
          </Button>
          <Button color="inherit" sx={{ mr: 3, color: trigger ? 'text.primary' : 'white' }}>
            Contact
          </Button>
          <Button
            variant="outlined"
            href="/login"
            sx={{ 
              mr: 2, 
              borderRadius: 2,
              borderColor: trigger ? 'primary.main' : 'white',
              color: trigger ? 'primary.main' : 'white',
              '&:hover': {
                borderColor: trigger ? 'primary.dark' : 'rgba(255, 255, 255, 0.8)',
                bgcolor: trigger ? 'rgba(99, 102, 241, 0.04)' : 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Sign In
          </Button>
          <Button
            variant="contained"
            href="/signup"
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f91 100%)',
              }
            }}
          >
            Get Started
          </Button>
        </Toolbar>
      </AppBar>
    </Slide>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);

  // Pre-compute random particle positions once (not on every render)
  const particles = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      width: Math.random() * 100 + 50,
      height: Math.random() * 100 + 50,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: `${Math.random() * 3 + 3}s`,
      delay: `${Math.random() * 2}s`,
    })), []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Schedule sx={{ fontSize: 48 }} />,
      title: 'Smart Scheduling',
      description:
        'AI-powered algorithm creates optimal class schedules with zero conflicts',
      color: '#667eea',
    },
    {
      icon: <People sx={{ fontSize: 48 }} />,
      title: 'Multi-Tenant',
      description:
        'Secure, isolated environments for each institution with dedicated schemas',
      color: '#764ba2',
    },
    {
      icon: <CalendarMonth sx={{ fontSize: 48 }} />,
      title: 'Calendar Integration',
      description:
        'Sync schedules with academic calendars, holidays, and special events',
      color: '#f093fb',
    },
    {
      icon: <Timeline sx={{ fontSize: 48 }} />,
      title: 'Analytics',
      description:
        'Comprehensive reports on teacher workload, room utilization, and more',
      color: '#4facfe',
    },
  ];

  const benefits = [
    {
      icon: <Speed />,
      title: 'Save Time',
      description: 'Reduce scheduling time from days to minutes',
    },
    {
      icon: <Security />,
      title: 'Secure & Private',
      description: 'Bank-level encryption and data isolation',
    },
    {
      icon: <Cloud />,
      title: 'Cloud Based',
      description: 'Access from anywhere, anytime, on any device',
    },
    {
      icon: <Notifications />,
      title: 'Real-time Updates',
      description: 'Instant notifications for schedule changes',
    },
  ];

  const testimonials = [
    {
      name: 'Dr. Ramesh Kumar',
      role: 'Academic Director',
      institution: 'Sample Engineering College',
      quote:
        'This system transformed how we manage our schedules. What used to take weeks now takes minutes!',
      rating: 5,
    },
    {
      name: 'Prof. Sita Sharma',
      role: 'HOD Computer Science',
      institution: 'Nepal Engineering College',
      quote:
        'The conflict detection and automatic resolution features are game-changers.',
      rating: 5,
    },
    {
      name: 'Admin Team',
      role: 'Administrative Staff',
      institution: 'Pulchowk Campus',
      quote:
        'Easy to use, powerful features, and excellent support. Highly recommended!',
      rating: 5,
    },
  ];

  const pricingPlans = [
    {
      name: 'Trial',
      price: 'Free',
      period: '14 days',
      features: [
        '50 Teachers',
        '500 Students',
        '20 Classes',
        'Basic Support',
        'All Core Features',
      ],
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      popular: false,
    },
    {
      name: 'Standard',
      price: 'NPR 15,000',
      period: 'per year',
      features: [
        '100 Teachers',
        '2000 Students',
        '50 Classes',
        'Priority Support',
        'Advanced Analytics',
        'API Access',
      ],
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      popular: true,
    },
    {
      name: 'Premium',
      price: 'Custom',
      period: 'contact us',
      features: [
        'Unlimited Teachers',
        'Unlimited Students',
        'Unlimited Classes',
        '24/7 Support',
        'Custom Features',
        'Dedicated Server',
      ],
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      popular: false,
    },
  ];

  return (
    <Box>
      <ScrollAppBar />

      {/* Hero Section */}
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: '400% 400%',
          animation: `${gradientShift} 15s ease infinite`,
          position: 'relative',
          overflow: 'hidden',
          pt: 8,
        }}
      >
        {/* Animated Background Elements */}
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: 0.1,
          }}
        >
          {particles.map((p, i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                width: p.width,
                height: p.height,
                borderRadius: '50%',
                background: 'white',
                left: p.left,
                top: p.top,
                animation: `${float} ${p.duration} ease-in-out infinite`,
                animationDelay: p.delay,
              }}
            />
          ))}
        </Box>

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Fade in timeout={1000}>
                <Box>
                  <Chip
                    label="🚀 Now Available for Educational Institutions"
                    sx={{
                      mb: 2,
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 600,
                      backdropFilter: 'blur(10px)',
                    }}
                  />
                  <Typography
                    variant="h2"
                    component="h1"
                    sx={{
                      color: 'white',
                      fontWeight: 800,
                      mb: 2,
                      fontSize: { xs: '2.5rem', md: '3.5rem' },
                      animation: `${fadeIn} 1s ease-out`,
                    }}
                  >
                    Smart Scheduling for
                    <br />
                    <span
                      style={{
                        background:
                          'linear-gradient(90deg, #fff 0%, #f0f0f0 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Modern Education
                    </span>
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      mb: 4,
                      lineHeight: 1.6,
                    }}
                  >
                    Automate class scheduling, manage teacher workloads, and
                    optimize resource allocation with our AI-powered platform.
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => navigate('/signup')}
                      endIcon={<ArrowForward />}
                      sx={{
                        background: 'white',
                        color: 'primary.main',
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        borderRadius: 3,
                        fontWeight: 600,
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.9)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                        },
                        transition: 'all 0.3s',
                      }}
                    >
                      Start Free Trial
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/login')}
                      sx={{
                        borderColor: 'white',
                        color: 'white',
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        borderRadius: 3,
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: 'white',
                          background: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                    >
                      Watch Demo
                    </Button>
                  </Stack>
                </Box>
              </Fade>
            </Grid>
            <Grid item xs={12} md={6}>
              <Zoom in timeout={1500}>
                <Box
                  sx={{
                    position: 'relative',
                    animation: `${float} 6s ease-in-out infinite`,
                  }}
                >
                  <Card
                    sx={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: 4,
                      p: 3,
                      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <Box
                      sx={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: 3,
                        p: 3,
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Today's Schedule
                      </Typography>
                      {['9:00 AM - Physics Lab', '11:00 AM - Mathematics', '2:00 PM - Chemistry'].map(
                        (item, i) => (
                          <Box
                            key={i}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              p: 1.5,
                              mb: 1,
                              background:
                                i === activeFeature % 3
                                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                  : '#f5f7fa',
                              borderRadius: 2,
                              transition: 'all 0.3s',
                              color: i === activeFeature % 3 ? 'white' : 'text.primary',
                            }}
                          >
                            <Schedule sx={{ mr: 2 }} />
                            <Typography>{item}</Typography>
                          </Box>
                        )
                      )}
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box
                          sx={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: 3,
                            p: 2,
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="h4" fontWeight={700} color="primary">
                            98%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Efficiency
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box
                          sx={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: 3,
                            p: 2,
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="h4" fontWeight={700} color="secondary">
                            24/7
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Available
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Card>
                </Box>
              </Zoom>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 10, background: '#f5f7fa' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Powerful Features
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Everything you need to manage your institution's schedule
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Zoom in timeout={500 + index * 200}>
                  <Card
                    sx={{
                      height: '100%',
                      transition: 'all 0.3s',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-10px)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                      },
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 4 }}>
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          background: feature.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          mx: 'auto',
                          mb: 2,
                          animation: activeFeature === index ? `${pulse} 2s infinite` : 'none',
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Benefits Section */}
      <Box sx={{ py: 10, background: 'white' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" fontWeight={700} gutterBottom>
                Why Choose Us?
              </Typography>
              <Typography variant="h6" color="text.secondary" paragraph>
                Built by educators, for educators
              </Typography>
              <Grid container spacing={3}>
                {benefits.map((benefit, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          mr: 2,
                          flexShrink: 0,
                        }}
                      >
                        {benefit.icon}
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          {benefit.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {benefit.description}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: 'relative',
                  height: 400,
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <BusinessCenter sx={{ fontSize: 200, color: 'rgba(255,255,255,0.2)' }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Testimonials */}
      <Box sx={{ py: 10, background: '#f5f7fa' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Trusted by Leading Institutions
            </Typography>
            <Typography variant="h6" color="text.secondary">
              See what our clients say about us
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', mb: 2 }}>
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} sx={{ color: '#ffc107', fontSize: 20 }} />
                      ))}
                    </Box>
                    <Typography variant="body1" paragraph sx={{ fontStyle: 'italic' }}>
                      "{testimonial.quote}"
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 3 }}>
                      <Avatar sx={{ mr: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        {testimonial.name[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {testimonial.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {testimonial.role}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {testimonial.institution}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Pricing */}
      <Box sx={{ py: 10, background: 'white' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Simple, Transparent Pricing
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Start with a free trial, upgrade when you're ready
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {pricingPlans.map((plan, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    position: 'relative',
                    border: plan.popular ? '2px solid' : '1px solid',
                    borderColor: plan.popular ? 'primary.main' : 'divider',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    },
                  }}
                >
                  {plan.popular && (
                    <Chip
                      label="MOST POPULAR"
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                        fontWeight: 700,
                      }}
                    />
                  )}
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                      {plan.name}
                    </Typography>
                    <Typography
                      variant="h3"
                      fontWeight={800}
                      sx={{
                        background: plan.color,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        my: 2,
                      }}
                    >
                      {plan.price}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {plan.period}
                    </Typography>
                    <Box sx={{ my: 3 }}>
                      {plan.features.map((feature, i) => (
                        <Box
                          key={i}
                          sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}
                        >
                          <CheckCircle sx={{ color: 'success.main', mr: 1, fontSize: 20 }} />
                          <Typography variant="body2">{feature}</Typography>
                        </Box>
                      ))}
                    </Box>
                    <Button
                      variant={plan.popular ? 'contained' : 'outlined'}
                      fullWidth
                      size="large"
                      onClick={() => navigate('/signup')}
                      sx={{
                        mt: 2,
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 600,
                        ...(plan.popular && {
                          background: plan.color,
                          '&:hover': {
                            background: plan.color,
                            opacity: 0.9,
                          },
                        }),
                      }}
                    >
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: 10,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Ready to Transform Your Scheduling?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Join hundreds of educational institutions already using our platform
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/signup')}
            endIcon={<ArrowForward />}
            sx={{
              background: 'white',
              color: 'primary.main',
              px: 5,
              py: 2,
              fontSize: '1.2rem',
              borderRadius: 3,
              fontWeight: 600,
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.9)',
              },
            }}
          >
            Start Your Free Trial
          </Button>
          <Typography variant="body2" sx={{ mt: 2, opacity: 0.8 }}>
            No credit card required • 14-day free trial • Cancel anytime
          </Typography>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 4, background: '#1a1a1a', color: 'white' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <School sx={{ fontSize: 32, mr: 1 }} />
                <Typography variant="h6" fontWeight={700}>
                  Routine Scheduler
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Smart scheduling solutions for modern educational institutions.
              </Typography>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Product
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
                Features
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
                Pricing
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
                Security
              </Typography>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Company
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
                About Us
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
                Careers
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
                Contact
              </Typography>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Resources
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
                Documentation
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
                API
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
                Support
              </Typography>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Legal
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
                Privacy
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
                Terms
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
                License
              </Typography>
            </Grid>
          </Grid>
          <Box
            sx={{
              borderTop: '1px solid rgba(255,255,255,0.1)',
              mt: 4,
              pt: 3,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              © 2025 Routine Scheduler. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
