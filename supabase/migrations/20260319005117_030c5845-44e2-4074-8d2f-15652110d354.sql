CREATE TABLE public.pwa_installs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installed_at timestamp with time zone NOT NULL DEFAULT now(),
  user_agent text,
  platform text
);

ALTER TABLE public.pwa_installs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert pwa installs"
  ON public.pwa_installs FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read pwa installs"
  ON public.pwa_installs FOR SELECT
  TO public
  USING (true);