import React, { useState, useEffect } from 'react';
import { X, FileText, Trash2, Calendar, Eye, Loader2, AlertCircle } from 'lucide-react';
import { fetchUserCvs, deleteUserCv } from './supabaseClient';

export default function SavedCvsModal({ isOpen, onClose, onLoadCv }) {
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCvs();
    }
  }, [isOpen]);

  const loadCvs = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await fetchUserCvs();
      setCvs(data);
    } catch (err) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء تحميل السير الذاتية المحفوظة');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('هل أنت تأكد من رغبتك في حذف هذه السيرة الذاتية؟')) return;
    setDeletingId(id);
    try {
      await deleteUserCv(id);
      setCvs(cvs.filter(cv => cv.id !== id));
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الحذف');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-right relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">سيري الذاتية المحفوظة</h2>
              <p className="text-xs text-emerald-100 mt-0.5">استعرض سيرك الذاتية المحفوظة في حسابك وحملها أو عدلها</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm font-medium">جاري تحميل السير الذاتية...</p>
            </div>
          ) : cvs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700 mb-1">لا توجد سير ذاتية محفوظة بعد</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                قم بتعبئة بياناتك واستخراج سيرتك الذاتية ثم اضغط على "حفظ في حسابي" لتصل إليها هنا في أي وقت.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cvs.map((cv) => (
                <div 
                  key={cv.id}
                  className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg hover:border-emerald-500/50 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-bold text-slate-800 text-base line-clamp-1">{cv.title}</h4>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                        {cv.template}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-3 line-clamp-1">
                      {cv.user_data?.personalInfo?.fullName || 'بدون اسم'} - {cv.user_data?.personalInfo?.title || ''}
                    </p>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(cv.created_at).toLocaleDateString('ar-SA')}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        onLoadCv(cv);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      عرض وتعديل
                    </button>

                    <button
                      onClick={(e) => handleDelete(cv.id, e)}
                      disabled={deletingId === cv.id}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="حذف"
                    >
                      {deletingId === cv.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
