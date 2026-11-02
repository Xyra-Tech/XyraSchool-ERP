import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { AdminPanelSettings as SuperAdminIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('superadmin@xyratech.internal');
  const [password, setPassword] = useState('SuperAdmin@Xyra2026!');
  const [mfaCode, setMfaCode] = useState('');
  const [showMfa, setShowMfa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
        mfaCode: showMfa ? mfaCode : undefined,
      });

      const resData = response.data;
      if (resData.data?.requiresMfa) {
        setShowMfa(true);
        setLoading(false);
        return;
      }

      if (resData.data?.token) {
        localStorage.setItem('platform_token', resData.data.token);
        localStorage.setItem('platform_user', JSON.stringify(resData.data.user));
        navigate('/');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errMsg);
    } finally {
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
        bgcolor: '#0f172a',
        p: 2,
      }}
    >
      <Container maxWidth="xs">
        <Card sx={{ p: 2, bgcolor: '#ffffff', borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Box
                sx={{
                  bgcolor: '#eff6ff',
                  p: 1.5,
                  borderRadius: '50%',
                  color: '#2563eb',
                  mb: 1.5,
                }}
              >
                <SuperAdminIcon sx={{ fontSize: 36 }} />
              </Box>
              <Typography variant="h5" fontWeight={700} align="center">
                Control Center
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                XyraTech Platform Control Plane
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleLogin}>
              {!showMfa ? (
                <>
                  <TextField
                    fullWidth
                    label="Platform Email"
                    variant="outlined"
                    margin="normal"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Master Password"
                    variant="outlined"
                    margin="normal"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </>
              ) : (
                <Box sx={{ my: 2 }}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Two-Factor Authentication is enabled. Enter your 6-digit authenticator code.
                  </Alert>
                  <TextField
                    fullWidth
                    label="6-Digit MFA Code"
                    variant="outlined"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.trim())}
                    placeholder="123456"
                    inputProps={{ maxLength: 6 }}
                    required
                    autoFocus
                  />
                </Box>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mt: 3,
                  mb: 1,
                  bgcolor: '#0f172a',
                  '&:hover': { bgcolor: '#1e293b' },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : showMfa ? 'Verify MFA & Login' : 'Sign In to Control Center'}
              </Button>
            </form>

            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary" display="block" align="center">
              Restricted platform environment. Unauthorized access attempts are monitored and recorded.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
