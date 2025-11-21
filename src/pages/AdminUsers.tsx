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
import { Search, UserCog, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/admin/ErrorBoundary";
import { LoadingState } from "@/components/admin/LoadingState";
import { EmptyState } from "@/components/admin/EmptyState";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState("");

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

      // 2) Fetch roles and subscriptions in bulk
      const [rolesRes, subsRes] = await Promise.all([
        supabase.from('user_roles').select('user_id, role').in('user_id', userIds),
        supabase.from('subscriptions').select('user_id, tier, status').in('user_id', userIds),
      ]);

      const roles = rolesRes.data || [];
      const subs = subsRes.data || [];

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

      // 3) Count applications and resumes per user (RLS allows admins to read all)
      const usersWithCounts = await Promise.all(
        (profiles || []).map(async (user: any) => {
          const [appsResult, resumesResult] = await Promise.all([
            supabase.from('applications').select('*', { count: 'exact', head: true }).eq('applicant_id', user.id),
            supabase.from('resumes').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_active', true),
          ]);

          return {
            ...user,
            user_roles: roleMap.get(user.id) || [],
            subscriptions: subsMap.get(user.id) || [],
            applications_count: appsResult.count || 0,
            resumes_count: resumesResult.count || 0,
          };
        })
      );

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

    toast.success("User role updated successfully");
    setSelectedUser(null);
    fetchUsers();
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
                  <TableHead>Resumes</TableHead>
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
                        <Badge variant="outline">{user.resumes_count || 0}</Badge>
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
