// ==============================================================================
// XyraTech Control Center — Internal Users & Roles Page
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon, Shield as SecurityIcon } from '@mui/icons-material';
import { apiClient } from '../api/client';

export const InternalUsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [roleName, setRoleName] = useState('SUPPORT_AGENT');
  const [inviteResult, setInviteResult] = useState<any | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/internal-users');
      setUsers(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch internal users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInviteUser = async () => {
    try {
      const res = await apiClient.post('/internal-users', {
        email,
        firstName,
        lastName,
        roleName,
      });
      setInviteResult(res.data.data);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to invite user');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Internal Users & Role Administration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage XyraTech platform administrators, engineers, support staff, and enforce role-based access control.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchUsers}>
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setInviteResult(null);
              setDialogOpen(true);
            }}
          >
            Invite Platform User
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Name / Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Assigned Roles</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>MFA Security</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Last Login</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  No internal staff users registered.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {u.firstName} {u.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {u.email}
                    </Typography>
                  </TableCell>
                  <TableCell>{u.department?.name || 'Platform Core'}</TableCell>
                  <TableCell>
                    {u.userRoles?.map((ur: any) => (
                      <Chip
                        key={ur.platformRoleId}
                        label={ur.platformRole?.name?.replace(/_/g, ' ')}
                        size="small"
                        color={ur.platformRole?.name === 'SUPER_ADMIN' ? 'error' : 'primary'}
                        sx={{ mr: 0.5, fontWeight: 600 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell>
                    {u.mfaEnabled ? (
                      <Chip label="TOTP Active" size="small" color="success" />
                    ) : (
                      <Chip label="Not Enrolled" size="small" variant="outlined" color="warning" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={u.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                      size="small"
                      color={u.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Invite User Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Invite Internal Platform Staff</DialogTitle>
        <DialogContent dividers>
          {inviteResult ? (
            <Box sx={{ py: 1 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                User invited successfully!
              </Alert>
              <Typography variant="subtitle2" fontWeight={700}>
                Temporary Password for Development Login:
              </Typography>
              <Paper sx={{ p: 2, mt: 1, backgroundColor: '#f1f5f9', fontFamily: 'monospace' }}>
                {inviteResult.temporaryPasswordNotice}
              </Paper>
            </Box>
          ) : (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                required
                label="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  required
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <TextField
                  fullWidth
                  required
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </Box>
              <TextField
                fullWidth
                select
                label="Assigned Platform Role"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                helperText="Controls administrative permissions across the Control Center"
              >
                <MenuItem value="SUPER_ADMIN">Super Admin (Unrestricted platform control)</MenuItem>
                <MenuItem value="PLATFORM_ADMINISTRATOR">Platform Administrator</MenuItem>
                <MenuItem value="FINANCE_MANAGER">Finance Manager (Billing, Invoices, Refunds)</MenuItem>
                <MenuItem value="SUBSCRIPTION_MANAGER">Subscription Manager</MenuItem>
                <MenuItem value="DEPLOYMENT_ENGINEER">Deployment Engineer</MenuItem>
                <MenuItem value="RELEASE_MANAGER">Release Manager</MenuItem>
                <MenuItem value="SUPPORT_MANAGER">Support Manager</MenuItem>
                <MenuItem value="SUPPORT_AGENT">Support Agent</MenuItem>
                <MenuItem value="CONTENT_MANAGER">Content Manager (CMS, Announcements)</MenuItem>
                <MenuItem value="SECURITY_ADMINISTRATOR">Security Administrator</MenuItem>
                <MenuItem value="BUSINESS_ANALYST">Business Analyst</MenuItem>
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          {!inviteResult && (
            <Button variant="contained" onClick={handleInviteUser}>
              Issue Invitation
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

