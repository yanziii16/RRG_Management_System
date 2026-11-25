import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // adjust this path/name to your project
import { Unauthorized } from "../pages/Unauthorized"; // adjust this path to your project

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, token } = useAuth();
  const location = useLocation();

  // Not logged in: go to the admin login page
  if (!user || !token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Compare roles ignoring uppercase/lowercase (backend sends "admin")
  const role = String(user.role || "").toLowerCase();
  const allowed = allowedRoles.map((r) => String(r).toLowerCase());

  if (allowed.length > 0 && !allowed.includes(role)) {
    return <Unauthorized />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;