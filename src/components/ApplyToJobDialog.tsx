import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText } from "lucide-react";

interface ApplyToJobDialogProps {
  job: any;
  isOpen: boolean;
  onClose: () => void;
}

const ApplyToJobDialog = ({ job, isOpen, onClose }: ApplyToJobDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const sendNewApplicantNotification = async () => {
    try {
      // Get employer info from job's company
      const { data: company } = await supabase
        .from("companies")
        .select("owner_id, name")
        .eq("id", job.company_id)
        .single();

      if (!company) return;

      const { data: employerProfile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", company.owner_id)
        .single();

      if (!employerProfile?.email) return;

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user!.id)
        .single();

      // Get application count for this job
      const { count: totalApplications } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("job_id", job.id);

      await supabase.functions.invoke("send-email", {
        body: {
          to: employerProfile.email,
          templateSlug: "new-applicant",
          data: {
            employerName: employerProfile.full_name || "",
            jobTitle: job.title,
            location: job.location,
            applicantName: userProfile?.full_name || "Kandidat",
            applicantEmail: userProfile?.email || "",
            appliedDate: new Date().toLocaleDateString("sq-AL"),
            totalApplications: String(totalApplications || 1),
          },
          userId: company.owner_id,
        },
      });
    } catch (err) {
      console.error("Failed to send new-applicant notification:", err);
    }
  };

  const applyMutation = useMutation({
    mutationFn: async ({ coverLetter, resumeUrl }: { coverLetter: string; resumeUrl?: string }) => {
      // Check if already applied
      const { data: existing } = await supabase
        .from("applications")
        .select("id")
        .eq("job_id", job.id)
        .eq("applicant_id", user!.id)
        .single();

      if (existing) {
        throw new Error("You have already applied to this job");
      }

      const { error } = await supabase.from("applications").insert({
        job_id: job.id,
        applicant_id: user!.id,
        cover_letter: coverLetter,
        resume_url: resumeUrl,
        status: "applied",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Application submitted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["myApplications"] });
      
      // Trigger new-applicant notification to employer
      sendNewApplicantNotification();
      
      onClose();
      setCoverLetter("");
      setResumeFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error submitting application",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or DOC file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setResumeFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let resumeUrl: string | undefined;

      // Upload resume if provided
      if (resumeFile) {
        const fileExt = resumeFile.name.split(".").pop();
        const fileName = `${user!.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(fileName, resumeFile);

        if (uploadError) throw uploadError;
        resumeUrl = fileName;
      }

      await applyMutation.mutateAsync({ coverLetter, resumeUrl });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply to {job.title}</DialogTitle>
          <DialogDescription>
            Complete your application for this position at {job.companies?.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resume Upload */}
          <div>
            <Label htmlFor="resume">Resume (PDF or DOC) *</Label>
            <div className="mt-2">
              <Input
                id="resume"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                required
              />
              {resumeFile && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {resumeFile.name} ({(resumeFile.size / 1024).toFixed(2)} KB)
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Upload your resume in PDF or DOC format (max 10MB)
            </p>
          </div>

          {/* Cover Letter */}
          <div>
            <Label htmlFor="coverLetter">Cover Letter *</Label>
            <Textarea
              id="coverLetter"
              placeholder="Tell the employer why you're a great fit for this position..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={8}
              required
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Briefly explain your interest and qualifications for this role
            </p>
          </div>

          {/* Job Details Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Position Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Company:</span>{" "}
                <span className="font-medium">{job.companies?.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Location:</span>{" "}
                <span className="font-medium">{job.location}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>{" "}
                <span className="font-medium capitalize">{job.job_type.replace("_", " ")}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Level:</span>{" "}
                <span className="font-medium capitalize">{job.experience_level}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={uploading || applyMutation.isPending || !resumeFile}
            >
              {uploading || applyMutation.isPending ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyToJobDialog;
