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
    <div className="bg-white text-gray-900 p-12 shadow-xl min-h-[297mm] w-[210mm] font-sans">
      {/* Premium Header with gradient accent */}
      <div className="relative pb-8 mb-8">
        <div className="absolute top-0 left-0 w-20 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
        <h1 className="text-5xl font-bold text-gray-900 mb-3 mt-4 tracking-tight">
          {data.personal_info.full_name || "Your Name"}
        </h1>
        <div className="flex flex-wrap gap-5 text-sm text-gray-600 mt-4">
          {data.personal_info.email && (
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-blue-600"></span>
              {data.personal_info.email}
            </span>
          )}
          {data.personal_info.phone && (
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-blue-600"></span>
              {data.personal_info.phone}
            </span>
          )}
          {data.personal_info.location && (
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-blue-600"></span>
              {data.personal_info.location}
            </span>
          )}
          {data.personal_info.linkedin && (
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-blue-600"></span>
              {data.personal_info.linkedin}
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4 uppercase tracking-wide">
            Professional Summary
          </h2>
          <p className="text-gray-700 leading-loose text-justify border-l-4 border-blue-100 pl-4 bg-gray-50 p-4 rounded-r">
            {data.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4 uppercase tracking-wide">
            Work Experience
          </h2>
          {data.experience.map((exp, idx) => (
            <div key={idx} className="mb-6 relative pl-6 border-l-2 border-blue-200">
              <div className="absolute -left-[9px] top-0 w-4 h-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full shadow-md"></div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-gray-900">{exp.position}</h3>
                <span className="text-xs text-gray-600 bg-blue-50 px-3 py-1 rounded-full font-medium">
                  {exp.start_date} - {exp.end_date || "Present"}
                </span>
              </div>
              <p className="text-md text-blue-700 font-semibold mb-3">{exp.company}</p>
              {exp.description && (
                <p className="text-gray-700 mb-3 leading-relaxed">{exp.description}</p>
              )}
              {exp.achievements && exp.achievements.length > 0 && (
                <ul className="space-y-2 text-gray-700">
                  {exp.achievements.map((achievement, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1.5">▸</span>
                      <span className="flex-1">{achievement}</span>
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
        <div className="mb-8">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4 uppercase tracking-wide">
            Skills
          </h2>
          <div className="flex flex-wrap gap-3">
            {data.skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm font-semibold shadow-md hover:shadow-lg transition-shadow"
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
