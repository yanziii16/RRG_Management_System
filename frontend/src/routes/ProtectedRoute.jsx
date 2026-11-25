import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loading } from "../components/common/Loading";
import { useAuth } from "../hooks/useAuth";

const normalize = (role) => String(role || "").toUpperCase();

const ProtectedRoute = ({ allowedRoles = [], redirectTo }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading message="Verifying session..." />;
  }

  const allowed = allowedRoles.map(normalize);

  if (!isAuthenticated || !user) {
    const loginPath =
      redirectTo ||
      (allowed.includes("ADMIN") && !allowed.includes("GUEST")
        ? "/admin/login"
        : "/login");

    return (
      <Navigate
        to={`${loginPath}?redirect=${encodeURIComponent(
          location.pathname + location.search
        )}`}
        replace
      />
    );
  }

  if (!allowed.includes(normalize(user.role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export { ProtectedRoute };