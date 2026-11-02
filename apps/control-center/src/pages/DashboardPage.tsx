import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
} from '@mui/material';
import {
  School as SchoolIcon,
  Storage as StorageIcon,
  CheckCircle as HealthyIcon,
  Warning as WarningIcon,
  ErrorOutline as ErrorIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  AttachMoney as MoneyIcon,
  SupportAgent as SupportIcon,
  Download as ExportIcon,
  Layers as ModuleIcon,
  AutoGraph as TrendingIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [recentSchools, setRecentSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [metricsRes, schoolsRes] = await Promise.all([
        apiClient.get('/dashboard/overview'),
        apiClient.get('/schools?pageSize=5'),
      ]);
      setMetrics(metricsRes.data?.data || null);
      setRecentSchools(schoolsRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load platform dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const handleExportSummary = () => {
    const summaryData = {
      exportTimestamp: new Date().toISOString(),
      dateRange,
      metrics,
      recentDeployments: recentSchools,
    };
    const blob = new Blob([JSON.stringify(summaryData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `xyratech-platform-metrics-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      {/* Top Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Platform Control Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Unified SaaS ecosystem monitoring, isolated multi-school deployments, and financial performance
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TextField
            select
            size="small"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            sx={{ minWidth: 140, bgcolor: '#ffffff' }}
          >
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
            <MenuItem value="90d">Last 90 Days</MenuItem>
            <MenuItem value="ytd">Year to Date</MenuItem>
          </TextField>

          <Tooltip title="Export Operational Report">
            <Button
              variant="outlined"
              size="small"
              startIcon={<ExportIcon />}
              onClick={handleExportSummary}
              sx={{ bgcolor: '#ffffff' }}
            >
              Export
            </Button>
          </Tooltip>

          <IconButton onClick={fetchDashboardData} disabled={loading} size="small" sx={{ bgcolor: '#ffffff', p: 1 }}>
            <RefreshIcon fontSize="small" />
          </IconButton>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/onboarding')}
            sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
          >
            Onboard School
          </Button>
        </Box>
      </Box>

      {/* Critical Status Alerts if any */}
      {metrics?.alerts?.criticalUnresolved > 0 && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/alerts')}>
              Investigate
            </Button>
          }
        >
          <strong>{metrics.alerts.criticalUnresolved} Critical System Alert(s) Active!</strong> Platform engineers required to review immediate infrastructure signals.
        </Alert>
      )}

      {/* Top 4 Primary KPI Summary Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Total Active Schools */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #2563eb' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    TOTAL SCHOOL TENANTS
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                    {loading ? <CircularProgress size={24} /> : metrics?.schools?.total ?? 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#059669', display: 'flex', alignItems: 'center', mt: 0.5, fontWeight: 600 }}>
                    <TrendingIcon sx={{ fontSize: 14, mr: 0.5 }} />
                    {metrics?.schools?.active ?? 0} Active Live Deployments
                  </Typography>
                </Box>
                <SchoolIcon sx={{ color: '#2563eb', fontSize: 38 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Recurring Revenue */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #059669' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    MONTHLY RECURRING (MRR)
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : (
                      `₹${(((metrics?.subscriptions?.mrrInCents ?? 0) / 100) / 1000).toFixed(1)}k`
                    )}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#059669', display: 'flex', alignItems: 'center', mt: 0.5, fontWeight: 600 }}>
                    ARR: ₹{(((metrics?.subscriptions?.arrInCents ?? 0) / 100) / 100000).toFixed(2)} Lakh
                  </Typography>
                </Box>
                <MoneyIcon sx={{ color: '#059669', fontSize: 38 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Deployment Health */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #7c3aed' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    DEPLOYMENT HEALTH
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : metrics?.deployments?.unhealthy === 0 ? (
                      '100%'
                    ) : (
                      `${metrics?.deployments?.healthy ?? 0} / ${
                        (metrics?.deployments?.healthy ?? 0) + (metrics?.deployments?.unhealthy ?? 0)
                      }`
                    )}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#7c3aed', display: 'flex', alignItems: 'center', mt: 0.5, fontWeight: 600 }}>
                    Release {metrics?.deployments?.currentDefaultVersion ?? 'v1.0.0'}
                  </Typography>
                </Box>
                <HealthyIcon sx={{ color: '#7c3aed', fontSize: 38 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Open Support Tickets */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #ea580c' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    OPEN SUPPORT TICKETS
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                    {loading ? <CircularProgress size={24} /> : metrics?.support?.openTickets ?? 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#ea580c', display: 'flex', alignItems: 'center', mt: 0.5, fontWeight: 600 }}>
                    {metrics?.support?.criticalTickets ?? 0} Critical • SLA {metrics?.support?.overdueSla ?? 0} Overdue
                  </Typography>
                </Box>
                <SupportIcon sx={{ color: '#ea580c', fontSize: 38 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Operational Metrics Breakdown Grids */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* School Status Breakdown */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  School Ecosystem Lifecycle
                </Typography>
                <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/schools')}>
                  View Schools
                </Button>
              </Box>
              <Grid container spacing={1.5}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={800} color="#166534">
                      {metrics?.schools?.active ?? 0}
                    </Typography>
                    <Typography variant="caption" fontWeight={600} color="#166534">
                      Active
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 1.5, bgcolor: '#fefce8', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={800} color="#854d0e">
                      {metrics?.schools?.pendingOnboarding ?? 0}
                    </Typography>
                    <Typography variant="caption" fontWeight={600} color="#854d0e">
                      Pending
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 1.5, bgcolor: '#fef2f2', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={800} color="#991b1b">
                      {metrics?.schools?.suspended ?? 0}
                    </Typography>
                    <Typography variant="caption" fontWeight={600} color="#991b1b">
                      Suspended
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={800} color="#475569">
                      {metrics?.schools?.cancelled ?? 0}
                    </Typography>
                    <Typography variant="caption" fontWeight={600} color="#475569">
                      Cancelled
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Subscription & Entitlements Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Subscription & Billing Health
                </Typography>
                <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/subscriptions')}>
                  Manage Billing
                </Button>
              </Box>
              <Grid container spacing={1.5}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 1.5, bgcolor: '#eff6ff', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={800} color="#1e40af">
                      {metrics?.subscriptions?.active ?? 0}
                    </Typography>
                    <Typography variant="caption" fontWeight={600} color="#1e40af">
                      Active Subs
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 1.5, bgcolor: '#fffbeb', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={800} color="#b45309">
                      {metrics?.subscriptions?.expiringSoon ?? 0}
                    </Typography>
                    <Typography variant="caption" fontWeight={600} color="#b45309">
                      Expiring &lt;30d
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 1.5, bgcolor: '#fef2f2', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={800} color="#dc2626">
                      {metrics?.subscriptions?.overdue ?? 0}
                    </Typography>
                    <Typography variant="caption" fontWeight={600} color="#dc2626">
                      Overdue Invoices
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 1.5, bgcolor: '#faf5ff', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={800} color="#6b21a8">
                      {metrics?.support?.avgResolutionHours ?? 4.2}h
                    </Typography>
                    <Typography variant="caption" fontWeight={600} color="#6b21a8">
                      Avg MTTR
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent School Provisionings Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Live School Deployments & Tenant Status
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Each school executes in a dedicated database and storage silo
              </Typography>
            </Box>
            <Button size="small" variant="text" onClick={() => navigate('/schools')}>
              View All Schools ({metrics?.schools?.total ?? recentSchools.length})
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : recentSchools.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No school deployments provisioned yet.
            </Typography>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>School Code</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Institution Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Official Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Version</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Deployment URL</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentSchools.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{s.code}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{s.officialEmail}</TableCell>
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
                          label={s.deployments?.[0]?.releaseVersion || 'v1.0.0'}
                          size="small"
                          variant="outlined"
                          sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#2563eb', fontWeight: 500, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {s.deployments?.[0]?.deploymentUrl || 'Pending'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
