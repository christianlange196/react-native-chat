import { supabase } from '../config/supabase';

const mapMessagePreview = (message) => {
  if (!message) return 'No messages yet';
  if (message.image_url) return 'sent an image';
  if (!message.text) return 'No messages yet';
  return message.text.length > 20 ? `${message.text.substring(0, 20)}...` : message.text;
};

export const listProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,name,about,avatar_url')
    .order('name', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data ?? [];
};

export const createOrGetDirectChat = async (otherUserId) => {
  const { data, error } = await supabase.rpc('create_direct_chat', { other_user_id: otherUserId });
  if (error) throw error;
  return data;
};

export const createGroupChat = async (groupName, memberIds) => {
  const { data, error } = await supabase.rpc('create_group_chat', {
    group_name: groupName,
    member_ids: memberIds,
  });

  if (error) throw error;
  return data;
};

export const softDeleteChatForUser = async (chatId) => {
  const { error } = await supabase.rpc('soft_delete_chat_for_user', { chat_id: chatId });
  if (error) throw error;
};

export const getChatInfo = async (chatId) => {
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .select('id,group_name,created_by,created_at,updated_at')
    .eq('id', chatId)
    .single();

  if (chatError) throw chatError;

  const { data: members, error: membersError } = await supabase
    .from('chat_members')
    .select('user_id,role,deleted_at,profiles(id,email,name,about,avatar_url)')
    .eq('chat_id', chatId)
    .is('deleted_at', null);

  if (membersError) throw membersError;

  return {
    chat,
    members: (members ?? []).map((member) => ({ ...member.profiles, role: member.role })),
  };
};

export const listChatsForUser = async (userId) => {
  const { data: memberships, error: membershipError } = await supabase
    .from('chat_members')
    .select('chat_id')
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (membershipError) throw membershipError;

  const chatIds = (memberships ?? []).map((m) => m.chat_id);
  if (!chatIds.length) return [];

  const { data: chats, error: chatError } = await supabase
    .from('chats')
    .select('id,group_name,created_by,created_at,updated_at')
    .in('id', chatIds)
    .order('updated_at', { ascending: false });

  if (chatError) throw chatError;

  const { data: members, error: membersError } = await supabase
    .from('chat_members')
    .select('chat_id,user_id,deleted_at,profiles(id,email,name,avatar_url)')
    .in('chat_id', chatIds)
    .is('deleted_at', null);

  if (membersError) throw membersError;

  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('id,chat_id,sender_id,text,image_url,created_at')
    .in('chat_id', chatIds)
    .order('created_at', { ascending: false });

  if (messagesError) throw messagesError;

  const messagesByChat = new Map();
  (messages ?? []).forEach((message) => {
    if (!messagesByChat.has(message.chat_id)) {
      messagesByChat.set(message.chat_id, message);
    }
  });

  const membersByChat = (members ?? []).reduce((acc, member) => {
    const existing = acc.get(member.chat_id) ?? [];
    existing.push(member.profiles);
    acc.set(member.chat_id, existing);
    return acc;
  }, new Map());

  return (chats ?? []).map((chat) => {
    const latestMessage = messagesByChat.get(chat.id) ?? null;
    return {
      id: chat.id,
      groupName: chat.group_name,
      users: membersByChat.get(chat.id) ?? [],
      latestMessage,
      latestMessagePreview: mapMessagePreview(latestMessage),
      lastUpdated: chat.updated_at,
    };
  });
};

export const subscribeToUserChats = (userId, onEvent) => {
  const channel = supabase
    .channel(`chat-members-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'chat_members', filter: `user_id=eq.${userId}` },
      () => onEvent()
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => onEvent())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => onEvent())
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
