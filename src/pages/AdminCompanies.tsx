import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, CheckCircle, Star, Ban, Eye } from "lucide-react";
import { toast } from "sonner";

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          profiles!companies_owner_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching companies:', error);
        toast.error("Failed to load companies");
      } else if (data) {
        // Count jobs for each company
        const companiesWithCounts = await Promise.all(
          data.map(async (company) => {
            const { count } = await supabase
              .from('jobs')
              .select('*', { count: 'exact', head: true })
              .eq('company_id', company.id);
            
            return {
              ...company,
              jobs_count: count || 0
            };
          })
        );
        setCompanies(companiesWithCounts);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  const toggleVerification = async (companyId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('companies')
      .update({ is_verified: !currentStatus })
      .eq('id', companyId);

    if (error) {
      toast.error("Failed to update verification status");
      return;
    }

    toast.success(currentStatus ? "Company unverified" : "Company verified");
    fetchCompanies();
  };

  const updateSponsorshipTier = async (companyId: string, tier: string) => {
    const { error } = await supabase
      .from('companies')
      .update({ 
        sponsorship_plan: tier,
        is_sponsored: tier !== 'none'
      })
      .eq('id', companyId);

    if (error) {
      toast.error("Failed to update sponsorship tier");
      return;
    }

    toast.success("Sponsorship tier updated");
    fetchCompanies();
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === "verified") return matchesSearch && company.is_verified;
    if (filter === "unverified") return matchesSearch && !company.is_verified;
    if (filter === "sponsored") return matchesSearch && company.is_sponsored;
    return matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Company Management</h1>
        <p className="text-muted-foreground mt-1">Manage companies, verification, and sponsorships</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                <SelectItem value="verified">Verified Only</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
                <SelectItem value="sponsored">Sponsored</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Companies ({filteredCompanies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading companies...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sponsorship</TableHead>
                  <TableHead>Active Jobs</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{company.name}</div>
                        <div className="text-sm text-muted-foreground">{company.location}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{company.profiles?.full_name || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">{company.profiles?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.is_verified ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Unverified</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={company.sponsorship_plan}
                        onValueChange={(value) => updateSponsorshipTier(company.id, value)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="silver">Silver</SelectItem>
                          <SelectItem value="gold">Gold</SelectItem>
                          <SelectItem value="platinum">Platinum</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{company.jobs_count || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div><Eye className="inline h-3 w-3 mr-1" />{company.views_count || 0} views</div>
                        <div className="text-muted-foreground">{company.followers_count || 0} followers</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={company.is_verified ? "outline" : "default"}
                          onClick={() => toggleVerification(company.id, company.is_verified)}
                        >
                          {company.is_verified ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
