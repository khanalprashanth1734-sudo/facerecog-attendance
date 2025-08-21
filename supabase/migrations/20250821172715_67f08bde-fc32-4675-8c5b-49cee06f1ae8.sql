-- Add absent_count column to attendance_records
ALTER TABLE public.attendance_records ADD COLUMN absent_count integer DEFAULT 0;

-- Create a function to check and mark absences for all students daily
CREATE OR REPLACE FUNCTION public.mark_daily_absences()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  student_record RECORD;
  today_date date;
  attendance_exists boolean;
  current_absent_count integer;
BEGIN
  today_date := CURRENT_DATE;
  
  -- Loop through all students
  FOR student_record IN 
    SELECT id, name, class FROM students
  LOOP
    -- Check if student has attendance for today
    SELECT EXISTS(
      SELECT 1 FROM attendance_records 
      WHERE student_id = student_record.id 
      AND DATE(created_at) = today_date
    ) INTO attendance_exists;
    
    -- If no attendance record exists for today, mark as absent
    IF NOT attendance_exists THEN
      -- Get current absent count for this student
      SELECT COALESCE(MAX(absent_count), 0) INTO current_absent_count
      FROM attendance_records
      WHERE student_name = student_record.name;
      
      -- Insert absence record
      INSERT INTO attendance_records (
        student_id,
        student_name, 
        student_class,
        status,
        is_late,
        late_count,
        absent_count,
        confidence
      ) VALUES (
        student_record.id,
        student_record.name,
        student_record.class,
        'absent',
        false,
        0,
        current_absent_count + 1,
        0
      );
    END IF;
  END LOOP;
END;
$$;