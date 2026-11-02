// ==============================================================================
// XyraTech Control Center — Announcements & Broadcasts Page
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
import { Add as AddIcon, Refresh as RefreshIcon, Campaign as CampaignIcon } from '@mui/icons-material';
import { apiClient } from '../api/client';

export const AnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('GENERAL');
  const [priority, setPriority] = useState('NORMAL');

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/announcements');
      setAnnouncements(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async () => {
    try {
      await apiClient.post('/announcements', {
        title,
        content,
        type,
        priority,
        channels: ['IN_APP'],
        targets: [{ targetType: 'ALL_SCHOOLS' }],
      });
      setDialogOpen(false);
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to publish announcement');
    }
  };

  const getTypeChip = (t: string) => {
    const map: Record<string, 'default' | 'error' | 'warning' | 'info' | 'primary'> = {
      MAINTENANCE: 'warning',
      SECURITY_ADVISORY: 'error',
      RELEASE_UPDATE: 'primary',
      BILLING_REMINDER: 'info',
      EMERGENCY_NOTICE: 'error',
      GENERAL: 'default',
    };
    return <Chip label={t.replace(/_/g, ' ')} size="small" color={map[t] || 'default'} />;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Announcements & Platform Broadcasts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Publish maintenance windows, security advisories, and system notices to school administrative dashboards.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchAnnouncements}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Broadcast Announcement
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
              <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Target Audience</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Published At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : announcements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  No published announcements found.
                </TableCell>
              </TableRow>
            ) : (
              announcements.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {a.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {a.content?.slice(0, 80)}...
                    </Typography>
                  </TableCell>
                  <TableCell>{getTypeChip(a.type)}</TableCell>
                  <TableCell>
                    <Chip
                      label={a.priority}
                      size="small"
                      color={a.priority === 'URGENT' ? 'error' : a.priority === 'HIGH' ? 'warning' : 'default'}
                    />
                  </TableCell>
                  <TableCell>All Registered Schools</TableCell>
                  <TableCell>{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Dispatch Platform Broadcast</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            required
            label="Announcement Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            select
            label="Announcement Category"
            value={type}
            onChange={(e) => setType(e.target.value)}
            sx={{ mb: 2 }}
          >
            <MenuItem value="GENERAL">General Notice</MenuItem>
            <MenuItem value="MAINTENANCE">Maintenance Window</MenuItem>
            <MenuItem value="RELEASE_UPDATE">Release Update</MenuItem>
            <MenuItem value="SECURITY_ADVISORY">Security Advisory</MenuItem>
            <MenuItem value="BILLING_REMINDER">Billing Reminder</MenuItem>
            <MenuItem value="EMERGENCY_NOTICE">Emergency Notice</MenuItem>
          </TextField>
          <TextField
            fullWidth
            select
            label="Priority Level"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            sx={{ mb: 2 }}
          >
            <MenuItem value="NORMAL">Normal</MenuItem>
            <MenuItem value="HIGH">High</MenuItem>
            <MenuItem value="URGENT">Urgent (Mandatory Popup)</MenuItem>
          </TextField>
          <TextField
            fullWidth
            multiline
            rows={4}
            required
            label="Announcement Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Details of the scheduled maintenance or policy update..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateAnnouncement}>
            Broadcast
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

