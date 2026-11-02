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
  CheckCircle as SuccessIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { apiClient } from '../api/client';

export const SchoolsPage: React.FC = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [provisionSuccess, setProvisionSuccess] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [principalEmail, setPrincipalEmail] = useState('');
  const [principalFirstName, setPrincipalFirstName] = useState('');
  const [principalLastName, setPrincipalLastName] = useState('');
  const [planCode, setPlanCode] = useState('STARTER');
  const [academicYearStart, setAcademicYearStart] = useState('2026-04-01');
  const [academicYearEnd, setAcademicYearEnd] = useState('2027-03-31');

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/schools');
      setSchools(res.data?.data || []);
    } catch (err: any) {
      console.error('Failed to fetch schools:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiClient.post('/schools', {
        code,
        name,
        officialEmail,
        contactPhone,
        address,
        principalEmail,
        principalFirstName,
        principalLastName,
        planCode,
        academicYearStart,
        academicYearEnd,
      });

      setProvisionSuccess(res.data?.data);
      setOpenDialog(false);
      fetchSchools();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Provisioning failed. Check input details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            School Directory & Provisioning
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage isolated school tenant databases and credentials
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={fetchSchools} disabled={loading}>
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setProvisionSuccess(null);
              setOpenDialog(true);
            }}
            sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
          >
            Provision School
          </Button>
        </Box>
      </Box>

      {/* Success Modal for Invitation Token */}
      {provisionSuccess && (
        <Alert
          severity="success"
          icon={<SuccessIcon fontSize="inherit" />}
          sx={{ mb: 3, p: 2 }}
          onClose={() => setProvisionSuccess(null)}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            School '{provisionSuccess.name}' Provisioned Successfully!
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, mb: 1.5 }}>
            Isolated database and secrets created. Under XyraTech security rules, platform administrators never set or know the Principal's password. Provide this secure activation token to the Principal:
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
              Invitation Token: <strong>{provisionSuccess.invitationToken}</strong>
            </Box>
            <IconButton
              size="small"
              onClick={() => navigator.clipboard.writeText(provisionSuccess.invitationToken)}
              title="Copy Token"
            >
              <CopyIcon fontSize="small" />
            </IconButton>
          </Box>
        </Alert>
      )}

      {/* School List */}
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
                    <TableCell sx={{ fontWeight: 600 }}>School Code</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Institution Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Official Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Contact Phone</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Plan</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Health</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schools.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{s.code}</TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.officialEmail}</TableCell>
                      <TableCell>{s.contactPhone}</TableCell>
                      <TableCell>
                        <Chip
                          label={s.status}
                          size="small"
                          color={s.status === 'ACTIVE' ? 'success' : 'warning'}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={s.subscriptions?.[0]?.plan?.code || 'STARTER'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={s.deployments?.[0]?.healthStatus || 'HEALTHY'}
                          size="small"
                          color="success"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Provisioning Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleProvision}>
          <DialogTitle fontWeight={700}>Provision New School Tenant</DialogTitle>
          <DialogContent dividers>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="School Code (e.g. DPS-DELHI-001)"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Subscription Plan"
                  select
                  value={planCode}
                  onChange={(e) => setPlanCode(e.target.value)}
                  required
                >
                  <MenuItem value="STARTER">Starter Plan (500 Students)</MenuItem>
                  <MenuItem value="STANDARD">Standard School (2000 Students)</MenuItem>
                  <MenuItem value="ENTERPRISE">Enterprise Campus (10000 Students)</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="School Legal / Institution Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Official School Email"
                  type="email"
                  value={officialEmail}
                  onChange={(e) => setOfficialEmail(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Campus Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>
                  Principal Account Invitation (Self-Activation)
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Principal First Name"
                  value={principalFirstName}
                  onChange={(e) => setPrincipalFirstName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Principal Last Name"
                  value={principalLastName}
                  onChange={(e) => setPrincipalLastName(e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Principal Direct Email"
                  type="email"
                  value={principalEmail}
                  onChange={(e) => setPrincipalEmail(e.target.value)}
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenDialog(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : 'Confirm & Provision Database'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
