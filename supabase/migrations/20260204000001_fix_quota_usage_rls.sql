-- Fix quota_usage RLS policies
-- The existing policies were too restrictive and blocked INSERTs

-- Drop existing policies
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON quota_usage;
DROP POLICY IF EXISTS "Allow select for authenticated users" ON quota_usage;
DROP POLICY IF EXISTS "Allow update quota usage" ON quota_usage;

-- Enable RLS
ALTER TABLE quota_usage ENABLE ROW LEVEL SECURITY;

-- Create new permissive policies
-- INSERT policy: Allow all inserts
CREATE POLICY "Allow insert quota usage"
ON quota_usage
FOR INSERT
WITH CHECK (true);

-- SELECT policy: Allow all selects
CREATE POLICY "Allow select quota usage"
ON quota_usage
FOR SELECT
USING (true);

-- UPDATE policy: Allow all updates
CREATE POLICY "Allow update quota usage"
ON quota_usage
FOR UPDATE
USING (true)
WITH CHECK (true);
