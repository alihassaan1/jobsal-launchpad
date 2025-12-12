import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Briefcase, MapPin, Building2, Clock, DollarSign, Search, ArrowRight, TrendingUp, Users } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useLanguage } from "@/contexts/LanguageContext";

const CATEGORY_DATA: Record<string, { 
  title: { sq: string; en: string };
  description: { sq: string; en: string };
  icon: string;
  skills: string[];
  salaryRange: string;
  growth: string;
}> = {
  technology: {
    title: { sq: "Punë në Teknologji", en: "Technology Jobs" },
    description: { 
      sq: "Eksploro mundësitë në IT, zhvillim software dhe teknologji në Shqipëri.", 
      en: "Explore IT, software development, and tech opportunities across Albania." 
    },
    icon: "💻",
    skills: ["JavaScript", "Python", "React", "Node.js", "SQL", "Cloud Computing"],
    salaryRange: "€800 - €3,500/month",
    growth: "+25% YoY"
  },
  marketing: {
    title: { sq: "Punë në Marketing", en: "Marketing Jobs" },
    description: { 
      sq: "Zbulo role në marketing, marketing dixhital dhe komunikim.", 
      en: "Discover marketing, digital marketing, and communications roles." 
    },
    icon: "📈",
    skills: ["Digital Marketing", "SEO", "Content Marketing", "Social Media", "Analytics"],
    salaryRange: "€500 - €2,000/month",
    growth: "+18% YoY"
  },
  finance: {
    title: { sq: "Punë në Financa", en: "Finance Jobs" },
    description: { 
      sq: "Gjej pozicione në kontabilitet, banka dhe shërbime financiare.", 
      en: "Find accounting, banking, and financial services positions." 
    },
    icon: "💰",
    skills: ["Financial Analysis", "Accounting", "Excel", "SAP", "Risk Management"],
    salaryRange: "€600 - €2,500/month",
    growth: "+12% YoY"
  },
  healthcare: {
    title: { sq: "Punë në Shëndetësi", en: "Healthcare Jobs" },
    description: { 
      sq: "Shfleto role mjekësore, infermierore dhe administrim shëndetësor.", 
      en: "Browse medical, nursing, and healthcare administration roles." 
    },
    icon: "🏥",
    skills: ["Patient Care", "Medical Knowledge", "Communication", "Empathy"],
    salaryRange: "€500 - €2,000/month",
    growth: "+15% YoY"
  },
  education: {
    title: { sq: "Punë në Arsim", en: "Education Jobs" },
    description: { 
      sq: "Pozicione në mësimdhënie, trajnim dhe administrim arsimor.", 
      en: "Teaching, training, and educational administration positions." 
    },
    icon: "📚",
    skills: ["Teaching", "Curriculum Development", "Communication", "Patience"],
    salaryRange: "€400 - €1,200/month",
    growth: "+8% YoY"
  },
  sales: {
    title: { sq: "Punë në Shitje", en: "Sales Jobs" },
    description: { 
      sq: "Mundësi në shitje, zhvillim biznesi dhe menaxhim llogarish.", 
      en: "Sales, business development, and account management opportunities." 
    },
    icon: "💼",
    skills: ["Negotiation", "CRM", "Communication", "Target Achievement"],
    salaryRange: "€500 - €2,500/month",
    growth: "+20% YoY"
  },
  engineering: {
    title: { sq: "Punë në Inxhinieri", en: "Engineering Jobs" },
    description: { 
      sq: "Role në inxhinieri civile, mekanike dhe elektrike.", 
      en: "Civil, mechanical, electrical, and other engineering roles." 
    },
    icon: "⚙️",
    skills: ["AutoCAD", "Project Management", "Technical Drawing", "Problem Solving"],
    salaryRange: "€700 - €2,200/month",
    growth: "+14% YoY"
  },
  design: {
    title: { sq: "Punë në Dizajn", en: "Design Jobs" },
    description: { 
      sq: "Role në dizajn grafik, UX/UI dhe krijimtari.", 
      en: "Graphic design, UX/UI, and creative roles." 
    },
    icon: "🎨",
    skills: ["Figma", "Adobe Creative Suite", "UI/UX", "Typography"],
    salaryRange: "€500 - €1,800/month",
    growth: "+22% YoY"
  },
  hospitality: {
    title: { sq: "Punë në Hoteleri & Turizëm", en: "Hospitality Jobs" },
    description: { 
      sq: "Pozicione në hotele, restorante dhe industrinë e turizmit.", 
      en: "Hotels, restaurants, tourism, and service industry positions." 
    },
    icon: "🏨",
    skills: ["Customer Service", "Languages", "Flexibility", "Communication"],
    salaryRange: "€350 - €1,200/month",
    growth: "+30% YoY"
  },
  construction: {
    title: { sq: "Punë në Ndërtim", en: "Construction Jobs" },
    description: { 
      sq: "Role në ndërtim, arkitekturë dhe menaxhim projektesh.", 
      en: "Building, architecture, and construction management roles." 
    },
    icon: "🏗️",
    skills: ["Project Management", "Safety Standards", "Technical Knowledge"],
    salaryRange: "€500 - €1,800/month",
    growth: "+16% YoY"
  },
  administration: {
    title: { sq: "Punë në Administrate", en: "Administration Jobs" },
    description: { 
      sq: "Role administrative dhe menaxhimi zyre.", 
      en: "Administrative and office management roles." 
    },
    icon: "📋",
    skills: ["MS Office", "Organization", "Communication", "Time Management"],
    salaryRange: "€400 - €1,000/month",
    growth: "+10% YoY"
  },
  banking: {
    title: { sq: "Punë në Banka & Sigurime", en: "Banking & Insurance Jobs" },
    description: { 
      sq: "Pozicione në banka, sigurime dhe shërbime financiare.", 
      en: "Banking, insurance, and financial services positions." 
    },
    icon: "🏦",
    skills: ["Banking Operations", "Customer Service", "Sales", "Compliance"],
    salaryRange: "€600 - €2,000/month",
    growth: "+12% YoY"
  },
  callcenter: {
    title: { sq: "Punë në Call Center", en: "Call Center Jobs" },
    description: { 
      sq: "Pozicione në shërbim klienti dhe mbështetje telefonike.", 
      en: "Customer service and phone support positions." 
    },
    icon: "📞",
    skills: ["Communication", "Languages", "Problem Solving", "Patience"],
    salaryRange: "€350 - €800/month",
    growth: "+25% YoY"
  },
  horeka: {
    title: { sq: "Punë në HOREKA", en: "HOREKA Jobs" },
    description: { 
      sq: "Pozicione në hotele, restorante, kafene dhe katering.", 
      en: "Hotels, restaurants, cafes, and catering positions." 
    },
    icon: "🍽️",
    skills: ["Hospitality", "Customer Service", "Food & Beverage", "Languages"],
    salaryRange: "€350 - €1,000/month",
    growth: "+28% YoY"
  },
  it: {
    title: { sq: "Punë në IT & Telekomunikacion", en: "IT & Telecom Jobs" },
    description: { 
      sq: "Pozicione në teknologji informacioni dhe telekomunikacion.", 
      en: "Information technology and telecommunications positions." 
    },
    icon: "📡",
    skills: ["Networking", "System Administration", "Cloud", "Cybersecurity"],
    salaryRange: "€700 - €3,000/month",
    growth: "+20% YoY"
  },
  legal: {
    title: { sq: "Punë Juridike", en: "Legal Jobs" },
    description: { 
      sq: "Pozicione në drejtësi, ligj dhe konsulencë juridike.", 
      en: "Legal, law, and juridical consulting positions." 
    },
    icon: "⚖️",
    skills: ["Legal Research", "Contract Law", "Compliance", "Communication"],
    salaryRange: "€600 - €2,500/month",
    growth: "+10% YoY"
  },
  accounting: {
    title: { sq: "Punë në Kontabilitet", en: "Accounting Jobs" },
    description: { 
      sq: "Pozicione në kontabilitet, audit dhe financa.", 
      en: "Accounting, audit, and finance positions." 
    },
    icon: "📊",
    skills: ["Accounting", "Excel", "ERP Systems", "Tax Knowledge"],
    salaryRange: "€500 - €1,800/month",
    growth: "+12% YoY"
  },
  logistics: {
    title: { sq: "Punë në Logjistikë & Transport", en: "Logistics & Transport Jobs" },
    description: { 
      sq: "Pozicione në logjistikë, transport dhe zinxhir furnizimi.", 
      en: "Logistics, transport, and supply chain positions." 
    },
    icon: "🚚",
    skills: ["Supply Chain", "Warehouse Management", "ERP", "Planning"],
    salaryRange: "€450 - €1,500/month",
    growth: "+15% YoY"
  },
  production: {
    title: { sq: "Punë në Prodhim & Industri", en: "Production & Industry Jobs" },
    description: { 
      sq: "Pozicione në prodhim, industri dhe fabrika.", 
      en: "Production, industry, and manufacturing positions." 
    },
    icon: "🏭",
    skills: ["Quality Control", "Machine Operation", "Safety", "Lean Manufacturing"],
    salaryRange: "€400 - €1,200/month",
    growth: "+8% YoY"
  },
  hr: {
    title: { sq: "Punë në Burime Njerëzore", en: "Human Resources Jobs" },
    description: { 
      sq: "Pozicione në menaxhim burimesh njerëzore dhe rekrutim.", 
      en: "Human resources management and recruitment positions." 
    },
    icon: "👥",
    skills: ["Recruitment", "Training", "Employee Relations", "HRIS"],
    salaryRange: "€500 - €1,800/month",
    growth: "+14% YoY"
  },
  customerservice: {
    title: { sq: "Punë në Shërbim Klienti", en: "Customer Service Jobs" },
    description: { 
      sq: "Pozicione në mbështetje dhe shërbim klienti.", 
      en: "Customer support and service positions." 
    },
    icon: "🎧",
    skills: ["Communication", "Problem Solving", "CRM Software", "Patience"],
    salaryRange: "€350 - €900/month",
    growth: "+18% YoY"
  },
  retail: {
    title: { sq: "Punë në Shitje me Pakicë", en: "Retail Jobs" },
    description: { 
      sq: "Pozicione në dyqane, shitje me pakicë dhe tregti.", 
      en: "Store, retail, and commerce positions." 
    },
    icon: "🛒",
    skills: ["Sales", "Customer Service", "Inventory", "Visual Merchandising"],
    salaryRange: "€350 - €1,000/month",
    growth: "+12% YoY"
  },
  realestate: {
    title: { sq: "Punë në Pasuri të Patundshme", en: "Real Estate Jobs" },
    description: { 
      sq: "Pozicione në pasuri të patundshme dhe agjenci imobiliare.", 
      en: "Real estate and property agency positions." 
    },
    icon: "🏠",
    skills: ["Sales", "Negotiation", "Market Knowledge", "Customer Relations"],
    salaryRange: "€500 - €2,000/month",
    growth: "+20% YoY"
  },
  management: {
    title: { sq: "Punë në Menaxhim", en: "Management Jobs" },
    description: { 
      sq: "Pozicione drejtimi dhe menaxhimi.", 
      en: "Management and leadership positions." 
    },
    icon: "👔",
    skills: ["Leadership", "Strategic Planning", "Team Management", "Decision Making"],
    salaryRange: "€1,000 - €4,000/month",
    growth: "+15% YoY"
  },
  media: {
    title: { sq: "Punë në Media & Gazetari", en: "Media & Journalism Jobs" },
    description: { 
      sq: "Pozicione në media, gazetari dhe komunikim.", 
      en: "Media, journalism, and communications positions." 
    },
    icon: "📺",
    skills: ["Writing", "Editing", "Social Media", "Video Production"],
    salaryRange: "€400 - €1,500/month",
    growth: "+10% YoY"
  }
};

export default function JobsByCategory() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");

  const categoryKey = category?.toLowerCase().replace(/[^a-z]/g, '') || "";
  const categoryInfo = CATEGORY_DATA[categoryKey] || {
    title: { sq: `Punë në ${category}`, en: `${category} Jobs` },
    description: { sq: `Gjej punë ${category} në Shqipëri.`, en: `Find ${category} jobs across Albania.` },
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
    if (!min && !max) return language === 'sq' ? "E negociueshme" : "Negotiable";
    if (min && max) return `${currency}${min.toLocaleString()} - ${currency}${max.toLocaleString()}`;
    if (min) return `From ${currency}${min.toLocaleString()}`;
    return `Up to ${currency}${max?.toLocaleString()}`;
  };

  return (
    <>
      <Helmet>
        <title>{categoryInfo.title[language]} {language === 'sq' ? 'në Shqipëri' : 'in Albania'} | Jobs.al</title>
        <meta name="description" content={`${categoryInfo.description[language]} ${language === 'sq' ? 'Shfleto' : 'Browse'} ${jobs?.length || 0}+ ${language === 'sq' ? 'pozicione aktive' : 'active positions'}.`} />
        <link rel="canonical" href={`https://jobs.al/jobs/category/${category?.toLowerCase()}`} />
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
                  {categoryInfo.title[language]} {language === 'sq' ? 'në Shqipëri' : 'in Albania'}
                </h1>
                <p className="text-xl text-white/90 mt-2">
                  {jobs?.length || 0} {language === 'sq' ? 'pozicione të hapura' : 'open positions available'}
                </p>
              </div>
            </div>
            <p className="text-white/80 max-w-3xl mt-4">
              {categoryInfo.description[language]}
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
                  <div className="text-sm text-muted-foreground">{language === 'sq' ? 'Punë të Hapura' : 'Open Jobs'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">{categoryInfo.salaryRange}</div>
                  <div className="text-sm text-muted-foreground">{language === 'sq' ? 'Rrogë' : 'Salary Range'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">{categoryInfo.growth}</div>
                  <div className="text-sm text-muted-foreground">{language === 'sq' ? 'Rritje' : 'Job Growth'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">{language === 'sq' ? 'E Lartë' : 'High'}</div>
                  <div className="text-sm text-muted-foreground">{language === 'sq' ? 'Kërkesë' : 'Demand'}</div>
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
              placeholder={language === 'sq' ? `Kërko punë ${category}...` : `Search ${category} jobs...`}
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
              <h2 className="text-2xl font-bold mb-6">
                {language === 'sq' ? `Punë të Fundit në ${category}` : `Latest ${category} Jobs`}
              </h2>
              
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
                            {language === 'sq' ? 'Postuar' : 'Posted'} {new Date(job.created_at).toLocaleDateString()}
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
                  <p className="text-muted-foreground">
                    {language === 'sq' ? `Nuk u gjetën punë ${category} në këtë moment.` : `No ${category} jobs found at the moment.`}
                  </p>
                  <Link to="/jobs">
                    <Button variant="outline" className="mt-4">
                      {language === 'sq' ? 'Shfleto Të Gjitha Punët' : 'Browse All Jobs'}
                    </Button>
                  </Link>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Skills in Demand */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{language === 'sq' ? 'Aftësi të Kërkuara' : 'Skills in Demand'}</CardTitle>
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
                    <CardTitle className="text-lg">{language === 'sq' ? 'Burime Karriere' : 'Career Resources'}</CardTitle>
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
                  <h3 className="font-semibold mb-2">
                    {language === 'sq' ? 'Po kërkoni të punësoni?' : 'Looking to hire?'}
                  </h3>
                  <p className="text-sm opacity-90 mb-4">
                    {language === 'sq' 
                      ? `Postoni punën tuaj ${category} dhe arrini mijëra kandidatë të kualifikuar.`
                      : `Post your ${category} job and reach thousands of qualified candidates.`
                    }
                  </p>
                  <Link to="/pricing">
                    <Button variant="secondary" className="w-full">
                      {language === 'sq' ? 'Posto Punë' : 'Post a Job'}
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
              <h2 className="text-2xl font-bold mb-4">
                {language === 'sq' ? `Karriera në ${category} në Shqipëri` : `${category} Careers in Albania`}
              </h2>
              <p className="text-muted-foreground">
                {language === 'sq' 
                  ? `Sektori i ${category?.toLowerCase()} në Shqipëri po përjeton rritje të konsiderueshme, duke ofruar mundësi të shkëlqyera karriere. Jobs.al ju lidh me punëdhënësit më të mirë të ${category?.toLowerCase()} në vend.`
                  : `The ${category?.toLowerCase()} sector in Albania is experiencing significant growth, offering excellent career opportunities. Jobs.al connects you with the best ${category?.toLowerCase()} employers in the country.`
                }
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
