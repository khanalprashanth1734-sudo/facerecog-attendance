-- Fix security issue: Restrict student biometric data access to admins only
-- Replace the overly permissive SELECT policy with admin-only access

DROP POLICY IF EXISTS "Authenticated users can view students" ON public.students;

CREATE POLICY "Only admins can view students" 
ON public.students 
FOR SELECT 
USING (get_current_user_role() = 'admin'::text);