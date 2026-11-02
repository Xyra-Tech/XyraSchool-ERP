// ==============================================================================
// XyraTech Control Center — CMS & Website Management Page
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
import { Add as AddIcon, Refresh as RefreshIcon, Public as PublishIcon } from '@mui/icons-material';
import { apiClient } from '../api/client';

export const CMSPage: React.FC = () => {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [pageType, setPageType] = useState('PAGE');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/cms/pages');
      setPages(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch CMS pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleCreatePage = async () => {
    try {
      await apiClient.post('/cms/pages', {
        slug,
        title,
        pageType,
        metaTitle,
        metaDescription,
        status: 'DRAFT',
      });
      setDialogOpen(false);
      fetchPages();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create page');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await apiClient.post(`/cms/pages/${id}/publish`);
      fetchPages();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to publish page');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            CMS & Public Website Content
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage public product landing pages, institutional case studies, release blogs, and help articles.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchPages}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            New Web Page
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
              <TableCell sx={{ fontWeight: 600 }}>Page Title</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>URL Slug</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Last Updated</TableCell>
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
            ) : pages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  No published CMS pages found.
                </TableCell>
              </TableRow>
            ) : (
              pages.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{p.title}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>/{p.slug}</TableCell>
                  <TableCell>
                    <Chip label={p.pageType} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={p.status}
                      size="small"
                      color={p.status === 'PUBLISHED' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{new Date(p.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    {p.status !== 'PUBLISHED' && (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<PublishIcon />}
                        onClick={() => handlePublish(p.id)}
                      >
                        Publish
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create New Website Page</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            required
            label="Page Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            required
            label="URL Slug (e.g. features-attendance)"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            select
            label="Page Type"
            value={pageType}
            onChange={(e) => setPageType(e.target.value)}
            sx={{ mb: 2 }}
          >
            <MenuItem value="PAGE">Standard Product Page</MenuItem>
            <MenuItem value="BLOG">Release Blog Post</MenuItem>
            <MenuItem value="FAQ">FAQ Document</MenuItem>
            <MenuItem value="HELP">Help & Knowledge Base</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="SEO Meta Title"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label="SEO Meta Description"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreatePage}>
            Save Page
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

