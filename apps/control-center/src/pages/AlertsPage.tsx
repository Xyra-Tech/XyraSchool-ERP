// ==============================================================================
// XyraTech Control Center — Operational Alerts & Notifications Center
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
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Done as ResolveIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { apiClient } from '../api/client';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Trigger Alert Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [category, setCategory] = useState('DEPLOYMENT_FAILURE');
  const [severity, setSeverity] = useState('HIGH');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/alerts');
      setAlerts(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch operational alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await apiClient.patch(`/alerts/${id}/status`, { status });
      fetchAlerts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update alert');
    }
  };

  const handleCreateAlert = async () => {
    try {
      await apiClient.post('/alerts', {
        category,
        severity,
        title,
        message,
      });
      setDialogOpen(false);
      fetchAlerts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to trigger alert');
    }
  };

  const getSeverityChip = (s: string) => {
    const map: Record<string, 'default' | 'error' | 'warning' | 'info'> = {
      CRITICAL: 'error',
      HIGH: 'error',
      MEDIUM: 'warning',
      LOW: 'info',
      INFORMATIONAL: 'default',
    };
    return <Chip label={s} size="small" color={map[s] || 'default'} sx={{ fontWeight: 700 }} />;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Platform Operations Alert Center
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time infrastructure anomalies, failed database migrations, payment drops, and SLA escalation alerts.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchAlerts}>
            Refresh
          </Button>
          <Button variant="contained" color="warning" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Simulate Alert
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
              <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Alert Title / Detail</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Triggered At</TableCell>
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
            ) : alerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  No active operational alerts. Systems normal.
                </TableCell>
              </TableRow>
            ) : (
              alerts.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell>{getSeverityChip(a.severity)}</TableCell>
                  <TableCell>
                    <Chip label={a.category.replace(/_/g, ' ')} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {a.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {a.message}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={a.status}
                      size="small"
                      color={a.status === 'RESOLVED' ? 'success' : a.status === 'ACKNOWLEDGED' ? 'info' : 'warning'}
                    />
                  </TableCell>
                  <TableCell>{new Date(a.createdAt).toLocaleTimeString()}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      {a.status === 'TRIGGERED' && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleUpdateStatus(a.id, 'ACKNOWLEDGED')}
                        >
                          Acknowledge
                        </Button>
                      )}
                      {a.status !== 'RESOLVED' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<ResolveIcon />}
                          onClick={() => handleUpdateStatus(a.id, 'RESOLVED')}
                        >
                          Resolve
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

      {/* Trigger Alert Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Trigger Operational Alert</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          >
            <MenuItem value="DEPLOYMENT_FAILURE">Deployment Failure</MenuItem>
            <MenuItem value="PAYMENT_FAILURE">Payment Gateway Failure</MenuItem>
            <MenuItem value="SUPPORT_SLA_BREACH">Support SLA Breach</MenuItem>
            <MenuItem value="AI_QUOTA_THRESHOLD">AI Quota Threshold Exceeded</MenuItem>
            <MenuItem value="SECURITY_INCIDENT">Security Incident Detected</MenuItem>
            <MenuItem value="BACKUP_FAILURE">Automated Backup Failure</MenuItem>
          </TextField>
          <TextField
            fullWidth
            select
            label="Severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            sx={{ mb: 2 }}
          >
            <MenuItem value="CRITICAL">Critical (Immediate Escalation)</MenuItem>
            <MenuItem value="HIGH">High</MenuItem>
            <MenuItem value="MEDIUM">Medium</MenuItem>
            <MenuItem value="LOW">Low</MenuItem>
          </TextField>
          <TextField
            fullWidth
            required
            label="Alert Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            required
            label="Diagnostic Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleCreateAlert}>
            Trigger Alert
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

