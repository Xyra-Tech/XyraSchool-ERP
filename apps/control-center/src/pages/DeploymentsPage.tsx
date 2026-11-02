// ==============================================================================
// XyraTech Control Center — Deployments Orchestration Page
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
  CircularProgress,
  Alert,
  MenuItem,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow as TriggerIcon,
  Build as MaintenanceIcon,
  HealthAndSafety as HealthCheckIcon,
  Refresh as RefreshIcon,
  Terminal as LogsIcon,
} from '@mui/icons-material';
import { apiClient } from '../api/client';

export const DeploymentsPage: React.FC = () => {
  const [deployments, setDeployments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action Dialog State
  const [selectedDeployment, setSelectedDeployment] = useState<any | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [commandType, setCommandType] = useState('HEALTH_CHECK');
  const [targetVersion, setTargetVersion] = useState('1.1.0');
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any | null>(null);

  // Maintenance Dialog State
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [maintenanceReason, setMaintenanceReason] = useState('Scheduled system maintenance');

  const fetchDeployments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/deployments');
      setDeployments(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch deployments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, []);

  const handleOpenAction = (d: any, defaultCmd: string) => {
    setSelectedDeployment(d);
    setCommandType(defaultCmd);
    setExecutionResult(null);
    setActionDialogOpen(true);
  };

  const handleExecuteAction = async () => {
    if (!selectedDeployment) return;
    setExecuting(true);
    try {
      const res = await apiClient.post(`/deployments/${selectedDeployment.id}/action`, {
        commandType,
        targetVersion: commandType === 'UPDATE' || commandType === 'ROLLBACK' ? targetVersion : undefined,
      });
      setExecutionResult(res.data.data);
      fetchDeployments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Deployment command failed');
    } finally {
      setExecuting(false);
    }
  };

  const handleToggleMaintenance = async () => {
    if (!selectedDeployment) return;
    const isMaintenance = selectedDeployment.status === 'MAINTENANCE';
    try {
      await apiClient.post(`/deployments/${selectedDeployment.id}/maintenance`, {
        enabled: !isMaintenance,
        reason: maintenanceReason,
      });
      setMaintenanceDialogOpen(false);
      fetchDeployments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update maintenance mode');
    }
  };

  const getStatusChip = (status: string) => {
    const map: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      HEALTHY: 'success',
      DEGRADED: 'warning',
      FAILED: 'error',
      MAINTENANCE: 'warning',
      SUSPENDED: 'error',
      PROVISIONING: 'info',
      NOT_STARTED: 'default',
    };
    return <Chip label={status} size="small" color={map[status] || 'default'} />;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            School Deployments & Orchestration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage isolated container environments, trigger schema migrations, and execute zero-downtime rolling updates.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchDeployments}>
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Deployments Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>School / Tenant</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Environment</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Deployment URL</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Software Version</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Last Health Probe</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : deployments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No active school deployments found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              deployments.map((d) => (
                <TableRow key={d.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {d.school?.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {d.school?.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={d.environment} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {d.deploymentUrl || `https://${d.school?.domain}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={`v${d.releaseVersion}`} size="small" color="primary" />
                  </TableCell>
                  <TableCell>{getStatusChip(d.status)}</TableCell>
                  <TableCell>
                    {d.lastHealthCheckAt ? new Date(d.lastHealthCheckAt).toLocaleTimeString() : 'Pending'}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Tooltip title="Run Health Check">
                        <IconButton
                          color="info"
                          size="small"
                          onClick={() => handleOpenAction(d, 'HEALTH_CHECK')}
                        >
                          <HealthCheckIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Trigger Update / Migration">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleOpenAction(d, 'UPDATE')}
                        >
                          <TriggerIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Toggle Maintenance Mode">
                        <IconButton
                          color="warning"
                          size="small"
                          onClick={() => {
                            setSelectedDeployment(d);
                            setMaintenanceDialogOpen(true);
                          }}
                        >
                          <MaintenanceIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action / Logs Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Deployment Agent Command: {selectedDeployment?.school?.name}
        </DialogTitle>
        <DialogContent dividers>
          {!executionResult ? (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                select
                label="Command to Dispatch"
                value={commandType}
                onChange={(e) => setCommandType(e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="HEALTH_CHECK">HEALTH_CHECK — Probe API and database connection</MenuItem>
                <MenuItem value="MIGRATE">MIGRATE — Run non-destructive database schema migrations</MenuItem>
                <MenuItem value="UPDATE">UPDATE — Rolling container image update</MenuItem>
                <MenuItem value="ROLLBACK">ROLLBACK — Revert to prior stable release</MenuItem>
                <MenuItem value="REACTIVATE">REACTIVATE — Unfreeze tenant operations</MenuItem>
              </TextField>

              {(commandType === 'UPDATE' || commandType === 'ROLLBACK') && (
                <TextField
                  fullWidth
                  label="Target Release Version"
                  value={targetVersion}
                  onChange={(e) => setTargetVersion(e.target.value)}
                  sx={{ mb: 2 }}
                />
              )}

              <Alert severity="info">
                The Control Center does not execute raw shell commands directly on tenant databases. All commands are validated and dispatched via the scoped Deployment Agent Adapter.
              </Alert>
            </Box>
          ) : (
            <Box sx={{ py: 1 }}>
              <Alert severity={executionResult.status === 'COMPLETED' ? 'success' : 'error'} sx={{ mb: 2 }}>
                Command <strong>{commandType}</strong> {executionResult.status.toLowerCase()} in {executionResult.durationMs}ms
              </Alert>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Agent Execution Logs:
              </Typography>
              <Paper sx={{ p: 2, backgroundColor: '#0f172a', color: '#38bdf8', fontFamily: 'monospace', maxHeight: 300, overflow: 'auto' }}>
                {executionResult.logs?.map((line: string, i: number) => (
                  <Typography key={i} variant="caption" display="block">
                    {line}
                  </Typography>
                ))}
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Close</Button>
          {!executionResult && (
            <Button variant="contained" onClick={handleExecuteAction} disabled={executing}>
              {executing ? <CircularProgress size={24} /> : 'Dispatch Command'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Maintenance Dialog */}
      <Dialog open={maintenanceDialogOpen} onClose={() => setMaintenanceDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selectedDeployment?.status === 'MAINTENANCE' ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Tenant: <strong>{selectedDeployment?.school?.name}</strong>
          </Typography>
          {selectedDeployment?.status !== 'MAINTENANCE' ? (
            <TextField
              fullWidth
              label="Reason for Maintenance"
              value={maintenanceReason}
              onChange={(e) => setMaintenanceReason(e.target.value)}
            />
          ) : (
            <Typography variant="body2">
              Are you sure you want to disable maintenance mode and restore normal user operations?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMaintenanceDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={selectedDeployment?.status === 'MAINTENANCE' ? 'success' : 'warning'}
            onClick={handleToggleMaintenance}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
