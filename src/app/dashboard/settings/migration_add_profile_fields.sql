-- Add columns to profiles table if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS shop_name text,
ADD COLUMN IF NOT EXISTS shop_type text,
ADD COLUMN IF NOT EXISTS theme_preference text DEFAULT 'classic';

-- Ensure RLS allows users to read and update their own profile
create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );
  
create policy "Users can read own profile"
  on profiles for select
  using ( auth.uid() = id );
