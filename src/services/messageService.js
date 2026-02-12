import { supabase } from '../config/supabase';
import { getSignedImageUrl } from './storageService';

const toGiftedMessage = async (message, senderMap) => {
  const sender = senderMap.get(message.sender_id) ?? {};
  const imageUrl = message.image_url ? await getSignedImageUrl(message.image_url) : '';

  return {
    _id: message.id,
    text: message.text ?? '',
    image: imageUrl,
    createdAt: new Date(message.created_at),
    user: {
      _id: message.sender_id,
      name: sender.name ?? sender.email ?? 'Unknown',
      avatar: sender.avatar_url ?? 'https://i.pravatar.cc/300',
    },
    sent: true,
    received: true,
  };
};

export const listMessages = async (chatId) => {
  const { data: rawMessages, error: messagesError } = await supabase
    .from('messages')
    .select('id,chat_id,sender_id,text,image_url,created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false });

  if (messagesError) throw messagesError;

  const senderIds = [...new Set((rawMessages ?? []).map((m) => m.sender_id))];

  const senderMap = new Map();
  if (senderIds.length) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id,name,email,avatar_url')
      .in('id', senderIds);

    if (profilesError) throw profilesError;

    (profiles ?? []).forEach((profile) => senderMap.set(profile.id, profile));
  }

  return Promise.all((rawMessages ?? []).map((message) => toGiftedMessage(message, senderMap)));
};

export const sendMessage = async ({ chatId, senderId, text = '', imagePath = null }) => {
  const { error } = await supabase.from('messages').insert({
    chat_id: chatId,
    sender_id: senderId,
    text,
    image_url: imagePath,
  });

  if (error) throw error;

  const { error: chatError } = await supabase
    .from('chats')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', chatId);

  if (chatError) throw chatError;
};

export const subscribeToMessages = (chatId, onEvent) => {
  const channel = supabase
    .channel(`messages-${chatId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
      () => onEvent()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
