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
    <div className="bg-white text-gray-900 p-12 min-h-[297mm] w-[210mm] mx-auto">
      {/* Header - Elegant Classic Style */}
      <div className="text-center border-b border-t border-gray-800 py-6 mb-8">
        <h1 className="text-5xl font-serif font-bold text-gray-900 mb-3 tracking-wide">
          {data.personal_info.full_name || "Your Name"}
        </h1>
        <div className="text-sm text-gray-700 space-x-4 mt-3 font-medium">
          {data.personal_info.email && <span>{data.personal_info.email}</span>}
          {data.personal_info.phone && <span>│</span>}
          {data.personal_info.phone && <span>{data.personal_info.phone}</span>}
          {data.personal_info.location && <span>│</span>}
          {data.personal_info.location && <span>{data.personal_info.location}</span>}
        </div>
        {data.personal_info.linkedin && (
          <div className="text-sm text-gray-700 mt-2 font-medium">{data.personal_info.linkedin}</div>
        )}
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-8">
          <h2 className="text-xl font-serif font-bold text-gray-900 mb-3 uppercase tracking-wider border-b-2 border-gray-800 pb-2">
            Professional Summary
          </h2>
          <p className="text-gray-700 leading-loose text-justify font-serif text-base">{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-serif font-bold text-gray-900 mb-4 uppercase tracking-wider border-b-2 border-gray-800 pb-2">
            Professional Experience
          </h2>
          {data.experience.map((exp, idx) => (
            <div key={idx} className="mb-6">
              <div className="flex justify-between items-baseline mb-2">
                <h3 className="font-bold text-gray-900 text-lg font-serif">{exp.position}</h3>
                <span className="text-sm text-gray-600 italic font-serif">
                  {exp.start_date} – {exp.end_date || "Present"}
                </span>
              </div>
              <p className="text-gray-800 italic mb-3 font-serif font-semibold">{exp.company}</p>
              {exp.description && (
                <p className="text-gray-700 mb-3 text-justify leading-relaxed">{exp.description}</p>
              )}
              {exp.achievements && exp.achievements.length > 0 && (
                <ul className="list-disc ml-6 text-gray-700 space-y-2">
                  {exp.achievements.map((achievement, i) => (
                    <li key={i} className="leading-relaxed">{achievement}</li>
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
          <h2 className="text-xl font-serif font-bold text-gray-900 mb-4 uppercase tracking-wider border-b-2 border-gray-800 pb-2">
            Education
          </h2>
          {data.education.map((edu, idx) => (
            <div key={idx} className="mb-4">
              <div className="flex justify-between items-baseline">
                <div>
                  <h3 className="font-bold text-gray-900 font-serif text-lg">
                    {edu.degree} {edu.field && `in ${edu.field}`}
                  </h3>
                  <p className="text-gray-800 italic font-serif">{edu.institution}</p>
                </div>
                <span className="text-sm text-gray-600 font-serif italic">
                  {edu.start_date} – {edu.end_date}
                </span>
              </div>
              {edu.gpa && <p className="text-sm text-gray-700 mt-1 font-serif">Grade Point Average: {edu.gpa}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-serif font-bold text-gray-900 mb-3 uppercase tracking-wider border-b-2 border-gray-800 pb-2">
            Core Competencies
          </h2>
          <p className="text-gray-700 font-serif leading-loose">{data.skills.join(" │ ")}</p>
        </div>
      )}

      {/* Certifications */}
      {data.certifications.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-serif font-bold text-gray-900 mb-4 uppercase tracking-wider border-b-2 border-gray-800 pb-2">
            Professional Certifications
          </h2>
          {data.certifications.map((cert, idx) => (
            <div key={idx} className="mb-3">
              <h3 className="font-bold text-gray-900 font-serif text-lg">{cert.name}</h3>
              <p className="text-sm text-gray-700 italic font-serif">
                {cert.issuer} – {cert.date}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Languages */}
      {data.languages.length > 0 && (
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-900 mb-3 uppercase tracking-wider border-b-2 border-gray-800 pb-2">
            Languages
          </h2>
          <p className="text-gray-700 font-serif leading-loose">{data.languages.join(" │ ")}</p>
        </div>
      )}
    </div>
  );
}
