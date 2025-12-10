-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT CHECK (role IN ('viewer', 'editor', 'admin')) DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admin can do everything (assuming the logged-in user who creates others is an admin, or we just allow authenticated users to read for now)
-- ideally we bootstrap the first user as admin, but for now allow read access to authenticated.

CREATE POLICY "Allow authenticated read access" ON public.user_roles
    FOR SELECT TO authenticated USING (true);

-- Only allow service role (or specific admins) to insert/update used by the API
-- But since we are using Supabase Client on frontend to read, we need policies.
-- For simplicity in this MVP: Allow authenticated users to insert/update (controlled by UI and later backend logic).
-- A better approach is to only allow the `service_role` to modify this table via the API, 
-- BUT if we want real-time updates on frontend without reloading, we might want read access.
-- We'll rely on the API for writes.

-- Note: The API route uses `service_role` key, which bypasses RLS. 
-- So we just need policies for the frontend to READ the list.

