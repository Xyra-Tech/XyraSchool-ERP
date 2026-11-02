import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PortalLayout } from './components/PortalLayout';
import { PortalHomePage } from './pages/PortalHomePage';

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<PortalLayout />}>
        <Route index element={<PortalHomePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
