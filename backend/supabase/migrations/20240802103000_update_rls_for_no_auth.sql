-- Disable RLS temporarily to modify policies that might depend on each other
ALTER TABLE public.devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE threads DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs DISABLE ROW LEVEL SECURITY;

-- Replace policies for public.devices
DROP POLICY IF EXISTS "Account members can delete their own devices" ON public.devices;
CREATE POLICY "Allow public delete on devices" ON public.devices FOR DELETE USING (true);

DROP POLICY IF EXISTS "Account members can insert their own devices" ON public.devices;
CREATE POLICY "Allow public insert on devices" ON public.devices FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Account members can only access their own devices" ON public.devices; -- Drop old ALL policy
DROP POLICY IF EXISTS "Account members can view their own devices" ON public.devices; -- Drop old SELECT policy
CREATE POLICY "Allow public select on devices" ON public.devices FOR SELECT USING (true);

DROP POLICY IF EXISTS "Account members can update their own devices" ON public.devices;
CREATE POLICY "Allow public update on devices" ON public.devices FOR UPDATE USING (true) WITH CHECK (true);

-- Replace policies for public.recordings
DROP POLICY IF EXISTS "Account members can delete their own recordings" ON public.recordings;
CREATE POLICY "Allow public delete on recordings" ON public.recordings FOR DELETE USING (true);

DROP POLICY IF EXISTS "Account members can insert their own recordings" ON public.recordings;
CREATE POLICY "Allow public insert on recordings" ON public.recordings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Account members can only access their own recordings" ON public.recordings; -- Drop old ALL policy
DROP POLICY IF EXISTS "Account members can view their own recordings" ON public.recordings; -- Drop old SELECT policy
CREATE POLICY "Allow public select on recordings" ON public.recordings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Account members can update their own recordings" ON public.recordings;
CREATE POLICY "Allow public update on recordings" ON public.recordings FOR UPDATE USING (true) WITH CHECK (true);

-- Replace policies for storage.objects in the 'recordings' bucket
DROP POLICY IF EXISTS "Account members can select recording files" ON storage.objects;
DROP POLICY IF EXISTS "Account members can insert recording files" ON storage.objects;
DROP POLICY IF EXISTS "Account members can update recording files" ON storage.objects;
DROP POLICY IF EXISTS "Account members can delete recording files" ON storage.objects;

CREATE POLICY "Public select on recordings bucket" ON storage.objects FOR SELECT USING (bucket_id = 'recordings');
CREATE POLICY "Public insert on recordings bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'recordings');
CREATE POLICY "Public update on recordings bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'recordings');
CREATE POLICY "Public delete on recordings bucket" ON storage.objects FOR DELETE USING (bucket_id = 'recordings');

-- Replace policies for projects
DROP POLICY IF EXISTS project_select_policy ON projects;
CREATE POLICY project_select_policy ON projects FOR SELECT USING (true);

DROP POLICY IF EXISTS project_insert_policy ON projects;
CREATE POLICY project_insert_policy ON projects FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS project_update_policy ON projects;
CREATE POLICY project_update_policy ON projects FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS project_delete_policy ON projects;
CREATE POLICY project_delete_policy ON projects FOR DELETE USING (true);

-- Replace policies for threads
DROP POLICY IF EXISTS thread_select_policy ON threads;
CREATE POLICY thread_select_policy ON threads FOR SELECT USING (true);

DROP POLICY IF EXISTS thread_insert_policy ON threads;
CREATE POLICY thread_insert_policy ON threads FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS thread_update_policy ON threads;
CREATE POLICY thread_update_policy ON threads FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS thread_delete_policy ON threads;
CREATE POLICY thread_delete_policy ON threads FOR DELETE USING (true);

-- Replace policies for agent_runs
DROP POLICY IF EXISTS agent_run_select_policy ON agent_runs;
CREATE POLICY agent_run_select_policy ON agent_runs FOR SELECT USING (true);

DROP POLICY IF EXISTS agent_run_insert_policy ON agent_runs;
CREATE POLICY agent_run_insert_policy ON agent_runs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS agent_run_update_policy ON agent_runs;
CREATE POLICY agent_run_update_policy ON agent_runs FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS agent_run_delete_policy ON agent_runs;
CREATE POLICY agent_run_delete_policy ON agent_runs FOR DELETE USING (true);

-- Replace policies for messages
DROP POLICY IF EXISTS message_select_policy ON messages;
CREATE POLICY message_select_policy ON messages FOR SELECT USING (true);

DROP POLICY IF EXISTS message_insert_policy ON messages;
CREATE POLICY message_insert_policy ON messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS message_update_policy ON messages;
CREATE POLICY message_update_policy ON messages FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS message_delete_policy ON messages;
CREATE POLICY message_delete_policy ON messages FOR DELETE USING (true);

-- Re-enable RLS on all affected tables
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY; 