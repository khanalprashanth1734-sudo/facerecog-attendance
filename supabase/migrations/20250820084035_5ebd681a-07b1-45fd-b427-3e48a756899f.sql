-- Remove the restrictive class check constraint to allow any class value
ALTER TABLE public.students DROP CONSTRAINT students_class_check;