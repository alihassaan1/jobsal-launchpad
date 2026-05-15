import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Briefcase, Plus, Eye, Users, Edit, Trash2, MapPin, DollarSign, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";

const EmployerDashboard = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);

  // Fetch employer's company
  const { data: company } = useQuery({
    queryKey: ["employerCompany", user?.id],
    enabled: !!user?.id && (userRole === "employer" || userRole === "admin"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Fetch employer's jobs
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["employerJobs", company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (authLoading || (!!user && !userRole)) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!user) {
    return <Navigate to="/auth?type=employer" replace />;
  }

  if (userRole !== "employer" && userRole !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase.from("jobs").delete().eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employerJobs"] });
      toast({ title: "Job deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle job active status
  const toggleJobStatusMutation = useMutation({
    mutationFn: async ({ jobId, isActive }: { jobId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("jobs")
        .update({ is_active: !isActive })
        .eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employerJobs"] });
      toast({ title: "Job status updated" });
    },
  });

  const isDraft =
    !company ||
    !company.name ||
    company.name.endsWith("(Draft)") ||
    !company.description ||
    !company.industry ||
    !company.location;


  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {isDraft && (
          <Card className="mb-6 border-primary/40 bg-primary/5">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-primary">Complete your company profile</CardTitle>
                  <CardDescription className="mt-1 text-foreground/80">
                    You need to finish setting up your company before you can post jobs.
                  </CardDescription>
                </div>
                <Button onClick={() => navigate("/setup-company")}>
                  Complete profile
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Company Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">{company?.name || "Your Company"}</CardTitle>
                <CardDescription className="text-base">
                  {company?.description || "Add a description to help candidates learn about your company."}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => navigate("/setup-company")}>
                {isDraft ? "Set up Company" : "Edit Company"}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Quick links */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-primary/30 bg-gradient-to-br from-primary/5 to-transparent" onClick={() => navigate("/employer/talent")}>
            <CardHeader>
              <CardTitle className="text-lg">🔍 Talent Pool</CardTitle>
              <CardDescription>Search opted-in candidates and reach out directly. Don't wait for applications.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/employer/analytics")}>
            <CardHeader>
              <CardTitle className="text-lg">📊 Analytics</CardTitle>
              <CardDescription>Job performance, views and applications.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/employer/subscription")}>
            <CardHeader>
              <CardTitle className="text-lg">💼 My Plan</CardTitle>
              <CardDescription>Upgrade for unlimited posts and Talent Pool access.</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{jobs?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {jobs?.filter((j) => j.is_active).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {jobs?.reduce((sum, j) => sum + (j.views_count || 0), 0) || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {jobs?.reduce((sum, j) => sum + (j.applications_count || 0), 0) || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Job Postings</CardTitle>
              <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { if (isDraft) return; setIsCreateDialogOpen(open); }}>
                <DialogTrigger asChild>
                  <Button
                    disabled={isDraft}
                    title={isDraft ? "Complete your company profile first." : undefined}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Post New Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingJob ? "Edit Job" : "Post New Job"}</DialogTitle>
                    <DialogDescription>
                      Fill in the details to {editingJob ? "update your" : "create a new"} job posting
                    </DialogDescription>
                  </DialogHeader>
                  {isDraft || !company ? (
                    <div className="p-6 text-center space-y-4">
                      <p className="text-muted-foreground">
                        Complete your company profile before posting jobs.
                      </p>
                      <Button onClick={() => { setIsCreateDialogOpen(false); navigate("/setup-company"); }}>
                        Complete profile
                      </Button>
                    </div>
                  ) : (
                    <JobForm
                      companyId={company.id}
                      job={editingJob}
                      onSuccess={() => {
                        setIsCreateDialogOpen(false);
                        setEditingJob(null);
                        queryClient.invalidateQueries({ queryKey: ["employerJobs"] });
                      }}
                    />
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : jobs && jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.map((job: any) => (
                  <Card key={job.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-xl">{job.title}</CardTitle>
                            <Badge variant={job.is_active ? "default" : "secondary"}>
                              {job.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {job.is_featured && <Badge variant="secondary">Featured</Badge>}
                          </div>
                          <CardDescription className="flex flex-wrap gap-4">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {job.views_count} views
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {job.applications_count} applications
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/ats/jobs/${job.id}`)}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            {job.applications_count}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/jobs/${job.slug}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingJob(job);
                              setIsCreateDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this job?")) {
                                deleteJobMutation.mutate(job.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={job.is_active}
                            onCheckedChange={() =>
                              toggleJobStatusMutation.mutate({ jobId: job.id, isActive: job.is_active })
                            }
                          />
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No jobs posted yet</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>Post Your First Job</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Job Form Component
const JobForm = ({
  companyId,
  job,
  onSuccess,
}: {
  companyId: string;
  job?: any;
  onSuccess: () => void;
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Check subscription limits
  const { data: canPost } = useQuery({
    queryKey: ["can-post-job", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("can_post_job", {
        user_id: user!.id,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !job?.id, // Only check when creating new job
  });
  const [formData, setFormData] = useState({
    title: job?.title || "",
    description: job?.description || "",
    requirements: job?.requirements || "",
    responsibilities: job?.responsibilities || "",
    category: job?.category || "",
    location: job?.location || "",
    job_type: job?.job_type || "full_time",
    experience_level: job?.experience_level || "mid",
    salary_min: job?.salary_min || "",
    salary_max: job?.salary_max || "",
    is_remote: job?.is_remote || false,
    is_salary_visible: job?.is_salary_visible ?? true,
    skills: job?.skills?.join(", ") || "",
    benefits: job?.benefits?.join(", ") || "",
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: any) => {
      // Check limit before creating new job
      if (!job?.id && canPost === false) {
        throw new Error("You've reached your job posting limit. Please upgrade your subscription.");
      }
      
      const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const jobData = {
        ...data,
        company_id: companyId,
        posted_by: user!.id,
        slug: `${slug}-${Date.now()}`,
        skills: data.skills ? data.skills.split(",").map((s: string) => s.trim()) : [],
        benefits: data.benefits ? data.benefits.split(",").map((b: string) => b.trim()) : [],
        salary_min: data.salary_min ? parseInt(data.salary_min) : null,
        salary_max: data.salary_max ? parseInt(data.salary_max) : null,
      };

      if (job?.id) {
        const { error } = await supabase.from("jobs").update(jobData).eq("id", job.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("jobs").insert([jobData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: job?.id ? "Job updated successfully" : "Job posted successfully" });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createJobMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Job Title*</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category*</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Technology">Technology</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Design">Design</SelectItem>
              <SelectItem value="Sales">Sales</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="location">Location*</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="job_type">Job Type*</Label>
          <Select
            value={formData.job_type}
            onValueChange={(value) => setFormData({ ...formData, job_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full_time">Full Time</SelectItem>
              <SelectItem value="part_time">Part Time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
              <SelectItem value="freelance">Freelance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="experience_level">Experience Level*</Label>
          <Select
            value={formData.experience_level}
            onValueChange={(value) => setFormData({ ...formData, experience_level: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entry">Entry</SelectItem>
              <SelectItem value="mid">Mid</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
              <SelectItem value="executive">Executive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="salary_min">Min Salary (ALL)</Label>
          <Input
            id="salary_min"
            type="number"
            value={formData.salary_min}
            onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="salary_max">Max Salary (ALL)</Label>
          <Input
            id="salary_max"
            type="number"
            value={formData.salary_max}
            onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_remote"
            checked={formData.is_remote}
            onCheckedChange={(checked) => setFormData({ ...formData, is_remote: checked })}
          />
          <Label htmlFor="is_remote">Remote Work</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="is_salary_visible"
            checked={formData.is_salary_visible}
            onCheckedChange={(checked) => setFormData({ ...formData, is_salary_visible: checked })}
          />
          <Label htmlFor="is_salary_visible">Show Salary</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Job Description*</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={6}
          required
        />
      </div>

      <div>
        <Label htmlFor="requirements">Requirements</Label>
        <Textarea
          id="requirements"
          value={formData.requirements}
          onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="responsibilities">Responsibilities</Label>
        <Textarea
          id="responsibilities"
          value={formData.responsibilities}
          onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="skills">Skills (comma-separated)</Label>
        <Input
          id="skills"
          value={formData.skills}
          onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
          placeholder="React, TypeScript, Node.js"
        />
      </div>

      <div>
        <Label htmlFor="benefits">Benefits (comma-separated)</Label>
        <Input
          id="benefits"
          value={formData.benefits}
          onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
          placeholder="Health Insurance, Flexible Hours, Remote Work"
        />
      </div>

      <Button type="submit" className="w-full" disabled={createJobMutation.isPending}>
        {createJobMutation.isPending ? "Saving..." : job?.id ? "Update Job" : "Post Job"}
      </Button>
    </form>
  );
};

export default EmployerDashboard;
