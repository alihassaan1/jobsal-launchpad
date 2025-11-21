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

export default function CreativeTemplate({ data }: TemplateProps) {
  return (
    <div className="bg-white text-gray-900 shadow-2xl min-h-[297mm] w-[210mm] flex mx-auto">
      {/* Left Sidebar - Fixed width to prevent layout shifts */}
      <div className="w-[70mm] bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 text-white p-6 relative overflow-hidden flex-shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-12 -mb-12"></div>
        <div className="mb-10 relative z-10">
          <div className="w-28 h-28 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full mx-auto mb-6 flex items-center justify-center shadow-xl border-4 border-white">
            <span className="text-5xl font-bold bg-gradient-to-br from-purple-900 to-indigo-900 bg-clip-text text-transparent">
              {data.personal_info.full_name?.charAt(0) || "?"}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-center mb-2 tracking-wide">
            {data.personal_info.full_name || "Your Name"}
          </h1>
        </div>

        {/* Contact Info */}
        <div className="mb-8 relative z-10">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4 border-b-2 border-purple-300/50 pb-2">
            Contact
          </h2>
          <div className="space-y-3 text-sm">
            {data.personal_info.email && (
              <p className="break-words flex items-start gap-2">
                <span className="text-purple-300">✉</span>
                <span>{data.personal_info.email}</span>
              </p>
            )}
            {data.personal_info.phone && (
              <p className="flex items-start gap-2">
                <span className="text-purple-300">☎</span>
                <span>{data.personal_info.phone}</span>
              </p>
            )}
            {data.personal_info.location && (
              <p className="flex items-start gap-2">
                <span className="text-purple-300">📍</span>
                <span>{data.personal_info.location}</span>
              </p>
            )}
            {data.personal_info.linkedin && (
              <p className="break-words flex items-start gap-2">
                <span className="text-purple-300">🔗</span>
                <span>{data.personal_info.linkedin}</span>
              </p>
            )}
          </div>
        </div>

        {/* Skills */}
        {data.skills.length > 0 && (
          <div className="mb-8 relative z-10">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4 border-b-2 border-purple-300/50 pb-2">
              Skills
            </h2>
            <div className="space-y-3">
              {data.skills.map((skill, idx) => (
                <div key={idx} className="text-sm">
                  <p className="mb-2 font-semibold">{skill}</p>
                  <div className="h-1.5 bg-purple-300/30 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-purple-300 to-pink-300 rounded-full w-4/5 shadow-md"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {data.languages.length > 0 && (
          <div className="relative z-10">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4 border-b-2 border-purple-300/50 pb-2">
              Languages
            </h2>
            <div className="space-y-2 text-sm">
              {data.languages.map((lang, idx) => (
                <p key={idx} className="flex items-center gap-2">
                  <span className="text-purple-300">•</span>
                  <span className="font-medium">{lang}</span>
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Content - Fixed width to prevent layout shifts */}
      <div className="w-[140mm] p-8 bg-gradient-to-br from-gray-50 to-white flex-shrink-0">
        {/* Summary */}
        {data.summary && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-900 to-indigo-900 bg-clip-text text-transparent mb-4 border-b-2 border-purple-900 pb-2">
              About Me
            </h2>
            <p className="text-gray-700 leading-loose text-justify">{data.summary}</p>
          </div>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-900 to-indigo-900 bg-clip-text text-transparent mb-4 border-b-2 border-purple-900 pb-2">
              Experience
            </h2>
            {data.experience.map((exp, idx) => (
              <div key={idx} className="mb-6 relative pl-6 border-l-4 border-purple-200">
                <div className="absolute -left-[13px] top-0 w-6 h-6 bg-gradient-to-br from-purple-900 to-indigo-900 rounded-full shadow-lg"></div>
                <div className="mb-2">
                  <h3 className="font-bold text-gray-900 text-lg">{exp.position}</h3>
                  <p className="text-sm bg-gradient-to-r from-purple-900 to-indigo-900 bg-clip-text text-transparent font-bold">{exp.company}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {exp.start_date} – {exp.end_date || "Present"}
                  </p>
                </div>
                {exp.description && (
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">{exp.description}</p>
                )}
                {exp.achievements && exp.achievements.length > 0 && (
                  <ul className="space-y-2 text-sm text-gray-700">
                    {exp.achievements.map((achievement, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-purple-600 mt-1">▸</span>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-900 to-indigo-900 bg-clip-text text-transparent mb-4 border-b-2 border-purple-900 pb-2">
              Education
            </h2>
            {data.education.map((edu, idx) => (
              <div key={idx} className="mb-4 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg shadow-md">
                <h3 className="font-bold text-gray-900 text-lg">
                  {edu.degree} {edu.field && `in ${edu.field}`}
                </h3>
                <p className="text-sm text-gray-700 font-medium">{edu.institution}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {edu.start_date} – {edu.end_date}
                  {edu.gpa && ` • GPA: ${edu.gpa}`}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {data.certifications.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-900 to-indigo-900 bg-clip-text text-transparent mb-4 border-b-2 border-purple-900 pb-2">
              Certifications
            </h2>
            {data.certifications.map((cert, idx) => (
              <div key={idx} className="mb-4 flex items-start gap-3">
                <div className="w-3 h-3 bg-gradient-to-br from-purple-900 to-indigo-900 rounded-full mt-1 flex-shrink-0"></div>
                <div>
                  <h3 className="font-bold text-gray-900">{cert.name}</h3>
                  <p className="text-sm text-gray-600">
                    {cert.issuer} • {cert.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
