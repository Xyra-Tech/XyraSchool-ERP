import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  ButtonGroup,
  Container,
  CssBaseline,
  Toolbar,
  Typography,
  Chip,
} from '@mui/material';
import {
  FamilyRestroom as ParentIcon,
  School as StudentIcon,
} from '@mui/icons-material';
import { Outlet } from 'react-router-dom';

export const PortalLayout: React.FC = () => {
  const [activePersona, setActivePersona] = useState<'PARENT' | 'STUDENT'>('PARENT');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <CssBaseline />
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#ffffff', color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 0 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ bgcolor: '#e0f2fe', p: 1, borderRadius: 2, color: '#0284c7' }}>
                {activePersona === 'PARENT' ? <ParentIcon /> : <StudentIcon />}
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  XyraTech Portal
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Parent & Student Connected Services
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ButtonGroup size="small" variant="outlined">
                <Button
                  variant={activePersona === 'PARENT' ? 'contained' : 'outlined'}
                  onClick={() => setActivePersona('PARENT')}
                  sx={{ bgcolor: activePersona === 'PARENT' ? '#0284c7' : undefined }}
                >
                  Parent View
                </Button>
                <Button
                  variant={activePersona === 'STUDENT' ? 'contained' : 'outlined'}
                  onClick={() => setActivePersona('STUDENT')}
                  sx={{ bgcolor: activePersona === 'STUDENT' ? '#0284c7' : undefined }}
                >
                  Student View
                </Button>
              </ButtonGroup>

              <Chip
                label="Foundation Shell (Phase 1)"
                size="small"
                color="info"
                variant="outlined"
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              />
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Outlet context={{ activePersona }} />
      </Container>

      <Box component="footer" sx={{ py: 3, px: 2, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0', mt: 'auto', textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          XyraTech School ERP — Parent & Student Portal. Full module implementation is scheduled for Phase 5.
        </Typography>
      </Box>
    </Box>
  );
};
