import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams, Link, Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, ArrowLeft, FileText, Mail, Phone, MapPin, Calendar, Download, Sparkles, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import ApplicationDocuments from "@/components/documents/ApplicationDocuments";
import { applicationsToCsv, downloadCsv } from "@/lib/applicationsCsv";
import { getStoragePath } from "@/lib/storage";

const ATSJobApplications = () => {
  const { jobId } = useParams();
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [rankedCandidates, setRankedCandidates] = useState<any[]>([]);


  // Fetch job details
  const { data: job } = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          companies (name)
        `)
        .eq("id", jobId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch applications for this job with resumes
  const { data: applications, isLoading } = useQuery({
    queryKey: ["jobApplications", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          profiles (
            full_name,
            email,
            phone,
            location
          )
        `)
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch resumes for each applicant
      const applicationsWithResumes = await Promise.all(
        (data || []).map(async (app: any) => {
          const { data: resumes } = await supabase
            .from("resumes")
            .select("*")
            .eq("user_id", app.applicant_id)
            .eq("is_active", true)
            .order("updated_at", { ascending: false });
          
          return {
            ...app,
            resumes: resumes || []
          };
        })
      );

      // Attached document counts (bulk)
      const ids = applicationsWithResumes.map((a: any) => a.id);
      const counts: Record<string, number> = {};
      if (ids.length) {
        const { data: links } = await supabase
          .from("application_documents")
          .select("application_id")
          .in("application_id", ids);
        (links || []).forEach((l: any) => {
          counts[l.application_id] = (counts[l.application_id] || 0) + 1;
        });
      }

      return applicationsWithResumes.map((a: any) => ({ ...a, documents_count: counts[a.id] || 0 }));
    },
  });

  // Generate AI candidate ranking
  const rankCandidatesMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("match-candidates", {
        body: { job_id: jobId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setRankedCandidates(data.ranked_candidates || []);
      toast({
        title: "AI Ranking Complete",
        description: `Found ${data.excellent_fits} excellent fits and ${data.good_fits} good fits`,
      });
    },
    onError: () => {
      toast({
        title: "Failed to rank candidates",
        variant: "destructive",
      });
    },
  });

  // Update application status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status, notes }: { applicationId: string; status: string; notes?: string }) => {
      const updateData: any = { status };
      if (notes !== undefined) updateData.notes = notes;

      const { error } = await supabase
        .from("applications")
        .update(updateData)
        .eq("id", applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobApplications"] });
      toast({ title: "Application updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating application",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (authLoading || (!!user && !userRole)) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/auth" replace />;
  if (userRole !== "employer" && userRole !== "admin") return <Navigate to="/" replace />;

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
    let filtered = applications;

    if (status && status !== "all") {
      filtered = filtered.filter((app: any) => app.status === status);
    }

    if (searchTerm) {
      filtered = filtered.filter((app: any) =>
        app.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const downloadResume = async (resumeUrl: string) => {
    const { data, error } = await supabase.storage.from("resumes").download(resumeUrl);
    if (error) {
      toast({ title: "Error downloading resume", description: error.message, variant: "destructive" });
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = resumeUrl.split("/").pop() || "resume.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Job Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">{job?.title}</CardTitle>
                <CardDescription className="text-base">{job?.companies?.name}</CardDescription>
              </div>
              <Link to={`/jobs/${job?.slug}`}>
                <Button variant="outline">View Job Posting</Button>
              </Link>
            </div>
          </CardHeader>
        </Card>

        {/* Stats */}
        <div className="grid md:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications?.length || 0}</div>
            </CardContent>
          </Card>
          {["applied", "viewed", "shortlisted", "interview", "hired"].map((status) => (
            <Card key={status}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground capitalize">
                  {status}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {applications?.filter((a: any) => a.status === status).length || 0}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Applications List with Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all">All Applications</TabsTrigger>
              <TabsTrigger value="best-fit" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Best Fit (AI)
              </TabsTrigger>
            </TabsList>
            {rankedCandidates.length === 0 && (
              <Button
                onClick={() => rankCandidatesMutation.mutate()}
                disabled={rankCandidatesMutation.isPending || !applications || applications.length === 0}
                variant="outline"
              >
                <TrendingUp className={`h-4 w-4 mr-2 ${rankCandidatesMutation.isPending ? "animate-pulse" : ""}`} />
                {rankCandidatesMutation.isPending ? "Analyzing..." : "Generate AI Ranking"}
              </Button>
            )}
          </div>

          <TabsContent value="all" className="mt-0">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* List View */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="applied">Applied</TabsTrigger>
                    <TabsTrigger value="shortlisted">Shortlisted</TabsTrigger>
                    <TabsTrigger value="interview">Interview</TabsTrigger>
                    <TabsTrigger value="hired">Hired</TabsTrigger>
                  </TabsList>

                  {["all", "applied", "shortlisted", "interview", "hired"].map((status) => (
                    <TabsContent key={status} value={status} className="space-y-4">
                      {isLoading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                          ))}
                        </div>
                      ) : filterByStatus(status === "all" ? undefined : status).length > 0 ? (
                        filterByStatus(status === "all" ? undefined : status).map((application: any) => (
                          <Card
                            key={application.id}
                            className={`cursor-pointer transition-all ${
                              selectedApplication?.id === application.id ? "ring-2 ring-primary" : "hover:shadow-md"
                            }`}
                            onClick={() => setSelectedApplication(application)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="text-lg">
                                    {application.profiles?.full_name || "Unknown Applicant"}
                                  </CardTitle>
                                  <CardDescription className="flex items-center gap-1 mt-1">
                                    <Mail className="h-3 w-3" />
                                    {application.profiles?.email}
                                  </CardDescription>
                                </div>
                                <Badge className={getStatusColor(application.status)}>
                                  {application.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(application.created_at).toLocaleDateString()}
                                </span>
                                {application.documents_count > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {application.documents_count} document{application.documents_count === 1 ? "" : "s"} attached
                                  </Badge>
                                )}
                                {application.ai_match_score && (
                                  <span className="font-medium text-primary">
                                    Match: {application.ai_match_score}%
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          No applications in this category
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Detail View */}
          <div className="lg:col-span-1">
            {selectedApplication ? (
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>{selectedApplication.profiles?.full_name}</CardTitle>
                  <CardDescription>{selectedApplication.profiles?.email}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    {selectedApplication.profiles?.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {selectedApplication.profiles.phone}
                      </div>
                    )}
                    {selectedApplication.profiles?.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {selectedApplication.profiles.location}
                      </div>
                    )}
                  </div>

                  {/* Status Update */}
                  <div>
                    <Label>Application Status</Label>
                    <Select
                      value={selectedApplication.status}
                      onValueChange={(value) =>
                        updateStatusMutation.mutate({
                          applicationId: selectedApplication.id,
                          status: value,
                        })
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="applied">Applied</SelectItem>
                        <SelectItem value="viewed">Viewed</SelectItem>
                        <SelectItem value="shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="hired">Hired</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Resumes */}
                  <div className="space-y-2">
                    <Label>Candidate Resumes ({selectedApplication.resumes?.length || 0})</Label>
                    {selectedApplication.resumes && selectedApplication.resumes.length > 0 ? (
                      <div className="space-y-2">
                        {selectedApplication.resumes.map((resume: any) => (
                          <Card key={resume.id} className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm truncate">{resume.title}</p>
                                    {resume.resume_type && (
                                      <p className="text-xs text-muted-foreground truncate">{resume.resume_type}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={resume.is_uploaded ? "default" : "secondary"} className="text-xs">
                                    {resume.is_uploaded ? "Uploaded" : "Builder"}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(resume.updated_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              {resume.resume_file_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(resume.resume_file_url, '_blank')}
                                  className="flex-shrink-0"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No resumes available</p>
                    )}
                  </div>

                  {/* Legacy Resume URL (if exists) */}
                  {selectedApplication.resume_url && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => downloadResume(selectedApplication.resume_url)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Application Resume
                    </Button>
                  )}

                  {/* Attached Documents */}
                  <ApplicationDocuments applicationId={selectedApplication.id} />

                  {/* Cover Letter */}
                  {selectedApplication.cover_letter && (
                    <div>
                      <Label>Cover Letter</Label>
                      <div className="mt-2 p-3 bg-muted rounded-lg text-sm max-h-48 overflow-y-auto">
                        {selectedApplication.cover_letter}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes">Internal Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add notes about this candidate..."
                      value={selectedApplication.notes || ""}
                      onChange={(e) => {
                        setSelectedApplication({ ...selectedApplication, notes: e.target.value });
                      }}
                      onBlur={(e) => {
                        updateStatusMutation.mutate({
                          applicationId: selectedApplication.id,
                          status: selectedApplication.status,
                          notes: e.target.value,
                        });
                      }}
                      rows={4}
                      className="mt-2"
                    />
                  </div>

                  {/* Application Date */}
                  <div className="text-sm text-muted-foreground">
                    Applied on {new Date(selectedApplication.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="sticky top-20">
                <CardContent className="p-12 text-center text-muted-foreground">
                  Select an application to view details
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        </TabsContent>

        <TabsContent value="best-fit" className="mt-0">
          {rankedCandidates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No AI Ranking Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Click "Generate AI Ranking" to analyze and rank candidates based on their fit
                </p>
                <Button
                  onClick={() => rankCandidatesMutation.mutate()}
                  disabled={rankCandidatesMutation.isPending || !applications || applications.length === 0}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Generate AI Ranking
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rankedCandidates.map((candidate) => {
                const getBadgeColor = (fitLevel: string) => {
                  switch (fitLevel) {
                    case "excellent":
                      return "bg-green-500";
                    case "good":
                      return "bg-blue-500";
                    case "potential":
                      return "bg-yellow-500";
                    default:
                      return "bg-gray-500";
                  }
                };

                const matchPercentage = Math.round(candidate.match_score * 100);

                return (
                  <Card key={candidate.application_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{candidate.applicant_name}</h3>
                            <Badge variant="outline" className="capitalize">
                              {candidate.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{candidate.applicant_email}</p>

                          {candidate.match_reasoning?.strengths && (
                            <div className="mb-3">
                              <p className="text-sm font-semibold mb-1">Key Strengths:</p>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {candidate.match_reasoning.strengths.slice(0, 3).map((strength: string, i: number) => (
                                  <li key={i}>• {strength}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {candidate.match_reasoning?.matching_skills && (
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Matching Skills: {candidate.match_reasoning.skill_match_percentage}%
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className={`w-20 h-20 rounded-full ${getBadgeColor(candidate.fit_level)} flex flex-col items-center justify-center text-white`}>
                            <div className="text-2xl font-bold">{matchPercentage}%</div>
                            <div className="text-[10px] uppercase">{candidate.fit_level}</div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              const app = applications?.find(a => a.id === candidate.application_id);
                              if (app) setSelectedApplication(app);
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default ATSJobApplications;
