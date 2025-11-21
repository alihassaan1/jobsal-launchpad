import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Megaphone, Building2, GraduationCap, Mail, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminMarketingAgent() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const generateOutreach = async (taskType: 'daily' | 'weekly') => {
    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('marketing-outreach', {
        body: { taskType }
      });

      if (error) throw error;

      if (data.success) {
        setResult(data.content);
        toast({
          title: "Success",
          description: `${taskType === 'daily' ? 'Daily' : 'Weekly'} marketing outreach generated successfully`,
        });
      } else {
        throw new Error(data.error || 'Failed to generate outreach');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate marketing outreach",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marketing & Outreach AI Agent</h1>
        <p className="text-muted-foreground mt-2">
          AI-powered marketing outreach to grow Jobs.al
        </p>
      </div>

      <Alert>
        <Megaphone className="h-4 w-4" />
        <AlertDescription>
          This AI agent generates targeted outreach campaigns for employers, universities, and students.
          It creates ready-to-use messages, identifies leads, and suggests growth strategies.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Daily Tasks
            </CardTitle>
            <CardDescription>
              Generate today's employer leads, university outreach, marketing content, and growth ideas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => generateOutreach('daily')}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Daily Outreach'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weekly Strategy
            </CardTitle>
            <CardDescription>
              Generate weekly strategic plan with competitor analysis, partnerships, and monthly roadmap
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => generateOutreach('weekly')}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Weekly Plan'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {result && result.employerLeads && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Outreach Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="employers" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="employers">Employers</TabsTrigger>
                <TabsTrigger value="universities">Universities</TabsTrigger>
                <TabsTrigger value="marketing">Marketing</TabsTrigger>
                <TabsTrigger value="followups">Follow-ups</TabsTrigger>
                <TabsTrigger value="growth">Growth Ideas</TabsTrigger>
              </TabsList>

              <TabsContent value="employers" className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Employer Leads ({result.employerLeads?.length || 0})</h3>
                </div>
                <ScrollArea className="h-[600px] pr-4">
                  {result.employerLeads?.map((lead: any, idx: number) => (
                    <Card key={idx} className="mb-4">
                      <CardHeader>
                        <CardTitle className="text-base">{lead.companyName}</CardTitle>
                        <CardDescription>{lead.industry}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm font-medium">Job Types:</p>
                          <p className="text-sm text-muted-foreground">{lead.jobTypes}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Why Jobs.al:</p>
                          <p className="text-sm text-muted-foreground">{lead.relevance}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Email Draft:</p>
                          <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">
                            {lead.emailDraft}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">LinkedIn Message:</p>
                          <div className="bg-muted p-3 rounded-md text-sm">
                            {lead.linkedinDraft}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="universities" className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">University Leads ({result.universityLeads?.length || 0})</h3>
                </div>
                <ScrollArea className="h-[600px] pr-4">
                  {result.universityLeads?.map((lead: any, idx: number) => (
                    <Card key={idx} className="mb-4">
                      <CardHeader>
                        <CardTitle className="text-base">{lead.universityName}</CardTitle>
                        <CardDescription>{lead.department}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm font-medium">Contact:</p>
                          <p className="text-sm text-muted-foreground">{lead.contactInfo}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Pitch:</p>
                          <p className="text-sm text-muted-foreground">{lead.pitch}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Email Draft:</p>
                          <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">
                            {lead.emailDraft}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="marketing" className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Marketing Content</h3>
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">LinkedIn Post</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
                        {result.marketingContent?.linkedinPost}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Instagram Caption</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
                        {result.marketingContent?.instagramCaption}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Website/Facebook Promo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-md">
                        {result.marketingContent?.websitePromo}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="followups" className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Follow-up Templates</h3>
                </div>
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">After 2 Days</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
                        {result.followUpTemplates?.day2}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">After 7 Days</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
                        {result.followUpTemplates?.day7}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">After 14 Days</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
                        {result.followUpTemplates?.day14}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="growth" className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Student Growth Ideas</h3>
                <div className="space-y-3">
                  {result.studentGrowthIdeas?.map((idea: string, idx: number) => (
                    <Card key={idx}>
                      <CardContent className="pt-6">
                        <p className="text-sm">{idea}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {result && result.competitorAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Strategy Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="competitors" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="competitors">Competitors</TabsTrigger>
                <TabsTrigger value="targets">New Targets</TabsTrigger>
                <TabsTrigger value="monthly">Monthly Plan</TabsTrigger>
                <TabsTrigger value="partnerships">Partnerships</TabsTrigger>
              </TabsList>

              <TabsContent value="competitors" className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Competitor Analysis</h3>
                <ScrollArea className="h-[500px] pr-4">
                  {result.competitorAnalysis?.map((comp: any, idx: number) => (
                    <Card key={idx} className="mb-4">
                      <CardHeader>
                        <CardTitle className="text-base">{comp.competitor}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <p className="text-sm font-medium">Strengths:</p>
                          <p className="text-sm text-muted-foreground">{comp.strengths}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Our Opportunities:</p>
                          <p className="text-sm text-muted-foreground">{comp.opportunities}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="targets" className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">New Company Targets</h3>
                <ScrollArea className="h-[500px] pr-4">
                  {result.newCompanyTargets?.map((target: any, idx: number) => (
                    <Card key={idx} className="mb-4">
                      <CardHeader>
                        <CardTitle className="text-base">{target.companyName}</CardTitle>
                        <CardDescription>{target.industry} - Priority: {target.priority}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{target.reason}</p>
                      </CardContent>
                    </Card>
                  ))}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="monthly" className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Monthly Outreach Plan</h3>
                <div className="grid gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Week 1</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{result.monthlyOutreachPlan?.week1Focus}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Week 2</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{result.monthlyOutreachPlan?.week2Focus}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Week 3</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{result.monthlyOutreachPlan?.week3Focus}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Week 4</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{result.monthlyOutreachPlan?.week4Focus}</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-base font-semibold mb-3">Sponsored Listing Ideas</h4>
                  <div className="space-y-2">
                    {result.sponsoredListingIdeas?.map((idea: string, idx: number) => (
                      <Card key={idx}>
                        <CardContent className="pt-4">
                          <p className="text-sm">{idea}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="partnerships" className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Partnership Opportunities</h3>
                <ScrollArea className="h-[500px] pr-4">
                  {result.partnershipOpportunities?.map((partner: any, idx: number) => (
                    <Card key={idx} className="mb-4">
                      <CardHeader>
                        <CardTitle className="text-base">{partner.organization}</CardTitle>
                        <CardDescription>{partner.type}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <p className="text-sm font-medium">Benefit:</p>
                          <p className="text-sm text-muted-foreground">{partner.benefit}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Approach:</p>
                          <p className="text-sm text-muted-foreground">{partner.approach}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
