
-- 1. Add missing UPDATE and DELETE policies to bmi_records
CREATE POLICY "Users can update own BMI records"
ON public.bmi_records
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own BMI records"
ON public.bmi_records
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 2. Fix pwa_installs: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can read pwa installs" ON public.pwa_installs;
CREATE POLICY "Authenticated users can read pwa installs"
ON public.pwa_installs
FOR SELECT
TO authenticated
USING (true);

-- 3. Fix ratings: replace permissive INSERT with authenticated-only
DROP POLICY IF EXISTS "Anyone can insert ratings" ON public.ratings;
CREATE POLICY "Authenticated users can insert ratings"
ON public.ratings
FOR INSERT
TO authenticated
WITH CHECK (true);
