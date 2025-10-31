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

export default function ClassicTemplate({ data }: TemplateProps) {
  return (
    <div className="bg-white text-gray-900 p-8 shadow-lg min-h-[297mm] w-[210mm]">
      {/* Header - Centered Classic Style */}
      <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
          {data.personal_info.full_name || "Your Name"}
        </h1>
        <div className="text-sm text-gray-600 space-x-3">
          {data.personal_info.email && <span>{data.personal_info.email}</span>}
          {data.personal_info.phone && <span>•</span>}
          {data.personal_info.phone && <span>{data.personal_info.phone}</span>}
          {data.personal_info.location && <span>•</span>}
          {data.personal_info.location && <span>{data.personal_info.location}</span>}
        </div>
        {data.personal_info.linkedin && (
          <div className="text-sm text-gray-600 mt-1">{data.personal_info.linkedin}</div>
        )}
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-6">
          <h2 className="text-lg font-serif font-bold text-gray-900 mb-2 uppercase tracking-wide">
            Professional Summary
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-serif font-bold text-gray-900 mb-3 uppercase tracking-wide">
            Professional Experience
          </h2>
          {data.experience.map((exp, idx) => (
            <div key={idx} className="mb-4">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="font-bold text-gray-900">{exp.position}</h3>
                <span className="text-sm text-gray-600 italic">
                  {exp.start_date} - {exp.end_date || "Present"}
                </span>
              </div>
              <p className="text-gray-700 italic mb-2">{exp.company}</p>
              {exp.description && (
                <p className="text-gray-700 mb-2 text-justify">{exp.description}</p>
              )}
              {exp.achievements && exp.achievements.length > 0 && (
                <ul className="list-disc ml-5 text-gray-700 space-y-1">
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
          <h2 className="text-lg font-serif font-bold text-gray-900 mb-3 uppercase tracking-wide">
            Education
          </h2>
          {data.education.map((edu, idx) => (
            <div key={idx} className="mb-3">
              <div className="flex justify-between items-baseline">
                <div>
                  <h3 className="font-bold text-gray-900">
                    {edu.degree} {edu.field && `in ${edu.field}`}
                  </h3>
                  <p className="text-gray-700 italic">{edu.institution}</p>
                </div>
                <span className="text-sm text-gray-600">
                  {edu.start_date} - {edu.end_date}
                </span>
              </div>
              {edu.gpa && <p className="text-sm text-gray-600 mt-1">GPA: {edu.gpa}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-serif font-bold text-gray-900 mb-2 uppercase tracking-wide">
            Skills
          </h2>
          <p className="text-gray-700">{data.skills.join(" • ")}</p>
        </div>
      )}

      {/* Certifications */}
      {data.certifications.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-serif font-bold text-gray-900 mb-3 uppercase tracking-wide">
            Certifications
          </h2>
          {data.certifications.map((cert, idx) => (
            <div key={idx} className="mb-2">
              <h3 className="font-bold text-gray-900">{cert.name}</h3>
              <p className="text-sm text-gray-600 italic">
                {cert.issuer} - {cert.date}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Languages */}
      {data.languages.length > 0 && (
        <div>
          <h2 className="text-lg font-serif font-bold text-gray-900 mb-2 uppercase tracking-wide">
            Languages
          </h2>
          <p className="text-gray-700">{data.languages.join(" • ")}</p>
        </div>
      )}
    </div>
  );
}
