
DROP POLICY IF EXISTS "Authenticated users can insert ratings" ON public.ratings;
CREATE POLICY "Authenticated users can insert ratings" ON public.ratings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text OR user_id = 'anonymous');
