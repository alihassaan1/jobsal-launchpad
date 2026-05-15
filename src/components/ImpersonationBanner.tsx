import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogOut } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "jobsal_impersonation";

interface ImpersonationState {
  admin_access_token: string;
  admin_refresh_token: string;
  target_email: string;
  target_name?: string;
}

export function getImpersonationState(): ImpersonationState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setImpersonationState(state: ImpersonationState | null) {
  if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  else localStorage.removeItem(STORAGE_KEY);
}

export default function ImpersonationBanner() {
  const [state, setState] = useState<ImpersonationState | null>(null);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    setState(getImpersonationState());
    const onStorage = () => setState(getImpersonationState());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const exit = async () => {
    if (!state) return;
    setExiting(true);
    try {
      const { error } = await supabase.auth.setSession({
        access_token: state.admin_access_token,
        refresh_token: state.admin_refresh_token,
      });
      setImpersonationState(null);
      setState(null);
      if (error) {
        toast.error("Couldn't restore admin session — please sign in again.");
        await supabase.auth.signOut();
        window.location.href = "/auth";
        return;
      }
      toast.success("Returned to your admin account");
      window.location.href = "/admin/users";
    } finally {
      setExiting(false);
    }
  };

  if (!state) return null;

  return (
    <div className="sticky top-0 z-[100] bg-amber-500 text-amber-950 border-b border-amber-700 shadow-sm">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldAlert className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            <strong>Admin impersonation active</strong> — viewing as{" "}
            <strong>{state.target_name || state.target_email}</strong>
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="bg-white hover:bg-amber-50 border-amber-700 text-amber-950"
          onClick={exit}
          disabled={exiting}
        >
          <LogOut className="h-3.5 w-3.5 mr-1" />
          {exiting ? "Exiting…" : "Exit impersonation"}
        </Button>
      </div>
    </div>
  );
}
