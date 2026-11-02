import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Alert,
} from '@mui/material';
import {
  ChildCare as ChildIcon,
  FactCheck as AttendanceIcon,
  Payment as FeeIcon,
  MenuBook as HomeworkIcon,
  Notifications as NotificationIcon,
  Event as CalendarIcon,
} from '@mui/icons-material';
import { useOutletContext } from 'react-router-dom';

export const PortalHomePage: React.FC = () => {
  const { activePersona } = useOutletContext<{ activePersona: 'PARENT' | 'STUDENT' }>();

  const portalModules = [
    { title: 'Academic Progress & Grades', icon: <HomeworkIcon sx={{ color: '#0284c7' }} />, desc: 'Report cards, assignment feedback, and continuous evaluation.' },
    { title: 'Attendance Tracking', icon: <AttendanceIcon sx={{ color: '#10b981' }} />, desc: 'Daily attendance records, period-wise logs, and absence requests.' },
    { title: 'Fee Payments & Invoices', icon: <FeeIcon sx={{ color: '#f59e0b' }} />, desc: 'Quarterly tuition dues, Razorpay online payments, and download receipts.' },
    { title: 'Notices & School Broadcasts', icon: <NotificationIcon sx={{ color: '#8b5cf6' }} />, desc: 'Official circulars, holiday calendars, and urgent emergency alerts.' },
    { title: 'Timetable & Class Schedule', icon: <CalendarIcon sx={{ color: '#ec4899' }} />, desc: 'Daily period schedules, teacher substitutions, and exam dates.' },
    { title: 'Multi-Child Switcher', icon: <ChildIcon sx={{ color: '#06b6d4' }} />, desc: 'Single guardian login supporting multiple enrolled siblings.' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Welcome to the {activePersona === 'PARENT' ? 'Parent & Guardian Portal' : 'Student Learning Portal'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {activePersona === 'PARENT'
            ? 'Access your child’s academic records, fee invoices, attendance, and school communication.'
            : 'Access your coursework, daily timetable, homework submissions, and exam results.'}
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 4 }}>
        <strong>Phase 1 Technical Foundation:</strong> The responsive design system, session foundation, and school API contracts have been established. Direct Parent and Student authentication and live data synchronization will be unlocked in <strong>Phase 5 (Parent & Student Portal)</strong> and <strong>Phase 6 (Mobile App)</strong>.
      </Alert>

      <Grid container spacing={3}>
        {portalModules.map((mod) => (
          <Grid item xs={12} sm={6} md={4} key={mod.title}>
            <Card sx={{ height: '100%', opacity: 0.85 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ p: 1, bgcolor: '#f1f5f9', borderRadius: 2 }}>
                    {mod.icon}
                  </Box>
                  <Chip label="Phase 5" size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  {mod.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {mod.desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
