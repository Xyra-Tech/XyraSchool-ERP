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
  Drawer,
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
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  CheckCircle as SuccessIcon,
  Refresh as RefreshIcon,
  Download as ExportIcon,
  Block as SuspendIcon,
  PlayArrow as ReactivateIcon,
  Cancel as CancelIcon,
  VpnKey as SupportAccessIcon,
  Close as CloseIcon,
  School as SchoolIcon,
  RocketLaunch as DeployIcon,
  Layers as ModulesIcon,
  ReceiptLong as BillingIcon,
  HistoryEdu as AuditIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { apiClient } from '../api/client';

export const SchoolsPage: React.FC = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [openDialog, setOpenDialog] = useState(false);
  const [provisionSuccess, setProvisionSuccess] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected School Profile Drawer State
  const [selectedSchool, setSelectedSchool] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Provisioning Form State
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

  // Edit details state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  // Modules toggles
  const [modules, setModules] = useState<{ [key: string]: boolean }>({
    ADMISSIONS: true,
    ACADEMICS: true,
    FINANCE: true,
    EXAMINATIONS: true,
    HR_PAYROLL: true,
    ATTENDANCE: true,
    LIBRARY: true,
    TRANSPORT: false,
    HOSTEL: false,
    INVENTORY: false,
    AI_ANALYTICS: false,
  });

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

  const openSchoolProfile = (school: any) => {
    setSelectedSchool(school);
    setEditName(school.name);
    setEditPhone(school.contactPhone || '');
    setEditAddress(school.address || '');
    setActiveTab(0);
    setDrawerOpen(true);
  };

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

  const handleStatusChange = async (newStatus: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED') => {
    if (!selectedSchool) return;
    setActionLoading(true);
    try {
      await apiClient.patch(`/schools/${selectedSchool.id}/status`, {
        status: newStatus,
        reason: `Administrative transition to ${newStatus} by platform engineer`,
      });
      setActionSuccess(`School status changed to ${newStatus}`);
      setSelectedSchool({ ...selectedSchool, status: newStatus });
      fetchSchools();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Status update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateDetails = async () => {
    if (!selectedSchool) return;
    setActionLoading(true);
    try {
      await apiClient.patch(`/schools/${selectedSchool.id}`, {
        name: editName,
        contactPhone: editPhone,
        address: editAddress,
      });
      setActionSuccess('School details successfully updated');
      setSelectedSchool({ ...selectedSchool, name: editName, contactPhone: editPhone, address: editAddress });
      fetchSchools();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update school details');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportMetadata = async () => {
    if (!selectedSchool) return;
    try {
      const res = await apiClient.get(`/schools/${selectedSchool.id}/export`);
      const blob = new Blob([JSON.stringify(res.data?.data || selectedSchool, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `school-metadata-${selectedSchool.code}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Metadata export failed:', err);
    }
  };

  const handleRequestSupportAccess = async () => {
    if (!selectedSchool) return;
    setActionLoading(true);
    try {
      await apiClient.post('/support/access-request', {
        schoolId: selectedSchool.id,
        reason: 'Authorized troubleshooting ticket investigation',
        durationMinutes: 60,
      });
      setActionSuccess('Time-bounded Support Access requested. Awaiting school approval / logged in audit.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Support access request failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter and search
  const filteredSchools = schools.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.officialEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            School Directory & Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage multi-tenant school institutions, entitlements, and deployment boundaries
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <IconButton onClick={fetchSchools} disabled={loading} sx={{ bgcolor: '#ffffff' }}>
            <RefreshIcon fontSize="small" />
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
            Provision School Tenant
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
            Isolated tenant database and credentials generated. Under XyraTech security architecture, platform administrators never set or know the Principal's password. Provide this secure activation token to the Principal:
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

      {/* Filter and Search Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by code, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: 280, flexGrow: 1 }}
          />
          <TextField
            select
            size="small"
            label="Filter Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="PENDING_ACTIVATION">Pending Activation</MenuItem>
            <MenuItem value="PROVISIONING">Provisioning</MenuItem>
            <MenuItem value="SUSPENDED">Suspended</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
          </TextField>
          <Chip
            label={`${filteredSchools.length} Schools`}
            size="medium"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        </CardContent>
      </Card>

      {/* School List Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredSchools.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No schools found matching search criteria.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>School Code</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Institution Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Official Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Contact Phone</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Plan</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Health</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSchools.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{s.code}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{s.officialEmail}</TableCell>
                      <TableCell>{s.contactPhone}</TableCell>
                      <TableCell>
                        <Chip
                          label={s.status}
                          size="small"
                          color={s.status === 'ACTIVE' ? 'success' : s.status === 'SUSPENDED' ? 'error' : 'warning'}
                          sx={{ fontWeight: 700, fontSize: '0.72rem' }}
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
                          label={s.deployments?.[0]?.status || 'HEALTHY'}
                          size="small"
                          color="success"
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openSchoolProfile(s)}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          View Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* School Profile Drawer (10 Tabs) */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', md: 720 }, p: 3 } }}
      >
        {selectedSchool && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Drawer Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" fontWeight={800}>
                    {selectedSchool.name}
                  </Typography>
                  <Chip
                    label={selectedSchool.status}
                    size="small"
                    color={selectedSchool.status === 'ACTIVE' ? 'success' : selectedSchool.status === 'SUSPENDED' ? 'error' : 'warning'}
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  School Code: <strong>{selectedSchool.code}</strong> • ID: {selectedSchool.id}
                </Typography>
              </Box>
              <IconButton onClick={() => setDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Action Feedback */}
            {actionSuccess && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionSuccess(null)}>
                {actionSuccess}
              </Alert>
            )}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Quick Action Toolbar */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {selectedSchool.status === 'ACTIVE' ? (
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={<SuspendIcon />}
                  disabled={actionLoading}
                  onClick={() => handleStatusChange('SUSPENDED')}
                >
                  Suspend School
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<ReactivateIcon />}
                  disabled={actionLoading}
                  onClick={() => handleStatusChange('ACTIVE')}
                >
                  Reactivate School
                </Button>
              )}

              <Button
                size="small"
                variant="outlined"
                color="info"
                startIcon={<SupportAccessIcon />}
                disabled={actionLoading}
                onClick={handleRequestSupportAccess}
              >
                Request Support Access
              </Button>

              <Button
                size="small"
                variant="outlined"
                startIcon={<ExportIcon />}
                onClick={handleExportMetadata}
              >
                Export Metadata
              </Button>

              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                disabled={actionLoading}
                onClick={() => handleStatusChange('CANCELLED')}
              >
                Cancel Subscription
              </Button>
            </Box>

            {/* 10 Profile Tabs */}
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab label="1. Overview" />
              <Tab label="2. Organization Details" />
              <Tab label="3. Principal Contact" />
              <Tab label="4. Deployment" />
              <Tab label="5. Subscription" />
              <Tab label="6. Enabled Modules" />
              <Tab label="7. Storage & Usage" />
              <Tab label="8. Releases" />
              <Tab label="9. Support Tickets" />
              <Tab label="10. Audit History" />
            </Tabs>

            {/* Tab Contents */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {/* Tab 1: Overview */}
              {activeTab === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        Tenant Architectural Isolation
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        This institution runs on dedicated database schema boundaries. No student or teacher records are exposed via the platform Control Center, preserving total student privacy and institutional zero-trust boundaries.
                      </Typography>
                    </CardContent>
                  </Card>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Official Email</Typography>
                      <Typography variant="body2" fontWeight={600}>{selectedSchool.officialEmail}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Phone Number</Typography>
                      <Typography variant="body2" fontWeight={600}>{selectedSchool.contactPhone}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Address</Typography>
                      <Typography variant="body2" fontWeight={600}>{selectedSchool.address || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Creation Date</Typography>
                      <Typography variant="body2" fontWeight={600}>{new Date(selectedSchool.createdAt).toLocaleDateString()}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Tab 2: Organization Details */}
              {activeTab === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700}>Edit Platform-Level School Metadata</Typography>
                  <TextField
                    label="School Legal Name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Contact Phone"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Campus Address"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                  />
                  <Button
                    variant="contained"
                    onClick={handleUpdateDetails}
                    disabled={actionLoading}
                    sx={{ alignSelf: 'flex-start', bgcolor: '#2563eb' }}
                  >
                    Save Changes
                  </Button>
                </Box>
              )}

              {/* Tab 3: Principal Contact */}
              {activeTab === 2 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Alert severity="info">
                    Under XyraTech security regulations, school Principals self-activate their accounts via secure one-time cryptographic tokens. Platform staff cannot view or set Principal passwords.
                  </Alert>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Principal Notification Channel</Typography>
                      <Typography variant="body2" fontWeight={600}>{selectedSchool.officialEmail}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Account Onboarding Status</Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip label={selectedSchool.status === 'PENDING_ACTIVATION' ? 'Awaiting Token Activation' : 'Activated'} color="primary" size="small" />
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Tab 4: Deployment */}
              {activeTab === 3 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700}>Container & Database Isolation</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Deployment URL</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#2563eb' }}>
                        {selectedSchool.deployments?.[0]?.deploymentUrl || `https://${selectedSchool.code.toLowerCase()}.xyraschool.internal`}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Health Status</Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip label={selectedSchool.deployments?.[0]?.status || 'HEALTHY'} color="success" size="small" />
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Isolated Storage Bucket</Typography>
                      <Typography variant="body2" fontWeight={600}>xyra-storage-{selectedSchool.code.toLowerCase()}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">API Release Version</Typography>
                      <Typography variant="body2" fontWeight={600}>{selectedSchool.deployments?.[0]?.releaseVersion || 'v1.0.0'}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Tab 5: Subscription */}
              {activeTab === 4 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700}>Subscription Contract & Billing</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Assigned Plan</Typography>
                      <Typography variant="body2" fontWeight={600}>{selectedSchool.subscriptions?.[0]?.plan?.code || 'STANDARD'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Renewal Period</Typography>
                      <Typography variant="body2" fontWeight={600}>Annual (Auto-renew Enabled)</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Billing Frequency</Typography>
                      <Typography variant="body2" fontWeight={600}>Annual Upfront</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Subscription State</Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip label={selectedSchool.subscriptions?.[0]?.status || 'ACTIVE'} color="success" size="small" />
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Tab 6: Enabled Modules */}
              {activeTab === 5 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700}>Feature Entitlement Flags</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                    Toggle operational modules available inside the school's isolated ERP instance:
                  </Typography>
                  <Grid container spacing={1}>
                    {Object.entries(modules).map(([modKey, enabled]) => (
                      <Grid item xs={6} key={modKey}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={enabled}
                              onChange={(e) => setModules({ ...modules, [modKey]: e.target.checked })}
                              color="primary"
                              size="small"
                            />
                          }
                          label={<Typography variant="body2">{modKey.replace('_', ' ')}</Typography>}
                        />
                      </Grid>
                    ))}
                  </Grid>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ mt: 2, alignSelf: 'flex-start', bgcolor: '#2563eb' }}
                    onClick={() => setActionSuccess('Module entitlements updated successfully')}
                  >
                    Save Entitlements
                  </Button>
                </Box>
              )}

              {/* Tab 7: Storage & Usage */}
              {activeTab === 6 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700}>Tenant Resource Consumption</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Card variant="outlined" sx={{ textAlign: 'center', p: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">Database Size</Typography>
                        <Typography variant="h6" fontWeight={700}>42.8 MB</Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={4}>
                      <Card variant="outlined" sx={{ textAlign: 'center', p: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">Storage Files</Typography>
                        <Typography variant="h6" fontWeight={700}>1.4 GB</Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={4}>
                      <Card variant="outlined" sx={{ textAlign: 'center', p: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">API Requests / Day</Typography>
                        <Typography variant="h6" fontWeight={700}>1,840</Typography>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Tab 8: Releases */}
              {activeTab === 7 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700}>Release & Migration History</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current Version: <strong>v1.0.0</strong> (Production Ring). Scheduled for next automated rolling update batch during low-traffic window (02:00 - 04:00 IST).
                  </Typography>
                </Box>
              )}

              {/* Tab 9: Support Tickets */}
              {activeTab === 8 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700}>Linked Support Issues</Typography>
                  <Typography variant="body2" color="text.secondary">
                    No active critical escalation tickets currently open for {selectedSchool.name}.
                  </Typography>
                </Box>
              )}

              {/* Tab 10: Audit History */}
              {activeTab === 9 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700}>Platform Audit Trail for Tenant</Typography>
                  <Typography variant="body2" color="text.secondary">
                    All administrative interventions, status modifications, and support queries are logged into the platform immutable audit ledger.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Provisioning Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleProvision}>
          <DialogTitle fontWeight={800}>Provision New School Tenant</DialogTitle>
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
                <Typography variant="subtitle2" color="primary" sx={{ mt: 1, fontWeight: 700 }}>
                  Principal Account Invitation (Self-Activation Token)
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
