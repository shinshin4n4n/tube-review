-- Enable Row Level Security on reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view non-deleted reviews
CREATE POLICY "reviews_select_active" ON reviews
  FOR SELECT
  USING (deleted_at IS NULL);

-- Policy: Authenticated users can insert their own reviews
CREATE POLICY "reviews_insert_own" ON reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reviews
CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete (soft delete) their own reviews
CREATE POLICY "reviews_delete_own" ON reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comment on table and policies
COMMENT ON TABLE reviews IS 'User reviews for YouTube channels with RLS enabled';
COMMENT ON POLICY "reviews_select_active" ON reviews IS 'Anyone can view active (non-deleted) reviews';
COMMENT ON POLICY "reviews_insert_own" ON reviews IS 'Authenticated users can create reviews for themselves';
COMMENT ON POLICY "reviews_update_own" ON reviews IS 'Users can update their own reviews';
COMMENT ON POLICY "reviews_delete_own" ON reviews IS 'Users can delete their own reviews';
