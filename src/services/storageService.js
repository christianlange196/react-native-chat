import { supabase } from '../config/supabase';

const CHAT_MEDIA_BUCKET = 'chat-media';

export const uploadChatImage = async ({ chatId, userId, uri }) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const extension = uri.split('.').pop() || 'jpg';
  const filePath = `${chatId}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const { error } = await supabase.storage.from(CHAT_MEDIA_BUCKET).upload(filePath, blob, {
    upsert: false,
    contentType: blob.type || 'image/jpeg',
  });

  if (error) throw error;
  return filePath;
};

export const getSignedImageUrl = async (filePath) => {
  const { data, error } = await supabase.storage
    .from(CHAT_MEDIA_BUCKET)
    .createSignedUrl(filePath, 60 * 60);

  if (error) {
    return '';
  }

  return data?.signedUrl ?? '';
};
