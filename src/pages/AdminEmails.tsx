import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Send, Clock, CheckCircle, XCircle, Eye, BarChart3, RefreshCw, Users } from "lucide-react";
import { format } from "date-fns";

export default function AdminEmails() {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");

  // Fetch email templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("category", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch email logs
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["email-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_logs")
        .select(`
          *,
          profiles:user_id (full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Fetch email stats
  const { data: stats } = useQuery({
    queryKey: ["email-stats"],
    queryFn: async () => {
      const { data: totalSent, error: sentError } = await supabase
        .from("email_logs")
        .select("*", { count: "exact", head: true })
        .eq("status", "sent");

      const { data: totalFailed, error: failedError } = await supabase
        .from("email_logs")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed");

      const { data: todaySent } = await supabase
        .from("email_logs")
        .select("*", { count: "exact", head: true })
        .eq("status", "sent")
        .gte("created_at", new Date().toISOString().split("T")[0]);

      // Get users without resumes for pending reminders
      const { data: usersWithoutResumes } = await supabase
        .from("profiles")
        .select("id")
        .not("id", "in", (
          supabase.from("resumes").select("user_id")
        ));

      return {
        totalSent: (totalSent as any)?.length ?? 0,
        totalFailed: (totalFailed as any)?.length ?? 0,
        todaySent: (todaySent as any)?.length ?? 0,
        pendingReminders: usersWithoutResumes?.length ?? 0,
      };
    },
  });

  // Send test email mutation
  const sendTestMutation = useMutation({
    mutationFn: async ({ email, templateSlug }: { email: string; templateSlug: string }) => {
      const response = await supabase.functions.invoke("send-email", {
        body: {
          to: email,
          templateSlug,
          data: { name: "Test User", jobCount: "5", newJobsCount: "25" },
        },
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast.success("Test email sent successfully!");
      queryClient.invalidateQueries({ queryKey: ["email-logs"] });
    },
    onError: (error: any) => {
      toast.error(`Failed to send test email: ${error.message}`);
    },
  });

  // Trigger scheduled reminders mutation
  const triggerRemindersMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke("scheduled-email-reminders");
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Reminders processed! Sent: ${data.results?.emailsSent || 0}, Skipped: ${data.results?.skipped || 0}`);
      queryClient.invalidateQueries({ queryKey: ["email-logs"] });
    },
    onError: (error: any) => {
      toast.error(`Failed to trigger reminders: ${error.message}`);
    },
  });

  const handleSendTest = () => {
    if (!testEmail || !selectedTemplate) {
      toast.error("Please enter an email and select a template");
      return;
    }
    sendTestMutation.mutate({ email: testEmail, templateSlug: selectedTemplate });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Sent</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case "opened":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Eye className="w-3 h-3 mr-1" /> Opened</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> {status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      onboarding: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      engagement: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      transactional: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      digest: "bg-green-500/10 text-green-600 border-green-500/20",
      alerts: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    };
    return <Badge className={colors[category] || ""}>{category}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Marketing</h1>
        <p className="text-muted-foreground">Manage email templates, view logs, and send test emails</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSent || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todaySent || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.totalFailed || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users Without Resume</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingReminders || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="logs">Email Logs</TabsTrigger>
          <TabsTrigger value="send">Send Test</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Pre-configured email templates for automated campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading templates...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates?.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell><code className="text-xs bg-muted px-2 py-1 rounded">{template.slug}</code></TableCell>
                        <TableCell>{getCategoryBadge(template.category)}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{template.subject}</TableCell>
                        <TableCell>
                          {template.is_active ? (
                            <Badge className="bg-green-500/10 text-green-600">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Email Logs</CardTitle>
                <CardDescription>Recent email sending activity</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["email-logs"] })}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading logs...</div>
              ) : logs?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No emails sent yet</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs?.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{log.profiles?.full_name || "Unknown"}</span>
                            <span className="text-xs text-muted-foreground">{log.email_to}</span>
                          </div>
                        </TableCell>
                        <TableCell><code className="text-xs bg-muted px-2 py-1 rounded">{log.template_slug}</code></TableCell>
                        <TableCell className="max-w-[200px] truncate">{log.subject}</TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Send Test Email</CardTitle>
                <CardDescription>Send a test email to verify template rendering</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Template</label>
                  <div className="grid grid-cols-2 gap-2">
                    {templates?.map((template) => (
                      <Button
                        key={template.slug}
                        variant={selectedTemplate === template.slug ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTemplate(template.slug)}
                        className="justify-start"
                      >
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={handleSendTest}
                  disabled={sendTestMutation.isPending || !testEmail || !selectedTemplate}
                  className="w-full"
                >
                  {sendTestMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Test Email
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trigger Scheduled Reminders</CardTitle>
                <CardDescription>Manually run the resume reminder scheduler</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This will check all users without resumes and send appropriate reminder emails
                  based on when they signed up (Day 3, Day 7, or Day 14 reminders).
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="text-sm"><strong>Day 3:</strong> First gentle reminder</p>
                  <p className="text-sm"><strong>Day 7:</strong> Re-engagement email</p>
                  <p className="text-sm"><strong>Day 14:</strong> Final nudge with urgency</p>
                </div>
                <Button
                  onClick={() => triggerRemindersMutation.mutate()}
                  disabled={triggerRemindersMutation.isPending}
                  variant="secondary"
                  className="w-full"
                >
                  {triggerRemindersMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Run Reminder Scheduler
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}