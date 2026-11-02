import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  VpnKey as RolesIcon,
  Business as SchoolProfileIcon,
  HistoryEdu as AuditIcon,
  ExitToApp as LogoutIcon,
  School as SchoolIcon,
  EventNote as TimetableIcon,
  FactCheck as AttendanceIcon,
  Grade as ExamIcon,
  AccountBalance as FinanceIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const drawerWidth = 260;

export const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem('school_user') || '{}');

  const activeMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Staff & Accounts', icon: <PeopleIcon />, path: '/users' },
    { text: 'Roles & Permissions', icon: <RolesIcon />, path: '/roles' },
    { text: 'School Profile', icon: <SchoolProfileIcon />, path: '/profile' },
    { text: 'Audit Trail', icon: <AuditIcon />, path: '/audit-logs' },
  ];

  const futureModules = [
    { text: 'Attendance', icon: <AttendanceIcon />, phase: 'Phase 3' },
    { text: 'Timetable', icon: <TimetableIcon />, phase: 'Phase 3' },
    { text: 'Examinations', icon: <ExamIcon />, phase: 'Phase 3' },
    { text: 'Fees & Finance', icon: <FinanceIcon />, phase: 'Phase 4' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('school_token');
    localStorage.removeItem('school_user');
    navigate('/login');
  };

  const drawer = (
    <div>
      <Toolbar sx={{ px: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <SchoolIcon sx={{ color: '#1e40af', fontSize: 32 }} />
        <Box>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
            XYRATECH ERP
          </Typography>
          <Typography variant="caption" color="text.secondary">
            School Business Plane
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Chip
          label={`Role: ${user.userType || 'STAFF'}`}
          size="small"
          color="primary"
          sx={{ width: '100%', fontWeight: 600, fontSize: '0.75rem' }}
        />
      </Box>

      <Typography variant="caption" sx={{ px: 2, py: 1, fontWeight: 700, color: 'text.secondary' }}>
        CORE ADMINISTRATION
      </Typography>
      <List sx={{ px: 1 }}>
        {activeMenuItems.map((item) => {
          const selected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={selected}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    fontWeight: 600,
                    '& .MuiListItemIcon-root': {
                      color: '#1e40af',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: selected ? '#1e40af' : '#64748b' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem' }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ my: 1 }} />
      <Typography variant="caption" sx={{ px: 2, py: 1, fontWeight: 700, color: 'text.secondary' }}>
        UPCOMING WORKSTREAMS
      </Typography>
      <List sx={{ px: 1 }}>
        {futureModules.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5, opacity: 0.65 }}>
            <ListItemButton disabled sx={{ borderRadius: 2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{ fontSize: '0.85rem' }}
              />
              <Chip label={item.phase} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: '#ffffff',
          color: '#0f172a',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
            School Operational Portal
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
              <Typography variant="body2" fontWeight={600}>
                {user.firstName || 'Principal'} {user.lastName || ''}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user.email || 'principal@school.edu'}
              </Typography>
            </Box>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
              <Avatar sx={{ bgcolor: '#1e40af', width: 36, height: 36, fontSize: '0.9rem' }}>
                {user.firstName?.[0] || 'P'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <LogoutIcon sx={{ mr: 1, fontSize: 20 }} /> Sign Out
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid #e2e8f0' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};
