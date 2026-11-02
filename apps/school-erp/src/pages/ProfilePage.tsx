import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Business as ProfileIcon } from '@mui/icons-material';
import { apiClient } from '../api/client';

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [boardAffiliation, setBoardAffiliation] = useState('');
  const [motto, setMotto] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await apiClient.get('/profile');
        const data = res.data?.data;
        if (data) {
          setProfile(data);
          setName(data.name || '');
          setBoardAffiliation(data.boardAffiliation || '');
          setMotto(data.motto || '');
          setPhone(data.phone || '');
          setAddress(data.address || '');
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const res = await apiClient.patch('/profile', {
        name,
        boardAffiliation,
        motto,
        phone,
        address,
      });
      setProfile(res.data?.data);
      setMsg('School profile updated successfully.');
    } catch (err: any) {
      setMsg('Error saving profile: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          School Profile & Identity
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure institutional metadata, board affiliation, and official contact channels
        </Typography>
      </Box>

      {msg && <Alert severity="info" sx={{ mb: 3 }} onClose={() => setMsg(null)}>{msg}</Alert>}

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <ProfileIcon sx={{ color: '#1e40af', fontSize: 32 }} />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {profile?.schoolCode || 'School Profile'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Official Email: {profile?.officialEmail || 'N/A'}
              </Typography>
            </Box>
          </Box>

          <form onSubmit={handleSave}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="School Legal Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Board Affiliation (CBSE, ICSE, Cambridge)"
                  value={boardAffiliation}
                  onChange={(e) => setBoardAffiliation(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Motto / Slogan"
                  value={motto}
                  onChange={(e) => setMotto(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Timezone"
                  value={profile?.timezone || 'Asia/Kolkata'}
                  disabled
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Campus Address"
                  multiline
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                  sx={{ bgcolor: '#1e40af' }}
                >
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};
