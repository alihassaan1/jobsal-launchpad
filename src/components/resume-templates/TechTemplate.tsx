import type { ResumeTemplateData } from "./types";

interface TemplateProps {
  data: ResumeTemplateData;
}

export default function TechTemplate({ data }: TemplateProps) {
  const contact = [
    data.personal_info.email,
    data.personal_info.phone,
    data.personal_info.location,
    data.personal_info.linkedin,
    data.personal_info.portfolio,
  ].filter(Boolean);

  return (
    <div className="bg-white text-gray-900 w-[210mm] min-h-[297mm] mx-auto p-12 font-sans">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
          {data.personal_info.full_name || "Your Name"}
        </h1>
        <div className="mt-3 h-[3px] w-16 bg-emerald-600" />
        {contact.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-gray-600 font-mono">
            {contact.map((item, i) => (
              <span key={i}>{item}</span>
            ))}
          </div>
        )}
      </header>

      {/* Summary */}
      {data.summary && (
        <section className="mb-7">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700 mb-2">
            About
          </h2>
          <p className="text-[13.5px] leading-relaxed text-gray-700">{data.summary}</p>
        </section>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <section className="mb-7">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700 mb-3">
            Tech Stack
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, i) => (
              <span
                key={i}
                className="border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[12px] font-mono text-emerald-800 rounded"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <section className="mb-7">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700 mb-3">
            Experience
          </h2>
          <div className="space-y-5">
            {data.experience.map((exp, idx) => (
              <div key={idx} className="border-l-2 border-gray-200 pl-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-gray-900">{exp.position}</h3>
                  <span className="text-[12px] font-mono text-gray-500">
                    {exp.start_date} — {exp.end_date || "Present"}
                  </span>
                </div>
                <p className="text-[13px] font-medium text-emerald-700">{exp.company}</p>
                {exp.description && (
                  <p className="mt-1.5 text-[13px] leading-relaxed text-gray-700">{exp.description}</p>
                )}
                {exp.achievements?.length > 0 && (
                  <ul className="mt-2 space-y-1 text-[13px] text-gray-700">
                    {exp.achievements.filter(Boolean).map((a, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-emerald-600 font-mono">›</span>
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
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700 mb-3">
            Education
          </h2>
          <div className="space-y-3">
            {data.education.map((edu, idx) => (
              <div key={idx} className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h3 className="text-[14px] font-semibold text-gray-900">
                    {edu.degree}
                    {edu.field ? `, ${edu.field}` : ""}
                  </h3>
                  <p className="text-[13px] text-gray-600">{edu.institution}</p>
                  {edu.gpa && <p className="text-[12px] text-gray-500 font-mono">GPA {edu.gpa}</p>}
                </div>
                <span className="text-[12px] font-mono text-gray-500">
                  {edu.start_date} — {edu.end_date}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {data.certifications.length > 0 && (
        <section className="mb-7">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700 mb-3">
            Certifications
          </h2>
          <div className="space-y-2">
            {data.certifications.map((cert, idx) => (
              <div key={idx} className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[13.5px] font-medium text-gray-900">{cert.name}</span>
                <span className="text-[12px] font-mono text-gray-500">
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
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700 mb-2">
            Languages
          </h2>
          <p className="text-[13.5px] text-gray-700">{data.languages.join(" · ")}</p>
        </section>
      )}
    </div>
  );
}
