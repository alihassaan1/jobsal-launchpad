import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Eye, Trash2, FileText, HardDrive, Loader2, Save } from "lucide-react";
import { DOC_TYPES, DOC_TYPE_LABELS, DocType, DOCUMENTS_BUCKET, formatBytes, signDocumentPath } from "@/lib/documents";
import { useDocumentSettings } from "@/hooks/useDocumentSettings";

const AdminDocuments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings } = useDocumentSettings();
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState<{ enabled: boolean; maxSizeMb: string; maxPerUser: string } | null>(null);

  const effectiveForm =
    form ?? {
      enabled: settings?.enabled ?? true,
      maxSizeMb: String(settings?.maxSizeMb ?? 5),
      maxPerUser: String(settings?.maxPerUser ?? 10),
    };

  const { data: documents, isLoading } = useQuery({
    queryKey: ["admin-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_documents")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;

      const userIds = [...new Set((data || []).map((d: any) => d.user_id))];
      let profiles: Record<string, any> = {};
      if (userIds.length) {
        const { data: profileRows } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);
        (profileRows || []).forEach((p: any) => (profiles[p.id] = p));
      }
      return (data || []).map((d: any) => ({ ...d, profile: profiles[d.user_id] }));
    },
  });

  const stats = useMemo(() => {
    const list = documents || [];
    const byType: Record<string, number> = { certification: 0, cover_letter: 0, experience_letter: 0 };
    let bytes = 0;
    list.forEach((d: any) => {
      byType[d.doc_type] = (byType[d.doc_type] || 0) + 1;
      bytes += d.file_size || 0;
    });
    return { total: list.length, byType, bytes };
  }, [documents]);

  const saveSettings = useMutation({
    mutationFn: async () => {
      const rows = [
        { key: "documents_enabled", value: effectiveForm.enabled ? "true" : "false" },
        { key: "documents_max_size_mb", value: String(Math.max(1, Number(effectiveForm.maxSizeMb) || 5)) },
        { key: "documents_max_per_user", value: String(Math.max(1, Number(effectiveForm.maxPerUser) || 10)) },
      ];
      for (const row of rows) {
        const { error } = await supabase
          .from("admin_settings")
          .upsert({ key: row.key, value: row.value }, { onConflict: "key" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-settings"] });
      toast({ title: "Document settings saved" });
    },
    onError: (e: any) => toast({ title: "Couldn't save settings", description: e.message, variant: "destructive" }),
  });

  const removeDocument = useMutation({
    mutationFn: async (doc: any) => {
      const { error } = await supabase.from("user_documents").update({ is_deleted: true }).eq("id", doc.id);
      if (error) throw error;
      const paths = [doc.file_path, doc.thumbnail_path].filter(Boolean);
      if (paths.length) await supabase.storage.from(DOCUMENTS_BUCKET).remove(paths);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
      toast({ title: "Document removed" });
    },
    onError: (e: any) => toast({ title: "Couldn't remove document", description: e.message, variant: "destructive" }),
  });

  const view = async (doc: any) => {
    setBusyId(doc.id);
    try {
      window.open(await signDocumentPath(doc.file_path), "_blank");
    } catch (e: any) {
      toast({ title: "Couldn't open document", description: e.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const filtered = (documents || []).filter((d: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (d.title || "").toLowerCase().includes(q) ||
      (d.file_name || "").toLowerCase().includes(q) ||
      (d.profile?.full_name || "").toLowerCase().includes(q) ||
      (d.profile?.email || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Documents</h1>
        <p className="text-muted-foreground">Candidate certifications, cover letters and experience letters.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" /> Total documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Breakdown by type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {DOC_TYPES.map((t) => (
              <div key={t.value} className="flex justify-between">
                <span className="text-muted-foreground">{t.label}</span>
                <span className="font-medium">{stats.byType[t.value] || 0}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <HardDrive className="h-4 w-4" /> Storage used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatBytes(stats.bytes)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload settings</CardTitle>
          <CardDescription>Control the document upload feature and its limits.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable document uploads</Label>
              <p className="text-sm text-muted-foreground">Turn the feature off to hide it from candidates.</p>
            </div>
            <Switch
              checked={effectiveForm.enabled}
              onCheckedChange={(checked) => setForm({ ...effectiveForm, enabled: checked })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="max-size">Max file size (MB)</Label>
              <Input
                id="max-size"
                type="number"
                min={1}
                className="mt-2"
                value={effectiveForm.maxSizeMb}
                onChange={(e) => setForm({ ...effectiveForm, maxSizeMb: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="max-docs">Max documents per user</Label>
              <Input
                id="max-docs"
                type="number"
                min={1}
                className="mt-2"
                value={effectiveForm.maxPerUser}
                onChange={(e) => setForm({ ...effectiveForm, maxPerUser: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}>
            {saveSettings.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded documents ({filtered.length})</CardTitle>
          <CardDescription>Review and remove documents that violate the platform rules.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by title, file, candidate name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4 max-w-md"
          />
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No documents found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((doc: any) => (
                    <TableRow key={doc.id}>
                      <TableCell className="max-w-[240px] truncate">{doc.title || doc.file_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{DOC_TYPE_LABELS[doc.doc_type as DocType]}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {doc.profile?.full_name || "—"}
                        <div className="text-xs text-muted-foreground">{doc.profile?.email}</div>
                      </TableCell>
                      <TableCell className="text-sm">{formatBytes(doc.file_size)}</TableCell>
                      <TableCell className="text-sm">{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" variant="outline" onClick={() => view(doc)} disabled={busyId === doc.id}>
                            {busyId === doc.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeDocument.mutate(doc)}
                            disabled={removeDocument.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDocuments;
