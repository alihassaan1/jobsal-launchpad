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
    <div className="bg-white text-gray-900 p-8 shadow-lg min-h-[297mm] w-[210mm]">
      {/* Header with accent color */}
      <div className="border-b-4 border-red-600 pb-6 mb-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {data.personal_info.full_name || "Your Name"}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {data.personal_info.email && (
            <span>{data.personal_info.email}</span>
          )}
          {data.personal_info.phone && (
            <span>{data.personal_info.phone}</span>
          )}
          {data.personal_info.location && (
            <span>{data.personal_info.location}</span>
          )}
          {data.personal_info.linkedin && (
            <span>{data.personal_info.linkedin}</span>
          )}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-red-600 mb-3">Professional Summary</h2>
          <p className="text-gray-700 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-red-600 mb-3">Work Experience</h2>
          {data.experience.map((exp, idx) => (
            <div key={idx} className="mb-4">
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-lg font-semibold text-gray-900">{exp.position}</h3>
                <span className="text-sm text-gray-600">
                  {exp.start_date} - {exp.end_date || "Present"}
                </span>
              </div>
              <p className="text-md text-gray-700 font-medium mb-2">{exp.company}</p>
              {exp.description && (
                <p className="text-gray-700 mb-2">{exp.description}</p>
              )}
              {exp.achievements && exp.achievements.length > 0 && (
                <ul className="list-disc list-inside text-gray-700 space-y-1">
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
          <h2 className="text-xl font-bold text-red-600 mb-3">Education</h2>
          {data.education.map((edu, idx) => (
            <div key={idx} className="mb-3">
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {edu.degree} {edu.field && `in ${edu.field}`}
                </h3>
                <span className="text-sm text-gray-600">
                  {edu.start_date} - {edu.end_date}
                </span>
              </div>
              <p className="text-gray-700">{edu.institution}</p>
              {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-red-600 mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {data.certifications.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-red-600 mb-3">Certifications</h2>
          {data.certifications.map((cert, idx) => (
            <div key={idx} className="mb-2">
              <h3 className="font-semibold text-gray-900">{cert.name}</h3>
              <p className="text-sm text-gray-600">
                {cert.issuer} - {cert.date}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Languages */}
      {data.languages.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-red-600 mb-3">Languages</h2>
          <div className="flex flex-wrap gap-2">
            {data.languages.map((lang, idx) => (
              <span key={idx} className="text-gray-700">
                {lang}
                {idx < data.languages.length - 1 && ", "}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
