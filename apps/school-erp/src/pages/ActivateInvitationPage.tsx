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
import { School as SchoolIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';

export const ActivateInvitationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get('token') || '';

  const [token, setToken] = useState(initialToken);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  const navigate = useNavigate();

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post('/auth/activate-invitation', {
        token,
        firstName,
        lastName,
        password,
        confirmPassword,
      });

      setSuccessData(res.data?.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to activate invitation. The token may be invalid, expired, or already used.'
      );
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
        bgcolor: '#f1f5f9',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ p: 2, borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Box
                sx={{
                  bgcolor: '#dbeafe',
                  p: 1.5,
                  borderRadius: '50%',
                  color: '#1e40af',
                  mb: 1.5,
                }}
              >
                <SchoolIcon sx={{ fontSize: 36 }} />
              </Box>
              <Typography variant="h5" fontWeight={700} align="center">
                Principal & Staff Account Activation
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Configure your administrator credentials for your isolated school environment
              </Typography>
            </Box>

            {successData ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CheckIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Account Activated Successfully!
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Your account <strong>{successData.email}</strong> is now active. Please save your backup recovery codes:
                </Typography>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 1,
                    p: 2,
                    bgcolor: '#f8fafc',
                    borderRadius: 2,
                    border: '1px solid #e2e8f0',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    mb: 3,
                  }}
                >
                  {successData.recoveryCodes?.map((code: string, idx: number) => (
                    <Box key={idx} sx={{ p: 0.5, bgcolor: '#ffffff', borderRadius: 1 }}>
                      {code}
                    </Box>
                  ))}
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{ bgcolor: '#1e40af' }}
                >
                  Proceed to Login
                </Button>
              </Box>
            ) : (
              <>
                <Alert severity="info" sx={{ mb: 2.5 }}>
                  Under XyraTech security architecture, platform operators never set or know your password. You have exclusive ownership over your credentials.
                </Alert>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleActivate}>
                  <TextField
                    fullWidth
                    label="Invitation Token"
                    variant="outlined"
                    margin="normal"
                    value={token}
                    onChange={(e) => setToken(e.target.value.trim())}
                    helperText="Provided by your school provisioning team"
                    required
                  />

                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </Box>

                  <TextField
                    fullWidth
                    label="Create Password (min 10 characters, mixed case, numbers & symbols)"
                    variant="outlined"
                    margin="normal"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <TextField
                    fullWidth
                    label="Confirm Password"
                    variant="outlined"
                    margin="normal"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ mt: 3, mb: 1, bgcolor: '#1e40af' }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Set Password & Activate Account'}
                  </Button>
                </form>

                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary" display="block" align="center">
                  Passwords are cryptographic salted hashes using Argon2id and cannot be recovered in plaintext.
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
