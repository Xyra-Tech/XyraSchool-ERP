// ==============================================================================
// XyraTech Control Center — Support Center & Controlled Access Page
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
  FormControlLabel,
  Checkbox,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  SupportAgent as AgentIcon,
  VpnKey as AccessIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { apiClient } from '../api/client';

export const SupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail / Reply Dialog
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketDetails, setTicketDetails] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  // Controlled Support Access Dialog (Section 15)
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [accessPurpose, setAccessPurpose] = useState('');
  const [accessScope, setAccessScope] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/support/tickets');
      setTickets(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch support tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleOpenTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    setDetailLoading(true);
    try {
      const res = await apiClient.get(`/support/tickets/${ticket.id}`);
      setTicketDetails(res.data.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to load ticket details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePostReply = async () => {
    if (!selectedTicket || !replyContent.trim()) return;
    try {
      await apiClient.post(`/support/tickets/${selectedTicket.id}/reply`, {
        content: replyContent,
        isInternal: isInternalNote,
      });
      setReplyContent('');
      handleOpenTicket(selectedTicket);
      fetchTickets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send reply');
    }
  };

  const handleRequestAccessSubmit = async () => {
    if (!selectedTicket?.schoolId) return;
    try {
      await apiClient.post('/support/access/request', {
        schoolId: selectedTicket.schoolId,
        ticketId: selectedTicket.id,
        purpose: accessPurpose,
        scopeDescription: accessScope,
        accessLevel: 'READ_ONLY',
        durationMinutes,
      });
      setAccessDialogOpen(false);
      alert('Controlled support access request submitted for Principal/Security approval');
      handleOpenTicket(selectedTicket);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to request support access');
    }
  };

  const getPriorityChip = (p: string) => {
    const map: Record<string, 'default' | 'error' | 'warning' | 'info'> = {
      CRITICAL: 'error',
      HIGH: 'warning',
      MEDIUM: 'info',
      LOW: 'default',
    };
    return <Chip label={p} size="small" color={map[p] || 'default'} sx={{ fontWeight: 600 }} />;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Support Center & Controlled Tenant Access
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Multi-school ticket routing, SLA countdowns, and strictly audited temporary environment support access.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchTickets}>
          Refresh
        </Button>
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
              <TableCell sx={{ fontWeight: 600 }}>Ticket ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>School</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Assigned Agent</TableCell>
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
            ) : tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  No open support tickets found.
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {t.ticketNumber}
                  </TableCell>
                  <TableCell>
                    {t.school ? t.school.name : <Typography variant="caption" color="text.secondary">Platform</Typography>}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{t.subject}</TableCell>
                  <TableCell>
                    <Chip label={t.category.replace(/_/g, ' ')} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{getPriorityChip(t.priority)}</TableCell>
                  <TableCell>
                    <Chip
                      label={t.status.replace(/_/g, ' ')}
                      size="small"
                      color={t.status === 'RESOLVED' ? 'success' : t.status === 'IN_PROGRESS' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{t.assignedTo?.firstName || 'Unassigned'}</TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="contained" onClick={() => handleOpenTicket(t)}>
                      View & Reply
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Ticket Details & Conversation Dialog */}
      <Dialog open={Boolean(selectedTicket)} onClose={() => setSelectedTicket(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            {ticketDetails?.ticketNumber} — {ticketDetails?.subject}
            <Typography variant="body2" color="text.secondary">
              Requester: {ticketDetails?.requesterName} ({ticketDetails?.requesterEmail}) | School:{' '}
              {ticketDetails?.school?.name || 'General Inquiry'}
            </Typography>
          </Box>
          {ticketDetails?.schoolId && (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<AccessIcon />}
              onClick={() => setAccessDialogOpen(true)}
            >
              Request Controlled Access
            </Button>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f8fafc' }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Initial Problem Description:
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {ticketDetails?.description}
                </Typography>
              </Paper>

              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                Conversation History:
              </Typography>
              <Box sx={{ maxHeight: 260, overflowY: 'auto', mb: 2, pr: 1 }}>
                {ticketDetails?.messages?.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No replies yet. Post a response below.
                  </Typography>
                ) : (
                  ticketDetails?.messages?.map((msg: any) => (
                    <Paper
                      key={msg.id}
                      sx={{
                        p: 1.5,
                        mb: 1.5,
                        backgroundColor: msg.isInternal ? '#fef3c7' : msg.senderType === 'AGENT' ? '#eff6ff' : '#f1f5f9',
                        borderLeft: msg.isInternal ? '4px solid #f59e0b' : msg.senderType === 'AGENT' ? '4px solid #2563eb' : 'none',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {msg.senderName} ({msg.senderType}){' '}
                          {msg.isInternal && <Chip label="INTERNAL NOTE" size="small" color="warning" sx={{ height: 18 }} />}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2">{msg.content}</Typography>
                    </Paper>
                  ))
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Type Reply or Note"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write response to school staff or internal diagnostic note..."
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <FormControlLabel
                  control={<Checkbox checked={isInternalNote} onChange={(e) => setIsInternalNote(e.target.checked)} />}
                  label="Internal note only (invisible to school)"
                />
                <Button variant="contained" endIcon={<SendIcon />} onClick={handlePostReply}>
                  Send Response
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTicket(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Controlled Support Access Request Dialog */}
      <Dialog open={accessDialogOpen} onClose={() => setAccessDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Controlled Environment Support Access (Requirement Section 15)
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Support agents have zero unrestricted backdoor access. Submitting this request generates a time-bounded, least-privilege access token with full audit recording.
          </Alert>
          <TextField
            fullWidth
            required
            label="Specific Diagnostic Purpose"
            value={accessPurpose}
            onChange={(e) => setAccessPurpose(e.target.value)}
            placeholder="e.g. Inspect failed biometric sync timestamps"
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            required
            label="Scope Description"
            value={accessScope}
            onChange={(e) => setAccessScope(e.target.value)}
            placeholder="e.g. Read-only query on sync_logs table"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            select
            label="Requested Access Duration"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
          >
            <MenuItem value={30}>30 Minutes</MenuItem>
            <MenuItem value={60}>60 Minutes (Standard)</MenuItem>
            <MenuItem value={120}>2 Hours (Complex Issue)</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccessDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleRequestAccessSubmit}>
            Submit Access Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

