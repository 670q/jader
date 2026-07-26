import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bifwdqwwnqmgwjfddads.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpZndkcXd3bnFtZ3dqZmRkYWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMjAwNDMsImV4cCI6MjEwMDU5NjA0M30.REul1itU24RmSITCxBMI6jD0ZDzEAbeY99kWwVpS2uE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchGeminiApiKey() {
  try {
    const { data, error } = await supabase.rpc('get_gemini_key');
    if (!error && data) {
      return data;
    }
    const { data: tableData, error: tableError } = await supabase
      .from('app_settings')
      .select('key_value')
      .eq('id', 'gemini_api_key')
      .single();
    if (!tableError && tableData?.key_value) {
      return tableData.key_value;
    }
  } catch (err) {
    console.error('Error fetching Gemini API Key from Supabase:', err);
  }
  return '';
}

// --- Auth Helpers ---
export async function signUpUser(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  });
  if (error) throw error;
  return data;
}

export async function signInUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// --- CV Database Helpers ---
export async function saveUserCv({ title, template, language, userData, generatedResult, coverLetter }) {
  const user = await getCurrentUser();
  if (!user) throw new Error('يجب تسجيل الدخول أولاً لحفظ السيرة الذاتية');

  const { data, error } = await supabase
    .from('cvs')
    .insert([
      {
        user_id: user.id,
        title: title || 'سيرة ذاتية جديدة',
        template: template || 'formal',
        language: language || 'ar',
        user_data: userData,
        generated_result: generatedResult,
        cover_letter: coverLetter
      }
    ])
    .select();

  if (error) throw error;
  return data[0];
}

export async function fetchUserCvs() {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('cvs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteUserCv(id) {
  const { error } = await supabase
    .from('cvs')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateUserCv(id, { title, template, language, userData, generatedResult, coverLetter }) {
  const user = await getCurrentUser();
  if (!user) throw new Error('يجب تسجيل الدخول أولاً لتحديث السيرة الذاتية');

  const { data, error } = await supabase
    .from('cvs')
    .update({
      title: title || 'سيرة ذاتية محدثة',
      template: template || 'formal',
      language: language || 'ar',
      user_data: userData,
      generated_result: generatedResult,
      cover_letter: coverLetter,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0];
}

