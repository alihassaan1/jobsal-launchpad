import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import AdminLayout from "@/components/AdminLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import JobsByCategory from "./pages/JobsByCategory";
import JobsByLocation from "./pages/JobsByLocation";
import EmployerDashboard from "./pages/EmployerDashboard";
import CandidateDashboard from "./pages/CandidateDashboard";
import ATSJobApplications from "./pages/ATSJobApplications";
import ResumeTemplates from "./pages/ResumeTemplates";
import ResumeBuilder from "./pages/ResumeBuilder";
import MyResumes from "./pages/MyResumes";
import SavedJobs from "./pages/SavedJobs";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSubscriptions from "./pages/AdminSubscriptions";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminRevenue from "./pages/AdminRevenue";
import AdminCompanies from "./pages/AdminCompanies";
import AdminUsers from "./pages/AdminUsers";
import AdminSettings from "./pages/AdminSettings";
import AdminJobs from "./pages/AdminJobs";
import AdminTemplates from "./pages/AdminTemplates";
import AdminMarketingAgent from "./pages/AdminMarketingAgent";
import AdminContentGenerator from "./pages/AdminContentGenerator";
import AdminAIAgent from "./pages/AdminAIAgent";
import AdminAIAgentLogs from "./pages/AdminAIAgentLogs";
import AdminAIAgentAnalytics from "./pages/AdminAIAgentAnalytics";
import EmployerAnalytics from "./pages/EmployerAnalytics";
import EmployerSubscription from "./pages/EmployerSubscription";
import RecommendedJobs from "./pages/RecommendedJobs";
import Pricing from "./pages/Pricing";
import ResumeBuilderLanding from "./pages/ResumeBuilderLanding";
import ResumeBuilderLandingAL from "./pages/ResumeBuilderLandingAL";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import AdminBlog from "./pages/AdminBlog";
import AdminEmails from "./pages/AdminEmails";

import Companies from "./pages/Companies";
import CompanyProfile from "./pages/CompanyProfile";
import EmployerCompanyProfile from "./pages/EmployerCompanyProfile";
import SetupCompany from "./pages/SetupCompany";
import NotFound from "./pages/NotFound";
import AdminAds from "./pages/AdminAds";
import AdminAdAnalytics from "./pages/AdminAdAnalytics";
import AdminPromoCodes from "./pages/AdminPromoCodes";
import AdminInvoices from "./pages/AdminInvoices";
import AdminBillingSettings from "./pages/AdminBillingSettings";
import EmployerAds from "./pages/EmployerAds";
import EmployerAdCheckout from "./pages/EmployerAdCheckout";
import EmployerBilling from "./pages/EmployerBilling";
import CandidateVisibility from "./pages/CandidateVisibility";
import EmployerTalentPool from "./pages/EmployerTalentPool";
import ImpersonationBanner from "./components/ImpersonationBanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <ImpersonationBanner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/category/:category" element={<JobsByCategory />} />
            <Route path="/jobs/location/:city" element={<JobsByLocation />} />
            <Route path="/jobs/:slug" element={<JobDetail />} />
            <Route path="/dashboard" element={<EmployerDashboard />} />
            <Route path="/my-applications" element={<CandidateDashboard />} />
            <Route path="/ats/jobs/:jobId" element={<ATSJobApplications />} />
            <Route path="/resume-templates" element={<ResumeTemplates />} />
            <Route path="/resume-builder" element={<ResumeBuilder />} />
            <Route path="/my-resumes" element={<MyResumes />} />
            <Route path="/saved-jobs" element={<SavedJobs />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="companies" element={<AdminCompanies />} />
              <Route path="jobs" element={<AdminJobs />} />
              <Route path="revenue" element={<AdminRevenue />} />
              <Route path="subscriptions" element={<AdminSubscriptions />} />
              <Route path="marketing-agent" element={<AdminMarketingAgent />} />
              <Route path="content-generator" element={<AdminContentGenerator />} />
              <Route path="ai-agent" element={<AdminAIAgent />} />
              <Route path="ai-agent/logs" element={<AdminAIAgentLogs />} />
              <Route path="ai-agent/analytics" element={<AdminAIAgentAnalytics />} />
              <Route path="blog" element={<AdminBlog />} />
              <Route path="emails" element={<AdminEmails />} />
              <Route path="templates" element={<AdminTemplates />} />
              <Route path="ads" element={<AdminAds />} />
              <Route path="ad-analytics" element={<AdminAdAnalytics />} />
              <Route path="promo-codes" element={<AdminPromoCodes />} />
              <Route path="invoices" element={<AdminInvoices />} />
              <Route path="billing-settings" element={<AdminBillingSettings />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            <Route path="/employer/analytics" element={<EmployerAnalytics />} />
            <Route path="/employer/subscription" element={<EmployerSubscription />} />
            <Route path="/employer/ads" element={<EmployerAds />} />
            <Route path="/employer/ads/checkout" element={<EmployerAdCheckout />} />
            <Route path="/employer/billing" element={<EmployerBilling />} />
            <Route path="/employer/talent" element={<EmployerTalentPool />} />
            <Route path="/candidate/visibility" element={<CandidateVisibility />} />
            <Route path="/recommended-jobs" element={<RecommendedJobs />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/ai-resume-builder" element={<ResumeBuilderLanding />} />
            <Route path="/resume-builder-al" element={<ResumeBuilderLandingAL />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/companies/:slug" element={<CompanyProfile />} />
            <Route path="/dashboard/company" element={<EmployerCompanyProfile />} />
            <Route path="/setup-company" element={<SetupCompany />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
