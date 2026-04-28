import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Briefcase, GraduationCap, Code, FileText, 
  ChevronLeft, ChevronRight, Wand2, Download, 
  BarChart, FileSignature, CheckCircle2, AlertCircle, Trash2, Plus, Upload,
  Globe, Layout, RefreshCw, Settings2
} from 'lucide-react';

// --- API Configurations ---
const apiKey = "AIzaSyBCcSkaPLVtYvE4Sh7G4uk3T4sDgAEeFO8"; // Hardcoded for private use
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

// --- Main Application Component ---
export default function App() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(null);
  const [activeTab, setActiveTab] = useState('cv'); // 'cv', 'ats', 'coverLetter'
  
  // CV Options
  const [cvLanguage, setCvLanguage] = useState('ar');
  const [cvTemplate, setCvTemplate] = useState('classic');

  // Cover Letter Options
  const [clLanguage, setClLanguage] = useState('ar');
  const [clTone, setClTone] = useState('formal');
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
  
  // User Data State
  const [userData, setUserData] = useState({
    personalInfo: { fullName: '', email: '', phone: '', location: '', title: '' },
    summary: '',
    experiences: [{ id: 1, company: '', role: '', startDate: '', endDate: '', description: '' }],
    education: [{ id: 1, institution: '', degree: '', year: '' }],
    skills: '',
    jobDescription: ''
  });

  // AI Generated Data State
  const [generatedResult, setGeneratedResult] = useState(null);
  const [apiError, setApiError] = useState('');

  // Inject Google Fonts for formal CVs
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700&family=Tajawal:wght@400;500;700;800&family=Merriweather:ital,wght@0,400;0,700;1,400;1,700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  // --- Handlers for Input ---
  const handlePersonalInfoChange = (e) => {
    setUserData({ ...userData, personalInfo: { ...userData.personalInfo, [e.target.name]: e.target.value } });
  };

  const handleArrayChange = (type, id, field, value) => {
    const updated = userData[type].map(item => item.id === id ? { ...item, [field]: value } : item);
    setUserData({ ...userData, [type]: updated });
  };

  const addItem = (type, defaultObj) => {
    setUserData({ ...userData, [type]: [...userData[type], { id: Date.now(), ...defaultObj }] });
  };

  const removeItem = (type, id) => {
    setUserData({ ...userData, [type]: userData[type].filter(item => item.id !== id) });
  };

  // --- PDF/Image/DOCX Extraction Logic ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsExtracting(true);
    setApiError('');

    if (!apiKey || apiKey.trim() === "") {
      setApiError('تحذير: مفتاح الـ API مفقود! لم يتعرف الموقع على ملف .env.local الرجاء إيقاف السيرفر وإعادة تشغيله (npm run dev).');
      setIsExtracting(false);
      return;
    }

    try {
      const prompt = `
        أنت خبير في الموارد البشرية. قم باستخراج بيانات السيرة الذاتية المرفقة بدقة.
        إذا لم تجد معلومة معينة، اتركها فارغة. تجاهل أي نصوص نائبة (Placeholders) مثل [Date] أو [اسم الجامعة] ولا تقم باستخراجها. المهارات اجعلها نصاً واحداً مفصولاً بفواصل.
      `;

      let parts = [{ text: prompt }];

      if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const loadMammoth = () => new Promise((resolve, reject) => {
          if (window.mammoth) return resolve(window.mammoth);
          const script = document.createElement('script');
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
          script.onload = () => resolve(window.mammoth);
          script.onerror = reject;
          document.head.appendChild(script);
        });
        
        const mammoth = await loadMammoth();
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        parts.push({ text: "محتوى السيرة الذاتية المستخرج:\n" + result.value });
      } 
      else {
        const base64String = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        let mimeType = file.type;
        if (!mimeType) {
          if (file.name.toLowerCase().endsWith('.pdf')) mimeType = 'application/pdf';
          else if (file.name.toLowerCase().endsWith('.png')) mimeType = 'image/png';
          else if (file.name.toLowerCase().match(/\.(jpg|jpeg)$/)) mimeType = 'image/jpeg';
        }
        parts.push({ inlineData: { mimeType: mimeType, data: base64String } });
      }

      const extractionSchema = {
        type: "OBJECT",
        properties: {
          personalInfo: {
            type: "OBJECT",
            properties: {
              fullName: { type: "STRING" },
              email: { type: "STRING" },
              phone: { type: "STRING" },
              location: { type: "STRING" },
              title: { type: "STRING" }
            }
          },
          summary: { type: "STRING" },
          experiences: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "INTEGER" },
                company: { type: "STRING" },
                role: { type: "STRING" },
                startDate: { type: "STRING" },
                endDate: { type: "STRING" },
                description: { type: "STRING" }
              }
            }
          },
          education: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "INTEGER" },
                institution: { type: "STRING" },
                degree: { type: "STRING" },
                year: { type: "STRING" }
              }
            }
          },
          skills: { type: "STRING" }
        }
      };

      const payload = {
        contents: [{ parts: parts }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: extractionSchema,
        }
      };

      const fetchWithRetry = async (url, options, retries = 3) => {
        let delay = 1000;
        for (let i = 0; i < retries; i++) {
          try {
            const res = await fetch(url, options);
            if (!res.ok) {
              const errBody = await res.text();
              throw new Error(`HTTP ${res.status}: ${errBody}`);
            }
            return await res.json();
          } catch (err) {
            if (i === retries - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
          }
        }
      };

      const result = await fetchWithRetry(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textResponse) {
        const parsedData = JSON.parse(textResponse);
        
        const exps = parsedData.experiences?.length > 0 
          ? parsedData.experiences.map((exp, i) => ({ ...exp, id: Date.now() + i })) 
          : userData.experiences;
          
        const edus = parsedData.education?.length > 0 
          ? parsedData.education.map((edu, i) => ({ ...edu, id: Date.now() + i + 100 })) 
          : userData.education;

        setUserData(prev => ({
          ...prev,
          personalInfo: { ...prev.personalInfo, ...parsedData.personalInfo },
          summary: parsedData.summary || prev.summary,
          skills: parsedData.skills || prev.skills,
          experiences: exps,
          education: edus
        }));
      } else {
        throw new Error("No response generated");
      }
    } catch (err) {
      console.error(err);
      setApiError('فشل استخراج البيانات: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setIsExtracting(false);
    }
  };

  // --- Perfect Native Print Handler (Fixes Arabic text, enforces 1 page & bypasses iframe blocks) ---
  const handlePrint = () => {
    setIsDownloading('pdf');
    const printArea = document.getElementById('cv-print-area');
    if (!printArea) {
      setIsDownloading(null);
      return;
    }

    const pName = generatedResult?.translatedPersonalInfo?.fullName || userData.personalInfo.fullName;

    setTimeout(() => {
      const headHtml = document.head.innerHTML;
      const htmlContent = `
        <!DOCTYPE html>
        <html dir="${cvLanguage === 'en' ? 'ltr' : 'rtl'}">
          <head>
            <meta charset="utf-8">
            <title>CV_${pName || 'Jadeer'}</title>
            ${headHtml}
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              /* إجبار إعدادات الطباعة على A4 وصفحة واحدة فقط */
              @page { 
                size: A4 portrait; 
                margin: 0; 
              }
              body { 
                margin: 0; 
                padding: 0;
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important; 
                background: white; 
              }
              #print-content { 
                width: 210mm; 
                min-height: 297mm; 
                max-height: 297mm;
                overflow: hidden; 
                margin: 0 auto; 
                box-sizing: border-box; 
                background-color: white;
              }
              #print-content * {
                page-break-inside: avoid;
              }
            </style>
          </head>
          <body>
            <div id="print-content">
              ${printArea.innerHTML}
            </div>
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                }, 1000);
              };
            </script>
          </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } else {
        alert("يرجى السماح بالنوافذ المنبثقة (Pop-ups) في متصفحك لفتح السيرة الذاتية.\nأو يمكنك ببساطة الضغط على (Ctrl + P) من لوحة المفاتيح لطباعتها مباشرة.");
      }
      
      setIsDownloading(null);
    }, 500);
  };

  // --- DOCX / Word Download Handler ---
  const handleDownloadDocx = () => {
    setIsDownloading('doc');
    const printArea = document.getElementById('cv-print-area');
    if (!printArea) {
      setIsDownloading(null);
      return;
    }

    alert("تنبيه مهم: يرجى فتح الملف المحمل باستخدام برنامج (Microsoft Word) حصراً للحفاظ على التنسيق. فتحه باستخدام برامج مثل TextEdit في الماك سيظهره كأكواد.");

    const pName = generatedResult?.translatedPersonalInfo?.fullName || userData.personalInfo.fullName;

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40' dir="${cvLanguage === 'en' ? 'ltr' : 'rtl'}">
        <head>
          <meta charset='utf-8'>
          <title>CV_${pName || 'Jadeer'}</title>
          <style>
            @page WordSection1 {
              size: 595.3pt 841.9pt; /* A4 Size */
              margin: 1.0in;
            }
            div.WordSection1 { page: WordSection1; }
            body { font-family: ${cvLanguage === 'en' ? 'Arial, sans-serif' : 'Arial, Tahoma, sans-serif'}; }
          </style>
        </head>
        <body>
          <div class="WordSection1">
            ${printArea.innerHTML}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const filename = `CV_${pName || 'Jadeer'}.doc`;

    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
    
    setIsDownloading(null);
  };

  // --- Copy Handler (Iframe Safe) ---
  const copyToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; 
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      alert('تم النسخ بنجاح!');
    } catch (err) {
      console.error('Failed to copy', err);
      alert('فشل النسخ، يرجى تحديد النص ونسخه يدوياً.');
    }
    document.body.removeChild(textArea);
  };

  // --- AI Generation Logic ---
  const generateCV = async (overrideLang) => {
    const targetLang = typeof overrideLang === 'string' ? overrideLang : cvLanguage;
    setCvLanguage(targetLang);
    setClLanguage(targetLang); // مزامنة لغة الخطاب مبدئياً مع لغة الـ CV

    setIsLoading(true);
    setApiError('');
    
    const prompt = `
      أنت خبير موارد بشرية ومختص في صياغة السير الذاتية (ATS Expert). 
      البيانات الأصلية للمستخدم:
      الاسم: ${userData.personalInfo.fullName}
      المسمى: ${userData.personalInfo.title}
      المدينة/الدولة: ${userData.personalInfo.location}
      الملخص: ${userData.summary}
      الخبرات: ${JSON.stringify(userData.experiences)}
      التعليم: ${JSON.stringify(userData.education)}
      المهارات الحالية: ${userData.skills}
      
      وصف الوظيفة المستهدفة:
      ${userData.jobDescription}

      المطلوب منك تحليل الوظيفة ومطابقتها مع بيانات المستخدم، ثم توليد البيانات التالية لإنشاء سيرة ذاتية مثالية.
      هام جداً: قم بترجمة كافة المدخلات والبيانات (البيانات الشخصية، الملخص، الإنجازات، المهارات، التعليم وغيرها) إلى اللغة ${targetLang === 'en' ? 'الإنجليزية (English)' : 'العربية (Arabic)'} بأسلوب احترافي جداً ورسمي.
      يجب أيضاً إزالة وتجاهل أي نصوص نائبة (Placeholders) مثل [Date From] أو [اسم الجامعة] أو [سنة التخرج] أو [Hospital/Medical Center Name] واستبدالها بقيمة فارغة ("").

      1. ترجمة البيانات الشخصية (الاسم، المسمى، الموقع) إلى اللغة المطلوبة (translatedPersonalInfo).
      2. إعادة صياغة الملخص المهني (summary) ليكون أكثر جاذبية وتوافقاً مع الوظيفة ومختصراً.
      3. تحسين صياغة وصف كل خبرة مهنية (experiences)، مع إبراز الإنجازات والكلمات المفتاحية المطلوبة. أعد كتابة وصف الخبرة في نقاط (bullets) احترافية (حد أقصى 3 نقاط للخبرة).
      4. ترجمة وتنقيح بيانات التعليم (education) وتنسيقها.
      5. دمج مهارات المستخدم الحالية مع الكلمات المفتاحية وترجمتها إلى قائمة (tailoredSkills).
      6. حساب نسبة توافق السيرة مع الوظيفة (atsScore) من 0 إلى 100.
      7. تحديد الكلمات المفتاحية الموجودة (matchedKeywords) والمفقودة (missingKeywords).
      8. كتابة خطاب تقديم احترافي وقصير (coverLetter).

      يجب أن يكون الرد بصيغة JSON فقط، وبشكل حصري باللغة ${targetLang === 'en' ? 'الإنجليزية' : 'العربية'} لجميع النصوص المولدة، وفق الهيكل التالي:
    `;

    const schema = {
      type: "OBJECT",
      properties: {
        translatedPersonalInfo: {
          type: "OBJECT",
          properties: {
            fullName: { type: "STRING", description: "الاسم مترجم أو كما هو إذا كان باللغة المطلوبة" },
            title: { type: "STRING", description: "المسمى الوظيفي مترجم للغة المطلوبة" },
            location: { type: "STRING", description: "الموقع مترجم للغة المطلوبة" }
          }
        },
        tailoredSummary: { type: "STRING", description: "الملخص المهني المحسن" },
        tailoredExperiences: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              role: { type: "STRING" },
              company: { type: "STRING" },
              date: { type: "STRING" },
              bullets: { type: "ARRAY", items: { type: "STRING" } }
            }
          }
        },
        tailoredEducation: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              degree: { type: "STRING" },
              institution: { type: "STRING" },
              year: { type: "STRING" }
            }
          }
        },
        tailoredSkills: {
          type: "ARRAY",
          items: { type: "STRING" }
        },
        atsScore: { type: "INTEGER", description: "نسبة التطابق من 100" },
        matchedKeywords: { type: "ARRAY", items: { type: "STRING" } },
        missingKeywords: { type: "ARRAY", items: { type: "STRING" } },
        coverLetter: { type: "STRING", description: "خطاب التقديم" }
      },
      required: ["translatedPersonalInfo", "tailoredSummary", "tailoredExperiences", "tailoredEducation", "tailoredSkills", "atsScore", "matchedKeywords", "missingKeywords", "coverLetter"]
    };

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    };

    const fetchWithRetry = async (url, options, retries = 3) => {
      let delay = 1000;
      for (let i = 0; i < retries; i++) {
        try {
          const res = await fetch(url, options);
          if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`HTTP ${res.status}: ${errBody}`);
          }
          return await res.json();
        } catch (e) {
          if (i === retries - 1) throw e;
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        }
      }
    };

    try {
      const result = await fetchWithRetry(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textResponse) {
        const parsedResult = JSON.parse(textResponse);
        setGeneratedResult(parsedResult);
        setStep(4);
      } else {
        throw new Error("No response generated from AI.");
      }
    } catch (err) {
      console.error(err);
      setApiError('حدث خطأ أثناء معالجة البيانات: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setIsLoading(false);
    }
  };

  // --- Generate ONLY Cover Letter ---
  const regenerateCoverLetter = async () => {
    setIsGeneratingCL(true);
    
    const toneDescription = 
      clTone === 'formal' ? 'رسمي واحترافي جداً (Formal & Professional)' :
      clTone === 'concise' ? 'دقيق، موجز، ومباشر في صلب الموضوع (Concise & Direct)' :
      clTone === 'enthusiastic' ? 'حماسي، شغوف، ويظهر دافعية عالية (Enthusiastic & Passionate)' : 
      'واثق وجريء ومقنع (Confident & Bold)';

    const prompt = `
      أنت خبير موارد بشرية. قم بكتابة خطاب تقديم (Cover Letter) مخصص وممتاز بناءً على البيانات التالية.
      
      الاسم: ${generatedResult?.translatedPersonalInfo?.fullName || userData.personalInfo.fullName}
      المسمى الوظيفي: ${generatedResult?.translatedPersonalInfo?.title || userData.personalInfo.title}
      ملخص عني: ${generatedResult?.tailoredSummary}
      المهارات: ${generatedResult?.tailoredSkills?.join(', ')}

      الوظيفة المستهدفة:
      ${userData.jobDescription}

      المطلوب:
      كتابة خطاب تقديم باللغة ${clLanguage === 'en' ? 'الإنجليزية (English)' : 'العربية (Arabic)'}.
      يجب أن يكون الأسلوب: ${toneDescription}.
      الخطاب يجب أن يكون جاهزاً للنسخ واللصق ومقنعاً لمدير التوظيف.

      يجب أن يكون الرد بصيغة JSON فقط:
    `;

    const schema = {
      type: "OBJECT",
      properties: {
        coverLetter: { type: "STRING" }
      },
      required: ["coverLetter"]
    };

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: schema }
    };

    try {
      const result = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await result.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textResponse) {
        const parsedResult = JSON.parse(textResponse);
        setGeneratedResult(prev => ({ ...prev, coverLetter: parsedResult.coverLetter }));
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء صياغة الخطاب.');
    } finally {
      setIsGeneratingCL(false);
    }
  };

  // --- Sub-components rendering ---

  const renderStep1 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* File Upload Section */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl shadow-sm border border-emerald-100 flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold text-emerald-800 mb-2">هل لديك سيرة ذاتية سابقة؟</h2>
        <p className="text-gray-600 mb-4 text-sm max-w-md">ارفع سيرتك الذاتية (PDF, DOCX, أو صورة) وسيقوم الذكاء الاصطناعي باستخراج بياناتك تلقائياً لتوفير وقتك.</p>
        
        <input 
          type="file" 
          id="cv-upload" 
          accept=".pdf,.png,.jpg,.jpeg,.docx,application/pdf,image/png,image/jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
          className="hidden" 
          onChange={handleFileUpload}
          disabled={isExtracting}
        />
        <label 
          htmlFor="cv-upload" 
          className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all cursor-pointer shadow-sm ${isExtracting ? 'bg-gray-200 text-gray-500' : 'bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:shadow-md'}`}
        >
          {isExtracting ? (
            <><Wand2 className="w-5 h-5 ml-2 animate-pulse"/> جاري قراءة الملف واستخراج البيانات...</>
          ) : (
            <><Upload className="w-5 h-5 ml-2"/> رفع السيرة الذاتية (PDF, صورة, DOCX)</>
          )}
        </label>
        {apiError && <p className="text-red-500 text-sm mt-3">{apiError}</p>}
      </div>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">أو أدخل / راجع بياناتك يدوياً</span>
        <div className="flex-grow border-t border-gray-200"></div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800"><User className="ml-2 w-5 h-5 text-emerald-600"/> البيانات الشخصية</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="fullName" value={userData.personalInfo.fullName} onChange={handlePersonalInfoChange} placeholder="الاسم الكامل" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
          <input name="title" value={userData.personalInfo.title} onChange={handlePersonalInfoChange} placeholder="المسمى الوظيفي الحالي (مثل: مهندس برمجيات)" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
          <input name="email" type="email" value={userData.personalInfo.email} onChange={handlePersonalInfoChange} placeholder="البريد الإلكتروني" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
          <input name="phone" value={userData.personalInfo.phone} onChange={handlePersonalInfoChange} placeholder="رقم الهاتف" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
          <input name="location" value={userData.personalInfo.location} onChange={handlePersonalInfoChange} placeholder="المدينة، الدولة" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none md:col-span-2" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800"><FileText className="ml-2 w-5 h-5 text-emerald-600"/> الملخص المهني والمهارات</h2>
        <textarea value={userData.summary} onChange={(e) => setUserData({...userData, summary: e.target.value})} placeholder="نبذة مختصرة عنك وعن أهدافك المهنية..." className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none min-h-[100px] mb-4" />
        <textarea value={userData.skills} onChange={(e) => setUserData({...userData, skills: e.target.value})} placeholder="أدخل مهاراتك مفصولة بفواصل (مثال: القيادة، البرمجة، التسويق...)" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none min-h-[80px]" />
      </div>

      <div className="flex justify-end">
        <button onClick={() => setStep(2)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-semibold flex items-center transition-colors">
          التالي <ChevronLeft className="mr-2 w-5 h-5"/>
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center text-gray-800"><Briefcase className="ml-2 w-5 h-5 text-emerald-600"/> الخبرات المهنية</h2>
          <button onClick={() => addItem('experiences', { company: '', role: '', startDate: '', endDate: '', description: '' })} className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg flex items-center text-sm font-medium transition-colors">
            <Plus className="w-4 h-4 ml-1"/> إضافة خبرة
          </button>
        </div>
        {userData.experiences.map((exp, index) => (
          <div key={exp.id} className="p-4 border border-gray-100 rounded-xl mb-4 bg-gray-50 relative">
            {userData.experiences.length > 1 && (
              <button onClick={() => removeItem('experiences', exp.id)} className="absolute top-4 left-4 text-red-400 hover:text-red-600"><Trash2 className="w-5 h-5"/></button>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <input value={exp.role} onChange={(e) => handleArrayChange('experiences', exp.id, 'role', e.target.value)} placeholder="المسمى الوظيفي (مثال: مدير مبيعات)" className="w-full p-2.5 border border-gray-200 rounded-lg outline-none" />
              <input value={exp.company} onChange={(e) => handleArrayChange('experiences', exp.id, 'company', e.target.value)} placeholder="اسم الشركة" className="w-full p-2.5 border border-gray-200 rounded-lg outline-none" />
              <input value={exp.startDate} onChange={(e) => handleArrayChange('experiences', exp.id, 'startDate', e.target.value)} placeholder="تاريخ البدء (مثال: 2020)" className="w-full p-2.5 border border-gray-200 rounded-lg outline-none" />
              <input value={exp.endDate} onChange={(e) => handleArrayChange('experiences', exp.id, 'endDate', e.target.value)} placeholder="تاريخ الانتهاء (مثال: الآن)" className="w-full p-2.5 border border-gray-200 rounded-lg outline-none" />
            </div>
            <textarea value={exp.description} onChange={(e) => handleArrayChange('experiences', exp.id, 'description', e.target.value)} placeholder="وصف المهام والإنجازات..." className="w-full p-2.5 border border-gray-200 rounded-lg outline-none min-h-[80px]" />
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center text-gray-800"><GraduationCap className="ml-2 w-5 h-5 text-emerald-600"/> التعليم المؤهلات</h2>
          <button onClick={() => addItem('education', { institution: '', degree: '', year: '' })} className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg flex items-center text-sm font-medium transition-colors">
            <Plus className="w-4 h-4 ml-1"/> إضافة مؤهل
          </button>
        </div>
        {userData.education.map((edu) => (
          <div key={edu.id} className="p-4 border border-gray-100 rounded-xl mb-4 bg-gray-50 relative">
            {userData.education.length > 1 && (
              <button onClick={() => removeItem('education', edu.id)} className="absolute top-4 left-4 text-red-400 hover:text-red-600"><Trash2 className="w-5 h-5"/></button>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input value={edu.degree} onChange={(e) => handleArrayChange('education', edu.id, 'degree', e.target.value)} placeholder="الدرجة العلمية (مثال: بكالوريوس)" className="w-full p-2.5 border border-gray-200 rounded-lg outline-none" />
              <input value={edu.institution} onChange={(e) => handleArrayChange('education', edu.id, 'institution', e.target.value)} placeholder="الجامعة / المعهد" className="w-full p-2.5 border border-gray-200 rounded-lg outline-none" />
              <input value={edu.year} onChange={(e) => handleArrayChange('education', edu.id, 'year', e.target.value)} placeholder="سنة التخرج" className="w-full p-2.5 border border-gray-200 rounded-lg outline-none" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-800 px-6 py-3 font-medium flex items-center">
          <ChevronRight className="ml-2 w-5 h-5"/> عودة
        </button>
        <button onClick={() => setStep(3)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-semibold flex items-center transition-colors">
          التالي <ChevronLeft className="mr-2 w-5 h-5"/>
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4 border-b pb-4">
          <h2 className="text-xl font-bold flex items-center text-gray-800"><Code className="ml-2 w-5 h-5 text-emerald-600"/> الوظيفة المستهدفة</h2>
          
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setCvLanguage('ar')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-2 ${cvLanguage === 'ar' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Globe className="w-4 h-4"/> العربية
            </button>
            <button onClick={() => setCvLanguage('en')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-2 ${cvLanguage === 'en' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Globe className="w-4 h-4"/> English
            </button>
          </div>
        </div>
        
        <p className="text-gray-500 text-sm mb-4">انسخ والصق وصف الوظيفة (Job Description) التي ترغب بالتقديم عليها ليقوم الذكاء الاصطناعي بتخصيص السيرة الذاتية لها باللغة المختارة.</p>
        <textarea 
          value={userData.jobDescription} 
          onChange={(e) => setUserData({...userData, jobDescription: e.target.value})} 
          placeholder="ألصق متطلبات الوظيفة هنا..." 
          className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none min-h-[250px] leading-relaxed resize-y" 
        />
        {apiError && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 ml-2"/> {apiError}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <button onClick={() => setStep(2)} className="text-gray-500 hover:text-gray-800 px-6 py-3 font-medium flex items-center disabled:opacity-50">
          <ChevronRight className="ml-2 w-5 h-5"/> عودة
        </button>
        <button 
          onClick={() => generateCV()} 
          disabled={!userData.jobDescription.trim() || isLoading}
          className="bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-3 rounded-xl font-semibold flex items-center transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
        >
          {isLoading ? (
            <span className="flex items-center"><Wand2 className="ml-2 w-5 h-5 animate-pulse"/> جاري التوليد والتحليل...</span>
          ) : (
            <span className="flex items-center"><Wand2 className="ml-2 w-5 h-5"/> إنشاء السيرة الذاتية</span>
          )}
        </button>
      </div>
    </div>
  );

  const renderResults = () => {
    if (!generatedResult) return null;

    // Helper Constants for translated or original personal info
    const pName = generatedResult.translatedPersonalInfo?.fullName || userData.personalInfo.fullName;
    const pTitle = generatedResult.translatedPersonalInfo?.title || userData.personalInfo.title;
    const pLoc = generatedResult.translatedPersonalInfo?.location || userData.personalInfo.location;

    // Font selection based on template and language
    const getFontFamily = (template) => {
      const isEn = cvLanguage === 'en';
      switch (template) {
        case 'classic': return isEn ? "'Inter', sans-serif" : "'Tajawal', sans-serif";
        case 'modern': return isEn ? "'Inter', sans-serif" : "'Cairo', sans-serif";
        case 'minimal': return isEn ? "'Inter', sans-serif" : "'Tajawal', sans-serif";
        case 'professional': return isEn ? "'Inter', sans-serif" : "'Tajawal', sans-serif";
        case 'creative': return isEn ? "'Inter', sans-serif" : "'Cairo', sans-serif";
        case 'elegant': return isEn ? "'Merriweather', 'Georgia', serif" : "'Amiri', 'Tajawal', serif";
        case 'formal': return isEn ? "'Merriweather', 'Georgia', serif" : "'Amiri', 'Tajawal', serif";
        case 'corporate': return isEn ? "'Inter', 'Segoe UI', sans-serif" : "'Tajawal', sans-serif";
        default: return isEn ? "'Inter', sans-serif" : "'Tajawal', sans-serif";
      }
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
        
        {/* Print Styles for Fallback (Ctrl+P on main window) */}
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            #cv-print-area, #cv-print-area * { visibility: visible !important; }
            #cv-print-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 210mm !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; }
            .no-print { display: none !important; }
            @page { size: A4 portrait; margin: 0; }
          }
        `}</style>

        {/* Action Bar (No Print) */}
        <div className="flex flex-col lg:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 no-print gap-4">
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => setActiveTab('cv')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center ${activeTab === 'cv' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <FileText className="w-4 h-4 ml-2"/> السيرة الذاتية
            </button>
            <button onClick={() => setActiveTab('coverLetter')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center ${activeTab === 'coverLetter' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <FileSignature className="w-4 h-4 ml-2"/> خطاب التقديم
            </button>
            <button onClick={() => setActiveTab('ats')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center ${activeTab === 'ats' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <BarChart className="w-4 h-4 ml-2"/> تحليل ATS
            </button>
          </div>

          {/* Controls: Template & Language Selector (Only for CV Tab) */}
          {activeTab === 'cv' && (
            <div className="flex flex-wrap gap-2 justify-center bg-gray-50 p-1.5 rounded-xl border border-gray-100">
              <div className="flex flex-wrap justify-center bg-white p-1 rounded-lg border border-gray-100 shadow-sm gap-1">
                <button onClick={() => setCvTemplate('classic')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center ${cvTemplate === 'classic' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}><Layout className="w-3 h-3 ml-1"/> كلاسيكي</button>
                <button onClick={() => setCvTemplate('modern')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center ${cvTemplate === 'modern' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}><Layout className="w-3 h-3 ml-1"/> عصري</button>
                <button onClick={() => setCvTemplate('minimal')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center ${cvTemplate === 'minimal' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}><Layout className="w-3 h-3 ml-1"/> بسيط</button>
                <button onClick={() => setCvTemplate('professional')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center ${cvTemplate === 'professional' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}><Layout className="w-3 h-3 ml-1"/> احترافي</button>
                <button onClick={() => setCvTemplate('creative')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center ${cvTemplate === 'creative' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}><Layout className="w-3 h-3 ml-1"/> إبداعي</button>
                <button onClick={() => setCvTemplate('elegant')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center ${cvTemplate === 'elegant' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}><Layout className="w-3 h-3 ml-1"/> أنيق</button>
                <button onClick={() => setCvTemplate('formal')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center ${cvTemplate === 'formal' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}><Layout className="w-3 h-3 ml-1"/> رسمي</button>
                <button onClick={() => setCvTemplate('corporate')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center ${cvTemplate === 'corporate' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}><Layout className="w-3 h-3 ml-1"/> شركات</button>
              </div>
              <div className="flex bg-white p-1 rounded-lg border border-gray-100 shadow-sm">
                <button onClick={() => { if(cvLanguage !== 'ar') generateCV('ar') }} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${cvLanguage === 'ar' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}><Globe className="w-3 h-3"/> العربية</button>
                <button onClick={() => { if(cvLanguage !== 'en') generateCV('en') }} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${cvLanguage === 'en' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}><Globe className="w-3 h-3"/> English</button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setStep(3)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors hidden md:block">
              تعديل الوظيفة
            </button>
            {activeTab === 'cv' && (
              <>
                <button onClick={handleDownloadDocx} disabled={!!isDownloading} className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg text-sm font-semibold flex items-center transition-colors shadow-sm disabled:opacity-50">
                  {isDownloading === 'doc' ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin md:ml-2 ml-0"/> <span className="hidden md:inline">جاري...</span></>
                  ) : (
                    <><FileText className="w-4 h-4 md:ml-2 ml-0"/> <span className="hidden md:inline">تحميل Word</span></>
                  )}
                </button>
                <button onClick={handlePrint} disabled={!!isDownloading} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 md:px-4 py-2 rounded-lg text-sm font-semibold flex items-center transition-colors shadow-sm disabled:opacity-50">
                  {isDownloading === 'pdf' ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin md:ml-2 ml-0"/> <span className="hidden md:inline">جاري...</span></>
                  ) : (
                    <><Download className="w-4 h-4 md:ml-2 ml-0"/> <span className="hidden md:inline">تحميل PDF</span></>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="min-h-[600px]">
          
          {/* CV Tab */}
          <div className={activeTab === 'cv' ? 'block overflow-x-auto pb-8' : 'hidden'}>
            <div id="cv-print-area" className="mx-auto bg-white shadow-lg relative" style={{ width: '210mm', height: '297mm', overflow: 'hidden' }}>
              
              {/* Template 1: Classic */}
              {cvTemplate === 'classic' && (
                <div className={`w-full h-full p-8 md:p-10 ${cvLanguage === 'en' ? 'text-left' : 'text-right'}`} dir={cvLanguage === 'en' ? 'ltr' : 'rtl'} style={{fontFamily: getFontFamily('classic')}}>
                  {/* CV Header */}
                  <div className="border-b-2 border-emerald-800 pb-5 mb-5">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{pName}</h1>
                    <h2 className="text-lg text-emerald-700 font-bold mb-3">{pTitle}</h2>
                    <div className="flex flex-wrap gap-4 text-[13px] text-gray-600 font-medium">
                      {userData.personalInfo.email && <span>📧 {userData.personalInfo.email}</span>}
                      {userData.personalInfo.phone && <span>📱 {userData.personalInfo.phone}</span>}
                      {pLoc && <span>📍 {pLoc}</span>}
                    </div>
                  </div>

                  {/* CV Summary */}
                  <div className="mb-5">
                    <h3 className="text-[15px] font-bold text-emerald-800 border-b border-gray-200 pb-1 mb-2 uppercase tracking-wider">{cvLanguage === 'en' ? 'Professional Summary' : 'الملخص المهني'}</h3>
                    <p className="text-gray-800 leading-relaxed text-[13px] font-medium">{generatedResult.tailoredSummary}</p>
                  </div>

                  {/* CV Experience */}
                  <div className="mb-5">
                    <h3 className="text-[15px] font-bold text-emerald-800 border-b border-gray-200 pb-1 mb-3 uppercase tracking-wider">{cvLanguage === 'en' ? 'Experience' : 'الخبرات المهنية'}</h3>
                    {generatedResult.tailoredExperiences.map((exp, i) => (
                      <div key={i} className="mb-3.5">
                        <div className="flex justify-between items-baseline mb-0.5">
                          {exp.role && <h4 className="font-bold text-gray-900 text-[14px]">{exp.role}</h4>}
                          {exp.date && <span className="text-[12px] text-emerald-700 font-bold">{exp.date}</span>}
                        </div>
                        {exp.company && <div className="text-[13px] font-bold text-gray-600 mb-1.5">{exp.company}</div>}
                        {exp.bullets && exp.bullets.length > 0 && (
                          <ul className={`list-disc list-inside text-gray-800 text-[13px] space-y-1 font-medium ${cvLanguage === 'en' ? 'pl-2' : 'pr-2'}`}>
                            {exp.bullets.map((bullet, idx) => (
                              <li key={idx} className="leading-relaxed">{bullet}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* CV Education */}
                  {generatedResult.tailoredEducation && generatedResult.tailoredEducation.length > 0 && (
                    <div className="mb-5">
                      <h3 className="text-[15px] font-bold text-emerald-800 border-b border-gray-200 pb-1 mb-3 uppercase tracking-wider">{cvLanguage === 'en' ? 'Education' : 'التعليم'}</h3>
                      {generatedResult.tailoredEducation.map((edu, i) => (
                        <div key={i} className="mb-2 flex justify-between items-baseline">
                          <div>
                            {edu.degree && <span className="font-bold text-gray-900 text-[13px] block">{edu.degree}</span>}
                            {edu.institution && <span className="text-[12px] text-gray-600 font-medium">{edu.institution}</span>}
                          </div>
                          {edu.year && <span className="text-[12px] text-emerald-700 font-bold">{edu.year}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CV Skills */}
                  {generatedResult.tailoredSkills && generatedResult.tailoredSkills.length > 0 && (
                    <div className="mb-2">
                      <h3 className="text-[15px] font-bold text-emerald-800 border-b border-gray-200 pb-1 mb-3 uppercase tracking-wider">{cvLanguage === 'en' ? 'Skills' : 'المهارات'}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {generatedResult.tailoredSkills.map((skill, i) => (
                          <span key={i} className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-md text-[12px] font-bold border border-gray-200">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Template 2: Modern */}
              {cvTemplate === 'modern' && (
                <div className={`w-full h-full flex flex-col ${cvLanguage === 'en' ? 'text-left' : 'text-right'}`} dir={cvLanguage === 'en' ? 'ltr' : 'rtl'} style={{fontFamily: getFontFamily('modern')}}>
                  <div className="bg-slate-800 text-white p-8">
                    <h1 className="text-3xl font-bold mb-1.5">{pName}</h1>
                    <h2 className="text-lg text-emerald-400 font-bold mb-4">{pTitle}</h2>
                    <div className="flex flex-wrap gap-5 text-[12px] text-slate-300 font-medium">
                      {userData.personalInfo.email && <span className="flex items-center gap-1.5">📧 {userData.personalInfo.email}</span>}
                      {userData.personalInfo.phone && <span className="flex items-center gap-1.5">📱 {userData.personalInfo.phone}</span>}
                      {pLoc && <span className="flex items-center gap-1.5">📍 {pLoc}</span>}
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row flex-grow">
                    <div className="md:w-2/3 p-8 border-r border-gray-100">
                      <div className="mb-6">
                        <h3 className="text-[16px] font-bold text-slate-800 mb-3 flex items-center gap-2"><User className="w-4 h-4 text-emerald-600"/> {cvLanguage === 'en' ? 'Profile' : 'الملخص الشخصي'}</h3>
                        <p className="text-gray-800 leading-relaxed text-[13px] font-medium">{generatedResult.tailoredSummary}</p>
                      </div>

                      <div>
                        <h3 className="text-[16px] font-bold text-slate-800 mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4 text-emerald-600"/> {cvLanguage === 'en' ? 'Experience' : 'الخبرات'}</h3>
                        {generatedResult.tailoredExperiences.map((exp, i) => (
                          <div key={i} className={`mb-5 relative border-emerald-200 ${cvLanguage === 'en' ? 'border-l-2 pl-4' : 'border-r-2 pr-4'}`}>
                            <div className={`absolute w-2.5 h-2.5 bg-emerald-500 rounded-full top-1.5 ${cvLanguage === 'en' ? '-left-[6px]' : '-right-[6px]'}`}></div>
                            {exp.role && <h4 className="font-bold text-gray-900 text-[14px]">{exp.role}</h4>}
                            <div className="flex justify-between items-center mb-1.5">
                              {exp.company && <span className="text-[13px] font-bold text-emerald-700">{exp.company}</span>}
                              {exp.date && <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">{exp.date}</span>}
                            </div>
                            {exp.bullets && exp.bullets.length > 0 && (
                              <ul className={`list-disc list-outside text-gray-800 text-[13px] font-medium space-y-1 ${cvLanguage === 'en' ? 'ml-4' : 'mr-4'}`}>
                                {exp.bullets.map((bullet, idx) => (
                                  <li key={idx} className="leading-relaxed">{bullet}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="md:w-1/3 bg-slate-50 p-8">
                      <div className="mb-6">
                        <h3 className="text-[15px] font-bold text-slate-800 mb-3 flex items-center gap-2"><Code className="w-4 h-4 text-emerald-600"/> {cvLanguage === 'en' ? 'Skills' : 'المهارات'}</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {generatedResult.tailoredSkills && generatedResult.tailoredSkills.map((skill, i) => (
                            <span key={i} className="bg-white border border-slate-200 text-slate-800 px-2.5 py-1 rounded-md text-[12px] font-bold w-full text-center shadow-sm">{skill}</span>
                          ))}
                        </div>
                      </div>

                      {generatedResult.tailoredEducation && generatedResult.tailoredEducation.length > 0 && (
                        <div>
                          <h3 className="text-[15px] font-bold text-slate-800 mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-emerald-600"/> {cvLanguage === 'en' ? 'Education' : 'التعليم'}</h3>
                          {generatedResult.tailoredEducation.map((edu, i) => (
                            <div key={i} className="mb-3.5">
                              {edu.degree && <span className="font-bold text-slate-800 text-[13px] block mb-0.5">{edu.degree}</span>}
                              {edu.institution && <span className="text-[12px] font-medium text-slate-600 block">{edu.institution}</span>}
                              {edu.year && <span className="text-[11px] text-emerald-600 font-bold mt-0.5 block">{edu.year}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Template 3: Minimal */}
              {cvTemplate === 'minimal' && (
                <div className={`w-full h-full p-10 md:p-14 ${cvLanguage === 'en' ? 'text-left' : 'text-right'}`} dir={cvLanguage === 'en' ? 'ltr' : 'rtl'} style={{fontFamily: getFontFamily('minimal')}}>
                  <div className="text-center mb-10">
                    <h1 className="text-3xl font-light tracking-widest text-gray-900 mb-2 uppercase">{pName}</h1>
                    <p className="text-emerald-700 uppercase tracking-widest text-[13px] font-bold">{pTitle}</p>
                    <div className="flex justify-center flex-wrap gap-3 text-[12px] font-medium text-gray-600 mt-4">
                      {userData.personalInfo.email && <span>{userData.personalInfo.email}</span>}
                      {userData.personalInfo.email && userData.personalInfo.phone && <span>•</span>}
                      {userData.personalInfo.phone && <span>{userData.personalInfo.phone}</span>}
                      {userData.personalInfo.phone && pLoc && <span>•</span>}
                      {pLoc && <span>{pLoc}</span>}
                    </div>
                  </div>

                  <div className="mb-8">
                    <p className="text-gray-800 font-medium leading-relaxed text-[13px] text-center max-w-2xl mx-auto italic">"{generatedResult.tailoredSummary}"</p>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-[12px] font-bold text-gray-400 mb-5 uppercase tracking-widest text-center">{cvLanguage === 'en' ? 'Experience' : 'الخبرات'}</h3>
                    {generatedResult.tailoredExperiences.map((exp, i) => (
                      <div key={i} className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-1">
                          {exp.date && <span className="text-[12px] text-gray-500 font-bold block mt-0.5">{exp.date}</span>}
                        </div>
                        <div className="md:col-span-3">
                          {exp.role && <h4 className="font-bold text-gray-900 text-[14px]">{exp.role}</h4>}
                          {exp.company && <div className="text-[13px] text-emerald-700 font-bold mb-2">{exp.company}</div>}
                          {exp.bullets && exp.bullets.length > 0 && (
                            <ul className={`text-gray-700 font-medium text-[13px] space-y-1 ${cvLanguage === 'en' ? 'pl-0' : 'pr-0'}`}>
                              {exp.bullets.map((bullet, idx) => (
                                <li key={idx} className="leading-relaxed flex items-start">
                                  <span className={`text-gray-300 ${cvLanguage === 'en' ? 'mr-2' : 'ml-2'}`}>-</span> {bullet}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-[12px] font-bold text-gray-400 mb-4 uppercase tracking-widest">{cvLanguage === 'en' ? 'Education' : 'التعليم'}</h3>
                      {generatedResult.tailoredEducation && generatedResult.tailoredEducation.map((edu, i) => (
                        <div key={i} className="mb-3">
                          {edu.degree && <span className="font-bold text-gray-900 text-[13px] block">{edu.degree}</span>}
                          {edu.institution && <span className="text-[12px] font-medium text-gray-600">{edu.institution}</span>}
                          {edu.year && <span className={`text-[11px] font-bold text-gray-400 ${cvLanguage === 'en' ? 'ml-2' : 'mr-2'}`}>{edu.year}</span>}
                        </div>
                      ))}
                    </div>
                    
                    <div>
                      <h3 className="text-[12px] font-bold text-gray-400 mb-4 uppercase tracking-widest">{cvLanguage === 'en' ? 'Skills' : 'المهارات'}</h3>
                      <div className="text-[13px] font-bold text-gray-800 leading-relaxed">
                        {generatedResult.tailoredSkills && generatedResult.tailoredSkills.join(' • ')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Template 4: Professional */}
              {cvTemplate === 'professional' && (
                <div className={`w-full h-full flex flex-col overflow-hidden ${cvLanguage === 'en' ? 'text-left' : 'text-right'}`} dir={cvLanguage === 'en' ? 'ltr' : 'rtl'} style={{fontFamily: getFontFamily('professional')}}>
                  <div className="bg-[#1e293b] text-white p-8 border-b-[6px] border-emerald-500">
                    <h1 className="text-3xl font-bold mb-1.5 tracking-wide uppercase">{pName}</h1>
                    <h2 className="text-lg text-emerald-400 font-bold tracking-widest uppercase mb-4">{pTitle}</h2>
                    <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[12px] text-slate-300 font-medium">
                      {userData.personalInfo.email && <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> {userData.personalInfo.email}</span>}
                      {userData.personalInfo.phone && <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> {userData.personalInfo.phone}</span>}
                      {pLoc && <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> {pLoc}</span>}
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="mb-6">
                      <h3 className="text-[15px] font-bold text-[#1e293b] mb-2 uppercase tracking-wider border-b-2 border-slate-200 pb-1.5">{cvLanguage === 'en' ? 'Professional Summary' : 'الملخص المهني'}</h3>
                      <p className="text-gray-800 leading-relaxed text-[13px] font-medium">{generatedResult.tailoredSummary}</p>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-[15px] font-bold text-[#1e293b] mb-3 uppercase tracking-wider border-b-2 border-slate-200 pb-1.5">{cvLanguage === 'en' ? 'Experience' : 'الخبرات المهنية'}</h3>
                      {generatedResult.tailoredExperiences.map((exp, i) => (
                        <div key={i} className="mb-4">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-baseline mb-0.5">
                            {exp.role && <h4 className="font-bold text-gray-900 text-[14px]">{exp.role}</h4>}
                            {exp.date && <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">{exp.date}</span>}
                          </div>
                          {exp.company && <div className="text-[13px] font-bold text-slate-600 mb-1.5">{exp.company}</div>}
                          {exp.bullets && exp.bullets.length > 0 && (
                            <ul className={`list-disc list-outside text-gray-800 text-[13px] font-medium space-y-1 ${cvLanguage === 'en' ? 'ml-4' : 'mr-4'}`}>
                              {exp.bullets.map((bullet, idx) => (
                                <li key={idx} className="leading-relaxed pl-1">{bullet}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {generatedResult.tailoredEducation && generatedResult.tailoredEducation.length > 0 && (
                        <div>
                          <h3 className="text-[15px] font-bold text-[#1e293b] mb-3 uppercase tracking-wider border-b-2 border-slate-200 pb-1.5">{cvLanguage === 'en' ? 'Education' : 'التعليم'}</h3>
                          {generatedResult.tailoredEducation.map((edu, i) => (
                            <div key={i} className="mb-3 bg-slate-50 p-3 rounded border border-slate-100">
                              {edu.degree && <span className="font-bold text-gray-900 text-[13px] block mb-0.5">{edu.degree}</span>}
                              {edu.institution && <span className="text-[12px] font-medium text-gray-600 block mb-1">{edu.institution}</span>}
                              {edu.year && <span className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider">{edu.year}</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {generatedResult.tailoredSkills && generatedResult.tailoredSkills.length > 0 && (
                        <div>
                          <h3 className="text-[15px] font-bold text-[#1e293b] mb-3 uppercase tracking-wider border-b-2 border-slate-200 pb-1.5">{cvLanguage === 'en' ? 'Core Competencies' : 'المهارات الأساسية'}</h3>
                          <div className="flex flex-wrap gap-1.5">
                            {generatedResult.tailoredSkills.map((skill, i) => (
                              <span key={i} className="bg-[#1e293b] text-white px-2.5 py-1 rounded text-[11px] font-bold">{skill}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Template 5: Creative */}
              {cvTemplate === 'creative' && (
                <div className={`w-full h-full flex flex-col md:flex-row ${cvLanguage === 'en' ? 'text-left' : 'text-right'}`} dir={cvLanguage === 'en' ? 'ltr' : 'rtl'} style={{fontFamily: getFontFamily('creative')}}>
                  <div className="md:w-1/3 bg-emerald-800 text-emerald-50 p-8">
                    <div className="mb-8">
                      <h1 className="text-3xl font-black text-white mb-2 leading-tight">{pName}</h1>
                      <h2 className="text-emerald-300 font-bold text-[15px]">{pTitle}</h2>
                    </div>

                    <div className="mb-8 space-y-3 text-[12px] font-medium">
                      <h3 className="text-white font-bold uppercase tracking-widest border-b border-emerald-600 pb-1.5 mb-3">{cvLanguage === 'en' ? 'Contact' : 'التواصل'}</h3>
                      {userData.personalInfo.email && <div className="break-all flex items-center gap-2"><span className="text-emerald-400">✉</span> {userData.personalInfo.email}</div>}
                      {userData.personalInfo.phone && <div className="flex items-center gap-2"><span className="text-emerald-400">☏</span> {userData.personalInfo.phone}</div>}
                      {pLoc && <div className="flex items-center gap-2"><span className="text-emerald-400">⚲</span> {pLoc}</div>}
                    </div>

                    {generatedResult.tailoredEducation && generatedResult.tailoredEducation.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-white font-bold uppercase tracking-widest border-b border-emerald-600 pb-1.5 mb-3">{cvLanguage === 'en' ? 'Education' : 'التعليم'}</h3>
                        {generatedResult.tailoredEducation.map((edu, i) => (
                          <div key={i} className="mb-3">
                            {edu.year && <div className="text-emerald-400 text-[11px] font-bold mb-0.5">{edu.year}</div>}
                            {edu.degree && <div className="text-white font-bold text-[13px] mb-0.5">{edu.degree}</div>}
                            {edu.institution && <div className="text-emerald-100 text-[11px]">{edu.institution}</div>}
                          </div>
                        ))}
                      </div>
                    )}

                    {generatedResult.tailoredSkills && generatedResult.tailoredSkills.length > 0 && (
                      <div>
                        <h3 className="text-white font-bold uppercase tracking-widest border-b border-emerald-600 pb-1.5 mb-3">{cvLanguage === 'en' ? 'Expertise' : 'الخبرات والمهارات'}</h3>
                        <div className="space-y-1.5">
                          {generatedResult.tailoredSkills.map((skill, i) => (
                            <div key={i} className="text-[12px] font-bold flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                              {skill}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="md:w-2/3 p-8 bg-white">
                    <div className="mb-6">
                      <h3 className="text-[20px] font-black text-gray-800 mb-3 flex items-center gap-2">
                        <User className="w-5 h-5 text-emerald-600"/> {cvLanguage === 'en' ? 'About Me' : 'نبذة عني'}
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-[13px] font-medium">{generatedResult.tailoredSummary}</p>
                    </div>

                    <div>
                      <h3 className="text-[20px] font-black text-gray-800 mb-4 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-emerald-600"/> {cvLanguage === 'en' ? 'Experience' : 'التاريخ المهني'}
                      </h3>
                      <div className="space-y-5">
                        {generatedResult.tailoredExperiences.map((exp, i) => (
                          <div key={i} className={`relative ${cvLanguage === 'en' ? 'pl-5 border-l-2' : 'pr-5 border-r-2'} border-gray-200`}>
                            <div className={`absolute top-0 w-2.5 h-2.5 bg-emerald-600 rounded-full ${cvLanguage === 'en' ? '-left-[6px]' : '-right-[6px]'}`}></div>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1">
                              {exp.role && <h4 className="font-bold text-gray-900 text-[15px]">{exp.role}</h4>}
                              {exp.date && <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mt-1 sm:mt-0 border border-emerald-100">{exp.date}</span>}
                            </div>
                            {exp.company && <div className="text-[13px] font-bold text-gray-500 mb-2">{exp.company}</div>}
                            {exp.bullets && exp.bullets.length > 0 && (
                              <ul className="text-gray-700 font-medium text-[13px] space-y-1.5">
                                {exp.bullets.map((bullet, idx) => (
                                  <li key={idx} className="leading-relaxed flex items-start gap-1.5">
                                    <span className="text-emerald-500 mt-0.5 font-bold">▸</span> <span>{bullet}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Template 6: Elegant */}
              {cvTemplate === 'elegant' && (
                <div className={`w-full h-full p-10 md:p-14 ${cvLanguage === 'en' ? 'text-left' : 'text-right'}`} dir={cvLanguage === 'en' ? 'ltr' : 'rtl'} style={{fontFamily: getFontFamily('elegant')}}>
                  <div className="text-center border-b-[3px] border-double border-gray-800 pb-5 mb-6">
                    <h1 className="text-4xl font-bold text-gray-900 mb-1.5 uppercase tracking-wide">{pName}</h1>
                    <h2 className="text-[16px] text-gray-600 font-bold mb-3">{pTitle}</h2>
                    <div className="flex justify-center flex-wrap gap-x-3 gap-y-1 text-[13px] text-gray-800 font-medium">
                      {userData.personalInfo.email && <span>{userData.personalInfo.email}</span>}
                      {userData.personalInfo.email && userData.personalInfo.phone && <span className="text-gray-400">|</span>}
                      {userData.personalInfo.phone && <span>{userData.personalInfo.phone}</span>}
                      {userData.personalInfo.phone && pLoc && <span className="text-gray-400">|</span>}
                      {pLoc && <span>{pLoc}</span>}
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-gray-900 leading-relaxed text-[14px] text-justify font-bold">{generatedResult.tailoredSummary}</p>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-[17px] font-bold text-gray-900 border-b border-gray-400 pb-1 mb-3 uppercase tracking-widest text-center">{cvLanguage === 'en' ? 'Professional Experience' : 'الخبرات المهنية'}</h3>
                    {generatedResult.tailoredExperiences.map((exp, i) => (
                      <div key={i} className="mb-4">
                        <div className="flex justify-between items-end mb-1">
                          <div>
                            {exp.role && <span className="font-bold text-gray-900 text-[15px] mr-1 ml-1">{exp.role}</span>}
                            {exp.company && <span className="text-[14px] text-gray-700 font-medium"> - {exp.company}</span>}
                          </div>
                          {exp.date && <span className="text-[13px] text-gray-800 font-bold">{exp.date}</span>}
                        </div>
                        {exp.bullets && exp.bullets.length > 0 && (
                          <ul className={`list-disc list-inside text-gray-900 font-medium text-[14px] space-y-1 mt-1.5 ${cvLanguage === 'en' ? 'pl-3' : 'pr-3'}`}>
                            {exp.bullets.map((bullet, idx) => (
                              <li key={idx} className="leading-relaxed">{bullet}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>

                  {generatedResult.tailoredEducation && generatedResult.tailoredEducation.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-[17px] font-bold text-gray-900 border-b border-gray-400 pb-1 mb-3 uppercase tracking-widest text-center">{cvLanguage === 'en' ? 'Education' : 'التعليم'}</h3>
                      {generatedResult.tailoredEducation.map((edu, i) => (
                        <div key={i} className="mb-2 flex justify-between items-baseline">
                          <div>
                            {edu.degree && <span className="font-bold text-gray-900 text-[14px] mr-1 ml-1">{edu.degree}</span>}
                            {edu.institution && <span className="text-[13px] text-gray-700 font-medium">({edu.institution})</span>}
                          </div>
                          {edu.year && <span className="text-[13px] text-gray-800 font-bold">{edu.year}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {generatedResult.tailoredSkills && generatedResult.tailoredSkills.length > 0 && (
                    <div>
                      <h3 className="text-[17px] font-bold text-gray-900 border-b border-gray-400 pb-1 mb-3 uppercase tracking-widest text-center">{cvLanguage === 'en' ? 'Skills & Competencies' : 'المهارات والكفاءات'}</h3>
                      <div className="text-[14px] text-gray-900 font-bold leading-relaxed text-center">
                        {generatedResult.tailoredSkills.join('  ♦  ')}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Template 7: Formal */}
              {cvTemplate === 'formal' && (
                <div className={`w-full h-full p-10 md:p-14 ${cvLanguage === 'en' ? 'text-left' : 'text-right'}`} dir={cvLanguage === 'en' ? 'ltr' : 'rtl'} style={{fontFamily: getFontFamily('formal')}}>
                  {/* Header */}
                  <div className="text-center mb-4">
                    <h1 className="text-4xl font-bold text-gray-900 uppercase tracking-widest">{pName}</h1>
                    {pTitle && <h2 className="text-[16px] text-gray-900 font-bold mt-2 font-serif">{pTitle}</h2>}
                    {pLoc && <div className="text-[13px] text-gray-700 mt-1 font-serif">{pLoc}</div>}
                  </div>

                  {/* Contact Info */}
                  <div className="flex justify-between items-end w-full mb-1 px-2">
                    {userData.personalInfo.phone && <span className="font-bold text-[13px] text-gray-900">{userData.personalInfo.phone}</span>}
                    {userData.personalInfo.email && <span className="font-bold text-[13px] text-gray-900">{userData.personalInfo.email}</span>}
                  </div>

                  {/* Profile Section */}
                  <div className="w-full mt-1 mb-4">
                    <div className="border-t-[3px] border-double border-gray-900 w-full mb-[2px]"></div>
                    <div className="bg-gray-100 w-full py-1.5 text-center">
                      <span className="text-[15px] font-bold uppercase tracking-widest text-gray-900 border-b-[1.5px] border-gray-900 inline-block pb-0.5">
                        {cvLanguage === 'en' ? 'Profile' : 'الملخص الشخصي'}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-800 leading-relaxed text-[13px] font-medium text-justify px-2 mb-6">
                    {generatedResult.tailoredSummary}
                  </p>

                  {/* Employment Section */}
                  {generatedResult.tailoredExperiences && generatedResult.tailoredExperiences.length > 0 && (
                    <>
                      <div className="w-full mt-6 mb-4">
                        <div className="border-t-[3px] border-double border-gray-900 w-full mb-[2px]"></div>
                        <div className="bg-gray-100 w-full py-1.5 text-center">
                          <span className="text-[15px] font-bold uppercase tracking-widest text-gray-900 border-b-[1.5px] border-gray-900 inline-block pb-0.5">
                            {cvLanguage === 'en' ? 'Employment History' : 'التاريخ المهني'}
                          </span>
                        </div>
                      </div>
                      <div className="px-2 mb-6">
                        {generatedResult.tailoredExperiences.map((exp, i) => (
                          <div key={i} className="mb-4">
                            <div className="flex items-center w-full mb-2">
                              <span className="text-gray-900 text-[11px] mx-2">❖</span>
                              <span className="font-bold text-gray-900 text-[14px] whitespace-nowrap">
                                {exp.role}{exp.company ? `, ${exp.company}` : ''}
                              </span>
                              <div className="flex-grow border-b-[1.5px] border-dotted border-gray-400 mx-3 relative top-[-4px]"></div>
                              <span className="text-[12px] text-gray-800 font-medium whitespace-nowrap">{exp.date}</span>
                            </div>
                            {exp.bullets && exp.bullets.length > 0 && (
                              <ul className="text-gray-800 font-medium text-[13px] space-y-1 mt-1">
                                {exp.bullets.map((bullet, idx) => (
                                  <li key={idx} className="leading-relaxed flex items-start">
                                    <span className="w-4 flex-shrink-0"></span>
                                    <span>{bullet}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Education Section */}
                  {generatedResult.tailoredEducation && generatedResult.tailoredEducation.length > 0 && (
                    <>
                      <div className="w-full mt-6 mb-4">
                        <div className="border-t-[3px] border-double border-gray-900 w-full mb-[2px]"></div>
                        <div className="bg-gray-100 w-full py-1.5 text-center">
                          <span className="text-[15px] font-bold uppercase tracking-widest text-gray-900 border-b-[1.5px] border-gray-900 inline-block pb-0.5">
                            {cvLanguage === 'en' ? 'Education' : 'التعليم'}
                          </span>
                        </div>
                      </div>
                      <div className="px-2 mb-6">
                        {generatedResult.tailoredEducation.map((edu, i) => (
                          <div key={i} className="mb-3 flex items-center w-full">
                             <span className="text-gray-900 text-[11px] mx-2">❖</span>
                             <span className="font-bold text-gray-900 text-[14px] whitespace-nowrap">
                                {edu.degree}{edu.institution ? `, ${edu.institution}` : ''}
                             </span>
                             <div className="flex-grow border-b-[1.5px] border-dotted border-gray-400 mx-3 relative top-[-4px]"></div>
                             <span className="text-[12px] text-gray-800 font-medium whitespace-nowrap">{edu.year}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Skills Section */}
                  {generatedResult.tailoredSkills && generatedResult.tailoredSkills.length > 0 && (
                    <>
                      <div className="w-full mt-6 mb-4">
                        <div className="border-t-[3px] border-double border-gray-900 w-full mb-[2px]"></div>
                        <div className="bg-gray-100 w-full py-1.5 text-center">
                          <span className="text-[15px] font-bold uppercase tracking-widest text-gray-900 border-b-[1.5px] border-gray-900 inline-block pb-0.5">
                            {cvLanguage === 'en' ? 'Skills' : 'المهارات'}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2 px-4 pb-4">
                        {generatedResult.tailoredSkills.map((skill, i) => (
                          <div key={i} className="flex items-center w-full">
                            <span className="text-[13px] text-gray-800 font-medium whitespace-nowrap">{skill}</span>
                            <div className="flex-grow border-b-[1.5px] border-dotted border-gray-400 mx-2 relative top-[-4px]"></div>
                            <span className="text-[13px] text-gray-900 font-bold italic">{cvLanguage === 'en' ? 'Expert' : 'متقدم'}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Template 8: Corporate */}
              {cvTemplate === 'corporate' && (
                <div className={`w-full h-full p-10 md:p-14 ${cvLanguage === 'en' ? 'text-left' : 'text-right'}`} dir={cvLanguage === 'en' ? 'ltr' : 'rtl'} style={{fontFamily: getFontFamily('corporate')}}>
                  {/* Header */}
                  <div className="mb-5">
                    <h1 className="text-4xl font-extrabold text-blue-700 uppercase tracking-widest">{pName}</h1>
                    {pTitle && <h2 className="text-[16px] text-gray-900 font-bold mt-2">{pTitle}</h2>}
                    <div className="text-[13px] text-gray-800 mt-2 font-medium">
                      {[pLoc, userData.personalInfo.email, userData.personalInfo.phone].filter(Boolean).join(' | ')}
                    </div>
                  </div>

                  {/* Profile */}
                  <div className="w-full mb-6">
                    <h3 className="text-[15px] font-bold text-blue-700 uppercase tracking-wider border-y-[2px] border-blue-700 py-1.5 mb-3">
                      {cvLanguage === 'en' ? 'Profile' : 'الملخص الشخصي'}
                    </h3>
                    <p className="text-gray-900 leading-relaxed text-[13px] font-medium text-justify">
                      {generatedResult.tailoredSummary}
                    </p>
                  </div>

                  {/* Experience */}
                  {generatedResult.tailoredExperiences && generatedResult.tailoredExperiences.length > 0 && (
                    <div className="w-full mb-6">
                      <h3 className="text-[15px] font-bold text-blue-700 uppercase tracking-wider border-y-[2px] border-blue-700 py-1.5 mb-4">
                        {cvLanguage === 'en' ? 'Professional Experience' : 'التاريخ المهني'}
                      </h3>
                      {generatedResult.tailoredExperiences.map((exp, i) => (
                        <div key={i} className="mb-4">
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="font-bold text-gray-900 text-[14px]">
                              {exp.role}{exp.company ? `, ${exp.company}` : ''}
                            </span>
                            <span className="font-bold text-gray-900 text-[13px]">{exp.date}</span>
                          </div>
                          {exp.bullets && exp.bullets.length > 0 && (
                            <ul className="text-gray-800 font-medium text-[13px] space-y-1">
                              {exp.bullets.map((bullet, idx) => (
                                <li key={idx} className="leading-relaxed">
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Education */}
                  {generatedResult.tailoredEducation && generatedResult.tailoredEducation.length > 0 && (
                    <div className="w-full mb-6">
                      <h3 className="text-[15px] font-bold text-blue-700 uppercase tracking-wider border-y-[2px] border-blue-700 py-1.5 mb-4">
                        {cvLanguage === 'en' ? 'Education' : 'التعليم'}
                      </h3>
                      {generatedResult.tailoredEducation.map((edu, i) => (
                        <div key={i} className="mb-3">
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="font-bold text-gray-900 text-[14px]">
                              {edu.degree}{edu.institution ? `, ${edu.institution}` : ''}
                            </span>
                            <span className="font-bold text-gray-900 text-[13px]">{edu.year}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Skills */}
                  {generatedResult.tailoredSkills && generatedResult.tailoredSkills.length > 0 && (
                    <div className="w-full mb-6">
                      <h3 className="text-[15px] font-bold text-blue-700 uppercase tracking-wider border-y-[2px] border-blue-700 py-1.5 mb-4">
                        {cvLanguage === 'en' ? 'Areas of Expertise' : 'مجالات الخبرة'}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {generatedResult.tailoredSkills.map((skill, i) => (
                          <div key={i} className="flex items-start text-[13px] text-gray-900 font-medium">
                            <span className={`font-bold ${cvLanguage === 'en' ? 'mr-1.5' : 'ml-1.5'}`}>•</span>
                            <span>{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Cover Letter Tab */}
          <div className={activeTab === 'coverLetter' ? 'block' : 'hidden'}>
            
            {/* Cover Letter Controls */}
            <div className="mb-6 bg-gray-50 border border-gray-100 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                
                {/* Language Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-700"><Globe className="w-4 h-4 inline ml-1"/>لغة الخطاب:</span>
                  <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    <button onClick={() => setClLanguage('ar')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${clLanguage === 'ar' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}>العربية</button>
                    <button onClick={() => setClLanguage('en')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${clLanguage === 'en' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}>English</button>
                  </div>
                </div>

                {/* Tone Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-700"><Settings2 className="w-4 h-4 inline ml-1"/>أسلوب الخطاب:</span>
                  <select 
                    value={clTone} 
                    onChange={(e) => setClTone(e.target.value)}
                    className="bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2 outline-none shadow-sm"
                  >
                    <option value="formal">رسمي واحترافي</option>
                    <option value="concise">دقيق وموجز</option>
                    <option value="enthusiastic">حماسي وشغوف</option>
                    <option value="bold">واثق وجريء</option>
                  </select>
                </div>
              </div>

              {/* Regenerate Button */}
              <button 
                onClick={regenerateCoverLetter} 
                disabled={isGeneratingCL}
                className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center transition-colors shadow-sm disabled:opacity-50 w-full md:w-auto justify-center"
              >
                {isGeneratingCL ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"/> جاري الصياغة...</>
                ) : (
                  <><RefreshCw className="w-4 h-4 ml-2"/> إعادة صياغة الخطاب</>
                )}
              </button>
            </div>

            {/* Document Area */}
            <div className={`bg-white p-8 md:p-12 shadow-sm border border-gray-200 rounded-xl max-w-4xl mx-auto no-print ${clLanguage === 'en' ? 'text-left' : 'text-right'}`} dir={clLanguage === 'en' ? 'ltr' : 'rtl'}>
              <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center border-b pb-4">
                 {clLanguage === 'en' ? <FileSignature className="mr-3 text-emerald-600"/> : <FileSignature className="ml-3 text-emerald-600"/>}
                 {clLanguage === 'en' ? 'Tailored Cover Letter' : 'خطاب التقديم المخصص'}
              </h2>
              <div className="prose prose-emerald max-w-none text-gray-800 whitespace-pre-wrap leading-loose font-medium" style={{fontFamily: getFontFamily('classic')}}>
                {generatedResult.coverLetter}
              </div>
              <div className="mt-8 flex justify-end border-t pt-4">
                 <button onClick={() => copyToClipboard(generatedResult.coverLetter)} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-5 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
                  {clLanguage === 'en' ? 'Copy Text' : 'نسخ النص'}
                </button>
              </div>
            </div>
          </div>

          {/* ATS Analysis Tab */}
          <div className={activeTab === 'ats' ? 'block' : 'hidden'}>
             <div className="bg-white p-8 shadow-sm border border-gray-100 rounded-xl max-w-4xl mx-auto no-print">
               <div className="text-center mb-10">
                 <h2 className="text-2xl font-bold mb-2 text-gray-800">نتيجة فحص نظام ATS</h2>
                 <p className="text-gray-500 font-medium">تحليل مدى تطابق سيرتك الذاتية مع متطلبات الوظيفة</p>
                 
                 <div className="mt-8 relative inline-flex items-center justify-center">
                   <svg className="w-40 h-40 transform -rotate-90">
                     <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                     <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" 
                       strokeDasharray={440} strokeDashoffset={440 - (440 * generatedResult.atsScore) / 100}
                       className={`${generatedResult.atsScore >= 80 ? 'text-emerald-500' : generatedResult.atsScore >= 50 ? 'text-amber-400' : 'text-red-500'} transition-all duration-1000 ease-out`} />
                   </svg>
                   <div className="absolute flex flex-col items-center justify-center text-center">
                     <span className="text-4xl font-bold text-gray-800">{generatedResult.atsScore}%</span>
                     <span className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">تطابق</span>
                   </div>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-emerald-50/50 p-6 rounded-xl border border-emerald-100">
                    <h3 className="text-emerald-800 font-bold mb-4 flex items-center"><CheckCircle2 className="w-5 h-5 ml-2"/> مهارات متطابقة (نقاط القوة)</h3>
                    <ul className="space-y-2">
                      {generatedResult.matchedKeywords.length > 0 ? generatedResult.matchedKeywords.map((kw, i) => (
                        <li key={i} className="flex items-center text-emerald-700 text-sm font-bold bg-white px-3 py-2 rounded shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 ml-2"></span> {kw}
                        </li>
                      )) : <p className="text-sm font-medium text-gray-500">لم يتم العثور على كلمات مفتاحية متطابقة واضحة.</p>}
                    </ul>
                 </div>
                 <div className="bg-rose-50/50 p-6 rounded-xl border border-rose-100">
                    <h3 className="text-rose-800 font-bold mb-4 flex items-center"><AlertCircle className="w-5 h-5 ml-2"/> مهارات مفقودة (نقاط التحسين)</h3>
                    <ul className="space-y-2">
                      {generatedResult.missingKeywords.length > 0 ? generatedResult.missingKeywords.map((kw, i) => (
                        <li key={i} className="flex items-center text-rose-700 text-sm font-bold bg-white px-3 py-2 rounded shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-rose-400 ml-2"></span> {kw}
                        </li>
                      )) : <p className="text-sm font-medium text-emerald-600">سيرتك تغطي معظم المتطلبات الأساسية!</p>}
                    </ul>
                 </div>
               </div>
             </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-right" dir="rtl" style={{fontFamily: "'Tajawal', sans-serif"}}>
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 no-print">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => setStep(1)}>
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center mr-0 ml-2">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">جدير<span className="text-emerald-600">.</span></h1>
          </div>
          <div className="hidden sm:flex items-center space-x-6 space-x-reverse text-sm font-medium text-gray-500">
            <span className={step >= 1 ? 'text-emerald-600 font-bold' : 'font-bold'}>1. البيانات</span>
            <span className={step >= 2 ? 'text-emerald-600 font-bold' : 'font-bold'}>2. الخبرات</span>
            <span className={step >= 3 ? 'text-emerald-600 font-bold' : 'font-bold'}>3. الوظيفة</span>
            <span className={step === 4 ? 'text-emerald-600 font-bold' : 'font-bold'}>4. النتيجة</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
              <Wand2 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-emerald-600 w-8 h-8 animate-pulse"/>
            </div>
            <h2 className="mt-6 text-xl font-bold text-gray-800">جاري صياغة مستقبلك المهني...</h2>
            <p className="text-gray-500 mt-2 text-sm max-w-xs text-center font-medium">يقوم الذكاء الاصطناعي الآن بمطابقة خبراتك مع الوظيفة وتخصيص السيرة الذاتية.</p>
          </div>
        )}

        {/* Steps */}
        {!isLoading && step === 1 && renderStep1()}
        {!isLoading && step === 2 && renderStep2()}
        {!isLoading && step === 3 && renderStep3()}
        {!isLoading && step === 4 && renderResults()}

      </main>
    </div>
  );
}
