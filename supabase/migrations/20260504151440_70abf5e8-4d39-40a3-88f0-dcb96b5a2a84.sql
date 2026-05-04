
INSERT INTO public.jobs (title, slug, description, requirements, responsibilities, location, company_id, posted_by, category, job_type, experience_level, is_active, is_featured, skills, benefits, salary_min, salary_max, salary_currency, is_salary_visible, seo_title, seo_description) VALUES

-- 1. Vodafone Albania - Senior Software Engineer
('Senior Software Engineer', 'senior-software-engineer-vodafone-albania-' || extract(epoch from now())::bigint, 
'<h2>About the Role</h2>
<p>Vodafone Albania is looking for a talented Senior Software Engineer to join our digital transformation team in Tirana. You''ll be at the heart of building next-generation telecom platforms that serve millions of Albanian customers daily.</p>

<h3>What You''ll Do</h3>
<p>You''ll design, develop, and maintain scalable microservices powering our customer-facing apps, internal tools, and network management systems. This isn''t your typical corporate dev role — we move fast, ship often, and genuinely care about code quality.</p>

<h3>Why Vodafone Albania?</h3>
<p>We''re part of one of the world''s largest telecom groups, but our Tirana office feels more like a startup. Small teams, big impact, and the chance to work with cutting-edge cloud technologies. Plus, we offer some of the best benefits in the Albanian tech scene.</p>

<h3>Day-to-Day</h3>
<ul>
<li>Build and optimize RESTful APIs and microservices using Node.js and Python</li>
<li>Collaborate with product managers and UX designers on feature development</li>
<li>Conduct code reviews and mentor junior developers</li>
<li>Participate in architecture decisions for new platform features</li>
<li>Monitor production systems and respond to incidents</li>
</ul>',
'<ul>
<li>5+ years of professional software development experience</li>
<li>Strong proficiency in Node.js, TypeScript, or Python</li>
<li>Experience with cloud platforms (AWS, Azure, or GCP)</li>
<li>Solid understanding of relational databases (PostgreSQL preferred)</li>
<li>Experience with Docker and container orchestration (Kubernetes is a plus)</li>
<li>Familiarity with CI/CD pipelines and DevOps practices</li>
<li>BSc in Computer Science or equivalent practical experience</li>
<li>Good communication skills in English; Albanian is a plus</li>
</ul>',
'Design and develop scalable backend services, lead technical decisions, mentor team members, and drive engineering excellence across Vodafone Albania''s digital platforms.',
'Tiranë', 'c0fc270f-730c-4b2c-a612-17d7b3a87af6', '2ae25656-f7bd-499f-a945-71f8fb277710',
'Technology', 'full_time', 'senior', true, true,
ARRAY['Node.js', 'TypeScript', 'Python', 'AWS', 'PostgreSQL', 'Docker', 'Kubernetes', 'Microservices'],
ARRAY['Competitive salary', 'Health insurance', 'Annual bonus', 'Free Vodafone plan', 'Flexible working hours', 'Professional development budget'],
180000, 280000, 'ALL', true,
'Senior Software Engineer - Vodafone Albania | Tirana Tech Jobs',
'Join Vodafone Albania as a Senior Software Engineer. Build scalable telecom platforms with Node.js, Python, and cloud technologies in Tirana.'),

-- 2. Raiffeisen Bank Albania - Financial Analyst
('Financial Analyst', 'financial-analyst-raiffeisen-bank-' || extract(epoch from now())::bigint,
'<h2>About This Opportunity</h2>
<p>Raiffeisen Bank Albania, one of the country''s most trusted financial institutions, is seeking a Financial Analyst to strengthen our corporate finance team. If you''re passionate about numbers and want to make a real impact in Albania''s banking sector, this is your chance.</p>

<h3>The Role</h3>
<p>As a Financial Analyst, you''ll provide data-driven insights that shape our business strategy. From credit risk assessments to profitability analysis, your work will directly influence key decisions made by senior leadership.</p>

<h3>What Makes This Special</h3>
<p>Raiffeisen isn''t just another bank — we''re a major driver of Albania''s economic growth. You''ll work alongside experienced bankers, gain exposure to international best practices through our Austrian parent company, and have clear career progression paths.</p>

<h3>Key Responsibilities</h3>
<ul>
<li>Prepare monthly, quarterly, and annual financial reports for management</li>
<li>Analyze credit portfolios and assess risk exposure</li>
<li>Build financial models for new product launches and market expansion</li>
<li>Support budgeting and forecasting processes</li>
<li>Present findings to senior stakeholders with actionable recommendations</li>
</ul>',
'<ul>
<li>Bachelor''s degree in Finance, Economics, or Accounting</li>
<li>2-4 years of experience in financial analysis or banking</li>
<li>Advanced Excel skills and experience with financial modeling</li>
<li>Knowledge of Albanian banking regulations is preferred</li>
<li>CFA or ACCA qualification (or working towards) is a strong advantage</li>
<li>Fluent in Albanian and English</li>
<li>Strong analytical thinking and attention to detail</li>
</ul>',
'Conduct financial analysis, build models, prepare reports, assess credit risk, and support strategic decision-making for Raiffeisen Bank Albania.',
'Tiranë', 'be2c07b8-c931-478e-8dc5-c54e7ee13bfe', '2ae25656-f7bd-499f-a945-71f8fb277710',
'Finance & Banking', 'full_time', 'mid', true, false,
ARRAY['Financial Analysis', 'Excel', 'Financial Modeling', 'Risk Assessment', 'SQL', 'Power BI', 'Banking'],
ARRAY['Competitive salary', 'Performance bonus', 'Health insurance', 'Professional certifications support', 'Career development programs'],
120000, 180000, 'ALL', true,
'Financial Analyst - Raiffeisen Bank Albania | Banking Jobs Tirana',
'Join Raiffeisen Bank Albania as a Financial Analyst. Analyze credit portfolios, build financial models, and drive strategic decisions in Tirana.'),

-- 3. Kastrati Group - Marketing Manager
('Marketing Manager', 'marketing-manager-kastrati-group-' || extract(epoch from now())::bigint,
'<h2>Join Albania''s Largest Conglomerate</h2>
<p>Kastrati Group is one of the biggest and most diversified business groups in Albania, with operations spanning energy, retail, hospitality, and real estate. We''re looking for a dynamic Marketing Manager to lead brand strategy across our portfolio of companies.</p>

<h3>Your Mission</h3>
<p>You''ll own the marketing strategy for multiple Kastrati brands, from fuel stations to hotels. It''s a unique opportunity to work across industries and build campaigns that reach virtually every Albanian consumer.</p>

<h3>What You''ll Be Doing</h3>
<ul>
<li>Develop and execute integrated marketing campaigns across digital and traditional channels</li>
<li>Manage a team of 5+ marketing specialists and coordinate with external agencies</li>
<li>Oversee brand positioning, messaging, and visual identity for Kastrati''s brands</li>
<li>Plan and manage marketing budgets (€500K+ annually)</li>
<li>Analyze campaign performance using Google Analytics, social media insights, and CRM data</li>
<li>Organize corporate events, sponsorships, and PR activities</li>
</ul>

<h3>Why Kastrati Group?</h3>
<p>Few roles offer this kind of variety. One week you''re launching a fuel promotion, the next you''re planning a hotel grand opening. If you thrive on diversity and want to leave your mark on Albania''s most recognized brands, we want to hear from you.</p>',
'<ul>
<li>5+ years of marketing experience, with at least 2 years in a leadership role</li>
<li>Proven track record of managing multi-channel campaigns</li>
<li>Experience with digital marketing tools (Google Ads, Meta Business Suite, HubSpot)</li>
<li>Strong project management and team leadership skills</li>
<li>Bachelor''s degree in Marketing, Communications, or Business</li>
<li>MBA is a plus</li>
<li>Fluent in Albanian and English</li>
</ul>',
'Lead marketing strategy across Kastrati Group brands, manage teams and budgets, execute campaigns, and drive brand growth across Albania.',
'Tiranë', 'e9e16d9e-260d-4694-b6cd-009e4d3cbf0c', '2ae25656-f7bd-499f-a945-71f8fb277710',
'Marketing & PR', 'full_time', 'senior', true, true,
ARRAY['Marketing Strategy', 'Digital Marketing', 'Brand Management', 'Google Analytics', 'Team Leadership', 'Budget Management', 'PR'],
ARRAY['Competitive salary', 'Company car', 'Performance bonus', 'Health insurance', 'Fuel discount card', 'Hotel employee rates'],
200000, 300000, 'ALL', true,
'Marketing Manager - Kastrati Group | Albania Marketing Jobs',
'Lead marketing for Albania''s largest conglomerate. Manage multi-brand campaigns, teams, and budgets at Kastrati Group in Tirana.'),

-- 4. BKT Bank - Cybersecurity Specialist
('Cybersecurity Specialist', 'cybersecurity-specialist-bkt-bank-' || extract(epoch from now())::bigint,
'<h2>Protect Albania''s Banking Future</h2>
<p>BKT (Banka Kombëtare Tregtare) is Albania''s oldest and most established bank. As cyber threats grow more sophisticated, we''re building a world-class security team — and we need you.</p>

<h3>About the Role</h3>
<p>As our Cybersecurity Specialist, you''ll be the frontline defender of BKT''s digital assets. From monitoring threats to designing security architectures, you''ll ensure that our customers'' data and transactions remain safe.</p>

<h3>What You''ll Do Day-to-Day</h3>
<ul>
<li>Monitor security systems (SIEM, IDS/IPS) for potential threats and incidents</li>
<li>Conduct vulnerability assessments and penetration testing</li>
<li>Develop and maintain incident response procedures</li>
<li>Implement security controls aligned with PCI DSS and ISO 27001 standards</li>
<li>Train employees on cybersecurity best practices and phishing awareness</li>
<li>Collaborate with IT teams to secure network infrastructure and applications</li>
<li>Prepare security reports for management and regulatory bodies</li>
</ul>

<h3>What Makes BKT Different</h3>
<p>Banking cybersecurity is high-stakes, high-reward work. You won''t just be watching dashboards — you''ll be shaping security strategy for an institution that handles billions in transactions. We invest heavily in our security team''s professional development, including international certifications and conferences.</p>',
'<ul>
<li>3+ years of experience in cybersecurity or information security</li>
<li>Hands-on experience with SIEM tools (Splunk, QRadar, or similar)</li>
<li>Knowledge of network security, firewalls, and encryption protocols</li>
<li>Familiarity with PCI DSS, ISO 27001, and banking security regulations</li>
<li>CISSP, CEH, or CompTIA Security+ certification preferred</li>
<li>Experience with penetration testing tools (Burp Suite, Metasploit, Nmap)</li>
<li>BSc in Computer Science, Cybersecurity, or related field</li>
<li>Strong problem-solving skills and ability to work under pressure</li>
</ul>',
'Protect BKT''s digital infrastructure, conduct security assessments, respond to incidents, and ensure compliance with banking security standards.',
'Tiranë', '66023350-47cc-4906-a0c1-b5bad570bba8', '2ae25656-f7bd-499f-a945-71f8fb277710',
'Technology', 'full_time', 'mid', true, false,
ARRAY['Cybersecurity', 'SIEM', 'Penetration Testing', 'ISO 27001', 'PCI DSS', 'Network Security', 'Incident Response'],
ARRAY['Competitive salary', 'Certification sponsorship', 'Health insurance', 'Annual bonus', 'Conference attendance', 'Career growth path'],
160000, 250000, 'ALL', true,
'Cybersecurity Specialist - BKT Bank | IT Security Jobs Albania',
'Join BKT Bank as a Cybersecurity Specialist. Protect banking infrastructure, conduct penetration testing, and ensure compliance in Tirana.'),

-- 5. Tirana International Airport - Operations Coordinator
('Airport Operations Coordinator', 'airport-operations-coordinator-tia-' || extract(epoch from now())::bigint,
'<h2>Keep Albania Connected to the World</h2>
<p>Tirana International Airport Nënë Tereza (TIA) is Albania''s gateway to the world. As passenger numbers grow year after year, we need talented operations professionals to keep everything running smoothly.</p>

<h3>The Role</h3>
<p>As an Operations Coordinator, you''ll be in the nerve center of airport activity. You''ll coordinate between airlines, ground handling teams, air traffic control, and security to ensure flights depart and arrive on time and passengers have a great experience.</p>

<h3>What Your Days Look Like</h3>
<ul>
<li>Coordinate daily flight operations, managing schedules for 50+ daily flights</li>
<li>Serve as the main point of contact between airlines, ground handlers, and airport services</li>
<li>Monitor and optimize turnaround times for aircraft</li>
<li>Handle irregular operations (delays, diversions, weather events)</li>
<li>Ensure compliance with EASA and AACAA regulations</li>
<li>Prepare operational reports and KPI dashboards</li>
<li>Participate in emergency response planning and drills</li>
</ul>

<h3>Why TIA?</h3>
<p>Working at an airport is unlike any other job. Every day brings new challenges, the environment is dynamic, and you''ll meet people from all over the world. Plus, with Albania''s tourism boom, TIA is one of the fastest-growing airports in Europe — a genuinely exciting place to build your career.</p>',
'<ul>
<li>2-3 years of experience in airport operations, logistics, or aviation</li>
<li>Understanding of airport operational procedures and safety regulations</li>
<li>Excellent organizational and multitasking skills</li>
<li>Strong communication skills in Albanian and English; other languages are a bonus</li>
<li>Ability to work rotating shifts (including nights, weekends, and holidays)</li>
<li>Bachelor''s degree in Aviation Management, Business, or related field</li>
<li>Proficiency in MS Office; experience with AODB systems is a plus</li>
<li>Calm and decisive under pressure</li>
</ul>',
'Coordinate daily flight operations, manage airline relationships, handle irregular operations, and ensure regulatory compliance at Tirana International Airport.',
'Tiranë', 'f93427d0-e8ff-4b0f-8f6d-6531396cf395', '2ae25656-f7bd-499f-a945-71f8fb277710',
'Logistics & Transport', 'full_time', 'mid', true, false,
ARRAY['Airport Operations', 'Aviation', 'Logistics', 'EASA Regulations', 'Scheduling', 'Crisis Management', 'Communication'],
ARRAY['Competitive salary', 'Free airport parking', 'Health insurance', 'Shift allowances', 'Travel discounts', 'Meal allowances'],
100000, 150000, 'ALL', true,
'Airport Operations Coordinator - TIA | Aviation Jobs Albania',
'Join Tirana International Airport as an Operations Coordinator. Manage flight operations and ensure smooth airport services in Albania.'),

-- 6. Balfin Group - HR Business Partner
('HR Business Partner', 'hr-business-partner-balfin-group-' || extract(epoch from now())::bigint,
'<h2>Shape the People Strategy of Albania''s Leading Investment Group</h2>
<p>Balfin Group is the largest private investment group in Albania, with a portfolio spanning retail (QTU, SPAR), real estate (TEG, AEP), mining, and financial services. We''re looking for an experienced HR Business Partner to support our growing workforce of 5,000+ employees.</p>

<h3>Your Role</h3>
<p>As an HRBP, you won''t just be handling admin — you''ll be a strategic advisor to business unit leaders. You''ll help them attract, develop, and retain top talent while building a culture that keeps Balfin at the top.</p>

<h3>What You''ll Do</h3>
<ul>
<li>Partner with business unit managers to align HR strategy with business objectives</li>
<li>Lead workforce planning, succession planning, and talent management initiatives</li>
<li>Drive performance management processes and coach managers on people issues</li>
<li>Manage employee relations, conflict resolution, and disciplinary procedures</li>
<li>Analyze HR metrics (turnover, engagement scores, time-to-hire) and propose improvements</li>
<li>Support organizational change management during restructuring or expansion</li>
<li>Ensure compliance with Albanian labor law and internal policies</li>
</ul>

<h3>Why Balfin?</h3>
<p>With operations across multiple industries and countries, Balfin offers unmatched variety and career growth. You could be working on a retail staffing strategy today and a real estate team restructure tomorrow. It''s the kind of experience that accelerates careers.</p>',
'<ul>
<li>4+ years of HR experience, preferably in a multi-business environment</li>
<li>Strong knowledge of Albanian labor law and employment regulations</li>
<li>Experience with HRIS systems (SAP SuccessFactors, Workday, or similar)</li>
<li>Proven ability to influence and advise senior stakeholders</li>
<li>Bachelor''s degree in HR Management, Business, or Psychology</li>
<li>SHRM or CIPD certification is an advantage</li>
<li>Excellent interpersonal and communication skills</li>
<li>Fluent in Albanian and English</li>
</ul>',
'Act as strategic HR advisor to business leaders, drive talent management, lead workforce planning, and ensure labor law compliance across Balfin Group.',
'Tiranë', 'a5362bab-a64c-444c-a83c-9f0432165b4f', '2ae25656-f7bd-499f-a945-71f8fb277710',
'Human Resources', 'full_time', 'senior', true, false,
ARRAY['HR Strategy', 'Talent Management', 'Labor Law', 'Performance Management', 'Employee Relations', 'HRIS', 'Change Management'],
ARRAY['Competitive salary', 'Annual bonus', 'Health insurance', 'Employee discounts at Balfin retail outlets', 'Professional development', 'Company phone'],
150000, 220000, 'ALL', true,
'HR Business Partner - Balfin Group | Human Resources Jobs Albania',
'Join Balfin Group as an HR Business Partner. Drive people strategy across Albania''s largest investment group in Tirana.'),

-- 7. ONE Telecommunications - Customer Experience Manager
('Customer Experience Manager', 'customer-experience-manager-one-telecom-' || extract(epoch from now())::bigint,
'<h2>Reimagine How Albanians Experience Telecom</h2>
<p>ONE Telecommunications is Albania''s fastest-growing mobile operator, known for pushing boundaries in digital services. We''re looking for a Customer Experience Manager who''s obsessed with making customers happy — someone who sees every touchpoint as an opportunity.</p>

<h3>What This Role Is About</h3>
<p>You''ll own the end-to-end customer journey, from the moment someone visits our website or walks into a shop to their monthly bill payment. Your goal? Make every interaction effortless, delightful, and worth talking about.</p>

<h3>Your Responsibilities</h3>
<ul>
<li>Map and optimize customer journeys across all channels (stores, app, call center, website)</li>
<li>Design and implement customer satisfaction measurement programs (NPS, CSAT, CES)</li>
<li>Analyze customer feedback data to identify pain points and improvement opportunities</li>
<li>Collaborate with product, marketing, and operations teams to implement CX improvements</li>
<li>Develop customer retention strategies to reduce churn</li>
<li>Train frontline teams on customer service excellence</li>
<li>Report CX metrics and insights to senior leadership monthly</li>
</ul>

<h3>Who We''re Looking For</h3>
<p>We want someone who genuinely cares about people''s experiences — not just someone who can read survey data. You should be able to walk into one of our stores, spot three things to improve, and have a plan to fix them by Monday.</p>',
'<ul>
<li>3-5 years of experience in customer experience, service design, or related roles</li>
<li>Experience with CX measurement tools and methodologies</li>
<li>Strong data analysis skills — comfortable with Excel, SQL, or BI tools</li>
<li>Excellent presentation and stakeholder management skills</li>
<li>Background in telecom, retail, or tech is preferred</li>
<li>Bachelor''s degree in Business, Marketing, or Communications</li>
<li>Fluent in Albanian and English</li>
</ul>',
'Own end-to-end customer experience strategy, measure satisfaction, reduce churn, and drive CX improvements across ONE Telecommunications.',
'Tiranë', '77cc61e0-a87a-4ea8-bdd2-836b81534692', '2ae25656-f7bd-499f-a945-71f8fb277710',
'Customer Service', 'full_time', 'mid', true, false,
ARRAY['Customer Experience', 'NPS', 'Data Analysis', 'Service Design', 'CRM', 'Stakeholder Management', 'Customer Journey Mapping'],
ARRAY['Competitive salary', 'Free ONE mobile plan', 'Performance bonus', 'Health insurance', 'Flexible work arrangements', 'Team events'],
130000, 190000, 'ALL', true,
'Customer Experience Manager - ONE Telecom | CX Jobs Albania',
'Lead customer experience strategy at ONE Telecommunications Albania. Optimize journeys, measure satisfaction, and reduce churn in Tirana.'),

-- 8. Credins Bank - Full Stack Developer
('Full Stack Developer', 'full-stack-developer-credins-bank-' || extract(epoch from now())::bigint,
'<h2>Build the Digital Future of Albanian Banking</h2>
<p>Credins Bank is Albania''s fastest-growing domestic bank, and our digital transformation is in full swing. We''re looking for a Full Stack Developer to help us build modern banking applications that our customers actually enjoy using.</p>

<h3>The Opportunity</h3>
<p>You''ll work on our mobile banking app, internet banking platform, and internal tools that power daily operations. We''re modernizing our entire tech stack, so you''ll have real influence on architecture decisions and technology choices.</p>

<h3>What You''ll Work On</h3>
<ul>
<li>Develop and maintain web and mobile banking applications using React and React Native</li>
<li>Build secure backend APIs with Java Spring Boot or .NET</li>
<li>Integrate with core banking systems, payment gateways, and third-party services</li>
<li>Implement authentication and authorization using OAuth 2.0 and OpenID Connect</li>
<li>Write clean, testable code with comprehensive unit and integration tests</li>
<li>Participate in agile ceremonies (sprints, standups, retrospectives)</li>
<li>Collaborate with UI/UX designers to deliver polished user interfaces</li>
</ul>

<h3>Why Credins?</h3>
<p>Fintech is booming globally, and Albania is no exception. At Credins, you''ll get fintech startup energy with the stability and resources of an established bank. We''re investing heavily in technology, and your work will be used by hundreds of thousands of Albanian customers.</p>',
'<ul>
<li>3+ years of full stack development experience</li>
<li>Frontend: React, TypeScript, HTML5, CSS3</li>
<li>Backend: Java (Spring Boot), .NET, or Node.js</li>
<li>Database: PostgreSQL, Oracle, or SQL Server</li>
<li>Experience with RESTful API design and microservices</li>
<li>Familiarity with Git, CI/CD, and agile methodologies</li>
<li>Experience in banking or fintech is a strong plus</li>
<li>BSc in Computer Science or equivalent</li>
<li>Good English communication skills</li>
</ul>',
'Develop web and mobile banking applications, build secure APIs, integrate with core banking systems, and drive digital transformation at Credins Bank.',
'Tiranë', '27c4a63f-c557-4afa-b5e2-34941e752ba9', '2ae25656-f7bd-499f-a945-71f8fb277710',
'Technology', 'full_time', 'mid', true, false,
ARRAY['React', 'TypeScript', 'Java', 'Spring Boot', '.NET', 'PostgreSQL', 'REST APIs', 'React Native'],
ARRAY['Competitive salary', 'Health insurance', 'Annual bonus', 'Training budget', 'Flexible hours', 'Banking benefits'],
140000, 220000, 'ALL', true,
'Full Stack Developer - Credins Bank | Fintech Jobs Albania',
'Join Credins Bank as a Full Stack Developer. Build modern banking apps with React and Java in Tirana, Albania.'),

-- 9. Digitalb - Video Content Producer
('Video Content Producer', 'video-content-producer-digitalb-' || extract(epoch from now())::bigint,
'<h2>Create Content That Millions Watch</h2>
<p>Digitalb is Albania''s leading pay-TV and digital media provider, broadcasting to millions across Albania and the Albanian diaspora worldwide. We''re looking for a creative Video Content Producer to join our production team.</p>

<h3>About the Role</h3>
<p>You''ll produce video content for Digitalb''s channels and digital platforms — from promotional spots and social media clips to short-form documentaries and branded content. If you''re the kind of person who thinks in stories and frames, this role was made for you.</p>

<h3>What You''ll Be Doing</h3>
<ul>
<li>Conceptualize, shoot, and edit video content for TV and digital platforms</li>
<li>Create engaging social media content (Instagram Reels, TikTok, YouTube Shorts)</li>
<li>Produce promotional trailers and teasers for upcoming shows and events</li>
<li>Collaborate with the marketing team on branded content and campaigns</li>
<li>Manage production logistics including scheduling, equipment, and talent</li>
<li>Maintain and organize the company''s video asset library</li>
<li>Stay current with video production trends and platform-specific best practices</li>
</ul>

<h3>Why Digitalb?</h3>
<p>Your work won''t sit in a Dropbox folder — it''ll be on TV screens across the Balkans and diaspora communities worldwide. If you''re passionate about storytelling and want your work to reach a massive audience, Digitalb is the place.</p>',
'<ul>
<li>2-4 years of experience in video production or content creation</li>
<li>Proficiency in Adobe Premiere Pro, After Effects, and DaVinci Resolve</li>
<li>Strong visual storytelling and composition skills</li>
<li>Experience with camera operation (Sony, Canon, Blackmagic)</li>
<li>Understanding of social media platforms and content optimization</li>
<li>Portfolio/showreel demonstrating previous work</li>
<li>Bachelor''s degree in Film, Media, Communications, or related field</li>
<li>Fluent in Albanian; English proficiency is a plus</li>
</ul>',
'Produce video content for TV and digital platforms, create social media content, and develop promotional materials for Digitalb Albania.',
'Tiranë', '0bbe9cd0-f7d3-4fc9-a8f2-da056a424e20', '2ae25656-f7bd-499f-a945-71f8fb277710',
'Media & Communications', 'full_time', 'mid', true, false,
ARRAY['Video Production', 'Adobe Premiere Pro', 'After Effects', 'Camera Operation', 'Social Media Content', 'Storytelling', 'DaVinci Resolve'],
ARRAY['Competitive salary', 'Free Digitalb subscription', 'Health insurance', 'Creative environment', 'Access to professional equipment', 'Industry events'],
90000, 140000, 'ALL', true,
'Video Content Producer - Digitalb | Media Jobs Albania',
'Join Digitalb as a Video Content Producer. Create TV and digital content for Albania''s leading media company in Tirana.'),

-- 10. Neptun - E-Commerce Manager
('E-Commerce Manager', 'ecommerce-manager-neptun-' || extract(epoch from now())::bigint,
'<h2>Lead Albania''s Largest Online Electronics Store</h2>
<p>Neptun is Albania''s biggest electronics and home appliances retailer, and our online business is growing rapidly. We''re looking for an E-Commerce Manager to take our digital sales to the next level.</p>

<h3>The Role</h3>
<p>You''ll own Neptun''s e-commerce operations end-to-end: from website performance and product catalog management to digital marketing and customer conversion optimization. If you live and breathe online retail, keep reading.</p>

<h3>What You''ll Own</h3>
<ul>
<li>Manage and optimize neptun.al — product listings, pricing, promotions, and user experience</li>
<li>Develop and execute e-commerce growth strategy to increase online revenue by 40%+ annually</li>
<li>Plan and execute online campaigns (Black Friday, seasonal sales, product launches)</li>
<li>Manage Google Ads, Meta Ads, and email marketing for e-commerce</li>
<li>Analyze website analytics (Google Analytics, heatmaps) to improve conversion rates</li>
<li>Coordinate with warehouse and logistics teams for fulfillment efficiency</li>
<li>Manage product content, photography, and descriptions across 5,000+ SKUs</li>
<li>Monitor competitor pricing and market trends</li>
</ul>

<h3>Why Neptun?</h3>
<p>E-commerce in Albania is still in its early growth phase, and Neptun is leading the charge. You''ll have the budget, the brand, and the backing of Albania''s most recognized electronics retailer. This is a career-defining role for the right person.</p>',
'<ul>
<li>3-5 years of experience in e-commerce management or digital retail</li>
<li>Strong understanding of e-commerce platforms (Shopify, WooCommerce, Magento, or custom)</li>
<li>Experience with Google Analytics 4, Google Ads, and Meta Business Suite</li>
<li>Knowledge of SEO, CRO, and email marketing best practices</li>
<li>Experience managing product catalogs with 1,000+ SKUs</li>
<li>Strong analytical skills and comfort with data-driven decision making</li>
<li>Bachelor''s degree in Marketing, Business, or related field</li>
<li>Fluent in Albanian and English</li>
</ul>',
'Lead e-commerce strategy and operations for neptun.al, drive online revenue growth, optimize conversion rates, and manage digital marketing campaigns.',
'Tiranë', 'b192f1ff-121c-49d9-9f6f-cc37537de278', '2ae25656-f7bd-499f-a945-71f8fb277710',
'Marketing & PR', 'full_time', 'senior', true, true,
ARRAY['E-Commerce', 'Google Analytics', 'Google Ads', 'SEO', 'CRO', 'Digital Marketing', 'Product Management', 'Shopify'],
ARRAY['Competitive salary', 'Performance bonus', 'Employee discounts on electronics', 'Health insurance', 'Professional development', 'Flexible working'],
150000, 230000, 'ALL', true,
'E-Commerce Manager - Neptun | Digital Retail Jobs Albania',
'Lead e-commerce operations at Neptun, Albania''s largest electronics retailer. Drive online growth and manage digital marketing in Tirana.');
