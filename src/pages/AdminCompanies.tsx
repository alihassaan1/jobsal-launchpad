import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
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
import { CompanyDetailSheet } from "@/components/admin/CompanyDetailSheet";

export default function AdminCompanies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyAppCounts, setCompanyAppCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    (supabase.rpc as any)("admin_application_counts").then(({ data }: any) => {
      const m: Record<string, number> = {};
      (data || []).forEach((r: any) => { if (r.company_id) m[r.company_id] = (m[r.company_id] || 0) + Number(r.total); });
      setCompanyAppCounts(m);
    });
  }, []);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
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
      // Team members linked to companies (owner/recruiter/viewer)
      const { data: membersData, error: membersErr } = await supabase
        .from('company_members')
        .select('company_id, user_id, role');
      if (membersErr) console.warn('Could not load company members:', membersErr);
      const membersByCompany: Record<string, { user_id: string; role: string }[]> = {};
      for (const m of (membersData || []) as any[]) {
        (membersByCompany[m.company_id] ||= []).push({ user_id: m.user_id, role: m.role });
      }

      const linkedUserIds = new Set<string>([
        ...list.map((c: any) => c.owner_id),
        ...((membersData || []) as any[]).map((m) => m.user_id),
      ]);
      const orphanEmployerIds = employerIds.filter((id) => !linkedUserIds.has(id));

      // Profiles needed: owners, team members, orphan employers
      const profileIds = Array.from(
        new Set([
          ...list.map((c: any) => c.owner_id).filter(Boolean),
          ...((membersData || []) as any[]).map((m) => m.user_id),
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

      const packageById: Record<string, string> = {};
      if (list.length > 0) {
        const { data: offerRows } = await supabase
          .from('client_package_offers')
          .select('company_id, package_name, status, expires_at')
          .in('company_id', list.map((c: any) => c.id))
          .in('status', ['offered', 'paid']);
        for (const o of (offerRows || []) as any[]) {
          if (o.status === 'paid' && new Date(o.expires_at) <= new Date()) continue;
          const label = `${o.package_name || 'Private package'}${o.status === 'paid' ? '' : ' (awaiting payment)'}`;
          if (!packageById[o.company_id] || o.status === 'paid') packageById[o.company_id] = label;
        }
        const ownerIds = list.map((c: any) => c.owner_id).filter(Boolean);
        const { data: subRows } = await supabase
          .from('subscriptions')
          .select('user_id, plan_slug, status, current_period_end')
          .in('user_id', ownerIds)
          .eq('status', 'active');
        for (const c of list as any[]) {
          if (packageById[c.id]) continue;
          const sub = (subRows || []).find((x: any) => x.user_id === c.owner_id && x.plan_slug && (!x.current_period_end || new Date(x.current_period_end) > new Date()));
          if (sub) packageById[c.id] = `${String(sub.plan_slug).replace(/^package:/, '').replace(/^\w/, (m: string) => m.toUpperCase())} (monthly)`;
        }
      }

      const companiesEnriched = list.map((c: any) => ({
        package_label: packageById[c.id] || null,
        ...c,
        profiles: profilesById[c.owner_id] || null,
        team: (membersByCompany[c.id] || [])
          .filter((m) => m.user_id !== c.owner_id)
          .map((m) => ({ ...m, ...(profilesById[m.user_id] || {}) })),
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

      const merged = [...companiesEnriched, ...orphanRows].sort((a, b) => {
        const ta = new Date(a.created_at || 0).getTime();
        const tb = new Date(b.created_at || 0).getTime();
        return tb - ta;
      });
      setCompanies(merged);
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
    const matchesSearch = (company.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.profiles?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === "verified") return matchesSearch && company.is_verified;
    if (filter === "unverified") return matchesSearch && !company.is_verified && !company.is_orphan_employer;
    if (filter === "sponsored") return matchesSearch && company.is_sponsored;
    if (filter === "missing") return matchesSearch && company.is_orphan_employer;
    return matchesSearch;
  });

  const startCreateForOwner = (ownerEmail: string | null | undefined) => {
    setNewCompany({
      name: "", description: "", industry: "", location: "",
      website: "", email: "", phone: "", logo_url: "",
      owner_email: ownerEmail || "",
    });
    setCreateOpen(true);
  };

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
                <SelectItem value="all">All (incl. employers without company)</SelectItem>
                <SelectItem value="missing">Missing company</SelectItem>
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
                  <TableHead>Package</TableHead>
                  <TableHead>Active Jobs</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id} onClick={(e) => { if (company.is_orphan_employer) return; if ((e.target as HTMLElement).closest("button,[role=combobox],a")) return; setDetail(company); }} className={company.is_orphan_employer ? "bg-amber-50/50 dark:bg-amber-950/10" : "cursor-pointer"}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{company.name}</div>
                        <div className="text-sm text-muted-foreground">{company.location || (company.is_orphan_employer ? '—' : '')}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{company.profiles?.full_name || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">{company.profiles?.email}</div>
                        {company.team?.length > 0 && (
                          <div className="mt-2 space-y-1 border-t pt-2">
                            <div className="text-xs font-medium text-muted-foreground">Team ({company.team.length})</div>
                            {company.team.map((m: any) => (
                              <div key={m.user_id} className="text-xs">
                                {m.full_name || m.email || 'Unknown'}{' '}
                                <span className="text-muted-foreground">· {m.role}</span>
                                {m.email && m.full_name && <div className="text-muted-foreground">{m.email}</div>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.is_orphan_employer ? (
                        <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">
                          No company yet
                        </Badge>
                      ) : company.is_verified ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Unverified</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.is_orphan_employer ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        company.package_label
                          ? <Badge variant="outline">{company.package_label}</Badge>
                          : <span className="text-xs text-muted-foreground">Free</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{company.jobs_count || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      {company.is_orphan_employer ? <span className="text-xs text-muted-foreground">—</span> : <Link to={`/admin/applications?company=${company.id}`} className="text-primary hover:underline">{companyAppCounts[company.id] ?? 0}</Link>}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div><Eye className="inline h-3 w-3 mr-1" />{company.views_count || 0} views</div>
                        <div className="text-muted-foreground">{company.followers_count || 0} followers</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {company.is_orphan_employer ? (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => startCreateForOwner(company.profiles?.email)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Create company
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setDetail(company)}>Manage</Button>
                        )}
                        {!company.is_orphan_employer && (
                          <Button
                            size="sm"
                            variant={company.is_verified ? "outline" : "default"}
                            onClick={() => toggleVerification(company.id, company.is_verified)}
                          >
                            {company.is_verified ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <CompanyDetailSheet company={detail} open={!!detail} onOpenChange={(o) => !o && setDetail(null)} onChanged={fetchCompanies} />
    </div>
  );
}
