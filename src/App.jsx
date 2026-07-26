import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Briefcase, GraduationCap, Code, FileText, 
  ChevronLeft, ChevronRight, Wand2, Download, 
  BarChart, FileSignature, CheckCircle2, AlertCircle, Trash2, Plus, Upload,
  Globe, Layout, RefreshCw, Settings2, Type, Image as ImageIcon, X, Save, LogIn, LogOut
} from 'lucide-react';
import { supabase, fetchGeminiApiKey, getCurrentUser, signOutUser, saveUserCv, updateUserCv } from './supabaseClient';
import AuthModal from './AuthModal';
import SavedCvsModal from './SavedCvsModal';
import CvSuggestionsModal from './CvSuggestionsModal';
import { Sparkles, Edit3 } from 'lucide-react';
import { 
  HarvardTemplate, TechTemplate, ExecutiveTemplate, NordicTemplate,
  SalesTemplate, MedicalTemplate, FreshGradTemplate, SwissGridTemplate,
  DesignerTemplate, LegalTemplate, StartupTemplate, CompactOnePageTemplate
} from './templates/ExtraTemplates';

// --- API Helper with Fallback ---
const getApiUrl = async (model = 'gemini-3.5-flash') => {
  const key = await fetchGeminiApiKey();
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
};

// --- Main Application Component ---
export default function App() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('cv'); // 'cv', 'ats', 'coverLetter'
  
  // Auth & Storage States
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSavedCvsOpen, setIsSavedCvsOpen] = useState(false);
  const [isSavingCv, setIsSavingCv] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // CV Editing & Suggestions States
  const [editingCvId, setEditingCvId] = useState(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [suggestionsData, setSuggestionsData] = useState(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  useEffect(() => {
    getCurrentUser().then(user => setCurrentUser(user)).catch(() => {});
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });
    return () => subscription?.unsubscribe();
  }, []);

  const handleSaveCvToAccount = async () => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    setIsSavingCv(true);
    setSaveSuccessMsg('');
    try {
      if (editingCvId) {
        await updateUserCv(editingCvId, {
          title: `سيرة ذاتية - ${userData.personalInfo.fullName || 'جدير'}`,
          template: cvTemplate,
          language: cvLanguage,
          userData,
          generatedResult,
          coverLetter: generatedResult?.coverLetter || ''
        });
        setSaveSuccessMsg('تم تحديث السيرة الذاتية بنجاح في حسابك!');
      } else {
        const newCv = await saveUserCv({
          title: `سيرة ذاتية - ${userData.personalInfo.fullName || 'جدير'}`,
          template: cvTemplate,
          language: cvLanguage,
          userData,
          generatedResult,
          coverLetter: generatedResult?.coverLetter || ''
        });
        if (newCv?.id) setEditingCvId(newCv.id);
        setSaveSuccessMsg('تم حفظ السيرة الذاتية بنجاح في حسابك!');
      }
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      alert(err.message || 'حدث خطأ أثناء حفظ السيرة الذاتية');
    } finally {
      setIsSavingCv(false);
    }
  };

  const handleLoadSavedCv = (cv) => {
    setEditingCvId(cv.id);
    if (cv.user_data) setUserData(cv.user_data);
    if (cv.generated_result) setGeneratedResult(cv.generated_result);
    if (cv.template) setCvTemplate(cv.template);
    if (cv.language) setCvLanguage(cv.language);
    setSuggestionsData(null);
    setStep(4);
  };

  const safeJsonParse = (text) => {
    if (!text) return null;
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }
    try {
      return JSON.parse(cleaned);
    } catch (e1) {
      console.warn("JSON parse attempt 1 failed, sanitizing unescaped newlines:", e1.message);
      try {
        const sanitized = cleaned.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
          return match.replace(/\r?\n/g, '\\n').replace(/\t/g, '\\t');
        });
        return JSON.parse(sanitized);
      } catch (e2) {
        console.warn("JSON parse attempt 2 failed, extracting object substring:", e2.message);
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end > start) {
          const sub = cleaned.substring(start, end + 1).replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
            return match.replace(/\r?\n/g, '\\n').replace(/\t/g, '\\t');
          });
          return JSON.parse(sub);
        }
        throw e1;
      }
    }
  };

  const fetchWithRetry = async (payloadConfig, retries = 2) => {
    const models = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];
    let lastErr;
    for (const model of models) {
      const url = await getApiUrl(model);
      for (let i = 0; i < retries; i++) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadConfig)
          });
          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errText}`);
          }
          return await res.json();
        } catch (err) {
          lastErr = err;
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }
    throw lastErr;
  };

  const handleApplyKeyword = (keyword) => {
    if (!keyword) return;
    setUserData(prev => ({
      ...prev,
      skills: prev.skills ? (prev.skills.includes(keyword) ? prev.skills : `${prev.skills}, ${keyword}`) : keyword
    }));
    setGeneratedResult(prev => {
      if (!prev) return prev;
      const currentSkills = prev.tailoredSkills || [];
      const updatedTailoredSkills = currentSkills.includes(keyword)
        ? currentSkills
        : [...currentSkills, keyword];
      return {
        ...prev,
        tailoredSkills: updatedTailoredSkills
      };
    });
  };

  const handleApplyEnhancedExperience = (indexOrTitle, suggestedText) => {
    if (!suggestedText) return;
    setUserData(prev => {
      if (!prev.experiences || prev.experiences.length === 0) return prev;
      const newExps = [...prev.experiences];
      const idx = typeof indexOrTitle === 'number' ? indexOrTitle : 0;
      if (newExps[idx]) {
        newExps[idx] = { ...newExps[idx], description: suggestedText };
      }
      return { ...prev, experiences: newExps };
    });

    setGeneratedResult(prev => {
      if (!prev || !prev.tailoredExperiences) return prev;
      const newTailored = [...prev.tailoredExperiences];
      const idx = typeof indexOrTitle === 'number' ? indexOrTitle : 0;
      if (newTailored[idx]) {
        if (typeof newTailored[idx] === 'string') {
          newTailored[idx] = suggestedText;
        } else {
          newTailored[idx] = { ...newTailored[idx], description: suggestedText, bullets: [suggestedText] };
        }
      }
      return { ...prev, tailoredExperiences: newTailored };
    });
  };

  const handleGenerateSuggestions = async () => {
    setIsSuggestionsOpen(true);
    if (suggestionsData) return;

    setIsGeneratingSuggestions(true);
    const prompt = `
      أنت خبير توظيف ومحلل سير ذاتية ومستشار HR. قم بتحليل السيرة الذاتية التالية وتقديم تقييم واقتراحات تحسينية دقيقة بصيغة JSON.
      الاسم: ${userData.personalInfo.fullName || 'غير محدد'}
      المسمى: ${userData.personalInfo.title || 'غير محدد'}
      الملخص: ${generatedResult?.tailoredSummary || userData.summary || ''}
      الخبرات: ${JSON.stringify(userData.experiences || [])}
      المهارات: ${userData.skills || ''}
      الوظيفة المستهدفة: ${userData.jobDescription || ''}

      المطلوب إرجاع JSON بالهيكل التالي فقط:
      {
        "overallScore": 92,
        "overallSummary": "نص تقييمي لمستوى الجاهزية والجودة",
        "strengths": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3"],
        "recommendations": [
          { "title": "عنوان التوصية", "description": "شرح التوصية وكيفية تحسينها" }
        ],
        "suggestedKeywords": ["كلمة مفتاحية 1", "كلمة مفتاحية 2", "كلمة مفتاحية 3"],
        "enhancedExperiences": [
          { "originalTitle": "المسمى والشركة", "suggestedText": "صياغة احترافية محسنة بالأرقام والأثر" }
        ]
      }
    `;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192
      }
    };

    try {
      const res = await fetchWithRetry(payload);
      const text = res.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setSuggestionsData(safeJsonParse(text));
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء توليد التوصيات، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };
  
  // Extraction State
  const [rawCvText, setRawCvText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  
  // Downloading State
  const [isDownloading, setIsDownloading] = useState(null);

  // CV Options
  const [cvLanguage, setCvLanguage] = useState('ar');
  const [cvTemplate, setCvTemplate] = useState('formal'); 
  const [pageLimit, setPageLimit] = useState('auto'); // 'auto' or '1'
  const [cvScale, setCvScale] = useState(1);

  // References for Scaling
  const containerRef = useRef(null);
  const contentRef = useRef(null);

  // Cover Letter Options
  const [clLanguage, setClLanguage] = useState('ar');
  const [clTone, setClTone] = useState('formal');
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
  
  // Font Size Offset State (Direct Scaling Controls)
  const [fontSizeDelta, setFontSizeDelta] = useState(0);
  
  // User Data State
  const [userData, setUserData] = useState({
    personalInfo: { fullName: '', email: '', phone: '', location: '', title: '' },
    summary: '',
    experiences: [{ id: 1, company: '', role: '', startDate: '', endDate: '', description: '' }],
    education: [{ id: 1, institution: '', degree: '', year: '' }],
    skills: '',
    notes: '',
    jobDescription: ''
  });

  // AI Generated Data State
  const [generatedResult, setGeneratedResult] = useState(null);
  const [apiError, setApiError] = useState('');

  // Inject Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700&family=Tajawal:wght@400;500;700;800&family=Merriweather:ital,wght@0,400;0,700;1,400;1,700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  // --- Strict Auto Scaling Logic for "1 Page" mode ---
  useEffect(() => {
    if (pageLimit === 'auto') {
      setCvScale(1);
      return;
    }

    const updateScale = () => {
      if (!contentRef.current) return;
      
      const oldTransform = contentRef.current.style.transform;
      const oldHeight = contentRef.current.style.height;
      
      contentRef.current.style.transform = 'none';
      contentRef.current.style.height = 'auto';
      void contentRef.current.offsetHeight; 
      
      const rawHeight = contentRef.current.scrollHeight;
      const targetHeight = 1123; 
      
      let newScale = 1;
      if (rawHeight > targetHeight) {
        newScale = (targetHeight / rawHeight) * 0.98;
      }
      
      contentRef.current.style.transform = oldTransform;
      contentRef.current.style.height = oldHeight;
      
      setCvScale(newScale);
    };

    updateScale();
    
    const t1 = setTimeout(updateScale, 100); 
    const t2 = setTimeout(updateScale, 500); 
    const t3 = setTimeout(updateScale, 1500); 

    if (document.fonts) {
      document.fonts.ready.then(updateScale);
    }
    
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [pageLimit, generatedResult, cvTemplate, cvLanguage, activeTab, userData, fontSizeDelta]);

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

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setSelectedFiles(prev => {
      const newFiles = [...prev, ...files];
      if (newFiles.length > 9) {
        alert('عذراً، يمكنك إرفاق 9 ملفات أو صور كحد أقصى.');
        return newFiles.slice(0, 9);
      }
      return newFiles;
    });
    e.target.value = null; 
  };

  const removeSelectedFile = (indexToRemove) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleCombinedExtraction = async () => {
    if (selectedFiles.length === 0 && !rawCvText.trim()) return;
    
    setIsExtracting(true);
    setApiError('');

    try {
      const prompt = `
        أنت خبير في الموارد البشرية. قم باستخراج بيانات السيرة الذاتية والخبرات بدقة من المدخلات المرفقة أدناه.
        ملاحظة هامة: قد يكون هناك عدة ملفات مرفقة (صور أو مستندات)، وقد يكون هناك نص مدخل، أو كلاهما. 
        يرجى قراءة جميع المرفقات والنصوص، ودمج البيانات بذكاء لاستخراج المعلومات الشاملة بدون تكرار.
        إذا لم تجد معلومة معينة، اتركها فارغة. تجاهل أي نصوص نائبة (Placeholders) مثل [Date]. المهارات اجعلها نصاً واحداً مفصولاً بفواصل.
        ${userData.notes ? `\nتوجيهات وملاحظات هامة من المستخدم يجب مراعاتها بدقة أثناء الاستخراج:\n${userData.notes}\n` : ''}
      `;

      let parts = [{ text: prompt }];

      if (rawCvText.trim()) {
        parts.push({ text: "--- النص المدخل الإضافي ---\n" + rawCvText });
      }

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
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
            parts.push({ text: `\n--- محتوى الملف المرفق (${file.name}) ---\n` + result.value });
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
            parts.push({ 
              inline_data: { mime_type: mimeType, data: base64String } 
            });
          }
        }
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
          maxOutputTokens: 8192
        }
      };

      const result = await fetchWithRetry(payload);

      const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textResponse) {
        const parsedData = safeJsonParse(textResponse);
        
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
        
        setRawCvText('');
        setSelectedFiles([]);
      } else {
        throw new Error("No response generated");
      }
    } catch (err) {
      console.error(err);
      setApiError('فشل استخراج البيانات. يرجى التأكد من وضوح المحتوى المرفق والمحاولة مرة أخرى.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddMissingSkill = (skill) => {
    setUserData(prev => ({
      ...prev,
      skills: prev.skills ? `${prev.skills}, ${skill}` : skill
    }));

    setGeneratedResult(prev => {
      if (!prev) return prev;
      const updatedTailoredSkills = prev.tailoredSkills && !prev.tailoredSkills.includes(skill) 
        ? [...prev.tailoredSkills, skill] 
        : prev.tailoredSkills || [skill];

      return {
        ...prev,
        missingKeywords: prev.missingKeywords.filter(k => k !== skill),
        matchedKeywords: [...prev.matchedKeywords, skill],
        tailoredSkills: updatedTailoredSkills,
        atsScore: Math.min(100, prev.atsScore + 3)
      };
    });
  };

  // --- Strict Print Handler ---
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
              @page { size: A4 portrait; margin: 0; }
              html, body { 
                margin: 0 !important; 
                padding: 0 !important; 
                background: white !important; 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important; 
              }
              
              /* قفل الصفحة الواحدة بقوة لمنع المتصفح من توليد أي صفحة ثانية */
              ${pageLimit === '1' ? `
                html, body {
                  width: 210mm !important;
                  height: 297mm !important;
                  max-height: 297mm !important;
                  overflow: hidden !important;
                }
                #print-wrapper {
                  width: 210mm !important;
                  height: 297mm !important;
                  max-height: 297mm !important;
                  overflow: hidden !important;
                  page-break-after: avoid !important;
                  page-break-before: avoid !important;
                  page-break-inside: avoid !important;
                }
              ` : `
                #print-wrapper {
                  width: 210mm !important;
                  min-height: 297mm;
                  height: auto;
                }
              `}

              h1, h2, h3, h4, h5, h6 { page-break-after: avoid; break-after: avoid; }
              .experience-block, .education-block, .skills-block { 
                page-break-inside: avoid; 
                break-inside: avoid; 
              }
            </style>
          </head>
          <body>
            <div id="print-wrapper">
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

  const handleDownloadDocx = () => {
    setIsDownloading('doc');
    const printArea = document.getElementById('cv-print-area');
    if (!printArea) {
      setIsDownloading(null);
      return;
    }

    alert("تنبيه مهم: يرجى فتح الملف المحمل باستخدام برنامج (Microsoft Word) حصراً للحفاظ على التنسيق.\nملاحظة: خيار (صفحة واحدة) مخصص للـ PDF فقط، الوورد سيمتد طبيعياً للحفاظ على جودة النص عند التعديل.");

    const clonedArea = printArea.cloneNode(true);
    clonedArea.style.transform = 'none';
    clonedArea.style.overflow = 'visible';
    clonedArea.style.height = 'auto';
    clonedArea.style.maxHeight = 'none';
    
    const firstChild = clonedArea.firstElementChild;
    if (firstChild) {
      firstChild.style.transform = 'none';
      firstChild.style.overflow = 'visible';
      firstChild.style.height = 'auto';
      firstChild.style.maxHeight = 'none';
    }

    const pName = generatedResult?.translatedPersonalInfo?.fullName || userData.personalInfo.fullName;

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40' dir="${cvLanguage === 'en' ? 'ltr' : 'rtl'}">
        <head>
          <meta charset='utf-8'>
          <title>CV_${pName || 'Jadeer'}</title>
          <style>
            @page WordSection1 { size: 595.3pt 841.9pt; margin: 1.0in; }
            div.WordSection1 { page: WordSection1; }
            body { font-family: ${cvLanguage === 'en' ? 'Arial, sans-serif' : 'Arial, Tahoma, sans-serif'}; }
            p, div, li, h1, h2, h3, h4, h5, h6, span {
              text-align: ${cvLanguage === 'en' ? 'left' : 'right'} !important;
            }
          </style>
        </head>
        <body>
          <div class="WordSection1">
            ${clonedArea.innerHTML}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
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
    setClLanguage(targetLang); 

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
      ملاحظات إضافية وتوجيهات من المستخدم: ${userData.notes}
      
      وصف الوظيفة المستهدفة:
      ${userData.jobDescription}

      المطلوب منك تحليل الوظيفة ومطابقتها مع بيانات المستخدم، ثم توليد البيانات التالية لإنشاء سيرة ذاتية مثالية.
      هام جداً: قم بترجمة كافة المدخلات والبيانات (البيانات الشخصية، الملخص، الإنجازات، المهارات، التعليم وغيرها) إلى اللغة ${targetLang === 'en' ? 'الإنجليزية (English)' : 'العربية (Arabic)'} بأسلوب احترافي جداً ورسمي.
      يجب أيضاً إزالة وتجاهل أي نصوص نائبة (Placeholders) واستبدالها بقيمة فارغة ("").

      1. ترجمة البيانات الشخصية (الاسم، المسمى، الموقع) إلى اللغة المطلوبة.
      2. إعادة صياغة الملخص المهني (summary) ليكون أكثر جاذبية وتوافقاً مع الوظيفة.
      3. تحسين صياغة وصف كل خبرة مهنية (experiences) في نقاط (bullets) احترافية (حد أقصى 3 نقاط).
      4. ترجمة وتنقيح بيانات التعليم (education) وتنسيقها.
      5. دمج مهارات المستخدم الحالية مع الكلمات المفتاحية وترجمتها إلى قائمة.
      6. حساب نسبة توافق السيرة مع الوظيفة (atsScore) من 0 إلى 100.
      7. تحديد الكلمات المفتاحية الموجودة والمفقودة.
      8. كتابة خطاب تقديم احترافي وقصير.

      يجب أن يكون الرد بصيغة JSON فقط، وبشكل حصري باللغة ${targetLang === 'en' ? 'الإنجليزية' : 'العربية'}.
    `;

    const schema = {
      type: "OBJECT",
      properties: {
        translatedPersonalInfo: {
          type: "OBJECT",
          properties: {
            fullName: { type: "STRING" },
            title: { type: "STRING" },
            location: { type: "STRING" }
          }
        },
        tailoredSummary: { type: "STRING" },
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
        tailoredSkills: { type: "ARRAY", items: { type: "STRING" } },
        atsScore: { type: "INTEGER" },
        matchedKeywords: { type: "ARRAY", items: { type: "STRING" } },
        missingKeywords: { type: "ARRAY", items: { type: "STRING" } },
        coverLetter: { type: "STRING" }
      },
      required: ["translatedPersonalInfo", "tailoredSummary", "tailoredExperiences", "tailoredEducation", "tailoredSkills", "atsScore", "matchedKeywords", "missingKeywords", "coverLetter"]
    };

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { 
        responseMimeType: "application/json", 
        responseSchema: schema,
        maxOutputTokens: 8192
      }
    };

    try {
      const data = await fetchWithRetry(payload);
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textResponse) {
        setGeneratedResult(safeJsonParse(textResponse));
        setStep(4);
      } else {
        throw new Error("No response");
      }
    } catch (err) {
      console.error(err);
      setApiError('حدث خطأ أثناء معالجة البيانات، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateCoverLetter = async () => {
    setIsGeneratingCL(true);
    const toneDescription = clTone === 'formal' ? 'رسمي واحترافي جداً' : clTone === 'concise' ? 'دقيق وموجز' : clTone === 'enthusiastic' ? 'حماسي وشغوف' : 'واثق وجريء';
    
    const prompt = `
      أنت خبير موارد بشرية. قم بكتابة خطاب تقديم (Cover Letter) مخصص وممتاز بناءً على البيانات التالية.
      الاسم: ${generatedResult?.translatedPersonalInfo?.fullName || userData.personalInfo.fullName}
      المسمى الوظيفي: ${generatedResult?.translatedPersonalInfo?.title || userData.personalInfo.title}
      ملخص عني: ${generatedResult?.tailoredSummary}
      الوظيفة المستهدفة: ${userData.jobDescription}
      
      المطلوب:
      كتابة خطاب تقديم باللغة ${clLanguage === 'en' ? 'الإنجليزية (English)' : 'العربية (Arabic)'}.
      يجب أن يكون الأسلوب: ${toneDescription}.
      الرد بصيغة JSON: {"coverLetter": "نص الخطاب"}
    `;

    const clPayload = { 
      contents: [{ parts: [{ text: prompt }] }], 
      generationConfig: { 
        responseMimeType: "application/json", 
        responseSchema: { type: "OBJECT", properties: { coverLetter: { type: "STRING" } }, required: ["coverLetter"] },
        maxOutputTokens: 8192
      } 
    };

    try {
      const data = await fetchWithRetry(clPayload);
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textResponse) {
        const parsedCL = safeJsonParse(textResponse);
        if (parsedCL?.coverLetter) {
          setGeneratedResult(prev => ({ ...prev, coverLetter: parsedCL.coverLetter }));
        }
      }
    } catch (err) {
      alert('حدث خطأ أثناء صياغة الخطاب.');
    } finally {
      setIsGeneratingCL(false);
    }
  };

  // --- Sub-components rendering ---

  const renderStep1 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl shadow-sm border border-emerald-100 flex flex-col text-center">
        <h2 className="text-xl font-bold text-emerald-800 mb-2">استخراج البيانات الذكي</h2>
        <p className="text-gray-600 mb-5 text-sm">يمكنك رفع ملف (سيرة ذاتية أو صور)، أو لصق نص، <span className="font-bold">أو استخدامهما معاً</span> ليقوم الذكاء الاصطناعي بدمجها واستخراج بياناتك تلقائياً.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-5">
          <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 transition-colors rounded-xl p-4 flex flex-col items-center justify-center bg-white relative min-h-[160px]">
            {selectedFiles.length > 0 && (
              <div className="w-full flex flex-wrap gap-2 mb-4 justify-center">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 max-w-[140px]">
                    <span className="truncate" dir="ltr">{file.name}</span>
                    <button onClick={() => removeSelectedFile(index)} className="text-red-500 hover:text-red-700 bg-red-50 rounded-full p-0.5"><X className="w-3 h-3"/></button>
                  </div>
                ))}
              </div>
            )}
            
            {selectedFiles.length < 9 && (
              <>
                {selectedFiles.length === 0 && <Upload className="w-10 h-10 text-emerald-400 mb-3"/>}
                <span className="text-sm text-gray-600 font-medium mb-3">
                  {selectedFiles.length === 0 ? 'ارفع السيرة الذاتية أو صور الشهادات' : 'إضافة ملفات أخرى (الحد 9)'}
                </span>
                <input 
                  type="file" 
                  id="cv-upload" 
                  accept=".pdf,.png,.jpg,.jpeg,.docx,application/pdf,image/png,image/jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                  className="hidden" 
                  multiple
                  onChange={handleFileSelect} 
                  disabled={isExtracting} 
                />
                <label 
                  htmlFor="cv-upload" 
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-colors shadow-sm"
                >
                  اختيار ملفات
                </label>
              </>
            )}
          </div>

          <div className="flex flex-col h-full min-h-[160px]">
            <textarea 
              value={rawCvText} 
              onChange={(e) => setRawCvText(e.target.value)} 
              placeholder="...أو الصق بياناتك من مسودة، لينكد إن، أو أي نص آخر هنا" 
              className="w-full h-full p-4 border-2 border-emerald-100 rounded-xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all text-right shadow-inner bg-white text-sm resize-none"
              disabled={isExtracting}
            />
          </div>
        </div>

        <div className="w-full text-right mb-5">
          <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center"><FileText className="ml-1 w-4 h-4 text-emerald-600"/> ملاحظات وتوجيهات للذكاء الاصطناعي (اختياري)</h3>
          <textarea 
            value={userData.notes} 
            onChange={(e) => setUserData({...userData, notes: e.target.value})} 
            placeholder="أضف أي توجيهات هنا... (مثال: ركز على مهاراتي في الإدارة، اختصر الخبرات القديمة، أضف شهادة PMP لم أذكرها بالملف...)" 
            className="w-full p-3 border-2 border-emerald-100 rounded-xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 outline-none min-h-[80px] text-sm resize-y shadow-inner bg-white transition-all"
            disabled={isExtracting}
          />
        </div>

        <button 
          onClick={handleCombinedExtraction} 
          disabled={isExtracting || (selectedFiles.length === 0 && !rawCvText.trim())}
          className="bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white px-10 py-3.5 rounded-xl font-bold flex items-center justify-center transition-all shadow-md hover:shadow-lg w-full md:w-auto mx-auto"
        >
          {isExtracting ? (
            <><Wand2 className="w-5 h-5 ml-2 animate-pulse"/> جاري تحليل البيانات ودمجها...</>
          ) : (
            <><Wand2 className="w-5 h-5 ml-2"/> استخراج البيانات الذكي</>
          )}
        </button>

        {apiError && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center text-sm font-bold w-full max-w-md mx-auto">
            <AlertCircle className="w-4 h-4 ml-2 flex-shrink-0"/> {apiError}
          </div>
        )}
      </div>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">أو راجع بياناتك يدوياً</span>
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
        {userData.experiences.map((exp) => (
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
          className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none min-h-[250px] leading-relaxed resize-y mb-6" 
        />

        <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center"><FileText className="ml-2 w-5 h-5 text-emerald-600"/> توجيهات السيرة الذاتية (اختياري)</h3>
        <p className="text-gray-500 text-sm mb-4">هذه ملاحظاتك السابقة، يمكنك تركها كما هي أو تعديلها لتركز أكثر على هذه الوظيفة تحديداً:</p>
        <textarea 
          value={userData.notes} 
          onChange={(e) => setUserData({...userData, notes: e.target.value})} 
          placeholder="أضف ملاحظاتك هنا..." 
          className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none min-h-[100px] leading-relaxed resize-y" 
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

    const pName = generatedResult.translatedPersonalInfo?.fullName || userData.personalInfo.fullName;
    const pTitle = generatedResult.translatedPersonalInfo?.title || userData.personalInfo.title;
    const pLoc = generatedResult.translatedPersonalInfo?.location || userData.personalInfo.location;

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

          {/* Controls: Template & Language & Page Layout (Only for CV Tab) */}
          {activeTab === 'cv' && (
            <div className="flex flex-wrap gap-2 justify-center bg-gray-50 p-1.5 rounded-xl border border-gray-100">
              {/* Templates Selector Dropdown */}
              <div className="flex flex-wrap items-center justify-center bg-white p-1 rounded-lg border border-gray-100 shadow-sm gap-1">
                <select
                  value={cvTemplate}
                  onChange={(e) => setCvTemplate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200 outline-none cursor-pointer"
                >
                  <option value="formal">📋 رسمي (Formal)</option>
                  <option value="harvard">🏛️ هارفارد القياسي (Harvard Academic)</option>
                  <option value="tech">💻 التقني والمبرمجين (Tech Stack)</option>
                  <option value="executive">💼 التنفيذي والقيادي (Executive)</option>
                  <option value="nordic">🌿 الشمالي البسيط (Nordic)</option>
                  <option value="sales">📊 المبيعات والنمو (Sales & KPIs)</option>
                  <option value="medical">🩺 الطبي والصحي (Medical)</option>
                  <option value="freshgrad">🎓 حديثي التخرج (Fresh Grad)</option>
                  <option value="swiss">📐 السويسري الشبكي (Swiss Grid)</option>
                  <option value="designer">🎨 المصممين والفن (Designer)</option>
                  <option value="legal">⚖️ القانوني والاستشاري (Legal)</option>
                  <option value="startup">🚀 الشركات الناشئة (Startup)</option>
                  <option value="compact">📑 صفحة واحدة مكثفة (Compact 1-Page)</option>
                  <option value="classic">كلاسيكي (Classic)</option>
                  <option value="modern">عصري (Modern)</option>
                  <option value="minimal">بسيط (Minimal)</option>
                  <option value="professional">احترافي (Professional)</option>
                  <option value="creative">إبداعي (Creative)</option>
                  <option value="elegant">أنيق (Elegant)</option>
                  <option value="corporate">شركات (Corporate)</option>
                </select>
              </div>

              {/* Language & Page Layout */}
              <div className="flex bg-white p-1 rounded-lg border border-gray-100 shadow-sm gap-1 items-center">
                <div className="flex border-l border-gray-200 pl-2 pr-1">
                  <button onClick={() => setPageLimit('auto')} className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${pageLimit === 'auto' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}>متعدد الصفحات</button>
                  <button onClick={() => setPageLimit('1')} className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${pageLimit === '1' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}>صفحة واحدة</button>
                </div>
                <div className="flex pr-1 border-l border-gray-200 pl-2">
                  <button onClick={() => { if(cvLanguage !== 'ar') generateCV('ar') }} className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${cvLanguage === 'ar' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}><Globe className="w-3 h-3"/> العربية</button>
                  <button onClick={() => { if(cvLanguage !== 'en') generateCV('en') }} className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${cvLanguage === 'en' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}><Globe className="w-3 h-3"/> English</button>
                </div>

                {/* Direct Font Size Controls */}
                <div className="flex items-center gap-1 pr-1 font-sans">
                  <span className="text-[11px] font-bold text-gray-500">الخط:</span>
                  <button 
                    onClick={() => setFontSizeDelta(prev => Math.max(-3, prev - 1))} 
                    className="px-2 py-0.5 text-xs font-black rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    title="تصغير الخط"
                  >
                    A-
                  </button>
                  <span className="text-[11px] font-extrabold text-emerald-700 min-w-[20px] text-center">
                    {fontSizeDelta > 0 ? `+${fontSizeDelta}` : fontSizeDelta}
                  </span>
                  <button 
                    onClick={() => setFontSizeDelta(prev => Math.min(5, prev + 1))} 
                    className="px-2 py-0.5 text-xs font-black rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    title="تكبير الخط"
                  >
                    A+
                  </button>
                  {fontSizeDelta !== 0 && (
                    <button 
                      onClick={() => setFontSizeDelta(0)} 
                      className="text-[10px] text-gray-400 hover:text-red-500 underline pr-1"
                    >
                      إعادة
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={handleGenerateSuggestions}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center shadow-md transition-all gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>اقتراحات الذكاء الاصطناعي</span>
            </button>

            <button 
              onClick={() => setStep(1)} 
              className="px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>تعديل البيانات</span>
            </button>

            {activeTab === 'cv' && (
              <>
                <button onClick={handleSaveCvToAccount} disabled={isSavingCv} className="bg-teal-600 hover:bg-teal-700 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold flex items-center transition-colors shadow-sm disabled:opacity-50 gap-1.5">
                  {isSavingCv ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> <span>جاري الحفظ...</span></>
                  ) : (
                    <><Save className="w-4 h-4"/> <span>{editingCvId ? 'تحديث السيرة الذاتية' : 'حفظ في حسابي'}</span></>
                  )}
                </button>
                <button onClick={handleDownloadDocx} disabled={!!isDownloading} className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold flex items-center transition-colors shadow-sm disabled:opacity-50 gap-1.5">
                  {isDownloading === 'doc' ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> <span>جاري...</span></>
                  ) : (
                    <><FileText className="w-4 h-4"/> <span className="hidden md:inline">Word</span></>
                  )}
                </button>
                <button onClick={handlePrint} disabled={!!isDownloading} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold flex items-center transition-colors shadow-sm disabled:opacity-50 gap-1.5">
                  {isDownloading === 'pdf' ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> <span>جاري...</span></>
                  ) : (
                    <><Download className="w-4 h-4"/> <span className="hidden md:inline">PDF</span></>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="min-h-[600px]">
          
          {/* CV Tab */}
          <div className={activeTab === 'cv' ? 'block overflow-x-auto pb-8 relative' : 'hidden'}>
            
            {/* The Smart CV Wrapper container */}
            <div 
              id="cv-print-area" 
              ref={containerRef}
              className="mx-auto bg-white shadow-lg relative transition-all" 
              style={{ 
                width: '210mm', 
                minHeight: '297mm',
                height: pageLimit === '1' ? '297mm' : 'auto',
                overflow: pageLimit === '1' ? 'hidden' : 'visible'
              }}
            >
              
              {/* Scalable Inner Content Wrapper */}
              <div 
                ref={contentRef}
                className="w-full bg-white min-h-[297mm] flex flex-col justify-between"
                style={{
                  transform: pageLimit === '1' ? `scale(${cvScale})` : 'none',
                  transformOrigin: 'top center',
                  zoom: Math.max(0.7, 1 + fontSizeDelta * 0.07),
                }}
              >
              
              {/* Template 1: Classic */}
              {cvTemplate === 'classic' && (
                <div className={`w-full min-h-[297mm] h-full flex flex-col justify-between p-8 md:p-10 ${cvLanguage === 'en' ? 'text-left' : 'text-right'}`} dir={cvLanguage === 'en' ? 'ltr' : 'rtl'} style={{fontFamily: getFontFamily('classic')}}>
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
                      <div key={i} className="mb-3.5 experience-block">
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
                    <div className="mb-5 education-block">
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
                    <div className="mb-2 skills-block">
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
                <div className={`w-full min-h-[297mm] h-full flex flex-col justify-between ${cvLanguage === 'en' ? 'text-left' : 'text-right'}`} dir={cvLanguage === 'en' ? 'ltr' : 'rtl'} style={{fontFamily: getFontFamily('modern')}}>
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
                          <div key={i} className={`mb-5 experience-block relative border-emerald-200 ${cvLanguage === 'en' ? 'border-l-2 pl-4' : 'border-r-2 pr-4'}`}>
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
                      <div className="mb-6 skills-block">
                        <h3 className="text-[15px] font-bold text-slate-800 mb-3 flex items-center gap-2"><Code className="w-4 h-4 text-emerald-600"/> {cvLanguage === 'en' ? 'Skills' : 'المهارات'}</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {generatedResult.tailoredSkills && generatedResult.tailoredSkills.map((skill, i) => (
                            <span key={i} className="bg-white border border-slate-200 text-slate-800 px-2.5 py-1 rounded-md text-[12px] font-bold w-full text-center shadow-sm">{skill}</span>
                          ))}
                        </div>
                      </div>

                      {generatedResult.tailoredEducation && generatedResult.tailoredEducation.length > 0 && (
                        <div className="education-block">
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
                <div className={`w-full min-h-[297mm] h-full flex flex-col justify-between p-10 md:p-14 ${cvLanguage === 'en' ? 'text-left' : 'text-right'}`} dir={cvLanguage === 'en' ? 'ltr' : 'rtl'} style={{fontFamily: getFontFamily('minimal')}}>
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
                      <div key={i} className="mb-6 experience-block grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <div className="education-block">
                      <h3 className="text-[12px] font-bold text-gray-400 mb-4 uppercase tracking-widest">{cvLanguage === 'en' ? 'Education' : 'التعليم'}</h3>
                      {generatedResult.tailoredEducation && generatedResult.tailoredEducation.map((edu, i) => (
                        <div key={i} className="mb-3">
                          {edu.degree && <span className="font-bold text-gray-900 text-[13px] block">{edu.degree}</span>}
                          {edu.institution && <span className="text-[12px] font-medium text-gray-600">{edu.institution}</span>}
                          {edu.year && <span className={`text-[11px] font-bold text-gray-400 ${cvLanguage === 'en' ? 'ml-2' : 'mr-2'}`}>{edu.year}</span>}
                        </div>
                      ))}
                    </div>
                    
                    <div className="skills-block">
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
                <div className={`w-full ${pageLimit === '1' ? '' : 'min-h-[297mm]'} flex flex-col overflow-hidden ${cvLanguage === 'en' ? 'text-left' : 'text-right'}`} dir={cvLanguage === 'en' ? 'ltr' : 'rtl'} style={{fontFamily: getFontFamily('professional')}}>
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
                        <div key={i} className="mb-4 experience-block">
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
                        <div className="education-block">
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
                        <div className="skills-block">
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
                <div className={`w-full ${pageLimit === '1' ? '' : 'min-h-[297mm]'} flex flex-col md:flex-row ${cvLanguage === 'en' ? 'text-left' : 'text-right'}`} dir={cvLanguage === 'en' ? 'ltr' : 'rtl'} style={{fontFamily: getFontFamily('creative')}}>
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
                      <div className="mb-8 education-block">
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
                      <div className="skills-block">
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
                          <div key={i} className={`relative experience-block ${cvLanguage === 'en' ? 'pl-5 border-l-2' : 'pr-5 border-r-2'} border-gray-200`}>
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
                <div className={`w-full ${pageLimit === '1' ? '' : 'min-h-[297mm]'} p-10 md:p-14 ${cvLanguage === 'en' ? 'text-left' : 'text-right'}`} dir={cvLanguage === 'en' ? 'ltr' : 'rtl'} style={{fontFamily: getFontFamily('elegant')}}>
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
                      <div key={i} className="mb-4 experience-block">
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
                    <div className="mb-6 education-block">
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
                    <div className="skills-block">
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
                <div className={`w-full min-h-[297mm] h-full flex flex-col justify-between p-10 md:p-14 ${cvLanguage === 'en' ? 'text-left' : 'text-right'}`} dir={cvLanguage === 'en' ? 'ltr' : 'rtl'} style={{fontFamily: getFontFamily('formal')}}>
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
                          <div key={i} className="mb-4 experience-block">
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
                    <div className="education-block">
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
                    </div>
                  )}

                  {/* Skills Section */}
                  {generatedResult.tailoredSkills && generatedResult.tailoredSkills.length > 0 && (
                    <div className="skills-block">
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
                    </div>
                  )}
                </div>
              )}

              {/* New Trending & HR Templates with Font Size Delta */}
              {cvTemplate === 'harvard' && <HarvardTemplate userData={userData} generatedResult={generatedResult} isEn={cvLanguage === 'en'} font={getFontFamily('formal')} fontSizeDelta={fontSizeDelta} />}
              {cvTemplate === 'tech' && <TechTemplate userData={userData} generatedResult={generatedResult} isEn={cvLanguage === 'en'} font={getFontFamily('modern')} fontSizeDelta={fontSizeDelta} />}
              {cvTemplate === 'executive' && <ExecutiveTemplate userData={userData} generatedResult={generatedResult} isEn={cvLanguage === 'en'} font={getFontFamily('formal')} fontSizeDelta={fontSizeDelta} />}
              {cvTemplate === 'nordic' && <NordicTemplate userData={userData} generatedResult={generatedResult} isEn={cvLanguage === 'en'} font={getFontFamily('minimal')} fontSizeDelta={fontSizeDelta} />}
              {cvTemplate === 'sales' && <SalesTemplate userData={userData} generatedResult={generatedResult} isEn={cvLanguage === 'en'} font={getFontFamily('modern')} fontSizeDelta={fontSizeDelta} />}
              {cvTemplate === 'medical' && <MedicalTemplate userData={userData} generatedResult={generatedResult} isEn={cvLanguage === 'en'} font={getFontFamily('professional')} fontSizeDelta={fontSizeDelta} />}
              {cvTemplate === 'freshgrad' && <FreshGradTemplate userData={userData} generatedResult={generatedResult} isEn={cvLanguage === 'en'} font={getFontFamily('modern')} fontSizeDelta={fontSizeDelta} />}
              {cvTemplate === 'swiss' && <SwissGridTemplate userData={userData} generatedResult={generatedResult} isEn={cvLanguage === 'en'} font={getFontFamily('minimal')} fontSizeDelta={fontSizeDelta} />}
              {cvTemplate === 'designer' && <DesignerTemplate userData={userData} generatedResult={generatedResult} isEn={cvLanguage === 'en'} font={getFontFamily('creative')} fontSizeDelta={fontSizeDelta} />}
              {cvTemplate === 'legal' && <LegalTemplate userData={userData} generatedResult={generatedResult} isEn={cvLanguage === 'en'} font={getFontFamily('formal')} fontSizeDelta={fontSizeDelta} />}
              {cvTemplate === 'startup' && <StartupTemplate userData={userData} generatedResult={generatedResult} isEn={cvLanguage === 'en'} font={getFontFamily('modern')} fontSizeDelta={fontSizeDelta} />}
              {cvTemplate === 'compact' && <CompactOnePageTemplate userData={userData} generatedResult={generatedResult} isEn={cvLanguage === 'en'} font={getFontFamily('classic')} fontSizeDelta={fontSizeDelta} />}

              {/* Template 8: Corporate */}
              {cvTemplate === 'corporate' && (
                <div className={`w-full min-h-[297mm] h-full flex flex-col justify-between p-10 md:p-14 ${cvLanguage === 'en' ? 'text-left' : 'text-right'}`} dir={cvLanguage === 'en' ? 'ltr' : 'rtl'} style={{fontFamily: getFontFamily('corporate')}}>
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
                        <div key={i} className="mb-4 experience-block">
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
                    <div className="w-full mb-6 education-block">
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
                    <div className="w-full mb-6 skills-block">
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
          </div>

          {/* Cover Letter Tab */}
          <div className={activeTab === 'coverLetter' ? 'block' : 'hidden'}>
            
            <div className="mb-6 bg-gray-50 border border-gray-100 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-700"><Globe className="w-4 h-4 inline ml-1"/>لغة الخطاب:</span>
                  <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    <button onClick={() => setClLanguage('ar')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${clLanguage === 'ar' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}>العربية</button>
                    <button onClick={() => setClLanguage('en')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${clLanguage === 'en' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}>English</button>
                  </div>
                </div>

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
                        <li key={i} className="flex items-center justify-between text-rose-700 text-sm font-bold bg-white px-3 py-2 rounded shadow-sm border border-rose-50 hover:border-rose-200 transition-colors">
                          <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-rose-400 ml-2"></span> {kw}
                          </div>
                          <button 
                            onClick={() => handleAddMissingSkill(kw)}
                            className="text-xs bg-rose-50 hover:bg-emerald-50 hover:text-emerald-700 text-rose-600 px-2 py-1 rounded transition-colors flex items-center gap-1"
                            title="إضافة المهارة للسيرة الذاتية"
                          >
                            <Plus className="w-3 h-3" /> إضافة
                          </button>
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

          {/* Auth & User Controls */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSavedCvsOpen(true)}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-emerald-200 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  سيري المحفوظة
                </button>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0]}</span>
                </div>
                <button
                  onClick={async () => {
                    await signOutUser();
                    setCurrentUser(null);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1.5 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  خروج
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <LogIn className="w-4 h-4" />
                تسجيل الدخول / حساب جديد
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onAuthSuccess={(user) => setCurrentUser(user)}
      />

      <SavedCvsModal 
        isOpen={isSavedCvsOpen} 
        onClose={() => setIsSavedCvsOpen(false)} 
        onLoadCv={handleLoadSavedCv}
      />

      <CvSuggestionsModal
        isOpen={isSuggestionsOpen}
        onClose={() => setIsSuggestionsOpen(false)}
        suggestions={suggestionsData}
        isLoading={isGeneratingSuggestions}
        onApplyKeyword={handleApplyKeyword}
        onApplyEnhancedExperience={handleApplyEnhancedExperience}
      />

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
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

        {!isLoading && step === 1 && renderStep1()}
        {!isLoading && step === 2 && renderStep2()}
        {!isLoading && step === 3 && renderStep3()}
        {!isLoading && step === 4 && renderResults()}

      </main>
    </div>
  );
}