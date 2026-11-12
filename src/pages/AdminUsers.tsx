import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, UserCog, Users as UsersIcon, FileText, ExternalLink, KeyRound, LogIn, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/admin/ErrorBoundary";
import { LoadingState } from "@/components/admin/LoadingState";
import { EmptyState } from "@/components/admin/EmptyState";
import { ensureCompanyForUser } from "@/lib/ensureCompany";
import { setImpersonationState } from "@/components/ImpersonationBanner";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState("");
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // 1) Load profiles first (no relations to avoid missing FK issues)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching users:', profilesError);
        toast.error("Failed to load users");
        setUsers([]);
        return;
      }

      const userIds = (profiles || []).map((u: any) => u.id);
      if (!userIds.length) {
        setUsers([]);
        return;
      }

      // 2) Fetch roles, subscriptions, applications and resumes in bulk (no N+1),
      //    paging past PostgREST's default 1000-row cap.
      const PAGE = 1000;
      const fetchAllPages = async (build: (from: number, to: number) => any) => {
        const rows: any[] = [];
        for (let page = 0; ; page++) {
          const from = page * PAGE;
          const { data, error } = await build(from, from + PAGE - 1);
          if (error) throw error;
          const batch = data || [];
          rows.push(...batch);
          if (batch.length < PAGE) break;
        }
        return rows;
      };

      const [roles, subs, appRows, resumeRows] = await Promise.all([
        fetchAllPages((from, to) =>
          supabase.from('user_roles').select('user_id, role').in('user_id', userIds).range(from, to)
        ),
        fetchAllPages((from, to) =>
          supabase.from('subscriptions').select('user_id, tier, status').in('user_id', userIds).range(from, to)
        ),
        fetchAllPages((from, to) =>
          supabase.from('applications').select('applicant_id').in('applicant_id', userIds).range(from, to)
        ),
        fetchAllPages((from, to) =>
          supabase
            .from('resumes')
            .select('id, user_id, title, resume_file_url, is_uploaded, created_at')
            .eq('is_active', true)
            .in('user_id', userIds)
            .order('created_at', { ascending: false })
            .range(from, to)
        ),
      ]);
      const appsRes = { data: appRows };
      const resumesRes = { data: resumeRows };


      const roleMap = new Map<string, any[]>();
      roles.forEach((r: any) => {
        const arr = roleMap.get(r.user_id) || [];
        arr.push({ role: r.role });
        roleMap.set(r.user_id, arr);
      });

      const subsMap = new Map<string, any[]>();
      subs.forEach((s: any) => {
        const arr = subsMap.get(s.user_id) || [];
        arr.push({ tier: s.tier, status: s.status });
        subsMap.set(s.user_id, arr);
      });

      const appsCountMap = new Map<string, number>();
      (appsRes.data || []).forEach((a: any) => {
        appsCountMap.set(a.applicant_id, (appsCountMap.get(a.applicant_id) || 0) + 1);
      });

      const resumesMap = new Map<string, any[]>();
      (resumesRes.data || []).forEach((r: any) => {
        const arr = resumesMap.get(r.user_id) || [];
        arr.push(r);
        resumesMap.set(r.user_id, arr);
      });

      const usersWithCounts = (profiles || []).map((user: any) => ({
        ...user,
        user_roles: roleMap.get(user.id) || [],
        subscriptions: subsMap.get(user.id) || [],
        applications_count: appsCountMap.get(user.id) || 0,
        resumes_count: (resumesMap.get(user.id) || []).length,
        resumes: resumesMap.get(user.id) || [],
      }));


      setUsers(usersWithCounts);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const changeUserRole = async () => {
    if (!selectedUser || !newRole) return;

    // Delete existing roles
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', selectedUser.id);

    // Insert new role
    const { error } = await supabase
      .from('user_roles')
      .insert([{ user_id: selectedUser.id, role: newRole as any }]);

    if (error) {
      toast.error("Failed to update user role");
      return;
    }

    // Auto-create a draft company so the new employer shows up in Companies
    if (newRole === 'employer') {
      const companyId = await ensureCompanyForUser({
        userId: selectedUser.id,
        fullName: selectedUser.full_name,
        email: selectedUser.email,
      });
      if (!companyId) {
        toast.warning("Role updated, but couldn't auto-create a company stub. Add one manually from Companies.");
      }
    }

    // Send role upgrade email if changed to employer
    if (newRole === 'employer') {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            to: selectedUser.email,
            templateSlug: 'role-upgrade-employer',
            data: { name: selectedUser.full_name || '' },
            userId: selectedUser.id,
          }),
        });
      } catch (emailErr) {
        console.error('Failed to send role upgrade email:', emailErr);
      }
    }

    toast.success("User role updated successfully");
    setSelectedUser(null);
    fetchUsers();
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleteUser = async (user: any) => {
    if (!confirm(`Permanently delete ${user.email}? This cannot be undone. Invoices and payments are kept.`)) return;
    setDeletingId(user.id);
    try {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', { body: { user_id: user.id } });
      let message = (data as any)?.error || error?.message;
      const ctx = (error as any)?.context;
      if (ctx?.json) { try { message = (await ctx.clone().json())?.error || message; } catch { /* keep */ } }
      if (error || (data as any)?.error) { toast.error(message || 'Failed to delete user'); return; }
      toast.success(`${user.email} deleted`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } finally { setDeletingId(null); }
  };

  const resetUserPassword = async (user: any) => {
    if (!confirm(`Reset password for ${user.email} to "Login123"?`)) return;

    setResettingUserId(user.id);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        toast.error("Your admin session expired. Sign in again before resetting passwords.");
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { email: user.email, password: 'Login123' },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (error || (data as any)?.error) {
        let message = (data as any)?.error || error?.message || 'Failed to reset password';
        const context = (error as any)?.context;
        if (context?.json) {
          try {
            const body = await context.clone().json();
            message = body?.error || message;
          } catch {
            // Keep the original function error message.
          }
        }
        toast.error(message);
        return;
      }

      toast.success(`Password reset to Login123 for ${user.email}`);
    } finally {
      setResettingUserId(null);
    }
  };

  const impersonateUser = async (user: any) => {
    const role = user.user_roles?.[0]?.role;
    if (role === 'admin') {
      toast.error("Cannot impersonate another admin.");
      return;
    }
    if (!confirm(`Sign in as ${user.email}? You'll see the app exactly as they do. Use the banner at the top to return to your admin account. This action is logged.`)) return;

    setImpersonatingId(user.id);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const adminAccess = sessionData.session?.access_token;
      const adminRefresh = sessionData.session?.refresh_token;
      if (!adminAccess || !adminRefresh) {
        toast.error("Your admin session expired. Sign in again.");
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-impersonate', {
        body: { target_user_id: user.id },
        headers: { Authorization: `Bearer ${adminAccess}` },
      });
      if (error || (data as any)?.error) {
        toast.error((data as any)?.error || error?.message || 'Impersonation failed');
        return;
      }

      const hashed_token = (data as any)?.hashed_token;
      if (!hashed_token) {
        toast.error('No session token returned.');
        return;
      }

      // Save admin tokens BEFORE switching session
      setImpersonationState({
        admin_access_token: adminAccess,
        admin_refresh_token: adminRefresh,
        target_email: user.email,
        target_name: user.full_name || user.email,
      });

      const { error: otpError } = await supabase.auth.verifyOtp({
        type: 'magiclink',
        token_hash: hashed_token,
      });
      if (otpError) {
        setImpersonationState(null);
        toast.error(`Failed to start impersonation: ${otpError.message}`);
        return;
      }

      toast.success(`Signed in as ${user.email}`);
      // Send to homepage so they land where the user normally would
      window.location.href = '/';
    } finally {
      setImpersonatingId(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (roleFilter === "all") return matchesSearch;
    
    const userRole = user.user_roles?.[0]?.role;
    return matchesSearch && userRole === roleFilter;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch(role) {
      case 'admin': return 'destructive';
      case 'employer': return 'default';
      case 'job_seeker': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-1">Manage user accounts and roles</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="employer">Employers</SelectItem>
                <SelectItem value="job_seeker">Job Seekers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState type="table" rows={8} />
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="No users found"
              description="There are no users matching your search criteria."
            />
          ) : (
            <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead>Resume</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {filteredUsers.map((user) => {
                  const role = user.user_roles?.[0]?.role || 'none';
                  const subscription = user.subscriptions?.[0];
                  const applicationsCount = user.applications_count || 0;

                  return (
                    <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div className="font-medium">{user.full_name || 'N/A'}</div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(role)}>
                          {role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{applicationsCount}</Badge>
                      </TableCell>
                      <TableCell>
                        {user.resumes && user.resumes.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {user.resumes.slice(0, 2).map((resume: any) => (
                              <div key={resume.id} className="flex items-center gap-1">
                                {resume.resume_file_url ? (
                                  <a
                                    href={resume.resume_file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                                    title={resume.title}
                                  >
                                    <FileText className="h-3 w-3" />
                                    <span className="max-w-[80px] truncate">{resume.title}</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                ) : (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground" title="Builder resume (no file)">
                                    <FileText className="h-3 w-3" />
                                    <span className="max-w-[80px] truncate">{resume.title}</span>
                                  </span>
                                )}
                              </div>
                            ))}
                            {user.resumes.length > 2 && (
                              <span className="text-xs text-muted-foreground">+{user.resumes.length - 2} more</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {subscription ? (
                          <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                            {subscription.tier}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setNewRole(role);
                              }}
                            >
                              <UserCog className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Change User Role</DialogTitle>
                              <DialogDescription>
                                Update the role for {user.full_name || user.email}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <Select value={newRole} onValueChange={setNewRole}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select new role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="employer">Employer</SelectItem>
                                  <SelectItem value="job_seeker">Job Seeker</SelectItem>
                                  <SelectItem value="editor">Editor</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <DialogFooter>
                              <Button onClick={changeUserRole}>Update Role</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="outline"
                          title="Reset password to Login123"
                          disabled={resettingUserId === user.id}
                          onClick={() => resetUserPassword(user)}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          title="Sign in as this user (logged & reversible)"
                          disabled={impersonatingId === user.id || role === 'admin'}
                          onClick={() => impersonateUser(user)}
                        >
                          <LogIn className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          title="Delete user permanently"
                          className="text-destructive hover:text-destructive"
                          disabled={deletingId === user.id || role === 'admin'}
                          onClick={() => deleteUser(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
    </ErrorBoundary>
  );
}
