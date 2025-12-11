-- 1. Add image_url column to workers table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workers' AND column_name = 'image_url') THEN
        ALTER TABLE workers ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- 2. Create 'images' bucket if it doesn't exist
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('images', 'images', true)
    ON CONFLICT (id) DO NOTHING;
END $$;

-- 3. Add policies for the 'images' bucket
-- FIX: We are removing the 'authenticated' check to allow uploads even if 
-- the user is in "Test Mode" (anon) or if auth is bypassed.

-- Allow public read access (SELECT)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'images' );

-- Allow public upload access (INSERT) - REMOVED auth.role() check
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;

CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'images' );

-- Allow public update access (UPDATE)
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;

CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'images' );

-- Allow public delete access (DELETE)
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'images' );
