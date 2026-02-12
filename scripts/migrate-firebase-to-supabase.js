/*
  One-time migration scaffold: Firebase -> Supabase

  Usage (after filling placeholders):
  node scripts/migrate-firebase-to-supabase.js
*/

const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

const firebaseServiceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!firebaseServiceAccountPath || !supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing required env vars: FIREBASE_SERVICE_ACCOUNT_PATH, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
  );
}

const serviceAccount = require(firebaseServiceAccountPath);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const firestore = admin.firestore();
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const normalizeTimestamp = (input) => {
  if (!input) return new Date().toISOString();
  if (typeof input === 'number') return new Date(input).toISOString();
  if (input.toDate) return input.toDate().toISOString();
  return new Date(input).toISOString();
};

async function migrateUsers() {
  const snapshot = await firestore.collection('users').get();
  for (const doc of snapshot.docs) {
    const row = doc.data();
    if (!row.id) continue;

    const { error } = await supabase.from('profiles').upsert({
      id: row.id,
      email: row.email,
      name: row.name || row.email,
      about: row.about || 'Available',
    });

    if (error) {
      console.error('Failed profile upsert', row.email, error.message);
    }
  }
}

async function migrateChatsAndMessages() {
  const chatsSnapshot = await firestore.collection('chats').get();

  for (const chatDoc of chatsSnapshot.docs) {
    const chat = chatDoc.data();
    const chatId = chatDoc.id;

    const members = (chat.users || [])
      .map((u) => u.id)
      .filter(Boolean);

    const createdBy = members[0];
    if (!createdBy) continue;

    const pairKey = !chat.groupName && members.length === 2
      ? [members[0], members[1]].sort().join(':')
      : null;

    const { error: chatError } = await supabase.from('chats').upsert({
      id: chatId,
      group_name: chat.groupName || '',
      created_by: createdBy,
      direct_pair_key: pairKey,
      updated_at: normalizeTimestamp(chat.lastUpdated),
    });

    if (chatError) {
      console.error('Failed chat upsert', chatId, chatError.message);
      continue;
    }

    for (const member of chat.users || []) {
      const { error: memberError } = await supabase.from('chat_members').upsert({
        chat_id: chatId,
        user_id: member.id,
        role: 'member',
        deleted_at: member.deletedFromChat ? new Date().toISOString() : null,
      });

      if (memberError) {
        console.error('Failed chat member upsert', chatId, member.id, memberError.message);
      }
    }

    for (const message of chat.messages || []) {
      const { error: messageError } = await supabase.from('messages').insert({
        id: message._id,
        chat_id: chatId,
        sender_id: message.user?._id,
        text: message.text || '',
        image_url: message.image || null,
        created_at: normalizeTimestamp(message.createdAt),
      });

      if (messageError) {
        console.error('Failed message insert', message._id, messageError.message);
      }
    }
  }
}

(async () => {
  try {
    await migrateUsers();
    await migrateChatsAndMessages();
    console.log('Migration completed');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
