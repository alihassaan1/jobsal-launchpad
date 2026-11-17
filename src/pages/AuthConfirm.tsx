import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export default function AuthConfirm() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Confirming your account…");

  useEffect(() => {
    const tokenHash = searchParams.get("token_hash");
    if (!tokenHash) {
      setState("error");
      setMessage("This confirmation link is incomplete. Request a new account confirmation.");
      return;
    }

    supabase.auth.verifyOtp({ type: "signup", token_hash: tokenHash }).then(({ data, error }) => {
      if (error) {
        setState("error");
        setMessage("This confirmation link is invalid or has expired. Please register again or sign in.");
        return;
      }
      setState("success");
      setMessage("Your email is confirmed. Your account is ready to use.");
      const destination = data.user?.user_metadata?.account_type === "employer" ? "/dashboard" : "/";
      window.setTimeout(() => window.location.replace(destination), 900);
    });
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-2">
            {state === "loading" && <Loader2 className="h-10 w-10 animate-spin text-primary" />}
            {state === "success" && <CheckCircle2 className="h-10 w-10 text-primary" />}
            {state === "error" && <XCircle className="h-10 w-10 text-destructive" />}
          </div>
          <CardTitle>{state === "success" ? "Account confirmed" : state === "error" ? "Confirmation failed" : "One moment"}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        {state === "error" && (
          <CardContent>
            <Button asChild className="w-full"><Link to="/auth">Back to sign in</Link></Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
