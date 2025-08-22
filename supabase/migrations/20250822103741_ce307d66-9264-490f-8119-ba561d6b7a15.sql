-- Create a secure function that only returns face descriptors for facial recognition
-- This allows attendance system to work without exposing student personal info
CREATE OR REPLACE FUNCTION public.get_face_descriptors_for_recognition()
RETURNS TABLE(
  id uuid,
  face_descriptor_json text
) AS $$
BEGIN
  -- Only return face descriptors, no personal information
  RETURN QUERY
  SELECT s.id, s.face_descriptor_json
  FROM public.students s
  WHERE s.face_descriptor_json IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create teacher role support
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(role, 'user') FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$function$;

-- Update attendance records policies to be more restrictive
DROP POLICY IF EXISTS "Authenticated users can view attendance records" ON public.attendance_records;

-- Only admins and teachers can view attendance records
CREATE POLICY "Admins and teachers can view attendance records" 
ON public.attendance_records 
FOR SELECT 
USING (get_current_user_role() IN ('admin', 'teacher'));

-- Only admins and teachers can insert attendance records
DROP POLICY IF EXISTS "Admins can insert attendance records" ON public.attendance_records;
CREATE POLICY "Admins and teachers can insert attendance records" 
ON public.attendance_records 
FOR INSERT 
WITH CHECK (get_current_user_role() IN ('admin', 'teacher'));

-- Only admins and teachers can update attendance records
DROP POLICY IF EXISTS "Admins can update attendance records" ON public.attendance_records;
CREATE POLICY "Admins and teachers can update attendance records" 
ON public.attendance_records 
FOR UPDATE 
USING (get_current_user_role() IN ('admin', 'teacher'));

-- Only admins can delete attendance records (teachers shouldn't delete)
DROP POLICY IF EXISTS "Admins can delete attendance records" ON public.attendance_records;
CREATE POLICY "Only admins can delete attendance records" 
ON public.attendance_records 
FOR DELETE 
USING (get_current_user_role() = 'admin');

-- Create a secure function to get student info by ID (for after face recognition)
CREATE OR REPLACE FUNCTION public.get_student_basic_info(student_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  class text
) AS $$
BEGIN
  -- Only return basic info after student is identified
  -- This function can only be called by admins and teachers
  IF get_current_user_role() NOT IN ('admin', 'teacher') THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT s.id, s.name, s.class
  FROM public.students s
  WHERE s.id = student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update late_comers policies to match attendance_records
DROP POLICY IF EXISTS "Authenticated users can view late comers" ON public.late_comers;
CREATE POLICY "Admins and teachers can view late comers" 
ON public.late_comers 
FOR SELECT 
USING (get_current_user_role() IN ('admin', 'teacher'));

DROP POLICY IF EXISTS "Admins can insert late comers" ON public.late_comers;
CREATE POLICY "Admins and teachers can insert late comers" 
ON public.late_comers 
FOR INSERT 
WITH CHECK (get_current_user_role() IN ('admin', 'teacher'));

DROP POLICY IF EXISTS "Admins can update late comers" ON public.late_comers;
CREATE POLICY "Admins and teachers can update late comers" 
ON public.late_comers 
FOR UPDATE 
USING (get_current_user_role() IN ('admin', 'teacher'));

DROP POLICY IF EXISTS "Admins can delete late comers" ON public.late_comers;
CREATE POLICY "Only admins can delete late comers" 
ON public.late_comers 
FOR DELETE 
USING (get_current_user_role() = 'admin');