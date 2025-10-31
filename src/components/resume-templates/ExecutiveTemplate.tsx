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
    <div className="bg-white text-gray-900 p-10 shadow-lg min-h-[297mm] w-[210mm]">
      {/* Header - Executive Style */}
      <div className="mb-8 pb-6 border-b border-gray-400">
        <h1 className="text-5xl font-light text-gray-900 mb-3 tracking-tight">
          {data.personal_info.full_name || "Your Name"}
        </h1>
        <div className="grid grid-cols-2 gap-x-8 text-sm text-gray-600 mt-4">
          {data.personal_info.email && (
            <div className="flex items-center">
              <span className="font-semibold w-20">Email:</span>
              <span>{data.personal_info.email}</span>
            </div>
          )}
          {data.personal_info.phone && (
            <div className="flex items-center">
              <span className="font-semibold w-20">Phone:</span>
              <span>{data.personal_info.phone}</span>
            </div>
          )}
          {data.personal_info.location && (
            <div className="flex items-center">
              <span className="font-semibold w-20">Location:</span>
              <span>{data.personal_info.location}</span>
            </div>
          )}
          {data.personal_info.linkedin && (
            <div className="flex items-center">
              <span className="font-semibold w-20">LinkedIn:</span>
              <span>{data.personal_info.linkedin}</span>
            </div>
          )}
        </div>
      </div>

      {/* Executive Summary */}
      {data.summary && (
        <div className="mb-8">
          <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-wide">
            Executive Summary
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">{data.summary}</p>
        </div>
      )}

      {/* Professional Experience */}
      {data.experience.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-wide">
            Professional Experience
          </h2>
          {data.experience.map((exp, idx) => (
            <div key={idx} className="mb-6">
              <div className="mb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{exp.position}</h3>
                    <p className="text-lg text-gray-700 mt-1">{exp.company}</p>
                  </div>
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">
                    {exp.start_date} - {exp.end_date || "Present"}
                  </span>
                </div>
              </div>
              {exp.description && (
                <p className="text-gray-700 mb-3 text-justify">{exp.description}</p>
              )}
              {exp.achievements && exp.achievements.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-semibold text-gray-800 mb-2">Key Achievements:</p>
                  <ul className="list-none space-y-2 text-gray-700">
                    {exp.achievements.map((achievement, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-red-600 mr-2">▪</span>
                        <span>{achievement}</span>
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
        <div className="mb-8">
          <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-wide">
            Education
          </h2>
          {data.education.map((edu, idx) => (
            <div key={idx} className="mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {edu.degree} {edu.field && `in ${edu.field}`}
                  </h3>
                  <p className="text-gray-700 mt-1">{edu.institution}</p>
                </div>
                <span className="text-sm text-gray-600">
                  {edu.start_date} - {edu.end_date}
                </span>
              </div>
              {edu.gpa && (
                <p className="text-sm text-gray-600 mt-1">Grade Point Average: {edu.gpa}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-8">
        {/* Core Competencies */}
        {data.skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-wide">
              Core Competencies
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {data.skills.map((skill, idx) => (
                <div key={idx} className="flex items-center">
                  <span className="w-2 h-2 bg-red-600 rounded-full mr-3"></span>
                  <span className="text-gray-700">{skill}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {data.languages.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-wide">
              Languages
            </h2>
            <div className="space-y-2">
              {data.languages.map((lang, idx) => (
                <div key={idx} className="flex items-center">
                  <span className="w-2 h-2 bg-red-600 rounded-full mr-3"></span>
                  <span className="text-gray-700">{lang}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Certifications */}
      {data.certifications.length > 0 && (
        <div>
          <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-wide">
            Professional Certifications
          </h2>
          {data.certifications.map((cert, idx) => (
            <div key={idx} className="mb-3">
              <h3 className="font-semibold text-gray-900">{cert.name}</h3>
              <p className="text-sm text-gray-600">
                {cert.issuer} • Issued {cert.date}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
