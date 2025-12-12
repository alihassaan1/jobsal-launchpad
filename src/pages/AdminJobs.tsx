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
import { Search, Eye, Edit, Trash2, Star, ToggleLeft, ToggleRight, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/admin/ErrorBoundary";
import { LoadingState } from "@/components/admin/LoadingState";
import { EmptyState } from "@/components/admin/EmptyState";
import { AdminGuard } from "@/components/admin/AdminGuard";

export default function AdminJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          companies(name, logo_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const toggleJobStatus = async (jobId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('jobs')
      .update({ is_active: !currentStatus })
      .eq('id', jobId);

    if (error) {
      toast.error("Failed to update job status");
      return;
    }

    toast.success(currentStatus ? "Job deactivated" : "Job activated");
    fetchJobs();
  };

  const toggleFeatured = async (jobId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('jobs')
      .update({ is_featured: !currentStatus })
      .eq('id', jobId);

    if (error) {
      toast.error("Failed to update featured status");
      return;
    }

    toast.success(currentStatus ? "Removed from featured" : "Marked as featured");
    fetchJobs();
  };

  const deleteJob = async () => {
    if (!selectedJob) return;

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', selectedJob.id);

    if (error) {
      toast.error("Failed to delete job");
      return;
    }

    toast.success("Job deleted successfully");
    setDeleteDialogOpen(false);
    setSelectedJob(null);
    fetchJobs();
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.companies?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && job.is_active) ||
      (statusFilter === "inactive" && !job.is_active) ||
      (statusFilter === "featured" && job.is_featured);

    const matchesCategory =
      categoryFilter === "all" || job.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = Array.from(new Set(jobs.map(job => job.category))).filter(Boolean);

  return (
    <AdminGuard>
      <ErrorBoundary>
        <div className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Job Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs or companies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <LoadingState type="table" />
              ) : filteredJobs.length === 0 ? (
                <EmptyState 
                  icon={Briefcase}
                  title="No jobs found"
                  description="No jobs match your current filters"
                />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Applications</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredJobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-medium">{job.title}</TableCell>
                          <TableCell>{job.companies?.name || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{job.category}</Badge>
                          </TableCell>
                          <TableCell>{job.location}</TableCell>
                          <TableCell>{job.applications_count || 0}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {job.is_active ? (
                                <Badge variant="default">Active</Badge>
                              ) : (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                              {job.is_featured && (
                                <Badge variant="default" className="bg-yellow-500">
                                  <Star className="h-3 w-3" />
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/jobs/${job.slug}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleJobStatus(job.id, job.is_active)}
                              >
                                {job.is_active ? (
                                  <ToggleRight className="h-4 w-4" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleFeatured(job.id, job.is_featured)}
                              >
                                <Star className={job.is_featured ? "h-4 w-4 fill-yellow-500" : "h-4 w-4"} />
                              </Button>
                              <Dialog open={deleteDialogOpen && selectedJob?.id === job.id} onOpenChange={(open) => {
                                setDeleteDialogOpen(open);
                                if (!open) setSelectedJob(null);
                              }}>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedJob(job)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Delete Job</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to delete this job? This action cannot be undone.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                                      Cancel
                                    </Button>
                                    <Button variant="destructive" onClick={deleteJob}>
                                      Delete
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>
    </AdminGuard>
  );
}
