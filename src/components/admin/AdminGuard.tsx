import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingState } from "./LoadingState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const AdminGuard = ({ children, allowedRoles = ["admin"] }: AdminGuardProps) => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      setChecking(false);
      if (!user) {
        navigate("/auth");
      } else if (userRole && !allowedRoles.includes(userRole)) {
        navigate("/");
      }
    }
  }, [user, userRole, loading, navigate, allowedRoles]);

  if (loading || checking) {
    return <LoadingState type="spinner" />;
  }

  if (!user) {
    return null;
  }

  if (userRole && !allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              <CardTitle>Access Denied</CardTitle>
            </div>
            <CardDescription>
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
