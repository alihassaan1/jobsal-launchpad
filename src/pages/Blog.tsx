import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Eye, ArrowRight, Tag } from "lucide-react";
import { Helmet } from "react-helmet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Blog = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<any[]>([]);
  const [popularPosts, setPopularPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedLanguage, setSelectedLanguage] = useState(searchParams.get('lang') || 'all');
  const [page, setPage] = useState(1);
  const POSTS_PER_PAGE = 9;

  useEffect(() => {
    fetchPosts();
    fetchPopularPosts();
    fetchCategories();
  }, [searchQuery, selectedCategory, selectedLanguage, page]);

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase
      .from('posts')
      .select('*, profiles!posts_author_id_fkey(full_name)')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .range((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE - 1);

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
    }

    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory);
    }

    if (selectedLanguage !== 'all') {
      query = query.eq('language', selectedLanguage);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
    }
    
    if (data) {
      setPosts(data);
    }
    setLoading(false);
  };

  const fetchPopularPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('id, title, slug, views_count')
      .eq('is_published', true)
      .order('views_count', { ascending: false })
      .limit(5);

    if (data) setPopularPosts(data);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('posts')
      .select('category')
      .eq('is_published', true);

    if (data) {
      const uniqueCategories = [...new Set(data.map(p => p.category))];
      setCategories(uniqueCategories);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    updateParams({ search: value });
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    updateParams({ category: value });
  };

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    updateParams({ lang: value });
  };

  const updateParams = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'all') {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Helmet>
        <title>Blog - Career Tips, Job Market Insights & Resume Advice | Jobs.al</title>
        <meta name="description" content="Explore expert career advice, job market trends, and resume tips on the Jobs.al blog. Stay informed about employment opportunities in Albania and beyond." />
        <meta name="keywords" content="career blog, job market Albania, resume tips, employment advice, career guidance" />
        <meta property="og:title" content="Blog - Career Tips & Job Market Insights | Jobs.al" />
        <meta property="og:description" content="Expert career advice and job market insights for professionals in Albania" />
        <link rel="canonical" href="https://jobs.al/blog" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <section className="bg-gradient-hero py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Jobs.al Blog
            </h1>
            <p className="text-xl text-white/90 max-w-2xl">
              Career insights, job market trends, and expert advice to help you succeed
            </p>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="border-b bg-background sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                  <SelectItem value="al">🇦🇱 Shqip</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Posts Grid */}
              <div className="lg:col-span-2">
                {loading ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <div className="h-48 bg-muted"></div>
                        <CardHeader>
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">No articles found. Try adjusting your filters.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {posts.map((post) => (
                      <Card 
                        key={post.id} 
                        className="hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
                        onClick={() => navigate(`/blog/${post.slug}`)}
                      >
                        {post.featured_image && (
                          <div className="overflow-hidden h-48">
                            <img 
                              src={post.featured_image} 
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <CardHeader>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">{post.category}</Badge>
                            <span className="text-sm">
                              {post.language === 'en' ? '🇬🇧' : '🇦🇱'}
                            </span>
                          </div>
                          <CardTitle className="group-hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {post.excerpt}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(post.published_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {post.views_count}
                              </span>
                            </div>
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {!loading && posts.length > 0 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => p + 1)}
                      disabled={posts.length < POSTS_PER_PAGE}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Popular Posts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Popular Articles</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {popularPosts.map((post, index) => (
                      <div
                        key={post.id}
                        className="flex items-start gap-3 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigate(`/blog/${post.slug}`)}
                      >
                        <span className="text-2xl font-bold text-primary/20">{index + 1}</span>
                        <div className="flex-1">
                          <p className="font-medium text-sm line-clamp-2">{post.title}</p>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Eye className="h-3 w-3" />
                            {post.views_count} views
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Categories */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <Badge
                          key={cat}
                          variant={selectedCategory === cat ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleCategoryChange(cat)}
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Blog;
