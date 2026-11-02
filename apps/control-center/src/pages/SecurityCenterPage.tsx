// ==============================================================================
// XyraTech Control Center — Security & Compliance Center Page
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Shield as ShieldIcon,
  Lock as LockIcon,
  VpnKey as KeyIcon,
  Refresh as RefreshIcon,
  CheckCircle as OkIcon,
} from '@mui/icons-material';
import { apiClient } from '../api/client';

export const SecurityCenterPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/internal-users');
      setUsers(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const totalUsers = users.length;
  const mfaUsers = users.filter((u) => u.mfaEnabled).length;
  const mfaPercent = totalUsers > 0 ? Math.round((mfaUsers / totalUsers) * 100) : 0;
  const superAdmins = users.filter((u) => u.isSuperAdmin).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Platform Security & Compliance Center
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Zero-trust identity verification, privileged account access governance, and field-level encryption status.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchSecurityData}>
          Refresh
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Security Baseline Note:</strong> XyraTech enforces tenant data boundary isolation. The Control Center never connects directly to arbitrary school operational databases. All cryptographic operations use Argon2id and AES-256-GCM.
      </Alert>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* MFA Coverage */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LockIcon color="primary" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Staff MFA Enrollment Rate
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={800} color="primary" sx={{ my: 1 }}>
                  {mfaPercent}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {mfaUsers} of {totalUsers} platform administrators enrolled in RFC 6238 TOTP
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary">
                  MFA is mandatory for Super Admin and Production Deployment roles.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Privileged Accounts */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <KeyIcon color="warning" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Privileged Super Admins
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={800} color="warning.main" sx={{ my: 1 }}>
                  {superAdmins}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Accounts with platform-wide administrative permission flags
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary">
                  Adheres to least-privilege boundary rules.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Cryptography Baseline */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ShieldIcon color="success" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Cryptographic Integrity
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={800} color="success.main" sx={{ my: 1 }}>
                  AES-256
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Field-level encryption active on database credentials and MFA secrets
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary">
                  Argon2id password hashing with 19 MiB memory cost profile.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Security Architecture Guidelines */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Active Security Architecture Controls
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                    <OkIcon color="success" />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Tenant Boundary Isolation
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Every registered school receives a physically or logically isolated PostgreSQL database. Control Center queries never cross tenant schemas.
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                    <OkIcon color="success" />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Controlled Time-Bounded Support Access
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Support staff cannot browse operational student or staff records. Access requires explicit permission, defined scope, and expires automatically.
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                    <OkIcon color="success" />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Strict Ownership Principle
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        XyraTech never generates or knows the school Principal's password. Principals activate via one-time tokens and manage their own institutions.
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                    <OkIcon color="success" />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Immutable Audit Logging
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Every privileged platform action, onboarding approval, rollout dispatch, and configuration update is logged with actor email and client IP.
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

