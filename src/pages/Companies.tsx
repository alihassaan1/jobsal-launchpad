import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Briefcase, Search, CheckCircle, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Companies = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const { data: companies, isLoading } = useQuery({
    queryKey: ["companies", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("companies")
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

  return (
    <>
      <Helmet>
        <title>Top Companies Hiring in Albania | Jobs.al Company Directory</title>
        <meta name="description" content="Explore verified companies hiring in Albania. Find employer profiles, company culture, benefits, and open positions at Albania's top employers." />
        <meta name="keywords" content="companies albania, employers albania, top companies hiring, company directory, verified employers" />
        <link rel="canonical" href="https://jobs.al/companies" />
        <meta property="og:title" content="Top Companies Hiring in Albania | Jobs.al" />
        <meta property="og:description" content="Discover Albania's best employers and their open positions" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Explore Companies</h1>
            <p className="text-xl text-primary-foreground/90 mb-8">
              Discover Albania's top employers and find your next career opportunity
            </p>

            {/* Search */}
            <div className="max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search companies by name, industry, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background text-foreground"
                />
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
          ) : companies && companies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => (
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
                            Verified
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
                          <Building2 className="w-4 h-4" />
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
                        {company.followers_count || 0} followers
                      </div>
                      <div className="text-sm font-medium text-primary">
                        {company.jobs?.[0]?.count || 0} open jobs
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No companies found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Companies;