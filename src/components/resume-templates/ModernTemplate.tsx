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

export default function ModernTemplate({ data }: TemplateProps) {
  return (
    <div className="bg-white text-gray-900 p-12 shadow-2xl min-h-[297mm] w-[210mm] font-sans relative overflow-hidden mx-auto">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl opacity-30 -z-10"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-50 to-blue-50 rounded-full blur-3xl opacity-30 -z-10"></div>
      
      {/* Premium Header with elegant gradient accent */}
      <div className="relative pb-8 mb-8 border-b-2 border-gradient-to-r from-blue-600 to-indigo-600">
        <div className="absolute top-0 left-0 w-24 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full shadow-md"></div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-3 mt-6 tracking-tight leading-tight">
          {data.personal_info.full_name || "Your Name"}
        </h1>
        <div className="flex flex-wrap gap-6 text-sm text-gray-600 mt-5">
          {data.personal_info.email && (
            <span className="flex items-center gap-2 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"></span>
              {data.personal_info.email}
            </span>
          )}
          {data.personal_info.phone && (
            <span className="flex items-center gap-2 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"></span>
              {data.personal_info.phone}
            </span>
          )}
          {data.personal_info.location && (
            <span className="flex items-center gap-2 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"></span>
              {data.personal_info.location}
            </span>
          )}
          {data.personal_info.linkedin && (
            <span className="flex items-center gap-2 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"></span>
              {data.personal_info.linkedin}
            </span>
          )}
          {data.personal_info.portfolio && (
            <span className="flex items-center gap-2 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"></span>
              {data.personal_info.portfolio}
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-5 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></span>
            Professional Summary
          </h2>
          <div className="relative">
            <p className="text-gray-700 leading-relaxed text-justify border-l-4 border-gradient-to-b from-blue-600 to-indigo-600 pl-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-5 rounded-r-lg shadow-sm">
              {data.summary}
            </p>
          </div>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-6 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></span>
            Work Experience
          </h2>
          {data.experience.map((exp, idx) => (
            <div key={idx} className="mb-7 relative pl-8 border-l-3 border-gradient-to-b from-blue-400 via-indigo-400 to-purple-400 hover:border-blue-600 transition-all duration-300 group">
              <div className="absolute -left-[11px] top-1 w-5 h-5 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-full shadow-lg ring-4 ring-white group-hover:scale-110 transition-transform duration-300"></div>
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{exp.position}</h3>
                <span className="text-xs text-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-1.5 rounded-full font-semibold shadow-sm">
                  {exp.start_date} – {exp.end_date || "Present"}
                </span>
              </div>
              <p className="text-md bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent font-bold mb-3">{exp.company}</p>
              {exp.description && (
                <p className="text-gray-700 mb-4 leading-relaxed text-justify">{exp.description}</p>
              )}
              {exp.achievements && exp.achievements.length > 0 && (
                <ul className="space-y-2.5 text-gray-700">
                  {exp.achievements.map((achievement, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-blue-600 mt-1 text-lg font-bold">▸</span>
                      <span className="flex-1 leading-relaxed">{achievement}</span>
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
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4 uppercase tracking-wide">
            Education
          </h2>
          {data.education.map((edu, idx) => (
            <div key={idx} className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-lg font-bold text-gray-900">
                  {edu.degree} {edu.field && `in ${edu.field}`}
                </h3>
                <span className="text-xs text-gray-600 font-medium">
                  {edu.start_date} - {edu.end_date}
                </span>
              </div>
              <p className="text-gray-700 font-medium">{edu.institution}</p>
              {edu.gpa && <p className="text-sm text-blue-700 mt-1 font-semibold">GPA: {edu.gpa}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-5 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></span>
            Core Skills
          </h2>
          <div className="flex flex-wrap gap-3">
            {data.skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-full text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {data.certifications.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4 uppercase tracking-wide">
            Certifications
          </h2>
          {data.certifications.map((cert, idx) => (
            <div key={idx} className="mb-3 flex items-start gap-3">
              <div className="w-2 h-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full mt-2"></div>
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

      {/* Languages */}
      {data.languages.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4 uppercase tracking-wide">
            Languages
          </h2>
          <div className="flex flex-wrap gap-3">
            {data.languages.map((lang, idx) => (
              <span key={idx} className="px-4 py-2 bg-blue-100 text-blue-900 rounded-lg text-sm font-semibold">
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
