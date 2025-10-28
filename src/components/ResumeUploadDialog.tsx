import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface ResumeUploadDialogProps {
  onUploadSuccess?: () => void;
}

export function ResumeUploadDialog({ onUploadSuccess }: ResumeUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resumeTitle, setResumeTitle] = useState("");
  const [resumeType, setResumeType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error("Please upload a PDF or Word document");
        return;
      }
      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !user || !resumeTitle) {
      toast.error("Please fill in all fields");
      return;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('resumes')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      // Create resume record
      const { error: insertError } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          title: resumeTitle,
          resume_type: resumeType || null,
          resume_file_url: publicUrl,
          is_uploaded: true,
          is_active: true,
          data: {}
        });

      if (insertError) throw insertError;

      toast.success("Resume uploaded successfully!");
      setOpen(false);
      setResumeTitle("");
      setResumeType("");
      setFile(null);
      onUploadSuccess?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload resume");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Resume
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Resume</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Resume Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Software Engineer Resume"
              value={resumeTitle}
              onChange={(e) => setResumeTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Position Type (Optional)</Label>
            <Input
              id="type"
              placeholder="e.g., Software Engineer, Marketing Manager"
              value={resumeType}
              onChange={(e) => setResumeType(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Resume File (PDF or Word) *</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
          <Button 
            onClick={handleUpload} 
            disabled={uploading || !file || !resumeTitle}
            className="w-full"
          >
            {uploading ? "Uploading..." : "Upload Resume"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
