import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  TextField,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Security as SecurityIcon, Key as KeyIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import { apiClient } from '../api/client';

export const SettingsPage: React.FC = () => {
  const user = JSON.parse(localStorage.getItem('platform_user') || '{}');
  const [openMfaModal, setOpenMfaModal] = useState(false);
  const [mfaSecret, setMfaSecret] = useState('');
  const [otpAuthUrl, setOtpAuthUrl] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [mfaStatus, setMfaStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startMfaSetup = async () => {
    setError(null);
    try {
      const res = await apiClient.post('/auth/mfa/setup');
      setMfaSecret(res.data.data.secret);
      setOtpAuthUrl(res.data.data.otpAuthUrl);
      setRecoveryCodes(res.data.data.recoveryCodes || []);
      setOpenMfaModal(true);
    } catch (err: any) {
      setError('Failed to initiate MFA setup.');
    }
  };

  const confirmMfa = async () => {
    try {
      await apiClient.post('/auth/mfa/verify', { code: verifyCode });
      setMfaStatus('MFA has been successfully verified and activated for your administrator account.');
      setOpenMfaModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Enter valid 6-digit code.');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Platform Security & Administration
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage platform authentication credentials, MFA, and environment parameters
        </Typography>
      </Box>

      {mfaStatus && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMfaStatus(null)}>
          {mfaStatus}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <SecurityIcon sx={{ color: '#2563eb' }} />
                <Typography variant="h6" fontWeight={700}>
                  Two-Factor Authentication (MFA)
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enforce RFC 6238 Time-based One-Time Password verification for Super Admin logins.
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    MFA Protection
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.mfaEnabled ? 'Active (Authenticator App)' : 'Disabled'}
                  </Typography>
                </Box>
                <Chip
                  label={user.mfaEnabled ? 'ENABLED' : 'DISABLED'}
                  size="small"
                  color={user.mfaEnabled ? 'success' : 'default'}
                />
              </Box>

              <Button
                variant="outlined"
                startIcon={<KeyIcon />}
                onClick={startMfaSetup}
              >
                Configure Authenticator App
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <CheckIcon sx={{ color: '#059669' }} />
                <Typography variant="h6" fontWeight={700}>
                  Platform Architecture Info
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>API Endpoint:</strong> <code>/api/v1/platform</code>
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Isolation Model:</strong> Dedicated Database per School
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Cryptographic Suite:</strong> Argon2id, AES-256-GCM, SHA-256
              </Typography>
              <Typography variant="body2">
                <strong>Platform Version:</strong> 1.0.0 (Phase 1 Approved Baseline)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* MFA Setup Dialog */}
      <Dialog open={openMfaModal} onClose={() => setOpenMfaModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Setup Two-Factor Authentication</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography variant="body2" sx={{ mb: 1 }}>
            Add this key to your Google Authenticator or 1Password:
          </Typography>
          <Box sx={{ p: 1.5, bgcolor: '#f1f5f9', borderRadius: 1, fontFamily: 'monospace', fontSize: '1rem', textAlign: 'center', letterSpacing: 2, mb: 2 }}>
            <strong>{mfaSecret}</strong>
          </Box>

          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
            Backup Recovery Codes:
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, mb: 2 }}>
            {recoveryCodes.map((code, idx) => (
              <Typography key={idx} variant="caption" sx={{ fontFamily: 'monospace' }}>
                {code}
              </Typography>
            ))}
          </Box>

          <TextField
            fullWidth
            label="Enter 6-digit Code to Confirm"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.trim())}
            inputProps={{ maxLength: 6 }}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenMfaModal(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={confirmMfa} sx={{ bgcolor: '#2563eb' }}>
            Activate MFA
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
