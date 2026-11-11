import { htmlToPlainText } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Briefcase, MapPin, Banknote, TrendingUp, RefreshCw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Navigation from "@/components/Navigation";

export default function RecommendedJobs() {
  const { user, userRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch recommendations
  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ["job-recommendations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_recommendations")
        .select(`
          *,
          jobs!inner(
            id,
            title,
            slug,
            description,
            category,
            location,
            salary_min,
            salary_max,
            is_remote,
            companies!inner(name, logo_url)
          )
        `)
        .eq("user_id", user?.id)
        .order("ai_match_score", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Generate new recommendations
  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("match-jobs");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-recommendations"] });
      toast({ title: "Recommendations updated!" });
    },
    onError: () => {
      toast({
        title: "Failed to generate recommendations",
        variant: "destructive",
      });
    },
  });

  // Track recommendation click
  const trackClick = async (jobId: string) => {
    await supabase.from("analytics").insert({
      event_type: "ai_recommendation_clicked",
      job_id: jobId,
      user_id: user?.id,
    });
  };

  if (authLoading || (!!user && !userRole)) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (userRole !== "job_seeker" && userRole !== "admin") {
    return <Navigate to="/" replace />;
  }


  const getMatchLevel = (score: number) => {
    if (score >= 0.85) return { label: "Excellent Match", color: "bg-green-500" };
    if (score >= 0.70) return { label: "Good Match", color: "bg-blue-500" };
    if (score >= 0.50) return { label: "Potential Match", color: "bg-yellow-500" };
    return { label: "Fair Match", color: "bg-gray-500" };
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-primary" />
                Recommended for You
              </h1>
              <p className="text-muted-foreground">
                AI-powered job matches based on your resume and profile
              </p>
            </div>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${generateMutation.isPending ? "animate-spin" : ""}`} />
              {generateMutation.isPending ? "Updating..." : "Update Matches"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Recommendations Yet</h3>
              <p className="text-muted-foreground mb-6">
                Complete your resume and profile to get personalized job recommendations
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/resume-builder">
                  <Button>Build Your Resume</Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                >
                  Generate Matches
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec: any) => {
              const job = rec.jobs;
              const company = job.companies;
              const matchLevel = getMatchLevel(rec.ai_match_score);
              const matchPercentage = Math.round(rec.ai_match_score * 100);

              return (
                <Card
                  key={rec.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => trackClick(job.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{job.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          {company.logo_url && (
                            <img
                              src={company.logo_url}
                              alt={company.name}
                              className="h-4 w-4 rounded"
                            />
                          )}
                          {company.name}
                        </CardDescription>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex flex-col items-center">
                              <div className={`w-16 h-16 rounded-full ${matchLevel.color} flex items-center justify-center text-white font-bold text-lg`}>
                                {matchPercentage}%
                              </div>
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {matchLevel.label}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="max-w-xs">
                              <p className="font-semibold mb-2">Why this match?</p>
                              {rec.matched_on?.reasons?.map((reason: string, i: number) => (
                                <p key={i} className="text-sm mb-1">
                                  • {reason}
                                </p>
                              )) || (
                                <p className="text-sm">
                                  {rec.matched_on?.skill_match_percentage && (
                                    <>Skills: {rec.matched_on.skill_match_percentage}% match</>
                                  )}
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                        {job.is_remote && " • Remote"}
                      </div>
                      {job.salary_min && (
                        <div className="flex items-center gap-1">
                          <Banknote className="h-3 w-3" />
                          ALL {job.salary_min.toLocaleString()}
                          {job.salary_max && ` - ${job.salary_max.toLocaleString()}`}
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {htmlToPlainText(job.description)}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{job.category}</Badge>
                      <Link to={`/jobs/${job.slug}`}>
                        <Button size="sm">View Details</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info Card */}
        {recommendations.length > 0 && (
          <Card className="mt-8 bg-primary/5">
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <TrendingUp className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">How AI Matching Works</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI analyzes your resume, skills, experience, and education to find jobs
                    that match your profile. The match percentage shows how well you fit each role.
                    Higher scores mean better alignment with the job requirements.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
