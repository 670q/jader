import React, { useState } from 'react';
import { X, LogIn, UserPlus, Mail, Lock, User, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { signInUser, signUpUser } from './supabaseClient';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          throw new Error('يرجى إدخال الاسم الكامل');
        }
        await signUpUser(email, password, fullName);
        setSuccessMsg('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
        setIsSignUp(false);
      } else {
        const data = await signInUser(email, password);
        setSuccessMsg('تم تسجيل الدخول بنجاح!');
        setTimeout(() => {
          onAuthSuccess(data.user);
          onClose();
        }, 500);
      }
    } catch (err) {
      console.error('Auth error:', err);
      let msg = err.message || 'حدث خطأ في عملية التوثيق';
      if (msg.includes('Invalid login credentials')) {
        msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      } else if (msg.includes('User already registered')) {
        msg = 'هذا البريد الإلكتروني مسجل بالفعل';
      } else if (msg.includes('Password should be at least')) {
        msg = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-right relative">
          <button 
            onClick={onClose}
            className="absolute left-4 top-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              {isSignUp ? <UserPlus className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {isSignUp ? 'إنشاء حساب جديد في جدير' : 'تسجيل الدخول إلى جدير'}
              </h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                {isSignUp ? 'أنشئ حسابك لحفظ سيرتك الذاتية والوصول إليها في أي وقت' : 'مرحباً بك مجدداً! ادخل بياناتك للوصول لحسابك'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الاسم الكامل</label>
              <div className="relative">
                <User className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="أدخل اسمك الكامل"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pr-9 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                placeholder="example@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pr-9 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-left"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">كلمة المرور</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-9 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-left"
                dir="ltr"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" />
                إنشاء الحساب
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                تسجيل الدخول
              </>
            )}
          </button>

          {/* Toggle between Login and Signup */}
          <div className="pt-2 text-center border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              {isSignUp ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'ليس لديك حساب؟ إنشاء حساب جديد'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
