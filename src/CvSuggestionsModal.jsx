import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, TrendingUp, Lightbulb, Award, ArrowRight, Plus, Check } from 'lucide-react';

export default function CvSuggestionsModal({ isOpen, onClose, suggestions, isLoading, onApplyKeyword, onApplyEnhancedExperience }) {
  const [appliedKws, setAppliedKws] = useState({});
  const [appliedExps, setAppliedExps] = useState({});

  if (!isOpen) return null;

  const handleKwClick = (kw) => {
    if (onApplyKeyword) {
      onApplyKeyword(kw);
      setAppliedKws(prev => ({ ...prev, [kw]: true }));
    }
  };

  const handleExpClick = (idx, item) => {
    if (onApplyEnhancedExperience) {
      onApplyEnhancedExperience(idx, item.suggestedText);
      setAppliedExps(prev => ({ ...prev, [idx]: true }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-emerald-600 p-6 text-white text-right relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md shadow-inner">
              <Sparkles className="w-7 h-7 text-amber-200 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black flex items-center gap-2">
                اقتراحات وتوصيات الذكاء الاصطناعي
              </h2>
              <p className="text-xs text-amber-100 mt-0.5">تحليل وتطوير السيرة الذاتية لزيادة فرص قبولك الوظيفي وتجاوز أنظمة ATS</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
                <Sparkles className="w-6 h-6 text-amber-600 absolute inset-0 m-auto animate-bounce" />
              </div>
              <h3 className="text-base font-bold text-slate-800">جاري تمحيص وتطوير سيرتك الذاتية...</h3>
              <p className="text-xs text-slate-500 max-w-sm">يقوم الذكاء الاصطناعي بمقارنة سيرتك الذاتية مع أفضل معايير التوظيف وكتابة المقترحات التحسينية.</p>
            </div>
          ) : !suggestions ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">لم يتم توليد مقترحات بعد.</p>
            </div>
          ) : (
            <>
              {/* Score & Summary Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-emerald-500 text-white font-black text-2xl shadow-lg shrink-0">
                    {suggestions.overallScore || 90}%
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                      <Award className="w-5 h-5 text-amber-500" />
                      درجة الجاهزية المهنية
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-md">
                      {suggestions.overallSummary || 'سيرتك الذاتية ممتازة وتحتوي على هيكلية واضحة، وإليك أهم التوصيات لرفع القبول لأقصى مستوى.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Strengths Section */}
              {suggestions.strengths && suggestions.strengths.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    نقاط القوة الحالية في سيرتك الذاتية
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {suggestions.strengths.map((item, idx) => (
                      <div key={idx} className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations Section */}
              {suggestions.recommendations && suggestions.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                    توصيات وفرص التحسين والتطوير
                  </h4>
                  <div className="space-y-2">
                    {suggestions.recommendations.map((rec, idx) => (
                      <div key={idx} className="p-3.5 bg-amber-50/50 border border-amber-200/70 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
                        <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-bold text-amber-900 block">{rec.title || `توصية #${idx + 1}`}</span>
                          <span className="text-slate-700 leading-relaxed block">{rec.description || rec}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Keywords */}
              {suggestions.suggestedKeywords && suggestions.suggestedKeywords.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    كلمات مفتاحية يُنصح بإضافتها (ATS Keywords) - اضغط للإضافة المباشرة:
                  </h4>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {suggestions.suggestedKeywords.map((kw, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => handleKwClick(kw)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 shadow-sm ${
                          appliedKws[kw] 
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-800' 
                            : 'bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-800'
                        }`}
                      >
                        {appliedKws[kw] ? (
                          <><Check className="w-3.5 h-3.5 text-emerald-600" /> <span>{kw} (تمت الإضافة)</span></>
                        ) : (
                          <><Plus className="w-3.5 h-3.5 text-teal-600" /> <span>+ {kw}</span></>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhanced Experience Examples */}
              {suggestions.enhancedExperiences && suggestions.enhancedExperiences.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-emerald-600" />
                    مقترحات صياغة احترافية بالأرقام والأثر
                  </h4>
                  <div className="space-y-3">
                    {suggestions.enhancedExperiences.map((item, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                        <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium border-b border-slate-200 pb-1.5">
                          <span>{item.originalTitle || `خبرة #${idx + 1}`}</span>
                          <span className="text-emerald-700 font-semibold">صياغة محسنة ومقترحة ✨</span>
                        </div>
                        <p className="text-slate-800 font-medium leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/80">
                          {item.suggestedText}
                        </p>
                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={() => handleExpClick(idx, item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm ${
                              appliedExps[idx]
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {appliedExps[idx] ? (
                              <><Check className="w-3.5 h-3.5 text-emerald-600" /> <span>تم تطبيق الصياغة في السيرة الذاتية</span></>
                            ) : (
                              <><Sparkles className="w-3.5 h-3.5" /> <span>تطبيق هذه الصياغة في السيرة الذاتية</span></>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}
