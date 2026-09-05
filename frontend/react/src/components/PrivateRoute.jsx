import { useAuth } from "../context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
