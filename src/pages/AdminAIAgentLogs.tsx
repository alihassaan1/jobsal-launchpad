import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { 
  FileText, 
  Clock, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight,
  Filter,
  Download,
  RefreshCw,
  ExternalLink
} from "lucide-react";

interface AIAgentLog {
  id: string;
  created_at: string;
  agent_type: string;
  content_type: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost: number;
  duration_ms: number;
  status: string;
  error_message: string | null;
  content_url: string | null;
  response_preview: string | null;
  request_preview: string | null;
  metadata: Record<string, unknown> | null;
}

const AdminAIAgentLogs = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [contentTypeFilter, setContentTypeFilter] = useState<string>("all");
  const [agentTypeFilter, setAgentTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["ai-agent-logs", statusFilter, contentTypeFilter, agentTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from("ai_agent_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (contentTypeFilter !== "all") {
        query = query.eq("content_type", contentTypeFilter);
      }
      if (agentTypeFilter !== "all") {
        query = query.eq("agent_type", agentTypeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AIAgentLog[];
    }
  });

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(6)}`;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const filteredLogs = logs?.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.content_type.toLowerCase().includes(query) ||
      log.agent_type.toLowerCase().includes(query) ||
      log.response_preview?.toLowerCase().includes(query) ||
      log.request_preview?.toLowerCase().includes(query)
    );
  });

  const exportToCSV = () => {
    if (!filteredLogs) return;
    
    const headers = ["Date", "Agent", "Type", "Status", "Tokens", "Cost", "Duration"];
    const rows = filteredLogs.map(log => [
      format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
      log.agent_type,
      log.content_type,
      log.status,
      log.total_tokens,
      log.cost,
      log.duration_ms
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-agent-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const uniqueContentTypes = [...new Set(logs?.map(l => l.content_type) || [])];
  const uniqueAgentTypes = [...new Set(logs?.map(l => l.agent_type) || [])];

  return (
    <AdminGuard>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">API Logs</h1>
            <p className="text-muted-foreground mt-1">
              Complete log of all AI agent API calls
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Agent Type</Label>
                <Select value={agentTypeFilter} onValueChange={setAgentTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    {uniqueAgentTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {uniqueContentTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              API Call History
            </CardTitle>
            <CardDescription>
              Showing {filteredLogs?.length || 0} logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !filteredLogs?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No API logs found</p>
                <p className="text-sm">API calls will appear here once you start using the AI agent</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Content Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                      <TableHead>URL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <Collapsible key={log.id} asChild>
                        <>
                          <TableRow 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => toggleRow(log.id)}
                          >
                            <TableCell>
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                                  {expandedRows.has(log.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {format(new Date(log.created_at), "MMM dd, HH:mm:ss")}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.agent_type}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{log.content_type}</Badge>
                            </TableCell>
                            <TableCell>
                              {log.status === "success" ? (
                                <Badge className="bg-green-500/20 text-green-700 hover:bg-green-500/30">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Success
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Failed
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {log.total_tokens.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {formatCost(log.cost)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              <span className="flex items-center justify-end gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(log.duration_ms)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {log.content_url && (
                                <a 
                                  href={log.content_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              )}
                            </TableCell>
                          </TableRow>
                          <CollapsibleContent asChild>
                            <TableRow className="bg-muted/30">
                              <TableCell colSpan={9} className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold mb-2 text-sm">Request Preview</h4>
                                    <pre className="text-xs bg-background p-3 rounded-md overflow-auto max-h-40 border">
                                      {log.request_preview || "No request preview available"}
                                    </pre>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold mb-2 text-sm">Response Preview</h4>
                                    <pre className="text-xs bg-background p-3 rounded-md overflow-auto max-h-40 border">
                                      {log.response_preview || "No response preview available"}
                                    </pre>
                                  </div>
                                  {log.error_message && (
                                    <div className="col-span-2">
                                      <h4 className="font-semibold mb-2 text-sm text-destructive">Error Message</h4>
                                      <pre className="text-xs bg-destructive/10 text-destructive p-3 rounded-md overflow-auto border border-destructive/20">
                                        {log.error_message}
                                      </pre>
                                    </div>
                                  )}
                                  <div className="col-span-2 grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Prompt Tokens:</span>{" "}
                                      <span className="font-mono">{log.prompt_tokens.toLocaleString()}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Completion Tokens:</span>{" "}
                                      <span className="font-mono">{log.completion_tokens.toLocaleString()}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Total Cost:</span>{" "}
                                      <span className="font-mono">{formatCost(log.cost)}</span>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          </CollapsibleContent>
                        </>
                      </Collapsible>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
};

export default AdminAIAgentLogs;
