// ==============================================================================
// XyraTech Control Center — Platform Analytics & Intelligence Page
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Divider,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Refresh as RefreshIcon, TrendingUp as GrowthIcon, SmartToy as AiIcon } from '@mui/icons-material';
import { apiClient } from '../api/client';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/analytics');
      setData(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatCurrency = (cents: number) => `₹${((cents || 0) / 100).toLocaleString('en-IN')}`;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Platform Analytics & Intelligence
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Aggregated business KPIs, multi-school module adoption, AI token economics, and support SLA telemetry.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchAnalytics}>
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading || !data ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Revenue & Growth */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Annual Recurring Revenue (ARR)
                </Typography>
                <Typography variant="h4" fontWeight={800} color="primary" sx={{ my: 1 }}>
                  {formatCurrency(data.business?.arrInCents)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Monthly Run Rate: <strong>{formatCurrency(data.business?.mrrInCents)}</strong>
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" fontWeight={600}>
                  Active Deployments: {data.business?.activeSchools} / {data.business?.totalSchools} Schools
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* AI Usage & Cost Economics */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AiIcon color="secondary" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Xyra AI Usage & Cost
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={800} color="secondary" sx={{ my: 1 }}>
                  {data.ai?.quotaUtilizationPercent}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tokens: {data.ai?.monthlyUsedTokens?.toLocaleString()} / {data.ai?.monthlyQuota?.toLocaleString()}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={data.ai?.quotaUtilizationPercent || 45}
                  color="secondary"
                  sx={{ my: 1.5, height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Estimated Monthly Provider Incurred Cost: ${((data.ai?.estimatedCostInCents || 0) / 100).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Support & Reliability */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Support SLA Compliance
                </Typography>
                <Typography variant="h4" fontWeight={800} color="success.main" sx={{ my: 1 }}>
                  {data.support?.slaCompliancePercent}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Resolved Tickets: {data.support?.resolvedTickets} / {data.support?.totalTickets}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" fontWeight={600}>
                  Customer Satisfaction (CSAT): {data.support?.avgCsat} / 5.0 ⭐
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Module Adoption */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                School Module Adoption Breakdown
              </Typography>
              {Object.entries(data.product?.moduleAdoption || {}).map(([mod, count]: any) => (
                <Box key={mod} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {mod.replace(/_/g, ' ')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {count} schools ({Math.round((count / (data.business?.totalSchools || 1)) * 100)}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.round((count / (data.business?.totalSchools || 1)) * 100)}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              ))}
            </Paper>
          </Grid>

          {/* AI Provider Distribution */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                AI Model Provider Dispatch Share
              </Typography>
              {data.ai?.providerDistribution?.map((prov: any) => (
                <Box key={prov.provider} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {prov.provider}
                    </Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {prov.percentage}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={prov.percentage}
                    color="secondary"
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              ))}
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">
                Provider-independent routing dispatches according to task latency, sensitivity, and school preference.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

