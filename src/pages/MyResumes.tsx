import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, FileText, Trash2, Edit, Download, LogOut, User, Building2 } from "lucide-react";
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
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <a href="/" className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent relative">
                jobs.al
                <div className="absolute inset-0 bg-gradient-hero bg-clip-text text-transparent opacity-50 animate-shine"></div>
              </a>
              <nav className="hidden md:flex space-x-6">
                <a href="/jobs" className="text-foreground hover:text-primary transition-colors duration-300 relative group">
                  Find Jobs
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                </a>
                <a href="#" className="text-foreground hover:text-primary transition-colors duration-300 relative group">
                  Companies
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                </a>
                <a href="/pricing" className="text-foreground hover:text-primary transition-colors duration-300 relative group">
                  Pricing
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                </a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="hover:scale-105 transition-transform duration-200 border-2 border-primary/20 bg-primary/5 hover:bg-primary/10"
                    >
                      <User className="h-5 w-5 text-primary" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.email}</p>
                        <p className="text-xs text-muted-foreground capitalize">{userRole || 'User'}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                      if (userRole === 'employer' || userRole === 'admin') {
                        navigate('/dashboard');
                      } else {
                        navigate('/my-applications');
                      }
                    }}>
                      {userRole === 'employer' || userRole === 'admin' ? 'Dashboard' : 'My Applications'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/my-resumes')}>
                      My Resumes
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/auth')}>Login</Button>
                  <Button onClick={() => navigate('/auth')}>Sign Up</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Resumes</h1>
            <p className="text-muted-foreground">Manage and create your professional resumes</p>
          </div>
          <Button onClick={() => navigate('/resume-builder')} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Create New Resume
          </Button>
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
              <Card key={resume.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{resume.title}</span>
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>
                    Updated {formatDate(resume.updated_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={() => navigate(`/resume-builder?id=${resume.id}`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setDeleteId(resume.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
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

      {/* Footer */}
      <footer className="bg-secondary py-12 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-4">
                jobs.al
              </div>
              <p className="text-muted-foreground mb-4">
                Albania's leading job portal connecting talents with opportunities.
              </p>
              <div className="text-sm text-muted-foreground">
                © 2024 jobs.al. All rights reserved.
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Job Seekers</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/jobs" className="hover:text-primary">Browse Jobs</a></li>
                <li><a href="/resume-templates" className="hover:text-primary">Resume Templates</a></li>
                <li><a href="/resume-builder" className="hover:text-primary">Resume Builder</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Employers</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Post a Job</a></li>
                <li><a href="/pricing" className="hover:text-primary">Pricing Plans</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">About Us</a></li>
                <li><a href="#" className="hover:text-primary">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
