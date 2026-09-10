import ModernTemplate from "./ModernTemplate";
import ClassicTemplate from "./ClassicTemplate";
import CreativeTemplate from "./CreativeTemplate";
import ExecutiveTemplate from "./ExecutiveTemplate";
import TechTemplate from "./TechTemplate";
import type { ResumeTemplateData } from "./types";

export type { ResumeTemplateData };

export interface ResumeTemplateDefinition {
  slug: string;
  label: string;
  description: string;
  aliases: string[];
  Component: (props: { data: ResumeTemplateData }) => JSX.Element;
}

export const RESUME_TEMPLATES: ResumeTemplateDefinition[] = [
  {
    slug: "modern",
    label: "Modern",
    description: "Clean, ATS-friendly layout with a confident accent header",
    aliases: ["professional-modern", "professional"],
    Component: ModernTemplate,
  },
  {
    slug: "classic",
    label: "Classic",
    description: "Traditional serif format trusted by academic and formal roles",
    aliases: ["academic-scholar", "academic"],
    Component: ClassicTemplate,
  },
  {
    slug: "creative",
    label: "Creative",
    description: "Two-column design with a colour sidebar for standout profiles",
    aliases: ["creative-portfolio"],
    Component: CreativeTemplate,
  },
  {
    slug: "executive",
    label: "Executive",
    description: "Spacious, understated typography for senior leadership",
    aliases: ["executive-premium"],
    Component: ExecutiveTemplate,
  },
  {
    slug: "tech",
    label: "Tech",
    description: "Minimal monospaced accents built for engineering roles",
    aliases: ["tech-minimal", "minimal"],
    Component: TechTemplate,
  },
];

export function resolveTemplateSlug(value?: string | null): string {
  if (!value) return "modern";
  const needle = value.trim().toLowerCase();
  const match = RESUME_TEMPLATES.find(
    (t) => t.slug === needle || t.aliases.includes(needle)
  );
  return match?.slug ?? "modern";
}

export function getTemplate(slug?: string | null): ResumeTemplateDefinition {
  const resolved = resolveTemplateSlug(slug);
  return RESUME_TEMPLATES.find((t) => t.slug === resolved) ?? RESUME_TEMPLATES[0];
}

export function renderResumeTemplate(slug: string | null | undefined, data: ResumeTemplateData) {
  const { Component } = getTemplate(slug);
  return <Component data={data} />;
}

export const SAMPLE_RESUME: ResumeTemplateData = {
  personal_info: {
    full_name: "Elira Hoxha",
    email: "elira.hoxha@email.com",
    phone: "+355 69 234 5678",
    location: "Tirana, Albania",
    linkedin: "linkedin.com/in/elirahoxha",
    portfolio: "elirahoxha.dev",
  },
  summary:
    "Product-minded professional with 7+ years of experience leading cross-functional teams, launching customer-facing products and growing revenue in fast-moving markets.",
  experience: [
    {
      company: "Balkan Digital Group",
      position: "Senior Product Manager",
      start_date: "2021",
      end_date: "Present",
      description:
        "Own the roadmap for a marketplace serving 200k monthly users across Albania and Kosovo.",
      achievements: [
        "Grew monthly active users by 62% in 18 months",
        "Led a team of 8 engineers and 2 designers",
        "Cut onboarding drop-off from 41% to 17%",
      ],
    },
    {
      company: "Adria Tech Solutions",
      position: "Business Analyst",
      start_date: "2018",
      end_date: "2021",
      description:
        "Translated client requirements into delivery plans for banking and telecom projects.",
      achievements: [
        "Delivered 14 projects on time and on budget",
        "Built reporting that saved 20 hours of manual work weekly",
      ],
    },
  ],
  education: [
    {
      institution: "University of Tirana",
      degree: "Master of Science",
      field: "Business Informatics",
      start_date: "2016",
      end_date: "2018",
      gpa: "9.4/10",
    },
    {
      institution: "University of Tirana",
      degree: "Bachelor of Science",
      field: "Computer Science",
      start_date: "2013",
      end_date: "2016",
      gpa: "9.1/10",
    },
  ],
  skills: [
    "Product Strategy",
    "SQL",
    "Analytics",
    "Agile / Scrum",
    "Stakeholder Management",
    "Figma",
    "A/B Testing",
  ],
  certifications: [
    { name: "Professional Scrum Product Owner I", issuer: "Scrum.org", date: "2022" },
    { name: "Google Analytics Certification", issuer: "Google", date: "2021" },
  ],
  languages: ["Albanian (Native)", "English (Fluent)", "Italian (Intermediate)"],
};

/** Fills empty fields with sample content so previews always look complete. */
export function withPreviewFallback(data: ResumeTemplateData): ResumeTemplateData {
  return {
    ...data,
    personal_info: data.personal_info?.full_name
      ? data.personal_info
      : SAMPLE_RESUME.personal_info,
    summary: data.summary || SAMPLE_RESUME.summary,
    experience: data.experience?.length ? data.experience : SAMPLE_RESUME.experience,
    education: data.education?.length ? data.education : SAMPLE_RESUME.education,
    skills: data.skills?.length ? data.skills : SAMPLE_RESUME.skills,
    certifications: data.certifications?.length
      ? data.certifications
      : SAMPLE_RESUME.certifications,
    languages: data.languages?.length ? data.languages : SAMPLE_RESUME.languages,
  };
}
