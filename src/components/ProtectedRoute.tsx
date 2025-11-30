import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, Permission } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false, ANY permission is enough
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  requiredPermissions = [],
  requireAll = false,
  fallbackPath = '/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, hasAnyPermission, hasAllPermissions } = useAuth();
  const location = useLocation();

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check permissions if required
  if (requiredPermissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasAccess) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return <>{children}</>;
}

// Component to conditionally render based on permissions
interface PermissionGateProps {
  children: React.ReactNode;
  permissions: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  children,
  permissions,
  requireAll = false,
  fallback = null,
}: PermissionGateProps) {
  const { hasAnyPermission, hasAllPermissions, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <>{fallback}</>;

  const hasAccess = requireAll
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
