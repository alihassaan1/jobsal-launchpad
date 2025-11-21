import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Building2, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface TopEmployer {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  job_count: number;
  location: string | null;
}

export const TopEmployers = () => {
  const [employers, setEmployers] = useState<TopEmployer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopEmployers();
  }, []);

  const fetchTopEmployers = async () => {
    try {
      // Get companies marked as top employers with active placements
      const { data: companies, error } = await supabase
        .from("companies")
        .select("id, name, slug, logo_url, location")
        .eq("is_top_employer", true)
        .gte("top_employer_end_date", new Date().toISOString())
        .order("name");

      if (error) throw error;

      if (!companies || companies.length === 0) {
        setEmployers([]);
        setLoading(false);
        return;
      }

      // Get job counts for each company
      const employersWithCounts = await Promise.all(
        companies.map(async (company) => {
          const { count } = await supabase
            .from("jobs")
            .select("*", { count: "exact", head: true })
            .eq("company_id", company.id)
            .eq("is_active", true);

          return {
            ...company,
            job_count: count || 0,
          };
        })
      );

      // Filter out companies with no jobs and sort by job count
      const activeEmployers = employersWithCounts
        .filter((emp) => emp.job_count > 0)
        .sort((a, b) => b.job_count - a.job_count);

      setEmployers(activeEmployers);
    } catch (error) {
      console.error("Error fetching top employers:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-2">Top Employers</h2>
          <p className="text-center text-muted-foreground mb-12">
            Companies actively hiring in Albania
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (employers.length === 0) {
    return null; // Don't show section if no top employers
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Top Employers</h2>
          <p className="text-muted-foreground">
            Leading companies actively hiring in Albania
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {employers.map((employer) => (
            <Link
              key={employer.id}
              to={`/companies/${employer.slug}`}
              className="group"
            >
              <Card className="p-4 h-full flex flex-col items-center justify-center text-center hover:shadow-lg transition-all duration-300 hover:scale-105 bg-background">
                <div className="w-16 h-16 mb-3 flex items-center justify-center rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors">
                  {employer.logo_url ? (
                    <img
                      src={employer.logo_url}
                      alt={`${employer.name} logo`}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                  {employer.name}
                </h3>
                {employer.location && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {employer.location}
                  </p>
                )}
                <div className="flex items-center gap-1 text-xs text-primary font-medium mt-auto">
                  <Briefcase className="h-3 w-3" />
                  <span>
                    {employer.job_count} {employer.job_count === 1 ? "Job" : "Jobs"}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link
            to="/companies"
            className="inline-flex items-center text-sm text-primary hover:underline"
          >
            View all companies →
          </Link>
        </div>
      </div>
    </section>
  );
};
