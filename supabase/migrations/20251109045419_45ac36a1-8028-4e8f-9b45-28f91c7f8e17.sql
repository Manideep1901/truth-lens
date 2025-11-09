-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create detections table for storing upload history
CREATE TABLE public.detections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_real BOOLEAN NOT NULL,
  prediction_score DECIMAL(5,2) NOT NULL,
  user_review TEXT,
  image_url TEXT NOT NULL,
  CONSTRAINT prediction_score_range CHECK (prediction_score >= 0 AND prediction_score <= 100)
);

-- Enable Row Level Security
ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;

-- Detections policies
CREATE POLICY "Users can view their own detections"
  ON public.detections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own detections"
  ON public.detections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own detections"
  ON public.detections
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own detections"
  ON public.detections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for detection images
INSERT INTO storage.buckets (id, name, public)
VALUES ('detections', 'detections', true);

-- Storage policies for detections bucket
CREATE POLICY "Users can upload their own detection images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'detections' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own detection images"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'detections' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can view detection images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'detections');