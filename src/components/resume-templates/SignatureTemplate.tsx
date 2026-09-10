import type { ResumeTemplateData } from "./types";

interface TemplateProps {
  data: ResumeTemplateData;
}

export default function SignatureTemplate({ data }: TemplateProps) {
  const contact = [
    data.personal_info.email,
    data.personal_info.phone,
    data.personal_info.location,
    data.personal_info.linkedin,
    data.personal_info.portfolio,
  ].filter(Boolean);

  const Heading = ({ children }: { children: string }) => (
    <h2 className="mb-4 flex items-center gap-4 font-serif text-[18px] font-bold text-neutral-950">
      <span className="h-px w-9 bg-red-700" />
      {children}
    </h2>
  );

  return (
    <div className="mx-auto min-h-[297mm] w-[210mm] bg-white px-14 py-10 font-sans text-neutral-900">
      <header className="mb-7 border-b border-neutral-300 pb-6">
        <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.24em] text-red-700">
          Curriculum Vitae
        </div>
        <h1 className="max-w-[650px] font-serif text-[48px] font-bold leading-[1.02] text-neutral-950">
          {data.personal_info.full_name || "Your Name"}
        </h1>
        {data.experience[0]?.position && (
          <p className="mt-3 text-[16px] font-medium text-neutral-600">
            {data.experience[0].position}
          </p>
        )}
        {contact.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-[11.5px] text-neutral-600">
            {contact.map((item, index) => (
              <span key={index}>{item}</span>
            ))}
          </div>
        )}
      </header>

      {data.summary && (
        <section className="mb-6 break-inside-avoid">
          <div className="grid grid-cols-[130px_1fr] gap-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-700">Profile</p>
            <p className="font-serif text-[16px] leading-[1.65] text-neutral-700">{data.summary}</p>
          </div>
        </section>
      )}

      {data.experience.length > 0 && (
        <section className="mb-6">
          <Heading>Selected Experience</Heading>
          <div className="space-y-5">
            {data.experience.map((exp, index) => (
              <article key={index} className="grid break-inside-avoid grid-cols-[130px_1fr] gap-8">
                <div className="pt-0.5 text-[11px] font-semibold leading-relaxed text-neutral-500">
                  {exp.start_date} — {exp.end_date || "Present"}
                </div>
                <div>
                  <h3 className="font-serif text-[17px] font-bold text-neutral-950">{exp.position}</h3>
                  <p className="mt-0.5 text-[12px] font-bold uppercase tracking-[0.12em] text-red-700">
                    {exp.company}
                  </p>
                  {exp.description && <p className="mt-2 text-[12.5px] leading-relaxed text-neutral-700">{exp.description}</p>}
                  {exp.achievements?.length > 0 && (
                    <ul className="mt-2 space-y-1 text-[12px] leading-relaxed text-neutral-700">
                      {exp.achievements.filter(Boolean).map((achievement, itemIndex) => (
                        <li key={itemIndex} className="flex gap-2">
                          <span className="text-red-700">—</span><span>{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-[1.45fr_1fr] gap-10">
        <div>
          {data.education.length > 0 && (
            <section className="mb-6">
              <Heading>Education</Heading>
              <div className="space-y-4">
                {data.education.map((edu, index) => (
                  <article key={index} className="break-inside-avoid border-l border-neutral-300 pl-4">
                    <h3 className="text-[13px] font-bold text-neutral-950">{edu.degree}{edu.field ? `, ${edu.field}` : ""}</h3>
                    <p className="mt-1 text-[12px] text-neutral-600">{edu.institution}</p>
                    <p className="mt-1 text-[10.5px] font-semibold text-red-700">{edu.start_date} — {edu.end_date}{edu.gpa ? ` · ${edu.gpa}` : ""}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
        <aside>
          {data.skills.length > 0 && (
            <section className="mb-7 break-inside-avoid">
              <Heading>Expertise</Heading>
              <div className="flex flex-wrap gap-x-3 gap-y-2 text-[11.5px] text-neutral-700">
                {data.skills.map((skill, index) => <span key={index} className="border-b border-red-200 pb-1">{skill}</span>)}
              </div>
            </section>
          )}
          {data.certifications.length > 0 && (
            <section className="mb-7 break-inside-avoid">
              <Heading>Credentials</Heading>
              <div className="space-y-3">
                {data.certifications.map((cert, index) => (
                  <div key={index}>
                    <p className="text-[11.5px] font-bold text-neutral-900">{cert.name}</p>
                    <p className="text-[10.5px] text-neutral-500">{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          {data.languages.length > 0 && (
            <section className="break-inside-avoid">
              <Heading>Languages</Heading>
              <p className="text-[11.5px] leading-relaxed text-neutral-700">{data.languages.join(" · ")}</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}