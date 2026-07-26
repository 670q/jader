import React from 'react';
import { 
  User, Briefcase, GraduationCap, Code, FileText, Globe, Mail, Phone, MapPin, Award, CheckCircle2, Star, Sparkles, Terminal, Shield, Zap
} from 'lucide-react';

// Helper for skills array formatting
const parseSkills = (skillsStr) => {
  if (!skillsStr) return [];
  if (Array.isArray(skillsStr)) return skillsStr;
  return skillsStr.split(/[,،\n]/).map(s => s.trim()).filter(Boolean);
};

// --- 1. Harvard Academic Template ---
export function HarvardTemplate({ userData, generatedResult, isEn, font, fontSizeDelta = 0 }) {
  const p = generatedResult?.translatedPersonalInfo || userData.personalInfo;
  const summary = generatedResult?.tailoredSummary || userData.summary;
  const skills = parseSkills(userData.skills);

  return (
    <div className="p-8 md:p-10 bg-white text-gray-900 min-h-[297mm] flex flex-col justify-start" style={{ fontFamily: font, zoom: Math.max(0.7, 1 + fontSizeDelta * 0.07) }}>
      {/* Header */}
      <div className="text-center border-b-2 border-gray-900 pb-4 mb-4">
        <h1 className="text-2xl font-bold tracking-tight uppercase mb-1">{p.fullName || 'الاسم الكامل'}</h1>
        <p className="text-sm font-semibold text-gray-700 mb-2">{p.title || 'المسمى الوظيفي'}</p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600">
          {p.email && <span>{p.email}</span>}
          {p.phone && <span>• {p.phone}</span>}
          {p.location && <span>• {p.location}</span>}
        </div>
      </div>

      {/* Main Content Space-Y-4 */}
      <div className="space-y-5 flex-1 flex flex-col justify-start py-2">
        {/* Summary */}
        {summary && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-gray-400 pb-1 mb-2 text-gray-900">
              {isEn ? 'Professional Summary' : 'الملخص المهني'}
            </h2>
            <p className="text-xs text-gray-800 leading-relaxed">{summary}</p>
          </div>
        )}

        {/* Experiences */}
        {userData.experiences?.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-gray-400 pb-1 mb-2 text-gray-900">
              {isEn ? 'Work Experience' : 'الخبرات العملية'}
            </h2>
            <div className="space-y-3.5">
              {userData.experiences.map((exp, idx) => (
                <div key={idx} className="text-xs">
                  <div className="flex justify-between font-bold text-gray-900 mb-0.5">
                    <span>{exp.role} {exp.company && `- ${exp.company}`}</span>
                    <span className="text-gray-600 font-normal">{exp.startDate} {exp.endDate && `- ${exp.endDate}`}</span>
                  </div>
                  {exp.description && (
                    <p className="text-gray-700 mt-1 leading-relaxed whitespace-pre-line">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {userData.education?.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-gray-400 pb-1 mb-2 text-gray-900">
              {isEn ? 'Education' : 'التعليم والمؤهلات'}
            </h2>
            <div className="space-y-2">
              {userData.education.map((edu, idx) => (
                <div key={idx} className="flex justify-between text-xs font-bold">
                  <span>{edu.degree} {edu.institution && `| ${edu.institution}`}</span>
                  <span className="text-gray-600 font-normal">{edu.year}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-gray-400 pb-1 mb-2 text-gray-900">
              {isEn ? 'Skills & Competencies' : 'المهارات والكفاءات'}
            </h2>
            <div className="flex flex-wrap gap-1.5 text-xs text-gray-800 leading-snug">
              {skills.map((skill, idx) => (
                <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200 font-semibold">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 2. Tech & Software Engineer Template ---
export function TechTemplate({ userData, generatedResult, isEn, font, fontSizeDelta = 0 }) {
  const p = generatedResult?.translatedPersonalInfo || userData.personalInfo;
  const summary = generatedResult?.tailoredSummary || userData.summary;
  const skills = parseSkills(userData.skills);

  return (
    <div className="p-8 md:p-10 bg-slate-900 text-slate-100 min-h-[297mm] flex flex-col justify-start" style={{ fontFamily: font, zoom: Math.max(0.7, 1 + fontSizeDelta * 0.07) }}>
      {/* Header */}
      <div className="border-b border-slate-700 pb-4 mb-4 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h1 className="text-2xl font-black text-white">{p.fullName || 'الاسم الكامل'}</h1>
          </div>
          <p className="text-xs font-mono text-emerald-400 font-bold">{p.title || 'Software Engineer'}</p>
        </div>
        <div className="text-right text-[11px] font-mono text-slate-400 space-y-1">
          {p.email && <div>{p.email}</div>}
          {p.phone && <div>{p.phone}</div>}
          {p.location && <div>{p.location}</div>}
        </div>
      </div>

      <div className="space-y-5 flex-1 flex flex-col justify-start py-2">
        {/* Summary */}
        {summary && (
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
            <span className="text-[10px] font-mono text-emerald-400 block mb-1 font-bold">const summary =</span>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{summary}</p>
          </div>
        )}

        {/* Experience */}
        {userData.experiences?.length > 0 && (
          <div>
            <h2 className="text-xs font-mono text-emerald-400 uppercase font-bold tracking-widest mb-3 flex items-center gap-1.5">
              <Code className="w-4 h-4" />
              {isEn ? '// WORK_EXPERIENCE' : '// الخبرات_العملية'}
            </h2>
            <div className="space-y-4">
              {userData.experiences.map((exp, idx) => (
                <div key={idx} className="border-l-2 border-emerald-500/40 pl-3 pr-1 py-0.5">
                  <div className="flex justify-between items-baseline text-xs mb-1">
                    <span className="font-bold text-white text-sm">{exp.role} <span className="text-emerald-400 font-mono text-xs">@{exp.company}</span></span>
                    <span className="text-[10px] font-mono text-slate-400">{exp.startDate} - {exp.endDate}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills Tag Pills */}
        {skills.length > 0 && (
          <div>
            <h2 className="text-xs font-mono text-emerald-400 uppercase font-bold tracking-widest mb-2">
              {isEn ? '// TECH_STACK' : '// المهارات_والتقنيات'}
            </h2>
            <div className="flex flex-wrap gap-2 text-xs">
              {skills.map((skill, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 rounded-lg font-mono text-[11px]">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {userData.education?.length > 0 && (
          <div>
            <h2 className="text-xs font-mono text-emerald-400 uppercase font-bold tracking-widest mb-2">
              {isEn ? '// EDUCATION' : '// المؤهلات'}
            </h2>
            <div className="space-y-1.5 text-xs">
              {userData.education.map((edu, idx) => (
                <div key={idx} className="flex justify-between text-slate-300">
                  <span className="font-semibold text-white">{edu.degree} - {edu.institution}</span>
                  <span className="font-mono text-slate-400 text-[11px]">{edu.year}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 3. Executive Leadership Template ---
export function ExecutiveTemplate({ userData, generatedResult, isEn, font, fontSizeDelta = 0 }) {
  const p = generatedResult?.translatedPersonalInfo || userData.personalInfo;
  const summary = generatedResult?.tailoredSummary || userData.summary;
  const skills = parseSkills(userData.skills);

  return (
    <div className="p-8 md:p-10 bg-slate-50 text-slate-900 min-h-[297mm] flex flex-col justify-start" style={{ fontFamily: font, zoom: Math.max(0.7, 1 + fontSizeDelta * 0.07) }}>
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl mb-4 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">{p.fullName || 'الاسم الكامل'}</h1>
          <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">{p.title || 'Executive Leader'}</p>
        </div>
        <div className="text-left text-xs text-slate-300 space-y-1">
          {p.email && <div>{p.email}</div>}
          {p.phone && <div>{p.phone}</div>}
          {p.location && <div>{p.location}</div>}
        </div>
      </div>

      <div className="space-y-5 flex-1 flex flex-col justify-start py-2">
        {/* Executive Summary */}
        {summary && (
          <div className="border-r-4 border-amber-500 pr-4 pl-2 py-2 bg-amber-50/50 rounded-l-xl">
            <h2 className="text-xs font-bold text-amber-900 uppercase tracking-widest mb-1">{isEn ? 'Executive Summary' : 'الملخص التنفيذي'}</h2>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">{summary}</p>
          </div>
        )}

        {/* Experience */}
        {userData.experiences?.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-3">
              {isEn ? 'Leadership & Work History' : 'الخبرات والمسيرة القيادية'}
            </h2>
            <div className="space-y-4">
              {userData.experiences.map((exp, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-900 mb-1">
                    <span className="text-sm font-extrabold text-slate-900">{exp.role} <span className="text-amber-700">| {exp.company}</span></span>
                    <span className="text-[11px] text-slate-500 font-semibold">{exp.startDate} - {exp.endDate}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills Badges */}
        {skills.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-2">
              {isEn ? 'Core Competencies' : 'الكفاءات المحورية'}
            </h2>
            <div className="flex flex-wrap gap-2 text-xs">
              {skills.map((skill, idx) => (
                <span key={idx} className="px-3 py-1 bg-slate-900 text-amber-300 font-bold rounded-lg text-[11px]">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {userData.education?.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-2">
              {isEn ? 'Education & Credentials' : 'التعليم والشهادات'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {userData.education.map((edu, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between font-bold text-slate-800">
                  <span>{edu.degree} - {edu.institution}</span>
                  <span className="text-slate-500 font-normal">{edu.year}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 4. Nordic Minimalist Template ---
export function NordicTemplate({ userData, generatedResult, isEn, font, fontSizeDelta = 0 }) {
  const p = generatedResult?.translatedPersonalInfo || userData.personalInfo;
  const summary = generatedResult?.tailoredSummary || userData.summary;
  const skills = parseSkills(userData.skills);

  return (
    <div className="p-8 md:p-12 bg-[#FDFBF7] text-stone-800 min-h-[297mm] flex flex-col justify-start" style={{ fontFamily: font, zoom: Math.max(0.7, 1 + fontSizeDelta * 0.07) }}>
      {/* Header */}
      <div className="border-b border-stone-300 pb-4 mb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-light text-stone-900 tracking-wide">{p.fullName || 'الاسم الكامل'}</h1>
          <p className="text-xs font-medium text-stone-500 tracking-widest uppercase mt-1">{p.title || 'المسمى الوظيفي'}</p>
        </div>
        <div className="text-xs text-stone-500 space-y-0.5 text-right font-light">
          {p.email && <div>{p.email}</div>}
          {p.phone && <div>{p.phone}</div>}
          {p.location && <div>{p.location}</div>}
        </div>
      </div>

      <div className="space-y-5 flex-1 flex flex-col justify-start py-2">
        {/* Summary */}
        {summary && (
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-1.5">{isEn ? 'About' : 'نبذة'}</h2>
            <p className="text-xs text-stone-700 leading-relaxed font-light">{summary}</p>
          </div>
        )}

        {/* Experience */}
        {userData.experiences?.length > 0 && (
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-3">{isEn ? 'Experience' : 'الخبرات'}</h2>
            <div className="space-y-4">
              {userData.experiences.map((exp, idx) => (
                <div key={idx} className="text-xs border-b border-stone-200/60 pb-3 last:border-0">
                  <div className="flex justify-between font-normal text-stone-900 mb-1">
                    <span className="font-medium text-sm">{exp.role} <span className="text-stone-500">/ {exp.company}</span></span>
                    <span className="text-[11px] text-stone-400 font-light">{exp.startDate} — {exp.endDate}</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed font-light">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-2">{isEn ? 'Skills' : 'المهارات'}</h2>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {skills.map((skill, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-stone-200/50 text-stone-700 rounded text-[11px]">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {userData.education?.length > 0 && (
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-2">{isEn ? 'Education' : 'التعليم'}</h2>
            <div className="space-y-1.5 text-xs font-light">
              {userData.education.map((edu, idx) => (
                <div key={idx} className="flex justify-between text-stone-700">
                  <span>{edu.degree} — {edu.institution}</span>
                  <span className="text-stone-400 text-[11px]">{edu.year}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 5. Sales & Growth Template ---
export function SalesTemplate({ userData, generatedResult, isEn, font, fontSizeDelta = 0 }) {
  const p = generatedResult?.translatedPersonalInfo || userData.personalInfo;
  const summary = generatedResult?.tailoredSummary || userData.summary;
  const skills = parseSkills(userData.skills);

  return (
    <div className="p-8 md:p-10 bg-white text-gray-900 min-h-[297mm] flex flex-col justify-start" style={{ fontFamily: font, zoom: Math.max(0.7, 1 + fontSizeDelta * 0.07) }}>
      {/* Header */}
      <div className="border-b-4 border-emerald-600 pb-4 mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{p.fullName || 'الاسم الكامل'}</h1>
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{p.title || 'Sales & Growth Specialist'}</p>
        </div>
        <div className="text-xs text-gray-600 text-right space-y-0.5">
          {p.email && <div>{p.email}</div>}
          {p.phone && <div>{p.phone}</div>}
          {p.location && <div>{p.location}</div>}
        </div>
      </div>

      <div className="space-y-5 flex-1 flex flex-col justify-start py-2">
        {/* Summary */}
        {summary && (
          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
            <h2 className="text-xs font-extrabold text-emerald-800 uppercase mb-1">{isEn ? 'Professional Impact' : 'ملخص الإنجازات والأثر'}</h2>
            <p className="text-xs text-gray-800 leading-relaxed font-medium">{summary}</p>
          </div>
        )}

        {/* Experience */}
        {userData.experiences?.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase text-gray-900 border-b-2 border-gray-200 pb-1 mb-3">
              {isEn ? 'Track Record & Experience' : 'سجل الخبرات والنتائج'}
            </h2>
            <div className="space-y-4">
              {userData.experiences.map((exp, idx) => (
                <div key={idx} className="bg-gray-50/80 p-4 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-900 mb-1">
                    <span className="text-sm font-extrabold">{exp.role} <span className="text-emerald-600">({exp.company})</span></span>
                    <span className="text-[11px] text-gray-500 font-semibold">{exp.startDate} - {exp.endDate}</span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase text-gray-900 border-b-2 border-gray-200 pb-1 mb-2">
              {isEn ? 'Core Skills & KPIs' : 'المهارات ومؤشرات الأداء'}
            </h2>
            <div className="flex flex-wrap gap-2 text-xs">
              {skills.map((skill, idx) => (
                <span key={idx} className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[11px] shadow-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {userData.education?.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase text-gray-900 border-b-2 border-gray-200 pb-1 mb-2">
              {isEn ? 'Education' : 'التعليم'}
            </h2>
            <div className="space-y-1.5 text-xs font-bold">
              {userData.education.map((edu, idx) => (
                <div key={idx} className="flex justify-between text-gray-800">
                  <span>{edu.degree} - {edu.institution}</span>
                  <span className="text-gray-500 font-normal">{edu.year}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 6. Medical & Healthcare Template ---
export function MedicalTemplate({ userData, generatedResult, isEn, font, fontSizeDelta = 0 }) {
  const p = generatedResult?.translatedPersonalInfo || userData.personalInfo;
  const summary = generatedResult?.tailoredSummary || userData.summary;
  const skills = parseSkills(userData.skills);

  return (
    <div className="p-8 md:p-10 bg-white text-slate-900 min-h-[297mm] flex flex-col justify-start" style={{ fontFamily: font, zoom: Math.max(0.7, 1 + fontSizeDelta * 0.07) }}>
      {/* Header Banner */}
      <div className="bg-teal-700 text-white p-6 rounded-2xl mb-4 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{p.fullName || 'الاسم الكامل'}</h1>
          <p className="text-xs font-semibold text-teal-200 uppercase tracking-wider">{p.title || 'Medical Professional'}</p>
        </div>
        <div className="text-xs text-teal-100 text-right space-y-1 font-sans">
          {p.email && <div>{p.email}</div>}
          {p.phone && <div>{p.phone}</div>}
          {p.location && <div>{p.location}</div>}
        </div>
      </div>

      <div className="space-y-5 flex-1 flex flex-col justify-start py-2">
        {/* Summary */}
        {summary && (
          <div>
            <h2 className="text-xs font-bold uppercase text-teal-800 border-b border-teal-200 pb-1 mb-2">{isEn ? 'Clinical Background' : 'الخلفية الطبية والمهنية'}</h2>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">{summary}</p>
          </div>
        )}

        {/* Experience */}
        {userData.experiences?.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase text-teal-800 border-b border-teal-200 pb-1 mb-3">
              {isEn ? 'Clinical Experience & Practice' : 'الخبرة والممارسة الميدانية'}
            </h2>
            <div className="space-y-4">
              {userData.experiences.map((exp, idx) => (
                <div key={idx} className="border-r-2 border-teal-600 pr-3.5 py-0.5">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-900 mb-1">
                    <span>{exp.role} - <span className="text-teal-700">{exp.company}</span></span>
                    <span className="text-[11px] text-slate-500 font-normal">{exp.startDate} - {exp.endDate}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education & Licenses */}
        {userData.education?.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase text-teal-800 border-b border-teal-200 pb-1 mb-2">
              {isEn ? 'Education & Board Certification' : 'المؤهلات والتراخيص الطبية'}
            </h2>
            <div className="space-y-1.5 text-xs">
              {userData.education.map((edu, idx) => (
                <div key={idx} className="flex justify-between font-semibold text-slate-800">
                  <span>{edu.degree} | {edu.institution}</span>
                  <span className="text-slate-500 font-normal">{edu.year}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase text-teal-800 border-b border-teal-200 pb-1 mb-2">
              {isEn ? 'Clinical Skills & Certifications' : 'المهارات والشهادات'}
            </h2>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {skills.map((skill, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg text-[11px] font-semibold">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 7. Fresh Graduate / Entry Level Template ---
export function FreshGradTemplate({ userData, generatedResult, isEn, font, fontSizeDelta = 0 }) {
  const p = generatedResult?.translatedPersonalInfo || userData.personalInfo;
  const summary = generatedResult?.tailoredSummary || userData.summary;
  const skills = parseSkills(userData.skills);

  return (
    <div className="p-8 md:p-10 bg-white text-gray-900 min-h-[297mm] flex flex-col justify-start" style={{ fontFamily: font, zoom: Math.max(0.7, 1 + fontSizeDelta * 0.07) }}>
      {/* Header */}
      <div className="text-center border-b-2 border-indigo-600 pb-4 mb-4">
        <h1 className="text-2xl font-extrabold text-indigo-900">{p.fullName || 'الاسم الكامل'}</h1>
        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mt-1">{p.title || 'حديث تخرج'}</p>
        <div className="flex justify-center gap-3 text-xs text-gray-600 mt-2 font-medium">
          {p.email && <span>{p.email}</span>}
          {p.phone && <span>• {p.phone}</span>}
          {p.location && <span>• {p.location}</span>}
        </div>
      </div>

      <div className="space-y-5 flex-1 flex flex-col justify-start py-2">
        {/* Education Prioritized */}
        {userData.education?.length > 0 && (
          <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100">
            <h2 className="text-xs font-black uppercase text-indigo-900 mb-2">{isEn ? 'Education & Academic Record' : 'التعليم والتحصيل الأكاديمي'}</h2>
            <div className="space-y-2 text-xs">
              {userData.education.map((edu, idx) => (
                <div key={idx} className="flex justify-between font-bold text-gray-900">
                  <div>
                    <span className="text-indigo-900 block">{edu.degree}</span>
                    <span className="text-gray-600 font-normal block text-[11px]">{edu.institution}</span>
                  </div>
                  <span className="text-indigo-600">{edu.year}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div>
            <h2 className="text-xs font-black uppercase text-indigo-900 border-b border-indigo-200 pb-1 mb-2">{isEn ? 'Career Objective' : 'الهدف المهني والملخص'}</h2>
            <p className="text-xs text-gray-700 leading-relaxed font-medium">{summary}</p>
          </div>
        )}

        {/* Experience / Projects */}
        {userData.experiences?.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase text-indigo-900 border-b border-indigo-200 pb-1 mb-3">
              {isEn ? 'Projects & Internships' : 'المشاريع والتدريب الميداني'}
            </h2>
            <div className="space-y-3.5">
              {userData.experiences.map((exp, idx) => (
                <div key={idx} className="text-xs">
                  <div className="flex justify-between font-bold text-gray-900 mb-1">
                    <span>{exp.role} - <span className="text-indigo-600">{exp.company}</span></span>
                    <span className="text-[11px] text-gray-500 font-normal">{exp.startDate} - {exp.endDate}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase text-indigo-900 border-b border-indigo-200 pb-1 mb-2">
              {isEn ? 'Skills & Competencies' : 'المهارات والمواهب'}
            </h2>
            <div className="flex flex-wrap gap-2 text-xs">
              {skills.map((skill, idx) => (
                <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-800 font-semibold rounded-lg text-[11px]">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 8. Swiss Grid Architecture Template ---
export function SwissGridTemplate({ userData, generatedResult, isEn, font, fontSizeDelta = 0 }) {
  const p = generatedResult?.translatedPersonalInfo || userData.personalInfo;
  const summary = generatedResult?.tailoredSummary || userData.summary;
  const skills = parseSkills(userData.skills);

  return (
    <div className="p-8 md:p-10 bg-neutral-900 text-neutral-100 min-h-[297mm] flex flex-col justify-start" style={{ fontFamily: font, zoom: Math.max(0.7, 1 + fontSizeDelta * 0.07) }}>
      {/* Header Grid */}
      <div className="grid grid-cols-3 border-b-2 border-neutral-700 pb-4 mb-4">
        <div className="col-span-2">
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">{p.fullName || 'الاسم الكامل'}</h1>
          <p className="text-xs font-mono text-neutral-400 tracking-widest uppercase mt-1">{p.title || 'المسمى الوظيفي'}</p>
        </div>
        <div className="text-right text-xs font-mono text-neutral-400 space-y-1">
          {p.email && <div>{p.email}</div>}
          {p.phone && <div>{p.phone}</div>}
          {p.location && <div>{p.location}</div>}
        </div>
      </div>

      <div className="space-y-5 flex-1 flex flex-col justify-start py-2">
        {/* Summary */}
        {summary && (
          <div>
            <h2 className="text-[11px] font-mono uppercase text-neutral-500 tracking-widest mb-1.5">{isEn ? '// PROFILE' : '// نبذة'}</h2>
            <p className="text-xs text-neutral-300 leading-relaxed font-light">{summary}</p>
          </div>
        )}

        {/* Experience */}
        {userData.experiences?.length > 0 && (
          <div>
            <h2 className="text-[11px] font-mono uppercase text-neutral-500 tracking-widest mb-3">{isEn ? '// EXPERIENCE' : '// الخبرات'}</h2>
            <div className="space-y-4">
              {userData.experiences.map((exp, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-4 text-xs border-b border-neutral-800 pb-3">
                  <div className="font-mono text-neutral-400 text-[11px]">
                    {exp.startDate} — {exp.endDate}
                  </div>
                  <div className="col-span-3">
                    <div className="font-bold text-white text-sm mb-1">{exp.role} <span className="text-neutral-400 font-normal">/ {exp.company}</span></div>
                    <p className="text-xs text-neutral-300 leading-relaxed">{exp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <h2 className="text-[11px] font-mono uppercase text-neutral-500 tracking-widest mb-2">{isEn ? '// SKILLS' : '// المهارات'}</h2>
            <div className="flex flex-wrap gap-2 text-xs">
              {skills.map((skill, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-neutral-800 text-neutral-200 border border-neutral-700 font-mono text-[11px]">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {userData.education?.length > 0 && (
          <div>
            <h2 className="text-[11px] font-mono uppercase text-neutral-500 tracking-widest mb-2">{isEn ? '// EDUCATION' : '// التعليم'}</h2>
            <div className="space-y-2 text-xs">
              {userData.education.map((edu, idx) => (
                <div key={idx} className="flex justify-between text-neutral-300 font-mono">
                  <span>{edu.degree} — {edu.institution}</span>
                  <span className="text-neutral-500">{edu.year}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 9. Designer Portfolio Template ---
export function DesignerTemplate({ userData, generatedResult, isEn, font, fontSizeDelta = 0 }) {
  const p = generatedResult?.translatedPersonalInfo || userData.personalInfo;
  const summary = generatedResult?.tailoredSummary || userData.summary;
  const skills = parseSkills(userData.skills);

  return (
    <div className="p-8 md:p-10 bg-slate-900 text-white min-h-[297mm] flex flex-col justify-start" style={{ fontFamily: font, zoom: Math.max(0.7, 1 + fontSizeDelta * 0.07) }}>
      {/* Header Gradient */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 p-6 rounded-2xl mb-4 text-white shadow-lg">
        <h1 className="text-2xl font-black tracking-tight">{p.fullName || 'الاسم الكامل'}</h1>
        <p className="text-xs font-bold text-pink-200 uppercase tracking-widest mt-1">{p.title || 'Creative Designer'}</p>
        <div className="flex flex-wrap gap-3 text-xs text-purple-100 mt-3 font-medium">
          {p.email && <span>{p.email}</span>}
          {p.phone && <span>• {p.phone}</span>}
          {p.location && <span>• {p.location}</span>}
        </div>
      </div>

      <div className="space-y-5 flex-1 flex flex-col justify-start py-2">
        {/* Summary */}
        {summary && (
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80">
            <h2 className="text-xs font-bold text-pink-400 uppercase tracking-wider mb-1">{isEn ? 'Creative Bio' : 'نبذة إبداعية'}</h2>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">{summary}</p>
          </div>
        )}

        {/* Experience */}
        {userData.experiences?.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase text-pink-400 border-b border-slate-700 pb-1 mb-3">
              {isEn ? 'Experience & Projects' : 'الخبرات والمشاريع الإبداعية'}
            </h2>
            <div className="space-y-4">
              {userData.experiences.map((exp, idx) => (
                <div key={idx} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                  <div className="flex justify-between items-center text-xs font-bold text-white mb-1">
                    <span className="text-sm font-extrabold">{exp.role} <span className="text-purple-400">@ {exp.company}</span></span>
                    <span className="text-[11px] text-slate-400 font-normal">{exp.startDate} - {exp.endDate}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase text-pink-400 border-b border-slate-700 pb-1 mb-2">
              {isEn ? 'Design Skills & Tools' : 'المهارات والأدوات'}
            </h2>
            <div className="flex flex-wrap gap-2 text-xs">
              {skills.map((skill, idx) => (
                <span key={idx} className="px-3 py-1 bg-gradient-to-r from-purple-900/60 to-pink-900/60 text-purple-200 border border-purple-500/30 rounded-lg font-bold text-[11px]">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {userData.education?.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase text-pink-400 border-b border-slate-700 pb-1 mb-2">
              {isEn ? 'Education' : 'التعليم'}
            </h2>
            <div className="space-y-1 text-xs">
              {userData.education.map((edu, idx) => (
                <div key={idx} className="flex justify-between text-slate-200 font-semibold">
                  <span>{edu.degree} - {edu.institution}</span>
                  <span className="text-slate-400 font-normal">{edu.year}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 10. Legal & Advisory Template ---
export function LegalTemplate({ userData, generatedResult, isEn, font, fontSizeDelta = 0 }) {
  const p = generatedResult?.translatedPersonalInfo || userData.personalInfo;
  const summary = generatedResult?.tailoredSummary || userData.summary;
  const skills = parseSkills(userData.skills);

  return (
    <div className="p-8 md:p-10 bg-white text-gray-900 min-h-[297mm] flex flex-col justify-start" style={{ fontFamily: font, zoom: Math.max(0.7, 1 + fontSizeDelta * 0.07) }}>
      {/* Header */}
      <div className="text-center border-b-4 border-yellow-800 pb-4 mb-4">
        <h1 className="text-2xl font-serif font-bold text-gray-900">{p.fullName || 'الاسم الكامل'}</h1>
        <p className="text-xs font-serif italic text-yellow-800 font-bold mt-1">{p.title || 'مستشار قانوني'}</p>
        <div className="flex justify-center gap-3 text-xs text-gray-600 mt-2 font-serif">
          {p.email && <span>{p.email}</span>}
          {p.phone && <span>• {p.phone}</span>}
          {p.location && <span>• {p.location}</span>}
        </div>
      </div>

      <div className="space-y-5 flex-1 flex flex-col justify-start py-2">
        {/* Summary */}
        {summary && (
          <div>
            <h2 className="text-xs font-serif font-bold uppercase text-yellow-900 border-b border-gray-300 pb-1 mb-2">{isEn ? 'Legal Profile' : 'اللمحة القانونية والاستشارية'}</h2>
            <p className="text-xs text-gray-800 leading-relaxed font-serif">{summary}</p>
          </div>
        )}

        {/* Experience */}
        {userData.experiences?.length > 0 && (
          <div>
            <h2 className="text-xs font-serif font-bold uppercase text-yellow-900 border-b border-gray-300 pb-1 mb-3">
              {isEn ? 'Legal Practice & Experience' : 'الممارسة والخبرات القانونية'}
            </h2>
            <div className="space-y-3.5">
              {userData.experiences.map((exp, idx) => (
                <div key={idx} className="text-xs font-serif">
                  <div className="flex justify-between font-bold text-gray-900 mb-1">
                    <span>{exp.role} | <span className="text-yellow-900">{exp.company}</span></span>
                    <span className="text-[11px] text-gray-500 font-normal">{exp.startDate} - {exp.endDate}</span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {userData.education?.length > 0 && (
          <div>
            <h2 className="text-xs font-serif font-bold uppercase text-yellow-900 border-b border-gray-300 pb-1 mb-2">
              {isEn ? 'Education & Bar Qualifications' : 'المؤهلات وتراخيص المحاماة'}
            </h2>
            <div className="space-y-1.5 text-xs font-serif">
              {userData.education.map((edu, idx) => (
                <div key={idx} className="flex justify-between font-bold text-gray-900">
                  <span>{edu.degree} - {edu.institution}</span>
                  <span className="text-gray-500 font-normal">{edu.year}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <h2 className="text-xs font-serif font-bold uppercase text-yellow-900 border-b border-gray-300 pb-1 mb-2">
              {isEn ? 'Specializations & Skills' : 'التخصصات والمهارات'}
            </h2>
            <div className="flex flex-wrap gap-1.5 text-xs font-serif">
              {skills.map((skill, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-yellow-50 text-yellow-950 border border-yellow-200 rounded text-[11px] font-bold">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 11. Startup Founder Template ---
export function StartupTemplate({ userData, generatedResult, isEn, font, fontSizeDelta = 0 }) {
  const p = generatedResult?.translatedPersonalInfo || userData.personalInfo;
  const summary = generatedResult?.tailoredSummary || userData.summary;
  const skills = parseSkills(userData.skills);

  return (
    <div className="p-8 md:p-10 bg-slate-950 text-white min-h-[297mm] flex flex-col justify-start" style={{ fontFamily: font, zoom: Math.max(0.7, 1 + fontSizeDelta * 0.07) }}>
      {/* Header */}
      <div className="border-b border-cyan-500/40 pb-4 mb-4 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h1 className="text-2xl font-black text-white">{p.fullName || 'الاسم الكامل'}</h1>
          </div>
          <p className="text-xs font-mono font-bold text-cyan-400 uppercase mt-1">{p.title || 'Startup Founder'}</p>
        </div>
        <div className="text-xs font-mono text-slate-400 text-right space-y-0.5">
          {p.email && <div>{p.email}</div>}
          {p.phone && <div>{p.phone}</div>}
          {p.location && <div>{p.location}</div>}
        </div>
      </div>

      <div className="space-y-5 flex-1 flex flex-col justify-start py-2">
        {/* Summary */}
        {summary && (
          <div className="bg-slate-900 p-4 rounded-xl border border-cyan-500/30">
            <h2 className="text-xs font-mono font-bold text-cyan-400 uppercase mb-1">{isEn ? '// VISION' : '// الرؤية والأثر'}</h2>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{summary}</p>
          </div>
        )}

        {/* Experience */}
        {userData.experiences?.length > 0 && (
          <div>
            <h2 className="text-xs font-mono font-bold uppercase text-cyan-400 border-b border-slate-800 pb-1 mb-3">
              {isEn ? '// VENTURES & EXPERIENCE' : '// المشاريع والخبرات الريادية'}
            </h2>
            <div className="space-y-3.5">
              {userData.experiences.map((exp, idx) => (
                <div key={idx} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center text-xs font-bold text-white mb-1">
                    <span className="text-sm font-black">{exp.role} <span className="text-cyan-400">({exp.company})</span></span>
                    <span className="text-[11px] font-mono text-slate-400 font-normal">{exp.startDate} - {exp.endDate}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <h2 className="text-xs font-mono font-bold uppercase text-cyan-400 border-b border-slate-800 pb-1 mb-2">
              {isEn ? '// SKILLS & TOOLS' : '// المهارات والأدوات'}
            </h2>
            <div className="flex flex-wrap gap-2 text-xs">
              {skills.map((skill, idx) => (
                <span key={idx} className="px-3 py-1 bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-mono rounded-lg text-[11px] font-bold">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {userData.education?.length > 0 && (
          <div>
            <h2 className="text-xs font-mono font-bold uppercase text-cyan-400 border-b border-slate-800 pb-1 mb-2">
              {isEn ? '// EDUCATION' : '// التعليم'}
            </h2>
            <div className="space-y-1 text-xs font-mono">
              {userData.education.map((edu, idx) => (
                <div key={idx} className="flex justify-between text-slate-300">
                  <span>{edu.degree} - {edu.institution}</span>
                  <span className="text-slate-500">{edu.year}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 12. Compact Single-Page Specialist Template ---
export function CompactOnePageTemplate({ userData, generatedResult, isEn, font, fontSizeDelta = 0 }) {
  const p = generatedResult?.translatedPersonalInfo || userData.personalInfo;
  const summary = generatedResult?.tailoredSummary || userData.summary;
  const skills = parseSkills(userData.skills);

  return (
    <div className="p-6 md:p-8 bg-white text-gray-900 min-h-[297mm] flex flex-col justify-start overflow-hidden" style={{ fontFamily: font, zoom: Math.max(0.7, 1 + fontSizeDelta * 0.07) }}>
      {/* Header */}
      <div className="border-b-2 border-gray-900 pb-3 mb-3 flex justify-between items-baseline">
        <div>
          <h1 className="text-xl font-black text-gray-900">{p.fullName || 'الاسم الكامل'}</h1>
          <p className="text-xs font-bold text-gray-700">{p.title || 'المسمى الوظيفي'}</p>
        </div>
        <div className="text-[10px] text-gray-600 text-right space-x-2 space-x-reverse font-semibold">
          {p.email && <span>{p.email}</span>}
          {p.phone && <span>• {p.phone}</span>}
          {p.location && <span>• {p.location}</span>}
        </div>
      </div>

      <div className="space-y-3 flex-1 flex flex-col justify-between py-1 overflow-hidden">
        {/* Compact Summary */}
        {summary && (
          <div>
            <h2 className="text-[10px] font-black uppercase text-gray-900 border-b border-gray-300 pb-0.5 mb-1">{isEn ? 'Summary' : 'الملخص'}</h2>
            <p className="text-[11px] text-gray-800 leading-normal">{summary}</p>
          </div>
        )}

        {/* Compact Experience */}
        {userData.experiences?.length > 0 && (
          <div>
            <h2 className="text-[10px] font-black uppercase text-gray-900 border-b border-gray-300 pb-0.5 mb-2">
              {isEn ? 'Experience' : 'الخبرات'}
            </h2>
            <div className="space-y-2.5">
              {userData.experiences.map((exp, idx) => (
                <div key={idx} className="text-[11px]">
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>{exp.role} <span className="font-normal text-gray-600">({exp.company})</span></span>
                    <span className="text-[10px] font-normal text-gray-500">{exp.startDate} - {exp.endDate}</span>
                  </div>
                  <p className="text-[10.5px] text-gray-700 leading-relaxed mt-0.5">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compact Skills */}
        {skills.length > 0 && (
          <div>
            <h2 className="text-[10px] font-black uppercase text-gray-900 border-b border-gray-300 pb-0.5 mb-1.5">
              {isEn ? 'Skills' : 'المهارات'}
            </h2>
            <div className="flex flex-wrap gap-1 text-[10px]">
              {skills.map((skill, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded font-semibold text-gray-800">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Compact Education */}
        {userData.education?.length > 0 && (
          <div>
            <h2 className="text-[10px] font-black uppercase text-gray-900 border-b border-gray-300 pb-0.5 mb-1">
              {isEn ? 'Education' : 'التعليم'}
            </h2>
            <div className="space-y-1 text-[10.5px]">
              {userData.education.map((edu, idx) => (
                <div key={idx} className="flex justify-between text-gray-800 font-semibold">
                  <span>{edu.degree} - {edu.institution}</span>
                  <span className="text-[10px] text-gray-500 font-normal">{edu.year}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
