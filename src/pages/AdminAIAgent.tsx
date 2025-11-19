import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, FileText, Briefcase, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminAIAgent() {
  const { toast } = useToast();
  const [blogTopic, setBlogTopic] = useState("");
  const [blogKeywords, setBlogKeywords] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [isBlogGenerating, setIsBlogGenerating] = useState(false);
  const [isJobScraping, setIsJobScraping] = useState(false);

  const generateBlogPost = async () => {
    if (!blogTopic.trim() || !blogKeywords.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both topic and keywords",
        variant: "destructive",
      });
      return;
    }

    setIsBlogGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-post', {
        body: {
          topic: blogTopic,
          keywords: blogKeywords.split(',').map(k => k.trim())
        }
      });

      if (error) throw error;

      toast({
        title: "Blog Post Generated!",
        description: "The AI has created a new blog post draft. Check the blog admin to review and publish it.",
      });

      setBlogTopic("");
      setBlogKeywords("");
    } catch (error: any) {
      console.error('Error generating blog post:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate blog post",
        variant: "destructive",
      });
    } finally {
      setIsBlogGenerating(false);
    }
  };

  const scrapeJobPost = async () => {
    if (!jobUrl.trim() || !companyId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both job URL and company ID",
        variant: "destructive",
      });
      return;
    }

    setIsJobScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-jobs', {
        body: {
          sourceUrl: jobUrl,
          companyId: companyId
        }
      });

      if (error) throw error;

      toast({
        title: "Job Scraped Successfully!",
        description: "The job has been imported and saved as draft. Review it in Jobs admin before publishing.",
      });

      setJobUrl("");
      setCompanyId("");
    } catch (error: any) {
      console.error('Error scraping job:', error);
      toast({
        title: "Scraping Failed",
        description: error.message || "Failed to scrape job post",
        variant: "destructive",
      });
    } finally {
      setIsJobScraping(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">AI Content Agent</h1>
        <p className="text-muted-foreground mt-2">
          Automate content creation with AI-powered tools
        </p>
      </div>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Legal Warning</AlertTitle>
        <AlertDescription>
          Web scraping may violate Terms of Service and copyright laws. Always obtain explicit permission 
          from website owners before scraping their content. Use the job scraper responsibly and ethically.
          Consider using official APIs or manual imports instead.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Blog Post Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              AI Blog Post Generator
            </CardTitle>
              <CardDescription>
                Generate SEO-optimized blog posts about the Albanian job market with AI-generated images
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="blog-topic">Blog Topic</Label>
                <Input
                  id="blog-topic"
                  placeholder="e.g., Top IT Skills in Albania 2025"
                  value={blogTopic}
                  onChange={(e) => setBlogTopic(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                <Textarea
                  id="keywords"
                  placeholder="e.g., IT jobs Albania, tech skills, programming, Tirana"
                  value={blogKeywords}
                  onChange={(e) => setBlogKeywords(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={generateBlogPost}
                disabled={isBlogGenerating}
                className="w-full"
              >
                {isBlogGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Blog Post
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground">
                This will create a draft blog post with AI-generated content and featured image. 
                Review and edit before publishing.
              </p>
            </CardContent>
          </Card>

          {/* Job Scraper */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Job Post Scraper & Rewriter
              </CardTitle>
              <CardDescription>
                Import job posts from external websites and rewrite them with AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="job-url">Job Posting URL</Label>
                <Input
                  id="job-url"
                  placeholder="https://example.com/job-posting"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  type="url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-id">Company ID</Label>
                <Input
                  id="company-id"
                  placeholder="Enter company UUID"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Find the company ID in the Companies admin panel
                </p>
              </div>

              <Button
                onClick={scrapeJobPost}
                disabled={isJobScraping}
                className="w-full"
                variant="secondary"
              >
                {isJobScraping ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Scrape & Import Job
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground">
                ⚠️ Use responsibly. Get permission before scraping. 
                Job will be saved as draft for review.
              </p>
            </CardContent>
          </Card>
      </div>

      {/* Usage Instructions */}
      <Card>
          <CardHeader>
            <CardTitle>How to Use the AI Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Blog Post Generator:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Enter a topic related to the Albanian job market</li>
                <li>Add relevant SEO keywords (comma-separated)</li>
                <li>Click "Generate Blog Post"</li>
                <li>Review the draft in Blog Admin</li>
                <li>Edit if needed and publish</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Job Scraper:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Get permission from the source website (REQUIRED)</li>
                <li>Copy the job posting URL</li>
                <li>Find the company ID from Companies admin</li>
                <li>Click "Scrape & Import Job"</li>
                <li>Review and activate the job in Jobs Admin</li>
              </ol>
            </div>

            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertTitle>AI-Powered Features</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                  <li>Automatic content rewriting for uniqueness</li>
                  <li>SEO optimization with keyword integration</li>
                  <li>AI-generated featured images for blog posts</li>
                  <li>Structured data extraction from job pages</li>
                  <li>Professional formatting and polish</li>
                </ul>
              </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
