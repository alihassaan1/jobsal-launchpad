import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Loader2, Archive } from "lucide-react";
import { DOC_TYPE_LABELS, DocType, formatBytes, signDocumentById } from "@/lib/documents";

interface Props {
  applicationId: string;
}

const ApplicationDocuments = ({ applicationId }: Props) => {
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);

  const { data: documents, isLoading } = useQuery({
    queryKey: ["application-documents", applicationId],
    enabled: !!applicationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("application_documents")
        .select("document_id, user_documents(*)")
        .eq("application_id", applicationId);
      if (error) throw error;
      return (data || []).map((row: any) => row.user_documents).filter(Boolean);
    },
  });

  const download = async (doc: any) => {
    setBusyId(doc.id);
    try {
      const url = await signDocumentById(doc.id, true);
      window.open(url, "_blank");
    } catch (e: any) {
      toast({ title: "Couldn't download document", description: e.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const downloadAll = async () => {
    setZipping(true);
    try {
      const { data, error } = await supabase.functions.invoke("document-access", {
        body: { action: "zip", applicationId },
      });
      if (error) throw error;
      if (!data?.zip) throw new Error(data?.error || "Nothing to download");
      const link = document.createElement("a");
      link.href = `data:application/zip;base64,${data.zip}`;
      link.download = data.fileName || "application-documents.zip";
      link.click();
    } catch (e: any) {
      toast({ title: "Couldn't create ZIP", description: e.message, variant: "destructive" });
    } finally {
      setZipping(false);
    }
  };

  if (isLoading) return <div className="h-16 bg-muted animate-pulse rounded-lg" />;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Documents ({documents?.length || 0})</Label>
        {!!documents?.length && (
          <Button size="sm" variant="outline" onClick={downloadAll} disabled={zipping}>
            {zipping ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Archive className="h-3 w-3 mr-1" />}
            Download All
          </Button>
        )}
      </div>

      {!documents?.length ? (
        <p className="text-sm text-muted-foreground">No additional documents attached</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc: any) => (
            <Card key={doc.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex gap-2 min-w-0 flex-1">
                  <FileText className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title || doc.file_name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {DOC_TYPE_LABELS[doc.doc_type as DocType]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatBytes(doc.file_size)}</span>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => download(doc)} disabled={busyId === doc.id}>
                  {busyId === doc.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Download className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationDocuments;
