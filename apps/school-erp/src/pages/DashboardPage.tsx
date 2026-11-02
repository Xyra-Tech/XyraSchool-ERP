import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Alert,
  Button,
} from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

export const DashboardPage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [userCount, setUserCount] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const [profRes, usersRes] = await Promise.all([
          apiClient.get('/profile').catch(() => ({ data: { data: null } })),
          apiClient.get('/users?pageSize=1').catch(() => ({ data: { meta: { pagination: { totalRecords: 0 } } } })),
        ]);
        setProfile(profRes.data?.data);
        setUserCount(usersRes.data?.meta?.pagination?.totalRecords || 0);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    }
    loadData();
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          {profile?.name || 'School Operations Dashboard'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {profile?.motto ? `"${profile.motto}" • ` : ''}
          Affiliation: {profile?.boardAffiliation || 'CBSE'}
        </Typography>
      </Box>

      {/* Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    AUTHORIZED STAFF
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {userCount}
                  </Typography>
                </Box>
                <PeopleIcon sx={{ color: '#1e40af', fontSize: 36 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    ISOLATION BOUNDARY
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="#059669">
                    Dedicated DB
                  </Typography>
                </Box>
                <SecurityIcon sx={{ color: '#059669', fontSize: 36 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    SCHOOL STATUS
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    Active
                  </Typography>
                </Box>
                <SchoolIcon sx={{ color: '#0d9488', fontSize: 36 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Phase 1 Scope:</strong> Staff Identity, Roles & Permissions, and School Profile boundaries are live. Student admissions, attendance taking, timetable scheduling, and examinations will be unlocked in Phase 3.
      </Alert>

      {/* Quick Launchpad */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 1 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Staff Access & Account Control
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create role-based invitations for School Admins, Teachers, and Operational staff. Every staff member activates their own account securely.
              </Typography>
              <Button
                variant="contained"
                endIcon={<ArrowIcon />}
                onClick={() => navigate('/users')}
                sx={{ bgcolor: '#1e40af' }}
              >
                Manage Staff Directory
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 1 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Security Audit & Governance
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Review real-time immutable audit logs of logins, profile modifications, permission delegations, and security events.
              </Typography>
              <Button
                variant="outlined"
                endIcon={<ArrowIcon />}
                onClick={() => navigate('/audit-logs')}
              >
                Inspect Audit Logs
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
