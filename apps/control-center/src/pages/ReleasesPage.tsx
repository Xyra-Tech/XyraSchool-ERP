// ==============================================================================
// XyraTech Control Center — Releases & Updates Page
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
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  CheckCircle as ApproveIcon,
  RocketLaunch as RolloutIcon,
} from '@mui/icons-material';
import { apiClient } from '../api/client';

export const ReleasesPage: React.FC = () => {
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Release Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [version, setVersion] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [isHotfix, setIsHotfix] = useState(false);
  const [requiresDbMigration, setRequiresDbMigration] = useState(false);

  // Rollout Dialog
  const [selectedRelease, setSelectedRelease] = useState<any | null>(null);
  const [rolloutDialogOpen, setRolloutDialogOpen] = useState(false);
  const [isPilotOnly, setIsPilotOnly] = useState(false);
  const [rollingOut, setRollingOut] = useState(false);
  const [rolloutSummary, setRolloutSummary] = useState<any | null>(null);

  const fetchReleases = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/releases');
      setReleases(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch releases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  const handleCreateRelease = async () => {
    try {
      await apiClient.post('/releases', {
        version,
        title,
        description,
        releaseNotes,
        isHotfix,
        requiresDbMigration,
      });
      setCreateDialogOpen(false);
      fetchReleases();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create release');
    }
  };

  const handleApproveRelease = async (id: string) => {
    try {
      await apiClient.post(`/releases/${id}/approve`);
      fetchReleases();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve release');
    }
  };

  const handleRolloutRelease = async () => {
    if (!selectedRelease) return;
    setRollingOut(true);
    try {
      const res = await apiClient.post(`/releases/${selectedRelease.id}/rollout`, {
        isPilot: isPilotOnly,
      });
      setRolloutSummary(res.data.data);
      fetchReleases();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to rollout release');
    } finally {
      setRollingOut(false);
    }
  };

  const getStatusChip = (status: string) => {
    const map: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      DRAFT: 'default',
      APPROVED: 'primary',
      ROLLING_OUT: 'warning',
      COMPLETED: 'success',
      FAILED: 'error',
    };
    return <Chip label={status} size="small" color={map[status] || 'default'} />;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Platform Releases & Rollouts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage semantic releases, verify schema migration safety, and coordinate staged pilot and global rollouts.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchReleases}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)}>
            Create Release
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
              <TableCell sx={{ fontWeight: 600 }}>Version</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Title / Description</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Database Migration</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Target Deployments</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : releases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  No platform releases registered.
                </TableCell>
              </TableRow>
            ) : (
              releases.map((rel) => (
                <TableRow key={rel.id} hover>
                  <TableCell>
                    <Chip label={`v${rel.version}`} size="small" color="primary" sx={{ fontWeight: 700 }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {rel.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {rel.description || 'Routine release patch'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {rel.requiresDbMigration ? (
                      <Chip label="Schema Changes Required" size="small" color="warning" />
                    ) : (
                      <Chip label="No DB Changes" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>{getStatusChip(rel.status)}</TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {rel.deployments?.length || 0} schools rolled out
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      {rel.status === 'DRAFT' && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ApproveIcon />}
                          onClick={() => handleApproveRelease(rel.id)}
                        >
                          Approve
                        </Button>
                      )}
                      {(rel.status === 'APPROVED' || rel.status === 'DRAFT') && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<RolloutIcon />}
                          onClick={() => {
                            setSelectedRelease(rel);
                            setRolloutSummary(null);
                            setRolloutDialogOpen(true);
                          }}
                        >
                          Rollout
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Release Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Prepare New Release</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            required
            label="Version (e.g. 1.2.0)"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            required
            label="Release Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Release Notes (School visible)"
            value={releaseNotes}
            onChange={(e) => setReleaseNotes(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={<Checkbox checked={isHotfix} onChange={(e) => setIsHotfix(e.target.checked)} />}
            label="Flag as Urgent Hotfix"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={requiresDbMigration}
                onChange={(e) => setRequiresDbMigration(e.target.checked)}
              />
            }
            label="Requires Schema Migrations (Runs advisory lock per school)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateRelease}>
            Save Release
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rollout Dialog */}
      <Dialog open={rolloutDialogOpen} onClose={() => setRolloutDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Rollout Release v{selectedRelease?.version}
        </DialogTitle>
        <DialogContent dividers>
          {rolloutSummary ? (
            <Box sx={{ py: 1 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                Rollout executed successfully!
              </Alert>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Updated School Deployments:
              </Typography>
              {rolloutSummary.results?.map((res: any, idx: number) => (
                <Paper key={idx} sx={{ p: 1.5, mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">{res.schoolName} ({res.schoolCode})</Typography>
                  <Chip label={res.status} size="small" color={res.status === 'COMPLETED' ? 'success' : 'error'} />
                </Paper>
              ))}
            </Box>
          ) : (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Release: <strong>{selectedRelease?.title}</strong>
              </Typography>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Rollouts are executed sequentially through the isolated Deployment Agent with automated smoke health checks.
              </Alert>
              <FormControlLabel
                control={
                  <Checkbox checked={isPilotOnly} onChange={(e) => setIsPilotOnly(e.target.checked)} />
                }
                label="Target Pilot Schools Only (Safe Canary Phase)"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRolloutDialogOpen(false)}>Close</Button>
          {!rolloutSummary && (
            <Button variant="contained" onClick={handleRolloutRelease} disabled={rollingOut}>
              {rollingOut ? <CircularProgress size={24} /> : 'Execute Rollout'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

