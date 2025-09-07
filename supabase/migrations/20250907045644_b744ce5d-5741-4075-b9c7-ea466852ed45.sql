-- Fix security warnings by properly setting search_path for all functions

-- Update get_face_descriptors_for_recognition function with proper search_path
CREATE OR REPLACE FUNCTION public.get_face_descriptors_for_recognition()
RETURNS TABLE(
  id uuid,
  face_descriptor_json text
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only return face descriptors, no personal information
  RETURN QUERY
  SELECT s.id, s.face_descriptor_json
  FROM public.students s
  WHERE s.face_descriptor_json IS NOT NULL;
END;
$$;

-- Update get_student_basic_info function with proper search_path
CREATE OR REPLACE FUNCTION public.get_student_basic_info(student_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  class text
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;