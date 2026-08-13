import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import {
  ACCEPTED_EXT,
  ACCEPTED_MIME,
  DOCUMENTS_BUCKET,
  DOC_TYPES,
  DocType,
  extensionFor,
  formatBytes,
  makeImageThumbnail,
} from "@/lib/documents";

interface Props {
  open: boolean;
  onClose: () => void;
  maxSizeMb: number;
  /** When set, the upload replaces this document instead of creating a new one. */
  replacing?: any | null;
}

const DocumentUploadDialog = ({ open, onClose, maxSizeMb, replacing }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [docType, setDocType] = useState<DocType>("certification");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    setDocType((replacing?.doc_type as DocType) || "certification");
    setTitle(replacing?.title || "");
    setFile(null);
  }, [open, replacing]);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Please choose a file");
      const ext = extensionFor(file);
      const path = `${user!.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      // Thumbnail for images
      let thumbnailPath: string | null = null;
      const thumb = await makeImageThumbnail(file);
      if (thumb) {
        thumbnailPath = `${user!.id}/thumbs/${path.split("/").pop()!.replace(/\.[^.]+$/, "")}.jpg`;
        const { error: thumbError } = await supabase.storage
          .from(DOCUMENTS_BUCKET)
          .upload(thumbnailPath, thumb, { contentType: "image/jpeg", upsert: true });
        if (thumbError) thumbnailPath = null;
      }

      const payload = {
        user_id: user!.id,
        doc_type: docType,
        title: title.trim() || file.name,
        file_path: path,
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        thumbnail_path: thumbnailPath,
        is_verified: false,
        verification_error: null,
      };

      let documentId = replacing?.id as string | undefined;
      const oldPaths: string[] = [];

      if (documentId) {
        if (replacing.file_path) oldPaths.push(replacing.file_path);
        if (replacing.thumbnail_path) oldPaths.push(replacing.thumbnail_path);
        const { error } = await supabase.from("user_documents").update(payload).eq("id", documentId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("user_documents").insert(payload).select("id").single();
        if (error) throw error;
        documentId = data.id;
      }

      // Server-side validation (real file type + not corrupted)
      const { data: validation, error: validationError } = await supabase.functions.invoke("validate-document", {
        body: { documentId },
      });
      if (validationError) throw validationError;
      if (validation?.valid === false) {
        throw new Error(validation.error || "This file could not be validated");
      }

      if (oldPaths.length) {
        await supabase.storage.from(DOCUMENTS_BUCKET).remove(oldPaths);
      }
      return documentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-documents"] });
      toast({ title: replacing ? "Document replaced" : "Document uploaded" });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!ACCEPTED_MIME.includes(selected.type)) {
      toast({ title: "Invalid file type", description: "Only PDF, JPG and PNG files are allowed", variant: "destructive" });
      e.target.value = "";
      return;
    }
    if (selected.size > maxSizeMb * 1024 * 1024) {
      toast({ title: "File too large", description: `Maximum size is ${maxSizeMb}MB`, variant: "destructive" });
      e.target.value = "";
      return;
    }
    setFile(selected);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{replacing ? "Replace document" : "Upload document"}</DialogTitle>
          <DialogDescription>
            PDF, JPG or PNG · max {maxSizeMb}MB per file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Document type *</Label>
            <Select value={docType} onValueChange={(v) => setDocType(v as DocType)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="doc-title">Title / label</Label>
            <Input
              id="doc-title"
              className="mt-2"
              placeholder="e.g. Google Analytics Certification"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={140}
            />
          </div>

          <div>
            <Label htmlFor="doc-file">File *</Label>
            <Input id="doc-file" type="file" accept={ACCEPTED_EXT} className="mt-2" onChange={handleFile} />
            {file && (
              <p className="text-xs text-muted-foreground mt-1">
                {file.name} ({formatBytes(file.size)})
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={uploadMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={() => uploadMutation.mutate()} disabled={!file || uploadMutation.isPending}>
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" /> {replacing ? "Replace" : "Upload"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploadDialog;
