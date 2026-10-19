import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Download, Eye, FileText, Trash2, Upload, RefreshCw, Loader2 } from "lucide-react";
import DocumentUploadDialog from "@/components/documents/DocumentUploadDialog";
import { useDocumentSettings } from "@/hooks/useDocumentSettings";
import {
  DOCUMENTS_BUCKET,
  DOC_TYPES,
  DOC_TYPE_LABELS,
  DocType,
  formatBytes,
  signDocumentPath, removeDocumentFiles,
} from "@/lib/documents";

const MyDocuments = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings } = useDocumentSettings();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [replacing, setReplacing] = useState<any | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const maxSizeMb = settings?.maxSizeMb ?? 5;
  const maxPerUser = settings?.maxPerUser ?? 10;

  const { data: documents, isLoading } = useQuery({
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

  const deleteMutation = useMutation({
    mutationFn: async (doc: any) => {
      const paths = [doc.file_path, doc.thumbnail_path].filter(Boolean);
      const { error } = await supabase.from("user_documents").update({ is_deleted: true }).eq("id", doc.id);
      if (error) throw error;
      if (paths.length) await removeDocumentFiles(paths);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-documents"] });
      toast({ title: "Document deleted" });
    },
    onError: (e: any) => toast({ title: "Couldn't delete document", description: e.message, variant: "destructive" }),
  });

  const openDocument = async (doc: any, download = false) => {
    setBusyId(doc.id);
    try {
      const url = await signDocumentPath(doc.file_path);
      if (download) {
        const link = document.createElement("a");
        link.href = url;
        link.download = doc.file_name;
        link.click();
      } else {
        window.open(url, "_blank");
      }
    } catch (e: any) {
      toast({ title: "Couldn't open document", description: e.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = { certification: [], cover_letter: [], experience_letter: [] };
    (documents || []).forEach((d: any) => map[d.doc_type]?.push(d));
    return map;
  }, [documents]);

  if (authLoading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/auth" replace />;

  const atLimit = (documents?.length || 0) >= maxPerUser;
  const featureOff = settings && !settings.enabled;

  const renderList = (list: any[]) =>
    list.length === 0 ? (
      <p className="text-sm text-muted-foreground py-8 text-center">No documents in this category yet.</p>
    ) : (
      <div className="space-y-3">
        {list.map((doc) => (
          <Card key={doc.id} className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{doc.title || doc.file_name}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="secondary">{DOC_TYPE_LABELS[doc.doc_type as DocType]}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Uploaded {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatBytes(doc.file_size)}</span>
                  {doc.verification_error && (
                    <Badge variant="destructive" className="text-xs">Validation issue</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button size="sm" variant="outline" onClick={() => openDocument(doc)} disabled={busyId === doc.id}>
                  {busyId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => openDocument(doc, true)} disabled={busyId === doc.id}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplacing(doc);
                    setUploadOpen(true);
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteMutation.mutate(doc)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">My Documents</h1>
            <p className="text-muted-foreground">
              Store certifications, cover letters and experience letters to attach to your applications.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/my-resumes">
              <Button variant="outline">My Resumes</Button>
            </Link>
            <Button
              onClick={() => {
                setReplacing(null);
                setUploadOpen(true);
              }}
              disabled={atLimit || !!featureOff}
            >
              <Upload className="h-4 w-4 mr-2" /> Upload document
            </Button>
          </div>
        </div>

        {featureOff && (
          <Card className="mb-6 border-destructive/40">
            <CardContent className="py-4 text-sm">
              Document uploads are temporarily disabled by the administrator.
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Documents ({documents?.length || 0}/{maxPerUser})</CardTitle>
            <CardDescription>
              PDF, JPG or PNG · max {maxSizeMb}MB per file · up to {maxPerUser} documents
              {atLimit && " · limit reached, delete a document to upload a new one"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <Tabs defaultValue="all">
                <TabsList className="mb-4 flex-wrap h-auto">
                  <TabsTrigger value="all">All ({documents?.length || 0})</TabsTrigger>
                  {DOC_TYPES.map((t) => (
                    <TabsTrigger key={t.value} value={t.value}>
                      {t.label} ({grouped[t.value].length})
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value="all">{renderList(documents || [])}</TabsContent>
                {DOC_TYPES.map((t) => (
                  <TabsContent key={t.value} value={t.value}>
                    {renderList(grouped[t.value])}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </main>

      <DocumentUploadDialog
        open={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
          setReplacing(null);
        }}
        maxSizeMb={maxSizeMb}
        replacing={replacing}
      />
    </div>
  );
};

export default MyDocuments;
