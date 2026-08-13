import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { DOC_TYPES, DOC_TYPE_LABELS, DocType } from "@/lib/documents";
import { useDocumentSettings } from "@/hooks/useDocumentSettings";

interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

const AttachDocumentsSection = ({ selectedIds, onChange }: Props) => {
  const { user } = useAuth();
  const { data: settings } = useDocumentSettings();

  const { data: documents } = useQuery({
    queryKey: ["my-documents", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_documents")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (settings && !settings.enabled) return null;

  const toggle = (id: string, checked: boolean) => {
    onChange(checked ? [...selectedIds, id] : selectedIds.filter((x) => x !== id));
  };

  return (
    <div>
      <Label>Attach Additional Documents</Label>
      <p className="text-xs text-muted-foreground mt-1 mb-3">
        Select certifications, cover letters or experience letters to include with this application.
      </p>

      {!documents || documents.length === 0 ? (
        <div className="text-sm text-muted-foreground border rounded-lg p-4">
          You haven't uploaded any documents yet.{" "}
          <Link to="/my-documents" className="text-primary underline">
            Upload documents
          </Link>
        </div>
      ) : (
        <div className="space-y-4 border rounded-lg p-4">
          {DOC_TYPES.map((type) => {
            const list = documents.filter((d: any) => d.doc_type === type.value);
            if (list.length === 0) return null;
            return (
              <div key={type.value}>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">{type.label}</p>
                <div className="space-y-2">
                  {list.map((doc: any) => (
                    <label key={doc.id} className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        checked={selectedIds.includes(doc.id)}
                        onCheckedChange={(checked) => toggle(doc.id, checked === true)}
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium truncate">{doc.title || doc.file_name}</span>
                        <span className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {DOC_TYPE_LABELS[doc.doc_type as DocType]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </span>
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
          <Link to="/my-documents" className="text-xs text-primary underline inline-block">
            Manage my documents
          </Link>
        </div>
      )}
    </div>
  );
};

export default AttachDocumentsSection;
