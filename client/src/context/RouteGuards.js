// src/components/RouteGuards.js - FIXED to redirect to home page
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext'

// Component for protecting routes that require authentication
export const ProtectedRoute = ({ children, allowedRoles = [], fallbackPath = '/login' }) => {
  const { isAuthenticated, isLoading, userRole } = useUser();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  // Pass current location so user can be redirected back after login
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role permissions if roles are specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">🚫</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Required role(s): {allowedRoles.join(', ')}
          </p>
          <button 
            onClick={() => window.history.back()}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // User is authenticated and has required role, render the protected content
  return children;
};

// Component for public routes (redirects authenticated users) - FIXED
export const PublicRoute = ({ children, redirectPath = null }) => {
  const { isAuthenticated, isLoading, userRole } = useUser();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated) {
    // Use provided redirect path or determine based on user role
    let redirectTo = redirectPath;
    
    if (!redirectTo) {
      // FIXED: Default redirect based on user role
      switch (userRole) {
        case 'admin':
          redirectTo = '/admin';
          break;
        case 'vendor':
          redirectTo = '/vendor/dashboard';
          break;
        case 'customer':
        default:
          redirectTo = '/';  // ← FIXED: Redirect to HOME PAGE, not dashboard
          break;
      }
    }
    
    console.log('PublicRoute: Redirecting authenticated user to:', redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  // User is not authenticated, render the public content (like login/register forms)
  return children;
};

// Higher-order component approach (alternative method) - ALSO FIXED
export const withRoleAccess = (WrappedComponent, allowedRoles = []) => {
  return function RoleProtectedComponent(props) {
    const { userRole, isAuthenticated, isLoading } = useUser();
    
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
};

// Custom hook for checking permissions in components
export const usePermissions = () => {
  const { userRole, isAuthenticated } = useUser();
  
  const hasRole = (role) => {
    return isAuthenticated && userRole === role;
  };
  
  const hasAnyRole = (roles) => {
    return isAuthenticated && roles.includes(userRole);
  };
  
  const canAccess = (allowedRoles = []) => {
    if (!isAuthenticated) return false;
    if (allowedRoles.length === 0) return true;
    return allowedRoles.includes(userRole);
  };
  
  return {
    hasRole,
    hasAnyRole,
    canAccess,
    isAuthenticated,
    userRole
  };
};

// Component for conditional rendering based on permissions
export const PermissionGate = ({ allowedRoles = [], children, fallback = null }) => {
  const { canAccess } = usePermissions();
  
  if (canAccess(allowedRoles)) {
    return children;
  }
  
  return fallback;
};

// Example usage of PermissionGate:
/*
<PermissionGate allowedRoles={['admin', 'vendor']}>
  <AdminOnlyButton />
</PermissionGate>

<PermissionGate 
  allowedRoles={['admin']} 
  fallback={<div>You need admin access</div>}
>
  <AdminPanel />
</PermissionGate>
*/