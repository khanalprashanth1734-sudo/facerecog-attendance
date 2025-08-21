-- Add late_count column to attendance_records table
ALTER TABLE public.attendance_records 
ADD COLUMN late_count INTEGER DEFAULT 0;

-- Add is_late column to track if this specific record was late
ALTER TABLE public.attendance_records 
ADD COLUMN is_late BOOLEAN DEFAULT false;

-- Create late_comers table for students with more than 3 late arrivals
CREATE TABLE public.late_comers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  student_class TEXT NOT NULL,
  total_late_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on late_comers table
ALTER TABLE public.late_comers ENABLE ROW LEVEL SECURITY;

-- Create policies for late_comers table
CREATE POLICY "Authenticated users can view late comers" 
ON public.late_comers 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Admins can insert late comers" 
ON public.late_comers 
FOR INSERT 
WITH CHECK (get_current_user_role() = 'admin'::text);

CREATE POLICY "Admins can update late comers" 
ON public.late_comers 
FOR UPDATE 
USING (get_current_user_role() = 'admin'::text);

CREATE POLICY "Admins can delete late comers" 
ON public.late_comers 
FOR DELETE 
USING (get_current_user_role() = 'admin'::text);

-- Add trigger for automatic timestamp updates on late_comers
CREATE TRIGGER update_late_comers_updated_at
BEFORE UPDATE ON public.late_comers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();