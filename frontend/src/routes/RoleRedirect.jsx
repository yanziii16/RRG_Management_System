import { Navigate } from "react-router-dom";
import { Loading } from "../components/common/Loading";
import { useAuth } from "../hooks/useAuth";
const RoleRedirect = () => {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return <Loading />;
  if (!isAuthenticated || !user) {
    return <Navigate to="/admin/login" replace />;
  }
  if (user.role === "ADMIN") {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/my-reservations" replace />;
};
export {
  RoleRedirect
};
