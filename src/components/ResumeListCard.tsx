import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Resume {
  id: string;
  title: string;
  resume_type?: string;
  resume_file_url?: string;
  is_uploaded: boolean;
  created_at: string;
  updated_at: string;
}

interface ResumeListCardProps {
  resume: Resume;
  onDelete?: () => void;
  showActions?: boolean;
}

export function ResumeListCard({ resume, onDelete, showActions = true }: ResumeListCardProps) {
  const handleDownload = async () => {
    if (!resume.resume_file_url) {
      toast.error("No file available for download");
      return;
    }
    
    try {
      window.open(resume.resume_file_url, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download resume");
    }
  };

  const handleView = () => {
    if (resume.is_uploaded && resume.resume_file_url) {
      window.open(resume.resume_file_url, '_blank');
    } else {
      // Open the builder loaded with this resume's data
      window.location.href = `/resume-builder?id=${resume.id}`;
    }
  };

  const handleDelete = async () => {
    try {
      // Delete file from storage if it's an uploaded resume
      if (resume.is_uploaded && resume.resume_file_url) {
        const filePath = resume.resume_file_url.split('/resumes/')[1];
        if (filePath) {
          await supabase.storage.from('resumes').remove([filePath]);
        }
      }

      // Delete resume record
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resume.id);

      if (error) throw error;

      toast.success("Resume deleted successfully");
      onDelete?.();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("Failed to delete resume");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{resume.title}</CardTitle>
              {resume.resume_type && (
                <p className="text-sm text-muted-foreground mt-1">{resume.resume_type}</p>
              )}
            </div>
          </div>
          <Badge variant={resume.is_uploaded ? "default" : "secondary"}>
            {resume.is_uploaded ? "Uploaded" : "Builder"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Updated {new Date(resume.updated_at).toLocaleDateString()}
          </p>
          {showActions && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleView}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              {resume.is_uploaded && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Resume</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this resume? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
