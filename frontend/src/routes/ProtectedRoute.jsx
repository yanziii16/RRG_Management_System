import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loading } from "../components/common/Loading";
import { useAuth } from "../hooks/useAuth";
const ProtectedRoute = ({
  allowedRoles,
  redirectTo
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();
  if (loading) {
    return <Loading message="Verifying session..." />;
  }
  if (!isAuthenticated || !user) {
    const loginPath = redirectTo || (allowedRoles.includes("ADMIN") && !allowedRoles.includes("GUEST") ? "/admin/login" : "/login");
    return <Navigate
      to={`${loginPath}?redirect=${encodeURIComponent(location.pathname + location.search)}`}
      replace
    />;
  }
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
};
export {
  ProtectedRoute
};
