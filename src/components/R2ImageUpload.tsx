import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type R2ImageFolder = "blog" | "logos" | "banners" | "ads" | "jobs" | "templates" | "misc";

interface Props {
  folder: R2ImageFolder;
  onUploaded: (url: string) => void;
  label?: string;
}

/** Uploads an image file straight to Cloudflare R2 (images/{folder}/) and returns its public URL. */
export function R2ImageUpload({ folder, onUploaded, label = "Upload image" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG or WebP images are allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be 10MB or smaller");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("r2-storage", {
        body: { action: "presign_put", kind: "image", folder, contentType: file.type, size: file.size },
      });
      if (error || !data?.uploadUrl) throw new Error(data?.error || error?.message || "Upload failed");
      const put = await fetch(data.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);
      if (!data.publicUrl) throw new Error("Public image URL is not configured");
      onUploaded(data.publicUrl);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
        {busy ? "Uploading..." : label}
      </Button>
    </>
  );
}
