// ==============================================================================
// XyraTech Control Center — School Onboarding Workflow Page
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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  Alert,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  HelpOutline as RequestInfoIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { apiClient } from '../api/client';

export const OnboardingPage: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Review Dialog State
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | 'REQUEST_INFO'>('APPROVE');
  const [reviewReason, setReviewReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewResult, setReviewResult] = useState<any | null>(null);

  // Manual Onboarding Dialog
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    schoolName: '',
    schoolType: 'K-12 Private Academy',
    officialEmail: '',
    contactPhone: '',
    city: '',
    state: '',
    principalName: '',
    principalEmail: '',
    principalPhone: '',
    expectedStudentCount: 500,
    requestedPlanCode: 'STANDARD',
  });

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/onboarding', {
        params: { status: statusFilter || undefined, search: search || undefined },
      });
      setApplications(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch onboarding applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const handleOpenReview = (app: any, action: 'APPROVE' | 'REJECT' | 'REQUEST_INFO') => {
    setSelectedApp(app);
    setReviewAction(action);
    setReviewReason('');
    setReviewNotes('');
    setReviewResult(null);
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedApp) return;
    setSubmittingReview(true);
    try {
      const res = await apiClient.post(`/onboarding/${selectedApp.id}/review`, {
        action: reviewAction,
        reason: reviewReason,
        notes: reviewNotes,
      });
      setReviewResult(res.data.data);
      fetchApplications();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to process application review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleManualSubmit = async () => {
    try {
      await apiClient.post('/onboarding/apply', manualForm);
      setManualDialogOpen(false);
      fetchApplications();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create manual onboarding application');
    }
  };

  const getStatusChip = (status: string) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      APPLICATION_SUBMITTED: 'info',
      VERIFICATION_PENDING: 'warning',
      DOCUMENT_REVIEW: 'warning',
      APPROVED: 'primary',
      DEPLOYMENT_PROVISIONING: 'secondary',
      SCHOOL_ACTIVATED: 'success',
      REJECTED: 'error',
    };
    return <Chip label={status.replace(/_/g, ' ')} size="small" color={colors[status] || 'default'} />;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            School Onboarding & Provisioning
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review online applications, verify documents, and initiate automated isolated tenant provisioning.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchApplications}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setManualDialogOpen(true)}>
            Manual Onboarding
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          label="Search school name, email, or city"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchApplications()}
          sx={{ width: 350 }}
        />
        <TextField
          size="small"
          select
          label="Status Filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ width: 220 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="APPLICATION_SUBMITTED">Application Submitted</MenuItem>
          <MenuItem value="VERIFICATION_PENDING">Verification Pending</MenuItem>
          <MenuItem value="SCHOOL_ACTIVATED">School Activated</MenuItem>
          <MenuItem value="REJECTED">Rejected</MenuItem>
        </TextField>
        <Button variant="contained" onClick={fetchApplications}>
          Search
        </Button>
      </Paper>

      {/* Applications Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>School Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Official Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Principal</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Plan</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Submitted</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No onboarding applications found matching criteria.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app) => (
                <TableRow key={app.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{app.schoolName}</TableCell>
                  <TableCell>{app.officialEmail}</TableCell>
                  <TableCell>
                    {app.city ? `${app.city}, ${app.state || ''}` : 'India'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {app.principalName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {app.principalEmail}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={app.requestedPlanCode || 'STANDARD'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{getStatusChip(app.status)}</TableCell>
                  <TableCell>{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    {app.status !== 'SCHOOL_ACTIVATED' && app.status !== 'REJECTED' ? (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title="Approve & Provision">
                          <IconButton
                            color="success"
                            size="small"
                            onClick={() => handleOpenReview(app, 'APPROVE')}
                          >
                            <ApproveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Request More Info">
                          <IconButton
                            color="warning"
                            size="small"
                            onClick={() => handleOpenReview(app, 'REQUEST_INFO')}
                          >
                            <RequestInfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject Application">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleOpenReview(app, 'REJECT')}
                          >
                            <RejectIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Completed
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {reviewAction === 'APPROVE' && 'Approve & Provision School'}
          {reviewAction === 'REJECT' && 'Reject Onboarding Application'}
          {reviewAction === 'REQUEST_INFO' && 'Request Verification Documents / Information'}
        </DialogTitle>
        <DialogContent dividers>
          {reviewResult ? (
            <Box sx={{ py: 2 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                School provisioned successfully!
              </Alert>
              <Typography variant="subtitle2" fontWeight={700}>
                School Code: {reviewResult.school?.code}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Deployment URL: <code>{reviewResult.school?.domain}</code>
              </Typography>
              <Paper sx={{ p: 2, mt: 2, backgroundColor: '#f1f5f9' }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Principal Invitation Token (Ownership Rule: XyraTech never sets the Principal's password):
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace', mt: 0.5 }}>
                  {reviewResult.principalInvitation?.token}
                </Typography>
              </Paper>
            </Box>
          ) : (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Institution: <strong>{selectedApp?.schoolName}</strong> ({selectedApp?.officialEmail})
              </Typography>

              {reviewAction === 'APPROVE' && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Approving this application will generate School ID, provision an isolated PostgreSQL database & private storage bucket, and issue an invitation token directly to Principal <strong>{selectedApp?.principalEmail}</strong>.
                </Alert>
              )}

              {reviewAction === 'REJECT' && (
                <TextField
                  fullWidth
                  required
                  label="Rejection Reason"
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  sx={{ mb: 2 }}
                />
              )}

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Reviewer Notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Internal review justification or follow-up notes..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Close</Button>
          {!reviewResult && (
            <Button
              variant="contained"
              color={reviewAction === 'REJECT' ? 'error' : 'primary'}
              onClick={handleSubmitReview}
              disabled={submittingReview}
            >
              {submittingReview ? <CircularProgress size={24} /> : `Confirm ${reviewAction}`}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Manual Onboarding Dialog */}
      <Dialog open={manualDialogOpen} onClose={() => setManualDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Register School (Manual Super Admin Onboarding)</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="School Name"
                value={manualForm.schoolName}
                onChange={(e) => setManualForm({ ...manualForm, schoolName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Official Email"
                value={manualForm.officialEmail}
                onChange={(e) => setManualForm({ ...manualForm, officialEmail: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Contact Phone"
                value={manualForm.contactPhone}
                onChange={(e) => setManualForm({ ...manualForm, contactPhone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={manualForm.city}
                onChange={(e) => setManualForm({ ...manualForm, city: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Principal Full Name"
                value={manualForm.principalName}
                onChange={(e) => setManualForm({ ...manualForm, principalName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Principal Email"
                value={manualForm.principalEmail}
                onChange={(e) => setManualForm({ ...manualForm, principalEmail: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Requested Subscription Plan"
                value={manualForm.requestedPlanCode}
                onChange={(e) => setManualForm({ ...manualForm, requestedPlanCode: e.target.value })}
              >
                <MenuItem value="BASIC">Basic School Plan</MenuItem>
                <MenuItem value="STANDARD">Standard Institution</MenuItem>
                <MenuItem value="PROFESSIONAL">Professional Campus</MenuItem>
                <MenuItem value="ENTERPRISE">Enterprise Multi-Campus</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Expected Student Count"
                value={manualForm.expectedStudentCount}
                onChange={(e) => setManualForm({ ...manualForm, expectedStudentCount: Number(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManualDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleManualSubmit}>
            Submit Application
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

