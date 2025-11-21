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
          companies(name, logo_url),
          profiles!jobs_posted_by_fkey(full_name, email)
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
    <ErrorBoundary>
      <div className="p-6 space-y-6">
...
          )}
        </CardContent>
      </Card>
    </div>
    </ErrorBoundary>
  );
}
