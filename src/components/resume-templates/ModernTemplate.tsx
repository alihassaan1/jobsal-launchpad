import type { ResumeTemplateData } from "./types";

interface TemplateProps {
  data: ResumeTemplateData;
}

/**
 * Modern template — solid colours only (no gradient text, blur or shadows) so
 * the on-screen preview, the thumbnail and the exported PDF look identical.
 */
export default function ModernTemplate({ data }: TemplateProps) {
  const contactItems = [
    data.personal_info.email,
    data.personal_info.phone,
    data.personal_info.location,
    data.personal_info.linkedin,
    data.personal_info.portfolio,
  ].filter(Boolean);

  const SectionTitle = ({ children }: { children: string }) => (
    <h2 className="flex items-center gap-3 text-[13px] font-bold uppercase tracking-[0.18em] text-blue-800 mb-3">
      <span className="inline-block h-4 w-[3px] bg-blue-700" />
      {children}
    </h2>
  );

  return (
    <div className="bg-white text-gray-900 w-[210mm] min-h-[297mm] mx-auto p-12 font-sans">
      {/* Header */}
      <header className="border-b-2 border-blue-700 pb-6 mb-7">
        <h1 className="text-[42px] font-bold leading-tight tracking-tight text-gray-900">
          {data.personal_info.full_name || "Your Name"}
        </h1>
        {contactItems.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-gray-700">
            {contactItems.map((item, i) => (
              <span key={i} className="flex items-center gap-2 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-700" />
                {item}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Summary */}
      {data.summary && (
        <section className="mb-7">
          <SectionTitle>Professional Summary</SectionTitle>
          <p className="border-l-[3px] border-blue-700 bg-blue-50 py-3 pl-4 pr-3 text-[13.5px] leading-relaxed text-gray-700">
            {data.summary}
          </p>
        </section>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <section className="mb-7">
          <SectionTitle>Work Experience</SectionTitle>
          <div className="space-y-5">
            {data.experience.map((exp, idx) => (
              <div key={idx} className="border-l-2 border-blue-200 pl-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-[15.5px] font-bold text-gray-900">{exp.position}</h3>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[11.5px] font-semibold text-blue-800">
                    {exp.start_date} – {exp.end_date || "Present"}
                  </span>
                </div>
                <p className="mt-0.5 text-[13.5px] font-semibold text-blue-800">{exp.company}</p>
                {exp.description && (
                  <p className="mt-1.5 text-[13px] leading-relaxed text-gray-700">
                    {exp.description}
                  </p>
                )}
                {exp.achievements?.length > 0 && (
                  <ul className="mt-2 space-y-1 text-[13px] text-gray-700">
                    {exp.achievements.filter(Boolean).map((a, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-700" />
                        <span className="leading-relaxed">{a}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <section className="mb-7">
          <SectionTitle>Education</SectionTitle>
          <div className="space-y-3">
            {data.education.map((edu, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-baseline justify-between gap-2 bg-blue-50 px-4 py-3"
              >
                <div>
                  <h3 className="text-[14px] font-bold text-gray-900">
                    {edu.degree}
                    {edu.field ? ` in ${edu.field}` : ""}
                  </h3>
                  <p className="text-[13px] text-gray-700">{edu.institution}</p>
                  {edu.gpa && <p className="text-[12px] text-gray-600">GPA: {edu.gpa}</p>}
                </div>
                <span className="text-[12px] font-semibold text-blue-800">
                  {edu.start_date} – {edu.end_date}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <section className="mb-7">
          <SectionTitle>Skills</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, i) => (
              <span
                key={i}
                className="rounded-full bg-blue-700 px-4 py-1.5 text-[12.5px] font-semibold text-white"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {data.certifications.length > 0 && (
        <section className="mb-7">
          <SectionTitle>Certifications</SectionTitle>
          <div className="space-y-2">
            {data.certifications.map((cert, idx) => (
              <div key={idx} className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[13.5px] font-semibold text-gray-900">{cert.name}</span>
                <span className="text-[12.5px] text-gray-600">
                  {cert.issuer}
                  {cert.date ? ` · ${cert.date}` : ""}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Languages */}
      {data.languages.length > 0 && (
        <section>
          <SectionTitle>Languages</SectionTitle>
          <p className="text-[13.5px] text-gray-700">{data.languages.join(" · ")}</p>
        </section>
      )}
    </div>
  );
}
