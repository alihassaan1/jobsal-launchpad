import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Trash2, Eye, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

// Extract storage path from either a public URL or a stored path
function getStoragePath(url: string): string | null {
  if (!url) return null;
  const marker = "/resumes/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url.startsWith("http") ? null : url;
  return url.substring(idx + marker.length);
}

export function ResumeListCard({ resume, onDelete, showActions = true }: ResumeListCardProps) {
  const [busy, setBusy] = useState<"view" | "download" | "delete" | null>(null);
  const navigate = useNavigate();

  const openUploadedFile = async (action: "view" | "download") => {
    if (!resume.resume_file_url) {
      toast.error("No file available");
      return;
    }
    setBusy(action);
    try {
      const path = getStoragePath(resume.resume_file_url);
      if (!path) {
        toast.error("Invalid file reference");
        return;
      }
      // Bucket is private — must use a signed URL
      const { data, error } = await supabase.storage
        .from("resumes")
        .createSignedUrl(path, 60 * 10, action === "download" ? { download: true } : undefined);
      if (error || !data?.signedUrl) throw error || new Error("Could not generate link");
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      console.error("Open uploaded resume failed:", err);
      toast.error(err?.message || "Could not open resume");
    } finally {
      setBusy(null);
    }
  };

  const handleView = () => {
    if (resume.is_uploaded) {
      openUploadedFile("view");
    } else {
      // Open the builder loaded with this resume's data
      navigate(`/resume-builder?id=${resume.id}`);
    }
  };

  const handleDownload = () => {
    if (resume.is_uploaded) {
      openUploadedFile("download");
    } else {
      // For builder resumes, send them to the builder where they can export PDF
      navigate(`/resume-builder?id=${resume.id}&export=1`);
    }
  };

  const handleDelete = async () => {
    setBusy("delete");
    try {
      // Soft-delete to keep MyResumes' is_active filter consistent and preserve
      // referential integrity with job applications referencing this resume.
      const { error } = await supabase
        .from("resumes")
        .update({ is_active: false })
        .eq("id", resume.id);

      if (error) throw error;

      toast.success("Resume deleted");
      onDelete?.();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error?.message || "Failed to delete resume");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <CardTitle className="text-lg truncate">{resume.title}</CardTitle>
              {resume.resume_type && (
                <p className="text-sm text-muted-foreground mt-1 truncate">{resume.resume_type}</p>
              )}
            </div>
          </div>
          <Badge variant={resume.is_uploaded ? "default" : "secondary"} className="shrink-0">
            {resume.is_uploaded ? "Uploaded" : "Builder"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-muted-foreground">
            Updated {new Date(resume.updated_at).toLocaleDateString()}
          </p>
          {showActions && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleView}
                disabled={busy !== null}
              >
                {busy === "view" ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-1" />
                )}
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={busy !== null}
              >
                {busy === "download" ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-1" />
                )}
                Download
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={busy !== null}>
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
