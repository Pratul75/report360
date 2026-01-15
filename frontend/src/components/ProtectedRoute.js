import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';

/**
 * Protected Route Component
 * Blocks access to routes based on user permissions
 * 
 * Usage:
 * <Route path="/clients" element={
 *   <ProtectedRoute requiredPermission="client.read">
 *     <ClientsPage />
 *   </ProtectedRoute>
 * } />
 */
export const ProtectedRoute = ({ 
  children, 
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  redirectTo = '/login',
  fallback = null
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();
  const location = useLocation();
  const token = localStorage.getItem('token');

  // If loading permissions, show nothing (or a loader)
  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  // If not authenticated, redirect to login
  if (!token) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check single permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || <Navigate to="/403" replace />;
  }

  // Check multiple permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
    
    if (!hasAccess) {
      return fallback || <Navigate to="/403" replace />;
    }
  }

  // Permission granted, render children
  return children;
};

/**
 * Admin Only Route Component
 * Shorthand for routes that require admin access
 */
export const AdminRoute = ({ children, redirectTo = '/403' }) => {
  const { isAdmin, loading } = usePermissions();
  const token = localStorage.getItem('token');

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;
