/**
 * ============================================================================
 * 🔒 [PROTECTED EXTRACTION SYSTEM - VERSION 1.0]
 * ⚠️  ممنوع التعديل على هذا الملف أو على نظام الاستخراج المحفوظ هنا!
 * ⚠️  DO NOT MODIFY THIS EXTRACTION SYSTEM - IT IS LOCKED AS STABLE VERSION 1.0
 * ============================================================================
 * 
 * تاريخ الحفظ: 2026-07-26
 * الوصف: نظام استخراج البيانات من ملفات PDF / Image / DOCX باستخدام نموذج Gemini API و Mammoth.
 */

export const EXTRACTION_SYSTEM_VERSION = "1.0.0";
export const IS_EXTRACTION_SYSTEM_LOCKED = true;

/**
 * Extraction Schema Definition (Version 1.0 Baseline)
 */
export const EXTRACTION_SCHEMA_V1 = {
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

/**
 * Extraction Prompt Baseline (Version 1.0)
 */
export const EXTRACTION_PROMPT_V1 = `
  أنت خبير في الموارد البشرية. قم باستخراج بيانات السيرة الذاتية المرفقة بدقة.
  إذا لم تجد معلومة معينة، اتركها فارغة. تجاهل أي نصوص نائبة (Placeholders) مثل [Date] أو [اسم الجامعة] ولا تقم باستخراجها. المهارات اجعلها نصاً واحداً مفصولاً بفواصل.
`;

/**
 * Core PDF / Image / DOCX Extraction Handler (Version 1.0 Baseline)
 * 🔒 DO NOT EDIT OR ALTER THIS LOGIC
 */
export async function executeExtractionV1({ file, fetchWithRetry, setIsExtracting, setApiError, setUserData, userData }) {
  if (!file) return;

  setIsExtracting(true);
  setApiError('');

  try {
    const prompt = EXTRACTION_PROMPT_V1;
    let parts = [{ text: prompt }];

    // DOCX parsing via Mammoth
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
    // PDF / Images via Base64 inline data
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

    const payload = {
      contents: [{ parts: parts }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: EXTRACTION_SCHEMA_V1,
        maxOutputTokens: 8192
      }
    };

    const result = await fetchWithRetry(payload);

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
      throw new Error("No response generated from AI.");
    }
  } catch (err) {
    console.error(err);
    setApiError('فشل استخراج البيانات. يرجى التأكد من وضوح المحتوى المرفق والمحاولة مرة أخرى.');
  } finally {
    setIsExtracting(false);
  }
}
