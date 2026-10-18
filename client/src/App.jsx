import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ComplaintListPage } from './features/complaints/ComplaintListPage';
import { ComplaintSubmitPage } from './features/complaints/ComplaintSubmitPage';
import { ComplaintDetailPage } from './features/complaints/ComplaintDetailPage';
import { GeospatialMapPage } from './features/map/GeospatialMapPage';
import { ClustersPage } from './features/clusters/ClustersPage';
import { AIGovernancePage } from './features/admin/AIGovernancePage';
import { AdminPage } from './features/admin/AdminPage';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { LoadingSpinner } from './components/common/LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner text="Authenticating user session..." size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Application Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="complaints" element={<ComplaintListPage />} />
              <Route path="complaints/new" element={<ComplaintSubmitPage />} />
              <Route path="complaints/:id" element={<ComplaintDetailPage />} />
              <Route path="map" element={<GeospatialMapPage />} />
              <Route path="clusters" element={<ClustersPage />} />
              <Route path="ai-governance" element={<AIGovernancePage />} />
              <Route
                path="admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;
