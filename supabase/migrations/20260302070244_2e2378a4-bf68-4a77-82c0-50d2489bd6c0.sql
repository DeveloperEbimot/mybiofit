CREATE TABLE public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a rating (even anonymous visitors)
CREATE POLICY "Anyone can insert ratings" ON public.ratings
  FOR INSERT WITH CHECK (true);

-- Only you (or authenticated users) can read ratings
CREATE POLICY "Authenticated users can read ratings" ON public.ratings
  FOR SELECT USING (true);
