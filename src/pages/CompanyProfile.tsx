import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2,
  MapPin,
  Users,
  Briefcase,
  Globe,
  CheckCircle,
  Heart,
  ExternalLink,
  Linkedin,
  Facebook,
  Instagram,
  Star,
  Eye
} from "lucide-react";

const CompanyProfile = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select(`
          *,
          jobs(*)
        `)
        .eq("slug", slug)
        .single();

      if (error) throw error;

      // Increment view count
      await supabase.rpc("increment_company_views", { company_slug: slug });

      return data;
    },
    enabled: !!slug,
  });

  const { data: sponsoredPosts } = useQuery({
    queryKey: ["sponsored-posts", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("company_id", company.id)
        .eq("is_sponsored", true)
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
    enabled: !!company?.id,
  });

  useQuery({
    queryKey: ["is-following", company?.id, user?.id],
    queryFn: async () => {
      if (!user?.id || !company?.id) return false;

      const { data, error } = await supabase
        .from("company_followers")
        .select("id")
        .eq("company_id", company.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setIsFollowing(!!data);
      return !!data;
    },
    enabled: !!user?.id && !!company?.id,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast({ title: "Please sign in to follow companies", variant: "destructive" });
        throw new Error("Not authenticated");
      }

      if (isFollowing) {
        const { error } = await supabase
          .from("company_followers")
          .delete()
          .eq("company_id", company.id)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("company_followers")
          .insert({ company_id: company.id, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setIsFollowing(!isFollowing);
      queryClient.invalidateQueries({ queryKey: ["company", slug] });
      toast({
        title: isFollowing ? "Unfollowed company" : "Following company",
        description: isFollowing ? "You will no longer receive updates" : "You'll be notified of new jobs",
      });
    },
  });

  const getSponsorshipBadge = (plan: string) => {
    const badges = {
      platinum: <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"><Star className="w-3 h-3 mr-1" />Platinum Partner</Badge>,
      gold: <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white"><Star className="w-3 h-3 mr-1" />Gold Partner</Badge>,
      silver: <Badge className="bg-gradient-to-r from-gray-300 to-gray-500 text-white"><Star className="w-3 h-3 mr-1" />Silver Partner</Badge>,
    };
    return badges[plan as keyof typeof badges] || null;
  };

  const socialLinks = company?.social_links as any || {};

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background animate-pulse">
        <div className="h-64 bg-muted" />
        <div className="container mx-auto px-4 py-8">
          <div className="h-8 bg-muted rounded w-1/3 mb-4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Company not found</h2>
          <Button onClick={() => navigate("/companies")}>Browse Companies</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{company.name} - Company Profile | Jobs.al</title>
        <meta name="description" content={company.description || `Explore ${company.name}'s profile, open positions, and company culture on Jobs.al`} />
        <meta property="og:title" content={`${company.name} | Jobs.al`} />
        <meta property="og:description" content={company.description || `Join ${company.name} - View open positions`} />
        {company.logo_url && <meta property="og:image" content={company.logo_url} />}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: company.name,
            description: company.description,
            logo: company.logo_url,
            url: company.website,
            address: company.location,
            sameAs: Object.values(socialLinks).filter(Boolean),
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Banner */}
        <div
          className="h-64 bg-gradient-to-r from-primary to-primary/80 relative"
          style={
            company.banner_url
              ? { backgroundImage: `url(${company.banner_url})`, backgroundSize: "cover", backgroundPosition: "center" }
              : {}
          }
        >
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Company Info */}
        <div className="container mx-auto px-4">
          <div className="relative -mt-20 mb-8">
            <div className="bg-card rounded-lg shadow-lg p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Logo */}
                <div className="w-32 h-32 bg-background rounded-lg border-4 border-card flex items-center justify-center overflow-hidden flex-shrink-0">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-16 h-16 text-muted-foreground" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-3xl font-bold">{company.name}</h1>
                        {company.is_verified && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </Badge>
                        )}
                        {company.sponsorship_plan !== 'none' && getSponsorshipBadge(company.sponsorship_plan)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-muted-foreground">
                        {company.industry && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {company.industry}
                          </div>
                        )}
                        {company.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {company.location}
                          </div>
                        )}
                        {company.company_size && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {company.company_size} employees
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {company.views_count || 0} views
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant={isFollowing ? "outline" : "default"}
                        onClick={() => followMutation.mutate()}
                        disabled={followMutation.isPending}
                      >
                        <Heart className={`w-4 h-4 mr-2 ${isFollowing ? "fill-current" : ""}`} />
                        {isFollowing ? "Following" : "Follow"}
                        {company.followers_count > 0 && ` (${company.followers_count})`}
                      </Button>
                      {company.website && (
                        <Button variant="outline" asChild>
                          <a href={company.website} target="_blank" rel="noopener noreferrer">
                            <Globe className="w-4 h-4 mr-2" />
                            Website
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Social Links */}
                  {(socialLinks.linkedin || socialLinks.facebook || socialLinks.instagram) && (
                    <div className="flex gap-2">
                      {socialLinks.linkedin && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                            <Linkedin className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      {socialLinks.facebook && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                            <Facebook className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      {socialLinks.instagram && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                            <Instagram className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <Card>
                <CardHeader>
                  <CardTitle>About {company.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {company.description || "No description available."}
                  </p>
                </CardContent>
              </Card>

              {/* Open Positions */}
              <Card>
                <CardHeader>
                  <CardTitle>Open Positions ({company.jobs?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {company.jobs && company.jobs.length > 0 ? (
                    <div className="space-y-4">
                      {company.jobs.filter((job: any) => job.is_active).map((job: any) => (
                        <Link
                          key={job.id}
                          to={`/jobs/${job.slug}`}
                          className="block p-4 border rounded-lg hover:border-primary transition-colors"
                        >
                          <h3 className="font-semibold mb-1">{job.title}</h3>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary">{job.job_type}</Badge>
                            <span>{job.location}</span>
                            {job.is_salary_visible && job.salary_min && (
                              <span>
                                {job.salary_min.toLocaleString()} - {job.salary_max?.toLocaleString()} {job.salary_currency}
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No open positions at the moment.</p>
                  )}
                </CardContent>
              </Card>

              {/* Sponsored Content */}
              {sponsoredPosts && sponsoredPosts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Featured Articles by {company.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sponsoredPosts.map((post) => (
                        <Link
                          key={post.id}
                          to={`/blog/${post.slug}`}
                          className="block p-4 border rounded-lg hover:border-primary transition-colors"
                        >
                          <Badge className="mb-2">Sponsored</Badge>
                          <h3 className="font-semibold mb-1">{post.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Open Jobs</span>
                    <span className="font-semibold">{company.jobs?.filter((j: any) => j.is_active).length || 0}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Followers</span>
                    <span className="font-semibold">{company.followers_count || 0}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profile Views</span>
                    <span className="font-semibold">{company.views_count || 0}</span>
                  </div>
                  {company.founded_year && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Founded</span>
                        <span className="font-semibold">{company.founded_year}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {company.jobs && company.jobs.length > 0 && (
                <Button className="w-full" asChild>
                  <Link to="/jobs" state={{ company: company.name }}>
                    View All Jobs
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CompanyProfile;