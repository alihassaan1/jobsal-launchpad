import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Users, Briefcase, Search, CheckCircle, Star, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { ALBANIAN_CITIES } from "@/lib/i18n";

const INDUSTRIES = [
  { sq: "Të Gjitha Industritë", en: "All Industries" },
  { sq: "Teknologji", en: "Technology" },
  { sq: "Financa & Banka", en: "Finance & Banking" },
  { sq: "Shëndetësi", en: "Healthcare" },
  { sq: "Arsim", en: "Education" },
  { sq: "Shitje me Pakicë & E-commerce", en: "Retail & E-commerce" },
  { sq: "Prodhim", en: "Manufacturing" },
  { sq: "Ndërtim", en: "Construction" },
  { sq: "Turizëm & Hoteleri", en: "Tourism & Hospitality" },
  { sq: "Telekomunikacion", en: "Telecommunications" },
  { sq: "Pasuri e Patundshme", en: "Real Estate" },
  { sq: "Marketing & Reklama", en: "Marketing & Advertising" },
  { sq: "Juridik", en: "Legal" },
  { sq: "Konsulencë", en: "Consulting" },
  { sq: "Energji", en: "Energy" },
  { sq: "Transport & Logjistikë", en: "Transportation & Logistics" },
  { sq: "HOREKA", en: "HOREKA" },
  { sq: "Call Center", en: "Call Center" },
  { sq: "Banka & Sigurime", en: "Banking & Insurance" },
];

const Companies = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const { data: companies, isLoading } = useQuery({
    queryKey: ["companies", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("companies_public")
        .select(`
          *,
          jobs(count)
        `)
        .order("is_sponsored", { ascending: false })
        .order("sponsorship_plan", { ascending: false })
        .order("followers_count", { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,industry.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const getSponsorshipBadge = (plan: string) => {
    const badges = {
      platinum: <Badge className="bg-gradient-to-r from-purple-500 to-pink-500"><Star className="w-3 h-3 mr-1" />Platinum</Badge>,
      gold: <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500"><Star className="w-3 h-3 mr-1" />Gold</Badge>,
      silver: <Badge className="bg-gradient-to-r from-gray-300 to-gray-500"><Star className="w-3 h-3 mr-1" />Silver</Badge>,
    };
    return badges[plan as keyof typeof badges] || null;
  };

  const [industryFilter, setIndustryFilter] = useState("All Industries");
  const [locationFilter, setLocationFilter] = useState("All Locations");

  const filteredCompanies = companies?.filter(company => {
    const matchesIndustry = industryFilter === "All Industries" || company.industry === industryFilter;
    const matchesLocation = locationFilter === "All Locations" || company.location?.includes(locationFilter);
    return matchesIndustry && matchesLocation;
  });

  return (
    <>
      <Helmet>
        <title>{language === 'sq' ? 'Kompanitë Top që Punësojnë në Shqipëri | Jobs.al' : 'Companies Hiring in Albania | Employer Directory | Jobs.al'}</title>
        <meta name="description" content={language === 'sq' 
          ? 'Eksploro kompanitë e verifikuara që punësojnë në Shqipëri. Gjej profile punëdhënësish, kulturën e kompanisë dhe pozicione të hapura.'
          : 'Discover top employers & employment companies hiring in Albania. Browse company profiles, open positions, culture & benefits. Find your ideal workplace in Tirana & beyond.'
        } />
        <meta name="keywords" content="companies in albania, employers albania, hiring companies tirana, top employers, albanian companies, company directory, employment company in albania, companies hiring in albania, banking companies albania, hotel companies albania" />
        <meta property="og:title" content={language === 'sq' ? 'Kompani që Punësojnë në Shqipëri | Jobs.al' : 'Companies Hiring in Albania | Jobs.al'} />
        <meta property="og:description" content="Discover top employers and companies hiring in Albania. Browse profiles and open positions." />
        <meta property="og:url" content="https://jobs.al/companies" />
        <meta property="og:image" content="https://jobs.al/og-image.jpg" />
        <link rel="canonical" href="https://jobs.al/companies" />
      </Helmet>

      <Navigation />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">{t('companies.title')}</h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 mb-8">
              {t('companies.subtitle')}
            </p>

            {/* Search & Filters */}
            <div className="bg-background/10 backdrop-blur-sm rounded-lg p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    type="text"
                    placeholder={t('companies.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background text-foreground h-11"
                  />
                </div>
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger className="bg-background text-foreground h-11">
                    <Briefcase className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder={t('companies.allIndustries')} />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((industry) => (
                      <SelectItem key={industry.en} value={industry.en}>
                        {industry[language]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="bg-background text-foreground h-11">
                    <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder={t('jobs.allLocations')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Locations">{t('jobs.allLocations')}</SelectItem>
                    {ALBANIAN_CITIES.map((city) => (
                      <SelectItem key={city.key} value={city.en}>
                        {city[language]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Companies Grid */}
        <div className="container mx-auto px-4 py-12">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-lg" />
                    <div className="h-6 bg-muted rounded w-3/4" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : filteredCompanies && filteredCompanies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company) => (
                <Card
                  key={company.id}
                  className="hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => navigate(`/companies/${company.slug}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                        {company.logo_url ? (
                          <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        {company.is_verified && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {t('companies.verified')}
                          </Badge>
                        )}
                        {company.sponsorship_plan !== 'none' && getSponsorshipBadge(company.sponsorship_plan)}
                      </div>
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors">{company.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{company.description || "No description available"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {company.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {company.location}
                        </div>
                      )}
                      {company.industry && (
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {company.industry}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        {company.followers_count || 0} {t('companies.followers')}
                      </div>
                      <div className="text-sm font-medium text-primary">
                        {company.jobs?.[0]?.count || 0} {t('companies.openJobs')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('companies.noCompanies')}</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Companies;
