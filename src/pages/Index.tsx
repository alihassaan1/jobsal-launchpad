import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MapPin, Building2, Users, TrendingUp, Star, ArrowRight, Briefcase, Clock, DollarSign, Sparkles, LogOut, User, Calendar, Check, ChevronsUpDown, Image as ImageIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroBg from "@/assets/hero-bg.jpg";
import FeaturedCompanies from "./FeaturedCompanies";
import { TopEmployers } from "@/components/TopEmployers";
import { Helmet } from "react-helmet";
import { ALBANIAN_CITIES } from "@/lib/i18n";
import { cn, htmlToPlainText } from "@/lib/utils";

// Blog section component
const BlogSection = () => {
  const navigate = useNavigate();
  const [latestPosts, setLatestPosts] = useState<any[]>([]);

  useEffect(() => {
    fetchLatestPosts();
  }, []);

  const fetchLatestPosts = async () => {
    const { data } = await supabase
      .from('posts_public')
      .select('id, title, slug, excerpt, featured_image, category, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(3);

    if (data) setLatestPosts(data);
  };

  if (latestPosts.length === 0) return null;

  return (
    <section className="py-10 sm:py-14 lg:py-16 bg-muted/30">
      <div className="container mx-auto px-3 min-[360px]:px-4">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">
              Latest from <span className="text-primary">our blog</span>
            </h2>
            <p className="text-muted-foreground mt-2">Expert career advice and job market insights</p>
          </div>
          <button
            onClick={() => navigate('/blog')}
            className="hidden md:inline-flex items-center text-sm font-medium text-primary hover:font-bold shrink-0"
          >
            View all articles
            <ArrowRight className="ml-1 h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5 max-w-6xl mx-auto">
          {latestPosts.map((post, i) => {
            const featured = i === 0;
            const date = post.published_at ? new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
            return (
              <button
                key={post.id}
                onClick={() => navigate(`/blog/${post.slug}`)}
                className={`group relative isolate flex w-full overflow-hidden rounded-3xl bg-muted text-left transition-transform duration-300 motion-reduce:transition-none hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${featured ? 'min-h-[320px] sm:min-h-[420px] lg:col-span-3 lg:row-span-2 lg:min-h-[460px]' : 'min-h-[220px] lg:col-span-2'}`}
              >
                {post.featured_image ? (
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    loading="lazy"
                    className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 motion-reduce:transition-none group-hover:scale-105"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div className="absolute inset-0 -z-10 flex items-center justify-center bg-gradient-to-br from-primary to-primary/70">
                    <ImageIcon className="h-10 w-10 text-primary-foreground/50" />
                  </div>
                )}
                <div className="blog-card-overlay absolute inset-0 -z-10" />
                <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-primary backdrop-blur-sm">
                  {post.category || 'Career insights'}
                </span>
                <div className={`mt-auto flex w-full flex-col ${featured ? 'p-5 sm:p-7' : 'p-5'}`}>
                  {date && <span className="blog-card-overlay-muted text-xs font-medium">{date}</span>}
                  <h3 className={`blog-card-overlay-text mt-1.5 font-bold leading-snug tracking-tight ${featured ? 'text-xl sm:text-2xl lg:text-3xl line-clamp-3' : 'text-base sm:text-lg line-clamp-2'}`}>
                    {post.title}
                  </h3>
                  {featured && post.excerpt && (
                    <p className="blog-card-overlay-muted mt-2 line-clamp-2 text-sm sm:text-base max-w-xl">{post.excerpt}</p>
                  )}
                  <span className="blog-card-overlay-text mt-3 inline-flex items-center gap-1.5 text-sm font-semibold">
                    Read article
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 motion-reduce:transition-none group-hover:translate-x-1" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" onClick={() => navigate('/blog')}>
            View All Articles
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};


const Index = () => {
  const { user, signOut, userRole } = useAuth();
  const navigate = useNavigate();
  const [featuredJobs, setFeaturedJobs] = useState<any[]>([]);
  const [latestJobs, setLatestJobs] = useState<any[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingLatest, setIsLoadingLatest] = useState(true);
  const [heroSearchTerm, setHeroSearchTerm] = useState("");
  const [heroLocation, setHeroLocation] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);

  const handleHeroSearch = () => {
    const params = new URLSearchParams();
    if (heroSearchTerm) params.set('q', heroSearchTerm);
    if (heroLocation) params.set('location', heroLocation);
    navigate(`/jobs${params.toString() ? '?' + params.toString() : ''}`);
  };

  const getLocationLabel = () => {
    if (!heroLocation) return "All Locations";
    const city = ALBANIAN_CITIES.find(c => c.en === heroLocation);
    return city ? city.en : heroLocation;
  };

  useEffect(() => {
    fetchFeaturedJobs();
    fetchLatestJobs();
  }, []);

  const attachCompanies = async (jobsData: any[]) => {
    const companyIds = Array.from(new Set(jobsData.map(j => j.company_id).filter(Boolean)));
    if (companyIds.length === 0) return jobsData;
    const { data: companiesData } = await supabase
      .from('companies_public')
      .select('id, name, logo_url, location')
      .in('id', companyIds);
    const byId = new Map((companiesData || []).map((c: any) => [c.id, c]));
    return jobsData.map(j => ({ ...j, companies: byId.get(j.company_id) || null }));
  };

  const fetchLatestJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs_public')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      setLatestJobs(await attachCompanies(data || []));
    } catch (error) {
      console.error('Error fetching latest jobs:', error);
    } finally {
      setIsLoadingLatest(false);
    }
  };

  const fetchFeaturedJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs_public')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setFeaturedJobs(await attachCompanies(data || []));
    } catch (error) {
      console.error('Error fetching featured jobs:', error);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const jobCategories = [
    { name: "Technology", count: 245, icon: "💻" },
    { name: "Marketing", count: 189, icon: "📈" },
    { name: "Design", count: 156, icon: "🎨" },
    { name: "Sales", count: 134, icon: "💼" },
    { name: "Finance", count: 98, icon: "💰" },
    { name: "Healthcare", count: 87, icon: "🏥" },
    { name: "Education", count: 76, icon: "📚" },
    { name: "Engineering", count: 65, icon: "⚙️" }
  ];

  const testimonials = [
    {
      name: "Arta Berisha",
      role: "Software Engineer",
      company: "Tech Solutions",
      content: "Found my dream job through jobs.al in just 2 weeks! The platform is amazing.",
      avatar: "AB"
    },
    {
      name: "Marko Petrovic",
      role: "Marketing Director",
      company: "Creative Agency",
      content: "As an employer, jobs.al helped us find the perfect candidates quickly.",
      avatar: "MP"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Jobs.al — Jobs in Albania | Job Openings & Career Portal</title>
        <meta name="description" content="Albania's #1 job portal. Browse job openings & opportunities in Tirana, Durres & all cities. Find full-time job vacancies, apply online & build your CV. Jobs for foreigners & English speakers welcome." />
        <meta name="keywords" content="jobs in albania, jobs in tirana, albania jobs, job vacancies, pune shqiperi, pune ne tirane, albania job portal, jobs hiring near me, job search, al jobs, jobs al, work albania, where to find jobs, job in albania, job openings in albania, job opportunities in albania, albania jobs for foreigners, english speaking jobs in albania, hiring in albania, vacancies albania, job offers albania, jobs for expats albania, jobs in durres, jobs for americans in albania" />
        <link rel="canonical" href="https://jobs.al" />
        <meta property="og:title" content="Jobs.al — Jobs in Albania | Job Openings & Career Portal" />
        <meta property="og:description" content="Albania's #1 job portal. Browse job openings & vacancies in Tirana, Durres & all Albanian cities. Jobs for foreigners welcome. Free AI resume builder included." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://jobs.al" />
        <meta property="og:image" content="https://jobs.al/og-image.jpg" />
        <meta property="og:site_name" content="Jobs.al" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Jobs.al",
            "url": "https://jobs.al",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://jobs.al/jobs?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
      </Helmet>
      <div className="min-h-screen overflow-x-clip bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary py-12 sm:py-16 lg:py-20">
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`
          }}></div>
        </div>
        
        <div className="container relative z-10 mx-auto px-3 text-center min-[360px]:px-4">
          <div>
            <h1 className="mb-4 text-3xl font-bold leading-tight text-white min-[360px]:text-4xl sm:mb-6 sm:text-5xl lg:text-6xl">
              Find Your Dream Job in 
              <span className="block bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Albania
              </span>
            </h1>
            <p className="mx-auto mb-6 max-w-2xl text-base leading-relaxed text-white/90 sm:mb-8 sm:text-lg lg:text-xl">
              Discover thousands of job opportunities from top companies across Albania. Your career journey starts here.
            </p>
          </div>
          
          {/* Enhanced Search Bar */}
          <div className="mx-auto max-w-4xl rounded-lg border border-white/20 bg-white/95 p-3 shadow-2xl backdrop-blur min-[360px]:p-4 sm:p-6">
            <div className="grid gap-3 md:grid-cols-3 md:gap-4">
              <div className="relative group">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                <Input 
                  placeholder="Job title or keyword" 
                  className="pl-10 border-0 bg-white/80 focus:bg-white transition-colors" 
                  value={heroSearchTerm}
                  onChange={(e) => setHeroSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleHeroSearch()}
                />
              </div>
              <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={locationOpen}
                    className="w-full justify-between pl-10 border-0 bg-white/80 hover:bg-white h-11 font-normal text-left"
                  >
                    <MapPin className="absolute left-3 h-5 w-5 text-muted-foreground" />
                    <span className={cn(!heroLocation && "text-muted-foreground")}>
                      {getLocationLabel()}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="z-50 w-[calc(100vw-2rem)] max-w-[280px] bg-white p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search city..." className="h-10" />
                    <CommandList>
                      <CommandEmpty>No city found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value=""
                          onSelect={() => {
                            setHeroLocation("");
                            setLocationOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", !heroLocation ? "opacity-100" : "opacity-0")} />
                          All Locations
                        </CommandItem>
                        {ALBANIAN_CITIES.map((city) => (
                          <CommandItem
                            key={city.key}
                            value={city.en}
                            onSelect={() => {
                              setHeroLocation(city.en);
                              setLocationOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", heroLocation === city.en ? "opacity-100" : "opacity-0")} />
                            {city.en}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button 
                size="lg" 
                className="w-full shadow-lg hover:shadow-xl transition-all duration-300 group"
                onClick={handleHeroSearch}
              >
                <Sparkles className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                Search Jobs
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Enhanced Quick Stats */}
          <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-6 text-white sm:mt-14 sm:gap-8 md:grid-cols-4 lg:mt-16">
            <div className="animate-fade-up hover:scale-105 transition-transform duration-300" style={{animationDelay: '0.2s'}}>
              <div className="text-2xl font-bold min-[360px]:text-3xl lg:text-4xl">1,200+</div>
              <div className="text-xs text-white/80 min-[360px]:text-sm sm:text-base">Active Jobs</div>
            </div>
            <div className="animate-fade-up hover:scale-105 transition-transform duration-300" style={{animationDelay: '0.4s'}}>
              <div className="text-2xl font-bold min-[360px]:text-3xl lg:text-4xl">500+</div>
              <div className="text-xs text-white/80 min-[360px]:text-sm sm:text-base">Companies</div>
            </div>
            <div className="animate-fade-up hover:scale-105 transition-transform duration-300" style={{animationDelay: '0.6s'}}>
              <div className="text-2xl font-bold min-[360px]:text-3xl lg:text-4xl">10,000+</div>
              <div className="text-xs text-white/80 min-[360px]:text-sm sm:text-base">Job Seekers</div>
            </div>
            <div className="animate-fade-up hover:scale-105 transition-transform duration-300" style={{animationDelay: '0.8s'}}>
              <div className="text-2xl font-bold min-[360px]:text-3xl lg:text-4xl">95%</div>
              <div className="text-xs text-white/80 min-[360px]:text-sm sm:text-base">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="bg-background py-10 sm:py-14 lg:py-16">
        <div className="container mx-auto px-3 min-[360px]:px-4">
          <div className="text-center mb-12">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              Featured Jobs
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Discover hand-picked job opportunities from top employers in Albania
            </p>
          </div>

          {isLoadingJobs ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading featured jobs...</p>
            </div>
          ) : featuredJobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No featured jobs available at the moment.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredJobs.map((job) => (
                <Card 
                  key={job.id} 
                  className="hover:shadow-xl transition-all duration-300 border border-border/50 bg-card cursor-pointer"
                  onClick={() => navigate(`/jobs/${job.slug}`)}
                >
                  <CardHeader className="space-y-4">
                    <div className="flex flex-col items-start gap-3 min-[360px]:flex-row min-[360px]:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarImage src={job.companies?.logo_url} alt={job.companies?.name} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {job.companies?.name?.charAt(0) || 'J'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-foreground">{job.companies?.name}</h3>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            {job.location}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-200">
                        <Star className="h-3 w-3 mr-1 fill-yellow-500" />
                        Featured
                      </Badge>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-foreground mb-2">{job.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{htmlToPlainText(job.description)}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {job.job_type?.replace('_', ' ')}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {job.experience_level}
                      </Badge>
                      {job.is_salary_visible && job.salary_min && (
                        <Badge variant="secondary" className="text-xs">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {job.salary_min}-{job.salary_max} {job.salary_currency}
                        </Badge>
                      )}
                    </div>
                    <Button className="w-full" variant="outline">
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              size="lg" 
              className="shadow-sm hover:bg-accent"
              onClick={() => navigate('/jobs')}
            >
              View All Jobs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Latest Jobs */}
      <section className="bg-muted/30 py-10 sm:py-14 lg:py-16">
        <div className="container mx-auto px-3 min-[360px]:px-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="mb-2 text-3xl font-bold text-foreground sm:text-4xl">
                Latest Jobs
              </h2>
              <p className="text-muted-foreground text-lg">
                Fresh opportunities posted by employers on jobs.al
              </p>
            </div>
            <Button
              variant="outline"
              className="shadow-sm hover:bg-accent self-start sm:self-auto"
              onClick={() => navigate('/jobs')}
            >
              View All Jobs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {isLoadingLatest ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading latest jobs...</p>
            </div>
          ) : latestJobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No jobs posted yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {latestJobs.map((job) => (
                <Card
                  key={job.id}
                  className="hover:shadow-lg hover:border-primary/30 transition-all duration-300 border border-border/50 bg-card cursor-pointer"
                  onClick={() => navigate(`/jobs/${job.slug}`)}
                >
                  <CardContent className="flex items-center gap-4 p-4 min-[360px]:p-5">
                    <Avatar className="h-12 w-12 shrink-0 border-2 border-primary/20">
                      <AvatarImage src={job.companies?.logo_url} alt={job.companies?.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {job.companies?.name?.charAt(0) || 'J'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-foreground">{job.title}</h3>
                      <p className="truncate text-sm text-muted-foreground">{job.companies?.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {job.location}
                        </span>
                        <span className="flex items-center">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {job.job_type?.replace('_', ' ')}
                        </span>
                        {job.is_salary_visible && job.salary_min && (
                          <span className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {job.salary_min}-{job.salary_max} {job.salary_currency}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-col items-end gap-2 shrink-0">
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(job.created_at).toLocaleDateString()}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Job Categories */}
      <section className="relative overflow-hidden bg-primary/[0.04] py-10 sm:py-14 md:py-20">
        {/* Abstract glow mesh background elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="container relative z-10 mx-auto px-3 min-[360px]:px-4">
          <div className="text-center mb-12 animate-fade-up">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Browse by <span className="text-primary">Category</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Explore job opportunities across different industries
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
            {jobCategories.map((category, index) => (
              <Card
                key={category.name}
                className="group cursor-pointer rounded-lg border border-border/50 bg-card text-center shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10 animate-fade-up"
                style={{animationDelay: `${index * 0.1}s`}}
                onClick={() => navigate(`/jobs?category=${encodeURIComponent(category.name)}`)}
              >
                <CardContent className="flex flex-col items-center p-4 sm:p-5 lg:p-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-muted transition-transform duration-300 group-hover:scale-110 sm:mb-4 sm:h-16 sm:w-16">
                    <span className="text-3xl sm:text-4xl" role="img" aria-label={category.name}>
                      {category.icon}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors duration-300">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">{category.count}</span> jobs
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-muted-foreground">
              Success stories from job seekers and employers
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name}>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <Avatar className="mr-3">
                      <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role} at {testimonial.company}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Companies */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Companies</h2>
            <p className="text-muted-foreground">Discover top employers hiring in Albania</p>
          </div>
          <FeaturedCompanies />
          <div className="text-center mt-8">
            <Button variant="outline" onClick={() => navigate('/companies')}>
              Browse All Companies
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Career Journey?
          </h2>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of job seekers and employers who trust jobs.al for their career needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              userRole === "employer" ? (
                <>
                  <Button size="lg" variant="secondary" onClick={() => navigate('/dashboard')}>
                    <Building2 className="mr-2 h-4 w-4" />
                    Post a Job
                  </Button>
                  <Button size="lg" variant="outline" className="bg-white text-primary border-white hover:bg-white/90" onClick={() => navigate('/jobs')}>
                    <Users className="mr-2 h-4 w-4" />
                    Browse Jobs
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" variant="secondary" onClick={() => navigate('/jobs')}>
                    <Users className="mr-2 h-4 w-4" />
                    Find Jobs
                  </Button>
                  <Button size="lg" variant="outline" className="bg-white text-primary border-white hover:bg-white/90" onClick={() => navigate('/resume-builder')}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Build Resume
                  </Button>
                </>
              )
            ) : (
              <>
                <Button size="lg" variant="secondary" onClick={() => navigate('/jobs')}>
                  <Users className="mr-2 h-4 w-4" />
                  Find Jobs
                </Button>
                <Button size="lg" variant="outline" className="bg-white text-primary border-white hover:bg-white/90" onClick={() => navigate('/auth?type=employer')}>
                  <Building2 className="mr-2 h-4 w-4" />
                  Post a Job
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Top Employers - Revenue Driver */}
      <TopEmployers />

      {/* Latest Blog Posts */}
      <BlogSection />

    </div>
    </>
  );
};

export default Index;
