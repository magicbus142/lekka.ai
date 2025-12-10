-- 1. Create Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'My Shop',
  owner_id UUID, -- References auth.users(id)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Members Table
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID, -- References auth.users(id)
  role TEXT CHECK (role IN ('owner', 'admin', 'staff', 'viewer')) DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(organization_id, user_id)
);

-- 3. Add organization_id to existing data tables
ALTER TABLE products ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- 4. Backfill Data
-- Create an organization for every unique user found in the products table
DO $$
DECLARE
  rec RECORD;
  new_org_id UUID;
BEGIN
  -- Loop through all unique users currently in products
  FOR rec IN SELECT DISTINCT user_id FROM products WHERE organization_id IS NULL AND user_id IS NOT NULL
  LOOP
    -- Create generic Org
    INSERT INTO organizations (name, owner_id) 
    VALUES ('My Shop', rec.user_id) 
    RETURNING id INTO new_org_id;

    -- Add User as Owner
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (new_org_id, rec.user_id, 'owner');

    -- Update Owner's Data
    UPDATE products SET organization_id = new_org_id WHERE user_id = rec.user_id;
    UPDATE workers SET organization_id = new_org_id WHERE user_id = rec.user_id;
    UPDATE transactions SET organization_id = new_org_id WHERE user_id = rec.user_id;
  END LOOP;
  
  -- Also handle users who might have transactions but no products (edge case)
  FOR rec IN SELECT DISTINCT user_id FROM transactions WHERE organization_id IS NULL AND user_id IS NOT NULL
  LOOP
     -- Check if we already made an org for them (in case they weren't in products loop)
     IF NOT EXISTS (SELECT 1 FROM organizations WHERE owner_id = rec.user_id) THEN
        INSERT INTO organizations (name, owner_id) VALUES ('My Shop', rec.user_id) RETURNING id INTO new_org_id;
        INSERT INTO organization_members (organization_id, user_id, role) VALUES (new_org_id, rec.user_id, 'owner');
        UPDATE products SET organization_id = new_org_id WHERE user_id = rec.user_id;
        UPDATE workers SET organization_id = new_org_id WHERE user_id = rec.user_id;
        UPDATE transactions SET organization_id = new_org_id WHERE user_id = rec.user_id;
     ELSE
        -- Just update the transactions if org exists
        UPDATE transactions SET organization_id = (SELECT id FROM organizations WHERE owner_id = rec.user_id LIMIT 1) 
        WHERE user_id = rec.user_id;
     END IF;
  END LOOP;
END $$;

-- 5. Enable RLS on New Tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Organizations: Visible to members
CREATE POLICY "Members can view organizations" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Members: Visible to members of same org
CREATE POLICY "Members can view other members" ON organization_members
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- (Simplified) Allow Insert if authenticated (to create first org)
CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
  
CREATE POLICY "Owners can add members" ON organization_members
  FOR INSERT WITH CHECK (
    organization_id IN (
       SELECT organization_id FROM organization_members 
       WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

