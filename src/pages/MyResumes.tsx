import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, FileText, Trash2, Edit, Download, LogOut, User, Building2 } from "lucide-react";
import { ResumeUploadDialog } from "@/components/ResumeUploadDialog";
import { ResumeListCard } from "@/components/ResumeListCard";
import Navigation from "@/components/Navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export default function MyResumes() {
  const { user, signOut, userRole } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: resumes, isLoading } = useQuery({
    queryKey: ["user-resumes", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (resumeId: string) => {
      const { error } = await supabase
        .from("resumes")
        .update({ is_active: false })
        .eq("id", resumeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Resume deleted",
        description: "Your resume has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["user-resumes"] });
      setDeleteId(null);
    },
    onError: (error) => {
      toast({
        title: "Error deleting resume",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Resumes</h1>
            <p className="text-muted-foreground">Manage and create your professional resumes</p>
          </div>
          <div className="flex gap-3">
            <ResumeUploadDialog onUploadSuccess={() => queryClient.invalidateQueries({ queryKey: ["user-resumes"] })} />
            <Button onClick={() => navigate('/resume-builder')} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Build Resume
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !resumes || resumes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No resumes yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first professional resume with our AI-powered builder
              </p>
              <Button onClick={() => navigate('/resume-builder')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Resume
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((resume) => (
              <ResumeListCard
                key={resume.id}
                resume={resume}
                onDelete={() => queryClient.invalidateQueries({ queryKey: ["user-resumes"] })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resume</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this resume? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
