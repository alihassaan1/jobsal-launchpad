import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, MapPin, DollarSign, Building2, Search, Clock } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Helmet } from "react-helmet";
import { JOB_CATEGORIES, ALBANIAN_CITIES } from "@/lib/i18n";
import Navigation from "@/components/Navigation";

const Jobs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [searchParams] = useSearchParams();
  
  // Initialize state from URL query parameters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || "");
  const [category, setCategory] = useState(searchParams.get('category') || "all");
  const [location, setLocation] = useState(searchParams.get('location') || "all")
  const [jobType, setJobType] = useState("all");

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs", searchTerm, category, location, jobType],
    queryFn: async () => {
      let query = supabase
        .from("jobs_public")
        .select(`
          *,
          companies:companies_public(
            name,
            logo_url,
            location
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.ilike("title", `%${searchTerm}%`);
      }
      if (category !== "all") {
        query = query.eq("category", category);
      }
      if (location !== "all") {
        query = query.ilike("location", `%${location}%`);
      }
      if (jobType !== "all") {
        query = query.eq("job_type", jobType as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const formatSalary = (min: number | null, max: number | null, currency: string) => {
    if (!min && !max) return t('jobs.negotiable');
    if (min && max) return `${currency}${min.toLocaleString()} - ${currency}${max.toLocaleString()}`;
    if (min) return `From ${currency}${min.toLocaleString()}`;
    return `Up to ${currency}${max?.toLocaleString()}`;
  };

  const getJobTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      full_time: "bg-green-100 text-green-800",
      part_time: "bg-blue-100 text-blue-800",
      contract: "bg-purple-100 text-purple-800",
      internship: "bg-orange-100 text-orange-800",
      freelance: "bg-pink-100 text-pink-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const getJobTypeLabel = (type: string) => {
    const labels: Record<string, { sq: string; en: string }> = {
      full_time: { sq: 'Kohë e Plotë', en: 'Full Time' },
      part_time: { sq: 'Kohë e Pjesshme', en: 'Part Time' },
      contract: { sq: 'Kontratë', en: 'Contract' },
      internship: { sq: 'Praktikë', en: 'Internship' },
      freelance: { sq: 'Freelance', en: 'Freelance' },
    };
    return labels[type]?.[language] || type.replace("_", " ");
  };

  return (
    <>
      <Helmet>
        <title>{language === 'sq' ? 'Pune në Shqipëri — Vende Pune në Tiranë & Të Gjitha Qytetet | Jobs.al' : 'Job Openings in Albania | Find Jobs in Tirana & All Cities | Jobs.al'}</title>
        <meta name="description" content={language === 'sq' 
          ? 'Kërko vende pune në Shqipëri. Gjej pozicione me kohë të plotë, të pjesshme dhe në distancë në Tiranë, Durrës dhe qytete të tjera. Apliko online tani.'
          : 'Search job openings & vacancies in Albania. Find full-time, part-time & remote job opportunities in Tirana, Durres & all cities. Hiring now — apply online today.'
        } />
        <meta name="keywords" content="job vacancies, jobs in albania, jobs in tirana, full time jobs, jobs hiring near me, albania jobs, pune shqiperi, job openings, job opportunities, vacancies albania, albania job apply, hiring in albania, job offers albania, english speaking jobs albania" />
        <link rel="canonical" href="https://jobs.al/jobs" />
        <meta property="og:title" content={language === 'sq' ? 'Vende Pune në Shqipëri | Jobs.al' : 'Job Openings in Albania | Jobs.al'} />
        <meta property="og:description" content="Browse and apply to hundreds of job openings & vacancies across Albania. Full-time, part-time & remote opportunities." />
        <meta property="og:url" content="https://jobs.al/jobs" />
        <meta property="og:image" content="https://jobs.al/og-image.jpg" />
      </Helmet>
      <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">{t('jobs.title')}</h1>
          <p className="text-xl text-muted-foreground mb-8">
            {t('jobs.subtitle')}
          </p>

          {/* Search and Filters */}
          <div className="bg-card rounded-lg shadow-lg p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder={t('jobs.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={t('jobs.allCategories')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('jobs.allCategories')}</SelectItem>
                  {JOB_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.key} value={cat.en}>
                      {cat.icon} {cat[language]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue placeholder={t('jobs.allLocations')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('jobs.allLocations')}</SelectItem>
                  {ALBANIAN_CITIES.map((city) => (
                    <SelectItem key={city.key} value={city.en}>
                      {city[language]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4">
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t('jobs.allTypes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('jobs.allTypes')}</SelectItem>
                  <SelectItem value="full_time">{t('jobType.full_time')}</SelectItem>
                  <SelectItem value="part_time">{t('jobType.part_time')}</SelectItem>
                  <SelectItem value="contract">{t('jobType.contract')}</SelectItem>
                  <SelectItem value="internship">{t('jobType.internship')}</SelectItem>
                  <SelectItem value="freelance">{t('jobType.freelance')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {jobs?.length || 0} {t('jobs.found')}
          </h2>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-32 bg-muted" />
              </Card>
            ))}
          </div>
        ) : jobs && jobs.length > 0 ? (
          <div className="grid gap-4">
            {jobs.map((job: any) => (
              <Card
                key={job.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/jobs/${job.slug}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        {job.companies?.logo_url ? (
                          <img
                            src={job.companies.logo_url}
                            alt={job.companies?.name}
                            className="w-12 h-12 object-contain"
                          />
                        ) : (
                          <Building2 className="h-8 w-8 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                        <CardDescription className="flex flex-wrap gap-4 text-base">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {job.companies?.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                            {job.is_remote && ` (${t('jobs.remote')})`}
                          </span>
                          {job.is_salary_visible && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getJobTypeColor(job.job_type)}>
                        {getJobTypeLabel(job.job_type)}
                      </Badge>
                      {job.is_featured && (
                        <Badge variant="secondary">{t('jobs.featured')}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-2 mb-4">
                    {job.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skills?.slice(0, 5).map((skill: string, idx: number) => (
                      <Badge key={idx} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {t('jobs.posted')} {new Date(job.created_at).toLocaleDateString()}
                    </span>
                    <span>{job.applications_count} {t('jobs.applications')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-xl text-muted-foreground">{t('jobs.noJobs')}</p>
          </Card>
        )}
      </section>
    </div>
    </>
  );
};

export default Jobs;
