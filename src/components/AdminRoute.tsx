import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "./ProtectedRoute";
import PasswordVerification from "./PasswordVerification";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user } = useAuth();
  const [isVerified, setIsVerified] = useState(false);

  return (
    <ProtectedRoute>
      {user && !isVerified ? (
        <PasswordVerification 
          onSuccess={() => setIsVerified(true)}
          title="Admin Access Required"
          description="Enter your password to access this admin page"
        />
      ) : (
        children
      )}
    </ProtectedRoute>
  );
};

export default AdminRoute;