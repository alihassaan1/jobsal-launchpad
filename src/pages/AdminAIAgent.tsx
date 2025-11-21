import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, FileText, Facebook, Instagram, TrendingUp, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export default function AdminAIAgent() {
  const { user } = useAuth();
  
  // Blog Post Generation State
  const [blogTopic, setBlogTopic] = useState("");
  const [blogKeywords, setBlogKeywords] = useState("");
  const [generateFacebookPost, setGenerateFacebookPost] = useState(true);
  const [generateInfographic, setGenerateInfographic] = useState(false);
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);
  const [generatedBlogId, setGeneratedBlogId] = useState<string | null>(null);
  const [generatedFacebookPost, setGeneratedFacebookPost] = useState<string | null>(null);
  const [generatedInfographic, setGeneratedInfographic] = useState<string | null>(null);

  // Job Scraping State
  const [jobUrl, setJobUrl] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [isScrapingJob, setIsScrapingJob] = useState(false);

  const generateBlogPost = async () => {
    if (!blogTopic || !blogKeywords) {
      toast.error("Please provide both topic and keywords");
      return;
    }

    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setIsGeneratingBlog(true);
    setGeneratedBlogId(null);
    setGeneratedFacebookPost(null);
    setGeneratedInfographic(null);

    try {
      console.log("Calling generate-blog-post function...");
      const { data, error } = await supabase.functions.invoke("generate-blog-post", {
        body: {
          topic: blogTopic,
          keywords: blogKeywords,
          userId: user.id,
          generateFacebookPost,
          generateInfographic
        }
      });

      if (error) throw error;

      if (data.success) {
        setGeneratedBlogId(data.post.id);
        setGeneratedFacebookPost(data.facebookPost);
        setGeneratedInfographic(data.infographic);

        toast.success("Blog post generated successfully!", {
          description: "Check the blog management page to review and publish it."
        });

        // Reset form
        setBlogTopic("");
        setBlogKeywords("");
      } else {
        throw new Error(data.error || "Failed to generate blog post");
      }
    } catch (error: any) {
      console.error("Error generating blog post:", error);
      toast.error("Failed to generate blog post", {
        description: error.message
      });
    } finally {
      setIsGeneratingBlog(false);
    }
  };

  const scrapeJobPost = async () => {
    if (!jobUrl || !companyId) {
      toast.error("Please provide both job URL and company ID");
      return;
    }

    setIsScrapingJob(true);

    try {
      const { data, error } = await supabase.functions.invoke("scrape-jobs", {
        body: {
          url: jobUrl,
          companyId: companyId
        }
      });

      if (error) throw error;

      toast.success("Job post scraped successfully!", {
        description: "The job has been added to the platform."
      });

      setJobUrl("");
      setCompanyId("");
    } catch (error: any) {
      console.error("Error scraping job:", error);
      toast.error("Failed to scrape job post", {
        description: error.message
      });
    } finally {
      setIsScrapingJob(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">AI Content Agent</h1>
          <p className="text-muted-foreground">
            Automate content creation and job aggregation for Jobs.al
          </p>
        </div>
      </div>

      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          <strong>Powered by DeepSeek AI & Lovable AI:</strong> This agent uses DeepSeek for intelligent content generation and Lovable AI for image creation. All generated images are stored in Supabase Storage with public URLs for reliable access.
        </AlertDescription>
      </Alert>

      {/* Blog Post Generator */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>AI Blog Post Generator</CardTitle>
          </div>
          <CardDescription>
            Generate SEO-optimized blog posts about the Albanian job market with AI-created images, Facebook posts, and infographics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="blog-topic">Topic</Label>
            <Input
              id="blog-topic"
              value={blogTopic}
              onChange={(e) => setBlogTopic(e.target.value)}
              placeholder="e.g., Top Skills for Tech Jobs in Albania 2025"
              disabled={isGeneratingBlog}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-keywords">Keywords (comma-separated)</Label>
            <Input
              id="blog-keywords"
              value={blogKeywords}
              onChange={(e) => setBlogKeywords(e.target.value)}
              placeholder="e.g., tech jobs Albania, programming skills, software developer"
              disabled={isGeneratingBlog}
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="facebook-post"
                checked={generateFacebookPost}
                onCheckedChange={(checked) => setGenerateFacebookPost(checked as boolean)}
                disabled={isGeneratingBlog}
              />
              <label
                htmlFor="facebook-post"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                Generate Facebook Post
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="infographic"
                checked={generateInfographic}
                onCheckedChange={(checked) => setGenerateInfographic(checked as boolean)}
                disabled={isGeneratingBlog}
              />
              <label
                htmlFor="infographic"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4 text-green-600" />
                Generate Job Market Infographic (for Instagram & Facebook)
              </label>
            </div>
          </div>

          <Button
            onClick={generateBlogPost}
            disabled={isGeneratingBlog || !blogTopic || !blogKeywords}
            className="w-full"
          >
            {isGeneratingBlog ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Content with AI...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Blog Post
              </>
            )}
          </Button>

          {generatedBlogId && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="space-y-2">
                <p className="font-semibold text-green-800">✅ Blog post generated successfully!</p>
                <p className="text-sm text-green-700">Blog ID: {generatedBlogId}</p>
                {generatedFacebookPost && (
                  <div className="mt-3 p-3 bg-white rounded border border-green-200">
                    <p className="text-xs font-semibold text-green-800 mb-1 flex items-center gap-1">
                      <Facebook className="h-3 w-3" /> Facebook Post:
                    </p>
                    <Textarea 
                      value={generatedFacebookPost} 
                      readOnly 
                      className="text-sm h-20 resize-none"
                    />
                  </div>
                )}
                {generatedInfographic && (
                  <div className="mt-3 p-3 bg-white rounded border border-green-200">
                    <p className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-1">
                      <Instagram className="h-3 w-3" /> Infographic Generated:
                    </p>
                    <img 
                      src={generatedInfographic} 
                      alt="Job Market Infographic" 
                      className="w-full max-w-sm rounded border"
                    />
                    <a 
                      href={generatedInfographic} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                    >
                      Open full image
                    </a>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <p><strong>What this does:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Uses DeepSeek AI to research Albanian job market topics and generate comprehensive blog content</li>
              <li>Creates SEO-optimized titles, meta descriptions, and structured content</li>
              <li>Generates professional featured images using Lovable AI (stored in Supabase)</li>
              <li>Optionally creates engaging Facebook posts with emojis and CTAs</li>
              <li>Optionally generates data-driven infographics for Instagram & Facebook</li>
              <li>Saves everything to your database for review before publishing</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Job Scraper */}
      <Card>
        <CardHeader>
          <CardTitle>Job Post Scraper & Rewriter</CardTitle>
          <CardDescription>
            Automatically fetch and rewrite job posts from Albanian job websites
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertDescription className="text-amber-800 text-sm">
              <strong>Legal Notice:</strong> Ensure you have permission to scrape content from the target website. This feature is for content aggregation purposes only.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="job-url">Job Post URL</Label>
            <Input
              id="job-url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://duapune.com/jobs/..."
              disabled={isScrapingJob}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-id">Company ID</Label>
            <Input
              id="company-id"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              placeholder="Company UUID from your database"
              disabled={isScrapingJob}
            />
          </div>

          <Button
            onClick={scrapeJobPost}
            disabled={isScrapingJob || !jobUrl || !companyId}
            className="w-full"
          >
            {isScrapingJob ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scraping & Rewriting...
              </>
            ) : (
              "Scrape & Rewrite Job Post"
            )}
          </Button>

          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <p><strong>What this does:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Scrapes job posting content from the provided URL</li>
              <li>Uses AI to rewrite the content to match Jobs.al style</li>
              <li>Automatically publishes to the platform under the specified company</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* How to Use */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use the AI Agent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">📝 Blog Post Generator:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Enter a topic relevant to the Albanian job market</li>
              <li>Add relevant keywords (comma-separated)</li>
              <li>Choose whether to generate Facebook post and/or infographic</li>
              <li>Click "Generate Blog Post"</li>
              <li>Review the generated content in the Blog management page</li>
              <li>Use the Facebook post text for your Facebook page</li>
              <li>Download and share the infographic on Instagram and Facebook</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-2">🔍 Job Scraper:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Find a job posting URL from a supported website</li>
              <li>Get the Company ID from your database</li>
              <li>Paste both into the form</li>
              <li>Click "Scrape & Rewrite Job Post"</li>
            </ol>
          </div>

          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              <strong>AI-Powered Features:</strong> This agent uses advanced AI models to:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Research and write comprehensive blog posts with SEO optimization</li>
                <li>Generate professional images and infographics</li>
                <li>Create engaging social media content</li>
                <li>Store all media in Supabase Storage for reliable access</li>
                <li>Rewrite scraped job content to match your platform's style</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
