import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AdminLayout from "@/components/AdminLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import EmployerDashboard from "./pages/EmployerDashboard";
import CandidateDashboard from "./pages/CandidateDashboard";
import ATSJobApplications from "./pages/ATSJobApplications";
import ResumeTemplates from "./pages/ResumeTemplates";
import ResumeBuilder from "./pages/ResumeBuilder";
import MyResumes from "./pages/MyResumes";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSubscriptions from "./pages/AdminSubscriptions";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminRevenue from "./pages/AdminRevenue";
import AdminCompanies from "./pages/AdminCompanies";
import AdminUsers from "./pages/AdminUsers";
import AdminSettings from "./pages/AdminSettings";
import AdminJobs from "./pages/AdminJobs";
import AdminTemplates from "./pages/AdminTemplates";
import AdminAIAgent from "./pages/AdminAIAgent";
import EmployerAnalytics from "./pages/EmployerAnalytics";
import EmployerSubscription from "./pages/EmployerSubscription";
import RecommendedJobs from "./pages/RecommendedJobs";
import Pricing from "./pages/Pricing";
import ResumeBuilderLanding from "./pages/ResumeBuilderLanding";
import ResumeBuilderLandingAL from "./pages/ResumeBuilderLandingAL";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import AdminBlog from "./pages/AdminBlog";
import Sitemap from "./pages/Sitemap";
import Companies from "./pages/Companies";
import CompanyProfile from "./pages/CompanyProfile";
import EmployerCompanyProfile from "./pages/EmployerCompanyProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:slug" element={<JobDetail />} />
            <Route path="/dashboard" element={<EmployerDashboard />} />
            <Route path="/my-applications" element={<CandidateDashboard />} />
            <Route path="/ats/jobs/:jobId" element={<ATSJobApplications />} />
            <Route path="/resume-templates" element={<ResumeTemplates />} />
            <Route path="/resume-builder" element={<ResumeBuilder />} />
            <Route path="/my-resumes" element={<MyResumes />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="companies" element={<AdminCompanies />} />
              <Route path="jobs" element={<AdminJobs />} />
              <Route path="revenue" element={<AdminRevenue />} />
              <Route path="subscriptions" element={<AdminSubscriptions />} />
              <Route path="templates" element={<AdminTemplates />} />
              <Route path="ai-agent" element={<AdminAIAgent />} />
              <Route path="blog" element={<AdminBlog />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            
            <Route path="/employer/analytics" element={<EmployerAnalytics />} />
            <Route path="/employer/subscription" element={<EmployerSubscription />} />
            <Route path="/recommended-jobs" element={<RecommendedJobs />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/ai-resume-builder" element={<ResumeBuilderLanding />} />
            <Route path="/resume-builder-al" element={<ResumeBuilderLandingAL />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/companies/:slug" element={<CompanyProfile />} />
            <Route path="/dashboard/company" element={<EmployerCompanyProfile />} />
            <Route path="/sitemap.xml" element={<Sitemap />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
