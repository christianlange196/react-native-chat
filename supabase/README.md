# Supabase Backend Setup

1. Run migration file `supabase/migrations/20260212_initial_chat_schema.sql` in your Supabase SQL editor.
2. Enable Realtime for tables: `chats`, `chat_members`, `messages`.
3. Create storage bucket `chat-media`.
4. Apply bucket policies so authenticated chat members can read/write object paths.
5. Deploy edge function:
   - `supabase functions deploy delete-account`
6. Configure function secrets:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
