import type { ResumeTemplateData } from "./types";

interface TemplateProps {
  data: ResumeTemplateData;
}

export default function LedgerTemplate({ data }: TemplateProps) {
  const SectionTitle = ({ code, children }: { code: string; children: string }) => (
    <div className="mb-4 grid grid-cols-[40px_1fr] items-center gap-3 border-b-2 border-slate-900 pb-2">
      <span className="font-mono text-[9px] font-bold text-amber-700">{code}</span>
      <h2 className="text-[12px] font-black uppercase tracking-[0.16em] text-slate-900">{children}</h2>
    </div>
  );

  return (
    <div className="mx-auto min-h-[297mm] w-[210mm] bg-white px-12 py-11 font-sans text-slate-800">
      <header className="mb-8 border-2 border-slate-900">
        <div className="grid grid-cols-[1fr_235px]">
          <div className="px-7 py-6">
            <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-amber-700">Professional Dossier</p>
            <h1 className="text-[37px] font-black leading-none text-slate-950">{data.personal_info.full_name || "Your Name"}</h1>
            {data.experience[0]?.position && <p className="mt-3 text-[12px] font-bold uppercase tracking-[0.09em] text-slate-600">{data.experience[0].position}</p>}
          </div>
          <div className="border-l-2 border-slate-900 bg-slate-100 px-5 py-5 font-mono text-[9.5px] leading-[1.7] text-slate-700">
            {data.personal_info.email && <p>{data.personal_info.email}</p>}
            {data.personal_info.phone && <p>{data.personal_info.phone}</p>}
            {data.personal_info.location && <p>{data.personal_info.location}</p>}
            {data.personal_info.linkedin && <p>{data.personal_info.linkedin}</p>}
            {data.personal_info.portfolio && <p>{data.personal_info.portfolio}</p>}
          </div>
        </div>
      </header>

      {data.summary && (
        <section className="mb-7 grid break-inside-avoid grid-cols-[90px_1fr] gap-5 border-b border-slate-300 pb-6">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-amber-700">Statement</p>
          <p className="text-[12.5px] leading-[1.65] text-slate-700">{data.summary}</p>
        </section>
      )}

      {data.experience.length > 0 && (
        <section className="mb-8">
          <SectionTitle code="A.01">Professional Record</SectionTitle>
          <div className="space-y-5">
            {data.experience.map((exp, index) => (
              <article key={index} className="grid break-inside-avoid grid-cols-[90px_1fr] gap-5">
                <div className="font-mono text-[9.5px] font-bold leading-relaxed text-slate-500">
                  {exp.start_date}<br />{exp.end_date || "Present"}
                </div>
                <div className="border-l border-slate-300 pl-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-[14px] font-black text-slate-950">{exp.position}</h3>
                    <span className="font-mono text-[9.5px] font-bold text-amber-700">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">{exp.company}</p>
                  {exp.description && <p className="mt-2 text-[11.5px] leading-relaxed text-slate-600">{exp.description}</p>}
                  {exp.achievements?.length > 0 && (
                    <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-slate-600">
                      {exp.achievements.filter(Boolean).map((achievement, itemIndex) => (
                        <li key={itemIndex} className="flex gap-2"><span className="font-mono text-amber-700">+</span><span>{achievement}</span></li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-[1.2fr_1fr] gap-8">
        <div>
          {data.education.length > 0 && (
            <section>
              <SectionTitle code="B.02">Education</SectionTitle>
              <div className="space-y-3">
                {data.education.map((edu, index) => (
                  <article key={index} className="break-inside-avoid border-b border-slate-200 pb-3">
                    <h3 className="text-[11.5px] font-black text-slate-900">{edu.degree}{edu.field ? ` — ${edu.field}` : ""}</h3>
                    <p className="mt-1 text-[10.5px] text-slate-600">{edu.institution}</p>
                    <p className="mt-1 font-mono text-[9px] text-amber-700">{edu.start_date} / {edu.end_date}{edu.gpa ? ` / ${edu.gpa}` : ""}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
        <div>
          {data.skills.length > 0 && (
            <section className="mb-6 break-inside-avoid">
              <SectionTitle code="C.03">Competencies</SectionTitle>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {data.skills.map((skill, index) => <p key={index} className="text-[10.5px] font-semibold text-slate-700">{skill}</p>)}
              </div>
            </section>
          )}
          {data.certifications.length > 0 && (
            <section className="mb-6 break-inside-avoid">
              <SectionTitle code="D.04">Credentials</SectionTitle>
              <div className="space-y-2">
                {data.certifications.map((cert, index) => (
                  <p key={index} className="text-[10.5px] text-slate-700"><strong>{cert.name}</strong><br /><span className="text-[9.5px] text-slate-500">{cert.issuer}{cert.date ? ` / ${cert.date}` : ""}</span></p>
                ))}
              </div>
            </section>
          )}
          {data.languages.length > 0 && (
            <section className="break-inside-avoid">
              <SectionTitle code="E.05">Languages</SectionTitle>
              <p className="text-[10.5px] leading-relaxed text-slate-700">{data.languages.join(" / ")}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}