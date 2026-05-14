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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, CheckCircle, Star, Ban, Eye, Building2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/admin/ErrorBoundary";
import { LoadingState } from "@/components/admin/LoadingState";
import { EmptyState } from "@/components/admin/EmptyState";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminCompanies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    description: "",
    industry: "",
    location: "",
    website: "",
    email: "",
    phone: "",
    logo_url: "",
    owner_email: "",
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

  const handleCreateCompany = async () => {
    if (!newCompany.name.trim()) {
      toast.error("Company name is required");
      return;
    }
    if (!user) {
      toast.error("You must be signed in");
      return;
    }

    setCreating(true);
    try {
      // Resolve owner: if admin entered an email, look up that user; otherwise self.
      let ownerId = user.id;
      const ownerEmail = newCompany.owner_email.trim().toLowerCase();
      if (ownerEmail) {
        const { data: ownerProfile, error: ownerErr } = await supabase
          .from('profiles')
          .select('id')
          .ilike('email', ownerEmail)
          .maybeSingle();
        if (ownerErr) {
          console.warn('Owner lookup error:', ownerErr);
        }
        if (!ownerProfile) {
          toast.error(`No user found with email ${ownerEmail}. Leave blank to assign to yourself.`);
          setCreating(false);
          return;
        }
        ownerId = ownerProfile.id;
      }

      const { error } = await supabase.from('companies').insert({
        name: newCompany.name.trim(),
        slug: generateSlug(newCompany.name),
        description: newCompany.description || null,
        industry: newCompany.industry || null,
        location: newCompany.location || null,
        website: newCompany.website || null,
        email: newCompany.email || null,
        phone: newCompany.phone || null,
        logo_url: newCompany.logo_url || null,
        owner_id: ownerId,
      });

      if (error) throw error;

      toast.success("Company created");
      setCreateOpen(false);
      setNewCompany({
        name: "", description: "", industry: "", location: "",
        website: "", email: "", phone: "", logo_url: "", owner_email: "",
      });
      fetchCompanies();
    } catch (err: any) {
      console.error('Create company error:', err);
      toast.error(err.message || "Failed to create company");
    } finally {
      setCreating(false);
    }
  };

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching companies:', error);
        toast.error("Failed to load companies");
        setCompanies([]);
        return;
      }

      const list = data ?? [];

      // Fetch all employer user_roles so we can surface employers without a company yet
      const { data: employerRoles, error: rolesErr } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'employer');
      if (rolesErr) console.warn('Could not load employer roles:', rolesErr);

      const employerIds = Array.from(new Set((employerRoles || []).map((r: any) => r.user_id)));
      const ownersWithCompanies = new Set(list.map((c: any) => c.owner_id));
      const orphanEmployerIds = employerIds.filter((id) => !ownersWithCompanies.has(id));

      // Profiles needed: owners of existing companies + orphan employers
      const profileIds = Array.from(
        new Set([
          ...list.map((c: any) => c.owner_id).filter(Boolean),
          ...orphanEmployerIds,
        ])
      );

      let profilesById: Record<string, { full_name: string | null; email: string | null; created_at?: string }> = {};
      if (profileIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, created_at')
          .in('id', profileIds);

        if (profilesError) {
          console.warn('Could not load owner profiles:', profilesError);
        } else if (profilesData) {
          profilesById = Object.fromEntries(
            profilesData.map((p: any) => [p.id, { full_name: p.full_name, email: p.email, created_at: p.created_at }])
          );
        }
      }

      // Count jobs per company in a single query
      let jobsCountById: Record<string, number> = {};
      if (list.length > 0) {
        const { data: jobsData, error: jobsError } = await supabase
          .from('jobs')
          .select('company_id')
          .in('company_id', list.map((c: any) => c.id));

        if (!jobsError && jobsData) {
          for (const j of jobsData as any[]) {
            if (!j.company_id) continue;
            jobsCountById[j.company_id] = (jobsCountById[j.company_id] || 0) + 1;
          }
        }
      }

      const companiesEnriched = list.map((c: any) => ({
        ...c,
        profiles: profilesById[c.owner_id] || null,
        jobs_count: jobsCountById[c.id] || 0,
        is_orphan_employer: false,
      }));

      // Synthetic rows for employers without a company
      const orphanRows = orphanEmployerIds.map((uid) => {
        const p = profilesById[uid];
        return {
          id: `orphan-${uid}`,
          owner_id: uid,
          name: p?.full_name || p?.email?.split('@')[0] || 'Unknown employer',
          location: null,
          is_verified: false,
          sponsorship_plan: 'none',
          is_sponsored: false,
          views_count: 0,
          followers_count: 0,
          jobs_count: 0,
          created_at: p?.created_at || new Date().toISOString(),
          profiles: p ? { full_name: p.full_name, email: p.email } : null,
          is_orphan_employer: true,
        };
      });

      setCompanies([...companiesEnriched, ...orphanRows]);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Company Management</h1>
          <p className="text-muted-foreground mt-1">Manage companies, verification, and sponsorships</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add a new company</DialogTitle>
              <DialogDescription>
                Create a company profile manually. Leave "Owner email" blank to assign it to your own admin account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="c-name">Company Name *</Label>
                <Input
                  id="c-name"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  placeholder="Acme Sh.p.k."
                />
              </div>
              <div>
                <Label htmlFor="c-owner">Owner email (optional)</Label>
                <Input
                  id="c-owner"
                  type="email"
                  value={newCompany.owner_email}
                  onChange={(e) => setNewCompany({ ...newCompany, owner_email: e.target.value })}
                  placeholder="owner@company.com — must already have an account"
                />
              </div>
              <div>
                <Label htmlFor="c-desc">Description</Label>
                <Textarea
                  id="c-desc"
                  rows={3}
                  value={newCompany.description}
                  onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                  placeholder="Short description of the company"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="c-industry">Industry</Label>
                  <Input
                    id="c-industry"
                    value={newCompany.industry}
                    onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                    placeholder="Technology"
                  />
                </div>
                <div>
                  <Label htmlFor="c-location">Location</Label>
                  <Input
                    id="c-location"
                    value={newCompany.location}
                    onChange={(e) => setNewCompany({ ...newCompany, location: e.target.value })}
                    placeholder="Tirana, Albania"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="c-website">Website</Label>
                <Input
                  id="c-website"
                  value={newCompany.website}
                  onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                  placeholder="https://company.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="c-email">Contact email</Label>
                  <Input
                    id="c-email"
                    type="email"
                    value={newCompany.email}
                    onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                    placeholder="hr@company.com"
                  />
                </div>
                <div>
                  <Label htmlFor="c-phone">Phone</Label>
                  <Input
                    id="c-phone"
                    value={newCompany.phone}
                    onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                    placeholder="+355 ..."
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="c-logo">Logo URL</Label>
                <Input
                  id="c-logo"
                  value={newCompany.logo_url}
                  onChange={(e) => setNewCompany({ ...newCompany, logo_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
                Cancel
              </Button>
              <Button onClick={handleCreateCompany} disabled={creating || !newCompany.name.trim()}>
                {creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</> : "Create company"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
            <LoadingState type="table" rows={6} />
          ) : filteredCompanies.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No companies found"
              description="There are no companies matching your search criteria."
            />
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
