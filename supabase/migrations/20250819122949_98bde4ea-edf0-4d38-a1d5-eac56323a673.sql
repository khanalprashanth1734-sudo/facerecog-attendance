-- Update the students table to add face descriptor storage
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS face_descriptor_json TEXT;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE sql 
SECURITY DEFINER 
STABLE
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Update attendance_records RLS to require admin role for insert/update/delete
DROP POLICY IF EXISTS "Authenticated users can insert attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Authenticated users can update attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Authenticated users can delete attendance records" ON attendance_records;

CREATE POLICY "Admins can insert attendance records" 
ON attendance_records FOR INSERT 
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update attendance records" 
ON attendance_records FOR UPDATE 
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete attendance records" 
ON attendance_records FOR DELETE 
USING (public.get_current_user_role() = 'admin');

-- Update students RLS to require admin role for insert/update/delete
DROP POLICY IF EXISTS "Authenticated users can insert students" ON students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON students;

CREATE POLICY "Admins can insert students" 
ON students FOR INSERT 
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update students" 
ON students FOR UPDATE 
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete students" 
ON students FOR DELETE 
USING (public.get_current_user_role() = 'admin');