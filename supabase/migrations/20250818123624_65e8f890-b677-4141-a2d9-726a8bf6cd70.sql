-- Create profiles table for user authentication
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for profiles - users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for profiles - users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policy for profiles - users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  class TEXT NOT NULL CHECK (class IN ('1 CEBA - A', '1 CEBA - B', '2 CEBA', '1 PCMC', '2 PCMC', '1 PCMB', '2 PCMB')),
  face_descriptor TEXT,
  registered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create policy for students - authenticated users can view all students
CREATE POLICY "Authenticated users can view students" 
ON public.students 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create policy for students - authenticated users can insert students
CREATE POLICY "Authenticated users can insert students" 
ON public.students 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Create policy for students - authenticated users can update students
CREATE POLICY "Authenticated users can update students" 
ON public.students 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create policy for students - authenticated users can delete students
CREATE POLICY "Authenticated users can delete students" 
ON public.students 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create attendance records table
CREATE TABLE public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_class TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confidence NUMERIC(3,2),
  status TEXT NOT NULL DEFAULT 'present',
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on attendance records
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policy for attendance records - authenticated users can view all records
CREATE POLICY "Authenticated users can view attendance records" 
ON public.attendance_records 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create policy for attendance records - authenticated users can insert records
CREATE POLICY "Authenticated users can insert attendance records" 
ON public.attendance_records 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Create policy for attendance records - authenticated users can update records
CREATE POLICY "Authenticated users can update attendance records" 
ON public.attendance_records 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create policy for attendance records - authenticated users can delete records
CREATE POLICY "Authenticated users can delete attendance records" 
ON public.attendance_records 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role)
  VALUES (NEW.id, NEW.email, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();