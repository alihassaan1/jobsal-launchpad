import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, MapPin, Clock, FileText, Eye } from "lucide-react";
import Navigation from "@/components/Navigation";

const CandidateDashboard = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  if (userRole !== "job_seeker") {
    navigate("/");
    return null;
  }

  const { data: applications, isLoading } = useQuery({
    queryKey: ["myApplications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          jobs (
            id,
            title,
            slug,
            location,
            job_type,
            is_active,
            companies (
              name,
              logo_url
            )
          )
        `)
        .eq("applicant_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      applied: "bg-blue-100 text-blue-800",
      viewed: "bg-purple-100 text-purple-800",
      shortlisted: "bg-yellow-100 text-yellow-800",
      interview: "bg-orange-100 text-orange-800",
      hired: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const filterByStatus = (status?: string) => {
    if (!applications) return [];
    if (!status) return applications;
    return applications.filter((app: any) => app.status === status);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Applications</h1>
          <p className="text-muted-foreground">Track and manage your job applications</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Applied</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{applications?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {filterByStatus("viewed").length + filterByStatus("shortlisted").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Interviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {filterByStatus("interview").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Offers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {filterByStatus("hired").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>All Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All ({applications?.length || 0})</TabsTrigger>
                <TabsTrigger value="applied">Applied ({filterByStatus("applied").length})</TabsTrigger>
                <TabsTrigger value="viewed">Viewed ({filterByStatus("viewed").length})</TabsTrigger>
                <TabsTrigger value="shortlisted">Shortlisted ({filterByStatus("shortlisted").length})</TabsTrigger>
                <TabsTrigger value="interview">Interview ({filterByStatus("interview").length})</TabsTrigger>
              </TabsList>

              {["all", "applied", "viewed", "shortlisted", "interview"].map((status) => (
                <TabsContent key={status} value={status} className="space-y-4">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                      ))}
                    </div>
                  ) : filterByStatus(status === "all" ? undefined : status).length > 0 ? (
                    filterByStatus(status === "all" ? undefined : status).map((application: any) => (
                      <Card key={application.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex gap-4 flex-1">
                              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                {application.jobs.companies?.logo_url ? (
                                  <img
                                    src={application.jobs.companies.logo_url}
                                    alt={application.jobs.companies?.name}
                                    className="w-12 h-12 object-contain"
                                  />
                                ) : (
                                  <Briefcase className="h-8 w-8 text-primary" />
                                )}
                              </div>
                              <div className="flex-1">
                                <CardTitle className="text-xl mb-2">{application.jobs.title}</CardTitle>
                                <CardDescription className="flex flex-wrap gap-4">
                                  <span className="flex items-center gap-1">
                                    <Briefcase className="h-4 w-4" />
                                    {application.jobs.companies?.name}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {application.jobs.location}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    Applied {new Date(application.created_at).toLocaleDateString()}
                                  </span>
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge className={getStatusColor(application.status)}>
                                {application.status}
                              </Badge>
                              {application.viewed_at && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  Viewed {new Date(application.viewed_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2">
                            <Link to={`/jobs/${application.jobs.slug}`}>
                              <Button variant="outline" size="sm">
                                View Job
                              </Button>
                            </Link>
                            {application.resume_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const { data } = supabase.storage
                                    .from("resumes")
                                    .getPublicUrl(application.resume_url);
                                  window.open(data.publicUrl, "_blank");
                                }}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                View Resume
                              </Button>
                            )}
                          </div>
                          {application.cover_letter && (
                            <div className="mt-4">
                              <p className="text-sm font-medium mb-2">Cover Letter:</p>
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {application.cover_letter}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No applications in this category</p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CandidateDashboard;
