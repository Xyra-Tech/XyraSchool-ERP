// ==============================================================================
// XyraTech Control Center — Subscriptions & Invoices Page
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
  Tabs,
  Tab,
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
  Refresh as RefreshIcon,
  Upgrade as UpgradeIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { apiClient } from '../api/client';

export const SubscriptionsPage: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Change Plan Modal
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [changePlanDialogOpen, setChangePlanDialogOpen] = useState(false);
  const [newPlanId, setNewPlanId] = useState('');
  const [changeReason, setChangeReason] = useState('');

  // Manual Payment Modal
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'CHEQUE' | 'CASH' | 'MANUAL'>('BANK_TRANSFER');
  const [refNumber, setRefNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subRes, invRes, planRes] = await Promise.all([
        apiClient.get('/subscriptions'),
        apiClient.get('/billing/invoices'),
        apiClient.get('/plans'),
      ]);
      setSubscriptions(subRes.data.data || []);
      setInvoices(invRes.data.data || []);
      setPlans(planRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChangePlanSubmit = async () => {
    if (!selectedSub || !newPlanId) return;
    try {
      await apiClient.post(`/subscriptions/${selectedSub.id}/change-plan`, {
        newPlanId,
        reason: changeReason,
      });
      setChangePlanDialogOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to change plan');
    }
  };

  const handleRecordPaymentSubmit = async () => {
    if (!selectedInvoice) return;
    try {
      await apiClient.post('/billing/payments/manual', {
        invoiceId: selectedInvoice.id,
        amountInCents: selectedInvoice.totalInCents,
        method: paymentMethod,
        referenceNumber: refNumber,
        notes: paymentNotes,
      });
      setPaymentDialogOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const formatCurrency = (cents: number) => {
    return `₹${(cents / 100).toLocaleString('en-IN')}`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Subscriptions & Commercial Billing
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage school subscription contracts, Razorpay payment reconciliation, and manual bank transfer recordings.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData}>
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)} sx={{ mb: 3 }}>
        <Tab label={`Active Subscriptions (${subscriptions.length})`} />
        <Tab label={`Issued Invoices (${invoices.length})`} />
      </Tabs>

      {tabIndex === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>School</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Plan</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Billing Cycle</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Agreed Price</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Renewal Date</TableCell>
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
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No subscriptions found.
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {sub.school?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {sub.school?.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={sub.plan?.name} size="small" color="primary" />
                    </TableCell>
                    <TableCell>{sub.billingCycle || 'ANNUAL'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {formatCurrency(sub.agreedPriceInCents || sub.plan?.priceInCents || 0)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={sub.status}
                        size="small"
                        color={sub.status === 'ACTIVE' ? 'success' : sub.status === 'OVERDUE' ? 'error' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>{new Date(sub.endDate).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<UpgradeIcon />}
                        onClick={() => {
                          setSelectedSub(sub);
                          setNewPlanId(sub.planId);
                          setChangePlanDialogOpen(true);
                        }}
                      >
                        Change Plan
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tabIndex === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Invoice Number</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>School</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
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
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    No invoices generated yet.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id} hover>
                    <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell>{inv.subscription?.school?.name}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{formatCurrency(inv.totalInCents)}</TableCell>
                    <TableCell>{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={inv.status}
                        size="small"
                        color={inv.status === 'PAID' ? 'success' : inv.status === 'OVERDUE' ? 'error' : 'warning'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {inv.status !== 'PAID' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<PaymentIcon />}
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setPaymentDialogOpen(true);
                          }}
                        >
                          Record Payment
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Change Plan Dialog */}
      <Dialog open={changePlanDialogOpen} onClose={() => setChangePlanDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Modify Subscription Plan</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            School: <strong>{selectedSub?.school?.name}</strong> (Current: {selectedSub?.plan?.name})
          </Typography>
          <TextField
            fullWidth
            select
            label="Select New Plan"
            value={newPlanId}
            onChange={(e) => setNewPlanId(e.target.value)}
            sx={{ mb: 2 }}
          >
            {plans.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name} — {formatCurrency(p.priceInCents)} / {p.billingCycle.toLowerCase()} (Max {p.maxStudents} students)
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Reason for Modification"
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            placeholder="Contract renewal, campus expansion, etc."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePlanDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleChangePlanSubmit}>
            Confirm Plan Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Record Manual Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Record Manual Payment / Bank Transfer</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Invoice: <strong>{selectedInvoice?.invoiceNumber}</strong> (Amount:{' '}
            {formatCurrency(selectedInvoice?.totalInCents || 0)})
          </Typography>
          <TextField
            fullWidth
            select
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as any)}
            sx={{ mb: 2 }}
          >
            <MenuItem value="BANK_TRANSFER">Direct Bank Transfer (NEFT / RTGS / IMPS)</MenuItem>
            <MenuItem value="CHEQUE">Demand Draft / Cheque</MenuItem>
            <MenuItem value="CASH">Institutional Cash Deposit</MenuItem>
            <MenuItem value="MANUAL">Manual Adjustment</MenuItem>
          </TextField>
          <TextField
            fullWidth
            required
            label="Bank UTR / Transaction Reference Number"
            value={refNumber}
            onChange={(e) => setRefNumber(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Verification Notes"
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleRecordPaymentSubmit}>
            Verify & Mark Paid
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

