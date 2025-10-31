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
    <div className="bg-white text-gray-900 shadow-lg min-h-[297mm] w-[210mm] flex">
      {/* Left Sidebar */}
      <div className="w-1/3 bg-gradient-to-b from-red-600 to-red-700 text-white p-6">
        <div className="mb-8">
          <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-4xl font-bold text-red-600">
              {data.personal_info.full_name?.charAt(0) || "?"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">
            {data.personal_info.full_name || "Your Name"}
          </h1>
        </div>

        {/* Contact Info */}
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide mb-3 border-b border-white/30 pb-2">
            Contact
          </h2>
          <div className="space-y-2 text-sm">
            {data.personal_info.email && (
              <p className="break-words">{data.personal_info.email}</p>
            )}
            {data.personal_info.phone && <p>{data.personal_info.phone}</p>}
            {data.personal_info.location && <p>{data.personal_info.location}</p>}
            {data.personal_info.linkedin && (
              <p className="break-words">{data.personal_info.linkedin}</p>
            )}
          </div>
        </div>

        {/* Skills */}
        {data.skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wide mb-3 border-b border-white/30 pb-2">
              Skills
            </h2>
            <div className="space-y-2">
              {data.skills.map((skill, idx) => (
                <div key={idx} className="text-sm">
                  <p className="mb-1">{skill}</p>
                  <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full w-4/5"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {data.languages.length > 0 && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide mb-3 border-b border-white/30 pb-2">
              Languages
            </h2>
            <div className="space-y-1 text-sm">
              {data.languages.map((lang, idx) => (
                <p key={idx}>{lang}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Content */}
      <div className="w-2/3 p-8">
        {/* Summary */}
        {data.summary && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-red-600 mb-3 border-b-2 border-red-600 pb-1">
              About Me
            </h2>
            <p className="text-gray-700 leading-relaxed">{data.summary}</p>
          </div>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-red-600 mb-3 border-b-2 border-red-600 pb-1">
              Experience
            </h2>
            {data.experience.map((exp, idx) => (
              <div key={idx} className="mb-4 relative pl-4 border-l-2 border-gray-300">
                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-red-600 rounded-full"></div>
                <div className="mb-1">
                  <h3 className="font-bold text-gray-900">{exp.position}</h3>
                  <p className="text-sm text-red-600 font-semibold">{exp.company}</p>
                  <p className="text-xs text-gray-500">
                    {exp.start_date} - {exp.end_date || "Present"}
                  </p>
                </div>
                {exp.description && (
                  <p className="text-sm text-gray-700 mb-2">{exp.description}</p>
                )}
                {exp.achievements && exp.achievements.length > 0 && (
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {exp.achievements.map((achievement, i) => (
                      <li key={i}>{achievement}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-red-600 mb-3 border-b-2 border-red-600 pb-1">
              Education
            </h2>
            {data.education.map((edu, idx) => (
              <div key={idx} className="mb-3">
                <h3 className="font-bold text-gray-900">
                  {edu.degree} {edu.field && `in ${edu.field}`}
                </h3>
                <p className="text-sm text-gray-700">{edu.institution}</p>
                <p className="text-xs text-gray-500">
                  {edu.start_date} - {edu.end_date}
                  {edu.gpa && ` • GPA: ${edu.gpa}`}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {data.certifications.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-red-600 mb-3 border-b-2 border-red-600 pb-1">
              Certifications
            </h2>
            {data.certifications.map((cert, idx) => (
              <div key={idx} className="mb-2">
                <h3 className="font-semibold text-gray-900">{cert.name}</h3>
                <p className="text-sm text-gray-600">
                  {cert.issuer} • {cert.date}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
