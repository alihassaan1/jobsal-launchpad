import { sanitizeBasicHtml } from "@/lib/sanitizeHtml";
import { trackPageView } from "@/lib/pageView";
import { htmlToPlainText } from "@/lib/utils";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Briefcase, MapPin, Banknote, Building2, Calendar, Users, Share2, ArrowLeft, Bookmark } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import ApplyToJobDialog from "@/components/ApplyToJobDialog";
import { Helmet } from "react-helmet";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";

const JobDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs_public")
        .select(`
          *,
          companies:companies_public(
            name,
            logo_url,
            description,
            website,
            location
          )
        `)
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Increment view count
  useEffect(() => {
    if (job?.id) {
      supabase.rpc("increment_job_views", { job_id: job.id });
    }
  }, [job?.id]);

  const { data: relatedJobs } = useQuery({
    queryKey: ["relatedJobs", job?.category],
    enabled: !!job?.category,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs_public")
        .select(`
          *,
          companies:companies_public(name, logo_url)
        `)
        .eq("category", job!.category)
        .eq("is_active", true)
        .neq("id", job!.id)
        .limit(3);

      if (error) throw error;
      return data;
    },
  });

  // Owner/admin-only stats (views/applications) — base table requires ownership via RLS
  const canSeeStats = !!user && (userRole === "admin" || job?.posted_by === user.id);
  const { data: jobStats } = useQuery({
    queryKey: ["jobStats", job?.id, user?.id],
    enabled: !!job?.id && canSeeStats,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("views_count, applications_count")
        .eq("id", job!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const formatSalary = (min: number | null, max: number | null, currency: string) => {
    if (!min && !max) return "Negotiable";
    if (min && max) return `${currency}${min.toLocaleString()} - ${currency}${max.toLocaleString()}`;
    if (min) return `From ${currency}${min.toLocaleString()}`;
    return `Up to ${currency}${max?.toLocaleString()}`;
  };

  // Check if user has already applied
  const { data: hasApplied } = useQuery({
    queryKey: ["hasApplied", job?.id, user?.id],
    enabled: !!job?.id && !!user?.id && userRole === "job_seeker",
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("id")
        .eq("job_id", job!.id)
        .eq("applicant_id", user!.id)
        .maybeSingle();
      return !!data;
    },
  });

  const { data: isSaved } = useQuery({
    queryKey: ["isSaved", job?.id, user?.id],
    enabled: !!job?.id && !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("saved_jobs")
        .select("id")
        .eq("job_id", job!.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data;
    },
  });

  const handleToggleSave = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!job?.id) return;
    if (isSaved) {
      const { error } = await supabase.from("saved_jobs").delete().eq("user_id", user.id).eq("job_id", job.id);
      if (error) return toast.error("Failed to remove");
      toast.success("Removed from saved jobs");
    } else {
      const { error } = await supabase.from("saved_jobs").insert({ user_id: user.id, job_id: job.id });
      if (error) return toast.error("Failed to save");
      toast.success("Job saved");
    }
    queryClient.invalidateQueries({ queryKey: ["isSaved", job.id, user.id] });
  };

  const handleApply = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (userRole !== "job_seeker") {
      toast.error("Only job seekers can apply to jobs");
      return;
    }
    setIsApplyDialogOpen(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job?.title,
        text: `Check out this job: ${job?.title} at ${job?.companies?.name}`,
        url: window.location.href,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-lg" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-12 text-center">
          <p className="text-xl">Job not found</p>
          <Link to="/jobs">
            <Button className="mt-4">Browse Jobs</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{job.seo_title || `${job.title} at ${job.companies?.name} | Jobs.al`}</title>
        <meta name="description" content={job.seo_description || `Apply for ${job.title} position at ${job.companies?.name} in ${job.location}. ${htmlToPlainText(job.description).substring(0, 150)}...`} />
        <meta name="keywords" content={`${job.title}, ${job.category}, ${job.location}, ${job.companies?.name}, ${job.skills?.slice(0, 5).join(', ')}`} />
        <link rel="canonical" href={`https://jobs.al/jobs/${job.slug}`} />
        <meta property="og:title" content={`${job.title} at ${job.companies?.name}`} />
        <meta property="og:description" content={htmlToPlainText(job.description).substring(0, 200)} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "JobPosting",
            "title": job.title,
            "description": job.description,
            "datePosted": job.created_at,
            "employmentType": job.job_type.toUpperCase(),
            "hiringOrganization": {
              "@type": "Organization",
              "name": job.companies?.name,
              "logo": job.companies?.logo_url
            },
            "jobLocation": {
              "@type": "Place",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": job.location,
                "addressCountry": "AL"
              }
            },
            "baseSalary": job.salary_min && job.salary_max ? {
              "@type": "MonetaryAmount",
              "currency": job.salary_currency,
              "value": {
                "@type": "QuantitativeValue",
                "minValue": job.salary_min,
                "maxValue": job.salary_max,
                "unitText": "YEAR"
              }
            } : undefined
          })}
        </script>
      </Helmet>
      <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    {job.companies?.logo_url ? (
                      <img
                        src={job.companies.logo_url}
                        alt={job.companies?.name}
                        className="w-16 h-16 object-contain"
                      />
                    ) : (
                      <Building2 className="h-10 w-10 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h1 className="text-3xl font-semibold leading-none tracking-tight">{job.title}</h1>
                      <Button variant="ghost" size="icon" onClick={handleShare}>
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-4 text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {job.companies?.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                        {job.is_remote && " (Remote)"}
                      </span>
                      {job.is_salary_visible && (
                        <span className="flex items-center gap-1">
                          <Banknote className="h-4 w-4" />
                          {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{job.job_type.replace("_", " ")}</Badge>
                      <Badge variant="outline">{job.experience_level}</Badge>
                      <Badge variant="outline">{job.category}</Badge>
                      {job.is_featured && <Badge variant="secondary">Featured</Badge>}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <Button
                    onClick={handleApply}
                    size="lg"
                    className="flex-1"
                    disabled={hasApplied || !job.is_active}
                  >
                    {hasApplied ? "Already Applied" : job.is_active ? "Apply Now" : "Position Closed"}
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleToggleSave}>
                    <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
                    {isSaved ? "Saved" : "Save Job"}
                  </Button>
                </div>
                {canSeeStats && (
                  <div className="flex justify-around text-center py-4 border rounded-lg">
                    <div>
                      <div className="text-2xl font-bold text-primary">{jobStats?.views_count ?? 0}</div>
                      <div className="text-sm text-muted-foreground">Views</div>
                    </div>
                    <Separator orientation="vertical" />
                    <div>
                      <div className="text-2xl font-bold text-primary">{jobStats?.applications_count ?? 0}</div>
                      <div className="text-sm text-muted-foreground">Applications</div>
                    </div>
                    <Separator orientation="vertical" />
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {job.application_deadline
                          ? Math.ceil((new Date(job.application_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                          : "∞"}
                      </div>
                      <div className="text-sm text-muted-foreground">Days Left</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: sanitizeBasicHtml(job.description) }} />
              </CardContent>
            </Card>

            {/* Requirements */}
            {job.requirements && (
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: sanitizeBasicHtml(job.requirements) }} />
                </CardContent>
              </Card>
            )}

            {/* Responsibilities */}
            {job.responsibilities && (
              <Card>
                <CardHeader>
                  <CardTitle>Responsibilities</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: sanitizeBasicHtml(job.responsibilities) }} />
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Required Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill: string, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1">
                    {job.benefits.map((benefit: string, idx: number) => (
                      <li key={idx}>{benefit}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>About {job.companies?.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {job.companies?.description || "No description available"}
                </p>
                {job.companies?.website && (
                  <a
                    href={job.companies.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline block"
                  >
                    Visit Website →
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Job Details */}
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Posted</span>
                  <span>{new Date(job.created_at).toLocaleDateString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span>{job.category}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Experience</span>
                  <span className="capitalize">{job.experience_level}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="capitalize">{job.job_type.replace("_", " ")}</span>
                </div>
                {job.application_deadline && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deadline</span>
                      <span>{new Date(job.application_deadline).toLocaleDateString()}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Related Jobs */}
            {relatedJobs && relatedJobs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Related Jobs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {relatedJobs.map((relatedJob: any) => (
                    <Link
                      key={relatedJob.id}
                      to={`/jobs/${relatedJob.slug}`}
                      className="block hover:bg-muted/50 p-3 rounded-lg transition-colors"
                    >
                      <h4 className="font-medium mb-1">{relatedJob.title}</h4>
                      <p className="text-sm text-muted-foreground">{relatedJob.companies?.name}</p>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Apply Dialog */}
      {job && (
        <ApplyToJobDialog
          job={job}
          isOpen={isApplyDialogOpen}
          onClose={() => setIsApplyDialogOpen(false)}
        />
      )}
    </div>
    </>
  );
};

export default JobDetail;
