// ==============================================================================
// XyraTech Control Center — Plans & Feature Entitlements Page
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, CheckCircle as CheckIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { apiClient } from '../api/client';

const ALL_MODULES = [
  'CORE_ERP',
  'ACADEMICS',
  'ATTENDANCE',
  'EXAMINATIONS',
  'FEES_FINANCE',
  'HR_PAYROLL',
  'PARENT_PORTAL',
  'MOBILE_APP',
  'LIBRARY',
  'TRANSPORT',
  'INVENTORY',
  'AI_ANALYTICS',
];

export const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Plan Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxStudents, setMaxStudents] = useState(1000);
  const [maxStaff, setMaxStaff] = useState(100);
  const [priceInCents, setPriceInCents] = useState(1000000);
  const [selectedModules, setSelectedModules] = useState<string[]>([
    'CORE_ERP',
    'ACADEMICS',
    'ATTENDANCE',
    'PARENT_PORTAL',
  ]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/plans');
      setPlans(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleToggleModule = (m: string) => {
    if (selectedModules.includes(m)) {
      setSelectedModules(selectedModules.filter((x) => x !== m));
    } else {
      setSelectedModules([...selectedModules, m]);
    }
  };

  const handleCreatePlan = async () => {
    try {
      await apiClient.post('/plans', {
        code,
        name,
        description,
        billingCycle: 'ANNUAL',
        maxStudents,
        maxStaff,
        maxAdmins: 10,
        storageLimitMb: 20480,
        parentPortal: selectedModules.includes('PARENT_PORTAL'),
        mobileAccess: selectedModules.includes('MOBILE_APP'),
        supportLevel: 'STANDARD',
        priceInCents,
        currency: 'INR',
        entitlements: selectedModules.map((m) => ({ featureCode: m, isEnabled: true })),
      });
      setDialogOpen(false);
      fetchPlans();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create plan');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Subscription Plans & Feature Entitlements
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure tiered school SaaS packages and modular feature entitlements enforced on the backend.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchPlans}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Create New Plan
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {plans.map((p) => (
            <Grid item xs={12} md={6} lg={3} key={p.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
                <CardHeader
                  title={
                    <Typography variant="h6" fontWeight={700}>
                      {p.name}
                    </Typography>
                  }
                  subheader={
                    <Chip
                      label={p.code}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 600, mt: 0.5 }}
                    />
                  }
                />
                <Divider />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h4" fontWeight={800} color="primary" sx={{ mb: 1 }}>
                    ₹{((p.priceInCents || 0) / 100).toLocaleString('en-IN')}
                    <Typography component="span" variant="body2" color="text.secondary">
                      {' '}
                      / {p.billingCycle.toLowerCase()}
                    </Typography>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {p.description || 'Enterprise school tier'}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Capacity Limits:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      Up to {p.maxStudents.toLocaleString()} Students
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      Up to {p.maxStaff.toLocaleString()} Staff Members
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {(p.storageLimitMb / 1024).toFixed(0)} GB Storage Quota
                    </Typography>
                  </Box>

                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1 }}>
                    Enabled Modules:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {p.entitlements?.map((e: any) => (
                      <Chip
                        key={e.id}
                        label={e.featureCode.replace(/_/g, ' ')}
                        size="small"
                        icon={<CheckIcon fontSize="small" />}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Plan Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Build Subscription Plan</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            required
            label="Plan Code (e.g. CAMPUS_PLUS)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            required
            label="Plan Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Students"
                value={maxStudents}
                onChange={(e) => setMaxStudents(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Staff"
                value={maxStaff}
                onChange={(e) => setMaxStaff(Number(e.target.value))}
              />
            </Grid>
          </Grid>
          <TextField
            fullWidth
            type="number"
            label="Annual Price (in Paise / Cents)"
            value={priceInCents}
            onChange={(e) => setPriceInCents(Number(e.target.value))}
            helperText={`Displayed as ₹${((priceInCents || 0) / 100).toLocaleString('en-IN')}`}
            sx={{ mb: 2 }}
          />

          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            Select Modular Entitlements:
          </Typography>
          <Grid container spacing={1}>
            {ALL_MODULES.map((m) => (
              <Grid item xs={6} key={m}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedModules.includes(m)}
                      onChange={() => handleToggleModule(m)}
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">{m.replace(/_/g, ' ')}</Typography>}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreatePlan}>
            Create Plan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

