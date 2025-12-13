import { useAppContext } from "../context/AppContext";
import { Navigate } from "react-router-dom";

export default function ProtectedAdminRoute({ children }) {
  const { isAdmin } = useAppContext();

  if (isAdmin === null) return <div>Loading...</div>;

  return isAdmin ? children : <Navigate to="/admin/login" replace />;
}
