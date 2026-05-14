import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, Building2, User } from 'lucide-react';
import { Helmet } from 'react-helmet';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const startsAsEmployer = searchParams.get('type') === 'employer';
  const { signUp, signIn, signInWithGoogle, signInWithLinkedIn, resetPassword, user, userRole, loading: authLoading } = useAuth();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [accountType, setAccountType] = useState<'job_seeker' | 'employer'>(startsAsEmployer ? 'employer' : 'job_seeker');
  const [authTab, setAuthTab] = useState(startsAsEmployer ? 'register' : 'login');
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [resettingPw, setResettingPw] = useState(false);

  // Redirect if already logged in
  if (user) {
    if (authLoading || !userRole) return null;
    navigate(userRole === 'employer' ? '/setup-company' : '/');
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);
    const { error } = await signIn(loginEmail, loginPassword);
    setLoading(false);
    if (!error) {
      navigate(startsAsEmployer ? '/setup-company' : '/');
    } else {
      setLoginError(error.message || 'Login failed');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, signedIn } = await signUp(registerEmail, registerPassword, registerName, accountType);
    setLoading(false);
    if (!error) {
      if (signedIn) {
        navigate(accountType === 'employer' ? '/setup-company' : '/');
        return;
      }
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterName('');
      setAuthTab('login');
    }
  };

  const handleResetPassword = async () => {
    if (!loginEmail) {
      setLoginError('Enter your email above first, then click "Forgot password".');
      return;
    }
    setResettingPw(true);
    await resetPassword(loginEmail);
    setResettingPw(false);
  };

  return (
    <>
      <Helmet>
        <title>Sign In or Register | Jobs.al - Albania Job Portal</title>
        <meta name="description" content="Create your free Jobs.al account or sign in to access Albania's top job opportunities. Connect with employers, build your resume, and track your applications." />
        <meta name="keywords" content="jobs albania login, register job seeker, employer sign in, albania job portal account" />
        <link rel="canonical" href="https://jobs.al/auth" />
        <meta property="og:title" content="Sign In or Create Account | Jobs.al" />
        <meta property="og:description" content="Join Albania's premier job portal. Access thousands of job opportunities and connect with top employers." />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Jobs.al</CardTitle>
          <CardDescription>
            Albania's primary job portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={authTab} onValueChange={setAuthTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={resettingPw}
                    className="text-xs text-primary hover:underline"
                  >
                    {resettingPw ? 'Sending reset link…' : 'Forgot password?'}
                  </button>
                </div>
                {loginError && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm space-y-2">
                    <p className="font-medium text-destructive">{loginError}</p>
                    <p className="text-muted-foreground text-xs">
                      Double-check your email and password, or use "Forgot password" to reset it.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={handleResetPassword} disabled={resettingPw || !loginEmail}>
                        {resettingPw ? 'Sending…' : 'Reset password'}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Full Name</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="John Doe"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="you@example.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={accountType === 'job_seeker' ? 'default' : 'outline'}
                      onClick={() => setAccountType('job_seeker')}
                      className="justify-start"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Job seeker
                    </Button>
                    <Button
                      type="button"
                      variant={accountType === 'employer' ? 'default' : 'outline'}
                      onClick={() => setAccountType('employer')}
                      className="justify-start"
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Employer
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : accountType === 'employer' ? 'Create Employer Account' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>
    </>
  );
};

export default Auth;
