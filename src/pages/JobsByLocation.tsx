import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Briefcase, MapPin, Building2, Clock, DollarSign, Search, ArrowRight, Users, Home, Car } from "lucide-react";
import Navigation from "@/components/Navigation";

const CITY_DATA: Record<string, {
  title: string;
  description: string;
  population: string;
  avgSalary: string;
  topIndustries: string[];
  costOfLiving: string;
  commute: string;
}> = {
  tirana: {
    title: "Jobs in Tirana",
    description: "Albania's capital and largest city. Home to most corporate headquarters, tech startups, and international companies.",
    population: "900,000+",
    avgSalary: "€600 - €1,500/month",
    topIndustries: ["Technology", "Finance", "Marketing", "Consulting"],
    costOfLiving: "€800-1,200/month",
    commute: "20-40 min average"
  },
  durres: {
    title: "Jobs in Durres",
    description: "Albania's main port city and second largest urban center. Strong in logistics, tourism, and manufacturing.",
    population: "200,000+",
    avgSalary: "€450 - €1,200/month",
    topIndustries: ["Logistics", "Tourism", "Manufacturing", "Retail"],
    costOfLiving: "€600-900/month",
    commute: "15-30 min average"
  },
  vlore: {
    title: "Jobs in Vlore",
    description: "Coastal city with growing tourism and service sectors. Popular destination for hospitality careers.",
    population: "130,000+",
    avgSalary: "€400 - €1,000/month",
    topIndustries: ["Tourism", "Hospitality", "Retail", "Healthcare"],
    costOfLiving: "€500-800/month",
    commute: "10-20 min average"
  },
  shkoder: {
    title: "Jobs in Shkoder",
    description: "Historic northern city with growing business sector. Known for education and cultural industries.",
    population: "140,000+",
    avgSalary: "€400 - €900/month",
    topIndustries: ["Education", "Manufacturing", "Agriculture", "Tourism"],
    costOfLiving: "€450-700/month",
    commute: "10-25 min average"
  },
  elbasan: {
    title: "Jobs in Elbasan",
    description: "Industrial hub in central Albania. Strong manufacturing and education sector presence.",
    population: "140,000+",
    avgSalary: "€400 - €900/month",
    topIndustries: ["Manufacturing", "Education", "Healthcare", "Construction"],
    costOfLiving: "€450-700/month",
    commute: "10-20 min average"
  },
  korce: {
    title: "Jobs in Korce",
    description: "Eastern Albanian city known for culture and brewing. Growing service and tourism sectors.",
    population: "75,000+",
    avgSalary: "€380 - €850/month",
    topIndustries: ["Tourism", "Agriculture", "Manufacturing", "Education"],
    costOfLiving: "€400-650/month",
    commute: "10-15 min average"
  },
  fier: {
    title: "Jobs in Fier",
    description: "Industrial city with oil refineries and agriculture. Key economic center in southwestern Albania.",
    population: "120,000+",
    avgSalary: "€400 - €950/month",
    topIndustries: ["Oil & Gas", "Agriculture", "Manufacturing", "Retail"],
    costOfLiving: "€450-700/month",
    commute: "10-20 min average"
  },
  berat: {
    title: "Jobs in Berat",
    description: "UNESCO World Heritage city. Growing tourism industry and traditional crafts.",
    population: "60,000+",
    avgSalary: "€350 - €800/month",
    topIndustries: ["Tourism", "Hospitality", "Agriculture", "Crafts"],
    costOfLiving: "€400-600/month",
    commute: "10-15 min average"
  }
};

export default function JobsByLocation() {
  const { city } = useParams<{ city: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const cityKey = city?.toLowerCase() || "";
  const cityInfo = CITY_DATA[cityKey] || {
    title: `Jobs in ${city}`,
    description: `Find job opportunities in ${city}, Albania.`,
    population: "N/A",
    avgSalary: "Varies",
    topIndustries: [],
    costOfLiving: "N/A",
    commute: "N/A"
  };

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs-by-location", city],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(`*, companies (name, logo_url, location)`)
        .eq("is_active", true)
        .ilike("location", `%${city}%`)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: !!city
  });

  const { data: topCompanies } = useQuery({
    queryKey: ["companies-by-location", city],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, slug, logo_url, industry")
        .ilike("location", `%${city}%`)
        .limit(5);
      return data || [];
    },
    enabled: !!city
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

  const capitalizedCity = city ? city.charAt(0).toUpperCase() + city.slice(1) : "";

  return (
    <>
      <Helmet>
        <title>{cityInfo.title}, Albania | Jobs.al</title>
        <meta name="description" content={`Find jobs in ${capitalizedCity}, Albania. ${cityInfo.description} Browse ${jobs?.length || 0}+ active positions.`} />
        <meta name="keywords" content={`jobs ${city}, ${city} careers, work in ${city}, ${city} vacancies, employment ${city} albania`} />
        <link rel="canonical" href={`https://jobs.al/jobs/location/${city?.toLowerCase()}`} />
        <meta property="og:title" content={`${cityInfo.title}, Albania | Jobs.al`} />
        <meta property="og:description" content={cityInfo.description} />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": cityInfo.title,
            "description": cityInfo.description,
            "url": `https://jobs.al/jobs/location/${city?.toLowerCase()}`,
            "about": {
              "@type": "Place",
              "name": capitalizedCity,
              "address": {
                "@type": "PostalAddress",
                "addressLocality": capitalizedCity,
                "addressCountry": "Albania"
              }
            }
          })}
        </script>
      </Helmet>

      <Navigation />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-hero py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="h-10 w-10 text-white" />
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white">
                  {cityInfo.title}, Albania
                </h1>
                <p className="text-xl text-white/90 mt-2">
                  {jobs?.length || 0} open positions available
                </p>
              </div>
            </div>
            <p className="text-white/80 max-w-3xl mt-4">
              {cityInfo.description}
            </p>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="border-b bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">{cityInfo.population}</div>
                  <div className="text-sm text-muted-foreground">Population</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">{cityInfo.avgSalary}</div>
                  <div className="text-sm text-muted-foreground">Avg. Salary</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Home className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">{cityInfo.costOfLiving}</div>
                  <div className="text-sm text-muted-foreground">Cost of Living</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">{cityInfo.commute}</div>
                  <div className="text-sm text-muted-foreground">Avg. Commute</div>
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
              placeholder={`Search jobs in ${capitalizedCity}...`}
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
              <h2 className="text-2xl font-bold mb-6">Latest Jobs in {capitalizedCity}</h2>
              
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
                  <p className="text-muted-foreground">No jobs found in {capitalizedCity} at the moment.</p>
                  <Link to="/jobs">
                    <Button variant="outline" className="mt-4">Browse All Jobs</Button>
                  </Link>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Top Industries */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Industries in {capitalizedCity}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {cityInfo.topIndustries.map(industry => (
                      <Link key={industry} to={`/jobs/category/${industry.toLowerCase()}`}>
                        <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                          {industry}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Companies */}
              {topCompanies && topCompanies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Employers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {topCompanies.map(company => (
                      <Link 
                        key={company.id}
                        to={`/companies/${company.slug}`}
                        className="flex items-center gap-3 hover:text-primary transition-colors"
                      >
                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                          {company.logo_url ? (
                            <img src={company.logo_url} alt={company.name} className="w-6 h-6 object-contain" />
                          ) : (
                            <Building2 className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{company.name}</p>
                          <p className="text-xs text-muted-foreground">{company.industry}</p>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* CTA */}
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Hiring in {capitalizedCity}?</h3>
                  <p className="text-sm opacity-90 mb-4">
                    Post your job and reach thousands of qualified candidates in {capitalizedCity}.
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
              <h2 className="text-2xl font-bold mb-4">Working in {capitalizedCity}, Albania</h2>
              <p className="text-muted-foreground">
                {capitalizedCity} is one of Albania's key employment hubs, with a population of {cityInfo.population} 
                and a diverse job market spanning {cityInfo.topIndustries.join(', ')}. Average salaries range from 
                {cityInfo.avgSalary}, with a cost of living around {cityInfo.costOfLiving} per month.
              </p>
              <p className="text-muted-foreground">
                Whether you're looking for your first job or advancing your career, {capitalizedCity} offers 
                excellent opportunities across multiple industries. Jobs.al connects you with the top employers 
                in the city, helping you find the perfect role to match your skills and career goals.
              </p>
              <h3 className="text-xl font-semibold mt-6 mb-3">Why Work in {capitalizedCity}?</h3>
              <ul className="text-muted-foreground list-disc pl-6 space-y-2">
                <li>Growing economy with diverse job opportunities</li>
                <li>Competitive salaries relative to cost of living</li>
                <li>Average commute time of just {cityInfo.commute}</li>
                <li>Strong presence of {cityInfo.topIndustries[0]} and {cityInfo.topIndustries[1]} sectors</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
