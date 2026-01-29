import { Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

export default function StudentRoute({ children }) {
  const { isLoggedIn, userData } = useAppContext();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (userData?.role !== "student") {
    return <Navigate to="/" replace />;
  }

  return children;
}
