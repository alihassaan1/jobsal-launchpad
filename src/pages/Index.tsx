import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MapPin, Building2, Users, TrendingUp, Star, ArrowRight, Briefcase, Clock, DollarSign } from "lucide-react";

const Index = () => {
  const featuredJobs = [
    {
      id: 1,
      title: "Senior Frontend Developer",
      company: "TechCorp Albania",
      location: "Tirana, Albania",
      salary: "€3,000 - €4,500",
      type: "Full-time",
      logo: "TC",
      featured: true,
      skills: ["React", "TypeScript", "Node.js"]
    },
    {
      id: 2,
      title: "Marketing Manager",
      company: "Digital Agency",
      location: "Durres, Albania",
      salary: "€2,200 - €3,000",
      type: "Full-time",
      logo: "DA",
      featured: false,
      skills: ["Digital Marketing", "SEO", "Analytics"]
    },
    {
      id: 3,
      title: "UX/UI Designer",
      company: "Creative Studio",
      location: "Remote",
      salary: "€2,500 - €3,500",
      type: "Remote",
      logo: "CS",
      featured: true,
      skills: ["Figma", "Sketch", "Prototyping"]
    }
  ];

  const jobCategories = [
    { name: "Technology", count: 245, icon: "💻" },
    { name: "Marketing", count: 189, icon: "📈" },
    { name: "Design", count: 156, icon: "🎨" },
    { name: "Sales", count: 134, icon: "💼" },
    { name: "Finance", count: 98, icon: "💰" },
    { name: "Healthcare", count: 87, icon: "🏥" },
    { name: "Education", count: 76, icon: "📚" },
    { name: "Engineering", count: 65, icon: "⚙️" }
  ];

  const testimonials = [
    {
      name: "Arta Berisha",
      role: "Software Engineer",
      company: "Tech Solutions",
      content: "Found my dream job through jobs.al in just 2 weeks! The platform is amazing.",
      avatar: "AB"
    },
    {
      name: "Marko Petrovic",
      role: "Marketing Director",
      company: "Creative Agency",
      content: "As an employer, jobs.al helped us find the perfect candidates quickly.",
      avatar: "MP"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                jobs.al
              </div>
              <nav className="hidden md:flex space-x-6">
                <a href="#" className="text-foreground hover:text-primary transition-colors">Find Jobs</a>
                <a href="#" className="text-foreground hover:text-primary transition-colors">Companies</a>
                <a href="#" className="text-foreground hover:text-primary transition-colors">Post Job</a>
                <a href="#" className="text-foreground hover:text-primary transition-colors">Resources</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost">Login</Button>
              <Button>Sign Up</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Find Your Dream Job in Albania
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Discover thousands of job opportunities from top companies across Albania. Your career journey starts here.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-xl">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Job title or keyword" className="pl-10" />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Location" className="pl-10" />
              </div>
              <Button size="lg" className="w-full">
                Search Jobs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 text-white">
            <div>
              <div className="text-3xl font-bold">1,200+</div>
              <div className="text-white/80">Active Jobs</div>
            </div>
            <div>
              <div className="text-3xl font-bold">500+</div>
              <div className="text-white/80">Companies</div>
            </div>
            <div>
              <div className="text-3xl font-bold">10,000+</div>
              <div className="text-white/80">Job Seekers</div>
            </div>
            <div>
              <div className="text-3xl font-bold">95%</div>
              <div className="text-white/80">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Jobs</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover hand-picked job opportunities from top employers in Albania
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>{job.logo}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <CardDescription>{job.company}</CardDescription>
                      </div>
                    </div>
                    {job.featured && (
                      <Badge variant="default">Featured</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      {job.location}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-success">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {job.salary}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {job.type}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <Button className="w-full">Apply Now</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" size="lg">
              View All Jobs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Job Categories */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Browse by Category</h2>
            <p className="text-muted-foreground">
              Explore job opportunities across different industries
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {jobCategories.map((category) => (
              <Card key={category.name} className="text-center hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="text-4xl mb-4">{category.icon}</div>
                  <h3 className="font-semibold mb-2">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.count} jobs</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-muted-foreground">
              Success stories from job seekers and employers
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name}>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <Avatar className="mr-3">
                      <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role} at {testimonial.company}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Career Journey?
          </h2>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of job seekers and employers who trust jobs.al for their career needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              <Users className="mr-2 h-4 w-4" />
              Find Jobs
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-primary">
              <Building2 className="mr-2 h-4 w-4" />
              Post a Job
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-4">
                jobs.al
              </div>
              <p className="text-muted-foreground mb-4">
                Albania's leading job portal connecting talents with opportunities.
              </p>
              <div className="text-sm text-muted-foreground">
                © 2024 jobs.al. All rights reserved.
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Job Seekers</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Browse Jobs</a></li>
                <li><a href="#" className="hover:text-primary">Career Advice</a></li>
                <li><a href="#" className="hover:text-primary">Resume Builder</a></li>
                <li><a href="#" className="hover:text-primary">Salary Guide</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Employers</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Post a Job</a></li>
                <li><a href="#" className="hover:text-primary">Browse Resumes</a></li>
                <li><a href="#" className="hover:text-primary">Pricing Plans</a></li>
                <li><a href="#" className="hover:text-primary">ATS Integration</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">About Us</a></li>
                <li><a href="#" className="hover:text-primary">Contact</a></li>
                <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary">Terms of Service</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
