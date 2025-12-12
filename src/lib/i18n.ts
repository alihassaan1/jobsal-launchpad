// Albanian (SQ) and English (EN) translations for Jobs.al

export type Language = 'sq' | 'en';

export const translations = {
  // Navigation
  'nav.findJobs': { sq: 'Gjej Punë', en: 'Find Jobs' },
  'nav.companies': { sq: 'Kompani', en: 'Companies' },
  'nav.resumeBuilder': { sq: 'Krijo CV', en: 'Resume Builder' },
  'nav.blog': { sq: 'Blog', en: 'Blog' },
  'nav.pricing': { sq: 'Çmimet', en: 'Pricing' },
  'nav.resources': { sq: 'Burime', en: 'Resources' },
  'nav.login': { sq: 'Hyr', en: 'Login' },
  'nav.signup': { sq: 'Regjistrohu', en: 'Sign Up' },
  'nav.dashboard': { sq: 'Paneli', en: 'Dashboard' },
  'nav.adminPanel': { sq: 'Paneli Admin', en: 'Admin Panel' },
  'nav.myApplications': { sq: 'Aplikimet e Mia', en: 'My Applications' },
  'nav.myResumes': { sq: 'CV-të e Mia', en: 'My Resumes' },
  'nav.signOut': { sq: 'Dil', en: 'Sign Out' },
  'nav.aiRecommendedJobs': { sq: 'Pune të Rekomanduara nga AI', en: 'AI Recommended Jobs' },

  // Hero Section
  'hero.title': { sq: 'Gjej Punën e Ëndrrave në', en: 'Find Your Dream Job in' },
  'hero.country': { sq: 'Shqipëri', en: 'Albania' },
  'hero.subtitle': { sq: 'Zbulo mijëra mundësi punësimi nga kompanitë më të mira në Shqipëri. Karriera jote fillon këtu.', en: 'Discover thousands of job opportunities from top companies across Albania. Your career journey starts here.' },
  'hero.searchPlaceholder': { sq: 'Titulli i punës ose fjalë kyçe', en: 'Job title or keyword' },
  'hero.locationPlaceholder': { sq: 'Vendndodhja', en: 'Location' },
  'hero.searchButton': { sq: 'Kërko Punë', en: 'Search Jobs' },
  'hero.activeJobs': { sq: 'Punë Aktive', en: 'Active Jobs' },
  'hero.companies': { sq: 'Kompani', en: 'Companies' },
  'hero.jobSeekers': { sq: 'Kërkues Pune', en: 'Job Seekers' },
  'hero.successRate': { sq: 'Shkallë Suksesi', en: 'Success Rate' },

  // Job Search
  'jobs.title': { sq: 'Gjej Punën e Ëndrrave', en: 'Find Your Dream Job' },
  'jobs.subtitle': { sq: 'Eksploro mijëra mundësi në gjithë Shqipërinë', en: 'Explore thousands of opportunities across Albania' },
  'jobs.searchPlaceholder': { sq: 'Kërko punë...', en: 'Search jobs...' },
  'jobs.allCategories': { sq: 'Të Gjitha Kategoritë', en: 'All Categories' },
  'jobs.allLocations': { sq: 'Të Gjitha Vendndodhjet', en: 'All Locations' },
  'jobs.allTypes': { sq: 'Të Gjitha Llojet', en: 'All Types' },
  'jobs.found': { sq: 'Punë u Gjetën', en: 'Jobs Found' },
  'jobs.noJobs': { sq: 'Nuk u gjetën punë sipas kritereve tuaja', en: 'No jobs found matching your criteria' },
  'jobs.posted': { sq: 'Postuar', en: 'Posted' },
  'jobs.applications': { sq: 'aplikime', en: 'applications' },
  'jobs.featured': { sq: 'Të Veçanta', en: 'Featured' },
  'jobs.negotiable': { sq: 'E Negociueshme', en: 'Negotiable' },
  'jobs.remote': { sq: 'Në Distancë', en: 'Remote' },

  // Job Types
  'jobType.full_time': { sq: 'Kohë e Plotë', en: 'Full Time' },
  'jobType.part_time': { sq: 'Kohë e Pjesshme', en: 'Part Time' },
  'jobType.contract': { sq: 'Kontratë', en: 'Contract' },
  'jobType.internship': { sq: 'Praktikë', en: 'Internship' },
  'jobType.freelance': { sq: 'Freelance', en: 'Freelance' },

  // Experience Levels
  'experience.entry': { sq: 'Fillestar', en: 'Entry Level' },
  'experience.mid': { sq: 'Mesatar', en: 'Mid Level' },
  'experience.senior': { sq: 'Senior', en: 'Senior' },
  'experience.executive': { sq: 'Ekzekutiv', en: 'Executive' },

  // Categories
  'category.technology': { sq: 'Teknologji', en: 'Technology' },
  'category.marketing': { sq: 'Marketing', en: 'Marketing' },
  'category.design': { sq: 'Dizajn', en: 'Design' },
  'category.sales': { sq: 'Shitje', en: 'Sales' },
  'category.finance': { sq: 'Financa', en: 'Finance' },
  'category.healthcare': { sq: 'Shëndetësi', en: 'Healthcare' },
  'category.education': { sq: 'Arsim', en: 'Education' },
  'category.engineering': { sq: 'Inxhinieri', en: 'Engineering' },
  'category.hospitality': { sq: 'Hoteleri & Turizëm', en: 'Hospitality & Tourism' },
  'category.construction': { sq: 'Ndërtim', en: 'Construction' },
  'category.administration': { sq: 'Administrate', en: 'Administration' },
  'category.banking': { sq: 'Banka & Sigurime', en: 'Banking & Insurance' },
  'category.callCenter': { sq: 'Call Center', en: 'Call Center' },
  'category.management': { sq: 'Menaxhim', en: 'Management' },
  'category.media': { sq: 'Media & Gazetari', en: 'Media & Journalism' },
  'category.horeka': { sq: 'HOREKA', en: 'HOREKA' },
  'category.realEstate': { sq: 'Pasuri e Patundshme', en: 'Real Estate' },
  'category.it': { sq: 'IT & Telekomunikacion', en: 'IT & Telecommunications' },
  'category.legal': { sq: 'Juridik', en: 'Legal' },
  'category.accounting': { sq: 'Kontabilitet', en: 'Accounting' },
  'category.logistics': { sq: 'Logjistikë & Transport', en: 'Logistics & Transport' },
  'category.production': { sq: 'Prodhim & Industri', en: 'Production & Industry' },
  'category.hr': { sq: 'Burime Njerëzore', en: 'Human Resources' },
  'category.customerService': { sq: 'Shërbim Klienti', en: 'Customer Service' },
  'category.retail': { sq: 'Shitje me Pakicë', en: 'Retail' },

  // Companies
  'companies.title': { sq: 'Eksploro Kompani', en: 'Explore Companies' },
  'companies.subtitle': { sq: 'Zbulo punëdhënësit më të mirë në Shqipëri dhe gjej mundësinë tënde të radhës të karrierës', en: "Discover Albania's top employers and find your next career opportunity" },
  'companies.searchPlaceholder': { sq: 'Kërko kompani sipas emrit...', en: 'Search companies by name...' },
  'companies.allIndustries': { sq: 'Të Gjitha Industritë', en: 'All Industries' },
  'companies.verified': { sq: 'E Verifikuar', en: 'Verified' },
  'companies.followers': { sq: 'ndjekës', en: 'followers' },
  'companies.openJobs': { sq: 'punë të hapura', en: 'open jobs' },
  'companies.noCompanies': { sq: 'Nuk u gjetën kompani', en: 'No companies found' },

  // Footer
  'footer.description': { sq: 'Portali kryesor i punës në Shqipëri që lidh profesionistët e talentuar me punëdhënësit më të mirë.', en: "Albania's leading job portal connecting talented professionals with top employers." },
  'footer.forJobSeekers': { sq: 'Për Kërkuesit e Punës', en: 'For Job Seekers' },
  'footer.browseJobs': { sq: 'Shfleto Punë', en: 'Browse Jobs' },
  'footer.careerAdvice': { sq: 'Këshilla Karriere', en: 'Career Advice' },
  'footer.resumeTemplates': { sq: 'Modele CV', en: 'Resume Templates' },
  'footer.aiResumeBuilder': { sq: 'Krijues CV me AI', en: 'AI Resume Builder' },
  'footer.exploreCompanies': { sq: 'Eksploro Kompani', en: 'Explore Companies' },
  'footer.forEmployers': { sq: 'Për Punëdhënësit', en: 'For Employers' },
  'footer.postJob': { sq: 'Posto Punë', en: 'Post a Job' },
  'footer.pricingPlans': { sq: 'Planet e Çmimeve', en: 'Pricing Plans' },
  'footer.employerDashboard': { sq: 'Paneli i Punëdhënësit', en: 'Employer Dashboard' },
  'footer.employerSignup': { sq: 'Regjistrim Punëdhënësi', en: 'Employer Sign Up' },
  'footer.company': { sq: 'Kompania', en: 'Company' },
  'footer.topCompanies': { sq: 'Kompanitë Top', en: 'Top Companies' },
  'footer.contactUs': { sq: 'Na Kontaktoni', en: 'Contact Us' },
  'footer.privacyPolicy': { sq: 'Politika e Privatësisë', en: 'Privacy Policy' },
  'footer.termsOfService': { sq: 'Kushtet e Shërbimit', en: 'Terms of Service' },
  'footer.madeWith': { sq: 'Bërë me ❤️ për tregun shqiptar të punës', en: 'Made with ❤️ for the Albanian job market' },

  // Common
  'common.viewAll': { sq: 'Shiko të Gjitha', en: 'View All' },
  'common.viewDetails': { sq: 'Shiko Detajet', en: 'View Details' },
  'common.apply': { sq: 'Apliko', en: 'Apply' },
  'common.save': { sq: 'Ruaj', en: 'Save' },
  'common.cancel': { sq: 'Anulo', en: 'Cancel' },
  'common.loading': { sq: 'Duke ngarkuar...', en: 'Loading...' },
  'common.error': { sq: 'Gabim', en: 'Error' },
  'common.success': { sq: 'Sukses', en: 'Success' },
  'common.home': { sq: 'Kryefaqja', en: 'Home' },

  // Featured Jobs Section
  'featured.title': { sq: 'Punë të Veçanta', en: 'Featured Jobs' },
  'featured.subtitle': { sq: 'Zbulo mundësitë e zgjedhura të punësimit nga punëdhënësit më të mirë në Shqipëri', en: 'Discover hand-picked job opportunities from top employers in Albania' },
  'featured.viewAll': { sq: 'Shiko Të Gjitha Punët', en: 'View All Jobs' },
  'featured.noJobs': { sq: 'Nuk ka punë të veçanta në këtë moment.', en: 'No featured jobs available at the moment.' },

  // Categories Section
  'categories.title': { sq: 'Shfleto sipas Kategorisë', en: 'Browse by Category' },
  'categories.subtitle': { sq: 'Eksploro mundësitë e punësimit në industri të ndryshme', en: 'Explore job opportunities across different industries' },

  // CTA Section
  'cta.title': { sq: 'Gati të Fillosh Udhëtimin e Karrierës?', en: 'Ready to Start Your Career Journey?' },
  'cta.subtitle': { sq: 'Bashkohu me mijëra kërkues pune dhe punëdhënës që i besojnë jobs.al për nevojat e tyre të karrierës', en: 'Join thousands of job seekers and employers who trust jobs.al for their career needs' },
  'cta.findJobs': { sq: 'Gjej Punë', en: 'Find Jobs' },
  'cta.postJob': { sq: 'Posto Punë', en: 'Post a Job' },
  'cta.buildResume': { sq: 'Krijo CV', en: 'Build Resume' },
};

export const getTranslation = (key: string, language: Language): string => {
  const translation = translations[key as keyof typeof translations];
  if (!translation) return key;
  return translation[language] || translation.en || key;
};

// All 25+ job categories matching DuaPune.com
export const JOB_CATEGORIES = [
  { key: 'technology', sq: 'Teknologji', en: 'Technology', icon: '💻' },
  { key: 'marketing', sq: 'Marketing', en: 'Marketing', icon: '📈' },
  { key: 'design', sq: 'Dizajn', en: 'Design', icon: '🎨' },
  { key: 'sales', sq: 'Shitje', en: 'Sales', icon: '💼' },
  { key: 'finance', sq: 'Financa', en: 'Finance', icon: '💰' },
  { key: 'healthcare', sq: 'Shëndetësi', en: 'Healthcare', icon: '🏥' },
  { key: 'education', sq: 'Arsim & Trajnim', en: 'Education & Training', icon: '📚' },
  { key: 'engineering', sq: 'Inxhinieri', en: 'Engineering', icon: '⚙️' },
  { key: 'hospitality', sq: 'Hoteleri & Turizëm', en: 'Hospitality & Tourism', icon: '🏨' },
  { key: 'construction', sq: 'Ndërtim', en: 'Construction', icon: '🏗️' },
  { key: 'administration', sq: 'Administrate', en: 'Administration', icon: '📋' },
  { key: 'banking', sq: 'Banka & Sigurime', en: 'Banking & Insurance', icon: '🏦' },
  { key: 'callCenter', sq: 'Call Center', en: 'Call Center', icon: '📞' },
  { key: 'management', sq: 'Menaxhim', en: 'Management', icon: '👔' },
  { key: 'media', sq: 'Media & Gazetari', en: 'Media & Journalism', icon: '📺' },
  { key: 'horeka', sq: 'HOREKA', en: 'HOREKA', icon: '🍽️' },
  { key: 'realEstate', sq: 'Pasuri e Patundshme', en: 'Real Estate', icon: '🏠' },
  { key: 'it', sq: 'IT & Telekomunikacion', en: 'IT & Telecom', icon: '📡' },
  { key: 'legal', sq: 'Juridik / Ligjor', en: 'Legal', icon: '⚖️' },
  { key: 'accounting', sq: 'Kontabilitet & Audit', en: 'Accounting & Audit', icon: '📊' },
  { key: 'logistics', sq: 'Logjistikë & Transport', en: 'Logistics & Transport', icon: '🚚' },
  { key: 'production', sq: 'Prodhim & Industri', en: 'Production & Industry', icon: '🏭' },
  { key: 'hr', sq: 'Burime Njerëzore', en: 'Human Resources', icon: '👥' },
  { key: 'customerService', sq: 'Shërbim Klienti', en: 'Customer Service', icon: '🎧' },
  { key: 'retail', sq: 'Shitje me Pakicë', en: 'Retail', icon: '🛒' },
];

// All 30+ Albanian cities
export const ALBANIAN_CITIES = [
  { key: 'tirana', sq: 'Tiranë', en: 'Tirana' },
  { key: 'durres', sq: 'Durrës', en: 'Durres' },
  { key: 'vlore', sq: 'Vlorë', en: 'Vlore' },
  { key: 'shkoder', sq: 'Shkodër', en: 'Shkoder' },
  { key: 'elbasan', sq: 'Elbasan', en: 'Elbasan' },
  { key: 'fier', sq: 'Fier', en: 'Fier' },
  { key: 'korce', sq: 'Korçë', en: 'Korce' },
  { key: 'berat', sq: 'Berat', en: 'Berat' },
  { key: 'lushnje', sq: 'Lushnjë', en: 'Lushnje' },
  { key: 'pogradec', sq: 'Pogradec', en: 'Pogradec' },
  { key: 'kavaje', sq: 'Kavajë', en: 'Kavaje' },
  { key: 'lac', sq: 'Laç', en: 'Lac' },
  { key: 'gjirokaster', sq: 'Gjirokastër', en: 'Gjirokaster' },
  { key: 'sarande', sq: 'Sarandë', en: 'Sarande' },
  { key: 'lezhe', sq: 'Lezhë', en: 'Lezhe' },
  { key: 'peshkopi', sq: 'Peshkopi', en: 'Peshkopi' },
  { key: 'kucove', sq: 'Kuçovë', en: 'Kucove' },
  { key: 'kruje', sq: 'Krujë', en: 'Kruje' },
  { key: 'kukes', sq: 'Kukës', en: 'Kukes' },
  { key: 'patos', sq: 'Patos', en: 'Patos' },
  { key: 'roskovec', sq: 'Roskovec', en: 'Roskovec' },
  { key: 'burrel', sq: 'Burrel', en: 'Burrel' },
  { key: 'bulqize', sq: 'Bulqizë', en: 'Bulqize' },
  { key: 'gramsh', sq: 'Gramsh', en: 'Gramsh' },
  { key: 'tepelene', sq: 'Tepelenë', en: 'Tepelene' },
  { key: 'permet', sq: 'Përmet', en: 'Permet' },
  { key: 'erseke', sq: 'Ersekë', en: 'Erseke' },
  { key: 'bilisht', sq: 'Bilisht', en: 'Bilisht' },
  { key: 'himare', sq: 'Himarë', en: 'Himare' },
  { key: 'remote', sq: 'Punë nga Shtëpia', en: 'Remote Work' },
];
