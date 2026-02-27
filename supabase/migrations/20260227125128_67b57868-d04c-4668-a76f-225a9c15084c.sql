
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  diet_goal TEXT DEFAULT 'weight-loss',
  restrictions TEXT[] DEFAULT '{}',
  age INTEGER DEFAULT 25,
  weight NUMERIC DEFAULT 70,
  height NUMERIC DEFAULT 170,
  gender TEXT DEFAULT 'male',
  activity_level TEXT DEFAULT 'moderate',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create grocery items table
CREATE TABLE public.grocery_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  checked BOOLEAN DEFAULT false,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own grocery items" ON public.grocery_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own grocery items" ON public.grocery_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own grocery items" ON public.grocery_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own grocery items" ON public.grocery_items FOR DELETE USING (auth.uid() = user_id);

-- Create fitness plans table
CREATE TABLE public.fitness_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fitness_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fitness plans" ON public.fitness_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fitness plans" ON public.fitness_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own fitness plans" ON public.fitness_plans FOR DELETE USING (auth.uid() = user_id);

-- Create BMI records table
CREATE TABLE public.bmi_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight NUMERIC NOT NULL,
  height NUMERIC NOT NULL,
  bmi NUMERIC NOT NULL,
  category TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bmi_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own BMI records" ON public.bmi_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own BMI records" ON public.bmi_records FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
