import type { ResumeTemplateData } from "./types";

interface TemplateProps {
  data: ResumeTemplateData;
}

export default function NordicTemplate({ data }: TemplateProps) {
  const Heading = ({ number, children }: { number: string; children: string }) => (
    <div className="mb-4 flex items-baseline gap-3">
      <span className="text-[10px] font-bold text-teal-700">{number}</span>
      <h2 className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-800">{children}</h2>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );

  return (
    <div className="mx-auto min-h-[297mm] w-[210mm] bg-slate-50 px-14 py-12 font-sans text-slate-800">
      <header className="mb-10 grid grid-cols-[1fr_230px] gap-10">
        <div>
          <div className="mb-5 h-2 w-16 bg-teal-600" />
          <h1 className="text-[44px] font-light leading-[1.05] text-slate-900">
            {data.personal_info.full_name || "Your Name"}
          </h1>
          {data.experience[0]?.position && <p className="mt-3 text-[14px] font-semibold text-teal-700">{data.experience[0].position}</p>}
        </div>
        <div className="border-l border-slate-200 pl-6 pt-1 text-[10.5px] leading-[1.9] text-slate-600">
          {data.personal_info.email && <p>{data.personal_info.email}</p>}
          {data.personal_info.phone && <p>{data.personal_info.phone}</p>}
          {data.personal_info.location && <p>{data.personal_info.location}</p>}
          {data.personal_info.linkedin && <p>{data.personal_info.linkedin}</p>}
          {data.personal_info.portfolio && <p>{data.personal_info.portfolio}</p>}
        </div>
      </header>

      {data.summary && (
        <section className="mb-9 break-inside-avoid bg-slate-100 px-7 py-5">
          <p className="max-w-[650px] text-[13px] leading-[1.75] text-slate-700">{data.summary}</p>
        </section>
      )}

      <div className="grid grid-cols-[1fr_205px] gap-11">
        <main>
          {data.experience.length > 0 && (
            <section className="mb-9">
              <Heading number="01">Experience</Heading>
              <div className="space-y-6">
                {data.experience.map((exp, index) => (
                  <article key={index} className="break-inside-avoid">
                    <div className="flex items-start justify-between gap-5">
                      <div>
                        <h3 className="text-[15px] font-bold text-slate-900">{exp.position}</h3>
                        <p className="mt-0.5 text-[12px] font-semibold text-teal-700">{exp.company}</p>
                      </div>
                      <p className="shrink-0 text-[10px] font-semibold text-slate-500">{exp.start_date} — {exp.end_date || "Present"}</p>
                    </div>
                    {exp.description && <p className="mt-2 text-[11.5px] leading-relaxed text-slate-600">{exp.description}</p>}
                    {exp.achievements?.length > 0 && (
                      <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-slate-600">
                        {exp.achievements.filter(Boolean).map((achievement, itemIndex) => (
                          <li key={itemIndex} className="flex gap-2"><span className="text-teal-600">•</span><span>{achievement}</span></li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {data.education.length > 0 && (
            <section>
              <Heading number="02">Education</Heading>
              <div className="space-y-4">
                {data.education.map((edu, index) => (
                  <article key={index} className="break-inside-avoid">
                    <h3 className="text-[13px] font-bold text-slate-900">{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</h3>
                    <div className="mt-1 flex justify-between gap-4 text-[11px] text-slate-600">
                      <span>{edu.institution}{edu.gpa ? ` · ${edu.gpa}` : ""}</span>
                      <span className="shrink-0">{edu.start_date} — {edu.end_date}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </main>

        <aside>
          {data.skills.length > 0 && (
            <section className="mb-8 break-inside-avoid">
              <Heading number="03">Skills</Heading>
              <div className="space-y-2.5">
                {data.skills.map((skill, index) => (
                  <div key={index} className="border-b border-slate-200 pb-2 text-[11.5px] font-medium text-slate-700">{skill}</div>
                ))}
              </div>
            </section>
          )}
          {data.certifications.length > 0 && (
            <section className="mb-8 break-inside-avoid">
              <Heading number="04">Credentials</Heading>
              <div className="space-y-3">
                {data.certifications.map((cert, index) => (
                  <div key={index}>
                    <p className="text-[11px] font-bold text-slate-800">{cert.name}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          {data.languages.length > 0 && (
            <section className="break-inside-avoid">
              <Heading number="05">Languages</Heading>
              <div className="space-y-2 text-[11px] text-slate-700">
                {data.languages.map((language, index) => <p key={index}>{language}</p>)}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}