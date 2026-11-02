import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SchoolsPage } from './pages/SchoolsPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DeploymentsPage } from './pages/DeploymentsPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { PlansPage } from './pages/PlansPage';
import { ReleasesPage } from './pages/ReleasesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SupportPage } from './pages/SupportPage';
import { CMSPage } from './pages/CMSPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { AlertsPage } from './pages/AlertsPage';
import { InternalUsersPage } from './pages/InternalUsersPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SecurityCenterPage } from './pages/SecurityCenterPage';
import { SettingsPage } from './pages/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('platform_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="schools" element={<SchoolsPage />} />
        <Route path="onboarding" element={<OnboardingPage />} />
        <Route path="deployments" element={<DeploymentsPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="releases" element={<ReleasesPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="cms" element={<CMSPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="internal-users" element={<InternalUsersPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="security" element={<SecurityCenterPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
