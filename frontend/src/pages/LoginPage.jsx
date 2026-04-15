import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

/* Reusable pill-shaped input */
function PillInput({ label, type = 'text', value, onChange, autoFocus, autoComplete, endAdornment }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box
        component="input"
        placeholder={label}
        type={type}
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        required
        sx={{
          width: '100%',
          py: '14px',
          px: '22px',
          border: 'none',
          outline: 'none',
          borderRadius: '50px',
          bgcolor: '#f0ede8',
          fontSize: '0.95rem',
          color: '#333',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          pr: endAdornment ? '52px' : '22px',
          transition: 'box-shadow 0.2s',
          '&:focus': {
            boxShadow: '0 0 0 3px rgba(139,92,246,0.18)',
          },
          '&::placeholder': {
            color: '#9e9e9e',
          },
        }}
      />
      {endAdornment && (
        <Box sx={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
          {endAdornment}
        </Box>
      )}
    </Box>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const redirect = searchParams.get('redirect') || '/dashboard';
      navigate(redirect);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #fdf6f0 0%, #f3eeff 50%, #fce4f4 100%)',
      }}
    >
      <Box
        component="form"
        onSubmit={handleLogin}
        sx={{
          width: '100%',
          maxWidth: 400,
          mx: 2,
          bgcolor: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(18px)',
          borderRadius: '28px',
          p: { xs: '32px 24px', sm: '40px 36px' },
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        }}
      >
        {/* Title */}
        <Typography
          variant="h4"
          fontWeight={800}
          textAlign="center"
          sx={{ mb: 3.5, color: '#1a1a2e', letterSpacing: '-0.02em' }}
        >
          Sign In
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2.5, borderRadius: 3, fontSize: '0.875rem' }}
          >
            {error}
          </Alert>
        )}

        {/* Email field */}
        <Box sx={{ mb: 2 }}>
          <Box
            component="input"
            placeholder="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            autoComplete="email"
            required
            sx={{
              width: '100%',
              py: '14px',
              px: '22px',
              border: 'none',
              outline: 'none',
              borderRadius: '50px',
              bgcolor: '#f0ede8',
              fontSize: '0.95rem',
              color: '#333',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              transition: 'box-shadow 0.2s',
              '&:focus': { boxShadow: '0 0 0 3px rgba(139,92,246,0.18)' },
              '&::placeholder': { color: '#9e9e9e' },
            }}
          />
        </Box>

        {/* Password field */}
        <Box sx={{ mb: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Box
            component="input"
            placeholder="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            sx={{
              width: '100%',
              py: '14px',
              pl: '22px',
              pr: '52px',
              border: 'none',
              outline: 'none',
              borderRadius: '50px',
              bgcolor: '#f0ede8',
              fontSize: '0.95rem',
              color: '#333',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              transition: 'box-shadow 0.2s',
              '&:focus': { boxShadow: '0 0 0 3px rgba(139,92,246,0.18)' },
              '&::placeholder': { color: '#9e9e9e' },
            }}
          />
          <IconButton
            onClick={() => setShowPassword(!showPassword)}
            size="small"
            sx={{
              position: 'absolute',
              right: 12,
              color: '#9e9e9e',
              '&:hover': { color: '#555' },
            }}
          >
            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
          </IconButton>
        </Box>

        {/* Forgot password */}
        <Box sx={{ textAlign: 'right', mb: 3 }}>
          <Typography
            component="span"
            variant="body2"
            sx={{
              color: '#7c6af7',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.82rem',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Forgot Password?
          </Typography>
        </Box>

        {/* Submit button */}
        <Button
          type="submit"
          fullWidth
          disabled={loading}
          sx={{
            py: 1.6,
            borderRadius: '50px',
            background: 'linear-gradient(90deg, #f472b6 0%, #a78bfa 50%, #60a5fa 100%)',
            color: 'white',
            fontWeight: 700,
            fontSize: '1rem',
            textTransform: 'none',
            boxShadow: '0 6px 24px rgba(167,139,250,0.35)',
            border: 'none',
            transition: 'opacity 0.2s, transform 0.2s',
            '&:hover': {
              opacity: 0.92,
              transform: 'translateY(-1px)',
              background: 'linear-gradient(90deg, #f472b6 0%, #a78bfa 50%, #60a5fa 100%)',
            },
            '&:disabled': {
              background: '#e2e8f0',
              color: '#94a3b8',
              boxShadow: 'none',
            },
          }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </Box>
    </Box>
  );
}
