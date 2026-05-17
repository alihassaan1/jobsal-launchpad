import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Briefcase, CheckCircle, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FeaturedCompanies = () => {
  const navigate = useNavigate();

  const { data: companies, isLoading } = useQuery({
    queryKey: ["featured-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies_public")
        .select(`
          *,
          jobs(count)
        `)
        .eq("is_sponsored", true)
        .order("sponsorship_plan", { ascending: false })
        .limit(6);

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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-4">
              <div className="w-16 h-16 bg-muted rounded-lg" />
              <div className="h-6 bg-muted rounded w-3/4" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!companies || companies.length === 0) {
    return null;
  }

  return (
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
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
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
            <div className="text-sm font-medium text-primary">
              {company.jobs?.[0]?.count || 0} open positions
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FeaturedCompanies;