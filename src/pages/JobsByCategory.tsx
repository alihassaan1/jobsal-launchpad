import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Briefcase, MapPin, Building2, Clock, DollarSign, Search, ArrowRight, TrendingUp, Users, Star } from "lucide-react";
import Navigation from "@/components/Navigation";

const CATEGORY_DATA: Record<string, { 
  title: string; 
  description: string; 
  icon: string;
  skills: string[];
  salaryRange: string;
  growth: string;
}> = {
  technology: {
    title: "Technology Jobs",
    description: "Explore IT, software development, and tech opportunities across Albania. From startups to established companies, find your next tech role.",
    icon: "💻",
    skills: ["JavaScript", "Python", "React", "Node.js", "SQL", "Cloud Computing"],
    salaryRange: "€800 - €3,500/month",
    growth: "+25% YoY"
  },
  marketing: {
    title: "Marketing Jobs",
    description: "Discover marketing, digital marketing, and communications roles. Help Albanian businesses grow their brand and reach customers.",
    icon: "📈",
    skills: ["Digital Marketing", "SEO", "Content Marketing", "Social Media", "Analytics"],
    salaryRange: "€500 - €2,000/month",
    growth: "+18% YoY"
  },
  finance: {
    title: "Finance Jobs",
    description: "Find accounting, banking, and financial services positions. Join Albania's growing financial sector.",
    icon: "💰",
    skills: ["Financial Analysis", "Accounting", "Excel", "SAP", "Risk Management"],
    salaryRange: "€600 - €2,500/month",
    growth: "+12% YoY"
  },
  healthcare: {
    title: "Healthcare Jobs",
    description: "Browse medical, nursing, and healthcare administration roles. Make a difference in Albanian healthcare.",
    icon: "🏥",
    skills: ["Patient Care", "Medical Knowledge", "Communication", "Empathy"],
    salaryRange: "€500 - €2,000/month",
    growth: "+15% YoY"
  },
  education: {
    title: "Education Jobs",
    description: "Teaching, training, and educational administration positions across Albania's schools and universities.",
    icon: "📚",
    skills: ["Teaching", "Curriculum Development", "Communication", "Patience"],
    salaryRange: "€400 - €1,200/month",
    growth: "+8% YoY"
  },
  sales: {
    title: "Sales Jobs",
    description: "Sales, business development, and account management opportunities with top Albanian companies.",
    icon: "💼",
    skills: ["Negotiation", "CRM", "Communication", "Target Achievement"],
    salaryRange: "€500 - €2,500/month",
    growth: "+20% YoY"
  },
  engineering: {
    title: "Engineering Jobs",
    description: "Civil, mechanical, electrical, and other engineering roles across Albania's infrastructure projects.",
    icon: "⚙️",
    skills: ["AutoCAD", "Project Management", "Technical Drawing", "Problem Solving"],
    salaryRange: "€700 - €2,200/month",
    growth: "+14% YoY"
  },
  design: {
    title: "Design Jobs",
    description: "Graphic design, UX/UI, and creative roles. Bring your creative vision to Albanian brands.",
    icon: "🎨",
    skills: ["Figma", "Adobe Creative Suite", "UI/UX", "Typography"],
    salaryRange: "€500 - €1,800/month",
    growth: "+22% YoY"
  },
  hospitality: {
    title: "Hospitality Jobs",
    description: "Hotels, restaurants, tourism, and service industry positions across Albania's growing tourism sector.",
    icon: "🏨",
    skills: ["Customer Service", "Languages", "Flexibility", "Communication"],
    salaryRange: "€350 - €1,200/month",
    growth: "+30% YoY"
  },
  construction: {
    title: "Construction Jobs",
    description: "Building, architecture, and construction management roles in Albania's booming construction industry.",
    icon: "🏗️",
    skills: ["Project Management", "Safety Standards", "Technical Knowledge"],
    salaryRange: "€500 - €1,800/month",
    growth: "+16% YoY"
  }
};

export default function JobsByCategory() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const categoryInfo = CATEGORY_DATA[category?.toLowerCase() || ""] || {
    title: `${category} Jobs`,
    description: `Find ${category} jobs across Albania.`,
    icon: "💼",
    skills: [],
    salaryRange: "Varies",
    growth: "N/A"
  };

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs-by-category", category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(`*, companies (name, logo_url, location)`)
        .eq("is_active", true)
        .ilike("category", `%${category}%`)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: !!category
  });

  const { data: relatedPosts } = useQuery({
    queryKey: ["related-posts", category],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("id, title, slug, excerpt")
        .eq("is_published", true)
        .or(`category.ilike.%${category}%,tags.cs.{${category?.toLowerCase()}}`)
        .limit(3);
      return data || [];
    },
    enabled: !!category
  });

  const filteredJobs = jobs?.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.companies?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatSalary = (min: number | null, max: number | null, currency: string) => {
    if (!min && !max) return "Negotiable";
    if (min && max) return `${currency}${min.toLocaleString()} - ${currency}${max.toLocaleString()}`;
    if (min) return `From ${currency}${min.toLocaleString()}`;
    return `Up to ${currency}${max?.toLocaleString()}`;
  };

  return (
    <>
      <Helmet>
        <title>{categoryInfo.title} in Albania | Jobs.al</title>
        <meta name="description" content={`Find ${category} jobs in Albania. ${categoryInfo.description} Browse ${jobs?.length || 0}+ active positions.`} />
        <meta name="keywords" content={`${category} jobs albania, ${category} careers, ${category} vacancies albania, hire ${category} professionals`} />
        <link rel="canonical" href={`https://jobs.al/jobs/category/${category?.toLowerCase()}`} />
        <meta property="og:title" content={`${categoryInfo.title} in Albania | Jobs.al`} />
        <meta property="og:description" content={categoryInfo.description} />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": categoryInfo.title,
            "description": categoryInfo.description,
            "url": `https://jobs.al/jobs/category/${category?.toLowerCase()}`,
            "isPartOf": {
              "@type": "WebSite",
              "name": "Jobs.al",
              "url": "https://jobs.al"
            }
          })}
        </script>
      </Helmet>

      <Navigation />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-hero py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">{categoryInfo.icon}</span>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white">
                  {categoryInfo.title} in Albania
                </h1>
                <p className="text-xl text-white/90 mt-2">
                  {jobs?.length || 0} open positions available
                </p>
              </div>
            </div>
            <p className="text-white/80 max-w-3xl mt-4">
              {categoryInfo.description}
            </p>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="border-b bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">{jobs?.length || 0}+</div>
                  <div className="text-sm text-muted-foreground">Open Jobs</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">{categoryInfo.salaryRange}</div>
                  <div className="text-sm text-muted-foreground">Salary Range</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">{categoryInfo.growth}</div>
                  <div className="text-sm text-muted-foreground">Job Growth</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">High</div>
                  <div className="text-sm text-muted-foreground">Demand</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search */}
        <section className="container mx-auto px-4 py-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={`Search ${category} jobs...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </section>

        <div className="container mx-auto px-4 pb-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Job Listings */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-6">Latest {category} Jobs</h2>
              
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader className="h-24 bg-muted" />
                    </Card>
                  ))}
                </div>
              ) : filteredJobs && filteredJobs.length > 0 ? (
                <div className="space-y-4">
                  {filteredJobs.map((job: any) => (
                    <Card 
                      key={job.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => navigate(`/jobs/${job.slug}`)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              {job.companies?.logo_url ? (
                                <img src={job.companies.logo_url} alt={job.companies.name} className="w-8 h-8 object-contain" />
                              ) : (
                                <Building2 className="h-6 w-6 text-primary" />
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{job.title}</CardTitle>
                              <CardDescription className="flex flex-wrap gap-3 mt-1">
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {job.companies?.name}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {job.location}
                                </span>
                              </CardDescription>
                            </div>
                          </div>
                          <Badge>{job.job_type.replace("_", " ")}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Posted {new Date(job.created_at).toLocaleDateString()}
                          </span>
                          {job.is_salary_visible && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No {category} jobs found at the moment.</p>
                  <Link to="/jobs">
                    <Button variant="outline" className="mt-4">Browse All Jobs</Button>
                  </Link>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Skills in Demand */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Skills in Demand</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {categoryInfo.skills.map(skill => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Related Articles */}
              {relatedPosts && relatedPosts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Career Resources</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {relatedPosts.map(post => (
                      <Link 
                        key={post.id} 
                        to={`/blog/${post.slug}`}
                        className="block hover:text-primary transition-colors"
                      >
                        <p className="font-medium text-sm line-clamp-2">{post.title}</p>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* CTA */}
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Looking to hire?</h3>
                  <p className="text-sm opacity-90 mb-4">
                    Post your {category} job and reach thousands of qualified candidates.
                  </p>
                  <Link to="/pricing">
                    <Button variant="secondary" className="w-full">
                      Post a Job
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* SEO Content Section */}
        <section className="bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto prose prose-lg">
              <h2 className="text-2xl font-bold mb-4">{category} Careers in Albania</h2>
              <p className="text-muted-foreground">
                The {category?.toLowerCase()} sector in Albania is experiencing significant growth, 
                offering excellent career opportunities for both entry-level and experienced professionals. 
                Whether you're looking for your first job or seeking to advance your career, 
                Jobs.al connects you with the best {category?.toLowerCase()} employers in the country.
              </p>
              <p className="text-muted-foreground">
                Top skills in demand include {categoryInfo.skills.slice(0, 3).join(', ')}, with salaries 
                ranging from {categoryInfo.salaryRange}. The industry is growing at {categoryInfo.growth}, 
                making it an excellent time to explore {category?.toLowerCase()} careers in Albania.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
