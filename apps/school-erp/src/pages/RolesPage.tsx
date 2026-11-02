import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Typography,
  Alert,
} from '@mui/material';
import { VpnKey as KeyIcon } from '@mui/icons-material';
import { apiClient } from '../api/client';

export const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRoles() {
      try {
        const res = await apiClient.get('/roles');
        setRoles(res.data?.data || []);
      } catch (err) {
        console.error('Failed to load roles:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRoles();
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Role-Based Access Control (RBAC)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Permission matrix enforced by the School API backend
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Authoritative Authorization:</strong> Permissions are strictly verified on every backend API request. Hiding a frontend element is never used as a security boundary.
      </Alert>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {roles.map((role) => (
            <Grid item xs={12} md={6} key={role.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <KeyIcon sx={{ color: '#1e40af' }} />
                    <Typography variant="h6" fontWeight={700}>
                      {role.name}
                    </Typography>
                    <Chip label={role.code} size="small" sx={{ fontFamily: 'monospace' }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {role.description || 'System-defined role.'}
                  </Typography>

                  <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 1 }}>
                    GRANTED PERMISSIONS ({role.permissions?.length || 0})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {role.permissions?.map((p: string) => (
                      <Chip
                        key={p}
                        label={p}
                        size="small"
                        sx={{ fontSize: '0.75rem', fontFamily: 'monospace', bgcolor: '#f1f5f9' }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
