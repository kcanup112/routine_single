import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import tenantService from '../services/tenantService';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  InputAdornment,
  IconButton,
  CircularProgress,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  FormControlLabel,
  Link,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Business,
  Person,
  Email,
  Lock,
  Phone,
  LocationCity,
  Public,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';

export default function SignupPage() {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    institution_name: '',
    subdomain: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    confirmPassword: '',
    phone: '',
    city: '',
    country: 'Nepal',
    plan: 'trial',
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Subdomain validation state
  const [subdomainStatus, setSubdomainStatus] = useState({
    checking: false,
    available: null,
    message: '',
    suggestions: [],
  });

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Debounce subdomain check
  useEffect(() => {
    if (formData.subdomain.length >= 3) {
      const timeoutId = setTimeout(() => {
        checkSubdomainAvailability(formData.subdomain);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSubdomainStatus({ checking: false, available: null, message: '', suggestions: [] });
    }
  }, [formData.subdomain]);

  // Password strength calculator
  useEffect(() => {
    const password = formData.admin_password;
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    
    setPasswordStrength(Math.min(strength, 100));
  }, [formData.admin_password]);

  const checkSubdomainAvailability = async (subdomain) => {
    setSubdomainStatus({ checking: true, available: null, message: '', suggestions: [] });
    
    try {
      const response = await tenantService.checkSubdomain(subdomain);
      setSubdomainStatus({
        checking: false,
        available: response.data.available,
        message: response.data.message,
        suggestions: response.data.suggestions || [],
      });
    } catch (err) {
      console.error('Subdomain check error:', err);
      // If check fails, assume available to not block signup
      setSubdomainStatus({
        checking: false,
        available: true,
        message: 'Could not verify subdomain - proceeding with caution',
        suggestions: [],
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Convert subdomain to lowercase and remove spaces
    if (name === 'subdomain') {
      setFormData({ ...formData, [name]: value.toLowerCase().replace(/\s/g, '') });
    } 
    // Auto-extract subdomain from email domain
    else if (name === 'admin_email') {
      setFormData({ ...formData, [name]: value });
      
      // Extract subdomain from email if it contains @
      if (value.includes('@')) {
        const emailDomain = value.split('@')[1];
        if (emailDomain) {
          // Get first part before dot (e.g., lec from lec.edu.np)
          const subdomainFromEmail = emailDomain.split('.')[0].toLowerCase();
          // Only auto-fill if subdomain is empty and extracted subdomain is valid (at least 3 chars)
          if ((!formData.subdomain || formData.subdomain === '') && subdomainFromEmail.length >= 3) {
            setFormData(prev => ({ ...prev, admin_email: value, subdomain: subdomainFromEmail }));
          }
        }
      }
    } 
    else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!agreeToTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }

    if (formData.admin_password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.admin_password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (subdomainStatus.available === false) {
      setError('Please choose an available subdomain');
      return;
    }

    if (subdomainStatus.checking) {
      setError('Please wait for subdomain validation to complete');
      return;
    }

    setLoading(true);

    try {
      const signupData = {
        institution_name: formData.institution_name,
        subdomain: formData.subdomain,
        admin_name: formData.admin_name,
        admin_email: formData.admin_email,
        admin_password: formData.admin_password,
        phone: formData.phone || undefined,
        city: formData.city || undefined,
        country: formData.country,
        plan: formData.plan,
      };

      const response = await tenantService.signup(signupData);
      
      setSuccess('Welcome to Routine Management System! Your organization has been created successfully.');

      // Redirect to login page after short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return 'error';
    if (passwordStrength < 70) return 'warning';
    return 'success';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 70) return 'Medium';
    return 'Strong';
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Business sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Create Your Organization
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Start your 14-day free trial • No credit card required
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {/* Institution Information */}
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Institution Information
            </Typography>

            <TextField
              fullWidth
              label="Institution Name"
              name="institution_name"
              value={formData.institution_name}
              onChange={handleChange}
              margin="normal"
              required
              placeholder="e.g., Kathmandu University, Tribhuvan University"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Business color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Subdomain"
              name="subdomain"
              value={formData.subdomain}
              onChange={handleChange}
              margin="normal"
              required
              placeholder="yourschool"
              helperText={
                subdomainStatus.checking
                  ? 'Checking availability...'
                  : subdomainStatus.message
                  ? `${subdomainStatus.message}${
                      subdomainStatus.suggestions.length > 0
                        ? ` (Try: ${subdomainStatus.suggestions.join(', ')})`
                        : ''
                    }`
                  : `Your URL will be: ${formData.subdomain || 'yourschool'}.localhost:3000`
              }
              error={Boolean(subdomainStatus.available === false)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Public color="action" />
                  </InputAdornment>
                ),
                endAdornment: subdomainStatus.checking ? (
                  <CircularProgress size={20} />
                ) : subdomainStatus.available === true ? (
                  <CheckCircle color="success" />
                ) : subdomainStatus.available === false ? (
                  <Cancel color="error" />
                ) : null,
              }}
            />

            {/* Admin User Information */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Admin Account
            </Typography>

            <TextField
              fullWidth
              label="Your Full Name"
              name="admin_name"
              value={formData.admin_name}
              onChange={handleChange}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Email Address"
              name="admin_email"
              type="email"
              value={formData.admin_email}
              onChange={handleChange}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              name="admin_password"
              type={showPassword ? 'text' : 'password'}
              value={formData.admin_password}
              onChange={handleChange}
              margin="normal"
              required
              helperText={
                formData.admin_password
                  ? `Password strength: ${getPasswordStrengthText()}`
                  : 'At least 8 characters'
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {formData.admin_password && (
              <LinearProgress
                variant="determinate"
                value={passwordStrength}
                color={getPasswordStrengthColor()}
                sx={{ height: 6, borderRadius: 3, mb: 1 }}
              />
            )}

            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              margin="normal"
              required
              error={Boolean(
                formData.confirmPassword &&
                formData.admin_password !== formData.confirmPassword
              )}
              helperText={
                formData.confirmPassword &&
                formData.admin_password !== formData.confirmPassword
                  ? 'Passwords do not match'
                  : ''
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Optional Contact Information */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Contact Information (Optional)
            </Typography>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationCity color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Terms and Conditions */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the{' '}
                  <Link href="#" underline="hover">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="#" underline="hover">
                    Privacy Policy
                  </Link>
                </Typography>
              }
              sx={{ mt: 2 }}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || subdomainStatus.available === false || !agreeToTerms}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Creating your account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            {/* Login Link */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => navigate('/login')}
                  sx={{ fontWeight: 600, cursor: 'pointer' }}
                >
                  Sign In
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
