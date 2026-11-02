import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { apiClient } from '../api/client';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<any | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userType, setUserType] = useState('TEACHER');
  const [roleCode, setRoleCode] = useState('TEACHER');
  const [phoneNumber, setPhoneNumber] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/users');
      setUsers(res.data?.data || []);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiClient.post('/users', {
        email,
        firstName,
        lastName,
        userType,
        roleCode,
        phoneNumber: phoneNumber || undefined,
      });

      setInviteSuccess(res.data?.data);
      setOpenDialog(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Staff & Account Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage authorized staff identities and send activation invitations
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={fetchUsers} disabled={loading}>
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setInviteSuccess(null);
              setOpenDialog(true);
            }}
            sx={{ bgcolor: '#1e40af' }}
          >
            Invite Staff Member
          </Button>
        </Box>
      </Box>

      {inviteSuccess && (
        <Alert
          severity="success"
          sx={{ mb: 3, p: 2 }}
          onClose={() => setInviteSuccess(null)}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Invitation Created for {inviteSuccess.email}
          </Typography>
          <Typography variant="body2" sx={{ my: 1 }}>
            Share this secure invitation token with the staff member so they can set their password at <code>/activate</code>:
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#ffffff',
              p: 1.5,
              borderRadius: 1,
              border: '1px solid #bbf7d0',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
            }}
          >
            <Box sx={{ flexGrow: 1, wordBreak: 'break-all' }}>
              Token: <strong>{inviteSuccess.invitationToken}</strong>
            </Box>
            <IconButton
              size="small"
              onClick={() => navigator.clipboard.writeText(inviteSuccess.invitationToken)}
              title="Copy"
            >
              <CopyIcon fontSize="small" />
            </IconButton>
          </Box>
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Last Login</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {u.firstName} {u.lastName}
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.userType}</TableCell>
                      <TableCell>
                        <Chip
                          label={u.userRoles?.[0]?.role?.name || u.userType}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.status}
                          size="small"
                          color={u.status === 'ACTIVE' ? 'success' : 'warning'}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleInvite}>
          <DialogTitle fontWeight={700}>Invite Staff Member</DialogTitle>
          <DialogContent dividers>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Staff Official Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Assigned Role"
                  select
                  value={roleCode}
                  onChange={(e) => {
                    setRoleCode(e.target.value);
                    setUserType(e.target.value === 'SCHOOL_ADMIN' ? 'SCHOOL_ADMIN' : e.target.value === 'TEACHER' ? 'TEACHER' : 'STAFF');
                  }}
                  required
                >
                  <MenuItem value="SCHOOL_ADMIN">School Admin (Full Admin Privileges)</MenuItem>
                  <MenuItem value="TEACHER">Teacher (Academic Access)</MenuItem>
                  <MenuItem value="STAFF">Staff (Operational Access)</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenDialog(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting} sx={{ bgcolor: '#1e40af' }}>
              {submitting ? <CircularProgress size={24} color="inherit" /> : 'Generate Invitation'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
