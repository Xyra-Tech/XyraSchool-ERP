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
  InputBase,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as OverviewIcon,
  School as SchoolIcon,
  HowToReg as OnboardingIcon,
  RocketLaunch as DeploymentsIcon,
  ReceiptLong as SubscriptionsIcon,
  Layers as PlansIcon,
  SystemUpdateAlt as ReleasesIcon,
  BarChart as AnalyticsIcon,
  SupportAgent as SupportIcon,
  Web as CMSIcon,
  Campaign as AnnouncementsIcon,
  NotificationsActive as AlertsIcon,
  PeopleAlt as UsersIcon,
  HistoryEdu as AuditIcon,
  Shield as SecurityIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  HelpOutline as HelpIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  ExitToApp as LogoutIcon,
  AdminPanelSettings as SuperAdminIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const drawerWidth = 270;

interface NavItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem('platform_user') || '{}');

  const navSections: NavSection[] = [
    {
      title: 'PLATFORM OPERATIONS',
      items: [
        { text: 'Overview', icon: <OverviewIcon fontSize="small" />, path: '/' },
        { text: 'Schools', icon: <SchoolIcon fontSize="small" />, path: '/schools' },
        { text: 'Onboarding', icon: <OnboardingIcon fontSize="small" />, path: '/onboarding', badge: 'Active' },
        { text: 'Deployments', icon: <DeploymentsIcon fontSize="small" />, path: '/deployments' },
      ],
    },
    {
      title: 'BILLING & PLANS',
      items: [
        { text: 'Subscriptions & Billing', icon: <SubscriptionsIcon fontSize="small" />, path: '/subscriptions' },
        { text: 'Plans & Entitlements', icon: <PlansIcon fontSize="small" />, path: '/plans' },
      ],
    },
    {
      title: 'RELEASES & INSIGHTS',
      items: [
        { text: 'Releases & Updates', icon: <ReleasesIcon fontSize="small" />, path: '/releases' },
        { text: 'Platform Analytics', icon: <AnalyticsIcon fontSize="small" />, path: '/analytics' },
        { text: 'Support Center', icon: <SupportIcon fontSize="small" />, path: '/support' },
      ],
    },
    {
      title: 'COMMUNICATIONS & CMS',
      items: [
        { text: 'CMS & Website', icon: <CMSIcon fontSize="small" />, path: '/cms' },
        { text: 'Announcements', icon: <AnnouncementsIcon fontSize="small" />, path: '/announcements' },
        { text: 'Notifications & Alerts', icon: <AlertsIcon fontSize="small" />, path: '/alerts', badge: 'Live' },
      ],
    },
    {
      title: 'GOVERNANCE & ADMIN',
      items: [
        { text: 'Internal Users & Roles', icon: <UsersIcon fontSize="small" />, path: '/internal-users' },
        { text: 'Audit Logs', icon: <AuditIcon fontSize="small" />, path: '/audit-logs' },
        { text: 'Security Center', icon: <SecurityIcon fontSize="small" />, path: '/security' },
        { text: 'Platform Settings', icon: <SettingsIcon fontSize="small" />, path: '/settings' },
      ],
    },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('platform_token');
    localStorage.removeItem('platform_user');
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/schools?q=${encodeURIComponent(searchQuery)}`);
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#ffffff' }}>
      <Toolbar sx={{ px: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #f1f5f9' }}>
        <SuperAdminIcon sx={{ color: '#2563eb', fontSize: 30 }} />
        <Box>
          <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: '0.04em', lineHeight: 1.1 }}>
            XYRATECH
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600 }}>
            Control Center v2.0
          </Typography>
        </Box>
      </Toolbar>

      <Box sx={{ px: 2, py: 1.5 }}>
        <Chip
          label="Super Admin Plane"
          size="small"
          color="primary"
          sx={{ width: '100%', fontWeight: 700, fontSize: '0.7rem', height: 24, letterSpacing: '0.05em' }}
        />
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5, pb: 2 }}>
        {navSections.map((section, sIdx) => (
          <Box key={section.title} sx={{ mt: sIdx > 0 ? 2 : 0.5, mb: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                px: 1.5,
                py: 0.5,
                display: 'block',
                color: '#94a3b8',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
              }}
            >
              {section.title}
            </Typography>
            <List dense disablePadding>
              {section.items.map((item) => {
                const selected = location.pathname === item.path;
                return (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.3 }}>
                    <ListItemButton
                      selected={selected}
                      onClick={() => {
                        navigate(item.path);
                        setMobileOpen(false);
                      }}
                      sx={{
                        borderRadius: 1.5,
                        py: 0.65,
                        px: 1.5,
                        '&.Mui-selected': {
                          backgroundColor: '#eff6ff',
                          color: '#1d4ed8',
                          fontWeight: 700,
                          '& .MuiListItemIcon-root': {
                            color: '#2563eb',
                          },
                        },
                        '&:hover': {
                          backgroundColor: '#f8fafc',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 32, color: selected ? '#2563eb' : '#64748b' }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: '0.84rem',
                          fontWeight: selected ? 700 : 500,
                        }}
                      />
                      {item.badge && (
                        <Chip
                          label={item.badge}
                          size="small"
                          color={item.badge === 'Live' ? 'error' : 'secondary'}
                          sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, ml: 1 }}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
    </Box>
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
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64, px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 1, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            {/* Global Search */}
            <Box
              component="form"
              onSubmit={handleSearchSubmit}
              sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: '#f1f5f9',
                borderRadius: 2,
                px: 1.5,
                py: 0.4,
                width: { xs: 180, sm: 320, md: 400 },
                border: '1px solid #e2e8f0',
              }}
            >
              <SearchIcon sx={{ color: '#94a3b8', fontSize: 20, mr: 1 }} />
              <InputBase
                placeholder="Search schools, deployments, tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ fontSize: '0.85rem', width: '100%' }}
              />
            </Box>
          </Box>

          {/* Top Navigation Shortcuts & Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title="Support Center">
              <IconButton onClick={() => navigate('/support')} size="small" sx={{ color: '#64748b' }}>
                <HelpIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Notifications & Alerts">
              <IconButton onClick={() => navigate('/alerts')} size="small" sx={{ color: '#64748b' }}>
                <Badge badgeContent={3} color="error" variant="dot">
                  <AlertsIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton onClick={() => setIsDarkMode(!isDarkMode)} size="small" sx={{ color: '#64748b' }}>
                {isDarkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 24, my: 'auto' }} />

            <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
              <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                {user.firstName || 'Platform'} {user.lastName || 'Admin'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {user.role || 'SUPER_ADMIN'}
              </Typography>
            </Box>

            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" sx={{ p: 0.5 }}>
              <Avatar sx={{ bgcolor: '#1e293b', width: 34, height: 34, fontSize: '0.85rem', fontWeight: 700 }}>
                {user.firstName?.[0] || 'A'}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{ sx: { minWidth: 200, mt: 1, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' } }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {user.firstName || 'Platform'} {user.lastName || 'Admin'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.email || 'superadmin@xyratech.internal'}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { setAnchorEl(null); navigate('/security'); }}>
                <SecurityIcon sx={{ mr: 1.5, fontSize: 18, color: '#64748b' }} /> Security Center
              </MenuItem>
              <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings'); }}>
                <SettingsIcon sx={{ mr: 1.5, fontSize: 18, color: '#64748b' }} /> Platform Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <LogoutIcon sx={{ mr: 1.5, fontSize: 18 }} /> Sign Out
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="navigation folders"
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
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid #e2e8f0',
            },
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
          p: { xs: 2, md: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          maxWidth: '100%',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};
