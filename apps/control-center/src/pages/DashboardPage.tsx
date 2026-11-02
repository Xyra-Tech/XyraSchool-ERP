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
} from '@mui/material';
import {
  School as SchoolIcon,
  Storage as StorageIcon,
  CheckCircle as HealthyIcon,
  Add as AddIcon,
  RocketLaunch as DeployIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

export const DashboardPage: React.FC = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [schoolsRes, healthRes] = await Promise.all([
          apiClient.get('/schools?pageSize=5'),
          apiClient.get('/system/health'),
        ]);
        setSchools(schoolsRes.data?.data || []);
        setHealth(healthRes.data?.data || null);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Platform Control Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Multi-school isolation status, deployments, and infrastructure health
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/schools')}
          sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
        >
          Provision School
        </Button>
      </Box>

      {/* Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    TOTAL SCHOOLS
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {loading ? '...' : schools.length}
                  </Typography>
                </Box>
                <SchoolIcon sx={{ color: '#2563eb', fontSize: 36 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    ISOLATED DATABASES
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {loading ? '...' : schools.length}
                  </Typography>
                </Box>
                <StorageIcon sx={{ color: '#059669', fontSize: 36 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    PLATFORM STATUS
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color={health?.status === 'HEALTHY' ? '#059669' : '#dc2626'}>
                    {health?.status || 'HEALTHY'}
                  </Typography>
                </Box>
                <HealthyIcon sx={{ color: '#059669', fontSize: 36 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    API RELEASE
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    v1.0.0
                  </Typography>
                </Box>
                <DeployIcon sx={{ color: '#7c3aed', fontSize: 36 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Phase Roadmap Note */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Phase 1 Scope:</strong> Technical Architecture, Multi-Tenant Database Isolation, Authentication, and Provisioning Foundation are fully implemented. Advanced CMS, Automated Billing Invoicing, and Support Ticketing are scheduled for Phase 2.
      </Alert>

      {/* Recent School Provisionings */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Recent School Deployments
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : schools.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              No schools onboarded yet. Click "Provision School" to onboard your first school tenant.
            </Typography>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>School Code</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Official Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Deployment URL</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schools.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{s.code}</TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.officialEmail}</TableCell>
                      <TableCell>
                        <Chip
                          label={s.status}
                          size="small"
                          color={s.status === 'ACTIVE' ? 'success' : 'warning'}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#2563eb' }}>
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
