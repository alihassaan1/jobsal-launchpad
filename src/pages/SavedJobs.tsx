import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, Briefcase, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Helmet } from "react-helmet";

export default function SavedJobs() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  const { data: saved, isLoading } = useQuery({
    queryKey: ["saved-jobs", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("saved_jobs")
        .select("id, job_id, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = (rows ?? []).map((r) => r.job_id);
      if (ids.length === 0) return [];
      const { data: jobs } = await supabase
        .from("jobs_public")
        .select("id, title, slug, location, job_type, category, is_active, companies:companies_public(name, logo_url)")
        .in("id", ids);
      return (rows ?? []).map((r) => ({ ...r, job: jobs?.find((j: any) => j.id === r.job_id) }));
    },
  });

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const remove = async (id: string) => {
    const { error } = await supabase.from("saved_jobs").delete().eq("id", id);
    if (error) return toast.error("Failed to remove");
    toast.success("Removed");
    queryClient.invalidateQueries({ queryKey: ["saved-jobs", user.id] });
  };

  return (
    <>
      <Helmet><title>Saved Jobs | Jobs.al</title></Helmet>
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Bookmark className="h-7 w-7 text-primary" /> Saved Jobs
        </h1>
        <p className="text-muted-foreground mb-6">Jobs you've bookmarked for later.</p>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !saved || saved.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">No saved jobs yet</p>
              <p className="text-muted-foreground mb-4">Browse jobs and click "Save Job" to keep them here.</p>
              <Button asChild><Link to="/jobs">Browse Jobs</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {saved.map((s: any) => (
              <Card key={s.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  {s.job?.companies?.logo_url ? (
                    <img src={s.job.companies.logo_url} alt={s.job.companies.name} className="h-12 w-12 rounded object-contain bg-muted" />
                  ) : (
                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center"><Briefcase className="h-5 w-5 text-muted-foreground" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    {s.job ? (
                      <>
                        <Link to={`/jobs/${s.job.slug}`} className="font-semibold hover:text-primary block truncate">{s.job.title}</Link>
                        <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>{s.job.companies?.name}</span>
                          {s.job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.job.location}</span>}
                          <Badge variant="outline" className="text-xs">{s.job.job_type?.replace("_", " ")}</Badge>
                          {!s.job.is_active && <Badge variant="secondary" className="text-xs">Closed</Badge>}
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground italic">Job no longer available</p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(s.id)} aria-label="Remove">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
