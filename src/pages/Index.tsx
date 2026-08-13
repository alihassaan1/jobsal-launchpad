import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MapPin, Building2, Users, TrendingUp, Star, ArrowRight, Briefcase, Clock, DollarSign, Sparkles, LogOut, User, Calendar, Check, ChevronsUpDown } from "lucide-react";
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
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";
import { ALBANIAN_CITIES } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Latest from our blog</h2>
          <p className="text-muted-foreground">Expert career advice and job market insights</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {latestPosts.map(post => (
            <Card 
              key={post.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/blog/${post.slug}`)}
            >
              {post.featured_image && (
                <div className="h-48 overflow-hidden bg-muted">
                  <img 
                    src={post.featured_image} 
                    alt={post.title}
                    loading="lazy"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <CardHeader>
                <Badge variant="secondary" className="w-fit mb-2">{post.category.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Badge>
                <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                <CardDescription className="line-clamp-2">{post.excerpt}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(post.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
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
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
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
  }, []);

  const fetchFeaturedJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs_public')
        .select(`
          *,
          companies:company_id (
            name,
            logo_url,
            location
          )
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setFeaturedJobs(data || []);
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
      <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-20 bg-primary overflow-hidden">
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="animate-fade-up">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Find Your Dream Job in 
              <span className="block bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Albania
              </span>
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Discover thousands of job opportunities from top companies across Albania. Your career journey starts here.
            </p>
          </div>
          
          {/* Enhanced Search Bar */}
          <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur p-6 rounded-2xl shadow-2xl border border-white/20">
            <div className="grid md:grid-cols-3 gap-4">
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
                <PopoverContent className="w-[280px] p-0 bg-white z-50" align="start">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 text-white">
            <div className="animate-fade-up hover:scale-105 transition-transform duration-300" style={{animationDelay: '0.2s'}}>
              <div className="text-4xl font-bold">1,200+</div>
              <div className="text-white/80">Active Jobs</div>
            </div>
            <div className="animate-fade-up hover:scale-105 transition-transform duration-300" style={{animationDelay: '0.4s'}}>
              <div className="text-4xl font-bold">500+</div>
              <div className="text-white/80">Companies</div>
            </div>
            <div className="animate-fade-up hover:scale-105 transition-transform duration-300" style={{animationDelay: '0.6s'}}>
              <div className="text-4xl font-bold">10,000+</div>
              <div className="text-white/80">Job Seekers</div>
            </div>
            <div className="animate-fade-up hover:scale-105 transition-transform duration-300" style={{animationDelay: '0.8s'}}>
              <div className="text-4xl font-bold">95%</div>
              <div className="text-white/80">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
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
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarImage src={job.companies?.logo_url} alt={job.companies?.name} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {job.companies?.name?.charAt(0) || 'J'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-foreground">{job.companies?.name}</h3>
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
                      <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
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

      {/* Job Categories */}
      <section className="py-16 md:py-20 relative overflow-hidden bg-primary/[0.04]">
        {/* Abstract glow mesh background elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12 animate-fade-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-foreground">
              Browse by <span className="text-primary">Category</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Explore job opportunities across different industries
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {jobCategories.map((category, index) => (
              <Card
                key={category.name}
                className="text-center cursor-pointer group bg-card border border-border/50 shadow-lg hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 rounded-2xl animate-fade-up"
                style={{animationDelay: `${index * 0.1}s`}}
                onClick={() => navigate(`/jobs?category=${encodeURIComponent(category.name)}`)}
              >
                <CardContent className="p-6 flex flex-col items-center">
                  <div className="w-16 h-16 mb-4 flex items-center justify-center bg-muted rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <span className="text-4xl" role="img" aria-label={category.name}>
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

      {/* Footer */}
      <Footer />
    </div>
    </>
  );
};

export default Index;
