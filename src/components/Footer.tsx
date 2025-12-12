import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-secondary py-12 border-t">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4 block">
              jobs.al
            </Link>
            <p className="text-muted-foreground mb-4 text-sm">
              Albania's leading job portal connecting talented professionals with top employers.
            </p>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} jobs.al. All rights reserved.
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4">For Job Seekers</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/jobs" className="hover:text-primary transition-colors">Browse Jobs</Link></li>
              <li><Link to="/blog" className="hover:text-primary transition-colors">Career Advice</Link></li>
              <li><Link to="/resume-templates" className="hover:text-primary transition-colors">Resume Templates</Link></li>
              <li><Link to="/resume-builder" className="hover:text-primary transition-colors">AI Resume Builder</Link></li>
              <li><Link to="/companies" className="hover:text-primary transition-colors">Explore Companies</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">For Employers</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/setup-company" className="hover:text-primary transition-colors">Post a Job</Link></li>
              <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing Plans</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">Employer Dashboard</Link></li>
              <li><Link to="/auth" className="hover:text-primary transition-colors">Employer Sign Up</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/companies" className="hover:text-primary transition-colors">Top Companies</Link></li>
              <li><Link to="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><a href="mailto:info@jobs.al" className="hover:text-primary transition-colors">Contact Us</a></li>
              <li><span className="text-muted-foreground/70">Privacy Policy</span></li>
              <li><span className="text-muted-foreground/70">Terms of Service</span></li>
            </ul>
          </div>
        </div>
        
        {/* Social Links & Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Made with ❤️ for the Albanian job market
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                Facebook
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                Instagram
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
