import type { ResumeTemplateData } from "./types";

interface TemplateProps {
  data: ResumeTemplateData;
}

export default function VanguardTemplate({ data }: TemplateProps) {
  const SectionTitle = ({ children, light = false }: { children: string; light?: boolean }) => (
    <h2 className={`mb-4 text-[11px] font-bold uppercase tracking-[0.2em] ${light ? "text-emerald-100" : "text-emerald-900"}`}>
      {children}
    </h2>
  );

  return (
    <div className="mx-auto grid min-h-[297mm] w-[210mm] grid-cols-[238px_1fr] bg-white font-sans text-zinc-800">
      <aside className="bg-emerald-950 px-8 py-12 text-white">
        <div className="mb-10 h-10 w-10 border-4 border-rose-400" />
        <div className="mb-9">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-300">Contact</p>
          <div className="space-y-2 break-words text-[10.5px] leading-relaxed text-emerald-50">
            {data.personal_info.email && <p>{data.personal_info.email}</p>}
            {data.personal_info.phone && <p>{data.personal_info.phone}</p>}
            {data.personal_info.location && <p>{data.personal_info.location}</p>}
            {data.personal_info.linkedin && <p>{data.personal_info.linkedin}</p>}
            {data.personal_info.portfolio && <p>{data.personal_info.portfolio}</p>}
          </div>
        </div>

        {data.skills.length > 0 && (
          <section className="mb-9 break-inside-avoid">
            <SectionTitle light>Capabilities</SectionTitle>
            <div className="space-y-2">
              {data.skills.map((skill, index) => (
                <div key={index} className="border-b border-emerald-800 pb-2 text-[11px] text-emerald-50">{skill}</div>
              ))}
            </div>
          </section>
        )}

        {data.education.length > 0 && (
          <section className="mb-9">
            <SectionTitle light>Education</SectionTitle>
            <div className="space-y-5">
              {data.education.map((edu, index) => (
                <article key={index} className="break-inside-avoid">
                  <p className="text-[11.5px] font-bold leading-snug text-white">{edu.degree}{edu.field ? ` · ${edu.field}` : ""}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-emerald-100">{edu.institution}</p>
                  <p className="mt-1 text-[9.5px] font-semibold text-rose-300">{edu.start_date} — {edu.end_date}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {data.languages.length > 0 && (
          <section className="break-inside-avoid">
            <SectionTitle light>Languages</SectionTitle>
            <div className="space-y-2 text-[10.5px] text-emerald-50">
              {data.languages.map((language, index) => <p key={index}>{language}</p>)}
            </div>
          </section>
        )}
      </aside>

      <main className="px-11 py-12">
        <header className="mb-9">
          <div className="mb-4 h-1.5 w-16 bg-rose-500" />
          <h1 className="text-[42px] font-black leading-[1.02] text-emerald-950">
            {data.personal_info.full_name || "Your Name"}
          </h1>
          {data.experience[0]?.position && (
            <p className="mt-3 text-[14px] font-bold uppercase tracking-[0.1em] text-rose-600">{data.experience[0].position}</p>
          )}
        </header>

        {data.summary && (
          <section className="mb-9 break-inside-avoid border-y border-zinc-200 py-5">
            <p className="text-[13px] font-medium leading-[1.7] text-zinc-700">{data.summary}</p>
          </section>
        )}

        {data.experience.length > 0 && (
          <section className="mb-9">
            <SectionTitle>Career Experience</SectionTitle>
            <div className="space-y-7">
              {data.experience.map((exp, index) => (
                <article key={index} className="break-inside-avoid">
                  <div className="flex items-start gap-4">
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-rose-500" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-[15px] font-black text-emerald-950">{exp.position}</h3>
                          <p className="mt-0.5 text-[11.5px] font-bold text-rose-600">{exp.company}</p>
                        </div>
                        <span className="shrink-0 text-[9.5px] font-bold text-zinc-500">{exp.start_date} — {exp.end_date || "Present"}</span>
                      </div>
                      {exp.description && <p className="mt-2 text-[11.5px] leading-relaxed text-zinc-600">{exp.description}</p>}
                      {exp.achievements?.length > 0 && (
                        <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-zinc-600">
                          {exp.achievements.filter(Boolean).map((achievement, itemIndex) => (
                            <li key={itemIndex} className="flex gap-2"><span className="text-rose-500">→</span><span>{achievement}</span></li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {data.certifications.length > 0 && (
          <section className="break-inside-avoid">
            <SectionTitle>Professional Credentials</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              {data.certifications.map((cert, index) => (
                <div key={index} className="border border-zinc-200 px-4 py-3">
                  <p className="text-[10.5px] font-bold text-emerald-950">{cert.name}</p>
                  <p className="mt-1 text-[9.5px] text-zinc-500">{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}