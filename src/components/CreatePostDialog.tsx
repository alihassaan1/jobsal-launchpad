import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, FileText, Loader2, ExternalLink, Facebook, Instagram } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
}

const CATEGORIES = [
  "Career Advice",
  "Job Market Trends",
  "Interview Tips",
  "Resume Building",
  "Employer Insights",
  "Salary Guide",
  "Industry Analysis"
];

export function CreatePostDialog({ open, onOpenChange, onSuccess, userId }: CreatePostDialogProps) {
  const [activeTab, setActiveTab] = useState<"ai" | "manual">("ai");
  
  // AI Generation State
  const [blogTopic, setBlogTopic] = useState("");
  const [blogKeywords, setBlogKeywords] = useState("");
  const [generateFacebookPost, setGenerateFacebookPost] = useState(true);
  const [generateInfographic, setGenerateInfographic] = useState(false);
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);
  const [generatedBlogSlug, setGeneratedBlogSlug] = useState<string | null>(null);
  const [generatedFacebookPost, setGeneratedFacebookPost] = useState<string | null>(null);
  const [generatedInfographic, setGeneratedInfographic] = useState<string | null>(null);

  // Manual Creation State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image: '',
    category: '',
    tags: '',
    meta_keywords: '',
    language: 'en',
    is_published: false,
    meta_title: '',
    meta_description: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleAIGenerate = async () => {
    if (!blogTopic.trim() || !blogKeywords.trim()) {
      toast.error("Please provide both topic and keywords");
      return;
    }

    setIsGeneratingBlog(true);
    setGeneratedBlogSlug(null);
    setGeneratedFacebookPost(null);
    setGeneratedInfographic(null);

    try {
      // Use DeepSeek agent with human-style writing and API logging
      const { data, error } = await supabase.functions.invoke('deepseek-agent', {
        body: {
          action: 'generate_blog',
          topic: blogTopic,
          keywords: blogKeywords.split(',').map(k => k.trim()),
          userId: userId,
          options: {
            generateFacebookPost,
            generateInfographic,
            humanStyle: true // Enable human-style writing
          }
        }
      });

      if (error) throw error;

      if (data?.slug) {
        setGeneratedBlogSlug(data.slug);
        toast.success("Blog post generated with human-style writing!");
        
        if (data.facebookPost) {
          setGeneratedFacebookPost(data.facebookPost);
        }
        if (data.infographicUrl) {
          setGeneratedInfographic(data.infographicUrl);
        }

        // Reset form
        setBlogTopic("");
        setBlogKeywords("");
        
        // Refresh and close after short delay
        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
        }, 2000);
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error generating blog post:', error);
      toast.error(error.message || "Failed to generate blog post");
    } finally {
      setIsGeneratingBlog(false);
    }
  };

  const handleManualCreate = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setIsCreating(true);
    try {
      const slug = formData.slug || formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const tagsArray = formData.tags ? formData.tags.split(',').map(t => t.trim()) : [];
      const keywordsArray = formData.meta_keywords ? formData.meta_keywords.split(',').map(k => k.trim()) : [];

      const { error } = await supabase
        .from('posts')
        .insert({
          title: formData.title,
          slug: slug,
          content: formData.content,
          excerpt: formData.excerpt,
          featured_image: formData.featured_image,
          category: formData.category,
          tags: tagsArray,
          meta_keywords: keywordsArray,
          meta_title: formData.meta_title || formData.title,
          meta_description: formData.meta_description || formData.excerpt,
          language: formData.language,
          is_published: formData.is_published,
          author_id: userId,
          published_at: formData.is_published ? new Date().toISOString() : null
        });

      if (error) throw error;

      toast.success("Blog post created successfully!");
      
      // Reset form
      setFormData({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        featured_image: '',
        category: '',
        tags: '',
        meta_keywords: '',
        language: 'en',
        is_published: false,
        meta_title: '',
        meta_description: ''
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating blog post:', error);
      toast.error(error.message || "Failed to create blog post");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Blog Post</DialogTitle>
          <DialogDescription>
            Choose between AI-generated content or manual creation
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "ai" | "manual")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI Generate
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <FileText className="h-4 w-4" />
              Manual Create
            </TabsTrigger>
          </TabsList>

          {/* AI Generation Tab */}
          <TabsContent value="ai" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Top Skills for Tech Jobs in Albania 2025"
                  value={blogTopic}
                  onChange={(e) => setBlogTopic(e.target.value)}
                  disabled={isGeneratingBlog}
                />
              </div>

              <div>
                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                <Input
                  id="keywords"
                  placeholder="e.g., tech jobs Albania, programming skills"
                  value={blogKeywords}
                  onChange={(e) => setBlogKeywords(e.target.value)}
                  disabled={isGeneratingBlog}
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="facebook"
                    checked={generateFacebookPost}
                    onCheckedChange={(checked) => setGenerateFacebookPost(checked as boolean)}
                    disabled={isGeneratingBlog}
                  />
                  <Label htmlFor="facebook" className="flex items-center gap-2 cursor-pointer">
                    <Facebook className="h-4 w-4 text-blue-600" />
                    Facebook Post
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="infographic"
                    checked={generateInfographic}
                    onCheckedChange={(checked) => setGenerateInfographic(checked as boolean)}
                    disabled={isGeneratingBlog}
                  />
                  <Label htmlFor="infographic" className="flex items-center gap-2 cursor-pointer">
                    <Instagram className="h-4 w-4 text-pink-600" />
                    Generate Infographic
                  </Label>
                </div>
              </div>

              <Button
                onClick={handleAIGenerate}
                disabled={isGeneratingBlog || !blogTopic.trim() || !blogKeywords.trim()}
                className="w-full"
                size="lg"
              >
                {isGeneratingBlog ? (
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

              {/* Success Messages */}
              {generatedBlogSlug && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">✓ Blog post created!</span>
                      <a
                        href={`/blog/${generatedBlogSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        View Post <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    {generatedFacebookPost && (
                      <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-xs font-semibold mb-1">Facebook Post:</p>
                        <p className="text-sm">{generatedFacebookPost}</p>
                      </div>
                    )}
                    {generatedInfographic && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold mb-1">Infographic:</p>
                        <img src={generatedInfographic} alt="Generated infographic" className="max-w-xs rounded border" />
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          {/* Manual Creation Tab */}
          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="manual-title">Title *</Label>
                <Input
                  id="manual-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter blog post title"
                />
              </div>

              <div>
                <Label htmlFor="manual-slug">Slug</Label>
                <Input
                  id="manual-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="auto-generated-from-title"
                />
              </div>

              <div>
                <Label htmlFor="manual-category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="manual-excerpt">Excerpt</Label>
                <Textarea
                  id="manual-excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief description of the post"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="manual-content">Content *</Label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                />
              </div>

              <div>
                <Label htmlFor="manual-image">Featured Image URL (recommended)</Label>
                <Input
                  id="manual-image"
                  value={formData.featured_image}
                  onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
                <div className="mt-2">
                  <R2ImageUpload folder="blog" onUploaded={(url) => setFormData({ ...formData, featured_image: url })} />
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: 800x530px (3:2 ratio). Prefer images with darker tones or open space at the bottom so the white title stays readable.
                </p>
              </div>


              <div>
                <Label htmlFor="manual-tags">Tags (comma-separated)</Label>
                <Input
                  id="manual-tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="publish"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked as boolean })}
                />
                <Label htmlFor="publish">Publish immediately</Label>
              </div>

              <Button
                onClick={handleManualCreate}
                disabled={isCreating}
                className="w-full"
                size="lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Blog Post"
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
