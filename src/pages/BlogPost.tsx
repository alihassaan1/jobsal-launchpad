import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Eye, ArrowLeft, Share2, Facebook, Linkedin } from "lucide-react";
import { Helmet } from "react-helmet";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [author, setAuthor] = useState<any>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchPost();
      incrementViews();
    }
  }, [slug]);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles!posts_author_id_fkey(full_name, avatar_url)')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error) {
      console.error('Error fetching post:', error);
      toast.error("Post not found");
      navigate('/blog');
      return;
    }

    if (data) {
      setPost(data);
      // Handle case where author profile might not exist
      setAuthor(data.profiles || { full_name: 'Anonymous', avatar_url: null });
      fetchRelatedPosts(data.category, data.id);
    }
    setLoading(false);
  };

  const incrementViews = async () => {
    await supabase.rpc('increment_post_views', { post_slug: slug });
  };

  const fetchRelatedPosts = async (category: string, currentId: string) => {
    const { data } = await supabase
      .from('posts')
      .select('id, title, slug, excerpt, featured_image, category, published_at')
      .eq('category', category)
      .eq('is_published', true)
      .neq('id', currentId)
      .limit(3);

    if (data) setRelatedPosts(data);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = post?.title || '';

  const handleShare = (platform: string) => {
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto animate-pulse">
              <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-64 bg-muted rounded mb-8"></div>
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!post) return null;

  return (
    <>
      <Navigation />
      <Helmet>
        <html lang={post.language} />
        <title>{post.meta_title || post.title} | Jobs.al Blog</title>
        <meta name="description" content={post.meta_description || post.excerpt} />
        <meta name="keywords" content={post.tags?.join(', ')} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={shareUrl} />
        {post.featured_image && <meta property="og:image" content={post.featured_image} />}
        <meta property="article:published_time" content={post.published_at} />
        <meta property="article:author" content={author?.full_name} />
        <link rel="canonical" href={shareUrl} />
        
        {/* Schema.org Article Markup */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post.title,
            "description": post.excerpt,
            "image": post.featured_image,
            "datePublished": post.published_at,
            "dateModified": post.updated_at,
            "author": {
              "@type": "Person",
              "name": author?.full_name || "Jobs.al Team"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Jobs.al",
              "logo": {
                "@type": "ImageObject",
                "url": "https://jobs.al/logo.png"
              }
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Back Button */}
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={() => navigate('/blog')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </div>
        </div>

        {/* Article Content */}
        <article className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Badge>{post.category}</Badge>
                  <span className="text-sm">{post.language === 'en' ? '🇬🇧 English' : '🇦🇱 Shqip'}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                  {post.title}
                </h1>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-white">
                        {author?.full_name?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                     <div>
                      <p className="font-medium">{author?.full_name || 'Ethan'}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(post.published_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {post.views_count} views
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Share Buttons */}
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleShare('facebook')}>
                      <Facebook className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleShare('linkedin')}>
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleShare('whatsapp')}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={copyLink}>
                      Copy Link
                    </Button>
                  </div>
                </div>
              </div>

              {/* Featured Image */}
              {post.featured_image && (
                <div className="mb-8 rounded-lg overflow-hidden bg-muted shadow-lg">
                  <img 
                    src={post.featured_image} 
                    alt={post.title}
                    loading="lazy"
                    className="w-full h-auto max-h-[500px] object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Content */}
              <div className="prose prose-lg max-w-none mb-12 
                [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4 
                [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 
                [&_p]:mb-4 [&_p]:leading-relaxed
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-2
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-2
                [&_table]:w-full [&_table]:border-collapse [&_table]:my-6
                [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-3 [&_th]:text-left [&_th]:font-semibold
                [&_td]:border [&_td]:border-border [&_td]:p-3
                [&_strong]:font-semibold [&_strong]:text-foreground
                [&_em]:italic
                [&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80">
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mb-8 pt-8 border-t">
                  <p className="text-sm font-medium mb-3">Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold mb-8">Related Articles</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {relatedPosts.map(relatedPost => (
                    <Card
                      key={relatedPost.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => navigate(`/blog/${relatedPost.slug}`)}
                    >
                      {relatedPost.featured_image && (
                        <div className="h-48 overflow-hidden bg-muted">
                          <img
                            src={relatedPost.featured_image}
                            alt={relatedPost.title}
                            loading="lazy"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <CardContent className="p-6">
                        <Badge variant="secondary" className="mb-2">
                          {relatedPost.category}
                        </Badge>
                        <h3 className="font-semibold mb-2 line-clamp-2">
                          {relatedPost.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                        <p className="text-xs text-muted-foreground mt-3">
                          {formatDate(relatedPost.published_at)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default BlogPost;
