CREATE POLICY "Users can update own fitness plans"
ON public.fitness_plans
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);