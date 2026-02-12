import { supabase } from '../config/supabase';

export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

export const onAuthStateChange = (callback) => {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session ?? null);
  });

  return () => data.subscription.unsubscribe();
};

export const signInWithPassword = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signUpWithPassword = async ({ email, password, name }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    const messageParts = [error.message];
    if (error.status) messageParts.push(`status: ${error.status}`);
    if (error.code) messageParts.push(`code: ${error.code}`);
    throw new Error(messageParts.join(' | '));
  }

  if (data.user) {
    await upsertProfile({
      id: data.user.id,
      email: data.user.email,
      name,
      about: 'Available',
    });
  }

  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getProfileById = async (id) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
};

export const upsertProfile = async (profile) => {
  const { error } = await supabase.from('profiles').upsert(profile);
  if (error) throw error;
};

export const deleteAccount = async () => {
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) throw error;
};
