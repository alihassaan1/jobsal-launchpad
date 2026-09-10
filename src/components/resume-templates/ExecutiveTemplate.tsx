interface ResumeData {
  personal_info: {
    full_name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    portfolio: string;
  };
  summary: string;
  experience: Array<{
    company: string;
    position: string;
    start_date: string;
    end_date: string;
    description: string;
    achievements: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    start_date: string;
    end_date: string;
    gpa: string;
  }>;
  skills: string[];
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  languages: string[];
}

interface TemplateProps {
  data: ResumeData;
}

export default function ExecutiveTemplate({ data }: TemplateProps) {
  return (
    <div className="bg-white text-gray-900 p-12 min-h-[297mm] w-[210mm] mx-auto">
      {/* Header - Executive Style */}
      <div className="mb-10 pb-8 border-b-2 border-gray-900">
        <h1 className="text-6xl font-light text-gray-900 mb-4 tracking-tight">
          {data.personal_info.full_name || "Your Name"}
        </h1>
        <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm text-gray-700 mt-6">
          {data.personal_info.email && (
            <div className="flex items-center gap-3">
              <span className="font-bold w-24 text-gray-900 uppercase text-xs tracking-wide">Email</span>
              <span className="font-medium">{data.personal_info.email}</span>
            </div>
          )}
          {data.personal_info.phone && (
            <div className="flex items-center gap-3">
              <span className="font-bold w-24 text-gray-900 uppercase text-xs tracking-wide">Phone</span>
              <span className="font-medium">{data.personal_info.phone}</span>
            </div>
          )}
          {data.personal_info.location && (
            <div className="flex items-center gap-3">
              <span className="font-bold w-24 text-gray-900 uppercase text-xs tracking-wide">Location</span>
              <span className="font-medium">{data.personal_info.location}</span>
            </div>
          )}
          {data.personal_info.linkedin && (
            <div className="flex items-center gap-3">
              <span className="font-bold w-24 text-gray-900 uppercase text-xs tracking-wide">LinkedIn</span>
              <span className="font-medium">{data.personal_info.linkedin}</span>
            </div>
          )}
        </div>
      </div>

      {/* Executive Summary */}
      {data.summary && (
        <div className="mb-10">
          <h2 className="text-3xl font-light text-gray-900 mb-5 tracking-wide uppercase border-l-4 border-gray-900 pl-4">
            Executive Summary
          </h2>
          <p className="text-gray-700 leading-loose text-justify text-base bg-gray-100 p-6 rounded-lg ">{data.summary}</p>
        </div>
      )}

      {/* Professional Experience */}
      {data.experience.length > 0 && (
        <div className="mb-10">
          <h2 className="text-3xl font-light text-gray-900 mb-5 tracking-wide uppercase border-l-4 border-gray-900 pl-4">
            Professional Experience
          </h2>
          {data.experience.map((exp, idx) => (
            <div key={idx} className="mb-8 bg-white p-6 rounded-lg border-l-4 border-gray-900">
              <div className="mb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900">{exp.position}</h3>
                    <p className="text-xl text-gray-700 mt-2 font-medium">{exp.company}</p>
                  </div>
                  <span className="text-xs text-gray-600 bg-gray-200 px-4 py-2 rounded font-bold uppercase tracking-wide">
                    {exp.start_date} – {exp.end_date || "Present"}
                  </span>
                </div>
              </div>
              {exp.description && (
                <p className="text-gray-700 mb-4 text-justify leading-relaxed">{exp.description}</p>
              )}
              {exp.achievements && exp.achievements.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Key Achievements</p>
                  <ul className="list-none space-y-3 text-gray-700">
                    {exp.achievements.map((achievement, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-gray-900 font-bold text-lg">→</span>
                        <span className="leading-relaxed">{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <div className="mb-10">
          <h2 className="text-3xl font-light text-gray-900 mb-5 tracking-wide uppercase border-l-4 border-gray-900 pl-4">
            Education
          </h2>
          {data.education.map((edu, idx) => (
            <div key={idx} className="mb-5 bg-white p-5 rounded-lg ">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {edu.degree} {edu.field && `in ${edu.field}`}
                  </h3>
                  <p className="text-gray-700 mt-2 font-medium">{edu.institution}</p>
                </div>
                <span className="text-xs text-gray-600 font-bold uppercase tracking-wide">
                  {edu.start_date} – {edu.end_date}
                </span>
              </div>
              {edu.gpa && (
                <p className="text-sm text-gray-700 mt-3 font-semibold">Grade Point Average: {edu.gpa}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-10 mb-10">
        {/* Core Competencies */}
        {data.skills.length > 0 && (
          <div>
            <h2 className="text-2xl font-light text-gray-900 mb-5 tracking-wide uppercase border-l-4 border-gray-900 pl-4">
              Core Competencies
            </h2>
            <div className="grid grid-cols-1 gap-3 bg-white p-5 rounded-lg ">
              {data.skills.map((skill, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-gray-900 rounded-full flex-shrink-0"></span>
                  <span className="text-gray-700 font-medium">{skill}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {data.languages.length > 0 && (
          <div>
            <h2 className="text-2xl font-light text-gray-900 mb-5 tracking-wide uppercase border-l-4 border-gray-900 pl-4">
              Languages
            </h2>
            <div className="space-y-3 bg-white p-5 rounded-lg ">
              {data.languages.map((lang, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-gray-900 rounded-full flex-shrink-0"></span>
                  <span className="text-gray-700 font-medium">{lang}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Certifications */}
      {data.certifications.length > 0 && (
        <div>
          <h2 className="text-3xl font-light text-gray-900 mb-5 tracking-wide uppercase border-l-4 border-gray-900 pl-4">
            Professional Certifications
          </h2>
          {data.certifications.map((cert, idx) => (
            <div key={idx} className="mb-4 bg-white p-5 rounded-lg flex items-start gap-4">
              <div className="w-4 h-4 bg-gray-900 rounded-full flex-shrink-0 mt-1"></div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{cert.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {cert.issuer} • Issued {cert.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
