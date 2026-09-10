import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate, Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LogOut, User, Sparkles, Bookmark, FileText, Menu } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navigation() {
  const { user, signOut, userRole } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const primaryLinks = [
    { to: "/jobs", label: t('nav.findJobs') },
    { to: "/companies", label: t('nav.companies') },
    { to: "/ai-resume-builder", label: t('nav.resumeBuilder') },
    { to: "/blog", label: t('nav.blog') },
    { to: "/pricing", label: t('nav.pricing') },
  ];

  const dashboardPath = userRole === 'employer' || userRole === 'admin'
    ? '/dashboard'
    : '/my-applications';

  return (
    <header className="border-b bg-background sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-3 py-3 min-[360px]:px-4 lg:py-4">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center lg:gap-5 xl:gap-8">
            <Link to="/" className="relative shrink-0 bg-gradient-hero bg-clip-text text-xl font-bold text-transparent min-[360px]:text-2xl">
              jobs.al
              <div className="absolute inset-0 bg-gradient-hero bg-clip-text text-transparent opacity-50 animate-shine"></div>
            </Link>
            <nav className="hidden items-center gap-3 lg:flex xl:gap-6" aria-label="Primary navigation">
              {primaryLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group relative whitespace-nowrap text-xs text-foreground transition-colors duration-300 hover:text-primary xl:text-sm"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="hidden shrink-0 items-center gap-1 lg:flex xl:gap-3">
            <div className="hidden xl:block"><LanguageSwitcher /></div>
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
                    {userRole === 'employer' || userRole === 'admin' ? t('nav.dashboard') : t('nav.myApplications')}
                  </DropdownMenuItem>
                  {userRole === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                      {t('nav.adminPanel')}
                    </DropdownMenuItem>
                  )}
                  {userRole === 'job_seeker' && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/recommended-jobs')}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {t('nav.aiRecommendedJobs')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/my-applications')}>
                        {t('nav.myApplications')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/saved-jobs')}>
                        <Bookmark className="mr-2 h-4 w-4" />
                        Saved Jobs
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/my-resumes')}>
                        {t('nav.myResumes')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/my-documents')}>
                        <FileText className="mr-2 h-4 w-4" />
                        My Documents
                      </DropdownMenuItem>

                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('nav.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="hover:scale-105 transition-transform duration-200">{t('nav.login')}</Button>
                <Button size="sm" onClick={() => navigate('/auth')} className="hover:scale-105 transition-transform duration-200 shadow-lg hover:shadow-xl">{t('nav.signup')}</Button>
              </>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-0.5 lg:hidden">
            <LanguageSwitcher />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Open navigation menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex w-[min(88vw,22rem)] flex-col overflow-y-auto p-5 pt-6">
                <SheetHeader className="border-b pb-4 text-left">
                  <SheetTitle className="text-xl text-primary">jobs.al</SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col py-3" aria-label="Mobile navigation">
                  {primaryLinks.map((item) => (
                    <SheetClose asChild key={item.to}>
                      <Link
                        to={item.to}
                        className="flex min-h-11 items-center border-b px-1 text-base font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>

                <div className="mt-auto space-y-2 border-t pt-4">
                  {user ? (
                    <>
                      <p className="break-all px-1 pb-2 text-sm text-muted-foreground">{user.email}</p>
                      <SheetClose asChild>
                        <Button variant="outline" className="w-full justify-start" onClick={() => navigate(dashboardPath)}>
                          <User className="h-4 w-4" />
                          {userRole === 'employer' || userRole === 'admin' ? t('nav.dashboard') : t('nav.myApplications')}
                        </Button>
                      </SheetClose>
                      {userRole === 'admin' && (
                        <SheetClose asChild>
                          <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin/dashboard')}>
                            {t('nav.adminPanel')}
                          </Button>
                        </SheetClose>
                      )}
                      {userRole === 'job_seeker' && (
                        <>
                          <SheetClose asChild><Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/recommended-jobs')}><Sparkles className="h-4 w-4" />{t('nav.aiRecommendedJobs')}</Button></SheetClose>
                          <SheetClose asChild><Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/saved-jobs')}><Bookmark className="h-4 w-4" />Saved Jobs</Button></SheetClose>
                          <SheetClose asChild><Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/my-resumes')}>{t('nav.myResumes')}</Button></SheetClose>
                          <SheetClose asChild><Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/my-documents')}><FileText className="h-4 w-4" />My Documents</Button></SheetClose>
                        </>
                      )}
                      <SheetClose asChild>
                        <Button variant="ghost" className="w-full justify-start" onClick={() => signOut()}>
                          <LogOut className="h-4 w-4" />{t('nav.signOut')}
                        </Button>
                      </SheetClose>
                    </>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 min-[340px]:grid-cols-2">
                      <SheetClose asChild><Button variant="outline" onClick={() => navigate('/auth')}>{t('nav.login')}</Button></SheetClose>
                      <SheetClose asChild><Button onClick={() => navigate('/auth')}>{t('nav.signup')}</Button></SheetClose>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
