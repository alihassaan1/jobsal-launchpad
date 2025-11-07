import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Sparkles } from "lucide-react";

export default function Navigation() {
  const { user, signOut, userRole } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <a href="/" className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent relative">
              jobs.al
              <div className="absolute inset-0 bg-gradient-hero bg-clip-text text-transparent opacity-50 animate-shine"></div>
            </a>
            <nav className="hidden md:flex space-x-6">
              <a href="/jobs" className="text-foreground hover:text-primary transition-colors duration-300 relative group">
                Find Jobs
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="/companies" className="text-foreground hover:text-primary transition-colors duration-300 relative group">
                Companies
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="/ai-resume-builder" className="text-foreground hover:text-primary transition-colors duration-300 relative group">
                Resume Builder
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="/blog" className="text-foreground hover:text-primary transition-colors duration-300 relative group">
                Blog
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="/pricing" className="text-foreground hover:text-primary transition-colors duration-300 relative group">
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="hover:scale-105 transition-transform duration-200 border-2 border-primary/20 bg-primary/5 hover:bg-primary/10"
                  >
                    <User className="h-5 w-5 text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{userRole || 'User'}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    if (userRole === 'employer' || userRole === 'admin') {
                      navigate('/dashboard');
                    } else {
                      navigate('/my-applications');
                    }
                  }}>
                    {userRole === 'employer' || userRole === 'admin' ? 'Dashboard' : 'My Applications'}
                  </DropdownMenuItem>
                  {userRole === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  {userRole === 'job_seeker' && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/recommended-jobs')}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        AI Recommended Jobs
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/my-applications')}>
                        My Applications
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/my-resumes')}>
                        My Resumes
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/auth')} className="hover:scale-105 transition-transform duration-200">Login</Button>
                <Button onClick={() => navigate('/auth')} className="hover:scale-105 transition-transform duration-200 shadow-lg hover:shadow-xl">Sign Up</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
