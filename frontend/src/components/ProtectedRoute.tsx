import { Navigate } from "@tanstack/react-router";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles: string[];
}) {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return <div className="p-6 text-sm">Checking authentication...</div>;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}